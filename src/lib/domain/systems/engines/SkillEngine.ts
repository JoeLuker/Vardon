/**
 * SkillEngine.ts
 *
 * Universal skill calculation engine that implements game rules for skills.
 * This is ABSOLUTELY a system because:
 * - Skill calculation rules are UNIVERSAL
 * - The same calculation applies to ANY ENTITY (characters or monsters)
 * - It's a REUSABLE CALCULATION ENGINE with no character-specific logic
 */

import type { Entity } from '$lib/domain/systems/SystemTypes';
import type { ValueWithBreakdown, BonusEntry } from '$lib/domain/character/CharacterTypes';
import type { FeatureEffectSystem } from '$lib/domain/systems/FeatureEffectSystem';
import { DataAccessLayer } from '$lib/domain/systems/DataAccessLayer';
import type { CompleteCharacter } from '$lib/db/gameRules.api';
import type { SkillWithRanks } from '$lib/domain/character/CharacterTypes';
import { BonusEngine } from '$lib/domain/systems/engines/BonusEngine';

export class SkillEngine {
  private bonusEngine: BonusEngine;
  
  constructor(
    private featureEffectSystem?: FeatureEffectSystem,
    private dataAccessLayer?: DataAccessLayer
  ) {
    this.bonusEngine = new BonusEngine();
    if (featureEffectSystem) {
      this.bonusEngine.setFeatureEffectSystem(featureEffectSystem);
    }
  }

  /**
   * Get the ability modifier used for a skill
   * 
   * @param abilityScores Object containing entity ability scores
   * @param defaultAbility The default ability used for the skill
   * @param overrideAbility Optional override ability
   * @returns The ability modifier value
   */
  getSkillAbilityModifier(
    abilityScores: Record<string, number>,
    defaultAbility: string,
    overrideAbility?: string
  ): {
    abilityMod: number;
    abilityName: string;
  } {
    // Use override ability if specified
    const abilityName = overrideAbility || defaultAbility;
    
    // Get the score from entity
    const abilityScore = abilityScores[abilityName.toLowerCase()] || 10;
    
    // Calculate modifier
    const abilityMod = Math.floor((abilityScore - 10) / 2);
    
    return { abilityMod, abilityName };
  }

  /**
   * Check if a character has chosen to apply their favored class bonus to skill points
   * at the specified level
   */
  async hasFavoredClassSkillBonus(
    gameCharacterId: number,
    level: number
  ): Promise<boolean> {
    try {
      let favoredClassBonuses: Array<any> = []; // Use any for now to avoid complex typing
      
      // Use DataAccessLayer if available, otherwise try direct access if possible
      if (this.dataAccessLayer) {
        favoredClassBonuses = await this.dataAccessLayer.getFavoredClassBonuses(gameCharacterId);
      } else {
        // If we don't have DataAccessLayer, we can't get the data
        console.warn('Unable to check favored class bonuses: DataAccessLayer not available');
        return false;
      }
      
      // Check if there's an entry for this level with choice_id or choice.name matching skill ranks
      return favoredClassBonuses.some((bonus: any) => {
        // Check if the level matches
        if (bonus.level !== level) return false;
        
        // Check if this is a skill ranks bonus
        if (bonus.choice?.name === 'skill') return true;
        
        // If we don't have the choice name but have the choice_id, check if it's 26 (skill ranks)
        // This is based on the favored_class_choice values in pathfinder_data.yaml
        if (bonus.choice_id === 26) return true;
        
        return false;
      });
    } catch (error) {
      console.error('Error checking favored class skill bonus:', error);
      return false;
    }
  }

  /**
   * Calculate the class skill bonus
   * 
   * Core rule: If a skill is a class skill and you have at least 1 rank, 
   * you get a +3 bonus
   */
  getClassSkillBonus(isClassSkill: boolean, ranks: number): number {
    return (isClassSkill && ranks > 0) ? 3 : 0;
  }

  /**
   * Apply armor check penalty to applicable skills
   */
  applyArmorCheckPenalty(
    skillName: string,
    armorCheckPenalty: number
  ): number {
    // List of skills affected by armor check penalty
    const acpSkills = [
      'acrobatics', 'climb', 'escape artist', 'fly', 
      'ride', 'sleight of hand', 'stealth', 'swim'
    ];
    
    return acpSkills.includes(skillName.toLowerCase()) ? armorCheckPenalty : 0;
  }

