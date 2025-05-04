import type { Entity } from '../../types/EntityTypes';
import type { Feature, ValidationResult } from '../../types/FeatureTypes';
import type { BonusSubsystem, Subsystem } from '../../types/SubsystemTypes';

/**
 * WeaponFocusFeature provides a modular implementation following Unix philosophy.
 * It provides a single focused feature that can be specialized for different weapons.
 * 
 * This approach demonstrates how to create specialized features from a base template,
 * enabling filesystem-based discovery while handling specialized variants.
 */

// Base feature definition
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

/**
 * Factory function to create specialized weapon focus features for specific weapons.
 * This allows the feature loader to dynamically create weapon-specific features.
 * 
 * @param weaponType The type of weapon to create a focus feature for
 * @returns A specialized weapon focus feature
 */
export function createSpecialized(weaponType: string): Feature {
  // If the requested feature ID is exactly weapon_focus, return the base feature
  if (weaponType === 'weapon_focus') {
    return WeaponFocusFeature;
  }
  
  // Extract the specific weapon type from the feature ID
  // Handles cases like 'weapon_focus_longsword' -> 'longsword'
  const specificWeapon = weaponType.startsWith('weapon_focus_')
    ? weaponType.replace('weapon_focus_', '')
    : weaponType;
  
  // Format the weapon name for display, converting snake_case to Title Case
  const displayWeapon = specificWeapon
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  // Create a specialized version of the feature
  return {
    ...WeaponFocusFeature,
    id: `feat.weapon_focus_${specificWeapon}`,
    name: `Weapon Focus (${displayWeapon})`,
    description: `You gain a +1 bonus on all attack rolls you make using ${displayWeapon}.`,
    
    // Override apply to pre-fill the weapon option
    apply(entity: Entity, options = {}, subsystems: { bonus: BonusSubsystem }) {
      // Merge provided options with the predefined weapon
      const mergedOptions = {
        ...options,
        weaponType: specificWeapon
      };
      
      // Call the base implementation with the merged options
      return WeaponFocusFeature.apply(entity, mergedOptions, subsystems);
    },
    
    // Override canApply to handle specialized weapon
    canApply(entity: Entity, subsystems: Record<string, Subsystem>): ValidationResult {
      // First check basic requirements using base implementation
      const baseValidation = WeaponFocusFeature.canApply(entity, subsystems);
      if (!baseValidation.valid) {
        return baseValidation;
      }
      
      // Then check if this specific weapon focus is already applied
      if (WeaponFocusFeature.hasFeatAlreadyWithWeapon(entity, specificWeapon)) {
        return { 
          valid: false, 
          reason: `Already has Weapon Focus for ${displayWeapon}` 
        };
      }
      
      return { valid: true };
    }
  };
}

// Pre-create some common weapon focus variants
export const WeaponFocusLongsword = createSpecialized('longsword');
export const WeaponFocusShortbow = createSpecialized('shortbow');
export const WeaponFocusUnarmedStrike = createSpecialized('unarmed_strike');
