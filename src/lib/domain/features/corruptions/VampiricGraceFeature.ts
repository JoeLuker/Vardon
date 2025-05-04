import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { BonusSubsystem, Subsystem } from '../../types/SubsystemTypes';

export const VampiricGraceFeature: Feature = {
  id: 'corruption.vampiric_grace',
  name: 'Vampiric Grace',
  requiredSubsystems: ['bonus'],
  description: 'You move with a predator\'s grace, gaining Dodge and improved stealth.',
  category: 'corruption',
  
  apply(entity: Entity, options: { manifestationLevel?: number } = {}, subsystems: { bonus: BonusSubsystem }) {
    const { bonus } = subsystems;
    const manifestationLevel = options.manifestationLevel || 2;
    
    // Apply the Stealth bonus
    bonus.addBonus(entity, 'skill_stealth', 2, 'racial', 'Vampiric Grace');
    
    // Grant Dodge feat
    if (!entity.character) entity.character = {};
    if (!entity.character.feats) entity.character.feats = [];
    
    // Check if character already has Dodge
    const hasDodge = entity.character.feats.some(feat => feat.id === 'feat.dodge');
    
    if (!hasDodge) {
      entity.character.feats.push({
        id: 'feat.dodge',
        name: 'Dodge',
        source: this.id
      });
      
      // Apply dodge bonus
      bonus.addBonus(entity, 'ac', 1, 'dodge', 'Dodge');
    }
    
    // Add spider climb if level 6+
    if (manifestationLevel >= 6) {
      if (!entity.character.spellLikeAbilities) entity.character.spellLikeAbilities = [];
      
      entity.character.spellLikeAbilities.push({
        id: 'spider_climb',
        name: 'Spider Climb',
        usesPerDay: -1, // At will
        casterLevel: manifestationLevel,
        source: this.id
      });
    }
    
    // Store the corruption manifestation in character data
    if (!entity.character.corruptions) entity.character.corruptions = [];
    
    entity.character.corruptions.push({
      id: this.id,
      name: this.name,
      options: { manifestationLevel }
    });
    
    // Apply stain effect (can't enter private dwellings without invitation)
    if (!entity.character.conditions) entity.character.conditions = [];
    entity.character.conditions.push({
      id: 'need_invitation',
      name: 'Need Invitation',
      source: this.id
    });
    
    return {
      success: true,
      manifestationLevel,
      bonusApplied: 2,
      grantedDodge: !hasDodge,
      grantedSpiderClimb: manifestationLevel >= 6
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this manifestation
    if (entity.character?.corruptions?.some(c => c.id === this.id)) {
      return { valid: false, reason: "Already has Vampiric Grace manifestation" };
    }
    
    // Check minimum manifestation level (should be 2+)
    const manifestationLevel = entity.options?.manifestationLevel || 0;
    if (manifestationLevel < 2) {
      return { valid: false, reason: "Requires manifestation level 2+" };
    }
    
    return { valid: true };
  }
};