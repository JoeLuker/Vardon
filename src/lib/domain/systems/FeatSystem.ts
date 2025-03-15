import type { CompleteCharacter } from '$lib/db/gameRules.api';
import type { FeatureEffectSystem } from './FeatureEffectSystem';
import { featEffectDefinitions } from './configs/FeatConfigs';

/**
 * Represents a feat with its data and effects
 */
export interface FeatData {
  id: number;
  name: string;
  label: string | null;
}

/**
 * Definition of a feat effect
 */
export interface FeatEffectDefinition {
  effectType: 'numeric' | 'boolean' | 'override';
  target: string;
  type: string;
  value: number | boolean | string;
  priority: number;
  condition?: string;
}

/**
 * Handles feat effects on characters using a purely data-driven approach
 */
export class FeatSystem {
  private registeredFeats: Set<string> = new Set();
  
  constructor(
    private featureEffectSystem: FeatureEffectSystem,
  ) {}
  
  /**
   * Load all feats from a character and register their effects
   */
  async loadFeats(character: CompleteCharacter): Promise<void> {
    // Clear existing feat effects
    this.clearFeatEffects();
    this.registeredFeats.clear();
    
    // Load character's feats
    const charFeats = character.game_character_feat || [];
    
    // Process each feat to register its effects
    for (const charFeat of charFeats) {
      const feat = charFeat.feat;
      if (!feat) continue;
      
      const featName = feat.name?.toLowerCase();
      if (!featName) continue;
      
      // Skip if already registered
      if (this.registeredFeats.has(featName)) continue;
      
      // Mark as registered to avoid duplicates
      this.registeredFeats.add(featName);
      
      // Register feat effects
      this.registerFeatEffects(feat);
    }
  }
  
  /**
   * Register effects for a feat using data-driven configuration
   */
  private registerFeatEffects(feat: FeatData): void {
    const featName = feat.name?.toLowerCase();
    if (!featName) return;
    
    // Get effect definitions from configuration
    const effectDefinitions = featEffectDefinitions[featName] || [];
    
    // If no configurations found, log warning and skip
    if (effectDefinitions.length === 0) {
      console.warn(`No effect definitions found for feat: ${feat.name}`);
      return;
    }
    
    // Register each effect from the configuration
    for (const def of effectDefinitions) {
      const effectId = `feat_${feat.id}_${def.target}`;
      const source = feat.label || feat.name;
      
      // Register based on effect type
      if (def.effectType === 'numeric' && typeof def.value === 'number') {
        this.featureEffectSystem.registerNumericEffect({
          id: effectId,
          entityId: feat.id,
          target: def.target,
          value: def.value,
          source,
          type: def.type,
          priority: def.priority,
          condition: def.condition
        });
      } 
      else if (def.effectType === 'boolean' && typeof def.value === 'boolean') {
        this.featureEffectSystem.registerBooleanEffect({
          id: effectId,
          entityId: feat.id,
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
          entityId: feat.id,
          target: def.target,
          value: def.value,
          source,
          priority: def.priority,
          condition: def.condition
        });
      }
    }
  }
  
  /**
   * Clear all feat effects
   */
  private clearFeatEffects(): void {
    this.featureEffectSystem.removeEffectsBySourcePrefix('feat_');
  }
} 