import type { FeatureEffectSystem } from '../FeatureEffectSystem';
import type { DataAccessLayer } from '../DataAccessLayer';
import { AbilityEngine } from './AbilityEngine';
import { SavingThrowEngine } from './SavingThrowEngine';
import { AttackEngine } from './AttackEngine';
import { ArmorEngine } from './ArmorEngine';
import { SkillEngine } from './SkillEngine';
import { BonusEngine } from './BonusEngine';

/**
 * Creates and configures calculation engines with explicit dependencies
 * This follows the factory pattern to centralize creation logic
 * but still make dependencies explicit and visible
 */
export class EngineFactory {
  // All engines available for explicit dependency injection
  readonly abilityEngine: AbilityEngine;
  readonly savingThrowEngine: SavingThrowEngine;
  readonly attackEngine: AttackEngine;
  readonly armorEngine: ArmorEngine;
  readonly skillEngine: SkillEngine;
  readonly bonusEngine: BonusEngine;
  
  /**
   * Create an EngineFactory with needed dependencies
   * @param featureEffectSystem The feature effect system for lookups
   * @param dataAccessLayer Optional data access layer for data lookups
   */
  constructor(
    private featureEffectSystem: FeatureEffectSystem,
    private dataAccessLayer?: DataAccessLayer
  ) {
    // Create bonusEngine first as other engines may use it
    this.bonusEngine = new BonusEngine();
    this.bonusEngine.setFeatureEffectSystem(featureEffectSystem);
    
    // Create all calculation engines with explicit dependencies
    this.abilityEngine = new AbilityEngine(featureEffectSystem, dataAccessLayer);
    this.savingThrowEngine = new SavingThrowEngine(featureEffectSystem, dataAccessLayer);
    this.attackEngine = new AttackEngine(featureEffectSystem, dataAccessLayer);
    this.armorEngine = new ArmorEngine(featureEffectSystem, dataAccessLayer);
    this.skillEngine = new SkillEngine(featureEffectSystem, dataAccessLayer);
  }
  
  /**
   * Get the FeatureEffectSystem used by this factory
   */
  getFeatureEffectSystem(): FeatureEffectSystem {
    return this.featureEffectSystem;
  }
  
  /**
   * Get the DataAccessLayer used by this factory
   */
  getDataAccessLayer(): DataAccessLayer | undefined {
    return this.dataAccessLayer;
  }
} 