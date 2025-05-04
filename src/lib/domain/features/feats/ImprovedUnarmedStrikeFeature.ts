import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { Subsystem } from '../../types/SubsystemTypes';

export const ImprovedUnarmedStrikeFeature: Feature = {
  id: 'feat.improved_unarmed_strike',
  name: 'Improved Unarmed Strike',
  requiredSubsystems: [],
  description: 'You are considered to be armed even when unarmed—you do not provoke attacks of opportunity when you attack foes while unarmed. Your unarmed strikes can deal lethal or nonlethal damage, at your choice.',
  prerequisites: [],
  category: 'combat',
  
  apply(entity: Entity, options = {}, subsystems = {}) {
    // Store feat in character data
    if (!entity.character) entity.character = {};
    if (!entity.character.feats) entity.character.feats = [];
    
    entity.character.feats.push({
      id: this.id,
      name: this.name,
      options: {}
    });
    
    // Add unarmed strike as a weapon if not present
    if (!entity.character.weapons) entity.character.weapons = [];
    
    const hasUnarmedStrike = entity.character.weapons.some(w => w.id === 'unarmed_strike');
    
    if (!hasUnarmedStrike) {
      entity.character.weapons.push({
        id: 'unarmed_strike',
        name: 'Unarmed Strike',
        damage: '1d3',
        critical: '20/x2',
        type: 'B',
        isImproved: true
      });
    } else {
      // Update existing unarmed strike to be improved
      entity.character.weapons.forEach(w => {
        if (w.id === 'unarmed_strike') {
          w.isImproved = true;
        }
      });
    }
    
    return {
      success: true,
      improvedUnarmedStrike: true
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>) {
    // Check if character already has this feat
    if (entity.character?.feats?.some(f => f.id === this.id)) {
      return { valid: false, reason: "Already has Improved Unarmed Strike" };
    }
    
    return { valid: true };
  }
};