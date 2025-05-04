import type { GameEngine } from '../core/GameEngine';
import type { GameRulesAPI, CompleteCharacter } from '$lib/db/gameRules.api';
import type { AssembledCharacter } from './characterTypes';
import type { 
  AbilitySubsystem, 
  SkillSubsystem, 
  BonusSubsystem, 
  CombatSubsystem,
  ConditionSubsystem,
  SpellcastingSubsystem
} from '../types/SubsystemTypes';
import type { Entity } from '../types/EntityTypes';
import type { FeatureRegistry } from '../config/FeatureRegistry';
import { DatabaseFeatureInitializer } from '../core/DatabaseFeatureInitializer';

/**
 * CharacterAssembler takes raw character data and transforms it into an enriched character
 * by delegating calculations to the appropriate subsystems.
 * 
 * This follows the Unix philosophy by:
 * 1. Doing one thing well (assembling character data)
 * 2. Working with proper interfaces, not implementations
 * 3. Acting as a "pipe" between data sources and UI
 */
export class CharacterAssembler {
  private engine: GameEngine;
  private gameRulesAPI?: GameRulesAPI;
  private featureRegistry?: FeatureRegistry;
  private databaseFeatureInitializer?: DatabaseFeatureInitializer;
  
  constructor(engine: GameEngine, gameRulesAPI?: GameRulesAPI, featureRegistry?: FeatureRegistry) {
    console.log('CharacterAssembler constructor called', {
      hasEngine: !!engine,
      hasGameRulesAPI: !!gameRulesAPI,
      hasFeatureRegistry: !!featureRegistry
    });
    
    this.engine = engine;
    this.gameRulesAPI = gameRulesAPI;
    this.featureRegistry = featureRegistry;
    
    // Create the database feature initializer if we have the required dependencies
    if (gameRulesAPI && featureRegistry) {
      try {
        // Detailed logging before creating the initializer
        console.log('Creating DatabaseFeatureInitializer with:', {
          gameRulesAPI: {
            exists: !!gameRulesAPI,
            hasSupabase: !!gameRulesAPI.supabase,
            hasMethods: typeof gameRulesAPI.getCompleteCharacterData === 'function'
          },
          engine: {
            exists: !!engine,
            hasEvents: !!engine.events,
            hasSubsystems: Array.isArray(engine.getSubsystemNames()) && engine.getSubsystemNames().length > 0
          },
          featureRegistry: {
            exists: !!featureRegistry,
            hasRegisterMethod: typeof featureRegistry.register === 'function',
            hasGetMethod: typeof featureRegistry.get === 'function'
          }
        });
        
        // Import check to ensure the class was properly imported
        if (typeof DatabaseFeatureInitializer !== 'function') {
          throw new Error('DatabaseFeatureInitializer is not a constructor function');
        }
        
        this.databaseFeatureInitializer = new DatabaseFeatureInitializer(
          gameRulesAPI,
          engine,
          featureRegistry
        );
        
        // Verify the instance was created correctly
        if (!this.databaseFeatureInitializer) {
          throw new Error('DatabaseFeatureInitializer constructor returned null or undefined');
        }
        
        // Check if initializer has the required methods
        if (typeof this.databaseFeatureInitializer.initializeFeatures !== 'function') {
          throw new Error('DatabaseFeatureInitializer missing required initializeFeatures method');
        }
        
        console.log('DatabaseFeatureInitializer created successfully');
      } catch (error) {
        console.error('Failed to create DatabaseFeatureInitializer:', error);
        // Continue without the database initializer - will use manual initialization
      }
    } else {
      console.warn('Missing dependencies for DatabaseFeatureInitializer', {
        hasGameRulesAPI: !!gameRulesAPI,
        hasFeatureRegistry: !!featureRegistry
      });
    }
    
    console.log('CharacterAssembler initialized successfully');
  }

