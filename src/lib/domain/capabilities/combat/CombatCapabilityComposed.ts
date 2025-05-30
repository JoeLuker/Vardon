/**
 * Combat Capability (Composed)
 * 
 * This module implements the combat capability using Unix composition principles.
 * It provides access to combat statistics and rolls through file operations
 * following the Unix philosophy of "everything is a file" and "do one thing well".
 */

import type { Entity } from '../../kernel/types';
import { ErrorCode, OpenMode } from '../../kernel/types';
import type { 
  CombatCapability, 
  CombatCapabilityOptions, 
  CombatStats,
  AttackRoll,
  DamageRoll
} from './types';
import type { AbilityCapability } from '../ability/types';
import type { BonusCapability } from '../bonus/types';
import { 
  createCapability, 
  log, 
  error, 
  type CapabilityContext, 
  withEntity, 
  withEntitySync
} from '../CapabilityKit';

/**
 * Extended capability context for combat capability
 */
interface CombatCapabilityContext extends CapabilityContext {
  /** Ability capability reference */
  abilityCapability: AbilityCapability;
  
  /** Bonus capability reference */
  bonusCapability: BonusCapability;
}

/**
 * Create a combat capability
 * @param abilityCapability Ability capability to use
 * @param bonusCapability Bonus capability to use
 * @param options Capability options
 * @returns A combat capability
 */
