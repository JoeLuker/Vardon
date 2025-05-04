import type { Entity } from '../types/EntityTypes';
import type { PrerequisiteSubsystem } from '../types/SubsystemTypes';
import type { GameRulesAPI } from '$lib/db/gameRules.api';

/**
 * Implementation of the PrerequisiteSubsystem
 * 
 * This subsystem handles checking if entities meet prerequisites for features.
 * It follows the Unix philosophy by providing a focused implementation of 
 * prerequisite checking that can be used by other components.
 */
export class PrerequisiteSubsystemImpl implements PrerequisiteSubsystem {
  readonly id = 'prerequisite';
  readonly version = '1.0.0';
  
  private requirementCheckers: Record<string, (entity: Entity, requirementId: number) => Promise<boolean>> = {};
  
  /**
   * Creates a new PrerequisiteSubsystemImpl
   * @param gameRulesAPI API for accessing game rules data
   */
  constructor(private gameRulesAPI: GameRulesAPI) {
    // Register default requirement checkers
    this.registerRequirementChecker('class_feature', this.checkClassFeatureRequirement.bind(this));
    this.registerRequirementChecker('wild_talent', this.checkWildTalentRequirement.bind(this));
    this.registerRequirementChecker('monk_unchained_ki_power', this.checkMonkKiPowerRequirement.bind(this));
    this.registerRequirementChecker('ability_score', this.checkAbilityScoreRequirement.bind(this));
    this.registerRequirementChecker('class_level', this.checkClassLevelRequirement.bind(this));
    this.registerRequirementChecker('skill_ranks', this.checkSkillRanksRequirement.bind(this));
    this.registerRequirementChecker('feat', this.checkFeatRequirement.bind(this));
  }
  
  /**
   * Register a custom prerequisite checker for a specific requirement type
   * @param type The type of prerequisite requirement to check
   * @param checker Function that checks if the requirement is met
   */
  registerRequirementChecker(
    type: string, 
    checker: (entity: Entity, requirementId: number) => Promise<boolean>
  ): void {
    this.requirementCheckers[type] = checker;
  }
  
  /**
   * Check if an entity meets a specific prerequisite requirement
   * @param entity The entity to check
   * @param requirementId The ID of the prerequisite requirement
   * @returns True if the prerequisite is met, false otherwise
   */
  async checkRequirement(entity: Entity, requirementId: number): Promise<boolean> {
    try {
      // Get requirement data from database
      const { data: requirement } = await this.gameRulesAPI.supabase
        .from('prerequisite_requirement')
        .select('*, requirement_type:prerequisite_requirement_type(*)')
        .eq('id', requirementId)
        .single();
      
      if (!requirement) {
        console.warn(`Prerequisite requirement with ID ${requirementId} not found`);
        return false;
      }
      
      const requirementType = requirement.requirement_type?.name;
      if (!requirementType) {
        console.warn(`Requirement type not found for prerequisite requirement ${requirementId}`);
        return false;
      }
      
      // Use appropriate checker for this requirement type
      const checker = this.requirementCheckers[requirementType];
      if (!checker) {
        console.warn(`No checker registered for requirement type ${requirementType}`);
        return false;
      }
      
      return await checker(entity, requirement.id);
    } catch (error) {
      console.error(`Error checking prerequisite requirement ${requirementId}:`, error);
      return false;
    }
  }
  
