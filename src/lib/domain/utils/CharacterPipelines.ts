/**
 * Character Data Pipelines
 * 
 * This module provides Unix-style data transformation pipelines for character data.
 * It implements the pipe-and-filter pattern common in Unix systems.
 */

import type { GameKernel } from '../kernel/GameKernel';
import type { Entity } from '../kernel/types';
import { DataPipeline, CommonTransforms } from './DataPipeline';

/**
 * Character entity data shape
 */
interface CharacterEntity extends Entity {
  capabilities?: {
    ability?: {
      abilities?: Record<string, any>;
    };
    skill?: {
      skills?: Record<string, any>;
    };
    combat?: {
      stats?: Record<string, any>;
    };
    classes?: {
      characterClasses?: any[];
      processedClassFeatures?: any[];
    };
    spellcasting?: {
      spellSlots?: Record<string, any>;
      spells?: any[];
    };
  };
}

/**
 * Character UI model shape - simplified view for UI consumption
 */
interface CharacterUIModel {
  id: string;
  name: string;
  level: number;
  abilities: Record<string, {
    score: number;
    modifier: number;
    bonuses: any[];
  }>;
  skills: Record<string, {
    name: string;
    rank: number;
    total: number;
    bonuses: any[];
  }>;
  combatStats: {
    hp: { current: number; max: number };
    ac: number;
    bab: number;
    saves: Record<string, number>;
  };
  classes: {
    name: string;
    level: number;
    features: any[];
  }[];
  spells: any[];
  spellSlots: Record<string, Record<string, number>>;
}

/**
 * Create a pipeline for transforming a character entity into a UI model
 * @param kernel Kernel for file operations
 * @returns Pipeline for entity to UI model transformation
 */
