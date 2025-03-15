import type { CompleteCharacter } from '$lib/db/gameRules.api';
import type { CharacterSheet } from './CharacterSheetCalculator';
import type { Entity } from '$lib/domain/systems/SystemTypes';
import type { FeatureEffectSystem } from '$lib/domain/systems/FeatureEffectSystem';
import type { AbilityEngine } from '$lib/domain/systems/engines/AbilityEngine';
import type { SavingThrowEngine } from '$lib/domain/systems/engines/SavingThrowEngine';
import type { AttackEngine } from '$lib/domain/systems/engines/AttackEngine';
import type { ArmorEngine } from '$lib/domain/systems/engines/ArmorEngine';
import type { SkillEngine } from '$lib/domain/systems/engines/SkillEngine';
import { calculateTotalCharacterLevel } from './utils/CharacterUtils';
import { CapabilityFactory } from '$lib/domain/capabilities/CapabilityFactory';
import type { SkillCapability } from '$lib/domain/capabilities/SkillCapability';

/**
 * Character Calculator
 * Uses explicit engine dependencies for calculations
 */
export class CharacterCalculator {
  /**
   * Constructor with explicit engine dependencies
   */
  constructor(
    private abilityEngine: AbilityEngine,
    private savingThrowEngine: SavingThrowEngine,
    private attackEngine: AttackEngine,
    private armorEngine: ArmorEngine,
    private skillEngine: SkillEngine,
    private featureEffectSystem: FeatureEffectSystem
  ) {
    // Create capability factory with explicit dependencies
    this.capabilityFactory = new CapabilityFactory(
      featureEffectSystem,
      skillEngine,
      attackEngine,
      armorEngine,
      abilityEngine
    );
  }
  
  /**
   * Convert a CompleteCharacter to an Entity for engine use
   */
  private characterToEntity(character: CompleteCharacter): Entity {
    return {
      id: character.id || 0,
      character
    };
  }
  
  /**
   * Calculate the full character sheet
   */
  calculateCharacterSheet(character: CompleteCharacter): CharacterSheet {
    console.log(`[CALCULATOR] Calculating character sheet for ${character.name} (ID: ${character.id})`);
    
    // Convert character to entity
    const entity = this.characterToEntity(character);
    
    // Get base ability scores from character data
    const baseAbilityScores = this.getBaseAbilityScores(character);
    
    // Calculate ability scores using explicit AbilityEngine
    const abilityScores = this.abilityEngine.calculateAllAbilityScores(
      entity,
      baseAbilityScores
    );
    
    // Calculate ability modifiers
    const strMod = this.abilityEngine.calculateAbilityModifier(abilityScores.strength.total);
    const dexMod = this.abilityEngine.calculateAbilityModifier(abilityScores.dexterity.total);
    const conMod = this.abilityEngine.calculateAbilityModifier(abilityScores.constitution.total);
    const intMod = this.abilityEngine.calculateAbilityModifier(abilityScores.intelligence.total);
    const wisMod = this.abilityEngine.calculateAbilityModifier(abilityScores.wisdom.total);
    const chaMod = this.abilityEngine.calculateAbilityModifier(abilityScores.charisma.total);
    
    // Get size category
    const sizeCategory = this.getSizeCategory(character);
    
    // Calculate AC using explicit ArmorEngine
    const acResults = this.armorEngine.calculateACSet(
      entity,
      dexMod,
      sizeCategory
    );
    
    // Calculate saves using explicit SavingThrowEngine
    const fortitudeSave = this.savingThrowEngine.calculateSavingThrow(
      entity,
      'fortitude',
      abilityScores.constitution.total,
      'Fortitude'
    );
    
    const reflexSave = this.savingThrowEngine.calculateSavingThrow(
      entity,
      'reflex',
      abilityScores.dexterity.total,
      'Reflex'
    );
    
    const willSave = this.savingThrowEngine.calculateSavingThrow(
      entity,
      'will',
      abilityScores.wisdom.total,
      'Will'
    );
    
    // Calculate attacks using explicit AttackEngine
    const attacks = this.attackEngine.calculateAttacks(entity);
    
    // Calculate initiative (dexterity-based)
    const initiative = this.abilityEngine.applyAbilityBonusStacking(
      'initiative',
      dexMod,
      this.featureEffectSystem.getNumericEffects('initiative').map(e => ({
        source: e.source,
        value: e.value as number,
        type: e.type
      }))
    );
    
    // Calculate skills
    const abilityModifiers = {
      strength: strMod,
      dexterity: dexMod,
      constitution: conMod,
      intelligence: intMod,
      wisdom: wisMod,
      charisma: chaMod
    };
    const skills = this.calculateSkills(entity, abilityModifiers);
    
    // Get class features
    const classFeatures = this.getProcessedClassFeatures(character);
    
    // Build the complete character sheet
    return {
      id: character.id || 0,
      name: character.name || 'Unknown',
      level: calculateTotalCharacterLevel(character),
      
      // Ability scores
      abilityScores,
      
      // Combat stats
      combat: {
        ac: acResults.normal,
        touchAC: acResults.touch,
        flatFootedAC: acResults.flatFooted,
        initiative,
        baseAttackBonus: [this.attackEngine.getHighestBAB(entity)],
        meleeAttack: attacks.melee,
        rangedAttack: attacks.ranged,
        cmb: attacks.cmb,
        cmd: attacks.cmd,
        bomb: attacks.bomb
      },
      
      // Saving throws
      saves: {
        fortitude: fortitudeSave,
        reflex: reflexSave,
        will: willSave
      },
      
      // Skills
      skills,
      
      // Class features
      classFeatures,
      
      // Placeholder for equipment
      equipment: {
        armor: [],
        weapons: [],
        items: []
      },
      
      // Placeholder for spellcasting
      spellcasting: {
        classes: [],
        spellsKnown: [],
        spellsPerDay: []
      }
    };
  }
  
