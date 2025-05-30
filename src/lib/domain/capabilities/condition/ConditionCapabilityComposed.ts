/**
 * Condition Capability Provider (Composed Version)
 * 
 * This module implements the condition capability using composition rather than inheritance.
 * It follows Unix philosophy of simple, composable tools that do one thing well.
 * 
 * Each operation is implemented as a separate function rather than a method on a class.
 */

import type { Entity } from '../../kernel/types';
import { ErrorCode, OpenMode } from '../../kernel/types';
import type { ConditionCapability, ConditionCapabilityOptions, Condition, ApplyConditionOptions } from './types';
import type { BonusCapability } from '../bonus';
import { createCapability, log, error, withEntity, initializeEntity, type CapabilityContext } from '../CapabilityKit';

/**
 * Create a new condition capability provider using composition
 * @param bonusCapability Bonus capability dependency
 * @param options Condition capability options
 * @returns Composed condition capability
 */
export function createConditionCapability(
  bonusCapability: BonusCapability,
  options: ConditionCapabilityOptions = {}
): ConditionCapability {
  // Create shared context with type information
  const context: CapabilityContext & {
    bonusCapability: BonusCapability;
    conditionDefinitions: Map<string, Omit<Condition, 'appliedAt' | 'stacks'>>;
  } = {
    id: 'condition',
    debug: options.debug || false,
    version: options.version || '1.0.0',
    kernel: null,
    storage: new Map(),
    openFiles: new Map(),
    bonusCapability,
    conditionDefinitions: new Map()
  };
  
  // Register standard conditions
  registerStandardConditions(context);
  
  // Create device capability
  const capability = createCapability({
    id: 'condition',
    debug: options.debug,
    version: options.version,
    
    // Mount handler
    onMount(kernel) {
      context.kernel = kernel;
    },
    
    // Device operations
    onRead(fd, buffer, ctx) {
      return handleRead(fd, buffer, ctx);
    },
    
    onWrite(fd, buffer, ctx) {
      return handleWrite(fd, buffer, ctx);
    },
    
    onIoctl(fd, request, arg, ctx) {
      return handleIoctl(fd, request, arg, ctx);
    }
  });
  
  // Add domain-specific methods to the capability
  const enhancedCapability = Object.assign(capability, {
    // Domain methods
    initialize: (entity: Entity) => 
      initialize(context, entity),
      
    applyCondition: (entityId: string, conditionId: string, options: ApplyConditionOptions = {}) => 
      applyCondition(context, entityId, conditionId, options),
      
    removeCondition: (entityId: string, conditionId: string) => 
      removeCondition(context, entityId, conditionId),
      
    hasCondition: (entityId: string, conditionId: string) => 
      hasCondition(context, entityId, conditionId),
      
    getCondition: (entityId: string, conditionId: string) => 
      getCondition(context, entityId, conditionId),
      
    getAllConditions: (entityId: string) => 
      getAllConditions(context, entityId),
      
    registerConditionDefinition: (conditionId: string, definition: Omit<Condition, 'appliedAt' | 'stacks'>) => 
      registerConditionDefinition(context, conditionId, definition),
      
    getConditionDefinition: (conditionId: string) => 
      getConditionDefinition(context, conditionId),
      
    processExpirations: (entityId: string, rounds: number) => 
      processExpirations(context, entityId, rounds)
  });
  
  return enhancedCapability;
}

/**
 * Initialize an entity's condition properties
 * @param context Capability context
 * @param entity Entity to initialize
 */
function initialize(context: any, entity: Entity): void {
  log(context, `Initializing conditions for entity: ${entity.id}`);
  
  // Ensure conditions property exists
  if (!entity.properties.conditions) {
    entity.properties.conditions = [];
  }
  
  log(context, `Condition initialization complete for entity: ${entity.id}`);
}

/**
 * Apply a condition to an entity
 * @param context Capability context
 * @param entityId Entity ID
 * @param conditionId Condition ID
 * @param options Options for applying the condition
 * @returns Applied condition or null on error
 */
