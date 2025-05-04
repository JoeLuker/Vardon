/**
 * Corruptions feature index - exports all corruption manifestations
 * Following Unix philosophy - making features easily discoverable in one place
 */

// Vampire corruption manifestations
export { AllureFeature } from './AllureFeature';
export { VampiricGraceFeature } from './VampiricGraceFeature';
export { FangsFeature } from './FangsFeature';
export { UnlifeFeature } from './UnlifeFeature';
export { GreaterUnlifeFeature } from './GreaterUnlifeFeature';
export { TrueUnlifeFeature } from './TrueUnlifeFeature';
export { DreadfulCharmFeature } from './DreadfulCharmFeature';

// Shorthand exports for lazy loading access
const corruptionFeatures = {
  // Vampire
  allure: () => import('./AllureFeature').then(m => m.AllureFeature),
  vampiric_grace: () => import('./VampiricGraceFeature').then(m => m.VampiricGraceFeature),
  fangs: () => import('./FangsFeature').then(m => m.FangsFeature),
  unlife: () => import('./UnlifeFeature').then(m => m.UnlifeFeature),
  greater_unlife: () => import('./GreaterUnlifeFeature').then(m => m.GreaterUnlifeFeature),
  true_unlife: () => import('./TrueUnlifeFeature').then(m => m.TrueUnlifeFeature),
  dreadful_charm: () => import('./DreadfulCharmFeature').then(m => m.DreadfulCharmFeature)
};

export default corruptionFeatures;