  /**
   * Transform a raw character into an enriched character with calculated values
   */
  public async assembleCharacter(character: CompleteCharacter): Promise<AssembledCharacter> {
    // Convert to an entity for processing by subsystems
    const entity = this.createEntityFromCharacter(character);
    
    // Register entity with engine (if not already registered)
    this.engine.registerEntity(entity);
    
    // Get subsystems from engine
    const ability = this.engine.getSubsystem<AbilitySubsystem>('ability');
    const skill = this.engine.getSubsystem<SkillSubsystem>('skill');
    const bonus = this.engine.getSubsystem<BonusSubsystem>('bonus');
    const combat = this.engine.getSubsystem<CombatSubsystem>('combat');
    const condition = this.engine.getSubsystem<ConditionSubsystem>('condition');
    const spellcasting = this.engine.getSubsystem<SpellcastingSubsystem>('spellcasting');
    
    // Check for required subsystems, with more specific error messages
    if (!ability) {
      throw new Error('Required ability subsystem not available');
    }
    if (!skill) {
      throw new Error('Required skill subsystem not available');
    }
    if (!bonus) {
      throw new Error('Required bonus subsystem not available');
    }
    if (!combat) {
      throw new Error('Required combat subsystem not available');
    }
    // Note: spellcasting and condition subsystems are optional
    
    // Initialize all subsystems with entity data
    if (ability.initialize) ability.initialize(entity);
    if (skill.initialize) skill.initialize(entity);
    if (bonus.initialize) bonus.initialize(entity);
    if (combat.initialize) combat.initialize(entity);
    if (condition && condition.initialize) condition.initialize(entity);
    if (spellcasting && spellcasting.initialize) spellcasting.initialize(entity);
    
    // If we have a database feature initializer, use it to apply all features
    if (this.databaseFeatureInitializer) {
      await this.databaseFeatureInitializer.initializeFeatures(entity, character.id);
    } else {
      // Fallback to manual feature application when not connected to the database
      // Apply features in order:
      // 1. Ancestry traits
      await this.applyAncestryTraits(entity, character);
      
      // 2. Class features
      await this.applyClassFeatures(entity, character);
      
      // 3. Feats
      await this.applyFeats(entity, character);
      
      // 4. Equipment
      await this.applyEquipment(entity, character);
      
      // 5. Corruptions/Manifestations
      await this.applyCorruptions(entity, character);
    }
    
    // Calculate total level
    const totalLevel = this.calculateTotalLevel(character);
    
    // Assemble ability scores
    const abilities = {
      strength: ability.getAbilityBreakdown(entity, 'strength'),
      dexterity: ability.getAbilityBreakdown(entity, 'dexterity'),
      constitution: ability.getAbilityBreakdown(entity, 'constitution'),
      intelligence: ability.getAbilityBreakdown(entity, 'intelligence'),
      wisdom: ability.getAbilityBreakdown(entity, 'wisdom'),
      charisma: ability.getAbilityBreakdown(entity, 'charisma'),
    };
    
    // Get ABP node data if present
    const abpNodes = character.game_character_abp_choice?.map(choice => choice.node) || [];
    
    // Get favored class bonus data if present
    const favoredClassBonuses = character.game_character_favored_class_bonus || [];
    
    // Return the enriched character with all calculated values
    return {
      ...character,
      
      // Ability scores with breakdown
      strength: { 
        label: 'Strength',
        modifiers: abilities.strength.bonuses.components.map(c => ({ source: c.source, value: c.value })), 
        total: abilities.strength.total
      },
      dexterity: { 
        label: 'Dexterity',
        modifiers: abilities.dexterity.bonuses.components.map(c => ({ source: c.source, value: c.value })), 
        total: abilities.dexterity.total
      },
      constitution: { 
        label: 'Constitution',
        modifiers: abilities.constitution.bonuses.components.map(c => ({ source: c.source, value: c.value })), 
        total: abilities.constitution.total
      },
      intelligence: { 
        label: 'Intelligence',
        modifiers: abilities.intelligence.bonuses.components.map(c => ({ source: c.source, value: c.value })), 
        total: abilities.intelligence.total
      },
      wisdom: { 
        label: 'Wisdom',
        modifiers: abilities.wisdom.bonuses.components.map(c => ({ source: c.source, value: c.value })), 
        total: abilities.wisdom.total
      },
      charisma: { 
        label: 'Charisma',
        modifiers: abilities.charisma.bonuses.components.map(c => ({ source: c.source, value: c.value })), 
        total: abilities.charisma.total
      },
      
      // Ability modifiers
      strMod: abilities.strength.modifier,
      dexMod: abilities.dexterity.modifier,
      conMod: abilities.constitution.modifier,
      intMod: abilities.intelligence.modifier,
      wisMod: abilities.wisdom.modifier,
      chaMod: abilities.charisma.modifier,
      
      // Saving throws
      saves: {
        fortitude: this.convertSaveBreakdown(combat.getSaveBreakdown(entity, 'fortitude')),
        reflex: this.convertSaveBreakdown(combat.getSaveBreakdown(entity, 'reflex')),
        will: this.convertSaveBreakdown(combat.getSaveBreakdown(entity, 'will'))
      },
      
      // Combat stats
      ac: this.convertValueBreakdown('AC', combat.getACBreakdown(entity).total, combat.getACBreakdown(entity).otherBonuses.components),
      touch_ac: this.convertValueBreakdown('Touch AC', combat.getACBreakdown(entity).touch, combat.getACBreakdown(entity).otherBonuses.components),
      flat_footed_ac: this.convertValueBreakdown('Flat-footed AC', combat.getACBreakdown(entity).flatFooted, combat.getACBreakdown(entity).otherBonuses.components),
      initiative: this.convertValueBreakdown('Initiative', combat.getInitiative(entity), []),
      cmb: this.convertValueBreakdown('CMB', combat.getCMB(entity), []),
      cmd: this.convertValueBreakdown('CMD', combat.getCMD(entity), []),
      
      // Skills
      skills: this.convertSkillBreakdowns(skill.getAllSkills(entity)),
      
      // Attacks
      attacks: {
        melee: this.convertAttackBreakdown(combat.getAttackBreakdown(entity, 'melee')),
        ranged: this.convertAttackBreakdown(combat.getAttackBreakdown(entity, 'ranged')),
        bomb: {
          attack: this.convertValueBreakdown('Bomb Attack', 0, []),
          damage: this.convertValueBreakdown('Bomb Damage', 0, []),
          bombDice: 0
        }
      },
      
      // Character data
      totalLevel,
      skillsWithRanks: this.generateSkillsWithRanks(character, skill, entity),
      processedClassFeatures: [],
      
      // Spellcasting data
      spellcastingClasses: entity.character?.spellcastingClasses || [],
      preparedSpells: spellcasting && entity ? spellcasting.getAllPreparedSpells(entity) : {},
      spellSlots: spellcasting && entity ? spellcasting.getAllSpellSlots(entity) : {},
      
      // Skill points - placeholder implementation
      skillPoints: {
        total: {},
        remaining: {}
      },
      
      // ABP data for UI display
      abpData: {
        nodes: abpNodes,
        appliedBonuses: entity.character.bonuses ? 
          Object.entries(entity.character.bonuses)
            .flatMap(([target, bonuses]) => 
              (bonuses as Array<{value: number, type: string, source: string}>)
                .filter(b => b.source.startsWith('ABP:'))
                .map(b => ({
                  target,
                  ...b
                }))
            ) : []
      },
      
      // Favored Class Bonus data for UI display
      favoredClassData: {
        bonuses: favoredClassBonuses,
        appliedBonuses: entity.character.bonuses ? 
          Object.entries(entity.character.bonuses)
            .flatMap(([target, bonuses]) => 
              (bonuses as Array<{value: number, type: string, source: string}>)
                .filter(b => b.source.includes('Favored Class'))
                .map(b => ({
                  target,
                  ...b
                }))
            ) : [],
        skillRanks: entity.character.favoredClassBonuses?.skillRanks || 0
      }
    };
  }
  
