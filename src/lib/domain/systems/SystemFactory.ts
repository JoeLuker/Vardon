import type { CompleteCharacter } from '$lib/db/gameRules.api';
import { FeatureEffectSystem } from './FeatureEffectSystem';
import { CorruptionSystem } from './CorruptionSystem';
import { FeatSystem } from './FeatSystem';
import { TraitSystem } from './TraitSystem';
import { ClassFeatureSystem } from './ClassFeatureSystem';
import { DataAccessLayer } from './DataAccessLayer';
import { BonusSystem } from './BonusSystem';
import { AbpSystem } from './AbpSystem';
import { SizeSystem } from './SizeSystem';
import type { Entity } from './SystemTypes';

/**
 * Creates and configures all character systems
 * Makes dependencies explicit and visible
 */
export class SystemFactory {
  // All systems available for explicit dependency injection
  readonly featureEffectSystem: FeatureEffectSystem;
  readonly bonusSystem: BonusSystem;
  readonly abpSystem: AbpSystem;
  readonly sizeSystem: SizeSystem;
  readonly corruptionSystem: CorruptionSystem;
  readonly featSystem: FeatSystem;
  readonly traitSystem: TraitSystem;
  readonly classFeatureSystem: ClassFeatureSystem;
  
  constructor(private dataAccessLayer: DataAccessLayer) {
    // Create all systems with explicit dependencies
    this.featureEffectSystem = new FeatureEffectSystem();
    
    this.bonusSystem = new BonusSystem(this.featureEffectSystem);
    this.abpSystem = new AbpSystem(this.dataAccessLayer, this.featureEffectSystem);
    this.sizeSystem = new SizeSystem(this.featureEffectSystem);
    this.corruptionSystem = new CorruptionSystem(this.featureEffectSystem);
    this.featSystem = new FeatSystem(this.featureEffectSystem);
    this.traitSystem = new TraitSystem(this.featureEffectSystem);
    this.classFeatureSystem = new ClassFeatureSystem(this.featureEffectSystem, this.dataAccessLayer);
  }
  
  /**
   * Convert character to entity for system use
   */
  private characterToEntity(character: CompleteCharacter): Entity {
    return {
      id: character.id || 0,
      character
    };
  }
  
  /**
   * Apply all systems to a character
   * This is a convenience method for applying all systems
   */
  async applyAllSystems(character: CompleteCharacter): Promise<void> {
    // Clear all previous effects
    this.featureEffectSystem.clearAllEffects();
    
    // Create entity
    const entity = this.characterToEntity(character);
    
    // Extract character size
    const baseSize = character.game_character_ancestry?.[0]?.ancestry?.size || 'medium';
    
    // Apply size system first
    this.sizeSystem.applySizeEffects(entity, baseSize);
    
    // Calculate character level
    const characterLevel = this.getCharacterLevel(character);
    
    // Apply ABP system effects
    const selectedAbpNodeIds = (character.game_character_abp_choice || [])
      .map(choice => choice.node_id)
      .filter(id => id !== undefined && id !== null) as number[];
    
    await this.abpSystem.applyAbpBonuses(entity, characterLevel, selectedAbpNodeIds);
    
    // Apply all feature systems in sequence
    await this.corruptionSystem.loadManifestations(character);
    await this.featSystem.loadFeats(character);
    await this.traitSystem.loadTraits(character);
    await this.classFeatureSystem.applyFeatures(character);
  }
  
  /**
   * Helper method to get character level
   */
  private getCharacterLevel(character: CompleteCharacter): number {
    return (character.game_character_class || []).reduce(
      (total, charClass) => total + (charClass.level || 0),
      0
    );
  }
  
  /**
   * Get the DataAccessLayer used by this factory
   */
  getDataAccessLayer(): DataAccessLayer {
    return this.dataAccessLayer;
  }
} 