  /**
   * Calculate a skill with all applicable bonuses
   */
  calculateSkill(
    entity: Entity,
    skillName: string,
    abilityModifier: number,
    abilityName: string,
    ranks: number = 0,
    isClassSkill: boolean = false,
    armorCheckPenalty: number = 0,
    miscBonuses: BonusEntry[] = [],
    isTrainedOnly: boolean = false
  ): ValueWithBreakdown {
    // Use entity for potential future feature effects
    const entityId = entity.id; // Just access a property to satisfy the linter
    
    // Check if character can use this skill untrained
    let canUseUntrained = !isTrainedOnly || ranks > 0;
    
    // Check for special features that allow using this skill untrained
    if (isTrainedOnly && ranks === 0 && this.featureEffectSystem) {
      // First check if there's a general override for all trained-only skills
      const canUseAllUntrained = this.featureEffectSystem.applyBooleanEffects('untrained_skills', false);
      
      // Then check for skill category overrides (like knowledge skills)
      let categoryKey = '';
      
      // Handle knowledge skills
      if (skillName.toLowerCase().startsWith('knowledge')) {
        categoryKey = 'untrained_knowledge';
      } 
      // Handle other skill categories as needed
      // else if (someOtherCategory) { categoryKey = 'some_other_key'; }
      
      const canUseCategoryUntrained = categoryKey ? 
        this.featureEffectSystem.applyBooleanEffects(categoryKey, false) : false;
      
      // Finally check for specific skill override
      const normalizedSkillName = skillName.toLowerCase().replace(/\s+/g, '_');
      const specificSkillKey = `untrained_${normalizedSkillName}`;
      const canUseSpecificSkillUntrained = this.featureEffectSystem.applyBooleanEffects(specificSkillKey, false);
      
      // Combine the results - if any permission is granted, allow untrained use
      canUseUntrained = canUseUntrained || canUseAllUntrained || canUseCategoryUntrained || canUseSpecificSkillUntrained;
    }
    
    // If can't use untrained and has no ranks, return minimal result
    if (!canUseUntrained) {
      return {
        label: skillName,
        modifiers: [],
        total: 0,
        overrides: {
          trained_only: true
        }
      };
    }
    
    // Start building modifiers array
    const modifiers: { source: string; value: number }[] = [];
    
    // Add ability modifier
    modifiers.push({
      source: abilityName,
      value: abilityModifier
    });
    
    // Add ranks
    if (ranks > 0) {
      modifiers.push({
        source: 'Ranks',
        value: ranks
      });
    }
    
    // Add class skill bonus if applicable
    const classSkillBonus = this.getClassSkillBonus(isClassSkill, ranks);
    if (classSkillBonus !== 0) {
      modifiers.push({
        source: 'Class Skill',
        value: classSkillBonus
      });
    }
    
    // Apply armor check penalty if applicable
    const acpValue = this.applyArmorCheckPenalty(skillName, armorCheckPenalty);
    if (acpValue !== 0) {
      modifiers.push({
        source: 'Armor Check Penalty',
        value: acpValue
      });
    }
    
    // Add all miscellaneous bonuses
    miscBonuses.forEach(bonus => {
      modifiers.push({
        source: bonus.source,
        value: bonus.value
      });
    });
    
    // Calculate total
    const total = modifiers.reduce((sum, mod) => sum + mod.value, 0);
    
    // Return the complete calculation
    return {
      label: skillName,
      modifiers,
      total,
      overrides: isTrainedOnly ? { trained_only: true } : undefined
    };
  }
  
  /**
   * Calculate skill points available per level
   */
  calculateSkillPointsPerLevel(
    intelligence: number,
    baseSkillPoints: number,
    racialBonusSkillPoints: number = 0,
    hasFavoredClassSkillBonus: boolean = false
  ): number {
    // Calculate INT modifier
    const intModifier = Math.floor((intelligence - 10) / 2);
    
    // Add base, int modifier, favored class bonus (if chosen for skills), and racial bonus
    return Math.max(1, baseSkillPoints + intModifier) + 
      (hasFavoredClassSkillBonus ? 1 : 0) + racialBonusSkillPoints;
  }

