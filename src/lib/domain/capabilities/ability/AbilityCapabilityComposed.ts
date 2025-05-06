/**
 * Ability Capability Provider (Composed Version)
 * 
 * This module implements the ability capability using composition rather than inheritance.
 * It follows Unix philosophy of simple, composable tools that do one thing well.
 * 
 * Each operation is implemented as a separate function rather than a method on a class.
 */

import type { Entity } from '../../kernel/types';
import { ErrorCode, OpenMode } from '../../kernel/types';
import type { AbilityCapability, AbilityCapabilityOptions, AbilityBreakdown, BonusBreakdown } from './types';
import type { BonusCapability } from '../bonus';
import { createCapability, log, error, withEntity, initializeEntity, type CapabilityContext } from '../CapabilityKit';

/**
 * Standard abilities in Pathfinder
 */
export const STANDARD_ABILITIES = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma'
];

/**
 * Create a new ability capability provider using composition
 * @param bonusCapability Bonus capability dependency
 * @param options Ability capability options
 * @returns Composed ability capability
 */
export function createAbilityCapability(
  bonusCapability: BonusCapability,
  options: AbilityCapabilityOptions = {}
): AbilityCapability {
  // Create shared context
  const context: CapabilityContext & {
    defaultAbilities: string[];
    bonusCapability: BonusCapability;
  } = {
    id: 'ability',
    debug: options.debug || false,
    version: options.version || '1.0.0',
    kernel: null,
    storage: new Map(),
    openFiles: new Map(),
    defaultAbilities: options.defaultAbilities || STANDARD_ABILITIES,
    bonusCapability
  };
  
  // Create device capability
  const capability = createCapability({
    id: 'ability',
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
    getAbilityScore: (entity: Entity, ability: string) => 
      getAbilityScore(context, entity, ability),
      
    getAbilityModifier: (entity: Entity, ability: string) => 
      getAbilityModifier(context, entity, ability),
      
    setAbilityScore: (entity: Entity, ability: string, value: number) => 
      setAbilityScore(context, entity, ability, value),
      
    getBaseAbilityScore: (entity: Entity, ability: string) => 
      getBaseAbilityScore(context, entity, ability),
      
    getAbilityBreakdown: (entity: Entity, ability: string) => 
      getAbilityBreakdown(context, entity, ability),
      
    applyAbilityBonus: (entity: Entity, ability: string, value: number, type: string, source: string) => 
      applyAbilityBonus(context, entity, ability, value, type, source),
      
    removeAbilityBonus: (entity: Entity, ability: string, source: string) => 
      removeAbilityBonus(context, entity, ability, source),
      
    initialize: (entity: Entity) => 
      initialize(context, entity)
  });
  
  return enhancedCapability;
}

/**
 * Initialize ability scores for an entity
 * @param context Capability context
 * @param entity Entity to initialize
 */
function initialize(context: any, entity: Entity): void {
  // Ensure the abilities property exists and set defaults in one step
  entity.properties.abilities = {
    ...Object.fromEntries(context.defaultAbilities.map((ability: string) => [ability, 10])),
    ...entity.properties.abilities || {}
  };
  
  log(context, `Initialized ability scores for entity: ${entity.id}`);
}

/**
 * Get the total ability score including all bonuses
 * @param context Capability context
 * @param entity Entity to get ability score for
 * @param ability Ability name (e.g. 'strength')
 * @returns Total ability score
 */
function getAbilityScore(context: any, entity: Entity, ability: string): number {
  // Get base ability score
  const base = getBaseAbilityScore(context, entity, ability);
  
  // Calculate bonuses
  const bonusTotal = context.bonusCapability.calculateTotal(entity, ability);
  
  return base + bonusTotal;
}

/**
 * Get the ability modifier calculated from the total score
 * @param context Capability context
 * @param entity Entity to get ability modifier for
 * @param ability Ability name (e.g. 'strength')
 * @returns Ability modifier
 */
