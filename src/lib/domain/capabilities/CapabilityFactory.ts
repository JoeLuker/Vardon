import type { FeatureEffectSystem } from '$lib/domain/systems/FeatureEffectSystem';
import type { SkillEngine } from '$lib/domain/systems/engines/SkillEngine';
import type { AttackEngine } from '$lib/domain/systems/engines/AttackEngine';
import type { ArmorEngine } from '$lib/domain/systems/engines/ArmorEngine';
import type { AbilityEngine } from '$lib/domain/systems/engines/AbilityEngine';

import { SkillCapabilityImpl } from './SkillCapabilityImpl';
import type { SkillCapability } from './SkillCapability';

/**
 * Factory for creating capabilities with explicit dependencies
 */
export class CapabilityFactory {
  private capabilities: Map<string, any> = new Map();
  
  /**
   * Constructor with explicit dependency injection
   */
  constructor(
    private featureEffectSystem: FeatureEffectSystem,
    private skillEngine: SkillEngine,
    private attackEngine: AttackEngine,
    private armorEngine: ArmorEngine,
    private abilityEngine: AbilityEngine
  ) {
    // Initialize capabilities
    this.initializeCapabilities();
  }
  
  /**
   * Initialize all capabilities with their explicit dependencies
   */
  private initializeCapabilities(): void {
    // Create skill capability
    const skillCapability = new SkillCapabilityImpl(
      this.skillEngine,
      this.featureEffectSystem
    );
    
    // Register capability
    this.capabilities.set('skill', skillCapability);
    
    // Additional capabilities would be initialized here
    // this.capabilities.set('damage', new DamageCapabilityImpl(...));
    // this.capabilities.set('healing', new HealingCapabilityImpl(...));
  }
  
  /**
   * Get a specific capability
   */
  getCapability<T>(name: string): T | undefined {
    return this.capabilities.get(name) as T;
  }
  
  /**
   * Get all capabilities requested by a plugin
   */
  getCapabilitiesForPlugin(requiredCapabilities: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const capName of requiredCapabilities) {
      if (this.capabilities.has(capName)) {
        result[capName] = this.capabilities.get(capName);
      }
    }
    
    return result;
  }
} 