async function applyCondition(
  context: any,
  entityId: string,
  conditionId: string,
  options: ApplyConditionOptions = {}
): Promise<Condition | null> {
  return await withEntity(context, entityId, async (entity, fd) => {
    // Ensure conditions property exists
    if (!entity.properties.conditions) {
      initialize(context, entity);
    }
    
    // Get condition definition
    const definition = getConditionDefinition(context, conditionId);
    if (!definition) {
      error(context, `Condition definition not found: ${conditionId}`);
      return null;
    }
    
    // Check if entity already has this condition
    const existingCondition = entity.properties.conditions.find(c => c.id === conditionId);
    
    if (existingCondition) {
      if (definition.stacks && options.addStack) {
        // Increment stacks if condition stacks and addStack is true
        const currentStacks = existingCondition.stacks || 1;
        const maxStacks = definition.maxStacks || Number.MAX_SAFE_INTEGER;
        
        if (currentStacks < maxStacks) {
          existingCondition.stacks = currentStacks + 1;
          
          // Update duration if specified
          if (options.duration !== undefined) {
            existingCondition.duration = options.duration;
          }
          
          // Apply stack-based effects
          applyConditionEffects(context, entityId, existingCondition);
          
          // Write updated entity
          const writeResult = context.kernel.write(fd, entity);
          if (writeResult !== 0) {
            error(context, `Failed to write entity ${entityId} after updating condition stacks`);
            return null;
          }
          
          return existingCondition;
        } else {
          log(context, `Cannot add stack to condition ${conditionId}: already at max stacks (${maxStacks})`);
          return existingCondition;
        }
      } else if (!definition.stacks) {
        log(context, `Entity ${entityId} already has non-stacking condition ${conditionId}`);
        
        // Update duration if specified
        if (options.duration !== undefined) {
          existingCondition.duration = options.duration;
          
          // Write updated entity
          const writeResult = context.kernel.write(fd, entity);
          if (writeResult !== 0) {
            error(context, `Failed to write entity ${entityId} after updating condition duration`);
            return null;
          }
        }
        
        return existingCondition;
      }
    }
    
    // Create new condition
    const newCondition: Condition = {
      ...definition,
      appliedAt: Date.now(),
      source: options.source || 'unknown',
      stacks: definition.stacks ? 1 : undefined,
      duration: options.duration,
      data: options.data
    };
    
    // Add condition to entity
    entity.properties.conditions.push(newCondition);
    
    // Apply condition effects
    applyConditionEffects(context, entityId, newCondition);
    
    // Write updated entity
    const writeResult = context.kernel.write(fd, entity);
    if (writeResult !== 0) {
      error(context, `Failed to write entity ${entityId} after adding condition`);
      return null;
    }
    
    log(context, `Applied condition ${conditionId} to entity ${entityId}`);
    
    return newCondition;
  });
}

/**
 * Remove a condition from an entity
 * @param context Capability context
 * @param entityId Entity ID
 * @param conditionId Condition ID
 * @returns Whether the condition was removed
 */
async function removeCondition(context: any, entityId: string, conditionId: string): Promise<boolean> {
  return await withEntity(context, entityId, async (entity, fd) => {
    if (!entity.properties.conditions) {
      return false;
    }
    
    // Get the condition
    const condition = entity.properties.conditions.find(c => c.id === conditionId);
    
    if (!condition) {
      return false;
    }
    
    // Check if condition is removable
    if (!condition.removable) {
      log(context, `Cannot remove condition ${conditionId}: not removable`);
      return false;
    }
    
    // Remove condition effects
    removeConditionEffects(context, entityId, condition);
    
    // Remove condition from entity
    entity.properties.conditions = entity.properties.conditions.filter(c => c.id !== conditionId);
    
    // Write updated entity
    const writeResult = context.kernel.write(fd, entity);
    if (writeResult !== 0) {
      error(context, `Failed to write entity ${entityId} after removing condition`);
      return false;
    }
    
    log(context, `Removed condition ${conditionId} from entity ${entityId}`);
    
    return true;
  });
}

/**
 * Check if an entity has a condition
 * @param context Capability context
 * @param entityId Entity ID
 * @param conditionId Condition ID
 * @returns Whether the entity has the condition
 */
async function hasCondition(context: any, entityId: string, conditionId: string): Promise<boolean> {
  return await withEntity(context, entityId, async (entity) => {
    if (!entity.properties.conditions) {
      return false;
    }
    
    return entity.properties.conditions.some(c => c.id === conditionId);
  });
}

/**
 * Get a condition on an entity
 * @param context Capability context
 * @param entityId Entity ID
 * @param conditionId Condition ID
 * @returns Condition or undefined if not found
 */