  /**
   * Calculate total skill points for a character across all levels with a detailed breakdown
   * 
   * @param entity The character entity
   * @param intelligence Intelligence score (not modifier)
   * @param characterClasses Array of character classes with levels and base skill points
   * @param racialBonusSkillPoints Any racial bonuses to skill points
   * @returns Record of skill points by level with breakdowns
   */
  async calculateTotalSkillPoints(
    entity: Entity,
    intelligence: number,
    characterClasses: Array<{
      classId: number,
      level: number,
      baseSkillPoints: number,
      isFavoredClass: boolean
    }>,
    racialBonusSkillPoints: number = 0
  ): Promise<Record<number, ValueWithBreakdown>> {
    const result: Record<number, ValueWithBreakdown> = {};
    const characterId = entity.id;
    
    // Calculate total character level
    const totalLevel = characterClasses.reduce((sum, cls) => sum + cls.level, 0);
    
    // Sort classes by level for consistent processing
    const sortedClasses = [...characterClasses].sort((a, b) => a.level - b.level);
    
    // Map to track which class applies at which character level
    const levelToClassMap: Record<number, {
      classId: number,
      baseSkillPoints: number,
      isFavoredClass: boolean
    }> = {};
    
    // Build a map of character level to class info
    let currentLevel = 1;
    for (const charClass of sortedClasses) {
      for (let i = 0; i < charClass.level; i++) {
        if (currentLevel <= totalLevel) {
          levelToClassMap[currentLevel] = {
            classId: charClass.classId,
            baseSkillPoints: charClass.baseSkillPoints,
            isFavoredClass: charClass.isFavoredClass
          };
          currentLevel++;
        }
      }
    }
    
    // Calculate skill points for each level
    for (let level = 1; level <= totalLevel; level++) {
      const classInfo = levelToClassMap[level];
      
      if (!classInfo) {
        console.warn(`No class info found for level ${level}`);
        continue;
      }
      
      // Check if the character has chosen to apply favored class bonus to skill points at this level
      const hasFCBSkill = await this.hasFavoredClassSkillBonus(characterId, level);
      
      // Calculate skill points for this level
      const skillPoints = this.calculateSkillPointsPerLevel(
        intelligence,
        classInfo.baseSkillPoints,
        racialBonusSkillPoints,
        hasFCBSkill
      );
      
      // Build detailed breakdown
      const modifiers = [
        { source: 'Base', value: classInfo.baseSkillPoints },
        { source: 'INT Modifier', value: Math.floor((intelligence - 10) / 2) }
      ];
      
      // Add FCB if applicable
      if (hasFCBSkill) {
        modifiers.push({ source: 'Favored Class Bonus', value: 1 });
      }
      
      // Add racial bonus if any
      if (racialBonusSkillPoints > 0) {
        modifiers.push({ source: 'Racial Bonus', value: racialBonusSkillPoints });
      }
      
      // Store the result with breakdown
      result[level] = {
        label: `Level ${level} Skill Points`,
        total: skillPoints,
        modifiers
      };
    }
    
    return result;
  }

  /**
   * Calculate remaining skill points by subtracting used ranks
   * 
   * @param totalSkillPoints Record of total skill points by level
   * @param skillRanks Array of skill ranks and their levels
   * @returns Record of remaining skill points by level
   */
  calculateRemainingSkillPoints(
    totalSkillPoints: Record<number, ValueWithBreakdown>,
    skillRanks: Array<{ level: number; skillId: number }> = []
  ): Record<number, number> {
    const result: Record<number, number> = {};
    
    // Initialize all levels with their total points
    for (const [level, pointsData] of Object.entries(totalSkillPoints)) {
      result[Number(level)] = pointsData.total;
    }
    
    // Count ranks used at each level
    const ranksByLevel: Record<number, number> = {};
    
    // Count how many ranks were applied at each level
    for (const rank of skillRanks) {
      const level = rank.level;
      if (!ranksByLevel[level]) {
        ranksByLevel[level] = 0;
      }
      ranksByLevel[level]++;
    }
    
    // Subtract ranks used from total points
    for (const [level, ranksUsed] of Object.entries(ranksByLevel)) {
      const levelNum = Number(level);
      if (result[levelNum] !== undefined) {
        result[levelNum] = Math.max(0, result[levelNum] - ranksUsed);
      }
    }
    
    return result;
  }

