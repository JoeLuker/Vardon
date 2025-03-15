import type { BonusEntry, BonusStackingResult } from '$lib/domain/systems/SystemTypes';
import { BonusEngine } from '$lib/domain/systems/engines/BonusEngine';

/**
 * Represents a feature effect with source, target, and value information
 */
export interface FeatureEffect {
  id: string;
  source: string;
  type: string;
  target: string;
  value: number | string | boolean;
  condition?: string;
  priority?: number;
}

/**
 * Type definition for an effect
 */
export interface Effect {
  source: string;
  value: number | string | boolean;
  type: string;
  target?: string;
}

/**
 * System for registering and applying feature effects to character stats
 */
export class FeatureEffectSystem {
  private effects: FeatureEffect[] = [];
  private bonusEngine: BonusEngine;
  private context: Record<string, any> = {};
  
  constructor() {
    // Initialize bonusEngine immediately
    this.bonusEngine = new BonusEngine();
  }
  
  /**
   * Store an object in the context for cross-system communication
   */
  setContext(key: string, value: any): void {
    this.context[key] = value;
  }
  
  /**
   * Retrieve an object from the context
   */
  getContext(key: string): any {
    return this.context[key];
  }
  
  /**
   * Clear the entire context
   */
  clearContext(): void {
    this.context = {};
  }
  
  /**
   * Add an effect to the system
   */
  addEffect(effect: FeatureEffect): void {
    // Remove any existing effect with the same id
    this.removeEffect(effect.id);
    this.effects.push(effect);
  }
  
  /**
   * Remove an effect by ID
   */
  removeEffect(id: string): void {
    this.effects = this.effects.filter(e => e.id !== id);
  }
  
  /**
   * Remove all effects from a specific source
   */
  removeEffectsBySource(source: string): void {
    this.effects = this.effects.filter(e => e.source !== source);
  }
  
  /**
   * Get all effects for a specific target
   */
  getEffectsForTarget(target: string): FeatureEffect[] {
    return this.effects.filter(e => {
      // Direct target match
      if (e.target === target) return true;
      
      // Wildcard target match - e.g., "saving_throw.*" matches "saving_throw.will"
      if (e.target.endsWith('.*')) {
        const prefix = e.target.slice(0, -2);
        return target.startsWith(prefix);
      }
      
      return false;
    });
  }
  
  /**
   * Get numeric effects for a specific target
   * This extracts only effects with numeric values for the specified target
   */
  getNumericEffects(target: string): Effect[] {
    const effects = this.getEffectsForTarget(target);
    
    return effects
      .filter(e => typeof e.value === 'number')
      .map(e => ({
        source: e.source,
        value: e.value as number,
        type: e.type,
        target: e.target
      }));
  }
  
  /**
   * Apply all numeric effects to a target and get the stacked result
   */
  applyNumericEffects(target: string, baseValue = 0): BonusStackingResult {
    const effects = this.getEffectsForTarget(target);
    
    // Filter for numeric effects
    const numericEffects = effects.filter(e => typeof e.value === 'number');
    
    // Convert to BonusEntry format
    const bonuses: BonusEntry[] = numericEffects.map(e => ({
      source: e.source,
      value: e.value as number,
      type: e.type,
      priority: e.priority
    }));
    
    // If we have a base value, add it as a bonus
    if (baseValue !== 0) {
      bonuses.unshift({
        source: 'Base',
        value: baseValue,
        type: 'base',
        priority: 1000 // Highest priority
      });
    }
    
    // Use BonusEngine for stacking rules
    return this.bonusEngine.calculateStackedBonuses(bonuses);
  }
  
  /**
   * Apply all boolean effects to a target and get the result
   */
  applyBooleanEffects(target: string, baseValue = false): boolean {
    const effects = this.getEffectsForTarget(target);
    
    // Filter for boolean effects
    const booleanEffects = effects.filter(e => typeof e.value === 'boolean');
    
    // Start with the base value
    let result = baseValue;
    
    // Apply each boolean effect (OR operation)
    for (const effect of booleanEffects) {
      result = result || (effect.value as boolean);
    }
    
    return result;
  }
  