export function createCombatCapability(
  abilityCapability: AbilityCapability,
  bonusCapability: BonusCapability,
  options: CombatCapabilityOptions = {}
): CombatCapability {
  // Create shared context for all operations
  const context: CombatCapabilityContext = {
    id: 'combat',
    debug: options.debug || false,
    version: options.version || '1.0.0',
    kernel: null,
    storage: new Map(),
    openFiles: new Map(),
    abilityCapability,
    bonusCapability
  };
  
  log(context, 'Combat capability initialized');
  
  // Create base capability with device operations
  const capability = createCapability({
    id: context.id,
    debug: context.debug,
    version: context.version,
    
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
  
  // Enhance capability with domain-specific methods
  return Object.assign(capability, {
    // Initialize entity
    initialize: (entity: Entity) => initialize(context, entity),
    
    // Combat stat operations
    getCombatStats: (entity: Entity) => 
      getCombatStats(context, entity),
    
    // Roll operations
    rollAttack: (entity: Entity, attackBonus: number, options = {}) => 
      rollAttack(context, entity, attackBonus, options),
      
    rollDamage: (entity: Entity, damageFormula: string, options = {}) => 
      rollDamage(context, entity, damageFormula, options),
    
    // Modifier operations
    addBaseAttackBonusModifier: (entity: Entity, value: number, source: string) => 
      addBaseAttackBonusModifier(context, entity, value, source),
      
    addMeleeAttackModifier: (entity: Entity, value: number, source: string) => 
      addMeleeAttackModifier(context, entity, value, source),
      
    addRangedAttackModifier: (entity: Entity, value: number, source: string) => 
      addRangedAttackModifier(context, entity, value, source),
      
    addCMBModifier: (entity: Entity, value: number, source: string) => 
      addCMBModifier(context, entity, value, source),
      
    addCMDModifier: (entity: Entity, value: number, source: string) => 
      addCMDModifier(context, entity, value, source),
      
    addACModifier: (entity: Entity, value: number, source: string, options = {}) => 
      addACModifier(context, entity, value, source, options),
      
    addSaveModifier: (entity: Entity, save: 'fortitude' | 'reflex' | 'will', value: number, source: string) => 
      addSaveModifier(context, entity, save, value, source),
      
    setBaseSave: (entity: Entity, save: 'fortitude' | 'reflex' | 'will', value: number) => 
      setBaseSave(context, entity, save, value)
  });
}

/**
 * Initialize an entity's combat properties
 * @param context Capability context
 * @param entity Entity to initialize
 */
function initialize(context: CombatCapabilityContext, entity: Entity): void {
  log(context, `Initializing combat for entity: ${entity.id}`);
  
  // Ensure combat property exists
  if (!entity.properties.combat) {
    entity.properties.combat = {
      baseAttackBonus: 0,
      meleeBonuses: [],
      rangedBonuses: [],
      cmbBonuses: [],
      cmdBonuses: [],
      acBonuses: [],
      saves: {
        fortitude: {
          base: 0,
          bonuses: []
        },
        reflex: {
          base: 0,
          bonuses: []
        },
        will: {
          base: 0,
          bonuses: []
        }
      }
    };
  }
  
  // Initialize base attack bonus from classes if available
  if (entity.properties.classes && Array.isArray(entity.properties.classes)) {
    let totalBAB = 0;
    for (const characterClass of entity.properties.classes) {
      // Simple BAB calculation based on class and level
      const classLevel = characterClass.level || 0;
      let classBAB = 0;

      // Full BAB progression classes (fighter, barbarian, etc.)
      if (['fighter', 'barbarian', 'paladin', 'ranger'].includes(characterClass.id)) {
        classBAB = classLevel;
      }
      // 3/4 BAB progression classes (rogue, cleric, etc.)
      else if (['rogue', 'cleric', 'bard', 'monk', 'druid'].includes(characterClass.id)) {
        classBAB = Math.floor(classLevel * 0.75);
      }
      // 1/2 BAB progression classes (wizard, sorcerer, etc.)
      else {
        classBAB = Math.floor(classLevel * 0.5);
      }

      totalBAB += classBAB;
    }

    entity.properties.combat.baseAttackBonus = totalBAB;
  }
  
  // Initialize saves based on classes if available
  if (entity.properties.classes && Array.isArray(entity.properties.classes)) {
    let totalFort = 0;
    let totalRef = 0;
    let totalWill = 0;

    for (const characterClass of entity.properties.classes) {
      const classLevel = characterClass.level || 0;

      // Good save progression (2 + level/2)
      const goodSave = Math.floor(2 + classLevel / 2);

      // Poor save progression (level/3)
      const poorSave = Math.floor(classLevel / 3);

      // Apply based on class
      switch (characterClass.id) {
        case 'fighter':
          totalFort += goodSave;
          totalRef += poorSave;
          totalWill += poorSave;
          break;
        case 'rogue':
          totalFort += poorSave;
          totalRef += goodSave;
          totalWill += poorSave;
          break;
        case 'wizard':
        case 'sorcerer':
          totalFort += poorSave;
          totalRef += poorSave;
          totalWill += goodSave;
          break;
        case 'cleric':
          totalFort += goodSave;
          totalRef += poorSave;
          totalWill += goodSave;
          break;
        default:
          // Default to all poor saves
          totalFort += poorSave;
          totalRef += poorSave;
          totalWill += poorSave;
      }
    }

    entity.properties.combat.saves.fortitude.base = totalFort;
    entity.properties.combat.saves.reflex.base = totalRef;
    entity.properties.combat.saves.will.base = totalWill;
  }
  
  log(context, `Combat initialization complete for entity: ${entity.id}`);
}

/**
 * Get entity's combat statistics
 * @param context Capability context
 * @param entity The entity to get combat statistics for
 * @returns Combat statistics
 */
function getCombatStats(context: CombatCapabilityContext, entity: Entity): CombatStats {
  // Get ability modifiers
  const strMod = context.abilityCapability.getAbilityModifier(entity, 'strength');
  const dexMod = context.abilityCapability.getAbilityModifier(entity, 'dexterity');
  const conMod = context.abilityCapability.getAbilityModifier(entity, 'constitution');
  const wisMod = context.abilityCapability.getAbilityModifier(entity, 'wisdom');
  
  // Get base attack bonus
  const baseAttackBonus = entity.properties.combat?.baseAttackBonus || 0;
  
  // Calculate melee attack bonus
  const meleeBonus = baseAttackBonus + strMod;
  const meleeModifiers = [
    { source: 'Base Attack Bonus', value: baseAttackBonus },
    { source: 'Strength', value: strMod }
  ];
  
  // Add melee attack bonuses
  if (entity.properties.combat?.meleeBonuses && Array.isArray(entity.properties.combat.meleeBonuses)) {
    for (const bonus of entity.properties.combat.meleeBonuses) {
      meleeModifiers.push(bonus);
    }
  }
  
  // Calculate ranged attack bonus
  const rangedBonus = baseAttackBonus + dexMod;
  const rangedModifiers = [
    { source: 'Base Attack Bonus', value: baseAttackBonus },
    { source: 'Dexterity', value: dexMod }
  ];
  
  // Add ranged attack bonuses
  if (entity.properties.combat?.rangedBonuses && Array.isArray(entity.properties.combat.rangedBonuses)) {
    for (const bonus of entity.properties.combat.rangedBonuses) {
      rangedModifiers.push(bonus);
    }
  }
  
  // Calculate CMB
  const cmbBonus = baseAttackBonus + strMod;
  const cmbModifiers = [
    { source: 'Base Attack Bonus', value: baseAttackBonus },
    { source: 'Strength', value: strMod }
  ];
  
  // Add CMB bonuses
  if (entity.properties.combat?.cmbBonuses && Array.isArray(entity.properties.combat.cmbBonuses)) {
    for (const bonus of entity.properties.combat.cmbBonuses) {
      cmbModifiers.push(bonus);
    }
  }
  
  // Calculate CMD
  const cmdBase = 10 + baseAttackBonus + strMod + dexMod;
  const cmdModifiers = [
    { source: 'Base', value: 10 },
    { source: 'Base Attack Bonus', value: baseAttackBonus },
    { source: 'Strength', value: strMod },
    { source: 'Dexterity', value: dexMod }
  ];
  
  // Add CMD bonuses
  if (entity.properties.combat?.cmdBonuses && Array.isArray(entity.properties.combat.cmdBonuses)) {
    for (const bonus of entity.properties.combat.cmdBonuses) {
      cmdModifiers.push(bonus);
    }
  }
  
  // Calculate AC
  const acBase = 10 + dexMod;
  const acModifiers = [
    { 
      source: 'Base', 
      value: 10, 
      type: 'base',
      appliesToTouch: true,
      appliesToFlatFooted: true
    },
    { 
      source: 'Dexterity', 
      value: dexMod, 
      type: 'dexterity',
      appliesToTouch: true,
      appliesToFlatFooted: false
    }
  ];
  
  // Add AC bonuses
  if (entity.properties.combat?.acBonuses && Array.isArray(entity.properties.combat.acBonuses)) {
    for (const bonus of entity.properties.combat.acBonuses) {
      acModifiers.push(bonus);
    }
  }
  
  // Calculate total AC
  let totalAC = acBase;
  let touchAC = 10 + dexMod; // Base + Dex
  let flatFootedAC = 10; // Base without Dex
  
  for (const mod of acModifiers) {
    if (mod.source !== 'Base' && mod.source !== 'Dexterity') {
      totalAC += mod.value;
      
      if (mod.appliesToTouch) {
        touchAC += mod.value;
      }
      
      if (mod.appliesToFlatFooted) {
        flatFootedAC += mod.value;
      }
    }
  }
  
  // Calculate saves
  const fortBase = entity.properties.combat?.saves?.fortitude?.base || 0;
  const fortTotal = fortBase + conMod;
  const fortModifiers = [
    { source: 'Base Save', value: fortBase },
    { source: 'Constitution', value: conMod }
  ];
  
  // Add fortitude bonuses
  if (entity.properties.combat?.saves?.fortitude?.bonuses && 
      Array.isArray(entity.properties.combat.saves.fortitude.bonuses)) {
    for (const bonus of entity.properties.combat.saves.fortitude.bonuses) {
      fortModifiers.push(bonus);
    }
  }
  
  const refBase = entity.properties.combat?.saves?.reflex?.base || 0;
  const refTotal = refBase + dexMod;
  const refModifiers = [
    { source: 'Base Save', value: refBase },
    { source: 'Dexterity', value: dexMod }
  ];
  
  // Add reflex bonuses
  if (entity.properties.combat?.saves?.reflex?.bonuses && 
      Array.isArray(entity.properties.combat.saves.reflex.bonuses)) {
    for (const bonus of entity.properties.combat.saves.reflex.bonuses) {
      refModifiers.push(bonus);
    }
  }
  
  const willBase = entity.properties.combat?.saves?.will?.base || 0;
  const willTotal = willBase + wisMod;
  const willModifiers = [
    { source: 'Base Save', value: willBase },
    { source: 'Wisdom', value: wisMod }
  ];
  
  // Add will bonuses
  if (entity.properties.combat?.saves?.will?.bonuses && 
      Array.isArray(entity.properties.combat.saves.will.bonuses)) {
    for (const bonus of entity.properties.combat.saves.will.bonuses) {
      willModifiers.push(bonus);
    }
  }
  
  return {
    baseAttackBonus,
    meleeAttack: {
      total: sumModifiers(meleeModifiers),
      modifiers: meleeModifiers
    },
    rangedAttack: {
      total: sumModifiers(rangedModifiers),
      modifiers: rangedModifiers
    },
    cmb: {
      total: sumModifiers(cmbModifiers),
      modifiers: cmbModifiers
    },
    cmd: {
      total: sumModifiers(cmdModifiers),
      modifiers: cmdModifiers
    },
    ac: {
      total: totalAC,
      touch: touchAC,
      flatFooted: flatFootedAC,
      modifiers: acModifiers
    },
    saves: {
      fortitude: {
        total: fortTotal,
        base: fortBase,
        modifiers: fortModifiers
      },
      reflex: {
        total: refTotal,
        base: refBase,
        modifiers: refModifiers
      },
      will: {
        total: willTotal,
        base: willBase,
        modifiers: willModifiers
      }
    }
  };
}

/**
 * Roll an attack
 * @param context Capability context
 * @param entity The entity making the attack
 * @param attackBonus Attack bonus
 * @param options Attack options
 * @returns Attack roll result
 */
function rollAttack(
  context: CombatCapabilityContext,
  entity: Entity,
  attackBonus: number,
  options: {
    criticalRange?: [number, number];
    criticalMultiplier?: number;
  } = {}
): AttackRoll {
  // Default critical range is 20
  const critRange = options.criticalRange || [20, 20];
  
  // Roll d20
  const natural = Math.floor(Math.random() * 20) + 1;
  
  // Calculate total
  const total = natural + attackBonus;
  
  // Check for critical threat
  const isCriticalThreat = natural >= critRange[0] && natural <= critRange[1];
  
  // Check for natural 20 (automatic hit)
  const isNatural20 = natural === 20;
  
  // Check for natural 1 (automatic miss)
  const isNatural1 = natural === 1;
  
  return {
    natural,
    total,
    isCriticalThreat,
    isNatural20,
    isNatural1,
    modifiers: [
      { source: 'Die Roll', value: natural },
      { source: 'Attack Bonus', value: attackBonus }
    ]
  };
}

/**
 * Roll damage
 * @param context Capability context
 * @param entity The entity dealing damage
 * @param damageFormula Damage formula (e.g. "1d8+3")
 * @param options Damage options
 * @returns Damage roll result
 */
function rollDamage(
  context: CombatCapabilityContext,
  entity: Entity,
  damageFormula: string,
  options: {
    damageType?: string;
    isCritical?: boolean;
    criticalMultiplier?: number;
  } = {}
): DamageRoll {
  // Default damage type is "untyped"
  const damageType = options.damageType || 'untyped';
  
  // Default critical multiplier is 2
  const criticalMultiplier = options.criticalMultiplier || 2;
  
  // Parse damage formula (e.g. "1d8+3")
  const match = damageFormula.match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/);
  if (!match) {
    throw new Error(`Invalid damage formula: ${damageFormula}`);
  }
  
  const [, diceCount, diceSides, modOp, modValue] = match;
  
  // Roll dice
  let baseDamage = 0;
  for (let i = 0; i < parseInt(diceCount, 10); i++) {
    baseDamage += Math.floor(Math.random() * parseInt(diceSides, 10)) + 1;
  }
  
  // Apply modifier
  const modifier = modOp && modValue ? (modOp === '+' ? 1 : -1) * parseInt(modValue, 10) : 0;
  let total = baseDamage + modifier;
  
  // Apply critical if needed
  const isCritical = options.isCritical || false;
  if (isCritical) {
    // Multiply the total damage by the critical multiplier
    // Note: Some games multiply only the dice, not the modifiers
    total *= criticalMultiplier;
  }
  
  return {
    baseDamage,
    total,
    damageType,
    isCritical,
    criticalMultiplier,
    modifiers: [
      { source: 'Dice Roll', value: baseDamage },
      { source: 'Modifier', value: modifier }
    ]
  };
}

/**
 * Add a base attack bonus modifier
 * @param context Capability context
 * @param entity The entity to modify
 * @param value Modifier value
 * @param source Source of the modifier
 */
function addBaseAttackBonusModifier(
  context: CombatCapabilityContext,
  entity: Entity,
  value: number,
  source: string
): void {
  // Ensure combat property exists
  if (!entity.properties.combat) {
    initialize(context, entity);
  }
  
  // Add modifier to base attack bonus
  context.bonusCapability.addBonus(
    entity,
    'base_attack_bonus',
    value,
    source
  );
  
  // Note: This actually gets applied when getCombatStats is called
}

/**
 * Add a melee attack modifier
 * @param context Capability context
 * @param entity The entity to modify
 * @param value Modifier value
 * @param source Source of the modifier
 */
function addMeleeAttackModifier(
  context: CombatCapabilityContext,
  entity: Entity,
  value: number,
  source: string
): void {
  // Ensure combat property exists
  if (!entity.properties.combat) {
    initialize(context, entity);
  }
  
  // Ensure melee bonuses array exists
  if (!entity.properties.combat.meleeBonuses) {
    entity.properties.combat.meleeBonuses = [];
  }
  
  // Add modifier
  entity.properties.combat.meleeBonuses.push({
    source,
    value
  });
}

/**
 * Add a ranged attack modifier
 * @param context Capability context
 * @param entity The entity to modify
 * @param value Modifier value
 * @param source Source of the modifier
 */
function addRangedAttackModifier(
  context: CombatCapabilityContext,
  entity: Entity,
  value: number,
  source: string
): void {
  // Ensure combat property exists
  if (!entity.properties.combat) {
    initialize(context, entity);
  }
  
  // Ensure ranged bonuses array exists
  if (!entity.properties.combat.rangedBonuses) {
    entity.properties.combat.rangedBonuses = [];
  }
  
  // Add modifier
  entity.properties.combat.rangedBonuses.push({
    source,
    value
  });
}

/**
 * Add a CMB modifier
 * @param context Capability context
 * @param entity The entity to modify
 * @param value Modifier value
 * @param source Source of the modifier
 */
function addCMBModifier(
  context: CombatCapabilityContext,
  entity: Entity,
  value: number,
  source: string
): void {
  // Ensure combat property exists
  if (!entity.properties.combat) {
    initialize(context, entity);
  }
  
  // Ensure CMB bonuses array exists
  if (!entity.properties.combat.cmbBonuses) {
    entity.properties.combat.cmbBonuses = [];
  }
  
  // Add modifier
  entity.properties.combat.cmbBonuses.push({
    source,
    value
  });
}

/**
 * Add a CMD modifier
 * @param context Capability context
 * @param entity The entity to modify
 * @param value Modifier value
 * @param source Source of the modifier
 */
function addCMDModifier(
  context: CombatCapabilityContext,
  entity: Entity,
  value: number,
  source: string
): void {
  // Ensure combat property exists
  if (!entity.properties.combat) {
    initialize(context, entity);
  }
  
  // Ensure CMD bonuses array exists
  if (!entity.properties.combat.cmdBonuses) {
    entity.properties.combat.cmdBonuses = [];
  }
  
  // Add modifier
  entity.properties.combat.cmdBonuses.push({
    source,
    value
  });
}

/**
 * Add an AC modifier
 * @param context Capability context
 * @param entity The entity to modify
 * @param value Modifier value
 * @param source Source of the modifier
 * @param options AC modifier options
 */
function addACModifier(
  context: CombatCapabilityContext,
  entity: Entity,
  value: number,
  source: string,
  options: {
    type?: string;
    appliesToTouch?: boolean;
    appliesToFlatFooted?: boolean;
  } = {}
): void {
  // Ensure combat property exists
  if (!entity.properties.combat) {
    initialize(context, entity);
  }
  
  // Ensure AC bonuses array exists
  if (!entity.properties.combat.acBonuses) {
    entity.properties.combat.acBonuses = [];
  }
  
  // Set default values
  const type = options.type || 'untyped';
  const appliesToTouch = options.appliesToTouch !== undefined ? options.appliesToTouch : false;
  const appliesToFlatFooted = options.appliesToFlatFooted !== undefined ? options.appliesToFlatFooted : true;
  
  // Add modifier
  entity.properties.combat.acBonuses.push({
    source,
    value,
    type,
    appliesToTouch,
    appliesToFlatFooted
  });
}

/**
 * Add a save modifier
 * @param context Capability context
 * @param entity The entity to modify
 * @param save Save type (fortitude, reflex, will)
 * @param value Modifier value
 * @param source Source of the modifier
 */
function addSaveModifier(
  context: CombatCapabilityContext,
  entity: Entity,
  save: 'fortitude' | 'reflex' | 'will',
  value: number,
  source: string
): void {
  // Ensure combat property exists
  if (!entity.properties.combat) {
    initialize(context, entity);
  }
  
  // Ensure saves object exists
  if (!entity.properties.combat.saves) {
    entity.properties.combat.saves = {
      fortitude: { base: 0, bonuses: [] },
      reflex: { base: 0, bonuses: [] },
      will: { base: 0, bonuses: [] }
    };
  }
  
  // Ensure specific save exists
  if (!entity.properties.combat.saves[save]) {
    entity.properties.combat.saves[save] = { base: 0, bonuses: [] };
  }
  
  // Ensure bonuses array exists
  if (!entity.properties.combat.saves[save].bonuses) {
    entity.properties.combat.saves[save].bonuses = [];
  }
  
  // Add modifier
  entity.properties.combat.saves[save].bonuses.push({
    source,
    value
  });
}

/**
 * Set base save bonus
 * @param context Capability context
 * @param entity The entity to modify
 * @param save Save type (fortitude, reflex, will)
 * @param value Base save value
 */
function setBaseSave(
  context: CombatCapabilityContext,
  entity: Entity,
  save: 'fortitude' | 'reflex' | 'will',
  value: number
): void {
  // Ensure combat property exists
  if (!entity.properties.combat) {
    initialize(context, entity);
  }
  
  // Ensure saves object exists
  if (!entity.properties.combat.saves) {
    entity.properties.combat.saves = {
      fortitude: { base: 0, bonuses: [] },
      reflex: { base: 0, bonuses: [] },
      will: { base: 0, bonuses: [] }
    };
  }
  
  // Ensure specific save exists
  if (!entity.properties.combat.saves[save]) {
    entity.properties.combat.saves[save] = { base: 0, bonuses: [] };
  }
  
  // Set base save value
  entity.properties.combat.saves[save].base = value;
}

/**
 * Handle read operations for the combat capability
 * @param fd File descriptor
 * @param buffer Buffer to read into
 * @param context Capability context
 * @returns Error code
 */
function handleRead(fd: number, buffer: any, context: CombatCapabilityContext): number {
  // Check if this is a file descriptor for a combat resource
  const fileInfo = context.openFiles.get(fd);
  if (!fileInfo) {
    error(context, `Invalid file descriptor: ${fd}`);
    return ErrorCode.EBADF;
  }
  
  // Extract entity ID and resource type from path
  // Example paths:
  // /entity/{id}/combat/stats - Combat statistics
  // /entity/{id}/combat/ac - Armor class
  // /entity/{id}/combat/saves - Saving throws
  const match = fileInfo.path.match(/\/entity\/([^\/]+)\/combat\/([^\/]+)/);
  if (match) {
    const entityId = match[1];
    const resourceType = match[2];
    
    // Use the withEntity helper to handle file operations
    return withEntitySync(context, entityId, (entity) => {
      // Dispatch to appropriate handler based on resource type
      switch (resourceType) {
        case 'stats':
          const stats = getCombatStats(context, entity);
          Object.assign(buffer, stats);
          return ErrorCode.SUCCESS;
          
        case 'ac':
          const acStats = getCombatStats(context, entity).ac;
          Object.assign(buffer, acStats);
          return ErrorCode.SUCCESS;
          
        case 'saves':
          const saveStats = getCombatStats(context, entity).saves;
          Object.assign(buffer, saveStats);
          return ErrorCode.SUCCESS;
          
        case 'attack':
          // Handle attack roll if requested with ?roll in path
          if (fileInfo.path.includes('?roll')) {
            const stats = getCombatStats(context, entity);
            const attackRoll = rollAttack(context, entity, stats.meleeAttack.total);
            Object.assign(buffer, attackRoll);
            return ErrorCode.SUCCESS;
          }
          
          // Otherwise return attack bonuses
          const attackStats = {
            melee: getCombatStats(context, entity).meleeAttack,
            ranged: getCombatStats(context, entity).rangedAttack
          };
          Object.assign(buffer, attackStats);
          return ErrorCode.SUCCESS;
        
        default:
          error(context, `Unknown combat resource type: ${resourceType}`);
          return ErrorCode.EINVAL;
      }
    });
  }
  
  // Unrecognized path
  return ErrorCode.EINVAL;
}

/**
 * Handle write operations for the combat capability
 * @param fd File descriptor
 * @param buffer Buffer to write
 * @param context Capability context
 * @returns Error code
 */
function handleWrite(fd: number, buffer: any, context: CombatCapabilityContext): number {
  // Check if this is a file descriptor for a combat resource
  const fileInfo = context.openFiles.get(fd);
  if (!fileInfo) {
    error(context, `Invalid file descriptor: ${fd}`);
    return ErrorCode.EBADF;
  }
  
  // Extract entity ID and resource type from path
  const match = fileInfo.path.match(/\/entity\/([^\/]+)\/combat\/([^\/]+)/);
  if (match) {
    const entityId = match[1];
    const resourceType = match[2];
    
    // Use the withEntity helper to handle file operations
    return withEntitySync(context, entityId, (entity) => {
      // Dispatch to appropriate handler based on resource type
      switch (resourceType) {
        case 'modifiers':
          // Handle different types of modifiers
          if (buffer.type === 'melee' && buffer.value !== undefined && buffer.source) {
            addMeleeAttackModifier(context, entity, buffer.value, buffer.source);
            return ErrorCode.SUCCESS;
          }
          
          if (buffer.type === 'ranged' && buffer.value !== undefined && buffer.source) {
            addRangedAttackModifier(context, entity, buffer.value, buffer.source);
            return ErrorCode.SUCCESS;
          }
          
          if (buffer.type === 'ac' && buffer.value !== undefined && buffer.source) {
            addACModifier(context, entity, buffer.value, buffer.source, buffer.options || {});
            return ErrorCode.SUCCESS;
          }
          
          if (buffer.type === 'save' && buffer.save && buffer.value !== undefined && buffer.source) {
            if (['fortitude', 'reflex', 'will'].includes(buffer.save)) {
              addSaveModifier(context, entity, buffer.save as any, buffer.value, buffer.source);
              return ErrorCode.SUCCESS;
            } else {
              error(context, `Invalid save type: ${buffer.save}`);
              return ErrorCode.EINVAL;
            }
          }
          
          return ErrorCode.EINVAL;
        
        case 'roll':
          // Handle different types of rolls
          // Data is stored in context for later retrieval
          if (buffer.type === 'attack' && buffer.bonus !== undefined) {
            const attackRoll = rollAttack(context, entity, buffer.bonus, buffer.options || {});
            context.storage.set(`last_attack_roll_${entityId}`, attackRoll);
            return ErrorCode.SUCCESS;
          }
          
          if (buffer.type === 'damage' && buffer.formula) {
            const damageRoll = rollDamage(context, entity, buffer.formula, buffer.options || {});
            context.storage.set(`last_damage_roll_${entityId}`, damageRoll);
            return ErrorCode.SUCCESS;
          }
          
          return ErrorCode.EINVAL;
          
        default:
          error(context, `Unknown combat resource type: ${resourceType}`);
          return ErrorCode.EINVAL;
      }
    });
  }
  
  // Unrecognized path
  return ErrorCode.EINVAL;
}

/**
 * Handle IOCTL operations for the combat capability
 * @param fd File descriptor
 * @param request Request code
 * @param arg Operation arguments
 * @param context Capability context
 * @returns Error code
 */
function handleIoctl(fd: number, request: number, arg: any, context: CombatCapabilityContext): number {
  // Check if this is an initialization request
  if (arg && arg.operation === 'initialize' && arg.entityPath) {
    return handleInitializeOperation(arg.entityPath, context);
  }
  
  // Other IOCTL operations for combat
  if (arg && arg.operation === 'setBaseSave' && 
      arg.entityPath && arg.save && arg.value !== undefined) {
    return handleSetBaseSave(arg.entityPath, arg.save, arg.value, context);
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
function handleInitializeOperation(entityPath: string, context: CombatCapabilityContext): number {
  try {
    // Extract entity ID from path
    const entityId = entityPath.substring('/entity/'.length);
    
    // Use the withEntity helper to handle file operations
    return withEntitySync(context, entityId, (entity) => {
      // Initialize combat statistics
      initialize(context, entity);
      return ErrorCode.SUCCESS;
    });
  } catch (err) {
    error(context, `Error processing initialize operation: ${err}`);
    return ErrorCode.EIO;
  }
}

/**
 * Handle set base save operation
 * @param entityPath Path to the entity
 * @param save Save type
 * @param value Base save value
 * @param context Capability context
 * @returns Error code
 */
function handleSetBaseSave(
  entityPath: string, 
  save: string, 
  value: number, 
  context: CombatCapabilityContext
): number {
  try {
    // Extract entity ID from path
    const entityId = entityPath.substring('/entity/'.length);
    
    // Validate save type
    if (!['fortitude', 'reflex', 'will'].includes(save)) {
      error(context, `Invalid save type: ${save}`);
      return ErrorCode.EINVAL;
    }
    
    // Use the withEntity helper to handle file operations
    return withEntitySync(context, entityId, (entity) => {
      // Set base save
      setBaseSave(context, entity, save as any, value);
      return ErrorCode.SUCCESS;
    });
  } catch (err) {
    error(context, `Error processing setBaseSave operation: ${err}`);
    return ErrorCode.EIO;
  }
}

/**
 * Sum modifiers from an array
 * @param modifiers Array of modifiers
 * @returns Sum of modifier values
 */
function sumModifiers(modifiers: Array<{ value: number }>): number {
  return modifiers.reduce((sum, mod) => sum + mod.value, 0);
}