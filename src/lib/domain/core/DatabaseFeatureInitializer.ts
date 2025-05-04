import type { Entity } from '../types/EntityTypes';
import type { GameRulesAPI, CompleteCharacter } from '$lib/db/gameRules.api';
import type { GameEngine } from './GameEngine';
import type { FeatureRegistry } from '../config/FeatureRegistry';
import type { Feature } from '../types/FeatureTypes';

/**
 * DatabaseFeatureInitializer is responsible for loading features from the database
 * and initializing them for entities based on their database records.
 * 
 * This follows the Unix philosophy by separating the concern of feature initialization
 * from database access and entity management.
 */
export class DatabaseFeatureInitializer {
  /**
   * Creates a new DatabaseFeatureInitializer
   * @param gameRulesAPI API for accessing game rules from the database
   * @param engine The GameEngine instance
   * @param featureRegistry The FeatureRegistry instance
   */
  constructor(
    private gameRulesAPI: GameRulesAPI,
    private engine: GameEngine,
    private featureRegistry: FeatureRegistry
  ) {}

  /**
   * Initializes features for an entity from its character database record
   * @param entity The entity to initialize features for
   * @param characterId The database ID of the character
   */
  async initializeFeatures(entity: Entity, characterId: number): Promise<void> {
    // Load complete character data from database
    const characterData = await this.gameRulesAPI.getCompleteCharacterData(characterId);
    if (!characterData) {
      console.warn(`Character with ID ${characterId} not found in database.`);
      return;
    }

    // Apply ABP (Advanced Bonus Progression) choices
    await this.applyABPChoices(entity, characterData);

    // Apply Favored Class Bonuses
    await this.applyFavoredClassBonuses(entity, characterData);

    // Apply ancestry traits
    await this.applyAncestryTraits(entity, characterData);

    // Apply archetypes before class features since they can modify class features
    await this.applyArchetypes(entity, characterData);
    
    // Apply class features
    await this.applyClassFeatures(entity, characterData);
    
    // Apply discoveries
    await this.applyDiscoveries(entity, characterData);
    
    // Apply wild talents
    await this.applyWildTalents(entity, characterData);
    
    // Apply monk ki powers
    await this.applyMonkKiPowers(entity, characterData);
    
    // Apply sorcerer bloodlines
    await this.applySorcererBloodlines(entity, characterData);
    
    // Apply feats
    await this.applyFeats(entity, characterData);
    
    // Apply equipment
    await this.applyEquipment(entity, characterData);
    
    // Apply corruptions
    await this.applyCorruptions(entity, characterData);
    
    // Register known spells as features
    await this.registerKnownSpells(entity, characterData);
    
    // Apply active features (features that were previously active)
    await this.applyActiveFeatures(entity, characterId);
  }

  /**
   * Applies Advanced Bonus Progression (ABP) choices to an entity
   * @param entity The entity to apply ABP choices to
   * @param characterData The character data from the database
   */
  private async applyABPChoices(entity: Entity, characterData: CompleteCharacter): Promise<void> {
    if (!characterData.game_character_abp_choice?.length) {
      console.log(`No ABP choices found for character ${characterData.id}`);
      return;
    }

    console.log(`Applying ${characterData.game_character_abp_choice.length} ABP choices for character ${characterData.id}`);
    
    // Get the bonus subsystem
    const bonusSubsystem = this.engine.getSubsystem('bonus');
    if (!bonusSubsystem) {
      console.warn('Bonus subsystem not available, cannot apply ABP bonuses');
      return;
    }
    
    // Process each ABP choice
    for (const abpChoice of characterData.game_character_abp_choice) {
      const node = abpChoice.node;
      if (!node) {
        console.warn(`ABP node not found for choice ${abpChoice.id}`);
        continue;
      }
      
      console.log(`Processing ABP node: ${node.name || node.id}`);
      
      // Apply all bonuses from this node
      if (node.bonuses?.length) {
        for (const bonus of node.bonuses) {
          const bonusType = bonus.bonus_type?.name || 'untyped';
          const targetSpecifier = bonus.target_specifier || '';
          const value = bonus.value || 0;
          const source = `ABP: ${node.name || 'Advanced Bonus Progression'}`;
          
          if (targetSpecifier && value) {
            console.log(`Adding ABP bonus: ${targetSpecifier} +${value} (${bonusType}) from ${source}`);
            bonusSubsystem.addBonus(entity, targetSpecifier, value, bonusType, source);
          }
        }
      }
      
      // Try to activate any feature associated with this ABP node
      if (node.name) {
        const nodeFeaturePath = `abp.${node.name.toLowerCase().replace(/\s+/g, '_')}`;
        try {
          await this.engine.activateFeature(nodeFeaturePath, entity, { node });
        } catch (error) {
          // This is expected if there's no specific feature implementation for this ABP node
          console.debug(`No feature found for ABP node: ${nodeFeaturePath} (this is normal)`);
        }
      }
    }
    
    // Store ABP choices in entity for reference
    if (!entity.character.abp) {
      entity.character.abp = {};
    }
    entity.character.abp.choices = characterData.game_character_abp_choice;
  }
  
