/**
 * Feats feature index - exports all feat features
 * Following Unix philosophy - making features easily discoverable in one place
 */

// Combat feats
export { PowerAttackFeature } from './PowerAttackFeature';
export { WeaponFocusFeature, createSpecialized as createWeaponFocus } from './WeaponFocusFeature';
export { DodgeFeature } from './DodgeFeature';
export { ImprovedUnarmedStrikeFeature } from './ImprovedUnarmedStrikeFeature';

// General feats
export { ToughnessFeature } from './ToughnessFeature';
export { SkillFocusFeature } from './SkillFocusFeature';

// Specialized weapon focus pre-generated variants
export { WeaponFocusUnarmedStrike } from './WeaponFocusFeature';

// Shorthand exports for lazy loading access
const featFeatures = {
  // Combat
  power_attack: () => import('./PowerAttackFeature').then(m => m.PowerAttackFeature),
  weapon_focus: () => import('./WeaponFocusFeature').then(m => m.WeaponFocusFeature),
  dodge: () => import('./DodgeFeature').then(m => m.DodgeFeature),
  improved_unarmed_strike: () => import('./ImprovedUnarmedStrikeFeature').then(m => m.ImprovedUnarmedStrikeFeature),
  
  // General
  toughness: () => import('./ToughnessFeature').then(m => m.ToughnessFeature),
  skill_focus: () => import('./SkillFocusFeature').then(m => m.SkillFocusFeature),
  
  // Special loader for weapon focus variants (weapon_focus_*)
  async loadWeaponFocus(weaponType: string) {
    const { createSpecialized } = await import('./WeaponFocusFeature');
    return createSpecialized(weaponType);
  }
};

export default featFeatures;