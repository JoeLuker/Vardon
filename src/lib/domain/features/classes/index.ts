/**
 * Classes feature index - exports all class features
 * Following Unix philosophy - making features easily discoverable in one place
 */

// Core classes
export { BarbarianRageFeature } from './BarbarianRageFeature';
export { ChannelEnergyFeature } from './ChannelEnergyFeature';
export { SneakAttackFeature } from './SneakAttackFeature';

// Kineticist features
export { KineticBlastFeature } from './KineticBlastFeature';
export { ElementalFocusFeature } from './ElementalFocusFeature';
export { BurnFeature } from './BurnFeature';
export { GatherPowerFeature } from './GatherPowerFeature';
export { ElementalDefenseFeature } from './ElementalDefenseFeature';
export { ElementalOverflowFeature } from './ElementalOverflowFeature';
export { MetakinesisFeature } from './MetakinesisFeature';
export { InfusionSpecializationFeature } from './InfusionSpecializationFeature';

// Shorthand exports for lazy loading access
const classFeatures = {
  // Core
  barbarian_rage: () => import('./BarbarianRageFeature').then(m => m.BarbarianRageFeature),
  channel_energy: () => import('./ChannelEnergyFeature').then(m => m.ChannelEnergyFeature),
  sneak_attack: () => import('./SneakAttackFeature').then(m => m.SneakAttackFeature),
  
  // Kineticist
  kinetic_blast: () => import('./KineticBlastFeature').then(m => m.KineticBlastFeature),
  elemental_focus: () => import('./ElementalFocusFeature').then(m => m.ElementalFocusFeature),
  burn: () => import('./BurnFeature').then(m => m.BurnFeature),
  gather_power: () => import('./GatherPowerFeature').then(m => m.GatherPowerFeature),
  elemental_defense: () => import('./ElementalDefenseFeature').then(m => m.ElementalDefenseFeature),
  elemental_overflow: () => import('./ElementalOverflowFeature').then(m => m.ElementalOverflowFeature),
  metakinesis: () => import('./MetakinesisFeature').then(m => m.MetakinesisFeature),
  infusion_specialization: () => import('./InfusionSpecializationFeature').then(m => m.InfusionSpecializationFeature)
};

export default classFeatures;