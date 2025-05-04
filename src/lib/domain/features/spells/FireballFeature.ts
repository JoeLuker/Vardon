import type { Feature } from '../../types/FeatureTypes';
import type { Entity } from '../../types/EntityTypes';

/**
 * Implementation of the Fireball spell
 */
const FireballFeature: Feature = {
  id: 'spell.fireball',
  name: 'Fireball',
  description: 'A ball of fire that deals 1d6 points of fire damage per caster level (maximum 10d6) to all creatures in the area',
  
  async canApply(entity: Entity, options: any = {}): Promise<boolean> {
    // Check if entity is valid
    if (!entity.character) return false;
    
    return true;
  },
  
  async apply(entity: Entity, options: any = {}): Promise<void> {
    // This would be called when the spell is cast
    console.log(`Casting Fireball from ${entity.name}`);
    
    const casterLevel = options.casterLevel || 1;
    const maxDice = 10; // Maximum 10d6 damage
    const numDice = Math.min(maxDice, casterLevel);
    
    // Roll damage (1d6 per caster level, max 10d6)
    let totalDamage = 0;
    for (let i = 0; i < numDice; i++) {
      totalDamage += Math.floor(Math.random() * 6) + 1;
    }
    
    console.log(`Fireball deals ${totalDamage} points of fire damage`);
    
    // In a real implementation, this would apply damage to all targets in the area
    if (options.targets) {
      for (const target of options.targets) {
        // Calculate any fire resistance, reflex saves, etc.
        const actualDamage = this.calculateDamage(totalDamage, target, options);
        
        // Apply damage to target
        if (target.character) {
          const currentHP = target.character.current_hp || 0;
          target.character.current_hp = Math.max(0, currentHP - actualDamage);
        }
      }
    }
  },
  
  async remove(entity: Entity, options: any = {}): Promise<void> {
    // Fireball has no persistent effects to remove
  },
  
  /**
   * Calculate the actual damage a target takes from fireball
   * Accounts for saving throws, resistances, etc.
   */
  calculateDamage(baseDamage: number, target: Entity, options: any = {}): number {
    let damage = baseDamage;
    
    // Check for reflex save
    const saveDC = options.saveDC || 10 + Math.floor(options.casterLevel / 2) + Math.floor((options.spellcasterStat || 10) / 2);
    const saveRoll = Math.floor(Math.random() * 20) + 1;
    const saveBonus = this.getTargetSaveBonus(target, 'reflex');
    
    // If save succeeds, half damage
    if (saveRoll + saveBonus >= saveDC) {
      damage = Math.floor(damage / 2);
      console.log(`${target.name} made their Reflex save! Damage reduced to ${damage}`);
    }
    
    // Check for fire resistance
    const fireResistance = this.getTargetFireResistance(target);
    if (fireResistance > 0) {
      damage = Math.max(0, damage - fireResistance);
      console.log(`${target.name} resists ${fireResistance} fire damage!`);
    }
    
    return damage;
  },
  
  /**
   * Get a target's save bonus for a specific save
   */
  getTargetSaveBonus(target: Entity, saveType: string): number {
    // In a real implementation, this would use the combat subsystem
    // For now, we'll just return a placeholder
    return 0;
  },
  
  /**
   * Get a target's fire resistance
   */
  getTargetFireResistance(target: Entity): number {
    // In a real implementation, this would check for fire resistance from items, feats, etc.
    // For now, we'll just return a placeholder
    return 0;
  }
};

export default FireballFeature;