import type { CompleteCharacter } from '$lib/db/gameRules.api';
import type { FeatureEffectSystem } from './FeatureEffectSystem';
import { traitEffectDefinitions } from './configs/TraitConfigs';

/**
 * Represents a trait with its data and effects
 */
export interface TraitData {
  id: number;
  name: string;
  label: string | null;
}

/**
 * Definition of a trait effect
 */
export interface TraitEffectDefinition {
  effectType: 'numeric' | 'boolean' | 'override';
  target: string;
  type: string;
  value: number | boolean | string;
  priority: number;
  condition?: string;
}

/**
 * Handles trait effects on characters using a data-driven approach
 */
export class TraitSystem {
  private registeredTraits: Set<string> = new Set();
  
  constructor(
    private featureEffectSystem: FeatureEffectSystem,
  ) {}
  
  /**
   * Load all traits from a character and register their effects
   */
  async loadTraits(character: CompleteCharacter): Promise<void> {
    // Clear existing trait effects
    this.clearTraitEffects();
    this.registeredTraits.clear();
    
    // Load character's traits
    const charTraits = character.game_character_trait || [];
    
    // Process each trait to register its effects
    for (const charTrait of charTraits) {
      const trait = charTrait.trait;
      if (!trait) continue;
      
      const traitName = trait.name?.toLowerCase();
      if (!traitName) continue;
      
      // Skip if already registered
      if (this.registeredTraits.has(traitName)) continue;
      
      // Mark as registered to avoid duplicates
      this.registeredTraits.add(traitName);
      
      // Register trait effects
      this.registerTraitEffects(trait);
    }
  }
  
  /**
   * Register effects for a trait using data-driven configuration
   */
  private registerTraitEffects(trait: TraitData): void {
    const traitName = trait.name?.toLowerCase();
    if (!traitName) return;
    
    // Get effect definitions from configuration
    const effectDefinitions = traitEffectDefinitions[traitName] || [];
    
    // If no configurations found, log warning and skip
    if (effectDefinitions.length === 0) {
      console.warn(`No effect definitions found for trait: ${trait.name}`);
      return;
    }
    
    // Register each effect from the configuration
    for (const def of effectDefinitions) {
      const effectId = `trait_${trait.id}_${def.target}`;
      const source = trait.label || trait.name;
      
      // Register based on effect type
      if (def.effectType === 'numeric' && typeof def.value === 'number') {
        this.featureEffectSystem.registerNumericEffect({
          id: effectId,
          entityId: trait.id,
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
          entityId: trait.id,
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
          entityId: trait.id,
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
   * Clear all trait effects
   */
  private clearTraitEffects(): void {
    this.featureEffectSystem.removeEffectsBySourcePrefix('trait_');
  }
} 