async function getCondition(context: any, entityId: string, conditionId: string): Promise<Condition | undefined> {
  return await withEntity(context, entityId, async (entity) => {
    if (!entity.properties.conditions) {
      return undefined;
    }
    
    return entity.properties.conditions.find(c => c.id === conditionId);
  });
}

/**
 * Get all conditions on an entity
 * @param context Capability context
 * @param entityId Entity ID
 * @returns All conditions on the entity
 */
async function getAllConditions(context: any, entityId: string): Promise<Condition[]> {
  return await withEntity(context, entityId, async (entity) => {
    if (!entity.properties.conditions) {
      return [];
    }
    
    return [...entity.properties.conditions];
  });
}

/**
 * Register a condition definition
 * @param context Capability context
 * @param conditionId Condition ID
 * @param definition Condition definition
 */
function registerConditionDefinition(
  context: any,
  conditionId: string,
  definition: Omit<Condition, 'appliedAt' | 'stacks'>
): void {
  context.conditionDefinitions.set(conditionId, definition);
  log(context, `Registered condition definition: ${conditionId}`);
}

/**
 * Get a condition definition
 * @param context Capability context
 * @param conditionId Condition ID
 * @returns Condition definition or undefined if not found
 */
function getConditionDefinition(
  context: any,
  conditionId: string
): Omit<Condition, 'appliedAt' | 'stacks'> | undefined {
  return context.conditionDefinitions.get(conditionId);
}

/**
 * Process condition expirations
 * @param context Capability context
 * @param entityId Entity ID
 * @param rounds Number of rounds that have passed
 * @returns Conditions that expired
 */
async function processExpirations(context: any, entityId: string, rounds: number): Promise<Condition[]> {
  return await withEntity(context, entityId, async (entity, fd) => {
    if (!entity.properties.conditions) {
      return [];
    }
    
    const expiredConditions: Condition[] = [];
    
    // Process each condition
    for (const condition of [...entity.properties.conditions]) {
      if (condition.duration !== undefined) {
        // Reduce duration by number of rounds
        condition.duration -= rounds;
        
        // If duration reaches 0 or below, the condition expires
        if (condition.duration <= 0) {
          // Remove the condition from the entity
          removeConditionEffects(context, entityId, condition);
          entity.properties.conditions = entity.properties.conditions.filter(c => c.id !== condition.id);
          
          // Add to expired conditions list
          expiredConditions.push(condition);
        }
      }
    }
    
    // Write updated entity if we've expired any conditions
    if (expiredConditions.length > 0) {
      const writeResult = context.kernel.write(fd, entity);
      if (writeResult !== 0) {
        error(context, `Failed to write entity ${entityId} after processing expirations`);
        return [];
      }
    }
    
    return expiredConditions;
  });
}

/**
 * Register standard conditions
 * @param context Capability context
 */