  /**
   * Apply all string effects to a target with override precedence
   */
  applyOverrideEffects(target: string, baseValue = ''): string {
    const effects = this.getEffectsForTarget(target);
    
    // Filter for string effects
    const stringEffects = effects.filter(e => typeof e.value === 'string');
    
    // Start with the base value
    let result = baseValue;
    
    // Sort by priority (higher first)
    const sortedEffects = [...stringEffects].sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return priorityB - priorityA;
    });
    
    // Apply the highest priority string effect
    if (sortedEffects.length > 0) {
      result = sortedEffects[0].value as string;
    }
    
    return result;
  }
  
  /**
   * Get a conditional override for a target
   */
  getConditionalOverride(
    target: string, 
    condition: string
  ): { value: string; source: string } | null {
    const effects = this.getEffectsForTarget(target);
    
    // Filter for string effects that match the condition
    const matchingEffects = effects.filter(e => 
      typeof e.value === 'string' && 
      e.condition === condition
    );
    
    // Sort by priority (higher first)
    const sortedEffects = [...matchingEffects].sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return priorityB - priorityA;
    });
    
    // Return the highest priority match
    if (sortedEffects.length > 0) {
      const effect = sortedEffects[0];
      return {
        value: effect.value as string,
        source: effect.source
      };
    }
    
    return null;
  }
  
  /**
   * Clear all registered effects
   */
  clearAllEffects(): void {
    this.effects = [];
  }
  
  /**
   * Remove effects by source prefix
   */
  removeEffectsBySourcePrefix(sourcePrefix: string): void {
    this.effects = this.effects.filter(e => !e.source.startsWith(sourcePrefix));
  }
  
  /**
   * Get all current effects
   */
  public getEffects(): FeatureEffect[] {
    return [...this.effects];
  }

  /**
   * Helper method for registering numeric effects with standardized IDs
   */
  registerNumericEffect({
    id,
    entityId, 
    target, 
    value, 
    source, 
    type = 'untyped', 
    priority = 10,
    condition
  }: {
    id?: string;
    entityId: number;
    target: string;
    value: number;
    source: string;
    type?: string;
    priority?: number;
    condition?: string;
  }): void {
    // Create standardized ID if not provided
    const effectId = id || `effect_${entityId}_${target}_${source.replace(/\s+/g, '_')}`;
    
    this.addEffect({
      id: effectId,
      source,
      type,
      target,
      value,
      priority,
      condition
    });
  }

  /**
   * Helper method for registering boolean effects
   */
  registerBooleanEffect({
    id,
    entityId,
    target,
    value,
    source,
    priority = 10,
    condition
  }: {
    id?: string;
    entityId: number;
    target: string;
    value: boolean;
    source: string;
    priority?: number;
    condition?: string;
  }): void {
    // Create standardized ID if not provided
    const effectId = id || `effect_${entityId}_${target}_${source.replace(/\s+/g, '_')}`;
    
    this.addEffect({
      id: effectId,
      source,
      type: 'boolean',
      target,
      value,
      priority,
      condition
    });
  }

  /**
   * Helper method for registering override effects
   */
  registerOverrideEffect({
    id,
    entityId,
    target,
    value,
    source,
    priority = 50, // Higher default priority for overrides
    condition
  }: {
    id?: string;
    entityId: number;
    target: string;
    value: string;
    source: string;
    priority?: number;
    condition?: string;
  }): void {
    // Create standardized ID if not provided
    const effectId = id || `override_${entityId}_${target}_${source.replace(/\s+/g, '_')}`;
    
    this.addEffect({
      id: effectId,
      source,
      type: 'override',
      target,
      value,
      priority,
      condition
    });
  }
} 