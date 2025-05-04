import { supabase } from '$lib/db/supabaseClient';
import type { StorageDriver } from './CharacterStore';
import type { Entity } from '../../types/EntityTypes';
import type { GameRulesAPI } from '$lib/db/gameRules.api';
import type { CompleteCharacter } from '$lib/db/gameRules.api';

/**
 * Supabase implementation of the StorageDriver interface
 * Provides persistence for characters in the Supabase database
 */
export class SupabaseStorageDriver implements StorageDriver {
  private gameRulesAPI: GameRulesAPI;
  
  /**
   * Creates a new SupabaseStorageDriver
   * @param gameRulesAPI The GameRulesAPI instance for database access
   */
  constructor(gameRulesAPI: GameRulesAPI) {
    this.gameRulesAPI = gameRulesAPI;
  }

  /**
   * Saves a character entity to the Supabase database
   * @param id The UUID of the entity
   * @param data The entity data to save
   */
  async save(id: string, data: Entity): Promise<void> {
    // First, check if the character already exists in the database
    const numericId = this.extractNumericId(id);
    let charData = null;
    
    if (numericId) {
      try {
        // First, try to find the entity record to get the character ID
        const { data: entityData } = await supabase
          .from('entity')
          .select('ref_id')
          .eq('type', 'character')
          .eq('name', id)
          .single();
          
        if (entityData) {
          const charDbId = entityData.ref_id;
          charData = await this.gameRulesAPI.getCompleteCharacterData(charDbId);
        }
      } catch (error) {
        console.warn(`Character lookup failed, will attempt to create new: ${error}`);
      }
    }
    
    if (charData) {
      // Update existing character
      await this.updateExistingCharacter(numericId, data);
    } else {
      // Create new character
      await this.createNewCharacter(data);
    }
  }

  /**
   * Updates an existing character in the database
   * @param numericId The numeric ID of the character in the database
   * @param data The updated entity data
   */
  private async updateExistingCharacter(numericId: number, data: Entity): Promise<void> {
    if (!data.character) {
      throw new Error('Cannot update character: character data is missing');
    }

    // Update the base character record
    await this.gameRulesAPI.updateGameCharacter(numericId, {
      name: data.name,
      description: data.description || '',
      experience: data.character.experience || 0,
      updated_at: new Date().toISOString()
    });

    // Update abilities
    if (data.character.abilities) {
      await this.updateCharacterAbilities(numericId, data.character.abilities);
    }

    // Update class data if present
    if (data.character.classes && data.character.classes.length > 0) {
      await this.updateCharacterClasses(numericId, data.character.classes);
    }

    // Update feats if present
    if (data.character.feats && data.character.feats.length > 0) {
      await this.updateCharacterFeats(numericId, data.character.feats);
    }

    // Update skill ranks if present
    if (data.character.skills) {
      await this.updateCharacterSkills(numericId, data.character.skills);
    }

    // Handle active features (enabling/disabling)
    if (data.activeFeatures && data.activeFeatures.length > 0) {
      await this.updateActiveFeatures(numericId, data);
    }
  }