export function createCharacterToUIModelPipeline(
  kernel: GameKernel
): DataPipeline<CharacterEntity, CharacterUIModel> {
  // Create a data pipeline with appropriate configuration
  return DataPipeline.create<CharacterEntity, CharacterUIModel>(kernel, {
    name: 'character_to_ui_model',
    description: 'Transforms a character entity into a UI model',
    debug: true,
    pipeDir: '/v_tmp/character_pipelines',
    collectMetrics: true,
    retainIntermediateFiles: true
  })
  // Extract basic information
  .pipe(
    entity => ({
      id: entity.id,
      name: entity.properties?.name || 'Unnamed Character',
      entityId: entity.id,
      properties: entity.properties || {}
    }),
    { name: 'extract_basic_info', description: 'Extract basic character information' }
  )
  // Extract abilities
  .pipe(
    data => {
      const abilities = entity => entity.capabilities?.ability?.abilities || {};
      
      return {
        ...data,
        abilities: abilities(data),
        calculatedAbilities: Object.entries(abilities(data) || {}).reduce((acc, [key, value]) => {
          acc[key] = {
            score: value.score || 10,
            modifier: Math.floor((value.score - 10) / 2),
            bonuses: value.bonuses || []
          };
          return acc;
        }, {})
      };
    },
    { name: 'extract_abilities', description: 'Extract and calculate ability scores and modifiers' }
  )
  // Extract skills
  .pipe(
    data => {
      const skillsObj = entity => entity.capabilities?.skill?.skills || {};
      const skills = skillsObj(data);
      
      return {
        ...data,
        skills: Object.entries(skills).reduce((acc, [id, skillData]) => {
          const skill = skillData as any;
          acc[id] = {
            name: skill.name || 'Unknown Skill',
            total: skill.total || 0,
            rank: skill.ranks || 0,
            bonuses: skill.bonuses || []
          };
          return acc;
        }, {})
      };
    },
    { name: 'extract_skills', description: 'Extract skill information' }
  )
  // Extract combat stats
  .pipe(
    data => {
      const combatStats = entity => entity.capabilities?.combat?.stats || {};
      const stats = combatStats(data);
      
      return {
        ...data,
        combatStats: {
          hp: {
            current: data.properties?.current_hp || 0,
            max: stats.hp?.max || 0
          },
          ac: stats.ac?.total || 10,
          bab: stats.bab?.total || 0,
          saves: {
            fortitude: stats.saves?.fortitude?.total || 0,
            reflex: stats.saves?.reflex?.total || 0,
            will: stats.saves?.will?.total || 0
          }
        }
      };
    },
    { name: 'extract_combat_stats', description: 'Extract combat statistics' }
  )
  // Extract classes and features
  .pipe(
    data => {
      const characterClasses = entity => entity.capabilities?.classes?.characterClasses || [];
      const processedFeatures = entity => entity.capabilities?.classes?.processedClassFeatures || [];
      
      const classes = characterClasses(data).map(classInfo => {
        const features = processedFeatures(data)
          .filter(feature => feature.class_name === classInfo.name)
          .sort((a, b) => (a.level || 0) - (b.level || 0));
        
        return {
          name: classInfo.name || 'Unknown Class',
          level: classInfo.level || 0,
          features
        };
      });
      
      return {
        ...data,
        classes,
        level: classes.reduce((sum, cls) => sum + cls.level, 0)
      };
    },
    { name: 'extract_classes', description: 'Extract class information and features' }
  )
  // Extract spells and spell slots
  .pipe(
    data => {
      const spells = entity => entity.capabilities?.spellcasting?.spells || [];
      const spellSlots = entity => entity.capabilities?.spellcasting?.spellSlots || {};
      
      return {
        ...data,
        spells: spells(data),
        spellSlots: spellSlots(data)
      };
    },
    { name: 'extract_spells', description: 'Extract spell information and spell slots' }
  )
  // Final assembly - only keep what the UI needs
  .pipe(
    CommonTransforms.pick([
      'id',
      'name',
      'level',
      'abilities',
      'calculatedAbilities',
      'skills',
      'combatStats',
      'classes',
      'spells',
      'spellSlots'
    ]),
    { name: 'pick_ui_properties', description: 'Pick only the properties needed for the UI' }
  )
  // Transform to final UI model
  .pipe(
    data => ({
      id: data.id,
      name: data.name,
      level: data.level,
      abilities: data.calculatedAbilities,
      skills: data.skills,
      combatStats: data.combatStats,
      classes: data.classes,
      spells: data.spells,
      spellSlots: data.spellSlots
    }),
    { name: 'assemble_ui_model', description: 'Assemble the final UI model' }
  );
}

/**
 * Character ability score pipeline
 * @param kernel Kernel for file operations
 * @returns Pipeline for calculating ability scores
 */
