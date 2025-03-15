/**
 * AttackEngine.ts
 * 
 * Core attack calculation engine that implements universal game rules for attacks.
 * This is DEFINITIVELY a system, not character-specific code:
 * - It works for ANY entity (character, monster, NPC)
 * - It implements CORE GAME RULES
 * - It is a REUSABLE CALCULATION ENGINE
 */

import type { Entity, BonusEntry, ValueWithBreakdown } from '$lib/domain/systems/SystemTypes';
import type { AttackParts } from '$lib/domain/character/CharacterTypes';
import type { FeatureEffectSystem } from '$lib/domain/systems/FeatureEffectSystem';
import { BonusEngine } from '$lib/domain/systems/engines/BonusEngine';
import { DataAccessLayer } from '$lib/domain/systems/DataAccessLayer';

// Simple attack result for internal use
interface SimpleAttackResult {
  base: number;
  ability: number;
  size: number;
  item: number;
  misc: number;
  total: number;
}

// Damage dice step sizes for weapon size adjustments
const DAMAGE_DICE_STEPS = [
  '1d2', '1d3', '1d4', '1d6', '1d8', '1d10', '2d6', '2d8', '3d6', '3d8', '4d6', '4d8', '6d6', '6d8', '8d6', '8d8', '12d6', '12d8', '16d6'
];

/**
 * Core attack engine that handles all attack-related calculations
 */
export class AttackEngine {
  private bonusEngine: BonusEngine;
  
  constructor(
    private featureEffectSystem?: FeatureEffectSystem,
    private dataAccessLayer?: DataAccessLayer
  ) {
    this.bonusEngine = new BonusEngine();
    if (featureEffectSystem) {
      this.bonusEngine.setFeatureEffectSystem(featureEffectSystem);
    }
  }

  /**
   * Calculate BAB progression for a single class level
   */
  calculateBabForClassLevel(progressionType: string, level: number): number {
    switch (progressionType.toLowerCase()) {
      case 'good':
        return level;
      case 'medium':
        return Math.floor(level * 0.75);
      case 'poor':
        return Math.floor(level * 0.5);
      default:
        return Math.floor(level * 0.75); // Default to medium
    }
  }
  
  /**
   * Calculate iterative attacks based on BAB
   */
  calculateIterativeAttacks(baseAttackBonus: number): number[] {
    // If BAB is less than 6, there are no iterative attacks
    if (baseAttackBonus < 6) {
      return [baseAttackBonus];
    }
    
    const attacks = [baseAttackBonus];
    let remainingBAB = baseAttackBonus;
    
    // Add iterative attacks at -5 penalty each
    while (remainingBAB >= 6) {
      remainingBAB -= 5;
      attacks.push(remainingBAB);
    }
    
    return attacks;
  }

/**
 * Calculate base attack bonus from character's classes
 * @param character The character to calculate BAB for
 * @returns The total BAB
 */
  calculateBAB(entity: Entity): number {
  // Return 0 if no classes
  if (!entity.game_character_class || !entity.game_character_class.length) {
    return 0;
  }
  
  let totalBAB = 0;
  
  // For each class, calculate BAB based on progression type
  for (const charClass of entity.game_character_class) {
    if (!charClass.class || !charClass.level) continue;
    
    const level = charClass.level;
    let babProgression = 1; // Default to 1 = full BAB
    
    // Get BAB progression from class
    if (charClass.class.base_attack_bonus_progression !== undefined && 
        charClass.class.base_attack_bonus_progression !== null) {
      babProgression = charClass.class.base_attack_bonus_progression;
    }
    
    // Calculate BAB based on progression type (1=full, 2=3/4, 3=1/2)
    let classBAB = 0;
    
    if (babProgression === 1) {
      // Full BAB: equal to level
      classBAB = level;
    } else if (babProgression === 2) {
      // 3/4 BAB: level * 0.75 rounded down
      classBAB = Math.floor(level * 0.75);
    } else if (babProgression === 3) {
      // 1/2 BAB: level * 0.5 rounded down
      classBAB = Math.floor(level * 0.5);
    }
    
    // Add class BAB to total
    totalBAB += classBAB;
  }
  
  console.log(`[BAB DEBUG] Calculated BAB: ${totalBAB}`);
  return totalBAB;
}

  /**
   * Get the highest base attack bonus
   */
  getHighestBAB(entity: Entity): number {
    const babArray = this.calculateBAB(entity);
    return babArray.length > 0 ? babArray[0] : 0;
  }

  /**
   * Get size modifier for attacks based on size category
   */
  getSizeModifierForAttacks(sizeCategory: string): number {
    const sizeModifiers: Record<string, number> = {
      'fine': 8,
      'diminutive': 4,
      'tiny': 2,
      'small': 1,
      'medium': 0,
      'large': -1,
      'huge': -2,
      'gargantuan': -4,
      'colossal': -8
    };
    
    return sizeModifiers[sizeCategory.toLowerCase()] || 0;
  }

  /**
   * Calculate weapon damage dice based on size
   */
  calculateWeaponDamageDice(
    baseDamageDice: string,
    weaponSize: string = 'medium',
    creatureSize: string = 'medium'
  ): string {
    // Find the base damage in the steps table
    const baseIndex = DAMAGE_DICE_STEPS.indexOf(baseDamageDice);
    if (baseIndex === -1) return baseDamageDice; // Unknown dice format
    
    // Calculate size difference
    const weaponSizeIndex = this.getSizeIndex(weaponSize);
    const creatureSizeIndex = this.getSizeIndex(creatureSize);
    const sizeDifference = creatureSizeIndex - weaponSizeIndex;
    
    // Apply step adjustment
    const adjustedIndex = Math.max(0, Math.min(baseIndex + sizeDifference, DAMAGE_DICE_STEPS.length - 1));
    
    return DAMAGE_DICE_STEPS[adjustedIndex];
  }
  
