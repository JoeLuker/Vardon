/**
 * CharacterCalculator.ts
 * 
 * Calculates a complete character sheet by delegating to system engines.
 * Focused solely on calculation logic using engines with registered effects.
 */

import type { CompleteCharacter } from '$lib/db/gameRules.api';
import type { Entity, ValueWithBreakdown } from '$lib/domain/systems/SystemTypes';
import type { FeatureEffectSystem } from '$lib/domain/systems/FeatureEffectSystem';
import { AbilityEngine } from '$lib/domain/systems/engines/AbilityEngine';
import { SavingThrowEngine } from '$lib/domain/systems/engines/SavingThrowEngine';
import { AttackEngine } from '$lib/domain/systems/engines/AttackEngine';
import { ArmorEngine } from '$lib/domain/systems/engines/ArmorEngine';
import { SkillEngine } from '$lib/domain/systems/engines/SkillEngine';
import { DataAccessLayer } from '$lib/domain/systems/DataAccessLayer';


/**
 * Character sheet representation with calculated values
 */
export interface CharacterSheet {
  // Core character data
  id: number;
  name: string;
  level: number;
  
  // Ability scores
  abilityScores: {
    strength: ValueWithBreakdown;
    dexterity: ValueWithBreakdown;
    constitution: ValueWithBreakdown;
    intelligence: ValueWithBreakdown;
    wisdom: ValueWithBreakdown;
    charisma: ValueWithBreakdown;
  };
  
  // Combat stats
  combat: {
    ac: ValueWithBreakdown;
    touchAC: ValueWithBreakdown;
    flatFootedAC: ValueWithBreakdown;
    initiative: ValueWithBreakdown;
    baseAttackBonus: number[];
    meleeAttack: ValueWithBreakdown;
    rangedAttack: ValueWithBreakdown;
    cmb: ValueWithBreakdown;
    cmd: ValueWithBreakdown;
  };
  
  // Saving throws
  saves: {
    fortitude: ValueWithBreakdown;
    reflex: ValueWithBreakdown;
    will: ValueWithBreakdown;
  };
  
  // Skills
  skills: Record<number, ValueWithBreakdown>;
  
  // Class features
  classFeatures: Array<{
    id: number;
    name: string;
    description: string;
    level: number;
    className: string;
  }>;
  
  // Equipment
  equipment: {
    armor: any[];
    weapons: any[];
    items: any[];
  };
  
  // Spellcasting
  spellcasting: {
    classes: any[];
    spellsKnown: any[];
    spellsPerDay: any[];
  };
}


/**
 * Creates an empty character sheet with default values
 */
export function createEmptyCharacterSheet(character?: CompleteCharacter): CharacterSheet {
  return {
    id: character?.id || 0,
    name: character?.name || '',
    level: 0,
    
    abilityScores: {
      strength: { label: 'Strength', modifiers: [], total: 10 },
      dexterity: { label: 'Dexterity', modifiers: [], total: 10 },
      constitution: { label: 'Constitution', modifiers: [], total: 10 },
      intelligence: { label: 'Intelligence', modifiers: [], total: 10 },
      wisdom: { label: 'Wisdom', modifiers: [], total: 10 },
      charisma: { label: 'Charisma', modifiers: [], total: 10 }
    },
    
    combat: {
      ac: { label: 'AC', modifiers: [], total: 10 },
      touchAC: { label: 'Touch AC', modifiers: [], total: 10 },
      flatFootedAC: { label: 'Flat-Footed AC', modifiers: [], total: 10 },
      initiative: { label: 'Initiative', modifiers: [], total: 0 },
      baseAttackBonus: [0],
      meleeAttack: { label: 'Melee Attack', modifiers: [], total: 0 },
      rangedAttack: { label: 'Ranged Attack', modifiers: [], total: 0 },
      cmb: { label: 'CMB', modifiers: [], total: 0 },
      cmd: { label: 'CMD', modifiers: [], total: 10 }
    },
    
    saves: {
      fortitude: { label: 'Fortitude', modifiers: [], total: 0 },
      reflex: { label: 'Reflex', modifiers: [], total: 0 },
      will: { label: 'Will', modifiers: [], total: 0 }
    },
    
    skills: {},
    classFeatures: [],
    equipment: { armor: [], weapons: [], items: [] },
    spellcasting: { classes: [], spellsKnown: [], spellsPerDay: [] }
  };
} 