  /**
   * Get base ability scores from character data
   */
  private getBaseAbilityScores(character: CompleteCharacter): Record<string, number> {
    return {
      strength: character.game_character_ability?.find(a => 
        a.ability?.name?.toLowerCase() === 'strength')?.value || 10,
      dexterity: character.game_character_ability?.find(a => 
        a.ability?.name?.toLowerCase() === 'dexterity')?.value || 10,
      constitution: character.game_character_ability?.find(a => 
        a.ability?.name?.toLowerCase() === 'constitution')?.value || 10,
      intelligence: character.game_character_ability?.find(a => 
        a.ability?.name?.toLowerCase() === 'intelligence')?.value || 10,
      wisdom: character.game_character_ability?.find(a => 
        a.ability?.name?.toLowerCase() === 'wisdom')?.value || 10,
      charisma: character.game_character_ability?.find(a => 
        a.ability?.name?.toLowerCase() === 'charisma')?.value || 10
    };
  }
  
  /**
   * Get size category from character data
   */
  private getSizeCategory(character: CompleteCharacter): string {
    // Check for size effects first
    if (this.featureEffectSystem) {
      const sizeEffects = this.featureEffectSystem.getEffectsForTarget('effective_size');
      if (sizeEffects.length > 0) {
        // Get highest priority size effect
        const sortedEffects = [...sizeEffects].sort((a, b) => 
          (b.priority || 0) - (a.priority || 0)
        );
        
        const value = sortedEffects[0].value;
        if (typeof value === 'string') {
          return value.toLowerCase();
        }
      }
    }
    
    // Fall back to ancestry size
    return (character.game_character_ancestry?.[0]?.ancestry?.size || 'medium').toLowerCase();
  }
  
  /**
   * Calculate skills for a character using the skill capability
   */
  private calculateSkills(
    entity: Entity, 
    abilityModifiers: Record<string, number>
  ): Record<number, any> {
    // Get skill capability
    const skillCapability = this.capabilityFactory.getCapability<SkillCapability>('skill');
    
    // Use capability to get all skills
    if (skillCapability) {
      return skillCapability.getAllSkills(entity);
    }
    
    // Fallback to direct engine use
    return this.skillEngine.calculateAllSkills(
      entity,
      abilityModifiers
    );
  }
  
  /**
   * Get processed class features
   */
  private getProcessedClassFeatures(character: CompleteCharacter): Array<{
    id: number;
    name: string;
    description: string;
    level: number;
    className: string;
  }> {
    // This would ideally use the ClassFeatureSystem's processing,
    // but for simplicity we'll use a basic implementation
    const features: Array<{
      id: number;
      name: string;
      description: string;
      level: number;
      className: string;
    }> = [];
    
    // Get features from each class
    if (character.game_character_class) {
      for (const charClass of character.game_character_class) {
        if (charClass.class?.class_feature) {
          for (const feature of charClass.class.class_feature) {
            if (feature.level && feature.level <= (charClass.level || 0)) {
              features.push({
                id: feature.id,
                name: feature.name,
                description: feature.description || '',
                level: feature.level,
                className: charClass.class.name
              });
            }
          }
        }
      }
    }
    
    return features;
  }
  
  /**
   * Get the capabilities factory
   */
  getCapabilityFactory(): CapabilityFactory {
    return this.capabilityFactory;
  }
} 