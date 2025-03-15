/**
 * ClassFeatureSystem.ts
 * 
 * System responsible for processing class features and registering their effects.
 * Follows the System pattern by managing state and coordinating with FeatureEffectSystem.
 */

import type { CompleteCharacter, ProcessedClassFeature } from '$lib/db/gameRules.api';
import type { FeatureEffectSystem } from './FeatureEffectSystem';
import type { DataAccessLayer } from './DataAccessLayer';
import type { Entity } from './SystemTypes';
import type { SpellcastingClassFeature } from '$lib/domain/character/CharacterTypes';
import { classFeatureEffectDefinitions } from './configs/ClassFeatureConfigs';

/**
 * Definition of a class feature effect
 */
export interface ClassFeatureEffectDefinition {
  effectType: 'numeric' | 'boolean' | 'override';
  target: string;
  type: string;
  value: number | boolean | string;
  priority: number;
  condition?: string;
}

/**
 * ClassFeatureSystem - Manages class features and their effects
 */
export class ClassFeatureSystem {
  /**
   * Constructor
   * @param featureEffectSystem System for registering feature effects
   * @param dataLayer Data access layer for retrieving feature data
   */
  constructor(
    private featureEffectSystem: FeatureEffectSystem,
    private dataLayer: DataAccessLayer
  ) {}

  /**
   * Apply all class features for a character
   * Processes features and registers their effects
   */
  async applyFeatures(character: CompleteCharacter): Promise<void> {
    console.log(`[CLASS FEATURE SYSTEM] Applying features for character ${character.id}`);
    
    // Clear existing class feature effects
    this.clearClassFeatureEffects();
    
    // Process features to get structured data
    const processedFeatures = await this.processClassFeatures(character);
    
    // Create entity for registration
    const entity: Entity = {
      id: character.id || 0,
      character
    };
    
    // Register effects for each feature
    for (const feature of processedFeatures) {
      await this.registerFeatureEffects(entity, feature);
    }
    
    console.log(`[CLASS FEATURE SYSTEM] Registered effects for ${processedFeatures.length} features`);
  }
  
  /**
   * Register effects for a specific feature
   * Uses data-driven approach with fallback to benefit-based registration
   */
  private async registerFeatureEffects(entity: Entity, feature: ProcessedClassFeature): Promise<void> {
    // Skip if feature has no benefits or is replaced
    if (feature.replaced_feature_ids && feature.replaced_feature_ids.length > 0) {
      console.log(`[CLASS FEATURE SYSTEM] Skipping replaced feature: ${feature.name}`);
      return;
    }
    
    const featureName = feature.name?.toLowerCase().replace(/\s+/g, '_');
    if (!featureName) return;
    
    // Get effect definitions from configuration
    const effectDefinitions = classFeatureEffectDefinitions[featureName] || [];
    
    // If we have configurations, use them
    if (effectDefinitions.length > 0) {
      this.registerConfiguredFeatureEffects(entity, feature, effectDefinitions);
    }
    // Otherwise, try to extract effects from benefits
    else if (feature.class_feature_benefit && feature.class_feature_benefit.length > 0) {
      this.registerBenefitBasedEffects(entity, feature);
    }
    // Log if no effects found
    else {
      console.warn(`[CLASS FEATURE SYSTEM] No effect definitions found for feature: ${feature.name}`);
    }
  }
  
  /**
   * Register effects based on configured definitions
   */
  private registerConfiguredFeatureEffects(
    entity: Entity, 
    feature: ProcessedClassFeature,
    effectDefinitions: ClassFeatureEffectDefinition[]
  ): void {
    for (const def of effectDefinitions) {
      const effectId = `class_feature_${feature.id}_${def.target}`;
      const source = `${feature.name} (${feature.class_name})`;
      
      // Register based on effect type
      if (def.effectType === 'numeric' && typeof def.value === 'number') {
        // Handle level-based scaling for certain effects
        let value = def.value;
        if (def.target === 'sneak_attack_dice') {
          value = Math.ceil(feature.level / 2);
        } else if (def.target === 'save_reflex' && def.condition === 'against_traps') {
          value = Math.floor(feature.level / 4) + 1;
        }
        
        this.featureEffectSystem.registerNumericEffect({
          id: effectId,
          entityId: entity.id,
          target: def.target,
          value,
          source,
          type: def.type,
          priority: def.priority,
          condition: def.condition
        });
      } 
      else if (def.effectType === 'boolean' && typeof def.value === 'boolean') {
        this.featureEffectSystem.registerBooleanEffect({
          id: effectId,
          entityId: entity.id,
          target: def.target,
          value: def.value,
          source,
          priority: def.priority,
          condition: def.condition
        });
      }
      else if (def.effectType === 'override' && typeof def.value === 'string') {
        this.featureEffectSystem.registerOverrideEffect({
          id: effectId,
          entityId: entity.id,
          target: def.target,
          value: def.value,
          source,
          priority: def.priority,
          condition: def.condition
        });
      }
    }
    
    console.log(`[CLASS FEATURE SYSTEM] Registered configured effects for ${feature.name}`);
  }
  
