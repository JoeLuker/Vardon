import type { GameRulesAPI, CompleteCharacter } from '$lib/db/gameRules.api';
import type { EnrichedCharacter } from '$lib/domain/character/CharacterTypes';
import { CharacterEnricher } from '$lib/domain/character/CharacterEnricher';
import { DataAccessLayer } from '$lib/domain/systems/DataAccessLayer';

/**
 * Types of updates that can be applied to a character
 */
export type UpdateType = 
  | 'ability'       // Ability score updates
  | 'skill'         // Skill rank updates
  | 'skillRank'     // Skill rank updates (alias)
  | 'feat'          // Feat changes
  | 'class'         // Class/level changes
  | 'equipment'     // Equipment/armor changes
  | 'hp';           // Hit point changes

/**
 * CharacterStateManager: Manages state changes to characters
 */
export class CharacterStateManager {
  private character: CompleteCharacter;
  private enricher: CharacterEnricher;
  private dataLayer: DataAccessLayer;

  /**
   * Constructor
   * @param character The character to manage state for
   * @param gameRules The game rules API used for data access
   */
  constructor(character: CompleteCharacter, gameRules: GameRulesAPI) {
    this.character = character;
    this.dataLayer = new DataAccessLayer(gameRules);
    this.enricher = new CharacterEnricher(this.dataLayer);
  }

  /**
   * Apply an update to the character
   * @param type Type of update to apply
   * @param payload Data for the update
   * @returns Updated enriched character
   */
  async applyUpdate(type: UpdateType, payload: any): Promise<EnrichedCharacter> {
    // Make a deep copy of the character to work with
    const workingCopy = JSON.parse(JSON.stringify(this.character));
    
    // Apply the update based on type
    switch (type) {
      case 'ability':
        this.updateAbility(workingCopy, payload);
        break;
      case 'skill':
      case 'skillRank':
        this.updateSkillRank(workingCopy, payload);
        break;
      case 'hp':
        this.updateHP(workingCopy, payload);
        break;
      // Other cases will be added as needed
      default:
        console.warn(`Update type ${type} not implemented yet`);
    }
    
    // Return the enriched character
    return await this.enricher.enrichCharacter(workingCopy);
  }
  
  /**
   * Update ability scores
   */
  private updateAbility(character: CompleteCharacter, payload: { abilityId: number, value: number }): void {
    // Find the ability on the character
    if (!character.game_character_ability) {
      character.game_character_ability = [];
    }
    
    const existingAbility = character.game_character_ability.find(a => a.ability_id === payload.abilityId);
    
    if (existingAbility) {
      // Update existing
      existingAbility.value = payload.value;
    } else {
      // Add new with required properties
      character.game_character_ability.push({
        id: -Date.now(), // Temporary ID
        ability_id: payload.abilityId,
        game_character_id: character.id,
        value: payload.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ability: { 
          id: payload.abilityId,
          name: 'placeholder',
          ability_type: null,
          label: null,
          created_at: null,
          updated_at: null
        }
      });
    }
  }
  
  /**
   * Update skill ranks
   */
  private updateSkillRank(
    character: CompleteCharacter, 
    payload: { 
      skillId: number; 
      level: number; 
      isAdding: boolean;
      currentCharacter?: EnrichedCharacter;
      rawCharacter?: CompleteCharacter;
      gameRules?: GameRulesAPI;
    }
  ): void {
    // Make sure ranks array exists
    if (!character.game_character_skill_rank) {
      character.game_character_skill_rank = [];
    }
    
    // If adding
    if (payload.isAdding) {
      // Check if rank already exists
      const existingRank = character.game_character_skill_rank.find(
        rank => rank.skill_id === payload.skillId && rank.applied_at_level === payload.level
      );
      
      // If it doesn't exist, add it
      if (!existingRank) {
        // Generate a temporary ID for optimistic UI 
        // (will be replaced with real one from DB)
        const tempId = -Date.now();
        
        character.game_character_skill_rank.push({
          id: tempId,
          game_character_id: character.id,
          skill_id: payload.skillId,
          applied_at_level: payload.level,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          skill: { 
            id: payload.skillId,
            name: 'placeholder',
            ability_id: 1,
            knowledge_skill: null,
            armor_check_penalty: null,
            trained_only: null,
            label: null,
            created_at: null,
            updated_at: null
          }
        });
      }
    } 
    // If removing
    else {
      // Filter out the rank to remove
      character.game_character_skill_rank = character.game_character_skill_rank.filter(
        rank => !(rank.skill_id === payload.skillId && rank.applied_at_level === payload.level)
      );
    }
  }
  
  /**
   * Update HP values
   */
  private updateHP(
    character: CompleteCharacter, 
    payload: { 
      newCurrentHp?: number; 
      newMaxHp?: number;
      currentCharacter?: EnrichedCharacter;
      rawCharacter?: CompleteCharacter;
      gameRules?: GameRulesAPI;
    }
  ): void {
    if (payload.newCurrentHp !== undefined) {
      character.current_hp = payload.newCurrentHp;
    }
    
    if (payload.newMaxHp !== undefined) {
      character.max_hp = payload.newMaxHp;
    }
  }
  
  /**
   * Get the DataAccessLayer instance
   * Useful for accessing game rules data
   */
  getDataAccessLayer(): DataAccessLayer {
    return this.dataLayer;
  }
}