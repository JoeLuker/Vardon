/**
 * SizeSystem.ts
 * 
 * System for managing size effects and their registration with the feature effect system.
 * This handles the state and integration, delegating calculations to SizeEngine.
 */

import type { Entity } from './SystemTypes';
import type { FeatureEffectSystem } from './FeatureEffectSystem';
import { SizeEngine, type SizeModifier } from './engines/SizeEngine';

/**
 * Manages size effects for entities
 */
export class SizeSystem {
  private sizeEngine: SizeEngine;
  
  constructor(private featureEffectSystem: FeatureEffectSystem) {
    this.sizeEngine = new SizeEngine();
  }

  /**
   * Apply size effects for an entity
   */
  applySizeEffects(
    entity: Entity,
    baseSize: string,
    sizeModifiers: SizeModifier[] = []
  ): void {
    // Calculate size effects
    const sizeData = this.sizeEngine.calculateSizeEffects(baseSize, sizeModifiers);
    
    // Register the effective size
    this.featureEffectSystem.addEffect({
      id: `size_effective_${entity.id}`,
      source: 'Size System',
      type: 'size',
      target: 'effective_size',
      value: sizeData.effectiveSize,
      priority: 100
    });
    
    // Register AC modifier
    this.featureEffectSystem.addEffect({
      id: `size_ac_${entity.id}`,
      source: 'Size',
      type: 'size',
      target: 'ac',
      value: sizeData.acModifier,
      priority: 80
    });
    
    // Register attack modifier
    this.featureEffectSystem.addEffect({
      id: `size_attack_${entity.id}`,
      source: 'Size',
      type: 'size',
      target: 'attack',
      value: sizeData.attackModifier,
      priority: 80
    });
    
    // Register CMB modifier
    this.featureEffectSystem.addEffect({
      id: `size_cmb_${entity.id}`,
      source: 'Size',
      type: 'size',
      target: 'cmb',
      value: sizeData.cmbModifier,
      priority: 80
    });
    
    // Register CMD modifier
    this.featureEffectSystem.addEffect({
      id: `size_cmd_${entity.id}`,
      source: 'Size',
      type: 'size',
      target: 'cmd',
      value: sizeData.cmbModifier, // CMD uses same as CMB
      priority: 80
    });
    
    // Register Stealth modifier
    this.featureEffectSystem.addEffect({
      id: `size_stealth_${entity.id}`,
      source: 'Size',
      type: 'size',
      target: 'stealth',
      value: sizeData.stealthModifier,
      priority: 80
    });
    
    // Register Fly modifier
    this.featureEffectSystem.addEffect({
      id: `size_fly_${entity.id}`,
      source: 'Size',
      type: 'size',
      target: 'fly',
      value: sizeData.flyModifier,
      priority: 80
    });
    
    // Register space and reach as informational values
    this.featureEffectSystem.addEffect({
      id: `size_space_${entity.id}`,
      source: 'Size',
      type: 'size',
      target: 'space',
      value: sizeData.space,
      priority: 100
    });
    
    this.featureEffectSystem.addEffect({
      id: `size_reach_${entity.id}`,
      source: 'Size',
      type: 'size',
      target: 'reach',
      value: sizeData.reach,
      priority: 100
    });
  }
  
  /**
   * Clear size effects for an entity
   */
  clearSizeEffects(entity: Entity): void {
    // Remove all size-related effects
    this.featureEffectSystem.removeEffectsBySourcePrefix(`size_`);
  }
  
  /**
   * Get the current effective size for an entity
   */
  getEffectiveSize(entity: Entity, defaultSize: string = 'medium'): string {
    const effects = this.featureEffectSystem.getEffectsForTarget('effective_size');
    
    if (effects.length > 0) {
      // Get the highest priority size effect
      const sortedEffects = [...effects].sort((a, b) => 
        (b.priority || 0) - (a.priority || 0)
      );
      
      // Return the value as string
      const value = sortedEffects[0].value;
      return typeof value === 'string' ? value : defaultSize;
    }
    
    return defaultSize;
  }
  
  /**
   * Get size modifier for a specific target
   */
  getSizeModifierForTarget(target: string): number {
    const effects = this.featureEffectSystem.getEffectsForTarget(target);
    
    // Filter to size type effects
    const sizeEffects = effects.filter(e => e.type === 'size');
    
    if (sizeEffects.length > 0) {
      // Find the highest priority size effect
      const sortedEffects = [...sizeEffects].sort((a, b) => 
        (b.priority || 0) - (a.priority || 0)
      );
      
      // Return the numeric value or 0
      const value = sortedEffects[0].value;
      return typeof value === 'number' ? value : 0;
    }
    
    return 0;
  }
  
  /**
   * Get the SizeEngine for direct access to size calculations
   */
  getSizeEngine(): SizeEngine {
    return this.sizeEngine;
  }
} 