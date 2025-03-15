import type { CompleteCharacter } from '$lib/db/gameRules.api';
import { FeatureEffectSystem } from './FeatureEffectSystem';
import { CorruptionSystem } from './CorruptionSystem';
import { FeatSystem } from './FeatSystem';
import { TraitSystem } from './TraitSystem';
import { ClassFeatureSystem } from './ClassFeatureSystem';
import { DataAccessLayer } from './DataAccessLayer';
import type { Entity } from './SystemTypes';
import { BonusSystem } from './BonusSystem';
import { AbpSystem } from './AbpSystem';
import { SizeSystem } from './SizeSystem';
import { calculateTotalCharacterLevel } from '$lib/domain/character/utils/CharacterUtils';
import { SystemRegistry } from './SystemRegistry';

/**
 * Coordinates all character systems and their effects
 * This class provides a central place to manage and apply various systems
 * that affect character calculations
 */
export class CharacterSystems {
  private featureEffectSystem: FeatureEffectSystem;
  private registry: SystemRegistry;
  
  constructor(private dataAccessLayer: DataAccessLayer) {
    // Create system registry for cleaner dependency management
    this.registry = new SystemRegistry();
    
    // Create feature effect system first
    this.featureEffectSystem = new FeatureEffectSystem();
    
    // Register feature effect system in registry
    this.registry.register('featureEffectSystem', this.featureEffectSystem);
    
    // Create and register all systems
    this.initializeSystems();
  }
  
  /**
   * Initialize all systems and register them in the registry
   */
  private initializeSystems(): void {
    // Create systems with feature effect system access
    const bonusSystem = new BonusSystem(this.featureEffectSystem);
    const abpSystem = new AbpSystem(this.dataAccessLayer, this.featureEffectSystem);
    const sizeSystem = new SizeSystem(this.featureEffectSystem);
    const corruptionSystem = new CorruptionSystem(this.featureEffectSystem);
    const featSystem = new FeatSystem(this.featureEffectSystem);
    const traitSystem = new TraitSystem(this.featureEffectSystem);
    const classFeatureSystem = new ClassFeatureSystem(this.featureEffectSystem, this.dataAccessLayer);
    
    // Register all systems in the registry
    this.registry.register('bonusSystem', bonusSystem);
    this.registry.register('abpSystem', abpSystem);
    this.registry.register('sizeSystem', sizeSystem);
    this.registry.register('corruptionSystem', corruptionSystem);
    this.registry.register('featSystem', featSystem);
    this.registry.register('traitSystem', traitSystem);
    this.registry.register('classFeatureSystem', classFeatureSystem);
  }
  
  /**
   * Apply all character system effects for a character
   * This should be called before enriching the character data
   * to ensure all effects are properly registered
   * 
   * @param character The character to apply effects for
   */
  async applyAllSystems(character: CompleteCharacter): Promise<void> {
    // Clear all existing effects from previous characters
    this.clearAllEffects();
    
    // Get systems from registry
    const sizeSystem = this.registry.get<SizeSystem>('sizeSystem');
    const abpSystem = this.registry.get<AbpSystem>('abpSystem');
    const corruptionSystem = this.registry.get<CorruptionSystem>('corruptionSystem');
    const featSystem = this.registry.get<FeatSystem>('featSystem');
    const traitSystem = this.registry.get<TraitSystem>('traitSystem');
    const classFeatureSystem = this.registry.get<ClassFeatureSystem>('classFeatureSystem');
    
    // Apply size system effects
    const baseSize = character.game_character_ancestry?.[0]?.ancestry?.size || 'medium';
    sizeSystem.applySizeEffects(character as unknown as Entity, baseSize);
    
    // Apply ABP system effects
    const totalLevel = calculateTotalCharacterLevel(character);
    const selectedAbpNodeIds = (character.game_character_abp_choice || [])
      .map(choice => choice.node_id)
      .filter(id => id !== undefined && id !== null) as number[];
    
    await abpSystem.applyAbpBonuses(
      character as unknown as Entity, 
      totalLevel, 
      selectedAbpNodeIds
    );
    
    // Apply all feature systems in sequence
    await corruptionSystem.loadManifestations(character);
    await featSystem.loadFeats(character);
    await traitSystem.loadTraits(character);
    await classFeatureSystem.applyFeatures(character);
  }
  
  /**
   * Clear all effects from all systems
   * This ensures no lingering effects from previous calculations
   */
  private clearAllEffects(): void {
    this.featureEffectSystem.clearAllEffects();
  }
  
  /**
   * Get the FeatureEffectSystem instance
   * This allows other components to access the registered effects
   */
  getFeatureEffectSystem(): FeatureEffectSystem {
    return this.featureEffectSystem;
  }
  
  /**
   * Get the SystemRegistry instance
   * This gives access to all registered systems
   */
  getRegistry(): SystemRegistry {
    return this.registry;
  }
  
  /**
   * Get a specific system by key
   */
  getSystem<T>(key: string): T | undefined {
    return this.registry.get<T>(key);
  }
} 