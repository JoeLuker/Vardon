import type { CompleteCharacter } from '$lib/db/gameRules.api';
import type { FeatureEffectSystem } from './FeatureEffectSystem';
import { manifestationEffectDefinitions } from './configs/CorruptionConfigs';

/**
 * Represents a corruption manifestation with its data and effects
 */
export interface Manifestation {
  id: number;
  name: string;
  label: string | null;
  isActive: boolean;
  corruptionId: number;
  minManifestationLevel: number;
  description?: string | null;
  prerequisites?: Array<{
    prerequisite_manifestation_id: number;
    prerequisite?: {
      id: number;
      name: string;
      label: string | null;
    };
  }>;
}

/**
 * Definition of a manifestation effect
 */
export interface ManifestationEffectDefinition {
  effectType: 'numeric' | 'boolean' | 'override';
  target: string;
  type: string;
  value: number | boolean | string;
  priority: number;
  condition?: string;
}

/**
 * Handles corruption manifestations and their effects on characters
 */
export class CorruptionSystem {
  private manifestations: Array<Manifestation & { effectIds: string[] }> = [];
  
  constructor(
    private featureEffectSystem: FeatureEffectSystem,
  ) {}
  
  /**
   * Load and process all manifestations for a character
   */
  async loadManifestations(character: CompleteCharacter): Promise<void> {
    // Clear existing manifestation effects
    this.clearManifestationEffects();
    this.manifestations = [];
    
    // Get character's manifestations
    const charManifestations = character.game_character_manifestation || [];
    
    // Process each manifestation
    for (const charManifestation of charManifestations) {
      const manifestation = charManifestation.manifestation;
      if (!manifestation) continue;
      
      // Calculate the manifestation level
      const manifestationLevel = calculateManifestationLevel(character, manifestation.id);
      
      // Skip if below minimum level
      if (manifestationLevel < manifestation.minManifestationLevel) continue;
      
      // Skip inactive manifestations
      if (!charManifestation.is_active) continue;
      
      // Add to active manifestations with effect tracking
      const manifestationWithEffects = {
        ...manifestation,
        isActive: true,
        effectIds: []
      };
      
      this.manifestations.push(manifestationWithEffects);
      
      // Register manifestation effects
      this.registerManifestationEffects(manifestationWithEffects, manifestationLevel);
    }
    
    console.log(`[CORRUPTION SYSTEM] Processed ${this.manifestations.length} active manifestations`);
  }
  
  /**
   * Register effects for a manifestation using data-driven configuration
   */
  private registerManifestationEffects(
    manifestation: Manifestation & { effectIds: string[] },
    manifestationLevel: number
  ): void {
    const manifestationName = manifestation.name?.toLowerCase().replace(/\s+/g, '_');
    if (!manifestationName) return;
    
    // Get effect definitions from configuration
    const effectDefinitions = manifestationEffectDefinitions[manifestationName] || [];
    
    // If no configurations found, log warning and skip
    if (effectDefinitions.length === 0) {
      console.warn(`No effect definitions found for manifestation: ${manifestation.name}`);
      return;
    }
    
    // Register each effect from the configuration
    for (const def of effectDefinitions) {
      // Skip effects with level-specific conditions that don't apply
      if (def.condition && def.condition.startsWith('manifestation_level_')) {
        const requiredLevel = parseInt(def.condition.replace('manifestation_level_', ''));
        
        // Handle "2+" style conditions (level 2 or higher)
        if (def.condition.endsWith('+')) {
          const minLevel = parseInt(def.condition.replace('manifestation_level_', '').replace('+', ''));
          if (manifestationLevel < minLevel) continue;
        }
        // Handle exact level matches
        else if (manifestationLevel !== requiredLevel) {
          continue;
        }
      }
      
      const effectId = `manifestation_${manifestation.id}_${def.target}`;
      const source = manifestation.label || manifestation.name;
      
      // Register based on effect type
      if (def.effectType === 'numeric' && typeof def.value === 'number') {
        this.featureEffectSystem.registerNumericEffect({
          id: effectId,
          entityId: manifestation.id,
          target: def.target,
          value: def.value,
          source,
          type: def.type,
          priority: def.priority,
          condition: def.condition
        });
        
        // Track effect ID for later cleanup
        manifestation.effectIds.push(effectId);
      } 
      else if (def.effectType === 'boolean' && typeof def.value === 'boolean') {
        this.featureEffectSystem.registerBooleanEffect({
          id: effectId,
          entityId: manifestation.id,
          target: def.target,
          value: def.value,
          source,
          priority: def.priority,
          condition: def.condition
        });
        
        // Track effect ID for later cleanup
        manifestation.effectIds.push(effectId);
      }
      else if (def.effectType === 'override' && typeof def.value === 'string') {
        this.featureEffectSystem.registerOverrideEffect({
          id: effectId,
          entityId: manifestation.id,
          target: def.target,
          value: def.value,
          source,
          priority: def.priority,
          condition: def.condition
        });
        
        // Track effect ID for later cleanup
        manifestation.effectIds.push(effectId);
      }
    }
    
    console.log(`[CORRUPTION SYSTEM] Registered ${manifestation.effectIds.length} effects for manifestation ${manifestation.name}`);
  }
  
  /**
   * Clear all manifestation effects
   */
  private clearManifestationEffects(): void {
    // First remove all active manifestation effect IDs
    for (const manifestation of this.manifestations) {
      for (const effectId of manifestation.effectIds) {
        this.featureEffectSystem.removeEffect(effectId);
      }
    }
    
    // Then clear all by prefix as a safety measure
    this.featureEffectSystem.removeEffectsBySourcePrefix('manifestation_');
  }
  
  /**
   * Get all active manifestations
   */
  getActiveManifestations(): Manifestation[] {
    return this.manifestations;
  }
  
  /**
   * Check if a specific manifestation is active
   */
  isManifestationActive(manifestationId: number): boolean {
    return this.manifestations.some(m => m.id === manifestationId);
  }
}

/**
 * Helper function to calculate manifestation level
 */
function calculateManifestationLevel(character: CompleteCharacter, manifestationId: number): number {
  // Count the number of manifestation instances for this corruption
  const instances = (character.game_character_manifestation || [])
    .filter(m => m.manifestation?.corruptionId === 
             character.game_character_manifestation?.find(
               cm => cm.manifestation_id === manifestationId
             )?.manifestation?.corruptionId)
    .length;
  
  return instances;
} 