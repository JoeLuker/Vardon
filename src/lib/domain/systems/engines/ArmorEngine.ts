/**
 * ArmorEngine.ts
 * 
 * Core armor calculation system for determining armor class values.
 * This is a SYSTEM, not character code, because:
 * 1. AC calculation is a UNIVERSAL GAME RULE
 * 2. It works identically for ALL ENTITIES (characters, monsters)
 * 3. It's a REUSABLE CALCULATION ENGINE
 */

import type { Entity, BonusEntry, ValueWithBreakdown } from '$lib/domain/systems/SystemTypes';
import type { FeatureEffectSystem } from '$lib/domain/systems/FeatureEffectSystem';
import { BonusEngine } from '$lib/domain/systems/engines/BonusEngine';
import { DataAccessLayer } from '$lib/domain/systems/DataAccessLayer';

/**
 * Interface for internal AC calculation breakdown
 */
interface ACCalculation {
  armorBonus: number;
  shieldBonus: number;
  dexBonus: number;
  sizeBonus: number;
  naturalArmor: number;
  deflectionBonus: number;
  dodgeBonus: number;
  miscBonus: number;
  total: number;
}

/**
 * Core armor engine that handles universal AC calculations
 */
export class ArmorEngine {
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
   * Apply the maximum dexterity modifier based on armor restrictions
   */
  applyMaxDexBonus(dexMod: number, maxDexBonus?: number): number {
    if (maxDexBonus === undefined) {
      return dexMod;
    }
    
    return Math.min(dexMod, maxDexBonus);
  }

  /**
   * Apply size modifier to AC
   * Core rule: Size modifies AC
   */
  getSizeModifierToAC(sizeCategory: string): number {
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
   * Calculate armor check penalty from armor and shield penalties
   */
  calculateArmorCheckPenalty(armorPenalty: number, shieldPenalty: number): number {
    // Armor check penalties stack
    return armorPenalty + shieldPenalty;
  }

  /**
   * Apply bonus stacking rules specifically for AC bonuses
   */
  applyArmorBonusStacking(bonuses: BonusEntry[]): ValueWithBreakdown {
    return this.bonusEngine.applyBonusStackingRules('AC', bonuses);
  }

  /**
   * Calculate normal armor class (AC) 
   */
  calculateAC(
    entity: Entity,
    dexMod: number,
    sizeCategory: string = 'medium',
    bonuses: BonusEntry[] = []
  ): ValueWithBreakdown {
    // Base AC starts at 10
    const baseAC = 10;
    
    // Apply size modifier
    const sizeModifier = this.getSizeModifierToAC(sizeCategory);
    
    // Create base bonuses
    const acBonuses: BonusEntry[] = [
      { source: 'Base', value: baseAC, type: 'base' },
      { source: 'Dexterity', value: dexMod, type: 'dex' },
      { source: 'Size', value: sizeModifier, type: 'size' }
    ];
    
    // Add feature effect bonuses if available
    if (this.featureEffectSystem) {
      const effectBonuses = this.bonusEngine.getFeatureEffectBonuses(
        'ac',
        'untyped'
      );
      acBonuses.push(...effectBonuses);
    }
    
    // Combine with provided bonuses
    const allBonuses = [...acBonuses, ...bonuses];
    
    // Apply stacking rules and return
    return this.applyArmorBonusStacking(allBonuses);
  }

  /**
   * Calculate touch AC - only includes certain types of AC bonuses
   */
  calculateTouchAC(
    entity: Entity,
    dexMod: number,
    sizeCategory: string = 'medium',
    bonuses: BonusEntry[] = []
  ): ValueWithBreakdown {
    // For touch AC, filter out armor, shield, and natural armor bonuses
    const typesToExclude = ['armor', 'shield', 'natural armor'];
    const touchBonuses = this.bonusEngine.filterBonusesByExcludedTypes(bonuses, typesToExclude);
    
    // Add feature effect bonuses if available
    if (this.featureEffectSystem) {
      const touchEffectBonuses = this.bonusEngine.getFeatureEffectBonuses(
        'touch_ac',
        'untyped'
      );
      touchBonuses.push(...touchEffectBonuses);
    }
    
    // Calculate touch AC
    return this.calculateAC(entity, dexMod, sizeCategory, touchBonuses);
  }

  /**
   * Calculate flat-footed AC - excludes dexterity and dodge bonuses
   */
  calculateFlatFootedAC(
    entity: Entity,
    sizeCategory: string = 'medium',
    bonuses: BonusEntry[] = []
  ): ValueWithBreakdown {
    // For flat-footed, filter out dodge bonuses
    const typesToExclude = ['dodge'];
    const flatFootedBonuses = this.bonusEngine.filterBonusesByExcludedTypes(bonuses, typesToExclude);
    
    // Add feature effect bonuses if available
    if (this.featureEffectSystem) {
      const ffEffectBonuses = this.bonusEngine.getFeatureEffectBonuses(
        'flat_footed_ac',
        'untyped'
      );
      flatFootedBonuses.push(...ffEffectBonuses);
    }
    
    // Override dexMod to 0 for flat-footed
    return this.calculateAC(entity, 0, sizeCategory, flatFootedBonuses);
  }

  /**
   * Calculate complete AC set (normal, touch, flat-footed)
   */
  calculateACSet(
    entity: Entity,
    dexMod: number,
    sizeCategory: string = 'medium',
    bonuses: BonusEntry[] = []
  ): {
    normal: ValueWithBreakdown;
    touch: ValueWithBreakdown;
    flatFooted: ValueWithBreakdown;
  } {
    return {
      normal: this.calculateAC(entity, dexMod, sizeCategory, bonuses),
      touch: this.calculateTouchAC(entity, dexMod, sizeCategory, bonuses),
      flatFooted: this.calculateFlatFootedAC(entity, sizeCategory, bonuses)
    };
  }
} 