  /**
   * Creates a new character in the database
   * @param data The character entity data
   */
  private async createNewCharacter(data: Entity): Promise<void> {
    if (!data.character) {
      throw new Error('Cannot create character: character data is missing');
    }

    // Insert the base character record
    const { data: newChar, error } = await supabase
      .from('game_character')
      .insert({
        name: data.name,
        description: data.description || '',
        experience: data.character.experience || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create character: ${error.message}`);
    if (!newChar) throw new Error('Character creation failed: no data returned');

    const newCharId = newChar.id;

    // Set the numeric ID in the entity for future reference
    data.metadata = data.metadata || {};
    data.metadata.databaseId = newCharId;

    // Add abilities
    if (data.character.abilities) {
      await this.updateCharacterAbilities(newCharId, data.character.abilities);
    }

    // Add class data if present
    if (data.character.classes && data.character.classes.length > 0) {
      await this.updateCharacterClasses(newCharId, data.character.classes);
    }

    // Add feats if present
    if (data.character.feats && data.character.feats.length > 0) {
      await this.updateCharacterFeats(newCharId, data.character.feats);
    }

    // Add skill ranks if present
    if (data.character.skills) {
      await this.updateCharacterSkills(newCharId, data.character.skills);
    }

    // Create entity record in the entity table (for the Entity system)
    const { error: entityError } = await supabase
      .from('entity')
      .insert({
        type: data.type,
        ref_id: newCharId,
        name: data.id,
        metadata: data.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (entityError) throw new Error(`Failed to create entity record: ${entityError.message}`);
  }

  /**
   * Updates character abilities in the database
   * @param characterId The character ID
   * @param abilities The ability scores
   */
  private async updateCharacterAbilities(
    characterId: number, 
    abilities: Record<string, number>
  ): Promise<void> {
    const abilityData = await this.gameRulesAPI.getAllAbility();
    const abilityMap = new Map(abilityData.map(a => [a.name.toLowerCase(), a.id]));

    // For each ability, update or create the record
    for (const [abilityName, value] of Object.entries(abilities)) {
      const abilityId = abilityMap.get(abilityName.toLowerCase());
      if (!abilityId) {
        console.warn(`Unknown ability: ${abilityName}`);
        continue;
      }

      // Check if the ability record already exists
      const { data: existingAbilities } = await supabase
        .from('game_character_ability')
        .select('id')
        .eq('game_character_id', characterId)
        .eq('ability_id', abilityId);

      if (existingAbilities && existingAbilities.length > 0) {
        // Update existing ability
        await supabase
          .from('game_character_ability')
          .update({ value })
          .eq('id', existingAbilities[0].id);
      } else {
        // Create new ability record
        await supabase
          .from('game_character_ability')
          .insert({
            game_character_id: characterId,
            ability_id: abilityId,
            value
          });
      }
    }
  }

  /**
   * Updates character classes in the database
   * @param characterId The character ID
   * @param classes The character's classes
   */
  private async updateCharacterClasses(
    characterId: number,
    classes: Array<{ id: string; name: string; level: number }>
  ): Promise<void> {
    // Fetch all classes to get their IDs
    const { data: classData } = await supabase
      .from('class')
      .select('id, name');

    if (!classData) {
      throw new Error('Failed to fetch class data');
    }

    const classMap = new Map(classData.map(c => [c.name.toLowerCase(), c.id]));

    // Get existing character classes
    const { data: existingClasses } = await supabase
      .from('game_character_class')
      .select('*')
      .eq('game_character_id', characterId);

    const existingClassMap = new Map(
      (existingClasses || []).map(c => [c.class_id, c])
    );

    // Process each class
    for (const cls of classes) {
      const classId = classMap.get(cls.name.toLowerCase());
      
      if (!classId) {
        console.warn(`Unknown class: ${cls.name}`);
        continue;
      }

      const existingClass = existingClassMap.get(classId);

      if (existingClass) {
        // Update existing class
        if (existingClass.level !== cls.level) {
          await supabase
            .from('game_character_class')
            .update({ level: cls.level })
            .eq('id', existingClass.id);
        }
      } else {
        // Create new class record
        await supabase
          .from('game_character_class')
          .insert({
            game_character_id: characterId,
            class_id: classId,
            level: cls.level
          });
      }
    }

    // Remove classes that are no longer present
    const currentClassIds = classes
      .map(c => classMap.get(c.name.toLowerCase()))
      .filter(Boolean) as number[];

    const classesToRemove = Array.from(existingClassMap.values())
      .filter(c => !currentClassIds.includes(c.class_id))
      .map(c => c.id);

    if (classesToRemove.length > 0) {
      await supabase
        .from('game_character_class')
        .delete()
        .in('id', classesToRemove);
    }
  }

  /**
   * Updates character feats in the database
   * @param characterId The character ID
   * @param feats The character's feats
   */
  private async updateCharacterFeats(
    characterId: number,
    feats: Array<{ id: string; name: string }>
  ): Promise<void> {
    // Fetch all feats to get their IDs
    const { data: featData } = await supabase
      .from('feat')
      .select('id, name');

    if (!featData) {
      throw new Error('Failed to fetch feat data');
    }

    const featMap = new Map(featData.map(f => [f.name.toLowerCase(), f.id]));

    // Get existing character feats
    const { data: existingFeats } = await supabase
      .from('game_character_feat')
      .select('*')
      .eq('game_character_id', characterId);

    const existingFeatMap = new Map(
      (existingFeats || []).map(f => [f.feat_id, f])
    );

    // Process each feat
    for (const feat of feats) {
      const featId = featMap.get(feat.name.toLowerCase());
      
      if (!featId) {
        console.warn(`Unknown feat: ${feat.name}`);
        continue;
      }

      // Only add the feat if it doesn't already exist
      if (!existingFeatMap.has(featId)) {
        await supabase
          .from('game_character_feat')
          .insert({
            game_character_id: characterId,
            feat_id: featId
          });
      }
    }

    // Remove feats that are no longer present
    const currentFeatIds = feats
      .map(f => featMap.get(f.name.toLowerCase()))
      .filter(Boolean) as number[];

    const featsToRemove = Array.from(existingFeatMap.values())
      .filter(f => !currentFeatIds.includes(f.feat_id))
      .map(f => f.id);

    if (featsToRemove.length > 0) {
      await supabase
        .from('game_character_feat')
        .delete()
        .in('id', featsToRemove);
    }
  }

  /**
   * Updates character skills in the database
   * @param characterId The character ID
   * @param skills The character's skills with ranks
   */
  private async updateCharacterSkills(
    characterId: number,
    skills: Record<string, { ranks: number; classSkill: boolean }>
  ): Promise<void> {
    // Fetch all skills to get their IDs
    const { data: skillData } = await supabase
      .from('skill')
      .select('id, name');

    if (!skillData) {
      throw new Error('Failed to fetch skill data');
    }

    const skillMap = new Map(skillData.map(s => [s.name.toLowerCase(), s.id]));

    // Get existing character skill ranks
    const { data: existingSkills } = await supabase
      .from('game_character_skill_rank')
      .select('*')
      .eq('game_character_id', characterId);

    // Group existing skills by skill ID
    const existingSkillRanks = new Map<number, number>();
    (existingSkills || []).forEach(s => {
      const currentRanks = existingSkillRanks.get(s.skill_id) || 0;
      existingSkillRanks.set(s.skill_id, currentRanks + 1);
    });

    // Process each skill
    for (const [skillName, skillInfo] of Object.entries(skills)) {
      const skillId = skillMap.get(skillName.toLowerCase());
      
      if (!skillId) {
        console.warn(`Unknown skill: ${skillName}`);
        continue;
      }

      const existingRanks = existingSkillRanks.get(skillId) || 0;
      const desiredRanks = skillInfo.ranks;

      if (desiredRanks > existingRanks) {
        // Add additional ranks
        const ranksToAdd = desiredRanks - existingRanks;
        for (let i = 0; i < ranksToAdd; i++) {
          await this.gameRulesAPI.createGameCharacterSkillRank({
            game_character_id: characterId,
            skill_id: skillId,
            applied_at_level: i + existingRanks + 1
          });
        }
      } else if (desiredRanks < existingRanks) {
        // Remove excess ranks
        // To do this properly, we need to get the rank IDs in order
        const { data: rankRecords } = await supabase
          .from('game_character_skill_rank')
          .select('id, applied_at_level')
          .eq('game_character_id', characterId)
          .eq('skill_id', skillId)
          .order('applied_at_level', { ascending: false });

        if (rankRecords) {
          const ranksToRemove = rankRecords.slice(0, existingRanks - desiredRanks);
          for (const rank of ranksToRemove) {
            await this.gameRulesAPI.deleteGameCharacterSkillRank(rank.id);
          }
        }
      }
    }
  }

  /**
   * Updates active features in the database
   * @param characterId The character ID
   * @param entity The full entity with active features
   */
  private async updateActiveFeatures(characterId: number, entity: Entity): Promise<void> {
    if (!entity.activeFeatures) return;

    // Fetch entity ID from the database
    const { data: entityData } = await supabase
      .from('entity')
      .select('id')
      .eq('game_character_id', characterId)
      .eq('uuid', entity.id)
      .single();

    if (!entityData) {
      throw new Error(`Entity record not found for character ID ${characterId}`);
    }

    const entityId = entityData.id;

    // Get existing active features for this entity
    const { data: existingFeatures } = await supabase
      .from('active_feature')
      .select('*')
      .eq('entity_id', entityId);

    const existingFeatureMap = new Map(
      (existingFeatures || []).map(f => [f.feature_path, f])
    );

    // Process each active feature
    for (const feature of entity.activeFeatures) {
      const featurePath = feature.path;
      const existingFeature = existingFeatureMap.get(featurePath);

      if (existingFeature) {
        // Update existing feature if needed
        if (existingFeature.deactivated_at && feature.active) {
          // Reactivate the feature
          await supabase
            .from('active_feature')
            .update({
              activated_at: new Date().toISOString(),
              deactivated_at: null,
              state: feature.state || {},
              options: feature.options || {}
            })
            .eq('id', existingFeature.id);
        } else if (!existingFeature.deactivated_at && !feature.active) {
          // Deactivate the feature
          await supabase
            .from('active_feature')
            .update({
              deactivated_at: new Date().toISOString()
            })
            .eq('id', existingFeature.id);
        } else if (feature.active) {
          // Update state and options if active
          await supabase
            .from('active_feature')
            .update({
              state: feature.state || {},
              options: feature.options || {}
            })
            .eq('id', existingFeature.id);
        }
      } else if (feature.active) {
        // Create new active feature
        await supabase
          .from('active_feature')
          .insert({
            entity_id: entityId,
            feature_id: parseInt(feature.id) || 0,
            feature_path: featurePath,
            feature_type: feature.type || 'unknown',
            activated_at: new Date().toISOString(),
            state: feature.state || {},
            options: feature.options || {}
          });
      }
    }

    // Deactivate features that are no longer in the list
    const currentFeaturePaths = entity.activeFeatures.map(f => f.path);
    const featuresToDeactivate = Array.from(existingFeatureMap.values())
      .filter(f => !f.deactivated_at && !currentFeaturePaths.includes(f.feature_path))
      .map(f => f.id);

    if (featuresToDeactivate.length > 0) {
      await supabase
        .from('active_feature')
        .update({ deactivated_at: new Date().toISOString() })
        .in('id', featuresToDeactivate);
    }
  }

  /**
   * Loads a character entity from the database by ID
   * @param id The UUID of the entity to load
   * @returns The loaded entity or null if not found
   */
  async load(id: string): Promise<Entity | null> {
    try {
      // First, try to find the entity record
      const { data: entityData } = await supabase
        .from('entity')
        .select('*, ref_id')
        .eq('type', 'character')
        .eq('name', id)
        .single();

      if (!entityData) {
        console.warn(`Entity with UUID ${id} not found`);
        return null;
      }

      const characterId = entityData.ref_id;
      
      // Load the character data
      const characterData = await this.gameRulesAPI.getCompleteCharacterData(characterId);
      if (!characterData) {
        console.warn(`Character with ID ${characterId} not found`);
        return null;
      }

      // Get active features
      const activeFeatures = await this.getActiveFeatures(entityData.id);

      // Construct the entity from database character
      return this.constructEntityFromDatabaseCharacter(
        entityData, 
        characterData, 
        activeFeatures
      );
    } catch (error) {
      console.error('Error loading character:', error);
      return null;
    }
  }

  /**
   * Gets active features for an entity
   * @param entityId The database entity ID
   * @returns Array of active features
   */
  private async getActiveFeatures(entityId: number): Promise<any[]> {
    const { data } = await supabase
      .from('active_feature')
      .select('*')
      .eq('entity_id', entityId)
      .is('deactivated_at', null);

    return data || [];
  }

  /**
   * Constructs an entity object from database character data
   * @param entityData The entity record
   * @param characterData The character data from the database
   * @param activeFeatures Active features for the entity
   * @returns A constructed entity
   */
  private constructEntityFromDatabaseCharacter(
    entityData: any,
    characterData: CompleteCharacter,
    activeFeatures: any[]
  ): Entity {
    // Build the ability scores object
    const abilities: Record<string, number> = {};
    characterData.game_character_ability?.forEach(ability => {
      if (ability.ability) {
        abilities[ability.ability.name.toLowerCase()] = ability.value || 10;
      }
    });

    // Build the classes array
    const classes = characterData.game_character_class?.map(cls => ({
      id: `class_${cls.class_id}`,
      name: cls.class?.name || 'Unknown',
      level: cls.level
    })) || [];

    // Build the feats array
    const feats = characterData.game_character_feat?.map(feat => ({
      id: `feat_${feat.feat_id}`,
      name: feat.feat?.name || 'Unknown Feat'
    })) || [];

    // Build the traits array
    const traits = characterData.game_character_trait?.map(trait => ({
      id: `trait_${trait.trait_id}`,
      name: trait.trait?.name || 'Unknown Trait'
    })) || [];

    // Build the skills object
    const skills: Record<string, { ranks: number; classSkill: boolean }> = {};
    
    // First, build a map of skill IDs to skill names
    const skillNameMap = new Map<number, string>();
    
    // Create a map of class skills based on character classes
    const classSkills = new Set<number>();
    
    // Check which skills are class skills based on character's classes
    if (characterData.game_character_class) {
      for (const charClass of characterData.game_character_class) {
        if (charClass.class?.id) {
          // In a real implementation, we would query class_skill table
          // For now, we'll assume all skills can be class skills
        }
      }
    }
    
    // Group skill ranks by skill
    const skillRanks = new Map<number, number>();
    if (characterData.game_character_skill_rank) {
      for (const rank of characterData.game_character_skill_rank) {
        const skillId = rank.skill_id;
        skillRanks.set(skillId, (skillRanks.get(skillId) || 0) + 1);
        
        // Also build the skill name map while we're at it
        if (rank.skill?.name) {
          skillNameMap.set(skillId, rank.skill.name.toLowerCase());
        }
      }
    }
    
    // Create the skills object using both maps
    for (const [skillId, ranks] of skillRanks.entries()) {
      const skillName = skillNameMap.get(skillId);
      if (!skillName) continue; // Skip if we don't have a name for this skill
      
      const isClassSkill = classSkills.has(skillId);
      
      skills[skillName] = { 
        ranks, 
        classSkill: isClassSkill 
      };
    }
    
    // Add all skills with 0 ranks for completeness
    if (characterData.game_character_skill_rank) {
      for (const rank of characterData.game_character_skill_rank) {
        if (rank.skill?.name) {
          const skillName = rank.skill.name.toLowerCase();
          if (!skills[skillName]) {
            skills[skillName] = { ranks: 0, classSkill: false };
          }
        }
      }
    }

    // Calculate derived values
    const constitutionMod = Math.floor((abilities["constitution"] || 10) - 10) / 2;
    
    // Calculate base values for hit points
    let baseHitPoints = 0;
    if (characterData.game_character_class) {
      for (const charClass of characterData.game_character_class) {
        // Default hit die values based on class - would be more accurate from database
        let hitDie = 6; // Default d6
        if (charClass.class) {
          const className = charClass.class.name.toLowerCase();
          if (['barbarian'].includes(className)) hitDie = 12;
          else if (['fighter', 'paladin', 'ranger'].includes(className)) hitDie = 10;
          else if (['alchemist', 'bard', 'cleric', 'druid', 'monk', 'rogue'].includes(className)) hitDie = 8;
        }
        // Simplistic HP calculation (in real system would be more complex)
        const classLevel = charClass.level || 0;
        baseHitPoints += hitDie + ((hitDie/2 + 0.5) * (classLevel - 1));
      }
    }
    
    // Add Constitution bonus
    const hpFromCon = constitutionMod * classes.reduce((sum, cls) => sum + cls.level, 0);
    const maxHitPoints = baseHitPoints + hpFromCon;
    
    // Calculate BAB and saves
    let baseAttackBonus = 0;
    let baseFortSave = 0;
    let baseRefSave = 0;
    let baseWillSave = 0;
    
    if (characterData.game_character_class) {
      for (const charClass of characterData.game_character_class) {
        if (!charClass.class) continue;
        
        const className = charClass.class.name.toLowerCase();
        const level = charClass.level || 0;
        
        // High BAB: Fighter, Barbarian, Ranger, Paladin (1:1)
        // Medium BAB: Alchemist, Bard, Cleric, Druid, Monk, Rogue (3:4)
        // Low BAB: Sorcerer, Wizard, etc. (1:2)
        if (['fighter', 'barbarian', 'ranger', 'paladin'].includes(className)) {
          baseAttackBonus += level;
        } else if (['alchemist', 'bard', 'cleric', 'druid', 'monk', 'rogue'].includes(className)) {
          baseAttackBonus += Math.floor(level * 0.75);
        } else {
          baseAttackBonus += Math.floor(level * 0.5);
        }
        
        // Good saves (2 + level/2)
        // Bad saves (0 + level/3)
        if (['barbarian', 'fighter', 'paladin', 'ranger', 'monk', 'druid'].includes(className)) {
          baseFortSave += 2 + Math.floor(level / 2);
        } else {
          baseFortSave += Math.floor(level / 3);
        }
        
        if (['bard', 'monk', 'ranger', 'rogue', 'alchemist'].includes(className)) {
          baseRefSave += 2 + Math.floor(level / 2);
        } else {
          baseRefSave += Math.floor(level / 3);
        }
        
        if (['bard', 'cleric', 'druid', 'monk', 'sorcerer', 'wizard'].includes(className)) {
          baseWillSave += 2 + Math.floor(level / 2);
        } else {
          baseWillSave += Math.floor(level / 3);
        }
      }
    }
    
    // Add character customizations to base values
    const strMod = Math.floor((abilities['strength'] || 10) - 10) / 2;
    const dexMod = Math.floor((abilities['dexterity'] || 10) - 10) / 2;
    const conMod = Math.floor((abilities['constitution'] || 10) - 10) / 2;
    const intMod = Math.floor((abilities['intelligence'] || 10) - 10) / 2;
    const wisMod = Math.floor((abilities['wisdom'] || 10) - 10) / 2;
    const chaMod = Math.floor((abilities['charisma'] || 10) - 10) / 2;

    // Build active features
    const mappedActiveFeatures = activeFeatures.map(feature => ({
      id: feature.feature_id.toString(),
      path: feature.feature_path,
      type: feature.feature_type,
      active: true,
      state: feature.state || {},
      options: feature.options || {}
    }));

    // Construct the entity
    return {
      id: entityData.uuid,
      type: entityData.type,
      name: characterData.name,
      description: characterData.description,
      properties: entityData.properties || {},
      character: {
        experience: characterData.experience || 0,
        abilities,
        classes,
        feats,
        traits,
        skills,
        hitPoints: {
          max: Math.max(1, Math.floor(maxHitPoints)),
          current: Math.max(1, Math.floor(maxHitPoints)),
          temporary: 0,
          nonLethal: 0
        },
        baseAttackBonus: baseAttackBonus,
        savingThrows: {
          fortitude: baseFortSave + conMod,
          reflex: baseRefSave + dexMod,
          will: baseWillSave + wisMod
        },
        classFeatures: [],
        ancestry: characterData.game_character_ancestry?.[0]?.ancestry?.name || ''
      },
      activeFeatures: mappedActiveFeatures,
      metadata: {
        createdAt: new Date(entityData.created_at || Date.now()).getTime(),
        updatedAt: new Date(entityData.updated_at || Date.now()).getTime(),
        version: 1,
        databaseId: characterData.id
      }
    };
  }

  /**
   * Extracts a numeric database ID from an entity UUID
   * @param id The entity UUID
   * @returns The numeric database ID or null if not found
   */
  private extractNumericId(id: string): number | null {
    // First check if the UUID contains embedded metadata
    if (id.includes('_db_')) {
      const match = id.match(/_db_(\d+)_/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }

    // Otherwise, query the entity table
    return null;
  }

  /**
   * Deletes a character from the database
   * @param id The UUID of the entity to delete
   * @returns True if successful
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Find the entity record to get the character ID
      const { data: entityData } = await supabase
        .from('entity')
        .select('ref_id')
        .eq('type', 'character')
        .eq('name', id)
        .single();

      if (!entityData) {
        console.warn(`Entity with UUID ${id} not found for deletion`);
        return false;
      }

      const characterId = entityData.ref_id;

      // Delete the entity record first (maintains referential integrity)
      await supabase
        .from('entity')
        .delete()
        .eq('type', 'character')
        .eq('name', id);

      // Delete the character record (cascading deletes should handle related records)
      const { error } = await supabase
        .from('game_character')
        .delete()
        .eq('id', characterId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting character:', error);
      return false;
    }
  }

  /**
   * Lists all character entities
   * @returns Array of entity UUIDs
   */
  async list(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('entity')
        .select('uuid')
        .eq('type', 'character');

      if (error) throw error;
      return (data || []).map(entity => entity.uuid);
    } catch (error) {
      console.error('Error listing characters:', error);
      return [];
    }
  }
}