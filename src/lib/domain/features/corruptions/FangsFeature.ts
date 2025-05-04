import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { Subsystem } from '../../types/SubsystemTypes';

export const FangsFeature: Feature = {
  id: 'corruption.fangs',
  name: 'Fangs',
  requiredSubsystems: [],
  description: 'Your canines grow unnaturally long when you are angry, granting you a bite attack that can drain blood.',
  category: 'corruption',
  
  apply(entity: Entity, options: { manifestationLevel?: number } = {}, subsystems = {}) {
    const manifestationLevel = options.manifestationLevel || 1;
    
    // Add fangs natural attack
    if (!entity.character) entity.character = {};
    if (!entity.character.naturalAttacks) entity.character.naturalAttacks = [];
    
    // Check if character already has fangs
    const hasFangs = entity.character.naturalAttacks.some(attack => attack.id === 'fangs');
    
    if (!hasFangs) {
      const damageSize = entity.character.size === 'small' ? '1d4' : '1d6';
      
      entity.character.naturalAttacks.push({
        id: 'fangs',
        name: 'Fangs',
        type: 'primary',
        attackType: 'bite',
        damage: damageSize,
        damageType: 'piercing',
        special: 'Can drain blood dealing 1 Constitution damage',
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
    
    // Apply stain effect (must feed daily instead of weekly)
    if (!entity.character.conditions) entity.character.conditions = [];
    entity.character.conditions.push({
      id: 'blood_thirst_daily',
      name: 'Blood Thirst (Daily)',
      source: this.id
    });
    
    return {
      success: true,
      manifestationLevel,
      addedFangs: !hasFangs
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this manifestation
    if (entity.character?.corruptions?.some(c => c.id === this.id)) {
      return { valid: false, reason: "Already has Fangs manifestation" };
    }
    
    return { valid: true };
  }
};