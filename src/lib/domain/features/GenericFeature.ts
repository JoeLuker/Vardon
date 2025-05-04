import type { Entity } from '../types/EntityTypes';
import type { Feature, ValidationResult } from '../types/FeatureTypes';
import type { BonusSubsystem, Subsystem } from '../types/SubsystemTypes';

/**
 * GenericFeature is a fallback implementation that can be used when no specific
 * feature implementation is available. It applies basic bonus effects based on
 * database data, and stores the feature in the entity's state.
 * 
 * This follows the Unix philosophy of doing one thing well - providing a reliable
 * fallback for features without specific implementations.
 */
export class GenericFeature {
  /**
   * Creates a generic feature handler for the given ID
   * @param id The feature ID
   * @param name Display name for the feature
   * @param description Optional description
   * @returns A Feature object
   */
  static create(id: string, name: string, description: string = ''): Feature {
    console.log(`Creating GenericFeature: ${id}, name: ${name}`);
    
    return {
      id,
      name,
      description,
      requiredSubsystems: ['bonus'],
      
      apply(entity: Entity, options = {}, subsystems: { bonus?: BonusSubsystem }) {
        try {
          // Ensure entity and character objects exist
          if (!entity) {
            console.error(`GenericFeature ${id}: Entity is null or undefined`);
            return { success: false, error: 'Entity is null or undefined' };
          }
          
          if (!entity.character) entity.character = {};
          
          // Determine the feature category from the ID
          const category = id.split('.')[0] || '';
          
          // Store in appropriate category based on ID prefix
          switch (category) {
            case 'corruption':
              if (!entity.character.corruptions) entity.character.corruptions = [];
              
              // Check if feature is already applied to avoid duplicates
              const existingCorruption = entity.character.corruptions.find(c => c.id === id);
              if (!existingCorruption) {
                entity.character.corruptions.push({
                  id,
                  name,
                  description,
                  options
                });
                console.log(`Applied generic corruption feature: ${id}`);
              } else {
                console.log(`Corruption ${id} already applied, updating options`);
                // Update options for existing feature
                Object.assign(existingCorruption.options || {}, options || {});
              }
              break;
              
            case 'class':
              if (!entity.character.classFeatures) entity.character.classFeatures = [];
              
              const existingClassFeature = entity.character.classFeatures.find(f => f.id === id);
              if (!existingClassFeature) {
                entity.character.classFeatures.push({
                  id,
                  name,
                  description,
                  options
                });
                console.log(`Applied generic class feature: ${id}`);
              } else {
                console.log(`Class feature ${id} already applied, updating options`);
                Object.assign(existingClassFeature.options || {}, options || {});
              }
              break;
              
            case 'feat':
              if (!entity.character.feats) entity.character.feats = [];
              
              const existingFeat = entity.character.feats.find(f => f.id === id);
              if (!existingFeat) {
                entity.character.feats.push({
                  id,
                  name,
                  description,
                  options
                });
                console.log(`Applied generic feat: ${id}`);
              } else {
                console.log(`Feat ${id} already applied, updating options`);
                Object.assign(existingFeat.options || {}, options || {});
              }
              break;
              
            case 'ancestry':
              if (!entity.character.ancestryTraits) entity.character.ancestryTraits = [];
              
              const existingTrait = entity.character.ancestryTraits.find(t => t.id === id);
              if (!existingTrait) {
                entity.character.ancestryTraits.push({
                  id,
                  name,
                  description,
                  options
                });
                console.log(`Applied generic ancestry trait: ${id}`);
              } else {
                console.log(`Ancestry trait ${id} already applied, updating options`);
                Object.assign(existingTrait.options || {}, options || {});
              }
              break;
              
            case 'spell':
              if (!entity.character.knownSpells) entity.character.knownSpells = [];
              
              const existingSpell = entity.character.knownSpells.find(s => s.id === id);
              if (!existingSpell) {
                entity.character.knownSpells.push({
                  id,
                  name,
                  description,
                  options
                });
                console.log(`Applied generic spell: ${id}`);
              } else {
                console.log(`Spell ${id} already applied, updating options`);
                Object.assign(existingSpell.options || {}, options || {});
              }
              break;
              
            case 'archetype':
              if (!entity.character.archetypeFeatures) entity.character.archetypeFeatures = [];
              
              const existingArchetypeFeature = entity.character.archetypeFeatures.find(af => af.id === id);
              if (!existingArchetypeFeature) {
                entity.character.archetypeFeatures.push({
                  id,
                  name,
                  description,
                  options
                });
                console.log(`Applied generic archetype feature: ${id}`);
              } else {
                console.log(`Archetype feature ${id} already applied, updating options`);
                Object.assign(existingArchetypeFeature.options || {}, options || {});
              }
              break;
              
            case 'discovery':
              if (!entity.character.discoveryFeatures) entity.character.discoveryFeatures = [];
              
              const existingDiscoveryFeature = entity.character.discoveryFeatures.find(df => df.id === id);
              if (!existingDiscoveryFeature) {
                entity.character.discoveryFeatures.push({
                  id,
                  name,
                  description,
                  options
                });
                console.log(`Applied generic discovery feature: ${id}`);
              } else {
                console.log(`Discovery feature ${id} already applied, updating options`);
                Object.assign(existingDiscoveryFeature.options || {}, options || {});
              }
              break;
              
            case 'wild_talent':
              if (!entity.character.wildTalentFeatures) entity.character.wildTalentFeatures = [];
              
              const existingWildTalentFeature = entity.character.wildTalentFeatures.find(wt => wt.id === id);
              if (!existingWildTalentFeature) {
                entity.character.wildTalentFeatures.push({
                  id,
                  name,
                  description,
                  options
                });
                console.log(`Applied generic wild talent feature: ${id}`);
              } else {
                console.log(`Wild talent feature ${id} already applied, updating options`);
                Object.assign(existingWildTalentFeature.options || {}, options || {});
              }
              break;
              
            case 'ki_power':
              if (!entity.character.kiPowerFeatures) entity.character.kiPowerFeatures = [];
              
              const existingKiPowerFeature = entity.character.kiPowerFeatures.find(kp => kp.id === id);
              if (!existingKiPowerFeature) {
                entity.character.kiPowerFeatures.push({
                  id,
                  name,
                  description,
                  options
                });
                console.log(`Applied generic ki power feature: ${id}`);
              } else {
                console.log(`Ki power feature ${id} already applied, updating options`);
                Object.assign(existingKiPowerFeature.options || {}, options || {});
              }
              break;
              
            case 'bloodline':
              if (!entity.character.bloodlineFeatures) entity.character.bloodlineFeatures = [];
              
              const existingBloodlineFeature = entity.character.bloodlineFeatures.find(bl => bl.id === id);
              if (!existingBloodlineFeature) {
                entity.character.bloodlineFeatures.push({
                  id,
                  name,
                  description,
                  options
                });
                console.log(`Applied generic bloodline feature: ${id}`);
              } else {
                console.log(`Bloodline feature ${id} already applied, updating options`);
                Object.assign(existingBloodlineFeature.options || {}, options || {});
              }
              break;
              
            case 'weapon':
              if (!entity.character.weaponFeatures) entity.character.weaponFeatures = [];
              
              const existingWeaponFeature = entity.character.weaponFeatures.find(w => w.id === id);
              if (!existingWeaponFeature) {
                entity.character.weaponFeatures.push({
                  id,
                  name,
                  description,
                  options
                });
                console.log(`Applied generic weapon feature: ${id}`);
              } else {
                console.log(`Weapon feature ${id} already applied, updating options`);
                Object.assign(existingWeaponFeature.options || {}, options || {});
              }
              break;
              
            case 'equipment':
              if (!entity.character.equipmentFeatures) entity.character.equipmentFeatures = [];
              
              const existingEquipmentFeature = entity.character.equipmentFeatures.find(e => e.id === id);
              if (!existingEquipmentFeature) {
                entity.character.equipmentFeatures.push({
                  id,
                  name,
                  description,
                  options
                });
                console.log(`Applied generic equipment feature: ${id}`);
              } else {
                console.log(`Equipment feature ${id} already applied, updating options`);
                Object.assign(existingEquipmentFeature.options || {}, options || {});
              }
              break;
              
            default:
              // Handle unknown feature types
              console.warn(`Unknown feature type for generic feature ${id}, storing as generic`);
              if (!entity.character.features) entity.character.features = [];
              
              const existingFeature = entity.character.features.find(f => f.id === id);
              if (!existingFeature) {
                entity.character.features.push({
                  id,
                  name,
                  description,
                  options
                });
                console.log(`Applied unknown generic feature: ${id}`);
              } else {
                console.log(`Unknown feature ${id} already applied, updating options`);
                Object.assign(existingFeature.options || {}, options || {});
              }
              break;
          }
          
          // Apply any bonuses from options if they exist
          try {
            if (subsystems.bonus && options && typeof options === 'object') {
              const { bonuses } = options as { bonuses?: Array<{ target: string, value: number, type: string }> };
              
              if (bonuses && Array.isArray(bonuses)) {
                bonuses.forEach(bonus => {
                  subsystems.bonus?.addBonus(
                    entity,
                    bonus.target,
                    bonus.value,
                    bonus.type || 'untyped',
                    name
                  );
                  console.log(`Applied bonus ${bonus.value} ${bonus.type} to ${bonus.target} from ${id}`);
                });
              }
            }
          } catch (bonusError) {
            console.warn(`Error applying bonuses for ${id}:`, bonusError);
          }
          
          return {
            success: true,
            id,
            name,
            options
          };
        } catch (error) {
          console.error(`Error in GenericFeature.apply for ${id}:`, error);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      },
      
      unapply(entity: Entity, options = {}, subsystems: { bonus?: BonusSubsystem }) {
        try {
          if (!entity || !entity.character) {
            return { success: false, error: 'Entity or character is null' };
          }
          
          // Determine the feature category from the ID
          const category = id.split('.')[0] || '';
          
          // Remove from appropriate category based on ID prefix
          switch (category) {
            case 'corruption':
              if (entity.character.corruptions) {
                entity.character.corruptions = entity.character.corruptions.filter(c => c.id !== id);
                console.log(`Removed generic corruption feature: ${id}`);
              }
              break;
              
            case 'class':
              if (entity.character.classFeatures) {
                entity.character.classFeatures = entity.character.classFeatures.filter(f => f.id !== id);
                console.log(`Removed generic class feature: ${id}`);
              }
              break;
              
            case 'feat':
              if (entity.character.feats) {
                entity.character.feats = entity.character.feats.filter(f => f.id !== id);
                console.log(`Removed generic feat: ${id}`);
              }
              break;
              
            case 'ancestry':
              if (entity.character.ancestryTraits) {
                entity.character.ancestryTraits = entity.character.ancestryTraits.filter(t => t.id !== id);
                console.log(`Removed generic ancestry trait: ${id}`);
              }
              break;
              
            case 'spell':
              if (entity.character.knownSpells) {
                entity.character.knownSpells = entity.character.knownSpells.filter(s => s.id !== id);
                console.log(`Removed generic spell: ${id}`);
              }
              break;
              
            case 'archetype':
              if (entity.character.archetypeFeatures) {
                entity.character.archetypeFeatures = entity.character.archetypeFeatures.filter(af => af.id !== id);
                console.log(`Removed generic archetype feature: ${id}`);
              }
              break;
              
            case 'discovery':
              if (entity.character.discoveryFeatures) {
                entity.character.discoveryFeatures = entity.character.discoveryFeatures.filter(df => df.id !== id);
                console.log(`Removed generic discovery feature: ${id}`);
              }
              break;
              
            case 'wild_talent':
              if (entity.character.wildTalentFeatures) {
                entity.character.wildTalentFeatures = entity.character.wildTalentFeatures.filter(wt => wt.id !== id);
                console.log(`Removed generic wild talent feature: ${id}`);
              }
              break;
              
            case 'ki_power':
              if (entity.character.kiPowerFeatures) {
                entity.character.kiPowerFeatures = entity.character.kiPowerFeatures.filter(kp => kp.id !== id);
                console.log(`Removed generic ki power feature: ${id}`);
              }
              break;
              
            case 'bloodline':
              if (entity.character.bloodlineFeatures) {
                entity.character.bloodlineFeatures = entity.character.bloodlineFeatures.filter(bl => bl.id !== id);
                console.log(`Removed generic bloodline feature: ${id}`);
              }
              break;
              
            case 'weapon':
              if (entity.character.weaponFeatures) {
                entity.character.weaponFeatures = entity.character.weaponFeatures.filter(w => w.id !== id);
                console.log(`Removed generic weapon feature: ${id}`);
              }
              break;
              
            case 'equipment':
              if (entity.character.equipmentFeatures) {
                entity.character.equipmentFeatures = entity.character.equipmentFeatures.filter(e => e.id !== id);
                console.log(`Removed generic equipment feature: ${id}`);
              }
              break;
              
            default:
              if (entity.character.features) {
                entity.character.features = entity.character.features.filter(f => f.id !== id);
                console.log(`Removed unknown generic feature: ${id}`);
              }
              break;
          }
          
          // Remove any bonuses
          if (subsystems.bonus) {
            subsystems.bonus.removeBonusesBySource(entity, name);
            console.log(`Removed all bonuses from ${id}`);
          }
          
          return {
            success: true
          };
        } catch (error) {
          console.error(`Error in GenericFeature.unapply for ${id}:`, error);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      },
      
      async canApply(entity: Entity, options?: any, subsystems?: Record<string, Subsystem>): Promise<ValidationResult> {
        // First check if entity is null
        if (!entity) {
          return { valid: false, reason: 'Entity is null or undefined' };
        }
        
        // Check prerequisites if the prerequisite subsystem is available
        const prerequisiteSubsystem = subsystems?.['prerequisite'];
        if (prerequisiteSubsystem && options?.requirementIds) {
          try {
            // Check if the entity meets all prerequisites
            const meetsRequirements = await prerequisiteSubsystem.meetsAllRequirements(
              entity, 
              options.requirementIds
            );
            
            if (!meetsRequirements) {
              // Get missing requirements for detailed error message
              const missingRequirements = await prerequisiteSubsystem.getMissingRequirements(
                entity,
                options.requirementIds
              );
              
              // Format missing requirements into a readable message
              const missingReqs = missingRequirements.map(req => 
                `- ${req.description || req.type}`
              ).join('\n');
              
              return { 
                valid: false, 
                reason: `Missing prerequisites:\n${missingReqs}` 
              };
            }
          } catch (error) {
            console.warn(`Error checking prerequisites for feature ${id}:`, error);
            // Continue with other checks even if prerequisite checking failed
          }
        }
        
        // Check if this feature is already applied, based on the ID pattern
        const category = id.split('.')[0] || '';
        
        if (entity.character) {
          try {
            // Check for duplicates based on category
            switch (category) {
              case 'corruption':
                if (entity.character.corruptions) {
                  const duplicate = entity.character.corruptions.find(c => c.id === id);
                  if (duplicate) {
                    // Allow an update, not a duplicate application
                    return { 
                      valid: true, 
                      warning: `Corruption ${id} already exists, this will update it` 
                    };
                  }
                }
                break;
                
              case 'class':
                if (entity.character.classFeatures) {
                  const duplicate = entity.character.classFeatures.find(f => f.id === id);
                  if (duplicate) {
                    return { 
                      valid: true, 
                      warning: `Class feature ${id} already exists, this will update it` 
                    };
                  }
                }
                break;
                
              case 'feat':
                if (entity.character.feats) {
                  const duplicate = entity.character.feats.find(f => f.id === id);
                  if (duplicate) {
                    return { 
                      valid: true, 
                      warning: `Feat ${id} already exists, this will update it` 
                    };
                  }
                }
                break;
                
              case 'ancestry':
                if (entity.character.ancestryTraits) {
                  const duplicate = entity.character.ancestryTraits.find(t => t.id === id);
                  if (duplicate) {
                    return { 
                      valid: true, 
                      warning: `Ancestry trait ${id} already exists, this will update it` 
                    };
                  }
                }
                break;
                
              case 'spell':
                if (entity.character.knownSpells) {
                  const duplicate = entity.character.knownSpells.find(s => s.id === id);
                  if (duplicate) {
                    return { 
                      valid: true, 
                      warning: `Spell ${id} already exists, this will update it` 
                    };
                  }
                }
                break;
                
              case 'archetype':
                if (entity.character.archetypeFeatures) {
                  const duplicate = entity.character.archetypeFeatures.find(af => af.id === id);
                  if (duplicate) {
                    return { 
                      valid: true, 
                      warning: `Archetype feature ${id} already exists, this will update it` 
                    };
                  }
                }
                break;
                
              case 'discovery':
                if (entity.character.discoveryFeatures) {
                  const duplicate = entity.character.discoveryFeatures.find(df => df.id === id);
                  if (duplicate) {
                    return { 
                      valid: true, 
                      warning: `Discovery feature ${id} already exists, this will update it` 
                    };
                  }
                }
                break;
                
              case 'wild_talent':
                if (entity.character.wildTalentFeatures) {
                  const duplicate = entity.character.wildTalentFeatures.find(wt => wt.id === id);
                  if (duplicate) {
                    return { 
                      valid: true, 
                      warning: `Wild talent feature ${id} already exists, this will update it` 
                    };
                  }
                }
                break;
                
              case 'ki_power':
                if (entity.character.kiPowerFeatures) {
                  const duplicate = entity.character.kiPowerFeatures.find(kp => kp.id === id);
                  if (duplicate) {
                    return { 
                      valid: true, 
                      warning: `Ki power feature ${id} already exists, this will update it` 
                    };
                  }
                }
                break;
                
              case 'bloodline':
                if (entity.character.bloodlineFeatures) {
                  const duplicate = entity.character.bloodlineFeatures.find(bl => bl.id === id);
                  if (duplicate) {
                    return { 
                      valid: true, 
                      warning: `Bloodline feature ${id} already exists, this will update it` 
                    };
                  }
                }
                break;
                
              case 'weapon':
                if (entity.character.weaponFeatures) {
                  const duplicate = entity.character.weaponFeatures.find(w => w.id === id);
                  if (duplicate) {
                    return { 
                      valid: true, 
                      warning: `Weapon feature ${id} already exists, this will update it` 
                    };
                  }
                }
                break;
                
              case 'equipment':
                if (entity.character.equipmentFeatures) {
                  const duplicate = entity.character.equipmentFeatures.find(e => e.id === id);
                  if (duplicate) {
                    return { 
                      valid: true, 
                      warning: `Equipment feature ${id} already exists, this will update it` 
                    };
                  }
                }
                break;
                
              default:
                if (entity.character.features) {
                  const duplicate = entity.character.features.find(f => f.id === id);
                  if (duplicate) {
                    return { 
                      valid: true, 
                      warning: `Feature ${id} already exists, this will update it` 
                    };
                  }
                }
                break;
            }
          } catch (error) {
            console.warn(`Error checking if feature ${id} can be applied:`, error);
          }
        }
        
        return { valid: true };
      }
    };
  }
}