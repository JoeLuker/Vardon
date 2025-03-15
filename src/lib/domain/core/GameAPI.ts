import { GameEngine } from './GameEngine';
import { FeatureRegistry } from '../config/FeatureRegistry';
import { SessionState } from '../state/active/SessionState';
import { CharacterStore } from '../state/data/CharacterStore';
import { CalculationExplainer } from '../introspection/CalculationExplainer';
import type { Entity } from '../types/EntityTypes';
import type { ConditionSubsystem } from '../types/SubsystemTypes';

export interface GameAPIError {
  code: string;
  message: string;
  details?: any;
}

export class GameAPIResult<T> {
  success: boolean;
  data?: T;
  error?: GameAPIError;
  
  static success<R>(data: R): GameAPIResult<R> {
    const result = new GameAPIResult<R>();
    result.success = true;
    result.data = data;
    return result;
  }
  
  static failure<R>(code: string, message: string, details?: any): GameAPIResult<R> {
    const result = new GameAPIResult<R>();
    result.success = false;
    result.error = { code, message, details };
    return result;
  }
}

/**
 * Main API for interacting with the game engine from external systems
 */
export class GameAPI {
  constructor(
    private engine: GameEngine,
    private featureRegistry: FeatureRegistry,
    private sessionState: SessionState,
    private characterStore: CharacterStore,
    private calculationExplainer: CalculationExplainer
  ) {}
  