  /**
   * Applies Favored Class Bonuses to an entity
   * @param entity The entity to apply favored class bonuses to
   * @param characterData The character data from the database
   */
  private async applyFavoredClassBonuses(entity: Entity, characterData: CompleteCharacter): Promise<void> {
    if (!characterData.game_character_favored_class_bonus?.length) {
      console.log(`No favored class bonuses found for character ${characterData.id}`);
      return;
    }
    
    console.log(`Applying ${characterData.game_character_favored_class_bonus.length} favored class bonuses for character ${characterData.id}`);
    
    // Get the bonus subsystem
    const bonusSubsystem = this.engine.getSubsystem('bonus');
    if (!bonusSubsystem) {
      console.warn('Bonus subsystem not available, cannot apply favored class bonuses');
      return;
    }
    
    // Counters for different types of favored class bonuses
    let hpBonusCount = 0;
    let skillRankBonusCount = 0;
    let otherBonusCount = 0;
    
    // Process each favored class bonus
    for (const fcBonus of characterData.game_character_favored_class_bonus) {
      const choice = fcBonus.favored_class_choice;
      if (!choice) {
        console.warn(`Favored class choice not found for bonus ${fcBonus.id}`);
        continue;
      }
      
      const className = fcBonus.class?.name || 'Unknown Class';
      console.log(`Processing favored class bonus for ${className} level ${fcBonus.level}: ${choice.name}`);
      
      // Apply bonus based on the type of choice
      switch (choice.name) {
        case 'hp':
          // +1 HP per level
          hpBonusCount++;
          bonusSubsystem.addBonus(
            entity,
            'max_hp',
            1,
            'favored_class',
            `Favored Class (${className}): HP`
          );
          break;
          
        case 'skill':
          // +1 skill rank per level
          skillRankBonusCount++;
          
          // No direct bonus here - skill ranks are applied separately
          // We'll update a counter in the entity to track how many skill ranks come from favored class bonuses
          if (!entity.character.favoredClassBonuses) {
            entity.character.favoredClassBonuses = { skillRanks: 0 };
          } else if (!entity.character.favoredClassBonuses.skillRanks) {
            entity.character.favoredClassBonuses.skillRanks = 0;
          }
          
          entity.character.favoredClassBonuses.skillRanks += 1;
          break;
          
        case 'other':
          // This is for race/class specific bonuses - we'd need to implement these individually
          otherBonusCount++;
          console.warn(`'Other' favored class bonus not implemented for ${className}`);
          
          // Try to activate a specific feature for this class's "other" bonus
          try {
            const fcFeaturePath = `class.${className.toLowerCase()}.favored_class_bonus`;
            await this.engine.activateFeature(fcFeaturePath, entity, { level: fcBonus.level });
          } catch (error) {
            // This is expected if there's no specific feature implementation
            console.debug(`No feature found for favored class bonus: ${className} (this is normal)`);
          }
          break;
          
        default:
          console.warn(`Unknown favored class choice: ${choice.name}`);
          break;
      }
    }
    
    // Log summary
    if (hpBonusCount > 0) {
      console.log(`Applied +${hpBonusCount} HP from favored class bonuses`);
    }
    
    if (skillRankBonusCount > 0) {
      console.log(`Granted +${skillRankBonusCount} skill ranks from favored class bonuses`);
    }
    
    if (otherBonusCount > 0) {
      console.log(`Applied ${otherBonusCount} 'other' favored class bonuses`);
    }
    
    // Store favored class bonuses in entity for reference
    if (!entity.character.favoredClassChoices) {
      entity.character.favoredClassChoices = [];
    }
    entity.character.favoredClassChoices = characterData.game_character_favored_class_bonus;
  }
  