  /**
   * Calculate both total and remaining skill points for a character
   * 
   * @param entity The character entity
   * @param intelligence Intelligence score (not modifier)
   * @param characterClasses Array of character classes with levels and base skill points
   * @param skillRanks Array of skill ranks and their levels
   * @param racialBonusSkillPoints Any racial bonuses to skill points
   * @returns Object with total and remaining skill points by level
   */
  async calculateSkillPointsWithRemaining(
    entity: Entity,
    intelligence: number,
    characterClasses: Array<{
      classId: number,
      level: number,
      baseSkillPoints: number,
      isFavoredClass: boolean
    }>,
    skillRanks: Array<{ level: number; skillId: number }> = [],
    racialBonusSkillPoints: number = 0
  ): Promise<{
    total: Record<number, ValueWithBreakdown>;
    remaining: Record<number, number>;
  }> {
    // Calculate total skill points
    const totalPoints = await this.calculateTotalSkillPoints(
      entity,
      intelligence,
      characterClasses,
      racialBonusSkillPoints
    );
    
    // Calculate remaining skill points
    const remainingPoints = this.calculateRemainingSkillPoints(totalPoints, skillRanks);
    
    return {
      total: totalPoints,
      remaining: remainingPoints
    };
  }

  /**
   * Calculate skill modifiers for a character
   * @param entity The character entity
   * @param abilityModifiers Object with ability modifiers
   * @returns Object with skill ID keys and ValueWithBreakdown values
   */
  calculateSkillModifiers(
    entity: any,
    abilityModifiers: Record<string, number>
  ): Record<number, ValueWithBreakdown> {
    const character = entity.character as CompleteCharacter;
    console.log('[SKILLS DEBUG] Starting skill modifiers calculation with ability modifiers:', abilityModifiers);
    
    const result: Record<number, ValueWithBreakdown> = {};
    
    // Get all skills from the character data first
    const characterSkills = character.game_character_skill_rank?.map(rank => rank.skill).filter(Boolean) || [];
    
    // Create a map of all unique skills
    const skillsMap = new Map();
    
    // Add skills with ranks first
    for (const skill of characterSkills) {
      if (skill && skill.id) {
        skillsMap.set(skill.id, skill);
      }
    }
    
    // If we have a complete skill list available from game_skill, add those too
    if (character.game_skill && Array.isArray(character.game_skill)) {
      for (const skill of character.game_skill) {
        if (skill && skill.id) {
          // Only add if not already present (prioritize skill data from ranks)
          if (!skillsMap.has(skill.id)) {
            skillsMap.set(skill.id, skill);
          }
        }
      }
    }
    
    console.log(`[SKILLS DEBUG] Processing ${skillsMap.size} unique skills`);
    
    // Get class skills (set of skill IDs)
    const classSkills = new Set<number>();
    
    // Get list of all ranked skills 
    const skillRanks: Record<number, number> = {};
    
    // Get ranks for each skill from character_skill_rank entries
    for (const rank of (character.game_character_skill_rank || [])) {
      const skillId = rank.skill_id;
      if (!skillId) continue;
      
      // Initialize or increment skill rank
      if (!skillRanks[skillId]) {
        skillRanks[skillId] = 0;
      }
      skillRanks[skillId]++;
      
      // Track if this is a class skill - safely check if the property exists
      if (rank.skill) {
        const isClassSkill = 'is_class_skill' in rank ? rank.is_class_skill === true : false;
        if (isClassSkill) {
          classSkills.add(skillId);
        }
      }
    }
    
    // Map of skill names to ability scores for consistent ability detection
    const skillToAbilityMap: Record<string, string> = {
      // Strength-based skills
      'climb': 'strength',
      'swim': 'strength',
      // Dexterity-based skills
      'acrobatics': 'dexterity',
      'disable_device': 'dexterity',
      'escape_artist': 'dexterity',
      'fly': 'dexterity',
      'ride': 'dexterity',
      'sleight_of_hand': 'dexterity',
      'stealth': 'dexterity',
      // Intelligence-based skills
      'appraise': 'intelligence',
      'craft': 'intelligence',
      'knowledge_arcana': 'intelligence',
      'knowledge_dungeoneering': 'intelligence',
      'knowledge_engineering': 'intelligence',
      'knowledge_geography': 'intelligence',
      'knowledge_history': 'intelligence',
      'knowledge_local': 'intelligence',
      'knowledge_nature': 'intelligence',
      'knowledge_nobility': 'intelligence',
      'knowledge_planes': 'intelligence',
      'knowledge_religion': 'intelligence',
      'linguistics': 'intelligence',
      'spellcraft': 'intelligence',
      // Wisdom-based skills
      'heal': 'wisdom',
      'perception': 'wisdom',
      'profession': 'wisdom',
      'sense_motive': 'wisdom',
      'survival': 'wisdom',
      // Charisma-based skills
      'bluff': 'charisma',
      'diplomacy': 'charisma',
      'disguise': 'charisma',
      'handle_animal': 'charisma',
      'intimidate': 'charisma',
      'perform': 'charisma',
      'use_magic_device': 'charisma'
    };
    
    // Iterate through all the skills and calculate their values
    for (const [skillId, skill] of skillsMap.entries()) {
      const ranks = skillRanks[skillId] || 0;
      
      // Get ability modifier for this skill
      let abilityName = '';
      let abilityMod = 0;
      
      // Check for ability overrides from feature effect system
      let abilityOverride = '';
      if (this.featureEffectSystem) {
        const override = this.featureEffectSystem.applyOverrideEffects(`${skill.name}_ability`, '');
        if (override && override in abilityModifiers) {
          abilityOverride = override;
          abilityName = override;
          abilityMod = abilityModifiers[override] || 0;
        }
      }
      
      // If no override, try to find the ability by name from the mapping
      if (!abilityOverride) {
        if (skill.name && skillToAbilityMap[skill.name.toLowerCase()]) {
          abilityName = skillToAbilityMap[skill.name.toLowerCase()];
          abilityMod = abilityModifiers[abilityName] || 0;
        }
        // If that fails, try looking up via ability_id
        else if (skill.ability_id) {
          // Try to get the ability name from the skill's ability_id
          const abilities = (character as any).game_ability || character.game_character_ability;
          const abilityObj = abilities?.find((a: { id?: number; ability?: { id?: number; name?: string } }) => 
            a.id === skill.ability_id || a.ability?.id === skill.ability_id
          );
          
          if (abilityObj?.name) {
            abilityName = abilityObj.name.toLowerCase();
            abilityMod = abilityModifiers[abilityName] || 0;
          } else if (abilityObj?.ability?.name) {
            // Handle nested ability object
            abilityName = abilityObj.ability.name.toLowerCase();
            abilityMod = abilityModifiers[abilityName] || 0;
          }
          // If still not found, try from the skill object's direct ability property
          else if (skill.ability?.name) {
            abilityName = skill.ability.name.toLowerCase();
            abilityMod = abilityModifiers[abilityName] || 0;
          }
        }
        
        // If we still couldn't determine the ability, use a fallback based on the skill type
        if (!abilityName && skill.name) {
          const fallbackAbility = skillToAbilityMap[skill.name.toLowerCase()];
          if (fallbackAbility) {
            abilityName = fallbackAbility;
            abilityMod = abilityModifiers[abilityName] || 0;
          }
        }
      }
      
      // Debug skill identification
      if (['bluff', 'acrobatics', 'appraise', 'perception', 'stealth'].includes(skill.name?.toLowerCase() || '')) {
        console.log(`[SKILLS DEBUG] Skill: ${skill.name} (ID: ${skillId}) - Ability: ${abilityName}, Mod: ${abilityMod}, Ranks: ${ranks}, Class Skill: ${classSkills.has(skillId)}`);
      }
      
      // Check if this is a class skill
      const isClassSkill = classSkills.has(skillId);
      
      // Get class skill bonus - +3 if it's a class skill and has at least 1 rank
      const classSkillBonus = (isClassSkill && ranks > 0) ? 3 : 0;
      
      // Build modifiers array
      const modifiers = [];
      
      // Add skill ranks
      if (ranks > 0) {
        modifiers.push({ source: 'Ranks', value: ranks });
      }
      
      // Add ability modifier
      if (abilityName) {
        modifiers.push({ 
          source: abilityName.charAt(0).toUpperCase() + abilityName.slice(1), 
          value: abilityMod 
        });
      }
      
      // Add class skill bonus
      if (classSkillBonus > 0) {
        modifiers.push({ source: 'Class Skill', value: classSkillBonus });
      }
      
      // Calculate armor check penalty if applicable
      if (skill.armor_check_penalty) {
        const armorCheckPenalty = 0; // This should come from character's equipped armor
        if (armorCheckPenalty < 0) {
          modifiers.push({ source: 'Armor Check Penalty', value: armorCheckPenalty });
        }
      }
      
      // Add bonuses from feature effect system (corruptions, feats, traits, etc.)
      if (this.featureEffectSystem && skill.name) {
        // Try to get effects for this skill by name
        const effectModifiers = this.getFeatureEffectsForSkill(skill.name);
        
        // Add any found effects to our modifiers
        if (effectModifiers.length > 0) {
          console.log(`[SKILLS DEBUG] Adding feature effects to ${skill.name}:`, effectModifiers);
          modifiers.push(...effectModifiers);
        }
      }
      
      // Create a ValueWithBreakdown with properly ordered modifiers
      result[skillId] = this.bonusEngine.buildGenericStat(
        skill.label || skill.name || `Skill #${skillId}`, 
        modifiers
      );
      
      // Check if we should allow untrained use of a normally trained-only skill
      let trainedOnly = skill.trained_only || false;
      if (this.featureEffectSystem && skill.trained_only) {
        const canUseUntrained = this.featureEffectSystem.applyBooleanEffects('untrained_knowledge', false);
        // Only override for knowledge skills
        if (canUseUntrained && skill.name && skill.name.toLowerCase().startsWith('knowledge_')) {
          trainedOnly = false;
        }
      }
      
      // Add trained_only information to the result
      if (!result[skillId].overrides) {
        result[skillId].overrides = {};
      }
      result[skillId].overrides.trained_only = trainedOnly;
      
      // Add ability override information if one was detected
      if (abilityOverride && skill.ability?.name?.toLowerCase() !== abilityOverride) {
        const overrideSource = this.getAbilityOverrideSource(skill.name, abilityOverride);
        result[skillId].overrides.ability = {
          original: skill.ability?.name || 'unknown',
          override: abilityOverride,
          source: overrideSource || 'System'
        };
      } else if (abilityName && skill.ability?.name?.toLowerCase() !== abilityName) {
        result[skillId].overrides.ability = {
          original: skill.ability?.name || 'unknown',
          override: abilityName,
          source: 'System'
        };
      }
      
      // Additional debugging for Allure-affected skills
      if (skill.name && ['bluff', 'diplomacy', 'intimidate'].includes(skill.name.toLowerCase())) {
        console.log(`[SKILLS DEBUG] Final ${skill.name} modifiers:`, result[skillId].modifiers);
        console.log(`[SKILLS DEBUG] Final ${skill.name} total:`, result[skillId].total);
      }
    }
    
    console.log(`[SKILLS DEBUG] Calculated ${Object.keys(result).length} skill modifiers`);
    
    // Log specific skills for debugging
    const checkSkillIds = [28, 29, 30, 54, 60]; // Acrobatics, Appraise, Bluff, Perception, Stealth
    for (const id of checkSkillIds) {
      console.log(`[SKILLS DEBUG] Skill ${id} exists in results: ${id in result}`);
      if (!(id in result)) {
        // If we're missing important skills, something went wrong with the skill processing
        console.error(`[SKILLS DEBUG] Important skill ID ${id} is missing from results!`);
      }
    }
    
    return result;
  }