  /**
   * Create a new character
   */
  createCharacter(name: string): GameAPIResult<Entity> {
    try {
      const character = this.characterStore.createNewCharacter(name);
      this.engine.registerEntity(character);
      return GameAPIResult.success(character);
    } catch (error) {
      return GameAPIResult.failure('CREATE_ERROR', `Error creating character: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Load a character by ID
   */
  async loadCharacter(id: string): Promise<GameAPIResult<Entity | null>> {
    try {
      const character = await this.characterStore.loadCharacter(id);
      if (character) {
        this.engine.registerEntity(character);
        return GameAPIResult.success(character);
      }
      return GameAPIResult.success(null);
    } catch (error) {
      return GameAPIResult.failure('LOAD_ERROR', `Error loading character: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Save a character
   */
  async saveCharacter(character: Entity): Promise<GameAPIResult<void>> {
    try {
      await this.characterStore.saveCharacter(character);
      return GameAPIResult.success(undefined);
    } catch (error) {
      return GameAPIResult.failure('SAVE_ERROR', `Error saving character: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * List all available characters
   */
  async listCharacters(): Promise<GameAPIResult<string[]>> {
    try {
      const characters = await this.characterStore.listCharacters();
      return GameAPIResult.success(characters);
    } catch (error) {
      return GameAPIResult.failure('LIST_ERROR', `Error listing characters: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Add a character to the active session
   */
  activateCharacter(character: Entity): GameAPIResult<void> {
    try {
      this.sessionState.addEntity(character);
      return GameAPIResult.success(undefined);
    } catch (error) {
      return GameAPIResult.failure('ACTIVATION_ERROR', `Error activating character: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Remove a character from the active session
   */
  deactivateCharacter(characterId: string): GameAPIResult<void> {
    try {
      this.sessionState.removeEntity(characterId);
      return GameAPIResult.success(undefined);
    } catch (error) {
      return GameAPIResult.failure('DEACTIVATION_ERROR', `Error deactivating character: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get all active characters
   */
  getActiveCharacters(): GameAPIResult<Entity[]> {
    try {
      const characters = this.sessionState.getAllEntities();
      return GameAPIResult.success(characters);
    } catch (error) {
      return GameAPIResult.failure('GET_ACTIVE_ERROR', `Error getting active characters: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Apply a feature to a character
   */
  applyFeature(characterId: string, featureId: string, options: any = {}): GameAPIResult<any> {
    try {
      const character = this.engine.getEntity(characterId);
      if (!character) {
        return GameAPIResult.failure('NOT_FOUND', `Character not found: ${characterId}`);
      }
      
      const result = this.engine.activateFeature(featureId, character, options);
      return GameAPIResult.success(result);
    } catch (error) {
      return GameAPIResult.failure('FEATURE_ERROR', `Error applying feature: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get a character report with detailed calculation breakdowns
   */
  getCharacterReport(characterId: string): GameAPIResult<any> {
    try {
      const character = this.engine.getEntity(characterId);
      if (!character) {
        return GameAPIResult.failure('NOT_FOUND', `Character not found: ${characterId}`);
      }
      
      const report = this.calculationExplainer.getCharacterReport(character);
      return GameAPIResult.success(report);
    } catch (error) {
      return GameAPIResult.failure('REPORT_ERROR', `Error generating character report: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Apply a condition to a character
   */
  applyCondition(characterId: string, condition: string, duration?: number): GameAPIResult<void> {
    try {
      const character = this.engine.getEntity(characterId);
      if (!character) {
        return GameAPIResult.failure('NOT_FOUND', `Character not found: ${characterId}`);
      }
      
      const conditionSubsystem = this.engine.getSubsystem<ConditionSubsystem>('condition');
      if (!conditionSubsystem) {
        return GameAPIResult.failure('SUBSYSTEM_ERROR', 'Condition subsystem not available');
      }
      
      // Validate condition
      if (!conditionSubsystem.validateCondition(condition)) {
        return GameAPIResult.failure('INVALID_CONDITION', `Invalid condition: ${condition}`);
      }
      
      conditionSubsystem.applyCondition(character, condition, duration);
      this.sessionState.addCondition(characterId, condition);
      
      return GameAPIResult.success(undefined);
    } catch (error) {
      return GameAPIResult.failure('CONDITION_ERROR', `Error applying condition: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Remove a condition from a character
   */
  removeCondition(characterId: string, condition: string): GameAPIResult<void> {
    try {
      const character = this.engine.getEntity(characterId);
      if (!character) {
        return GameAPIResult.failure('NOT_FOUND', `Character not found: ${characterId}`);
      }
      
      const conditionSubsystem = this.engine.getSubsystem<ConditionSubsystem>('condition');
      if (!conditionSubsystem) {
        return GameAPIResult.failure('SUBSYSTEM_ERROR', 'Condition subsystem not available');
      }
      
      conditionSubsystem.removeCondition(character, condition);
      this.sessionState.removeCondition(characterId, condition);
      
      return GameAPIResult.success(undefined);
    } catch (error) {
      return GameAPIResult.failure('CONDITION_ERROR', `Error removing condition: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Advance to the next combat turn
   */
  nextTurn(): GameAPIResult<void> {
    try {
      this.sessionState.nextTurn();
      return GameAPIResult.success(undefined);
    } catch (error) {
      return GameAPIResult.failure('TURN_ERROR', `Error advancing turn: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Advance to the next combat round
   */
  nextRound(): GameAPIResult<void> {
    try {
      this.sessionState.nextRound();
      return GameAPIResult.success(undefined);
    } catch (error) {
      return GameAPIResult.failure('ROUND_ERROR', `Error advancing round: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get all available features
   */
  getAvailableFeatures(): GameAPIResult<any[]> {
    try {
      const features = this.featureRegistry.getAll().map(feature => ({
        id: feature.id,
        name: feature.name,
        description: feature.description,
        category: feature.category,
        prerequisites: feature.prerequisites
      }));
      
      return GameAPIResult.success(features);
    } catch (error) {
      return GameAPIResult.failure('FEATURES_ERROR', `Error getting features: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Subscribe to game events
   */
  on(eventName: string, callback: (data: any) => void): GameAPIResult<void> {
    try {
      this.engine.events.on(eventName, callback);
      return GameAPIResult.success(undefined);
    } catch (error) {
      return GameAPIResult.failure('EVENT_ERROR', `Error subscribing to event: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Unsubscribe from game events
   */
  off(eventName: string): GameAPIResult<void> {
    try {
      this.engine.events.off(eventName);
      return GameAPIResult.success(undefined);
    } catch (error) {
      return GameAPIResult.failure('EVENT_ERROR', `Error unsubscribing from event: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 