function registerStandardConditions(context: any): void {
  // Blinded
  registerConditionDefinition(context, 'blinded', {
    id: 'blinded',
    name: 'Blinded',
    description: 'The character cannot see, taking a -2 penalty to AC, losing Dexterity bonus to AC, and taking a -4 penalty on most Strength and Dexterity-based skill checks and on opposed Perception skill checks.',
    severity: 4,
    removable: true,
    stacks: false,
    source: 'system'
  });
  
  // Confused
  registerConditionDefinition(context, 'confused', {
    id: 'confused',
    name: 'Confused',
    description: 'The character behaves randomly, rolling on the confusion table each round.',
    severity: 3,
    removable: true,
    stacks: false,
    source: 'system'
  });
  
  // Dazzled
  registerConditionDefinition(context, 'dazzled', {
    id: 'dazzled',
    name: 'Dazzled',
    description: 'The creature is unable to see well because of overstimulation of the eyes, taking a -1 penalty on attack rolls and sight-based Perception checks.',
    severity: 1,
    removable: true,
    stacks: false,
    source: 'system'
  });
  
  // Deafened
  registerConditionDefinition(context, 'deafened', {
    id: 'deafened',
    name: 'Deafened',
    description: 'The character cannot hear, taking a -4 penalty on initiative checks and a -4 penalty on Perception checks based on sound.',
    severity: 2,
    removable: true,
    stacks: false,
    source: 'system'
  });
  
  // Fatigued
  registerConditionDefinition(context, 'fatigued', {
    id: 'fatigued',
    name: 'Fatigued',
    description: 'A fatigued character cannot run or charge and takes a -2 penalty to Strength and Dexterity.',
    severity: 2,
    removable: true,
    stacks: false,
    source: 'system'
  });
  
  // Exhausted
  registerConditionDefinition(context, 'exhausted', {
    id: 'exhausted',
    name: 'Exhausted',
    description: 'An exhausted character moves at half speed, cannot run or charge, and takes a -6 penalty to Strength and Dexterity.',
    severity: 3,
    removable: true,
    stacks: false,
    source: 'system'
  });
  
  // Frightened
  registerConditionDefinition(context, 'frightened', {
    id: 'frightened',
    name: 'Frightened',
    description: 'A frightened creature flees from the source of its fear as best it can, taking a -2 penalty on attack rolls, saving throws, skill checks, and ability checks.',
    severity: 3,
    removable: true,
    stacks: false,
    source: 'system'
  });
  
  // Shaken
  registerConditionDefinition(context, 'shaken', {
    id: 'shaken',
    name: 'Shaken',
    description: 'A shaken character takes a -2 penalty on attack rolls, saving throws, skill checks, and ability checks.',
    severity: 2,
    removable: true,
    stacks: false,
    source: 'system'
  });
  
  // Sickened
  registerConditionDefinition(context, 'sickened', {
    id: 'sickened',
    name: 'Sickened',
    description: 'The character takes a -2 penalty on all attack rolls, weapon damage rolls, saving throws, skill checks, and ability checks.',
    severity: 2,
    removable: true,
    stacks: false,
    source: 'system'
  });
  
  // Stunned
  registerConditionDefinition(context, 'stunned', {
    id: 'stunned',
    name: 'Stunned',
    description: 'A stunned creature drops everything held, cannot take actions, takes a -2 penalty to AC, and loses Dexterity bonus to AC.',
    severity: 4,
    removable: true,
    stacks: false,
    source: 'system'
  });
}

/**
 * Apply condition effects to an entity
 * @param context Capability context
 * @param entityId Entity ID
 * @param condition Condition to apply effects for
 */
function applyConditionEffects(context: any, entityId: string, condition: Condition): void {
  // Apply effects based on condition
  switch (condition.id) {
    case 'blinded':
      // -2 penalty to AC
      context.bonusCapability.addBonus(entityId, 'ac', -2, 'condition', condition.id);
      
      // -4 penalty to relevant skill checks
      context.bonusCapability.addBonus(entityId, 'skill.perception', -4, 'condition', condition.id);
      break;
      
    case 'dazzled':
      // -1 penalty on attack rolls
      context.bonusCapability.addBonus(entityId, 'attack', -1, 'condition', condition.id);
      
      // -1 penalty on sight-based Perception checks
      context.bonusCapability.addBonus(entityId, 'skill.perception', -1, 'condition', condition.id);
      break;
      
    case 'deafened':
      // -4 penalty on initiative checks
      context.bonusCapability.addBonus(entityId, 'initiative', -4, 'condition', condition.id);
      
      // -4 penalty on Perception checks based on sound
      context.bonusCapability.addBonus(entityId, 'skill.perception', -4, 'condition', condition.id);
      break;
      
    case 'fatigued':
      // -2 penalty to Strength
      context.bonusCapability.addBonus(entityId, 'ability.strength', -2, 'condition', condition.id);
      
      // -2 penalty to Dexterity
      context.bonusCapability.addBonus(entityId, 'ability.dexterity', -2, 'condition', condition.id);
      break;
      
    case 'exhausted':
      // -6 penalty to Strength
      context.bonusCapability.addBonus(entityId, 'ability.strength', -6, 'condition', condition.id);
      
      // -6 penalty to Dexterity
      context.bonusCapability.addBonus(entityId, 'ability.dexterity', -6, 'condition', condition.id);
      break;
      
    case 'frightened':
    case 'shaken':
      // -2 penalty on attack rolls, saving throws, skill checks, and ability checks
      context.bonusCapability.addBonus(entityId, 'attack', -2, 'condition', condition.id);
      context.bonusCapability.addBonus(entityId, 'save.fortitude', -2, 'condition', condition.id);
      context.bonusCapability.addBonus(entityId, 'save.reflex', -2, 'condition', condition.id);
      context.bonusCapability.addBonus(entityId, 'save.will', -2, 'condition', condition.id);
      break;
      
    case 'sickened':
      // -2 penalty on all attack rolls, weapon damage rolls, saving throws, skill checks, and ability checks
      context.bonusCapability.addBonus(entityId, 'attack', -2, 'condition', condition.id);
      context.bonusCapability.addBonus(entityId, 'damage', -2, 'condition', condition.id);
      context.bonusCapability.addBonus(entityId, 'save.fortitude', -2, 'condition', condition.id);
      context.bonusCapability.addBonus(entityId, 'save.reflex', -2, 'condition', condition.id);
      context.bonusCapability.addBonus(entityId, 'save.will', -2, 'condition', condition.id);
      break;
      
    case 'stunned':
      // -2 penalty to AC, lose Dexterity bonus to AC
      context.bonusCapability.addBonus(entityId, 'ac', -2, 'condition', condition.id);
      break;
  }
}

