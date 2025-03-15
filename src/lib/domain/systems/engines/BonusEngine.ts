/**
 * BonusEngine.ts
 * 
 * Pure calculation engine for handling bonus stacking and aggregation.
 * This has been refactored to focus only on calculations without state management
 * or feature effect system integration.
 */

import type { BonusEntry, ValueWithBreakdown } from '../SystemTypes';
import type { FeatureEffectSystem } from '../FeatureEffectSystem';

/**
 * Result of stacking bonuses with a breakdown and total
 */
export interface BonusStackingResult {
  total: number;
  modifiers: Array<{ source: string; value: number }>;
}

/**
 * The working accumulator for the stacking calculation
 */
interface StackingAccumulator {
  typedBonuses: Record<string, number>;
  typedSources: Record<string, string>;
  dodgeBonuses: Array<{ source: string; value: number }>;
  circumstanceBonuses: Array<{ source: string; value: number }>;
  untypedBonuses: Array<{ source: string; value: number }>;
  penalties: Array<{ source: string; value: number }>;
}

/**
 * Pure calculation engine for bonus stacking
 */
export class BonusEngine {
  private featureEffectSystem?: FeatureEffectSystem;
  
  constructor() {}
  
  /**
   * Set the feature effect system instance to use
   * This is only needed for backward compatibility and will be removed in future
   */
  setFeatureEffectSystem(featureEffectSystem: FeatureEffectSystem): void {
    this.featureEffectSystem = featureEffectSystem;
  }

  /**
   * Extract numeric effects from feature effects
   */
  extractNumericEffects(
    effects: any[], 
    defaultType: string = 'untyped'
  ): BonusEntry[] {
    const bonuses: BonusEntry[] = [];
    
    for (const effect of effects) {
      if (typeof effect.value === 'number' && effect.value !== 0) {
        bonuses.push({
          source: effect.source,
          value: effect.value,
          type: effect.type || defaultType
        });
      }
    }
    
    return bonuses;
  }

  /**
   * Stack bonuses according to Pathfinder rules
   * 
   * - Most typed bonuses (enhancement, morale, etc.) don't stack - only highest applies
   * - Dodge and circumstance bonuses always stack
   * - Untyped bonuses always stack
   * - Penalties always stack
   */
  calculateStackedBonuses(bonuses: BonusEntry[]): BonusStackingResult {
    if (!bonuses || bonuses.length === 0) {
      return { total: 0, modifiers: [] };
    }

    // Sort by priority if provided (higher first)
    const sortedBonuses = [...bonuses].sort((a, b) => 
      ((b.priority || 0) - (a.priority || 0))
    );

    // Initialize accumulator
    const acc: StackingAccumulator = {
      typedBonuses: {},
      typedSources: {},
      dodgeBonuses: [],
      circumstanceBonuses: [],
      untypedBonuses: [],
      penalties: []
    };

    // Process each bonus
    for (const bonus of sortedBonuses) {
      // Skip null or undefined values
      if (bonus.value === null || bonus.value === undefined) {
        continue;
      }

      // Get the bonus type, defaulting to 'untyped'
      const type = (bonus.type || 'untyped').toLowerCase();

      // Handle based on bonus type and whether it's a penalty
      if (bonus.value < 0) {
        // Penalties always stack regardless of type
        acc.penalties.push({
          source: bonus.source,
          value: bonus.value
        });
      } else if (type === 'dodge') {
        // Dodge bonuses always stack
        acc.dodgeBonuses.push({
          source: bonus.source,
          value: bonus.value
        });
      } else if (type === 'circumstance') {
        // Circumstance bonuses always stack
        acc.circumstanceBonuses.push({
          source: bonus.source,
          value: bonus.value
        });
      } else if (type === 'untyped') {
        // Untyped bonuses always stack
        acc.untypedBonuses.push({
          source: bonus.source,
          value: bonus.value
        });
      } else {
        // Typed bonuses (enhancement, morale, etc.) don't stack
        // Keep only the highest value for each type
        if (!acc.typedBonuses[type] || bonus.value > acc.typedBonuses[type]) {
          acc.typedBonuses[type] = bonus.value;
          acc.typedSources[type] = bonus.source;
        }
      }
    }

    // Build result
    const result: BonusStackingResult = {
      total: 0,
      modifiers: []
    };

    // Add all typed bonuses (only the highest of each type)
    for (const type in acc.typedBonuses) {
      const value = acc.typedBonuses[type];
      const source = acc.typedSources[type];
      
      result.modifiers.push({ source, value });
      result.total += value;
    }

    // Add all dodge bonuses (they stack)
    for (const bonus of acc.dodgeBonuses) {
      result.modifiers.push(bonus);
      result.total += bonus.value;
    }

    // Add all circumstance bonuses (they stack)
    for (const bonus of acc.circumstanceBonuses) {
      result.modifiers.push(bonus);
      result.total += bonus.value;
    }

    // Add all untyped bonuses (they stack)
    for (const bonus of acc.untypedBonuses) {
      result.modifiers.push(bonus);
      result.total += bonus.value;
    }

    // Add all penalties (they stack)
    for (const penalty of acc.penalties) {
      result.modifiers.push(penalty);
      result.total += penalty.value;
    }

    return result;
  }

  /**
   * Apply bonus stacking rules and convert to ValueWithBreakdown
   */
  applyBonusStackingRules(
    statId: string,
    bonuses: BonusEntry[],
    baseValue: number = 0
  ): ValueWithBreakdown {
    // Create a copy of the bonuses array
    const allBonuses = [...bonuses];
    
    // Add base value as a bonus if non-zero
    if (baseValue !== 0) {
      allBonuses.push({
        source: 'Base',
        value: baseValue,
        priority: 1000 // Ensure base value appears first
      });
    }
    
    // Calculate stacked bonuses
    const result = this.calculateStackedBonuses(allBonuses);
    
    // Convert to ValueWithBreakdown
    return {
      label: statId,
      modifiers: result.modifiers,
      total: result.total
    };
  }

  /**
   * Filter bonuses by type (inclusion)
   */
  filterBonusesByTypes(
    bonuses: BonusEntry[], 
    typesToInclude: string[]
  ): BonusEntry[] {
    return bonuses.filter(bonus => {
      const bonusType = (bonus.type || 'untyped').toLowerCase();
      return typesToInclude.includes(bonusType);
    });
  }

  /**
   * Filter bonuses by excluded types
   */
  filterBonusesByExcludedTypes(
    bonuses: BonusEntry[], 
    typesToExclude: string[]
  ): BonusEntry[] {
    return bonuses.filter(bonus => {
      const bonusType = (bonus.type || 'untyped').toLowerCase();
      return !typesToExclude.includes(bonusType);
    });
  }

  /**
   * Build a generic stat with bonuses
   */
  buildGenericStat(
    label: string,
    bonuses: BonusEntry[],
    baseValue: number = 0
  ): ValueWithBreakdown {
    return this.applyBonusStackingRules(label, bonuses, baseValue);
  }
} 