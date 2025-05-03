import type { Entity } from '../types/EntityTypes';
import type { AbilitySubsystem, AbilityBreakdown, BonusSubsystem } from '../types/SubsystemTypes';

export class AbilitySubsystemImpl implements AbilitySubsystem {
  id = 'ability';
  version = '1.0.0';
  
  constructor(private bonusSubsystem: BonusSubsystem) {}
  
  /**
   * Initialize ability scores from character data
   */
  initialize(entity: Entity): void {
    if (!entity.character) return;
    
    // Initialize abilities from character data
    if (entity.character.game_character_ability) {
      for (const abilityData of entity.character.game_character_ability) {
        if (!abilityData.ability) continue;
        
        const abilityName = abilityData.ability.name.toLowerCase();
        const value = abilityData.value || 10;
        
        this.setAbilityScore(entity, abilityName, value);
      }
    }
    
    // Set default values for any abilities not found
    const abilityNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    for (const ability of abilityNames) {
      if (this.getBaseAbilityScore(entity, ability) === 10) {
        // Only set default if not already initialized
        this.setAbilityScore(entity, ability, 10);
      }
    }
  }
  
  getAbilityScore(entity: Entity, ability: string): number {
    const base = this.getBaseAbilityScore(entity, ability);
    const bonuses = this.bonusSubsystem.calculateTotal(entity, `ability_${ability}`);
    return base + bonuses;
  }
  
  getAbilityModifier(entity: Entity, ability: string): number {
    const score = this.getAbilityScore(entity, ability);
    return Math.floor((score - 10) / 2);
  }
  
  setAbilityScore(entity: Entity, ability: string, value: number): void {
    if (!entity.character) entity.character = {};
    if (!entity.character.abilities) entity.character.abilities = {};
    
    entity.character.abilities[ability] = value;
    entity.metadata.updatedAt = Date.now();
  }
  
  getBaseAbilityScore(entity: Entity, ability: string): number {
    if (!entity.character?.abilities) return 10;
    return entity.character.abilities[ability] || 10;
  }
  
  getAbilityBreakdown(entity: Entity, ability: string): AbilityBreakdown {
    const base = this.getBaseAbilityScore(entity, ability);
    const bonuses = this.bonusSubsystem.getBreakdown(entity, `ability_${ability}`);
    const total = base + bonuses.total;
    const modifier = Math.floor((total - 10) / 2);
    
    return {
      ability,
      base,
      total,
      modifier,
      bonuses
    };
  }
}