/**
 * Remove condition effects from an entity
 * @param context Capability context
 * @param entityId Entity ID
 * @param condition Condition to remove effects for
 */
function removeConditionEffects(context: any, entityId: string, condition: Condition): void {
  // Remove all bonuses associated with this condition source
  context.bonusCapability.removeBonusesWithSource(entityId, condition.id);
}

/**
 * Handle IOCTL operations for the condition capability
 * @param fd File descriptor
 * @param request Request code
 * @param arg Operation arguments
 * @param context Capability context
 * @returns Error code
 */
function handleIoctl(fd: number, request: number, arg: any, context: any): number {
  // Check if this is an initialization request
  if (arg && arg.operation === 'initialize' && arg.entityPath) {
    return handleInitializeOperation(arg.entityPath, context);
  }
  
  // Check if this is a condition manipulation request
  if (arg && arg.operation === 'applyCondition' && arg.entityPath && arg.conditionId) {
    return handleApplyConditionOperation(arg.entityPath, arg.conditionId, arg.options || {}, context);
  }
  
  if (arg && arg.operation === 'removeCondition' && arg.entityPath && arg.conditionId) {
    return handleRemoveConditionOperation(arg.entityPath, arg.conditionId, context);
  }
  
  if (arg && arg.operation === 'processExpirations' && arg.entityPath && arg.rounds) {
    return handleProcessExpirationsOperation(arg.entityPath, arg.rounds, context);
  }
  
  // Unrecognized operation
  return ErrorCode.EINVAL;
}

/**
 * Handle initialization operation
 * @param entityPath Path to the entity
 * @param context Capability context
 * @returns Error code
 */
function handleInitializeOperation(entityPath: string, context: any): number {
  try {
    // Open the entity
    const fd = context.kernel.open(entityPath, OpenMode.READ_WRITE);
    if (fd < 0) {
      error(context, `Failed to open entity: ${entityPath}`);
      return ErrorCode.ENOENT;
    }
    
    try {
      // Read entity data
      const [result, entity] = context.kernel.read(fd);
      
      if (result !== 0) {
        error(context, `Failed to read entity: ${entityPath}`);
        return result;
      }
      
      // Initialize conditions
      initialize(context, entity);
      
      // Write updated entity
      const writeResult = context.kernel.write(fd, entity);
      
      if (writeResult !== 0) {
        error(context, `Failed to write entity: ${entityPath}`);
        return writeResult;
      }
      
      return ErrorCode.SUCCESS;
    } finally {
      // Close file descriptor
      context.kernel.close(fd);
    }
  } catch (err) {
    error(context, `Error processing initialize operation: ${err}`);
    return ErrorCode.EIO;
  }
}

/**
 * Handle apply condition operation
 * @param entityPath Path to the entity
 * @param conditionId Condition ID
 * @param options Apply condition options
 * @param context Capability context
 * @returns Error code
 */
