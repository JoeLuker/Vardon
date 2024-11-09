import { writable, derived } from 'svelte/store';
import type { Character, CharacterStats } from '$lib/types/character';
import { characterService } from '$lib/services';
import { spells } from './spells';
import { buffs } from './buffs';
import { equipment } from './equipment';
import { skills } from './skills';
import { attributes } from './attributes';
import { combat } from './combat';

interface RootState {
  character: Character | null;
  stats: CharacterStats | null;
  isInitialized: boolean;
  isLoading: boolean;
  errors: string[];
}

function createRootStore() {
  const initialState: RootState = {
    character: null,
    stats: null,
    isInitialized: false,
    isLoading: false,
    errors: []
  };

  const { subscribe, set, update } = writable<RootState>(initialState);

  let currentState: RootState;
  subscribe(state => {
    currentState = state;
  });

  const store = {
    subscribe,
    isReady: derived({ subscribe }, ($state) => $state.isInitialized && !!$state.character),
    errors: derived({ subscribe }, ($state) => $state.errors),
    isLoading: derived({ subscribe }, ($state) => $state.isLoading),
    character: derived({ subscribe }, ($state) => $state.character),

    setLoading: (loading: boolean) => {
      update(s => ({ ...s, isLoading: loading }));
    },

    initialize: (character: Character, stats: CharacterStats) => {
      set({
        character,
        stats,
        isInitialized: true,
        isLoading: false,
        errors: []
      });
    },

    async initializeApp() {
      try {
        this.setLoading(true);
        this.clearErrors();
        
        // Get the first available character ID
        const characterId = await characterService.getFirstCharacterId();
        
        // Load character and stats
        const [character, stats] = await Promise.all([
          characterService.load(characterId),
          characterService.loadStats(characterId)
        ]);
        
        // Initialize root store with character data
        this.initialize(character, stats);

        // Initialize all subsystems
        const initPromises = [
          spells.init(characterId).catch(error => {
            this.addError(`Spells initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }),
          buffs.init(characterId).catch(error => {
            this.addError(`Buffs initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }),
          equipment.init(characterId).catch(error => {
            this.addError(`Equipment initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }),
          skills.init(characterId).catch(error => {
            this.addError(`Skills initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }),
          attributes.init(characterId).catch(error => {
            this.addError(`Attributes initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }),
          combat.init(characterId).catch(error => {
            this.addError(`Combat initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          })
        ];

        // Wait for all initializations to complete
        await Promise.allSettled(initPromises);

        // Check if any critical errors occurred
        if (currentState.errors.length === 0) {
          update(s => ({ ...s, isInitialized: true }));
        }

      } catch (error) {
        this.addError(`Application initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    reset: () => {
      set(initialState);
    },

    addError: (error: string) => {
      update(s => ({
        ...s,
        errors: [...s.errors, error]
      }));
    },

    clearErrors: () => {
      update(s => ({ ...s, errors: [] }));
    },

    async updateCharacter(updates: Partial<Character>) {
      if (!currentState.character) {
        throw new Error('No character loaded');
      }

      try {
        const previousCharacter = currentState.character;
        
        // Update local state first
        update(s => ({
          ...s,
          character: s.character ? { ...s.character, ...updates } : null
        }));

        // Update database
        await characterService.update(previousCharacter.id, updates);
      } catch (error) {
        // Rollback on error
        update(s => ({
          ...s,
          character: currentState.character,
          errors: [...s.errors, `Failed to update character: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }));
        throw error;
      }
    }
  };

  return store;
}

export const rootStore = createRootStore();