function getAbilityModifier(context: any, entity: Entity, ability: string): number {
  const score = getAbilityScore(context, entity, ability);
  return Math.floor((score - 10) / 2);
}

/**
 * Set the base ability score
 * @param context Capability context
 * @param entity Entity to set ability score for
 * @param ability Ability name (e.g. 'strength')
 * @param value Base ability score value
 */
function setAbilityScore(context: any, entity: Entity, ability: string, value: number): void {
  // Ensure the abilities property exists
  if (!entity.properties.abilities) {
    entity.properties.abilities = {};
  }
  
  // Set the ability score
  entity.properties.abilities[ability] = value;
  
  // Update entity timestamp
  entity.metadata.updatedAt = Date.now();
  
  log(context, `Set ${ability} for entity ${entity.id} to ${value}`);
}

/**
 * Get the base ability score before bonuses
 * @param context Capability context
 * @param entity Entity to get base ability score for
 * @param ability Ability name (e.g. 'strength')
 * @returns Base ability score
 */
function getBaseAbilityScore(context: any, entity: Entity, ability: string): number {
  // Ensure the abilities property exists
  if (!entity.properties.abilities) {
    return 10; // Default score
  }
  
  // Get the ability score, defaulting to 10 if not set
  return entity.properties.abilities[ability] || 10;
}

/**
 * Get a detailed breakdown of an ability score
 * @param context Capability context
 * @param entity Entity to get ability breakdown for
 * @param ability Ability name (e.g. 'strength')
 * @returns Ability breakdown
 */
function getAbilityBreakdown(context: any, entity: Entity, ability: string): AbilityBreakdown {
  // Get base ability score
  const base = getBaseAbilityScore(context, entity, ability);
  
  // Get bonus breakdown
  const bonuses = context.bonusCapability.getBreakdown(entity, ability);
  
  // Calculate total
  const total = base + bonuses.total;
  
  // Calculate modifier
  const modifier = Math.floor((total - 10) / 2);
  
  return {
    ability,
    base,
    total,
    modifier,
    bonuses
  };
}

/**
 * Apply a bonus to an ability score
 * @param context Capability context
 * @param entity Entity to apply bonus to
 * @param ability Ability name (e.g. 'strength')
 * @param value Bonus value
 * @param type Bonus type (e.g. 'enhancement', 'morale')
 * @param source Source of the bonus (e.g. 'Bull's Strength')
 */
function applyAbilityBonus(
  context: any,
  entity: Entity,
  ability: string,
  value: number,
  type: string,
  source: string
): void {
  context.bonusCapability.addBonus(entity, ability, value, type, source);
  log(context, `Applied ${type} bonus of ${value} to ${ability} for entity ${entity.id} from ${source}`);
}

/**
 * Remove a bonus from an ability score
 * @param context Capability context
 * @param entity Entity to remove bonus from
 * @param ability Ability name (e.g. 'strength')
 * @param source Source of the bonus to remove
 */
function removeAbilityBonus(context: any, entity: Entity, ability: string, source: string): void {
  context.bonusCapability.removeBonus(entity, ability, source);
  log(context, `Removed bonus from ${ability} for entity ${entity.id} from ${source}`);
}

/**
 * Handle IOCTL operations for the ability capability
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
  
  // Handle ability score get/set operations
  if (arg && arg.operation === 'getAbilityScore' && arg.entityPath && arg.ability) {
    return handleGetAbilityScore(arg.entityPath, arg.ability, context);
  }
  
  if (arg && arg.operation === 'setAbilityScore' && arg.entityPath && arg.ability && arg.value) {
    return handleSetAbilityScore(arg.entityPath, arg.ability, arg.value, context);
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
      
      // Initialize abilities
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
 * Handle get ability score operation
 * @param entityPath Path to the entity
 * @param abilityName Ability name
 * @param context Capability context
 * @returns Error code
 */
