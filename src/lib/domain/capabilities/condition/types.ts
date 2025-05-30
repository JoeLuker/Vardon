/**
 * Condition Capability Types
 * 
 * This module defines the types for the condition capability.
 */

import type { Capability } from '../../kernel/types';

/**
 * Condition definition
 */
export interface Condition {
  /** Unique identifier for this condition */
  id: string;
  
  /** Human-readable name of this condition */
  name: string;
  
  /** Description of this condition's effects */
  description: string;
  
  /** Severity of the condition (1-5, with 5 being most severe) */
  severity: number;
  
  /** Whether this condition can be removed */
  removable: boolean;
  
  /** Whether this condition stacks with itself */
  stacks: boolean;
  
  /** Maximum number of stacks (if stacks is true) */
  maxStacks?: number;
  
  /** Duration of the condition in rounds (if temporary) */
  duration?: number;
  
  /** Source of the condition */
  source: string;
  
  /** Timestamp when the condition was applied */
  appliedAt: number;
  
  /** Current stack count (if stacks is true) */
  stacks?: number;
  
  /** Additional data specific to this condition */
  data?: Record<string, any>;
}

/**
 * Options for applying a condition
 */
export interface ApplyConditionOptions {
  /** Duration in rounds (if temporary) */
  duration?: number;
  
  /** Source of the condition */
  source?: string;
  
  /** Whether to add a stack (if condition stacks) */
  addStack?: boolean;
  
  /** Additional data to include with the condition */
  data?: Record<string, any>;
}

/**
 * Condition capability options
 */
export interface ConditionCapabilityOptions {
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * Condition capability
 */
export interface ConditionCapability extends Capability {
  /** Unique identifier for this capability */
  readonly id: 'condition';
  
  /**
   * Apply a condition to an entity
   * @param entityId Entity ID
   * @param conditionId Condition ID
   * @param options Options for applying the condition
   * @returns Applied condition
   */
  applyCondition(
    entityId: string,
    conditionId: string,
    options?: ApplyConditionOptions
  ): Condition;
  
  /**
   * Remove a condition from an entity
   * @param entityId Entity ID
   * @param conditionId Condition ID
   * @returns Whether the condition was removed
   */
  removeCondition(entityId: string, conditionId: string): boolean;
  
  /**
   * Check if an entity has a condition
   * @param entityId Entity ID
   * @param conditionId Condition ID
   * @returns Whether the entity has the condition
   */
  hasCondition(entityId: string, conditionId: string): boolean;
  
  /**
   * Get a condition on an entity
   * @param entityId Entity ID
   * @param conditionId Condition ID
   * @returns Condition or undefined if not found
   */
  getCondition(entityId: string, conditionId: string): Condition | undefined;
  
  /**
   * Get all conditions on an entity
   * @param entityId Entity ID
   * @returns All conditions on the entity
   */
  getAllConditions(entityId: string): Condition[];
  
  /**
   * Register a condition definition
   * @param conditionId Condition ID
   * @param definition Condition definition
   */
  registerConditionDefinition(
    conditionId: string,
    definition: Omit<Condition, 'appliedAt' | 'stacks'>
  ): void;
  
  /**
   * Get a condition definition
   * @param conditionId Condition ID
   * @returns Condition definition or undefined if not found
   */
  getConditionDefinition(conditionId: string): Omit<Condition, 'appliedAt' | 'stacks'> | undefined;
  
  /**
   * Process condition expirations
   * @param entityId Entity ID
   * @param rounds Number of rounds that have passed
   * @returns Conditions that expired
   */
  processExpirations(entityId: string, rounds: number): Condition[];
}