  /**
   * Convert a raw character to an entity for processing
   */
  private createEntityFromCharacter(character: CompleteCharacter): Entity {
    return {
      id: character.id.toString(),
      type: 'character',
      name: character.name || 'Unnamed Character',
      properties: {},
      character: character,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }
    };
  }
  
  /**
   * Calculate total character level
   */
  private calculateTotalLevel(character: CompleteCharacter): number {
    return character.game_character_class?.reduce((sum, classEntry) => sum + (classEntry.level || 0), 0) || 0;
  }
  
  /**
   * Convert a save breakdown to the UI format
   */
  private convertSaveBreakdown(save: any): any {
    return {
      label: save.saveType.charAt(0).toUpperCase() + save.saveType.slice(1),
      modifiers: save.otherBonuses.components.map((c: any) => ({ source: c.source, value: c.value })),
      total: save.total
    };
  }
  
  /**
   * Convert an attack breakdown to the UI format
   */
  private convertAttackBreakdown(attack: any): any {
    return {
      label: 'Attack',
      modifiers: attack.otherBonuses.components.map((c: any) => ({ source: c.source, value: c.value })),
      total: attack.total
    };
  }
  
  /**
   * Convert a generic value with breakdown to the UI format
   */
  private convertValueBreakdown(label: string, total: number, components: any[]): any {
    return {
      label,
      modifiers: components.map((c: any) => ({ source: c.source, value: c.value })),
      total
    };
  }
  
  /**
   * Convert skill breakdowns to the UI format
   */
  private convertSkillBreakdowns(allSkills: Record<number, any>): Record<number, any> {
    const result: Record<number, any> = {};
    
    for (const [skillId, skill] of Object.entries(allSkills)) {
      result[Number(skillId)] = {
        label: skill.skillName,
        modifiers: skill.otherBonuses.components.map((c: any) => ({ source: c.source, value: c.value })),
        total: skill.total,
        overrides: {
          trained_only: skill.isTrainedOnly
        }
      };
    }
    
    return result;
  }
  
  /**
   * Apply ancestry traits to the entity
   */
  private async applyAncestryTraits(entity: Entity, character: CompleteCharacter): Promise<void> {
    if (!character.game_character_ancestry_trait) return;
    
    for (const charTrait of character.game_character_ancestry_trait) {
      if (!charTrait.ancestry_trait) continue;
      
      const trait = charTrait.ancestry_trait;
      const traitId = `ancestry.${trait.name?.toLowerCase().replace(/\s+/g, '_')}`;
      
      try {
        // Try to activate the feature
        await this.engine.activateFeature(traitId, entity, {});
      } catch (err) {
        console.warn(`Failed to apply ancestry trait: ${traitId}`, err);
        
        // Fallback: If no feature exists, apply bonuses directly
        if (trait.ancestry_trait_benefit) {
          for (const benefit of trait.ancestry_trait_benefit) {
            if (!benefit.ancestry_trait_benefit_bonus) continue;
            
            for (const bonus of benefit.ancestry_trait_benefit_bonus) {
              if (!bonus.target_specifier || !bonus.bonus_type) continue;
              
              // Get the bonus subsystem directly
              const bonusSubsystem = this.engine.getSubsystem<BonusSubsystem>('bonus');
              if (bonusSubsystem) {
                bonusSubsystem.addBonus(
                  entity,
                  bonus.target_specifier.name || '',
                  bonus.value || 0,
                  bonus.bonus_type.name || 'untyped',
                  trait.name || 'Ancestry Trait'
                );
              }
            }
          }
        }
      }
    }
  }
  
  /**
   * Apply class features to the entity
   */
  private async applyClassFeatures(entity: Entity, character: CompleteCharacter): Promise<void> {
    if (!character.game_character_class_feature) return;
    
    for (const charFeature of character.game_character_class_feature) {
      if (!charFeature.class_feature) continue;
      
      const feature = charFeature.class_feature;
      const featureId = `class.${feature.name?.toLowerCase().replace(/\s+/g, '_')}`;
      
      try {
        // Try to activate the feature
        await this.engine.activateFeature(featureId, entity, {});
      } catch (err) {
        console.warn(`Failed to apply class feature: ${featureId}`, err);
        
        // Fallback: Apply direct bonuses from feature benefits
        if (feature.class_feature_benefit) {
          for (const benefit of feature.class_feature_benefit) {
            if (!benefit.class_feature_benefit_bonus) continue;
            
            for (const bonus of benefit.class_feature_benefit_bonus) {
              if (!bonus.target_specifier || !bonus.bonus_type) continue;
              
              // Get the bonus subsystem directly
              const bonusSubsystem = this.engine.getSubsystem<BonusSubsystem>('bonus');
              if (bonusSubsystem) {
                bonusSubsystem.addBonus(
                  entity,
                  bonus.target_specifier.name || '',
                  bonus.value || 0,
                  bonus.bonus_type.name || 'untyped',
                  feature.name || 'Class Feature'
                );
              }
            }
          }
        }
      }
    }
  }
  
  /**
   * Apply feats to the entity
   */
  private async applyFeats(entity: Entity, character: CompleteCharacter): Promise<void> {
    if (!character.game_character_feat) return;
    
    for (const charFeat of character.game_character_feat) {
      if (!charFeat.feat) continue;
      
      const feat = charFeat.feat;
      const featId = `feat.${feat.name?.toLowerCase().replace(/\s+/g, '_')}`;
      
      try {
        // Try to activate the feature
        await this.engine.activateFeature(featId, entity, {});
      } catch (err) {
        console.warn(`Failed to apply feat: ${featId}`, err);
      }
    }
  }
  
  /**
   * Apply equipment effects to the entity
   */
  private async applyEquipment(entity: Entity, character: CompleteCharacter): Promise<void> {
    if (!character.game_character_armor) return;
    
    // Apply armor
    for (const charArmor of character.game_character_armor) {
      if (!charArmor.armor) continue;
      
      const armor = charArmor.armor;
      
      // Get the bonus subsystem
      const bonusSubsystem = this.engine.getSubsystem<BonusSubsystem>('bonus');
      if (!bonusSubsystem) continue;
      
      // Apply armor bonus to AC
      bonusSubsystem.addBonus(
        entity,
        'ac',
        armor.ac_bonus || 0,
        'armor',
        armor.name || 'Armor'
      );
      
      // Apply max dex bonus
      if (armor.max_dex_bonus !== undefined && armor.max_dex_bonus !== null) {
        // Store max dex info in entity
        if (!entity.character.armorInfo) entity.character.armorInfo = {};
        entity.character.armorInfo.maxDex = armor.max_dex_bonus;
      }
    }
  }
  
  /**
   * Apply corruption effects to the entity
   */
  private async applyCorruptions(entity: Entity, character: CompleteCharacter): Promise<void> {
    if (!character.game_character_corruption_manifestation) return;
    
    for (const charManifestation of character.game_character_corruption_manifestation) {
      if (!charManifestation.manifestation) continue;
      
      const manifestation = charManifestation.manifestation;
      const manifestationId = `corruption.${manifestation.name?.toLowerCase().replace(/\s+/g, '_')}`;
      
      try {
        // Try to activate the feature
        await this.engine.activateFeature(manifestationId, entity, {});
      } catch (err) {
        console.warn(`Failed to apply corruption manifestation: ${manifestationId}`, err);
      }
    }
  }
  
  /**
   * Generate skills with ranks data
   */
  private generateSkillsWithRanks(character: CompleteCharacter, skill: SkillSubsystem, entity: Entity): any[] {
    const result: any[] = [];
    
    if (!character.game_character_skill_rank) {
      return result;
    }
    
    // Group ranks by skill
    const ranksBySkill: Record<number, { level: number, rank: number }[]> = {};
    const skillNames: Record<number, string> = {};
    
    for (const rankData of character.game_character_skill_rank) {
      if (!ranksBySkill[rankData.skill_id]) {
        ranksBySkill[rankData.skill_id] = [];
        // Store the skill name if available
        if (rankData.skill) {
          skillNames[rankData.skill_id] = rankData.skill.name;
        }
      }
      
      ranksBySkill[rankData.skill_id].push({
        level: rankData.applied_at_level,
        rank: 1 // Each entry represents 1 rank
      });
    }
    
    // Convert to the expected format
    for (const [skillId, ranks] of Object.entries(ranksBySkill)) {
      const skillIdNum = Number(skillId);
      result.push({
        skillId: skillIdNum,
        name: skillNames[skillIdNum] || `Skill ${skillId}`,
        isClassSkill: skill.isClassSkill(entity, skillIdNum),
        skillRanks: ranks
      });
    }
    
    return result;
  }
} 