function handleApplyConditionOperation(
  entityPath: string,
  conditionId: string,
  options: ApplyConditionOptions,
  context: any
): number {
  try {
    // Extract entity ID from path
    const entityId = entityPath.substring('/entity/'.length);
    
    // Open the entity
    const fd = context.kernel.open(entityPath, OpenMode.READ_WRITE);
    if (fd < 0) {
      error(context, `Failed to open entity: ${entityPath}`);
      return ErrorCode.ENOENT;
    }
    
    try {
      // Read entity data
      const [result, entity] = context.kernel.read(fd);
      
      if (result !== 0) {
        error(context, `Failed to read entity: ${entityPath}`);
        return result;
      }
      
      // Ensure conditions property exists
      if (!entity.properties.conditions) {
        initialize(context, entity);
      }
      
      // Get condition definition
      const definition = getConditionDefinition(context, conditionId);
      if (!definition) {
        error(context, `Condition definition not found: ${conditionId}`);
        return ErrorCode.EINVAL;
      }
      
      // Check if entity already has this condition
      const existingCondition = entity.properties.conditions.find(c => c.id === conditionId);
      
      if (existingCondition) {
        if (definition.stacks && options.addStack) {
          // Increment stacks if condition stacks and addStack is true
          const currentStacks = existingCondition.stacks || 1;
          const maxStacks = definition.maxStacks || Number.MAX_SAFE_INTEGER;
          
          if (currentStacks < maxStacks) {
            existingCondition.stacks = currentStacks + 1;
            
            // Update duration if specified
            if (options.duration !== undefined) {
              existingCondition.duration = options.duration;
            }
            
            // Apply stack-based effects
            applyConditionEffects(context, entityId, existingCondition);
          }
        } else if (!definition.stacks) {
          // Update duration if specified
          if (options.duration !== undefined) {
            existingCondition.duration = options.duration;
          }
        }
      } else {
        // Create new condition
        const newCondition: Condition = {
          ...definition,
          appliedAt: Date.now(),
          source: options.source || 'unknown',
          stacks: definition.stacks ? 1 : undefined,
          duration: options.duration,
          data: options.data
        };
        
        // Add condition to entity
        entity.properties.conditions.push(newCondition);
        
        // Apply condition effects
        applyConditionEffects(context, entityId, newCondition);
      }
      
      // Write updated entity
      const writeResult = context.kernel.write(fd, entity);
      
      if (writeResult !== 0) {
        error(context, `Failed to write entity: ${entityPath}`);
        return writeResult;
      }
      
      return ErrorCode.SUCCESS;
    } finally {
      // Close file descriptor
      context.kernel.close(fd);
    }
  } catch (err) {
    error(context, `Error processing applyCondition operation: ${err}`);
    return ErrorCode.EIO;
  }
}

/**
 * Handle remove condition operation
 * @param entityPath Path to the entity
 * @param conditionId Condition ID
 * @param context Capability context
 * @returns Error code
 */
function handleRemoveConditionOperation(entityPath: string, conditionId: string, context: any): number {
  try {
    // Extract entity ID from path
    const entityId = entityPath.substring('/entity/'.length);
    
    // Open the entity
    const fd = context.kernel.open(entityPath, OpenMode.READ_WRITE);
    if (fd < 0) {
      error(context, `Failed to open entity: ${entityPath}`);
      return ErrorCode.ENOENT;
    }
    
    try {
      // Read entity data
      const [result, entity] = context.kernel.read(fd);
      
      if (result !== 0) {
        error(context, `Failed to read entity: ${entityPath}`);
        return result;
      }
      
      if (!entity.properties.conditions) {
        return ErrorCode.SUCCESS; // No conditions to remove
      }
      
      // Get the condition
      const condition = entity.properties.conditions.find(c => c.id === conditionId);
      
      if (!condition) {
        return ErrorCode.SUCCESS; // Condition not found
      }
      
      // Check if condition is removable
      if (!condition.removable) {
        log(context, `Cannot remove condition ${conditionId}: not removable`);
        return ErrorCode.EPERM;
      }
      
      // Remove condition effects
      removeConditionEffects(context, entityId, condition);
      
      // Remove condition from entity
      entity.properties.conditions = entity.properties.conditions.filter(c => c.id !== conditionId);
      
      // Write updated entity
      const writeResult = context.kernel.write(fd, entity);
      
      if (writeResult !== 0) {
        error(context, `Failed to write entity: ${entityPath}`);
        return writeResult;
      }
      
      return ErrorCode.SUCCESS;
    } finally {
      // Close file descriptor
      context.kernel.close(fd);
    }
  } catch (err) {
    error(context, `Error processing removeCondition operation: ${err}`);
    return ErrorCode.EIO;
  }
}

/**
 * Handle process expirations operation
 * @param entityPath Path to the entity
 * @param rounds Number of rounds that have passed
 * @param context Capability context
 * @returns Error code
 */
