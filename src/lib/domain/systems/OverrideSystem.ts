/**
 * Interface for override definitions
 */
export interface Override<T = any> {
  id: string;                   // Unique identifier for the override
  type: OverrideType;           // Type of override
  originalValue: T;             // Original value that's being overridden
  overrideValue: T;             // New value to use instead
  source: string;               // Source of the override (e.g., "Pragmatic Activator")
  condition?: string;           // Optional condition when override applies
  priority: number;             // Higher priority overrides take precedence
}

/**
 * Types of overrides supported by the system
 */
export type OverrideType = 
  | 'ability_for_skill'        // Override which ability is used for a skill
  | 'ability_for_save'         // Override which ability is used for a save
  | 'ability_for_attack'       // Override which ability is used for attack rolls
  | 'ability_for_damage'       // Override which ability is used for damage rolls
  | 'ability_for_initiative'   // Override which ability is used for initiative
  | 'skill_trained_only'       // Override whether a skill requires training
  | 'weapon_finesse'           // Override for using Dex for attacks
  | 'size'                     // Override for size category
  | 'natural_armor'            // Override for natural armor calculation
  | 'proficiency'              // Override for proficiency level
  | 'damage_type';             // Override for damage type

/**
 * Manages stat overrides for character calculations
 */
export class OverrideSystem {
  private overrides: Map<string, Override<any>> = new Map();
  
  /**
   * Register a new override
   */
  addOverride<T = any>(override: Override<T>): void {
    this.overrides.set(override.id, override);
  }
  
  /**
   * Remove an override by ID
   */
  removeOverride(id: string): void {
    this.overrides.delete(id);
  }
  
  /**
   * Remove all overrides from a specific source
   */
  removeOverridesBySource(source: string): void {
    for (const [id, override] of this.overrides.entries()) {
      if (override.source === source) {
        this.overrides.delete(id);
      }
    }
  }
  
  /**
   * Remove all overrides of a specific type
   */
  removeOverridesByType(type: OverrideType): void {
    for (const [id, override] of this.overrides.entries()) {
      if (override.type === type) {
        this.overrides.delete(id);
      }
    }
  }
  
  /**
   * Get all registered overrides
   */
  getAllOverrides(): Override<any>[] {
    return Array.from(this.overrides.values());
  }
  
  /**
   * Get all overrides of a specific type
   */
  getOverridesByType<T = any>(type: OverrideType): Override<T>[] {
    return Array.from(this.overrides.values())
      .filter(o => o.type === type) as Override<T>[];
  }
  
  /**
   * Get the highest priority ability override for a skill
   */
  getAbilityOverrideForSkill(skillId: number): Override<string> | undefined {
    const relevant = this.getOverridesByType<string>('ability_for_skill')
      .filter(o => Number(o.originalValue) === skillId)
      .sort((a, b) => b.priority - a.priority);
    
    return relevant.length > 0 ? relevant[0] : undefined;
  }
  
  /**
   * Get the highest priority ability override for an attack
   */
  getAbilityOverrideForAttack(attackType: string): Override<string> | undefined {
    const relevant = this.getOverridesByType<string>('ability_for_attack')
      .filter(o => o.originalValue === attackType)
      .sort((a, b) => b.priority - a.priority);
    
    return relevant.length > 0 ? relevant[0] : undefined;
  }
  
  /**
   * Check if weapon finesse applies for a specific weapon
   */
  hasWeaponFinesse(weaponId: number): boolean {
    const relevant = this.getOverridesByType<number>('weapon_finesse')
      .filter(o => o.originalValue === weaponId || o.originalValue === -1); // -1 for "all weapons"
    
    return relevant.length > 0;
  }
  
  /**
   * Get the override for whether a skill requires training
   */
  getSkillTrainedOnlyOverride(skillId: number): boolean | undefined {
    const relevant = this.getOverridesByType<boolean>('skill_trained_only')
      .filter(o => Number(o.originalValue) === skillId)
      .sort((a, b) => b.priority - a.priority);
    
    return relevant.length > 0 ? relevant[0].overrideValue : undefined;
  }
  
  /**
   * Get all size overrides
   */
  getSizeOverrides(): Override<string>[] {
    return this.getOverridesByType<string>('size');
  }
  
  /**
   * Clear all overrides
   */
  clearAllOverrides(): void {
    this.overrides.clear();
  }
} 