export function createAbilityScorePipeline(
  kernel: GameKernel
): DataPipeline<CharacterEntity, Record<string, { score: number; modifier: number; bonuses: any[] }>> {
  return DataPipeline.create(kernel, {
    name: 'ability_score_pipeline',
    description: 'Calculates ability scores and modifiers'
  })
  // Extract base ability scores
  .pipe(
    entity => {
      const abilities = entity.capabilities?.ability?.abilities || {};
      return { abilities, entity };
    },
    { name: 'extract_base_abilities', description: 'Extract base ability scores' }
  )
  // Add racial bonuses
  .pipe(
    data => {
      const racialBonuses = {};
      
      // Extract racial bonuses from ancestry
      const ancestry = data.entity.capabilities?.ancestry?.ancestryTraits || [];
      for (const trait of ancestry) {
        for (const bonus of trait.bonuses || []) {
          if (bonus.target === 'ability' && bonus.ability) {
            const ability = bonus.ability.toLowerCase();
            if (!racialBonuses[ability]) {
              racialBonuses[ability] = [];
            }
            racialBonuses[ability].push({
              value: bonus.value,
              source: 'Ancestry',
              type: bonus.type || 'racial'
            });
          }
        }
      }
      
      return { ...data, racialBonuses };
    },
    { name: 'add_racial_bonuses', description: 'Add racial bonuses from ancestry' }
  )
  // Add enhancement bonuses
  .pipe(
    data => {
      const enhancementBonuses = {};
      
      // Extract enhancement bonuses from items
      const equipment = data.entity.capabilities?.equipment?.items || [];
      for (const item of equipment) {
        for (const bonus of item.bonuses || []) {
          if (bonus.target === 'ability' && bonus.ability) {
            const ability = bonus.ability.toLowerCase();
            if (!enhancementBonuses[ability]) {
              enhancementBonuses[ability] = [];
            }
            enhancementBonuses[ability].push({
              value: bonus.value,
              source: item.name,
              type: bonus.type || 'enhancement'
            });
          }
        }
      }
      
      return { ...data, enhancementBonuses };
    },
    { name: 'add_enhancement_bonuses', description: 'Add enhancement bonuses from items' }
  )
  // Add ABP bonuses (Automatic Bonus Progression)
  .pipe(
    data => {
      const abpBonuses = {};
      
      // Extract ABP bonuses
      const abpChoices = data.entity.capabilities?.abp?.choices || [];
      for (const choice of abpChoices) {
        for (const bonus of choice.bonuses || []) {
          if (bonus.target === 'ability' && bonus.ability) {
            const ability = bonus.ability.toLowerCase();
            if (!abpBonuses[ability]) {
              abpBonuses[ability] = [];
            }
            abpBonuses[ability].push({
              value: bonus.value,
              source: 'ABP',
              type: bonus.type || 'enhancement'
            });
          }
        }
      }
      
      return { ...data, abpBonuses };
    },
    { name: 'add_abp_bonuses', description: 'Add automatic bonus progression bonuses' }
  )
  // Calculate final ability scores
  .pipe(
    data => {
      const { abilities, racialBonuses, enhancementBonuses, abpBonuses } = data;
      const result = {};
      
      // Calculate for each ability
      for (const [key, value] of Object.entries(abilities)) {
        const base = value.base || 10;
        const racial = racialBonuses[key] || [];
        const enhancement = enhancementBonuses[key] || [];
        const abp = abpBonuses[key] || [];
        
        // Combine all bonuses
        const allBonuses = [...racial, ...enhancement, ...abp];
        
        // Calculate total bonus by type (only highest of each type)
        const bonusByType = {};
        for (const bonus of allBonuses) {
          const type = bonus.type || 'untyped';
          if (!bonusByType[type] || bonusByType[type].value < bonus.value) {
            bonusByType[type] = bonus;
          }
        }
        
        // Sum all bonuses
        const totalBonus = Object.values(bonusByType).reduce((sum, bonus: any) => sum + bonus.value, 0);
        
        // Calculate final score and modifier
        const score = base + totalBonus;
        const modifier = Math.floor((score - 10) / 2);
        
        result[key] = {
          score,
          modifier,
          bonuses: allBonuses
        };
      }
      
      return result;
    },
    { name: 'calculate_final_scores', description: 'Calculate final ability scores and modifiers' }
  );
}

/**
 * Extracts and computes character hitpoints
 * @param kernel Kernel for file operations
 * @returns Pipeline for calculating HP
 */
