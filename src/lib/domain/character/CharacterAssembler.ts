import type { GameEngine } from '../core/GameEngine';
import type { CompleteCharacter } from '$lib/db/gameRules.api';
import type { AssembledCharacter } from './characterTypes';
import type { 
  AbilitySubsystem, 
  SkillSubsystem, 
  BonusSubsystem, 
  CombatSubsystem,
  ConditionSubsystem
} from '../types/SubsystemTypes';
import type { Entity } from '../types/EntityTypes';

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
  
  constructor(engine: GameEngine) {
    this.engine = engine;
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
    
    if (!ability || !skill || !bonus || !combat) {
      throw new Error('Required subsystems not available');
    }
    
    // Initialize all subsystems with entity data
    if (ability.initialize) ability.initialize(entity);
    if (skill.initialize) skill.initialize(entity);
    if (bonus.initialize) bonus.initialize(entity);
    if (combat.initialize) combat.initialize(entity);
    if (condition && condition.initialize) condition.initialize(entity);
    
    // Apply features in order:
    // 1. Ancestry traits
    this.applyAncestryTraits(entity, character);
    
    // 2. Class features
    this.applyClassFeatures(entity, character);
    
    // 3. Feats
    this.applyFeats(entity, character);
    
    // 4. Equipment
    this.applyEquipment(entity, character);
    
    // 5. Corruptions/Manifestations
    this.applyCorruptions(entity, character);
    
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
      spellSlots: {},
      
      // Skill points - placeholder implementation
      skillPoints: {
        total: {},
        remaining: {}
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
  private applyAncestryTraits(entity: Entity, character: CompleteCharacter): void {
    if (!character.game_character_ancestry_trait) return;
    
    for (const charTrait of character.game_character_ancestry_trait) {
      if (!charTrait.ancestry_trait) continue;
      
      const trait = charTrait.ancestry_trait;
      const traitId = `ancestry.${trait.name?.toLowerCase().replace(/\s+/g, '_')}`;
      
      try {
        // Try to activate the feature
        this.engine.activateFeature(traitId, entity, {});
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
  private applyClassFeatures(entity: Entity, character: CompleteCharacter): void {
    if (!character.game_character_class_feature) return;
    
    for (const charFeature of character.game_character_class_feature) {
      if (!charFeature.class_feature) continue;
      
      const feature = charFeature.class_feature;
      const featureId = `class.${feature.name?.toLowerCase().replace(/\s+/g, '_')}`;
      
      try {
        // Try to activate the feature
        this.engine.activateFeature(featureId, entity, {});
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
  private applyFeats(entity: Entity, character: CompleteCharacter): void {
    if (!character.game_character_feat) return;
    
    for (const charFeat of character.game_character_feat) {
      if (!charFeat.feat) continue;
      
      const feat = charFeat.feat;
      const featId = `feat.${feat.name?.toLowerCase().replace(/\s+/g, '_')}`;
      
      try {
        // Try to activate the feature
        this.engine.activateFeature(featId, entity, {});
      } catch (err) {
        console.warn(`Failed to apply feat: ${featId}`, err);
      }
    }
  }
  
  /**
   * Apply equipment effects to the entity
   */
  private applyEquipment(entity: Entity, character: CompleteCharacter): void {
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
  private applyCorruptions(entity: Entity, character: CompleteCharacter): void {
    if (!character.game_character_corruption_manifestation) return;
    
    for (const charManifestation of character.game_character_corruption_manifestation) {
      if (!charManifestation.manifestation) continue;
      
      const manifestation = charManifestation.manifestation;
      const manifestationId = `corruption.${manifestation.name?.toLowerCase().replace(/\s+/g, '_')}`;
      
      try {
        // Try to activate the feature
        this.engine.activateFeature(manifestationId, entity, {});
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