/**
 * CharacterSheetCalculator - Handles pure character calculations by delegating to system engines
 */
export class CharacterSheetCalculator {
  private abilityEngine: AbilityEngine;
  private savingThrowEngine: SavingThrowEngine;
  private attackEngine: AttackEngine;
  private armorEngine: ArmorEngine;
  private skillEngine: SkillEngine;
  
  /**
   * Constructor accepts the feature effect system to use in calculations
   * @param featureEffectSystem The feature effect system with registered effects
   * @param dataAccessLayer Optional data access layer for additional data
   */
  constructor(
    private featureEffectSystem: FeatureEffectSystem,
    private dataAccessLayer?: DataAccessLayer
  ) {
    // Initialize engine instances with feature effect system
    this.abilityEngine = new AbilityEngine(featureEffectSystem, dataAccessLayer);
    this.savingThrowEngine = new SavingThrowEngine(featureEffectSystem, dataAccessLayer);
    this.attackEngine = new AttackEngine(featureEffectSystem, dataAccessLayer);
    this.armorEngine = new ArmorEngine(featureEffectSystem, dataAccessLayer);
    this.skillEngine = new SkillEngine(featureEffectSystem, dataAccessLayer);
  }
  
  /**
   * Convert CompleteCharacter to Entity for system engines
   */
  private characterToEntity(character: CompleteCharacter): Entity {
    return {
      id: character.id || 0,
      character: character
    };
  }
  
  /**
   * Calculate a complete character sheet using registered effects
   * @param character The character to calculate for
   * @returns A complete CharacterSheet with all calculated values
   */
  calculateCharacterSheet(character: CompleteCharacter): CharacterSheet {
    console.log(`[CALCULATOR] Calculating character sheet for ${character.name} (ID: ${character.id})`);
    
    // Create an empty sheet as starting point
    const sheet = createEmptyCharacterSheet(character);
    
    // Convert character to entity for system engines
    const entity = this.characterToEntity(character);
    
    // Calculate base scores (required for the ability scores section)
    const baseScores = this.getBaseAbilityScores(character);
    
    // Calculate ability scores
    const abilityScores = this.abilityEngine.calculateAllAbilityScores(
      entity,
      baseScores
    );
    
    // Convert to the format expected by CharacterSheet
    sheet.abilityScores = {
      strength: abilityScores.strength || { label: 'Strength', modifiers: [], total: 10 },
      dexterity: abilityScores.dexterity || { label: 'Dexterity', modifiers: [], total: 10 },
      constitution: abilityScores.constitution || { label: 'Constitution', modifiers: [], total: 10 },
      intelligence: abilityScores.intelligence || { label: 'Intelligence', modifiers: [], total: 10 },
      wisdom: abilityScores.wisdom || { label: 'Wisdom', modifiers: [], total: 10 },
      charisma: abilityScores.charisma || { label: 'Charisma', modifiers: [], total: 10 }
    };
    
    // Get ability modifiers
    const abilityModifiers = this.abilityEngine.getAbilityModifiers(abilityScores);
    
    // Calculate saves using ability scores
    sheet.saves.fortitude = this.savingThrowEngine.calculateSavingThrow(
      entity,
      'fortitude',
      sheet.abilityScores.constitution.total
    );
    
    sheet.saves.reflex = this.savingThrowEngine.calculateSavingThrow(
      entity,
      'reflex',
      sheet.abilityScores.dexterity.total
    );
    
    sheet.saves.will = this.savingThrowEngine.calculateSavingThrow(
      entity,
      'will',
      sheet.abilityScores.wisdom.total
    );
    
    // Calculate AC values
    const sizeCategory = this.getSizeCategory(character);
    const acSet = this.armorEngine.calculateACSet(
      entity,
      abilityModifiers.dexterityMod,
      sizeCategory
    );
    
    sheet.combat.ac = acSet.normal;
    sheet.combat.touchAC = acSet.touch;
    sheet.combat.flatFootedAC = acSet.flatFooted;
    
    // Calculate initiative (DEX based with any modifiers)
    sheet.combat.initiative = {
      label: 'Initiative',
      total: abilityModifiers.dexterityMod,
      modifiers: [
        { source: 'Dexterity', value: abilityModifiers.dexterityMod }
      ]
    };
    
    // Calculate attacks
    const attacks = this.attackEngine.calculateAttacks(entity);
    sheet.combat.meleeAttack = attacks.melee;
    sheet.combat.rangedAttack = attacks.ranged;
    sheet.combat.cmb = attacks.cmb;
    sheet.combat.cmd = attacks.cmd;
    
    // Calculate BAB
    const bab = this.attackEngine.calculateBAB(entity);
    sheet.combat.baseAttackBonus = Array.isArray(bab) ? bab : [bab];
    
    // Calculate skills
    sheet.skills = this.calculateSkills(entity, abilityModifiers);
    
    // Calculate class features
    sheet.classFeatures = this.getProcessedClassFeatures(character);
    
    // Future calculations can be added here
    // - Equipment
    // - Spellcasting
    
    return sheet;
  }
  
