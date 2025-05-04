import type { Feature } from '../../types/FeatureTypes';
import type { Entity } from '../../types/EntityTypes';
import type { CombatSubsystem } from '../../types/SubsystemTypes';

/**
 * Implementation of the Cure Light Wounds spell
 */
const CureLightWoundsFeature: Feature = {
  id: 'spell.cure_light_wounds',
  name: 'Cure Light Wounds',
  description: 'Heals 1d8 + caster level points of damage (maximum +5)',
  
  async canApply(entity: Entity, options: any = {}): Promise<boolean> {
    // Check if entity is valid
    if (!entity.character) return false;
    
    return true;
  },
  
  async apply(entity: Entity, options: any = {}): Promise<void> {
    // This would be called when the spell is cast
    console.log(`Casting Cure Light Wounds on ${entity.name}`);
    
    // Example implementation:
    const targetEntity = options.target || entity;
    const casterLevel = options.casterLevel || 1;
    const healingBonus = Math.min(5, casterLevel);
    
    // Roll 1d8 + caster level (max +5)
    const dieRoll = Math.floor(Math.random() * 8) + 1;
    const healing = dieRoll + healingBonus;
    
    console.log(`Cure Light Wounds heals for ${healing} points of damage`);
    
    // Update target's HP
    if (targetEntity.character) {
      const currentHP = targetEntity.character.current_hp || 0;
      const maxHP = targetEntity.character.max_hp || 0;
      
      // Heal, but don't exceed max HP
      targetEntity.character.current_hp = Math.min(currentHP + healing, maxHP);
    }
  },
  
  async remove(entity: Entity, options: any = {}): Promise<void> {
    // Cure Light Wounds has no persistent effects to remove
  }
};

export default CureLightWoundsFeature;