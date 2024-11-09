import { characterService } from './character';
import { spells } from '$lib/stores/base/spells';
import { buffs } from '$lib/stores/base/buffs';
import { equipment } from '$lib/stores/base/equipment';
import { skills } from '$lib/stores/base/skills';
import { rootStore } from '$lib/stores/base/root';
import { attributeService } from './attributes';
import { combat } from '$lib/stores/base/combat';
import { db } from './database';

export async function initializeApp() {
  try {
    rootStore.setLoading(true);
    
    // Get character ID first
    const characterId = await characterService.getFirstCharacterId();
    
    // Load base data using services
    const [characterData, attributeData, stats] = await Promise.all([
      db.characters.get(characterId),
      attributeService.loadAttributes(characterId),
      characterService.loadStats(characterId)
    ]);

    if (!characterData) {
      throw new Error('Character not found');
    }

    // Transform character data into the correct type
    const character = await characterService.load(characterId);

    // Initialize root store with character data and stats
    await rootStore.initialize(character, stats);

    // Initialize attributes store with the loaded data
    await attributeService.init(characterId, attributeData);

    // Initialize all other stores in parallel
    await Promise.all([
      buffs.init(characterId),
      skills.init(characterId),
      combat.init(characterId),
      spells.init(characterId),
      equipment.init(characterId)
    ]);

  } catch (error) {
    console.error('Failed to initialize application:', error);
    rootStore.addError(error instanceof Error ? error.message : 'Failed to initialize application');
  } finally {
    rootStore.setLoading(false);
  }
}