function handleProcessExpirationsOperation(entityPath: string, rounds: number, context: any): number {
  try {
    // Extract entity ID from path
    const entityId = entityPath.substring('/entity/'.length);
    
    // Open the entity
    const fd = context.kernel.open(entityPath, OpenMode.READ_WRITE);
    if (fd < 0) {
      error(context, `Failed to open entity: ${entityPath}`);
      return ErrorCode.ENOENT;
    }
    
    try {
      // Read entity data
      const [result, entity] = context.kernel.read(fd);
      
      if (result !== 0) {
        error(context, `Failed to read entity: ${entityPath}`);
        return result;
      }
      
      if (!entity.properties.conditions) {
        return ErrorCode.SUCCESS; // No conditions to process
      }
      
      let hasExpired = false;
      
      // Process each condition
      for (let i = entity.properties.conditions.length - 1; i >= 0; i--) {
        const condition = entity.properties.conditions[i];
        
        if (condition.duration !== undefined) {
          // Reduce duration by number of rounds
          condition.duration -= rounds;
          
          // If duration reaches 0 or below, the condition expires
          if (condition.duration <= 0) {
            // Remove condition effects
            removeConditionEffects(context, entityId, condition);
            
            // Remove condition from entity
            entity.properties.conditions.splice(i, 1);
            
            hasExpired = true;
          }
        }
      }
      
      // Only write if we've actually expired conditions
      if (hasExpired) {
        // Write updated entity
        const writeResult = context.kernel.write(fd, entity);
        
        if (writeResult !== 0) {
          error(context, `Failed to write entity: ${entityPath}`);
          return writeResult;
        }
      }
      
      return ErrorCode.SUCCESS;
    } finally {
      // Close file descriptor
      context.kernel.close(fd);
    }
  } catch (err) {
    error(context, `Error processing processExpirations operation: ${err}`);
    return ErrorCode.EIO;
  }
}

/**
 * Handle read operations for the condition capability
 * @param fd File descriptor
 * @param buffer Buffer to read into
 * @param context Capability context
 * @returns Error code
 */
function handleRead(fd: number, buffer: any, context: any): number {
  // Check if this is a file descriptor we know about
  const fileInfo = context.openFiles.get(fd);
  if (!fileInfo) {
    error(context, `Invalid file descriptor: ${fd}`);
    return ErrorCode.EBADF;
  }
  
  // Extract entity ID and other path components from path
  const match = fileInfo.path.match(/\/entity\/([^\/]+)\/conditions(?:\/([^\/]+))?/);
  if (match) {
    const entityId = match[1];
    const conditionId = match[2];
    
    // Get the entity
    const entityPath = `/entity/${entityId}`;
    const entityFd = context.kernel.open(entityPath, OpenMode.READ);
    
    if (entityFd < 0) {
      error(context, `Failed to open entity: ${entityPath}`);
      return ErrorCode.ENOENT;
    }
    
    try {
      // Read entity data
      const [result, entity] = context.kernel.read(entityFd);
      
      if (result !== 0) {
        error(context, `Failed to read entity: ${entityPath}`);
        return result;
      }
      
      if (!entity.properties.conditions) {
        // Initialize conditions if they don't exist
        entity.properties.conditions = [];
      }
      
      if (conditionId === undefined) {
        // Return all conditions
        Object.assign(buffer, {
          conditions: [...entity.properties.conditions]
        });
      } else if (conditionId === 'definitions') {
        // Return all condition definitions
        const definitions: Record<string, any> = {};
        
        for (const [id, def] of context.conditionDefinitions.entries()) {
          definitions[id] = { ...def };
        }
        
        Object.assign(buffer, {
          definitions
        });
      } else {
        // Return specific condition
        const condition = entity.properties.conditions.find(c => c.id === conditionId);
        
        if (condition) {
          Object.assign(buffer, {
            condition
          });
        } else {
          error(context, `Condition not found: ${conditionId}`);
          return ErrorCode.ENOENT;
        }
      }
      
      return ErrorCode.SUCCESS;
    } finally {
      // Close file descriptor
      context.kernel.close(entityFd);
    }
  }
  
  // Unrecognized path
  return ErrorCode.EINVAL;
}

/**
 * Handle write operations for the condition capability
 * @param fd File descriptor
 * @param buffer Data to write
 * @param context Capability context
 * @returns Error code
 */