  /**
   * Register effects based on class_feature_benefit entries
   */
  private registerBenefitBasedEffects(entity: Entity, feature: ProcessedClassFeature): void {
    if (!feature.class_feature_benefit) return;
    
    for (const benefit of feature.class_feature_benefit) {
      const bonuses = benefit.class_feature_benefit_bonus || [];
      
      for (const bonus of bonuses) {
        const target = bonus.target_specifier?.name;
        
        if (target && bonus.value !== null && bonus.value !== undefined) {
          const effectId = `class_feature_${feature.id}_${target}`;
          const source = `${feature.name} (${feature.class_name})`;
          const type = bonus.bonus_type?.name || 'untyped';
          
          if (typeof bonus.value === 'number') {
            this.featureEffectSystem.registerNumericEffect({
              id: effectId,
              entityId: entity.id,
              target,
              value: bonus.value,
              source,
              type,
              priority: 30
            });
          } else if (typeof bonus.value === 'boolean') {
            this.featureEffectSystem.registerBooleanEffect({
              id: effectId,
              entityId: entity.id,
              target,
              value: bonus.value,
              source,
              priority: 30
            });
          } else if (typeof bonus.value === 'string') {
            this.featureEffectSystem.registerOverrideEffect({
              id: effectId,
              entityId: entity.id,
              target,
              value: bonus.value,
              source,
              priority: 30
            });
          }
        }
      }
    }
    
    console.log(`[CLASS FEATURE SYSTEM] Registered benefit-based effects for ${feature.name}`);
  }
  
  /**
   * Clear all class feature effects
   */
  private clearClassFeatureEffects(): void {
    this.featureEffectSystem.removeEffectsBySourcePrefix('class_feature_');
  }
  
  /**
   * Process class features for a character
   * This is based on the existing code in CharacterFeatures.ts
   */
  async processClassFeatures(character: CompleteCharacter): Promise<ProcessedClassFeature[]> {
    // First try server data
    try {
      const serverFeatures = await this.dataLayer.getProcessedClassFeatures(
        character.id,
        this.calculateTotalLevel(character)
      );
      
      if (serverFeatures.length > 0) {
        return serverFeatures.map(feature => ({
          ...feature,
          type: this.normalizeFeatureType(feature.type)
        }));
      }
    } catch (error) {
      console.warn('Failed to get features from server, falling back to local processing');
    }
    
    // Fall back to local processing
    // This should be a complete implementation, not a placeholder
    return this.locallyProcessClassFeatures(character);
  }
  
  /**
   * Process class features locally
   */
  private locallyProcessClassFeatures(character: CompleteCharacter): ProcessedClassFeature[] {
    const processedFeatures: ProcessedClassFeature[] = [];
    
    // Get all character classes
    const characterClasses = character.game_character_class || [];
    
    // Process each class
    for (const charClass of characterClasses) {
      // Skip if no class or level
      if (!charClass.class || !charClass.level) continue;
      
      // Get features for this class up to the character's level
      const classFeatures = charClass.class.class_feature || [];
      
      // Add each feature that's available at the character's level
      for (const feature of classFeatures) {
        if (feature.level && feature.level <= charClass.level) {
          processedFeatures.push({
            id: feature.id,
            name: feature.name,
            level: feature.level,
            class_id: charClass.class_id,
            class_name: charClass.class.name,
            type: this.normalizeFeatureType(feature.type),
            description: feature.description,
            replaced_feature_ids: [],
            class_feature_benefit: feature.class_feature_benefit || []
          });
        }
      }
    }
    
    return processedFeatures;
  }
  
  /**
   * Helper to calculate total character level
   */
  private calculateTotalLevel(character: CompleteCharacter): number {
    return (character.game_character_class ?? []).reduce(
      (acc: number, cls: any) => acc + (cls.level || 0), 0
    );
  }
  
  /**
   * Normalize feature type to a standard format
   */
  private normalizeFeatureType(type: string | null | undefined): string {
    if (!type) return 'Ex';
    
    // Normalize to uppercase first letter, lowercase rest
    const normalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    
    // Make sure it's one of the valid types
    if (['Ex', 'Su', 'Sp'].includes(normalized)) {
      return normalized;
    }
    
    return 'Ex'; // Default to extraordinary ability
  }
  
  /**
   * Find spellcasting feature for a character class
   */
  findSpellcastingFeature(charClass: any): SpellcastingClassFeature | undefined {
    if (!charClass || !charClass.class || !charClass.class.class_feature) {
      return undefined;
    }
    
    // Look for spellcasting feature
    return charClass.class.class_feature.find((feature: any) => 
      feature.type?.toLowerCase() === 'spellcasting'
    ) as SpellcastingClassFeature;
  }
} 