  /**
   * Check if an entity meets all specified prerequisite requirements
   * @param entity The entity to check
   * @param requirementIds Array of prerequisite requirement IDs to check
   * @returns True if all prerequisites are met, false otherwise
   */
  async meetsAllRequirements(entity: Entity, requirementIds: number[]): Promise<boolean> {
    if (!requirementIds.length) return true;
    
    for (const requirementId of requirementIds) {
      const isRequirementMet = await this.checkRequirement(entity, requirementId);
      if (!isRequirementMet) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get a list of requirements the entity doesn't meet
   * @param entity The entity to check
   * @param requirementIds The requirements to check
   * @returns Array of requirement details that are not met
   */
  async getMissingRequirements(
    entity: Entity, 
    requirementIds: number[]
  ): Promise<Array<{id: number, type: string, description: string}>> {
    const missingRequirements: Array<{id: number, type: string, description: string}> = [];
    
    for (const requirementId of requirementIds) {
      const isRequirementMet = await this.checkRequirement(entity, requirementId);
      
      if (!isRequirementMet) {
        // Get requirement details from database
        const { data: requirement } = await this.gameRulesAPI.supabase
          .from('prerequisite_requirement')
          .select('*, requirement_type:prerequisite_requirement_type(*)')
          .eq('id', requirementId)
          .single();
        
        if (requirement) {
          const description = await this.getRequirementDescription(requirement);
          
          missingRequirements.push({
            id: requirementId,
            type: requirement.requirement_type?.name || 'unknown',
            description
          });
        }
      }
    }
    
    return missingRequirements;
  }
  
  /**
   * Check if an entity meets prerequisites for a feature
   * @param entity The entity to check
   * @param featureType The type of feature to check (e.g. 'feat', 'spell')
   * @param featureId The ID of the feature to check
   * @returns True if all prerequisites are met, false otherwise
   */
  async canUseFeature(entity: Entity, featureType: string, featureId: number): Promise<boolean> {
    // Get all prerequisite requirements for this feature
    const requirementIds = await this.getFeatureRequirementIds(featureType, featureId);
    
    if (!requirementIds.length) {
      // No prerequisites means the feature can be used
      return true;
    }
    
    return await this.meetsAllRequirements(entity, requirementIds);
  }
  
  /**
   * Get a detailed explanation of why a feature can or cannot be used
   * @param entity The entity to check
   * @param featureType The type of feature to check
   * @param featureId The ID of the feature to check
   * @returns Object with status and detailed explanation
   */
  async explainFeatureRequirements(
    entity: Entity, 
    featureType: string, 
    featureId: number
  ): Promise<{
    canUse: boolean,
    metRequirements: Array<{id: number, type: string, description: string}>,
    missingRequirements: Array<{id: number, type: string, description: string}>
  }> {
    // Get all prerequisite requirements for this feature
    const requirementIds = await this.getFeatureRequirementIds(featureType, featureId);
    
    const metRequirements: Array<{id: number, type: string, description: string}> = [];
    const missingRequirements: Array<{id: number, type: string, description: string}> = [];
    
    // Check each requirement
    for (const requirementId of requirementIds) {
      const isRequirementMet = await this.checkRequirement(entity, requirementId);
      
      // Get requirement details from database
      const { data: requirement } = await this.gameRulesAPI.supabase
        .from('prerequisite_requirement')
        .select('*, requirement_type:prerequisite_requirement_type(*)')
        .eq('id', requirementId)
        .single();
      
      if (requirement) {
        const description = await this.getRequirementDescription(requirement);
        const requirementInfo = {
          id: requirementId,
          type: requirement.requirement_type?.name || 'unknown',
          description
        };
        
        if (isRequirementMet) {
          metRequirements.push(requirementInfo);
        } else {
          missingRequirements.push(requirementInfo);
        }
      }
    }
    
    return {
      canUse: missingRequirements.length === 0,
      metRequirements,
      missingRequirements
    };
  }
  
  /**
   * Get requirement IDs for a feature
   * @param featureType The type of feature
   * @param featureId The ID of the feature
   * @returns Array of prerequisite requirement IDs
   */
  private async getFeatureRequirementIds(featureType: string, featureId: number): Promise<number[]> {
    // Query the database to get the prerequisites for this feature
    const { data } = await this.gameRulesAPI.supabase
      .from('feature_prerequisite')
      .select('prerequisite_requirement_id')
      .eq('feature_type', featureType)
      .eq('feature_id', featureId);
    
    if (!data || !data.length) {
      return [];
    }
    
    return data.map(p => p.prerequisite_requirement_id).filter(Boolean) as number[];
  }
  
  /**
   * Get a human-readable description of a requirement
   * @param requirement The requirement data
   * @returns Human-readable description
   */
  private async getRequirementDescription(requirement: any): Promise<string> {
    const type = requirement.requirement_type?.name;
    
    switch (type) {
      case 'class_feature':
        return await this.getClassFeatureDescription(requirement.requirement_id);
        
      case 'wild_talent':
        return await this.getWildTalentDescription(requirement.requirement_id);
        
      case 'monk_unchained_ki_power':
        return await this.getMonkKiPowerDescription(requirement.requirement_id);
        
      case 'ability_score':
        return await this.getAbilityScoreDescription(requirement.requirement_id);
        
      case 'class_level':
        return await this.getClassLevelDescription(requirement.requirement_id);
        
      case 'skill_ranks':
        return await this.getSkillRanksDescription(requirement.requirement_id);
        
      case 'feat':
        return await this.getFeatDescription(requirement.requirement_id);
        
      default:
        return `Requires ${type} (ID: ${requirement.requirement_id})`;
    }
  }
  
  /**
   * Check if the entity has a specific class feature
   * @param entity The entity to check
   * @param requirementId The ID of the requirement
   * @returns True if the entity has the required class feature
   */
  private async checkClassFeatureRequirement(entity: Entity, requirementId: number): Promise<boolean> {
    // Get the prerequisite details
    const { data: requirement } = await this.gameRulesAPI.supabase
      .from('prerequisite_requirement')
      .select('requirement_id')
      .eq('id', requirementId)
      .single();
    
    if (!requirement) return false;
    
    const classFeatureId = requirement.requirement_id;
    
    // Check if the entity has this class feature
    if (entity.character.classFeatures) {
      return entity.character.classFeatures.some(feature => 
        feature.id === classFeatureId || feature.sourceId === classFeatureId
      );
    }
    
    return false;
  }
  
  /**
   * Check if the entity has a specific wild talent
   * @param entity The entity to check
   * @param requirementId The ID of the requirement
   * @returns True if the entity has the required wild talent
   */
  private async checkWildTalentRequirement(entity: Entity, requirementId: number): Promise<boolean> {
    // Get the prerequisite details
    const { data: requirement } = await this.gameRulesAPI.supabase
      .from('prerequisite_requirement')
      .select('requirement_id')
      .eq('id', requirementId)
      .single();
    
    if (!requirement) return false;
    
    const wildTalentId = requirement.requirement_id;
    
    // Check if the entity has this wild talent
    if (entity.character.wildTalents) {
      return entity.character.wildTalents.some(talent => 
        talent.id === wildTalentId
      );
    }
    
    return false;
  }
  
  /**
   * Check if the entity has a specific monk ki power
   * @param entity The entity to check
   * @param requirementId The ID of the requirement
   * @returns True if the entity has the required monk ki power
   */
  private async checkMonkKiPowerRequirement(entity: Entity, requirementId: number): Promise<boolean> {
    // Get the prerequisite details
    const { data: requirement } = await this.gameRulesAPI.supabase
      .from('prerequisite_requirement')
      .select('requirement_id')
      .eq('id', requirementId)
      .single();
    
    if (!requirement) return false;
    
    const kiPowerId = requirement.requirement_id;
    
    // Check if the entity has this ki power
    if (entity.character.kiPowers) {
      return entity.character.kiPowers.some(power => 
        power.id === kiPowerId
      );
    }
    
    return false;
  }
  
  /**
   * Check if the entity meets the ability score requirement
   * @param entity The entity to check
   * @param requirementId The ID of the requirement
   * @returns True if the entity meets the ability score requirement
   */
  private async checkAbilityScoreRequirement(entity: Entity, requirementId: number): Promise<boolean> {
    // Get the prerequisite details
    const { data: requirement } = await this.gameRulesAPI.supabase
      .from('ability_score_requirement')
      .select('ability_id, minimum_score')
      .eq('id', requirementId)
      .single();
    
    if (!requirement) return false;
    
    // Get the ability subsystem
    const abilitySubsystem = this.getAbilitySubsystem(entity);
    if (!abilitySubsystem) return false;
    
    // Get the ability name from the ID
    const { data: ability } = await this.gameRulesAPI.supabase
      .from('ability')
      .select('name')
      .eq('id', requirement.ability_id)
      .single();
    
    if (!ability) return false;
    
    // Check if the entity meets the ability score requirement
    const score = abilitySubsystem.getAbilityScore(entity, ability.name);
    return score >= requirement.minimum_score;
  }
  
  /**
   * Check if the entity meets the class level requirement
   * @param entity The entity to check
   * @param requirementId The ID of the requirement
   * @returns True if the entity meets the class level requirement
   */
  private async checkClassLevelRequirement(entity: Entity, requirementId: number): Promise<boolean> {
    // Get the prerequisite details
    const { data: requirement } = await this.gameRulesAPI.supabase
      .from('class_level_requirement')
      .select('class_id, minimum_level')
      .eq('id', requirementId)
      .single();
    
    if (!requirement) return false;
    
    // Check if the entity has the required class level
    const characterClasses = entity.character.game_character_class || [];
    for (const charClass of characterClasses) {
      if (charClass.class_id === requirement.class_id && 
          charClass.level >= requirement.minimum_level) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if the entity meets the skill ranks requirement
   * @param entity The entity to check
   * @param requirementId The ID of the requirement
   * @returns True if the entity meets the skill ranks requirement
   */
  private async checkSkillRanksRequirement(entity: Entity, requirementId: number): Promise<boolean> {
    // Get the prerequisite details
    const { data: requirement } = await this.gameRulesAPI.supabase
      .from('skill_requirement')
      .select('skill_id, minimum_ranks')
      .eq('id', requirementId)
      .single();
    
    if (!requirement) return false;
    
    // Get the skill subsystem
    const skillSubsystem = this.getSkillSubsystem(entity);
    if (!skillSubsystem) return false;
    
    // Check if the entity has the required skill ranks
    const ranks = skillSubsystem.getSkillRanks(entity, requirement.skill_id);
    return ranks >= requirement.minimum_ranks;
  }
  
  /**
   * Check if the entity has a specific feat
   * @param entity The entity to check
   * @param requirementId The ID of the requirement
   * @returns True if the entity has the required feat
   */
  private async checkFeatRequirement(entity: Entity, requirementId: number): Promise<boolean> {
    // Get the prerequisite details
    const { data: requirement } = await this.gameRulesAPI.supabase
      .from('prerequisite_requirement')
      .select('requirement_id')
      .eq('id', requirementId)
      .single();
    
    if (!requirement) return false;
    
    const featId = requirement.requirement_id;
    
    // Check if the entity has this feat
    if (entity.character.game_character_feat) {
      return entity.character.game_character_feat.some(feat => 
        feat.feat_id === featId
      );
    }
    
    return false;
  }
  
  /**
   * Get class feature description
   * @param classFeatureId The ID of the class feature
   * @returns Human-readable description
   */
  private async getClassFeatureDescription(classFeatureId: number): Promise<string> {
    const { data: classFeature } = await this.gameRulesAPI.supabase
      .from('class_feature')
      .select('name, class:class(name)')
      .eq('id', classFeatureId)
      .single();
    
    if (!classFeature) {
      return `Requires a specific class feature (ID: ${classFeatureId})`;
    }
    
    return `Requires ${classFeature.class?.name || 'Class'} feature: ${classFeature.name}`;
  }
  
  /**
   * Get wild talent description
   * @param wildTalentId The ID of the wild talent
   * @returns Human-readable description
   */
  private async getWildTalentDescription(wildTalentId: number): Promise<string> {
    const { data: wildTalent } = await this.gameRulesAPI.supabase
      .from('wild_talent')
      .select('name, label, wild_talent_type(name, label)')
      .eq('id', wildTalentId)
      .single();
    
    if (!wildTalent) {
      return `Requires a specific wild talent (ID: ${wildTalentId})`;
    }
    
    const talentName = wildTalent.label || wildTalent.name;
    const typeName = wildTalent.wild_talent_type?.label || wildTalent.wild_talent_type?.name || 'Wild Talent';
    
    return `Requires ${typeName}: ${talentName}`;
  }
  
  /**
   * Get monk ki power description
   * @param kiPowerId The ID of the monk ki power
   * @returns Human-readable description
   */
  private async getMonkKiPowerDescription(kiPowerId: number): Promise<string> {
    const { data: kiPower } = await this.gameRulesAPI.supabase
      .from('monk_unchained_ki_power')
      .select('name, label')
      .eq('id', kiPowerId)
      .single();
    
    if (!kiPower) {
      return `Requires a specific monk ki power (ID: ${kiPowerId})`;
    }
    
    return `Requires Monk Ki Power: ${kiPower.label || kiPower.name}`;
  }
  
  /**
   * Get ability score requirement description
   * @param requirementId The ID of the requirement
   * @returns Human-readable description
   */
  private async getAbilityScoreDescription(requirementId: number): Promise<string> {
    const { data: requirement } = await this.gameRulesAPI.supabase
      .from('ability_score_requirement')
      .select('ability:ability(name, label), minimum_score')
      .eq('id', requirementId)
      .single();
    
    if (!requirement) {
      return `Requires a specific ability score (ID: ${requirementId})`;
    }
    
    const abilityName = requirement.ability?.label || requirement.ability?.name || 'Ability';
    
    return `Requires ${abilityName} ${requirement.minimum_score}+`;
  }
  
  /**
   * Get class level requirement description
   * @param requirementId The ID of the requirement
   * @returns Human-readable description
   */
  private async getClassLevelDescription(requirementId: number): Promise<string> {
    const { data: requirement } = await this.gameRulesAPI.supabase
      .from('class_level_requirement')
      .select('class:class(name, label), minimum_level')
      .eq('id', requirementId)
      .single();
    
    if (!requirement) {
      return `Requires a specific class level (ID: ${requirementId})`;
    }
    
    const className = requirement.class?.label || requirement.class?.name || 'Class';
    
    return `Requires ${className} level ${requirement.minimum_level}+`;
  }
  
  /**
   * Get skill ranks requirement description
   * @param requirementId The ID of the requirement
   * @returns Human-readable description
   */
  private async getSkillRanksDescription(requirementId: number): Promise<string> {
    const { data: requirement } = await this.gameRulesAPI.supabase
      .from('skill_requirement')
      .select('skill:skill(name, label), minimum_ranks')
      .eq('id', requirementId)
      .single();
    
    if (!requirement) {
      return `Requires ranks in a specific skill (ID: ${requirementId})`;
    }
    
    const skillName = requirement.skill?.label || requirement.skill?.name || 'Skill';
    
    return `Requires ${requirement.minimum_ranks} ranks in ${skillName}`;
  }
  
  /**
   * Get feat requirement description
   * @param featId The ID of the feat
   * @returns Human-readable description
   */
  private async getFeatDescription(featId: number): Promise<string> {
    const { data: feat } = await this.gameRulesAPI.supabase
      .from('feat')
      .select('name, label')
      .eq('id', featId)
      .single();
    
    if (!feat) {
      return `Requires a specific feat (ID: ${featId})`;
    }
    
    return `Requires feat: ${feat.label || feat.name}`;
  }
  
  /**
   * Get the ability subsystem from the entity's environment
   * @param entity The entity
   * @returns Ability subsystem or undefined if not available
   */
  private getAbilitySubsystem(entity: Entity): any {
    return entity.environment?.subsystems?.['ability'];
  }
  
  /**
   * Get the skill subsystem from the entity's environment
   * @param entity The entity
   * @returns Skill subsystem or undefined if not available
   */
  private getSkillSubsystem(entity: Entity): any {
    return entity.environment?.subsystems?.['skill'];
  }
}