  /**
   * Get base ability scores from a character
   */
  private getBaseAbilityScores(character: CompleteCharacter): Record<string, number> {
    const result: Record<string, number> = {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    };
    
    // Extract from character data if available
    if (character.game_character_ability?.length) {
      for (const ability of character.game_character_ability) {
        const abilityName = ability.ability?.name?.toLowerCase();
        if (abilityName && typeof ability.value === 'number') {
          result[abilityName] = ability.value;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get character size category
   */
  private getSizeCategory(character: CompleteCharacter): string {
    // Try to get from ancestry first
    if (character.game_character_ancestry?.length) {
      const size = character.game_character_ancestry[0]?.ancestry?.size;
      if (size) return size.toLowerCase();
    }
    
    // Check for size effects in the feature effect system
    const sizeEffects = this.featureEffectSystem.getEffectsForTarget('effective_size');
    if (sizeEffects.length > 0) {
      // Sort by priority
      const sortedEffects = [...sizeEffects].sort((a, b) => 
        (b.priority || 0) - (a.priority || 0)
      );
      
      // Return highest priority size
      const value = sortedEffects[0].value;
      if (typeof value === 'string') {
        return value.toLowerCase();
      }
    }
    
    // Default to medium
    return 'medium';
  }
  
  /**
   * Calculate all skills for the character
   */
  private calculateSkills(entity: Entity, abilityModifiers: Record<string, number>): Record<number, ValueWithBreakdown> {
    if (!this.dataAccessLayer) {
      return {};
    }
    
    // Use skill engine to calculate all skill modifiers
    return this.skillEngine.calculateSkillModifiers(
      entity,
      abilityModifiers
    );
  }
  
  /**
   * Get processed class features
   * This is a placeholder - in a full implementation, you would use
   * the FeatureSystem to get this data
   */
  private getProcessedClassFeatures(character: CompleteCharacter): Array<{
    id: number;
    name: string;
    description: string;
    level: number;
    className: string;
  }> {
    // This is a simplified implementation - in a real system,
    // you would use a dedicated feature processor
    return (character.game_character_class_feature || [])
      .filter(cf => cf.class_feature)
      .map(cf => {
        const feature = cf.class_feature!;
        const className = character.game_character_class?.find(c => 
          c.class_id === feature.class_id
        )?.class?.name || 'Unknown Class';
        
        return {
          id: feature.id,
          name: feature.name || 'Unknown Feature',
          description: feature.description || '',
          level: feature.feature_level || 1,
          className
        };
      });
  }
} 