  /**
   * Get numeric index for size categories
   */
  private getSizeIndex(sizeCategory: string): number {
    const sizes = ['fine', 'diminutive', 'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'colossal'];
    return sizes.indexOf(sizeCategory.toLowerCase());
  }

  /**
   * Format a modifier as a string with + or - sign
   */
  formatModifier(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }
  
  /**
   * Calculate ability modifier from ability score
   */
  getAbilityModifier(abilityScore: number): number {
    return Math.floor((abilityScore - 10) / 2);
  }

  /**
   * Build an attack calculation with all bonuses
   */
  buildAttack(
    label: string,
    baseAttackBonus: number,
    abilityModifier: number,
    abilityName: string,
    sizeModifier: number,
    enhancementBonus: number = 0,
    otherBonuses: BonusEntry[] = []
  ): ValueWithBreakdown {
    // Create base bonuses
    const bonuses: BonusEntry[] = [
      { source: 'Base Attack Bonus', value: baseAttackBonus, type: 'base' },
      { source: abilityName, value: abilityModifier, type: 'ability' },
      { source: 'Size', value: sizeModifier, type: 'size' }
    ];
    
    // Add enhancement bonus if any
    if (enhancementBonus !== 0) {
      bonuses.push({
        source: 'Enhancement',
        value: enhancementBonus,
        type: 'enhancement'
      });
    }
    
    // Add feature effect bonuses if available
    if (this.featureEffectSystem) {
      const effectBonuses = this.bonusEngine.getFeatureEffectBonuses(
        `attack_${label.toLowerCase()}`,
        'untyped'
      );
      bonuses.push(...effectBonuses);
    }
    
    // Add other bonuses
    bonuses.push(...otherBonuses);
    
    // Apply bonus stacking rules
    return this.bonusEngine.applyBonusStackingRules(label, bonuses);
  }

  /**
   * Build a damage calculation with all bonuses
   */
  buildDamage(
    label: string,
    abilityModifier: number = 0,
    enhancementBonus: number = 0,
    otherBonuses: BonusEntry[] = []
  ): ValueWithBreakdown {
    const bonuses: BonusEntry[] = [];
    
    // Add ability modifier if any
    if (abilityModifier !== 0) {
      bonuses.push({
        source: 'Ability',
        value: abilityModifier,
        type: 'ability'
      });
    }
    
    // Add enhancement bonus if any
    if (enhancementBonus !== 0) {
      bonuses.push({
        source: 'Enhancement',
        value: enhancementBonus,
        type: 'enhancement'
      });
    }
    
    // Add feature effect bonuses if available
    if (this.featureEffectSystem) {
      const effectBonuses = this.bonusEngine.getFeatureEffectBonuses(
        `damage_${label.toLowerCase()}`,
        'untyped'
      );
      bonuses.push(...effectBonuses);
    }
    
    // Add other bonuses
    bonuses.push(...otherBonuses);
    
    // Apply bonus stacking rules
    return this.bonusEngine.applyBonusStackingRules(`${label} Damage`, bonuses);
  }

  /**
   * Calculate a single type of attack with all applicable bonuses
   */
  calculateSingleAttack(
    entity: Entity,
    attackType: 'melee' | 'ranged' | 'cmb',
    weaponBonus: number = 0,
    additionalBonuses: BonusEntry[] = []
  ): ValueWithBreakdown {
    // Get base attack bonus
    const baseAttackBonus = this.getHighestBAB(entity);
    
    // Determine ability modifier to use
    let abilityModifier = 0; 
    let abilityName = '';
    
    // This is simplified - would need to get actual ability scores from entity
    if (attackType === 'melee' || attackType === 'cmb') {
      abilityName = 'Strength';
      abilityModifier = 0; // Would get from entity's Strength
    } else {
      abilityName = 'Dexterity'; 
      abilityModifier = 0; // Would get from entity's Dexterity
    }
    
    // Get size modifier
    const sizeCategory = 'medium'; // Would get from entity
    const sizeModifier = this.getSizeModifierForAttacks(sizeCategory);
    
    // Build the attack
    return this.buildAttack(
      attackType.toUpperCase(),
      baseAttackBonus,
      abilityModifier,
      abilityName,
      sizeModifier,
      weaponBonus,
      additionalBonuses
    );
  }
  
  /**
   * Build a complete set of attacks for an entity
   */
  calculateAttacks(entity: Entity): AttackParts {
    return {
      melee: this.calculateSingleAttack(entity, 'melee'),
      ranged: this.calculateSingleAttack(entity, 'ranged'),
      cmb: this.calculateSingleAttack(entity, 'cmb'),
      cmd: {
        label: 'Combat Maneuver Defense',
        modifiers: [
          { source: "Base", value: 10 },
          { source: "BAB", value: this.getHighestBAB(entity) }
        ],
        total: 10 + this.getHighestBAB(entity)
      },
      bomb: {
        attack: {
          label: 'Bomb Attack',
          modifiers: [],
          total: 0
        },
        damage: {
          label: 'Bomb Damage',
          modifiers: [],
          total: 0
        },
        bombDice: 0
      }
    };
  }
} 