function handleGetAbilityScore(entityPath: string, abilityName: string, context: any): number {
  try {
    // Extract entity ID from path
    const entityId = entityPath.substring('/entity/'.length);
    
    // Open the entity
    const fd = context.kernel.open(entityPath, OpenMode.READ);
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
      
      // Get ability score
      const score = getAbilityScore(context, entity, abilityName);
      
      // Store result in context storage
      context.storage.set(`last_ability_score_${entityId}_${abilityName}`, score);
      
      return ErrorCode.SUCCESS;
    } finally {
      // Close file descriptor
      context.kernel.close(fd);
    }
  } catch (err) {
    error(context, `Error processing getAbilityScore operation: ${err}`);
    return ErrorCode.EIO;
  }
}

/**
 * Handle set ability score operation
 * @param entityPath Path to the entity
 * @param abilityName Ability name
 * @param value Ability score value
 * @param context Capability context
 * @returns Error code
 */
function handleSetAbilityScore(entityPath: string, abilityName: string, value: number, context: any): number {
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
      
      // Set ability score
      setAbilityScore(context, entity, abilityName, value);
      
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
    error(context, `Error processing setAbilityScore operation: ${err}`);
    return ErrorCode.EIO;
  }
}

/**
 * Handle read operations for the ability capability
 * @param fd File descriptor
 * @param buffer Buffer to read into
 * @param context Capability context
 * @returns Error code
 */
function handleRead(fd: number, buffer: any, context: any): number {
  // Check if this is a file descriptor for an entity or a special query
  const fileInfo = context.openFiles.get(fd);
  if (!fileInfo) {
    error(context, `Invalid file descriptor: ${fd}`);
    return ErrorCode.EBADF;
  }
  
  // Extract entity ID from path
  const match = fileInfo.path.match(/\/entity\/([^\/]+)\/abilities\/([^\/]+)/);
  if (match) {
    const entityId = match[1];
    const abilityName = match[2];
    
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
      
      // Get ability data
      if (abilityName === 'all') {
        // Get all abilities
        const abilities: Record<string, any> = {};
        
        for (const ability of context.defaultAbilities) {
          abilities[ability] = {
            score: getAbilityScore(context, entity, ability),
            modifier: getAbilityModifier(context, entity, ability),
            base: getBaseAbilityScore(context, entity, ability)
          };
        }
        
        // Copy data to buffer
        Object.assign(buffer, abilities);
      } else {
        // Get specific ability
        const breakdown = getAbilityBreakdown(context, entity, abilityName);
        
        // Copy data to buffer
        Object.assign(buffer, breakdown);
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
 * Handle write operations for the ability capability
 * @param fd File descriptor
 * @param buffer Data to write
 * @param context Capability context
 * @returns Error code
 */
function handleWrite(fd: number, buffer: any, context: any): number {
  // Check if this is a file descriptor for an entity or a special command
  const fileInfo = context.openFiles.get(fd);
  if (!fileInfo) {
    error(context, `Invalid file descriptor: ${fd}`);
    return ErrorCode.EBADF;
  }
  
  // Extract entity ID from path
  const match = fileInfo.path.match(/\/entity\/([^\/]+)\/abilities\/([^\/]+)/);
  if (match) {
    const entityId = match[1];
    const abilityName = match[2];
    
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
      
      // Check what type of write we're doing
      if (buffer.setValue && typeof buffer.setValue === 'number') {
        // Set ability value
        setAbilityScore(context, entity, abilityName, buffer.setValue);
      } else if (buffer.addBonus && typeof buffer.addBonus.value === 'number') {
        // Add bonus
        applyAbilityBonus(
          context,
          entity,
          abilityName,
          buffer.addBonus.value,
          buffer.addBonus.type || 'untyped',
          buffer.addBonus.source || 'unknown'
        );
      } else if (buffer.removeBonus && typeof buffer.removeBonus.source === 'string') {
        // Remove bonus
        removeAbilityBonus(
          context,
          entity,
          abilityName,
          buffer.removeBonus.source
        );
      } else {
        // Unknown command
        error(context, `Unknown command in write buffer`);
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