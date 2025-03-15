import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { BonusSubsystem, Subsystem } from '../../types/SubsystemTypes';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export const WeaponFocusFeature: Feature = {
  id: 'feat.weapon_focus',
  name: 'Weapon Focus',
  requiredSubsystems: ['bonus'],
  description: 'You gain a +1 bonus on all attack rolls you make using the selected weapon.',
  prerequisites: ['proficient with weapon', 'base attack bonus +1'],
  category: 'combat',
  
  apply(entity: Entity, options: { weaponType: string }, subsystems: { bonus: BonusSubsystem }) {
    const { weaponType } = options;
    const { bonus } = subsystems;
    
    // Validate that a weapon type was provided
    if (!weaponType) {
      throw new Error('Weapon Focus feat requires a weapon type selection');
    }
    
    // Check for duplicate feat
    if (this.hasFeatAlreadyWithWeapon(entity, weaponType)) {
      throw new Error(`Character already has Weapon Focus for ${weaponType}`);
    }
    
    // Store feat in character data
    if (!entity.character) entity.character = {};
    if (!entity.character.feats) entity.character.feats = [];
    
    entity.character.feats.push({
      id: this.id,
      name: this.name,
      options: { weaponType }
    });
    
    // Apply the attack bonus for this weapon type
    bonus.addBonus(
      entity,
      `attack_${weaponType}`,
      1,
      'untyped',
      'Weapon Focus'
    );
    
    return {
      success: true,
      weaponType,
      bonusApplied: 1
    };
  },
  
  canApply(entity: Entity, subsystems: Record<string, Subsystem>): ValidationResult {
    // Base attack bonus check
    const bab = entity.character?.baseAttackBonus || 0;
    if (bab < 1) {
      return { valid: false, reason: "Base attack bonus must be at least +1" };
    }
    
    // Could check proficiency here if we had that data
    // For now, we'll assume proficiency and just check BAB
    
    return { valid: true };
  },
  
  // Helper to check if character already has this feat with same weapon
  hasFeatAlreadyWithWeapon(entity: Entity, weaponType: string): boolean {
    if (!entity.character?.feats) return false;
    
    return entity.character.feats.some(feat => 
      feat.id === this.id && 
      feat.options?.weaponType === weaponType
    );
  }
};
