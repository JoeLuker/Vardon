import { BonusSubsystemImpl } from '../shared/BonusSubsystemImpl';
import { AbilitySubsystemImpl } from '../shared/AbilitySubsystemImpl';
import { SkillSubsystemImpl } from '../shared/SkillSubsystemImpl';
import { CombatSubsystemImpl } from '../shared/CombatSubsystemImpl';
import { ConditionSubsystemImpl } from '../shared/ConditionSubsystemImpl';
import { SpellcastingSubsystemImpl } from '../shared/SpellcastingSubsystemImpl';
import type { Subsystem } from '../types/SubsystemTypes';

/**
 * Registry of all available subsystems in the game
 * This class is responsible for creating and managing subsystem instances
 */
export class SubsystemRegistry {
  private subsystems: Map<string, Subsystem> = new Map();
  private gameData: any;
  private gameRulesAPI: any;
  
  /**
   * Initialize the subsystem registry with game data
   * @param gameData Game data used for initializing subsystems
   */
  constructor(gameData: any = {}, gameRulesAPI: any = null) {
    this.gameData = gameData;
    this.gameRulesAPI = gameRulesAPI;
    this.initializeSubsystems();
  }
  
  /**
   * Initialize all core subsystems
   */
  private initializeSubsystems(): void {
    // Create ability subsystem
    const abilitySubsystem = new AbilitySubsystemImpl();
    this.registerSubsystem(abilitySubsystem);
    
    // Create bonus subsystem
    const bonusSubsystem = new BonusSubsystemImpl();
    this.registerSubsystem(bonusSubsystem);
    
    // Create skill subsystem with dependencies
    const skillSubsystem = new SkillSubsystemImpl(
      this.gameData,
      abilitySubsystem,
      bonusSubsystem
    );
    this.registerSubsystem(skillSubsystem);
    
    // Create combat subsystem with dependencies
    const combatSubsystem = new CombatSubsystemImpl(
      abilitySubsystem,
      bonusSubsystem
    );
    this.registerSubsystem(combatSubsystem);
    
    // Create condition subsystem
    const conditionSubsystem = new ConditionSubsystemImpl();
    this.registerSubsystem(conditionSubsystem);
    
    // Create spellcasting subsystem
    const spellcastingSubsystem = new SpellcastingSubsystemImpl(this.gameRulesAPI);
    this.registerSubsystem(spellcastingSubsystem);
  }
  
  /**
   * Register a subsystem in the registry
   */
  registerSubsystem(subsystem: Subsystem): void {
    this.subsystems.set(subsystem.id, subsystem);
  }
  
  /**
   * Get a subsystem by its ID
   */
  getSubsystem(id: string): Subsystem | undefined {
    return this.subsystems.get(id);
  }
  
  /**
   * Get all registered subsystems
   */
  getAllSubsystems(): Map<string, Subsystem> {
    return this.subsystems;
  }
  
  /**
   * Check if a subsystem exists
   */
  hasSubsystem(id: string): boolean {
    return this.subsystems.has(id);
  }
  
  /**
   * Remove a subsystem from the registry
   */
  removeSubsystem(id: string): boolean {
    return this.subsystems.delete(id);
  }
  
  /**
   * Shutdown all subsystems
   */
  async shutdown(): Promise<void> {
    for (const subsystem of this.subsystems.values()) {
      if (subsystem.shutdown) {
        await subsystem.shutdown();
      }
    }
    
    this.subsystems.clear();
  }
}