  /**
   * Applies ancestry traits to an entity
   * @param entity The entity to apply traits to
   * @param characterData The character data from the database
   */
  private async applyAncestryTraits(entity: Entity, characterData: CompleteCharacter): Promise<void> {
    if (!characterData.game_character_ancestry?.length) return;
    
    const ancestryData = characterData.game_character_ancestry[0].ancestry;
    if (!ancestryData) return;
    
    // Apply base ancestry traits
    if (ancestryData.ancestry_trait?.length) {
      for (const trait of ancestryData.ancestry_trait) {
        if (trait.is_standard) {
          const traitPath = `ancestry.${ancestryData.name.toLowerCase()}.trait.${trait.name.toLowerCase()}`;
          
          try {
            // Try to activate the feature if it exists
            await this.engine.activateFeature(traitPath, entity);
          } catch (error) {
            console.warn(`Failed to apply ancestry trait ${traitPath}:`, error);
            
            // Apply manual bonuses if feat activation fails
            if (trait.ancestry_trait_benefit?.length) {
              for (const benefit of trait.ancestry_trait_benefit) {
                if (benefit.ancestry_trait_benefit_bonus?.length) {
                  for (const bonus of benefit.ancestry_trait_benefit_bonus) {
                    const bonusType = bonus.bonus_type?.name || 'untyped';
                    const target = bonus.target_specifier?.name.toLowerCase() || '';
                    const value = bonus.value || 0;
                    
                    if (target && value) {
                      const bonusSubsystem = this.engine.getSubsystem('bonus');
                      if (bonusSubsystem) {
                        bonusSubsystem.addBonus(entity, target, bonusType, value, traitPath);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Apply selected ancestry traits
    if (characterData.game_character_ancestry_trait?.length) {
      for (const charTrait of characterData.game_character_ancestry_trait) {
        const trait = charTrait.ancestry_trait;
        if (!trait) continue;
        
        const traitPath = `ancestry.${ancestryData.name.toLowerCase()}.trait.${trait.name.toLowerCase()}`;
        
        try {
          // Try to activate the feature if it exists
          await this.engine.activateFeature(traitPath, entity);
        } catch (error) {
          console.warn(`Failed to apply selected ancestry trait ${traitPath}:`, error);
          
          // Apply manual bonuses if feat activation fails
          if (trait.ancestry_trait_benefit?.length) {
            for (const benefit of trait.ancestry_trait_benefit) {
              if (benefit.ancestry_trait_benefit_bonus?.length) {
                for (const bonus of benefit.ancestry_trait_benefit_bonus) {
                  const bonusType = bonus.bonus_type?.name || 'untyped';
                  const target = bonus.target_specifier?.name.toLowerCase() || '';
                  const value = bonus.value || 0;
                  
                  if (target && value) {
                    const bonusSubsystem = this.engine.getSubsystem('bonus');
                    if (bonusSubsystem) {
                      bonusSubsystem.addBonus(entity, target, bonusType, value, traitPath);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  /**
   * Applies archetypes to an entity
   * @param entity The entity to apply archetypes to
   * @param characterData The character data from the database
   */
  private async applyArchetypes(entity: Entity, characterData: CompleteCharacter): Promise<void> {
    if (!characterData.game_character_archetype?.length) {
      console.log(`No archetypes found for character ${characterData.id}`);
      return;
    }

    console.log(`Applying ${characterData.game_character_archetype.length} archetypes for character ${characterData.id}`);
    
    // Store archetype data in the entity
    if (!entity.character.archetypes) {
      entity.character.archetypes = [];
    }
    
    // First, process each archetype (name, label, etc.)
    for (const characterArchetype of characterData.game_character_archetype) {
      const archetype = characterArchetype.archetype;
      if (!archetype) {
        console.warn(`Archetype not found for character archetype ${characterArchetype.id}`);
        continue;
      }
      
      console.log(`Processing archetype: ${archetype.label || archetype.name}`);
      
      // Add archetype to the entity
      entity.character.archetypes.push({
        id: archetype.id,
        name: archetype.name,
        label: archetype.label || archetype.name
      });
      
      // Process all archetype features
      if (archetype.archetype_class_feature?.length) {
        console.log(`Processing ${archetype.archetype_class_feature.length} archetype features for ${archetype.label || archetype.name}`);
        
        for (const archetypeFeature of archetype.archetype_class_feature) {
          if (!archetypeFeature.class_feature) continue;
          
          const feature = archetypeFeature.class_feature;
          const featureId = `archetype.${archetype.name}.${feature.name?.toLowerCase().replace(/\s+/g, '_')}`;
          
          // Store in entity that this feature replaces another feature, if applicable
          const replacements = archetypeFeature.archetype_class_feature_replacement || [];
          for (const replacement of replacements) {
            if (!entity.character.replacedFeatures) {
              entity.character.replacedFeatures = {};
            }
            
            if (!entity.character.replacedFeatures[replacement.replaced_class_feature_id]) {
              entity.character.replacedFeatures[replacement.replaced_class_feature_id] = {
                replacedBy: featureId,
                archetypeId: archetype.id
              };
            }
          }
          
          // Store in entity that this feature alters another feature, if applicable
          const alterations = archetypeFeature.archetype_class_feature_alteration || [];
          for (const alteration of alterations) {
            if (!entity.character.alteredFeatures) {
              entity.character.alteredFeatures = {};
            }
            
            if (!entity.character.alteredFeatures[alteration.altered_class_feature_id]) {
              entity.character.alteredFeatures[alteration.altered_class_feature_id] = {
                alteredBy: featureId,
                archetypeId: archetype.id
              };
            }
          }
          
          try {
            // Try to activate the specific feature
            await this.engine.activateFeature(featureId, entity, {
              archetype: archetype.name,
              feature: feature,
              level: archetypeFeature.feature_level
            });
          } catch (err) {
            console.warn(`Failed to apply archetype feature: ${featureId}`, err);
            
            // Fallback: Apply direct bonuses from feature benefits
            if (feature.class_feature_benefit?.length) {
              for (const benefit of feature.class_feature_benefit) {
                if (!benefit.class_feature_benefit_bonus?.length) continue;
                
                for (const bonus of benefit.class_feature_benefit_bonus) {
                  if (!bonus.target_specifier || !bonus.bonus_type) continue;
                  
                  // Get the bonus subsystem directly
                  const bonusSubsystem = this.engine.getSubsystem('bonus');
                  if (bonusSubsystem) {
                    bonusSubsystem.addBonus(
                      entity,
                      bonus.target_specifier.name || '',
                      bonus.value || 0,
                      bonus.bonus_type.name || 'untyped',
                      `${archetype.label}: ${feature.name || 'Archetype Feature'}`
                    );
                  }
                }
              }
            }
            
            // Create generic feature if needed
            if (this.featureRegistry) {
              const genericFeature = {
                id: featureId,
                name: feature.name || 'Unknown Feature',
                description: feature.description || `Feature from the ${archetype.label || archetype.name} archetype`
              };
              
              this.featureRegistry.register({
                ...genericFeature,
                apply: (e: Entity) => {
                  if (!e.character.archetypeFeatures) {
                    e.character.archetypeFeatures = [];
                  }
                  
                  e.character.archetypeFeatures.push(genericFeature);
                  return { success: true };
                }
              });
            }
          }
        }
      }
    }
    
    console.log(`Applied archetype features for character ${characterData.id}`);
  }

  /**
   * Applies class features to an entity
   * @param entity The entity to apply features to
   * @param characterData The character data from the database
   */
  private async applyClassFeatures(entity: Entity, characterData: CompleteCharacter): Promise<void> {
    if (!characterData.game_character_class_feature) return;
    
    console.log(`Applying ${characterData.game_character_class_feature.length} class features for character ${characterData.id}`);
    
    for (const charFeature of characterData.game_character_class_feature) {
      if (!charFeature.class_feature) continue;
      
      const feature = charFeature.class_feature;
      const featureId = `class.${feature.name?.toLowerCase().replace(/\s+/g, '_')}`;
      
      // Check if this feature was replaced by an archetype feature
      if (entity.character.replacedFeatures?.[feature.id]) {
        const replacementInfo = entity.character.replacedFeatures[feature.id];
        console.log(`Skipping class feature ${featureId} as it was replaced by ${replacementInfo.replacedBy}`);
        continue;
      }
      
      // Check if this feature was altered by an archetype feature
      const wasAltered = entity.character.alteredFeatures?.[feature.id];
      
      try {
        // Try to activate the feature, passing alteration info if it exists
        await this.engine.activateFeature(featureId, entity, {
          altered: wasAltered ? true : false,
          alteredBy: wasAltered ? wasAltered.alteredBy : undefined
        });
      } catch (err) {
        console.warn(`Failed to apply class feature: ${featureId}`, err);
        
        // Fallback: Apply direct bonuses from feature benefits
        if (feature.class_feature_benefit) {
          for (const benefit of feature.class_feature_benefit) {
            if (!benefit.class_feature_benefit_bonus) continue;
            
            for (const bonus of benefit.class_feature_benefit_bonus) {
              if (!bonus.target_specifier || !bonus.bonus_type) continue;
              
              // Get the bonus subsystem directly
              const bonusSubsystem = this.engine.getSubsystem('bonus');
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
        
        // Create a generic class feature
        if (this.featureRegistry && !wasAltered) {
          const genericFeature = {
            id: featureId,
            name: feature.name || 'Unknown Feature',
            description: feature.description || 'A class feature'
          };
          
          this.featureRegistry.register({
            ...genericFeature,
            apply: (e: Entity) => {
              if (!e.character.classFeatures) {
                e.character.classFeatures = [];
              }
              
              e.character.classFeatures.push(genericFeature);
              return { success: true };
            }
          });
        }
      }
    }
    
    console.log(`Applied class features for character ${characterData.id}`);
  }
  
  /**
   * Applies sorcerer bloodlines to an entity
   * @param entity The entity to apply bloodlines to
   * @param characterData The character data from the database
   */
  private async applySorcererBloodlines(entity: Entity, characterData: CompleteCharacter): Promise<void> {
    // Check if character is a sorcerer or has sorcerer class levels
    const hasSorcererClass = characterData.game_character_class?.some(
      gc => gc.class?.name?.toLowerCase().includes('sorcerer')
    );
    
    if (!hasSorcererClass) {
      console.log(`Character ${characterData.id} is not a sorcerer, skipping bloodlines`);
      return;
    }
    
    console.log(`Applying sorcerer bloodlines for character ${characterData.id}`);
    
    // Initialize bloodlines array in entity
    if (!entity.character.bloodlines) {
      entity.character.bloodlines = [];
    }
    
    // Get sorcerer class data
    const sorcererClass = characterData.game_character_class?.find(
      gc => gc.class?.name?.toLowerCase().includes('sorcerer')
    );
    
    if (!sorcererClass || !sorcererClass.class) {
      console.warn(`Sorcerer class data not found for character ${characterData.id}`);
      return;
    }
    
    const sorcererLevel = sorcererClass.level || 0;
    
    // First, try to find already selected bloodlines from game_character_sorcerer_bloodline if it exists
    let bloodlineIds: number[] = [];
    
    if (characterData.game_character_sorcerer_bloodline?.length) {
      bloodlineIds = characterData.game_character_sorcerer_bloodline.map(
        b => b.sorcerer_bloodline_id
      ).filter(Boolean) as number[];
    }
    // Otherwise, use a default bloodline or find a bloodline associated with their spells
    else if (characterData.game_character_spell?.length) {
      // Find a bloodline associated with the character's spells
      const spellIds = characterData.game_character_spell.map(s => s.spell_id).filter(Boolean);
      
      if (spellIds.length) {
        // Query spell_sorcerer_bloodline_mapping to find bloodlines associated with these spells
        const { data: spellBloodlineMappings } = await this.gameRulesAPI.supabase
          .from('spell_sorcerer_bloodline_mapping')
          .select('sorcerer_bloodline_id')
          .in('spell_id', spellIds);
        
        if (spellBloodlineMappings?.length) {
          // Get unique bloodline IDs
          const uniqueBloodlineIds = [...new Set(
            spellBloodlineMappings.map(m => m.sorcerer_bloodline_id)
          )];
          
          bloodlineIds = uniqueBloodlineIds.filter(Boolean) as number[];
        }
      }
    }
    
    // If we still don't have any bloodlines, try to get all available ones
    if (!bloodlineIds.length) {
      const { data: bloodlines } = await this.gameRulesAPI.supabase
        .from('sorcerer_bloodline')
        .select('id');
      
      if (bloodlines?.length) {
        bloodlineIds = bloodlines.map(b => b.id).filter(Boolean) as number[];
      }
    }
    
    console.log(`Found ${bloodlineIds.length} bloodlines for sorcerer`);
    
    // For each bloodline ID, get the bloodline data
    for (const bloodlineId of bloodlineIds) {
      // Get bloodline details
      const { data: bloodline } = await this.gameRulesAPI.supabase
        .from('sorcerer_bloodline')
        .select('*')
        .eq('id', bloodlineId)
        .single();
      
      if (!bloodline) {
        console.warn(`Bloodline with ID ${bloodlineId} not found for character ${characterData.id}`);
        continue;
      }
      
      console.log(`Processing bloodline: ${bloodline.label || bloodline.name}`);
      
      // Get bloodline spells
      const { data: bloodlineSpells } = await this.gameRulesAPI.supabase
        .from('spell_sorcerer_bloodline_mapping')
        .select('*, spell:spell(*)')
        .eq('sorcerer_bloodline_id', bloodlineId)
        .order('level');
      
      // Prepare bloodline object
      const bloodlineObject = {
        id: bloodline.id,
        name: bloodline.name,
        label: bloodline.label || bloodline.name,
        description: bloodline.description || '',
        spells: bloodlineSpells?.map(mapping => ({
          id: mapping.spell?.id,
          name: mapping.spell?.name,
          label: mapping.spell?.label,
          level: mapping.level
        })) || []
      };
      
      // Add bloodline to the entity
      entity.character.bloodlines.push(bloodlineObject);
      
      // Try to activate the bloodline as a feature
      const featureId = `bloodline.${bloodline.name.toLowerCase().replace(/\s+/g, '_')}`;
      
      try {
        // Try to activate the specific feature
        await this.engine.activateFeature(featureId, entity, {
          bloodline,
          sorcererLevel
        });
      } catch (err) {
        console.warn(`Failed to apply bloodline feature: ${featureId}`, err);
        
        // Create generic feature if needed
        if (this.featureRegistry) {
          const genericFeature = {
            id: featureId,
            name: bloodline.label || bloodline.name,
            description: bloodline.description || `${bloodline.label || bloodline.name} sorcerer bloodline`
          };
          
          this.featureRegistry.register({
            ...genericFeature,
            apply: (e: Entity) => {
              // No special logic for generic bloodlines for now,
              // they're already stored in the entity
              return { success: true };
            }
          });
        }
      }
    }
    
    console.log(`Applied ${entity.character.bloodlines.length} sorcerer bloodlines for character ${characterData.id}`);
  }

  /**
   * Applies monk ki powers to an entity
   * @param entity The entity to apply monk ki powers to
   * @param characterData The character data from the database
   */
  private async applyMonkKiPowers(entity: Entity, characterData: CompleteCharacter): Promise<void> {
    // Check if character is a monk or has monk class levels
    const hasMonkClass = characterData.game_character_class?.some(
      gc => gc.class?.name?.toLowerCase().includes('monk')
    );
    
    if (!hasMonkClass) {
      console.log(`Character ${characterData.id} is not a monk, skipping ki powers`);
      return;
    }
    
    console.log(`Applying monk ki powers for character ${characterData.id}`);
    
    // Initialize kiPowers array in entity
    if (!entity.character.kiPowers) {
      entity.character.kiPowers = [];
    }
    
    // Get monk class data to determine level and available ki powers
    const monkClass = characterData.game_character_class?.find(
      gc => gc.class?.name?.toLowerCase().includes('monk')
    );
    
    if (!monkClass || !monkClass.class) {
      console.warn(`Monk class data not found for character ${characterData.id}`);
      return;
    }
    
    const monkLevel = monkClass.level || 0;
    const isUnchaiedMonk = monkClass.class.name?.toLowerCase().includes('unchained');
    
    // Get available ki powers based on monk level
    let availableKiPowers: any[] = [];
    
    // For unchained monk, get powers from monk_unchained_ki_power table
    if (isUnchaiedMonk) {
      // Get data from monk_unchained_ki_power where min_level <= monkLevel
      const { data: unchaiedKiPowers } = await this.gameRulesAPI.supabase
        .from('monk_unchained_ki_power')
        .select('*')
        .lte('min_level', monkLevel);
      
      if (unchaiedKiPowers?.length) {
        availableKiPowers = unchaiedKiPowers;
      }
    } 
    // For core monk, get powers from qinggong_monk_ki_power table
    else {
      // Get data from qinggong_monk_ki_power where min_level <= monkLevel
      const { data: qinggongKiPowers } = await this.gameRulesAPI.supabase
        .from('qinggong_monk_ki_power')
        .select('*, power_type:qinggong_monk_ki_power_type(*)')
        .lte('min_level', monkLevel);
      
      if (qinggongKiPowers?.length) {
        availableKiPowers = qinggongKiPowers;
      }
    }
    
    console.log(`Found ${availableKiPowers.length} available ki powers for level ${monkLevel} monk`);
    
    // Process each available ki power
    for (const kiPower of availableKiPowers) {
      // Build the ki power object to store in the entity
      const kiPowerObject = {
        id: kiPower.id,
        name: kiPower.name,
        label: kiPower.label,
        description: kiPower.description,
        type: kiPower.type,
        minLevel: kiPower.min_level,
        kiCost: kiPower.ki_cost || 0,
        powerType: kiPower.power_type?.name || 'unknown',
        powerTypeLabel: kiPower.power_type?.label || 'Unknown'
      };
      
      // Add ki power to the entity
      entity.character.kiPowers.push(kiPowerObject);
      
      // Try to activate the ki power as a feature
      const featureId = `ki_power.${kiPower.name.toLowerCase().replace(/\s+/g, '_')}`;
      
      try {
        // Try to activate the specific feature
        await this.engine.activateFeature(featureId, entity, {
          kiPower,
          monkLevel
        });
      } catch (err) {
        console.warn(`Failed to apply ki power feature: ${featureId}`, err);
        
        // Create generic feature if needed
        if (this.featureRegistry) {
          const genericFeature = {
            id: featureId,
            name: kiPower.label || kiPower.name,
            description: kiPower.description || `${kiPower.label || kiPower.name} ki power`
          };
          
          this.featureRegistry.register({
            ...genericFeature,
            apply: (e: Entity) => {
              // No special logic for generic ki powers for now,
              // they're already stored in the entity
              return { success: true };
            }
          });
        }
      }
    }
    
    console.log(`Applied ${entity.character.kiPowers.length} monk ki powers for character ${characterData.id}`);
  }

  /**
   * Applies wild talents to an entity
   * @param entity The entity to apply wild talents to
   * @param characterData The character data from the database
   */
  private async applyWildTalents(entity: Entity, characterData: CompleteCharacter): Promise<void> {
    if (!characterData.game_character_wild_talent?.length) {
      console.log(`No wild talents found for character ${characterData.id}`);
      return;
    }

    console.log(`Applying ${characterData.game_character_wild_talent.length} wild talents for character ${characterData.id}`);
    
    // Store wild talent data in the entity
    if (!entity.character.wildTalents) {
      entity.character.wildTalents = [];
    }
    
    // Process each wild talent
    for (const characterWildTalent of characterData.game_character_wild_talent) {
      const wildTalent = characterWildTalent.wild_talent;
      if (!wildTalent) {
        console.warn(`Wild talent not found for character wild talent ${characterWildTalent.id}`);
        continue;
      }
      
      console.log(`Processing wild talent: ${wildTalent.label || wildTalent.name}`);
      
      // Get level obtained
      const levelObtained = characterWildTalent.level_obtained || 1;
      
      // Get wild talent type
      const wildTalentType = wildTalent.wild_talent_type;
      const typeName = wildTalentType?.name || 'unknown';
      const typeLabel = wildTalentType?.label || 'Unknown Type';
      
      // Add wild talent to the entity
      entity.character.wildTalents.push({
        id: wildTalent.id,
        name: wildTalent.name,
        label: wildTalent.label || wildTalent.name,
        description: wildTalent.description,
        type: typeName,
        typeLabel: typeLabel,
        levelObtained,
        burn: wildTalent.burn || 0,
        associatedBlasts: wildTalent.associated_blasts,
        savingThrow: wildTalent.saving_throw
      });
      
      // Try to activate the wild talent as a feature
      const featureId = `wild_talent.${wildTalent.name.toLowerCase().replace(/\s+/g, '_')}`;
      
      try {
        // Try to activate the specific feature
        await this.engine.activateFeature(featureId, entity, {
          wildTalent,
          levelObtained,
          burn: wildTalent.burn || 0
        });
      } catch (err) {
        console.warn(`Failed to apply wild talent feature: ${featureId}`, err);
        
        // Create generic feature if needed
        if (this.featureRegistry) {
          const genericFeature = {
            id: featureId,
            name: wildTalent.label || wildTalent.name,
            description: wildTalent.description || `${wildTalent.label || wildTalent.name} wild talent`
          };
          
          this.featureRegistry.register({
            ...genericFeature,
            apply: (e: Entity) => {
              // No special logic for generic wild talents for now,
              // they're already stored in the entity
              return { success: true };
            }
          });
        }
      }
    }
    
    console.log(`Applied wild talents for character ${characterData.id}`);
  }

  /**
   * Applies discoveries to an entity
   * @param entity The entity to apply discoveries to
   * @param characterData The character data from the database
   */
  private async applyDiscoveries(entity: Entity, characterData: CompleteCharacter): Promise<void> {
    if (!characterData.game_character_discovery?.length) {
      console.log(`No discoveries found for character ${characterData.id}`);
      return;
    }

    console.log(`Applying ${characterData.game_character_discovery.length} discoveries for character ${characterData.id}`);
    
    // Store discovery data in the entity
    if (!entity.character.discoveries) {
      entity.character.discoveries = [];
    }
    
    // Process each discovery
    for (const characterDiscovery of characterData.game_character_discovery) {
      const discovery = characterDiscovery.discovery;
      if (!discovery) {
        console.warn(`Discovery not found for character discovery ${characterDiscovery.id}`);
        continue;
      }
      
      console.log(`Processing discovery: ${discovery.label || discovery.name}`);
      
      // Get level obtained
      const levelObtained = characterDiscovery.level_obtained || 1;
      
      // Add discovery to the entity
      entity.character.discoveries.push({
        id: discovery.id,
        name: discovery.name,
        label: discovery.label || discovery.name,
        levelObtained
      });
      
      // Try to activate the discovery as a feature
      const featureId = `discovery.${discovery.name.toLowerCase().replace(/\s+/g, '_')}`;
      
      try {
        // Try to activate the specific feature
        await this.engine.activateFeature(featureId, entity, {
          discovery,
          levelObtained
        });
      } catch (err) {
        console.warn(`Failed to apply discovery feature: ${featureId}`, err);
        
        // Create generic feature if needed
        if (this.featureRegistry) {
          const genericFeature = {
            id: featureId,
            name: discovery.name,
            description: discovery.description || `The ${discovery.label || discovery.name} alchemist discovery`
          };
          
          this.featureRegistry.register({
            ...genericFeature,
            apply: (e: Entity) => {
              // No special logic for generic discoveries for now,
              // they're already stored in the entity
              return { success: true };
            }
          });
        }
      }
    }
    
    console.log(`Applied discoveries for character ${characterData.id}`);
  }

  /**
   * Applies feats to an entity
   * @param entity The entity to apply feats to
   * @param characterData The character data from the database
   */
  private async applyFeats(entity: Entity, characterData: CompleteCharacter): Promise<void> {
    if (!characterData.game_character_feat) return;
    
    for (const charFeat of characterData.game_character_feat) {
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
   * Applies equipment effects to an entity
   * @param entity The entity to apply equipment to
   * @param characterData The character data from the database
   */
  private async applyEquipment(entity: Entity, characterData: CompleteCharacter): Promise<void> {
    // Initialize equipment arrays in entity
    if (!entity.character.weapons) entity.character.weapons = [];
    if (!entity.character.armor) entity.character.armor = [];
    if (!entity.character.equipment) entity.character.equipment = [];
    
    // Get the bonus subsystem
    const bonusSubsystem = this.engine.getSubsystem('bonus');
    
    // Apply armor and armor enhancements
    if (characterData.game_character_armor?.length) {
      console.log(`Applying ${characterData.game_character_armor.length} armor items for character ${characterData.id}`);
      
      for (const charArmor of characterData.game_character_armor) {
        if (!charArmor.armor) continue;
        
        const armor = charArmor.armor;
        const enhancement = charArmor.enhancement || 0;
        
        // Add armor to the entity
        entity.character.armor.push({
          id: armor.id,
          name: armor.name,
          label: armor.label || armor.name,
          type: armor.armor_type,
          enhancement: enhancement,
          maxDex: armor.max_dex,
          armorBonus: armor.armor_bonus || 0,
          checkPenalty: armor.armor_check_penalty || 0,
          spellFailure: armor.arcane_spell_failure_chance || 0
        });
        
        if (bonusSubsystem) {
          // Apply basic armor bonus to AC
          bonusSubsystem.addBonus(
            entity,
            'ac',
            armor.armor_bonus || 0,
            'armor',
            armor.label || armor.name || 'Armor'
          );
          
          // Apply enhancement bonus if present
          if (enhancement > 0) {
            bonusSubsystem.addBonus(
              entity,
              'ac',
              enhancement,
              'enhancement',
              `${armor.label || armor.name} Enhancement`
            );
          }
          
          // Apply max dex bonus
          if (armor.max_dex !== undefined && armor.max_dex !== null) {
            // Store max dex info in entity
            if (!entity.character.armorInfo) entity.character.armorInfo = {};
            entity.character.armorInfo.maxDex = armor.max_dex;
          }
        }
      }
    }
    
    // Apply weapons and weapon enhancements
    if (characterData.game_character_weapon?.length) {
      console.log(`Applying ${characterData.game_character_weapon.length} weapons for character ${characterData.id}`);
      
      for (const charWeapon of characterData.game_character_weapon) {
        if (!charWeapon.weapon) continue;
        
        const weapon = charWeapon.weapon;
        const enhancement = charWeapon.enhancement || 0;
        const isMasterwork = charWeapon.masterwork || false;
        
        // Add weapon to the entity
        entity.character.weapons.push({
          id: weapon.id,
          name: weapon.name,
          label: weapon.label || weapon.name,
          enhancement: enhancement,
          masterwork: isMasterwork,
          damageDieCount: weapon.damage_die_count,
          damageDieSize: weapon.damage_die_size,
          critRange: weapon.crit_range,
          critMult: weapon.crit_mult
        });
        
        if (bonusSubsystem) {
          // Apply enhancement bonus to attack and damage if present
          if (enhancement > 0) {
            bonusSubsystem.addBonus(
              entity,
              'attack',
              enhancement,
              'enhancement',
              `${weapon.label || weapon.name} Enhancement`
            );
            
            bonusSubsystem.addBonus(
              entity,
              'weapon_damage',
              enhancement,
              'enhancement',
              `${weapon.label || weapon.name} Enhancement`
            );
          }
          
          // Apply masterwork bonus to attack but not damage
          if (isMasterwork && enhancement <= 0) {
            bonusSubsystem.addBonus(
              entity,
              'attack',
              1,
              'enhancement',
              `${weapon.label || weapon.name} Masterwork`
            );
          }
        }
        
        // Try to activate weapon as a feature
        const featureId = `weapon.${weapon.name.toLowerCase().replace(/\s+/g, '_')}`;
        try {
          await this.engine.activateFeature(featureId, entity, {
            weapon,
            enhancement,
            masterwork: isMasterwork
          });
        } catch (err) {
          // Expected if there's no specific implementation
          console.debug(`No specific feature found for weapon: ${featureId} (this is normal)`);
        }
      }
    }
    
    // Apply misc equipment
    if (characterData.game_character_equipment?.length) {
      console.log(`Applying ${characterData.game_character_equipment.length} equipment items for character ${characterData.id}`);
      
      for (const charEquipment of characterData.game_character_equipment) {
        if (!charEquipment.equipment) continue;
        
        const equipment = charEquipment.equipment;
        
        // Add equipment to the entity
        entity.character.equipment.push({
          id: equipment.id,
          name: equipment.name,
          label: equipment.label || equipment.name,
          equippable: equipment.equippable,
          slot: equipment.slot
        });
        
        // Apply any direct bonuses from equipment
        if (bonusSubsystem && equipment.bonus && equipment.bonus_type_id) {
          // Get the bonus type name from ID
          const { data: bonusType } = await this.gameRulesAPI.supabase
            .from('bonus_type')
            .select('name')
            .eq('id', equipment.bonus_type_id)
            .single();
          
          const bonusTypeName = bonusType?.name || 'untyped';
          
          // Add the bonus
          bonusSubsystem.addBonus(
            entity,
            equipment.slot || 'misc',
            equipment.bonus,
            bonusTypeName,
            equipment.label || equipment.name || 'Equipment'
          );
        }
        
        // Try to activate equipment as a feature
        const featureId = `equipment.${equipment.name.toLowerCase().replace(/\s+/g, '_')}`;
        try {
          await this.engine.activateFeature(featureId, entity, {
            equipment
          });
        } catch (err) {
          // Expected if there's no specific implementation
          console.debug(`No specific feature found for equipment: ${featureId} (this is normal)`);
        }
      }
    }
  }
  
  /**
   * Applies corruption effects to an entity
   * @param entity The entity to apply corruptions to
   * @param characterData The character data from the database
   */
  private async applyCorruptions(entity: Entity, characterData: CompleteCharacter): Promise<void> {
    if (!characterData.game_character_corruption_manifestation) return;
    
    for (const charManifestation of characterData.game_character_corruption_manifestation) {
      if (!charManifestation.manifestation) continue;
      
      const manifestation = charManifestation.manifestation;
      const manifestationId = `corruption.${manifestation.name?.toLowerCase().replace(/\s+/g, '_')}`;
      
      try {
        // Try to activate the feature
        await this.engine.activateFeature(manifestationId, entity, {});
      } catch (error) {
        console.warn(`Failed to apply corruption manifestation: ${manifestationId}`, error);
      }
    }
  }
  
  /**
   * Register known spells as features
   * @param entity The entity to register spells for
   * @param characterData The character data from the database
   */
  private async registerKnownSpells(entity: Entity, characterData: CompleteCharacter): Promise<void> {
    if (!characterData.game_character_spell?.length) {
      console.log(`No spells found for character ${characterData.id}`);
      return;
    }
    
    console.log(`Registering ${characterData.game_character_spell.length} spells for character ${characterData.id}`);
    
    // Track the spells we've already registered to avoid duplicates
    const registeredSpells = new Set<string>();
    
    // Register each spell as an available feature
    for (const charSpell of characterData.game_character_spell) {
      if (!charSpell.spell) continue;
      
      const spell = charSpell.spell;
      const spellId = `spell.${spell.name?.toLowerCase().replace(/\s+/g, '_')}`;
      
      // Skip if we've already registered this spell
      if (registeredSpells.has(spellId)) continue;
      
      try {
        // Register the spell in the feature registry
        // This doesn't activate it - just makes it available for casting
        const feature = await this.engine.resolveFeature(spellId);
        
        if (feature) {
          console.log(`Registered spell: ${spellId}`);
          registeredSpells.add(spellId);
        } else {
          // If we couldn't resolve a specific implementation, register a generic spell feature
          console.log(`Creating generic spell feature for: ${spellId}`);
          const genericSpell = this.createGenericSpellFeature(spell);
          this.featureRegistry.register(genericSpell);
          registeredSpells.add(spellId);
        }
      } catch (error) {
        console.warn(`Failed to register spell: ${spellId}`, error);
      }
    }
    
    console.log(`Registered ${registeredSpells.size} unique spells for character ${characterData.id}`);
  }
  
  /**
   * Create a generic spell feature for a spell without a specific implementation
   */
  private createGenericSpellFeature(spell: any): Feature {
    const spellId = `spell.${spell.name?.toLowerCase().replace(/\s+/g, '_')}`;
    
    return {
      id: spellId,
      name: spell.label || spell.name || 'Unknown Spell',
      description: spell.description || 'No description available',
      
      async canApply(entity: Entity, options: any = {}): Promise<boolean> {
        return true;
      },
      
      async apply(entity: Entity, options: any = {}): Promise<void> {
        console.log(`Casting generic spell: ${spell.label || spell.name}`);
        
        // Implement generic spell effects based on metadata if available
        // For now, this is just a placeholder
      },
      
      async remove(entity: Entity, options: any = {}): Promise<void> {
        // Most spells don't have persistent effects to remove
      }
    };
  }
  
  /**
   * Applies previously active features to an entity from database records
   * @param entity The entity to apply features to
   * @param characterId The database ID of the character
   */
  private async applyActiveFeatures(entity: Entity, characterId: number): Promise<void> {
    // Get entity record for this character
    const { data: entityData } = await this.gameRulesAPI.supabase
      .from('entity')
      .select('id')
      .eq('type', 'character')
      .eq('ref_id', characterId)
      .single();
    
    if (!entityData) {
      console.warn(`No entity record found for character ID ${characterId}`);
      return;
    }
    
    // Get active features for this entity
    const { data: activeFeatures } = await this.gameRulesAPI.supabase
      .from('active_feature')
      .select('*')
      .eq('entity_id', entityData.id)
      .is('deactivated_at', null);
    
    if (!activeFeatures?.length) return;
    
    // Apply each active feature
    for (const feature of activeFeatures) {
      const featurePath = feature.feature_path;
      
      try {
        // Try to activate the feature if it exists
        await this.engine.activateFeature(featurePath, entity, feature.options || {});
        
        // Update feature state if needed
        if (feature.state) {
          entity.activeFeatures = entity.activeFeatures || [];
          const activeFeature = entity.activeFeatures.find(f => f.path === featurePath);
          
          if (activeFeature) {
            activeFeature.state = feature.state;
          }
        }
      } catch (error) {
        console.warn(`Failed to apply active feature ${featurePath}:`, error);
      }
    }
  }
}