export function createHitPointsPipeline(
  kernel: GameKernel
): DataPipeline<CharacterEntity, { current: number; max: number; temp: number }> {
  return DataPipeline.create(kernel, {
    name: 'hit_points_pipeline',
    description: 'Calculates character hit points'
  })
  // Extract base HP information
  .pipe(
    entity => {
      const currentHP = entity.properties?.current_hp || 0;
      const tempHP = entity.properties?.temp_hp || 0;
      
      return {
        entity,
        currentHP,
        tempHP,
        maxHP: 0, // Will be calculated
        classes: entity.capabilities?.classes?.characterClasses || []
      };
    },
    { name: 'extract_hp_base', description: 'Extract base HP information' }
  )
  // Calculate class HP
  .pipe(
    data => {
      let classHP = 0;
      
      // Calculate HP from each class
      for (const cls of data.classes) {
        // Get class hit die
        const hitDie = cls.hit_die || 8;
        const level = cls.level || 0;
        
        // First level gets max HP, remaining levels get average
        if (level > 0) {
          const firstLevelHP = hitDie;
          const remainingLevelsHP = (level - 1) * Math.floor(hitDie / 2 + 0.5);
          classHP += firstLevelHP + remainingLevelsHP;
        }
      }
      
      return { ...data, classHP };
    },
    { name: 'calculate_class_hp', description: 'Calculate HP from class levels' }
  )
  // Add Constitution bonus
  .pipe(
    data => {
      const con = data.entity.capabilities?.ability?.abilities?.constitution;
      const conModifier = con ? Math.floor((con.score - 10) / 2) : 0;
      
      // Calculate total character level
      const totalLevel = data.classes.reduce((sum, cls) => sum + (cls.level || 0), 0);
      
      // Add Con bonus to HP (Con mod * total level)
      const conBonus = conModifier * totalLevel;
      
      return { ...data, conBonus };
    },
    { name: 'add_constitution_bonus', description: 'Add Constitution bonus to HP' }
  )
  // Add feat and item bonuses
  .pipe(
    data => {
      let bonusHP = 0;
      
      // Check for Toughness feat
      const hasToughness = (data.entity.capabilities?.feats?.feats || [])
        .some(feat => feat.name === 'Toughness');
      
      if (hasToughness) {
        // Toughness gives 3 HP + 1 per character level
        const totalLevel = data.classes.reduce((sum, cls) => sum + (cls.level || 0), 0);
        bonusHP += 3 + totalLevel;
      }
      
      // Add item bonuses to HP
      for (const item of (data.entity.capabilities?.equipment?.items || [])) {
        for (const bonus of (item.bonuses || [])) {
          if (bonus.target === 'hp') {
            bonusHP += bonus.value || 0;
          }
        }
      }
      
      return { ...data, bonusHP };
    },
    { name: 'add_feat_item_bonuses', description: 'Add feat and item bonuses to HP' }
  )
  // Calculate final HP
  .pipe(
    data => {
      const maxHP = data.classHP + data.conBonus + data.bonusHP;
      
      // Ensure current HP doesn't exceed max
      const currentHP = Math.min(data.currentHP, maxHP);
      
      return {
        current: currentHP,
        max: maxHP,
        temp: data.tempHP
      };
    },
    { name: 'calculate_final_hp', description: 'Calculate final hit point values' }
  );
}

/**
 * Example pipeline usage
 * @param kernel Kernel for file operations
 * @param characterId Character ID to process
 * @returns Processed character UI model
 */
export async function processCharacter(
  kernel: GameKernel,
  characterId: string
): Promise<CharacterUIModel | null> {
  try {
    // Example entity path
    const entityPath = `/v_entity/${characterId}`;
    
    // Check if entity exists
    if (!kernel.exists(entityPath)) {
      console.error(`Character entity not found: ${characterId}`);
      return null;
    }
    
    // Read the entity
    const characterFd = kernel.open(entityPath, 0);
    if (characterFd < 0) {
      console.error(`Failed to open character entity: ${characterId}`);
      return null;
    }
    
    try {
      // Read the entity data
      const entity: CharacterEntity = { id: characterId, properties: {} };
      const [readResult] = kernel.read(characterFd, entity);
      
      if (readResult !== 0) {
        console.error(`Failed to read character entity: ${readResult}`);
        return null;
      }
      
      // Create and execute the pipeline
      const pipeline = createCharacterToUIModelPipeline(kernel);
      const result = await pipeline.execute(entity);
      
      // Return the UI model
      return result.output;
    } finally {
      // Always close the file descriptor
      kernel.close(characterFd);
    }
  } catch (error) {
    console.error(`Error processing character ${characterId}:`, error);
    return null;
  }
}