  /**
   * Helper function to get skill bonuses from the feature effect system
   */
  private getFeatureEffectsForSkill(skillName: string): Array<{source: string; value: number}> {
    // Skip if no feature effect system
    if (!this.featureEffectSystem || !this.featureEffectSystem.getNumericEffects) {
      return [];
    }
    
    try {
      // Clean up the skill name for consistent lookups
      const normalizedSkillName = skillName.toLowerCase().trim().replace(/\s+/g, '_');
      
      // Try several variants of the skill name to ensure we catch all effects
      const possibleNames = [
        normalizedSkillName,               // Original normalized name (e.g. "knowledge_local")
        normalizedSkillName.replace(/_/g, ''), // Without underscores (e.g. "knowledgelocal")
      ];
      
      console.log(`[SKILLS DEBUG] Checking for effects using skill names:`, possibleNames);
      
      // Use a Map to track unique effect IDs and prevent duplicates
      const uniqueEffects = new Map();
      
      for (const name of possibleNames) {
        const effects = this.featureEffectSystem.getNumericEffects(name);
        if (effects && effects.length) {
          console.log(`[SKILLS DEBUG] Found ${effects.length} effects for skill name '${name}'`);
          
          // Log each effect we found
          effects.forEach((effect: any, index: number) => {
            console.log(`[SKILLS DEBUG] Effect ${index + 1}:`, {
              id: effect.id,
              source: effect.source,
              target: effect.target,
              type: effect.type,
              value: effect.value
            });
          });
          
          // Add effects to our unique set, using ID as the key if available
          for (const effect of effects) {
            const effectKey = effect.id || `${effect.source}_${effect.value}_${effect.type}`;
            if (!uniqueEffects.has(effectKey)) {
              uniqueEffects.set(effectKey, effect);
            } else {
              console.log(`[SKILLS DEBUG] Skipping duplicate effect with key: ${effectKey}`);
            }
          }
        }
      }
      
      // Log the final unique effects
      console.log(`[SKILLS DEBUG] Final unique effects for ${skillName}:`, Array.from(uniqueEffects.values()));
      
      // Convert the unique effects to the format expected by ValueWithBreakdown
      return Array.from(uniqueEffects.values()).map(effect => ({
        source: effect.source,
        value: effect.value
      }));
    } catch (error) {
      console.error(`[SKILLS DEBUG] Error getting effects for ${skillName}:`, error);
      return [];
    }
  }

