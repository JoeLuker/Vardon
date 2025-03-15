/**
 * BonusSystem.ts
 * 
 * System for handling bonus effects and registration in the game.
 * This maintains state and coordinates with the FeatureEffectSystem, while
 * delegating actual bonus calculations to the BonusEngine.
 */

import type { BonusEntry } from './SystemTypes';
import type { FeatureEffectSystem } from './FeatureEffectSystem';
import { BonusEngine } from './engines/BonusEngine';
import type { Entity } from './SystemTypes';

/**
 * Manages bonus application and coordination with the feature effect system
 */
export class BonusSystem {
  private bonusEngine: BonusEngine;
  
  constructor(
    private featureEffectSystem: FeatureEffectSystem
  ) {
    this.bonusEngine = new BonusEngine();
    this.bonusEngine.setFeatureEffectSystem(featureEffectSystem);
  }
  
  /**
   * Extract numeric effects from feature effects
   * Delegates to BonusEngine to avoid duplication
   */
  extractNumericEffects(
    effects: any[], 
    defaultType: string = 'untyped'
  ): BonusEntry[] {
    return this.bonusEngine.extractNumericEffects(effects, defaultType);
  }

  /**
   * Get bonuses from feature effect system
   */
  getFeatureEffectBonuses(
    target: string,
    defaultType: string = 'untyped'
  ): BonusEntry[] {
    const effects = this.featureEffectSystem.getNumericEffects(target);
    return this.extractNumericEffects(effects, defaultType);
  }

  /**
   * Get combined bonuses from multiple feature effect targets
   */
  getCombinedFeatureEffectBonuses(
    targets: string[],
    defaultType: string = 'untyped'
  ): BonusEntry[] {
    if (!targets.length) return [];
    
    let allBonuses: BonusEntry[] = [];
    
    for (const target of targets) {
      const targetBonuses = this.getFeatureEffectBonuses(
        target,
        defaultType
      );
      
      allBonuses = [...allBonuses, ...targetBonuses];
    }
    
    return allBonuses;
  }
  
  /**
   * Register a bonus effect for a target
   */
  registerBonus(
    entity: Entity,
    targetId: string,
    source: string,
    value: number,
    type: string = 'untyped',
    priority: number = 10
  ): void {
    const effectId = `bonus_${entity.id}_${targetId}_${source.replace(/\s+/g, '_')}`;
    
    this.featureEffectSystem.addEffect({
      id: effectId,
      source,
      type,
      target: targetId,
      value,
      priority
    });
  }
  
  /**
   * Clear all bonuses for an entity
   */
  clearBonuses(entity: Entity): void {
    this.featureEffectSystem.removeEffectsBySourcePrefix(`bonus_${entity.id}`);
  }
  
  /**
   * Clear bonuses for a specific target
   */
  clearBonusesForTarget(targetId: string): void {
    const effects = this.featureEffectSystem.getEffectsForTarget(targetId);
    
    for (const effect of effects) {
      if (effect.id.startsWith('bonus_')) {
        this.featureEffectSystem.removeEffect(effect.id);
      }
    }
  }
  
  /**
   * Get the BonusEngine for calculations
   */
  getBonusEngine(): BonusEngine {
    return this.bonusEngine;
  }
} 