function handleWrite(fd: number, buffer: any, context: any): number {
  // Check if this is a file descriptor we know about
  const fileInfo = context.openFiles.get(fd);
  if (!fileInfo) {
    error(context, `Invalid file descriptor: ${fd}`);
    return ErrorCode.EBADF;
  }
  
  // Extract entity ID and other path components from path
  const match = fileInfo.path.match(/\/entity\/([^\/]+)\/conditions(?:\/([^\/]+))?/);
  if (match) {
    const entityId = match[1];
    const conditionId = match[2];
    
    // Get the entity
    const entityPath = `/entity/${entityId}`;
    const entityFd = context.kernel.open(entityPath, OpenMode.READ_WRITE);
    
    if (entityFd < 0) {
      error(context, `Failed to open entity: ${entityPath}`);
      return ErrorCode.ENOENT;
    }
    
    try {
      // Read entity data
      const [result, entity] = context.kernel.read(entityFd);
      
      if (result !== 0) {
        error(context, `Failed to read entity: ${entityPath}`);
        return result;
      }
      
      if (!entity.properties.conditions) {
        // Initialize conditions if they don't exist
        entity.properties.conditions = [];
      }
      
      // Check what operation we're performing
      if (buffer.applyCondition && buffer.applyCondition.id) {
        // Apply condition
        const conditionId = buffer.applyCondition.id;
        const options = buffer.applyCondition.options || {};
        
        // Get condition definition
        const definition = getConditionDefinition(context, conditionId);
        if (!definition) {
          error(context, `Condition definition not found: ${conditionId}`);
          return ErrorCode.EINVAL;
        }
        
        // Apply condition logic
        const existingCondition = entity.properties.conditions.find(c => c.id === conditionId);
        
        if (existingCondition) {
          if (definition.stacks && options.addStack) {
            const currentStacks = existingCondition.stacks || 1;
            const maxStacks = definition.maxStacks || Number.MAX_SAFE_INTEGER;
            
            if (currentStacks < maxStacks) {
              existingCondition.stacks = currentStacks + 1;
              
              if (options.duration !== undefined) {
                existingCondition.duration = options.duration;
              }
              
              applyConditionEffects(context, entityId, existingCondition);
            }
          } else if (options.duration !== undefined) {
            existingCondition.duration = options.duration;
          }
        } else {
          // Create new condition
          const newCondition: Condition = {
            ...definition,
            appliedAt: Date.now(),
            source: options.source || 'unknown',
            stacks: definition.stacks ? 1 : undefined,
            duration: options.duration,
            data: options.data
          };
          
          // Add condition to entity
          entity.properties.conditions.push(newCondition);
          
          // Apply condition effects
          applyConditionEffects(context, entityId, newCondition);
        }
      } else if (buffer.removeCondition) {
        // Remove condition
        const conditionIdToRemove = conditionId || buffer.removeCondition.id;
        
        if (!conditionIdToRemove) {
          error(context, 'No condition ID specified for removal');
          return ErrorCode.EINVAL;
        }
        
        const condition = entity.properties.conditions.find(c => c.id === conditionIdToRemove);
        
        if (condition) {
          if (!condition.removable) {
            error(context, `Cannot remove condition ${conditionIdToRemove}: not removable`);
            return ErrorCode.EPERM;
          }
          
          // Remove condition effects
          removeConditionEffects(context, entityId, condition);
          
          // Remove condition from entity
          entity.properties.conditions = entity.properties.conditions.filter(c => c.id !== conditionIdToRemove);
        }
      } else if (buffer.processExpirations && typeof buffer.processExpirations.rounds === 'number') {
        // Process expirations
        const rounds = buffer.processExpirations.rounds;
        
        for (let i = entity.properties.conditions.length - 1; i >= 0; i--) {
          const condition = entity.properties.conditions[i];
          
          if (condition.duration !== undefined) {
            // Reduce duration by number of rounds
            condition.duration -= rounds;
            
            // If duration reaches 0 or below, the condition expires
            if (condition.duration <= 0) {
              // Remove condition effects
              removeConditionEffects(context, entityId, condition);
              
              // Remove condition from entity
              entity.properties.conditions.splice(i, 1);
            }
          }
        }
      } else {
        // Unknown command
        error(context, 'Unknown command in write buffer');
        return ErrorCode.EINVAL;
      }
      
      // Write updated entity
      const writeResult = context.kernel.write(entityFd, entity);
      
      if (writeResult !== 0) {
        error(context, `Failed to write entity: ${entityPath}`);
        return writeResult;
      }
      
      return ErrorCode.SUCCESS;
    } finally {
      // Close file descriptor
      context.kernel.close(entityFd);
    }
  }
  
  // Unrecognized path
  return ErrorCode.EINVAL;
}