  /**
   * Get the source of an ability override for a skill
   */
  private getAbilityOverrideSource(skillName: string, abilityOverride: string): string | null {
    if (!this.featureEffectSystem) return null;
    
    try {
      const override = this.featureEffectSystem.getConditionalOverride(
        `${skillName}_ability`, 
        abilityOverride
      );
      
      return override?.source || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Build a list of skills with ranks for a character
   * @param entity The character entity
   * @returns Array of skills with ranks and level information
   */
  buildSkillsWithRanks(entity: any): SkillWithRanks[] {
    const character = entity.character as CompleteCharacter;
    console.log(`[SKILLS DEBUG] Building skills with ranks`);
    
    if (!character.game_character_skill_rank || character.game_character_skill_rank.length === 0) {
      console.log(`[SKILLS DEBUG] No skill ranks found`);
      return [];
    }
    
    // Create a map to track skills and their ranks by level
    const skillsMap = new Map<number, {
      name: string;
      isClassSkill: boolean;
      ranksByLevel: Map<number, number>;
    }>();
    
    // First pass: initialize skills in the map and determine if they're class skills
    for (const rank of character.game_character_skill_rank) {
      const skillId = rank.skill_id;
      if (!skillId) continue;
      
      const level = rank.applied_at_level || 1;
      const rankValue = rank.rank || 1;
      
      if (!skillsMap.has(skillId)) {
        // Get skill name from the rank or fall back to ID
        const skillName = rank.skill?.name || rank.skill?.label || `Skill ${skillId}`;
        console.log(`[SKILLS DEBUG] Adding skill ${skillName} (ID: ${skillId}) to map`);
        
        // Determine if this is a class skill - safely check if the property exists
        const isClassSkill = 'is_class_skill' in rank ? rank.is_class_skill === true : false;
        console.log(`[SKILLS DEBUG] Skill ${skillName} is class skill: ${isClassSkill}`);
        
        skillsMap.set(skillId, {
          name: skillName,
          isClassSkill: isClassSkill,
          ranksByLevel: new Map()
        });
      }
      
      // Get the skill from our map
      const skill = skillsMap.get(skillId)!;
      
      // Update class skill status if this rank indicates it's a class skill
      // This ensures if ANY rank has is_class_skill = true, we consider it a class skill
      if ('is_class_skill' in rank && rank.is_class_skill === true) {
        skill.isClassSkill = true;
      }
      
      // Initialize or increment rank count for this level
      if (!skill.ranksByLevel.has(level)) {
        skill.ranksByLevel.set(level, rankValue);
      } else {
        // If we already have a rank for this level, take the highest
        const existingRank = skill.ranksByLevel.get(level) || 0;
        skill.ranksByLevel.set(level, Math.max(existingRank, rankValue));
      }
    }
    
    // Convert our map to the expected array format
    const result = Array.from(skillsMap.entries()).map(([skillId, skill]) => {
      return {
        skillId,
        name: skill.name,
        isClassSkill: skill.isClassSkill,
        skillRanks: Array.from(skill.ranksByLevel.entries()).map(([level, rank]) => ({
          level,
          rank
        }))
      };
    });
    
    console.log(`[SKILLS DEBUG] Built ${result.length} skills with ranks`);
    return result;
  }
} 