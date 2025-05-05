/**
 * Combat Capability Provider
 * 
 * This module provides the combat capability implementation.
 */

import type { Entity } from '../../kernel/types';
import type { CombatCapability, CombatCapabilityOptions, CombatStats, AttackRoll, DamageRoll } from './types';
import type { AbilityCapability } from '../ability/types';
import type { BonusCapability } from '../bonus/types';
import { BaseCapability } from '../BaseCapability';

/**
 * Implementation of the combat capability
 */
export class CombatCapabilityProvider extends BaseCapability implements CombatCapability {
  /** Unique identifier for this capability */
  public readonly id = 'combat';
  
  /** Semantic version of this capability */
  public readonly version = '1.0.0';
  
  /** Dependencies */
  private readonly abilityCapability: AbilityCapability;
  private readonly bonusCapability: BonusCapability;
  
  constructor(
    abilityCapability: AbilityCapability,
    bonusCapability: BonusCapability,
    options: CombatCapabilityOptions = {}
  ) {
    super({ debug: options.debug });
    
    this.abilityCapability = abilityCapability;
    this.bonusCapability = bonusCapability;
    
    this.log('Combat capability provider initialized');
  }
  
  /**
   * Initialize an entity's combat properties
   * @param entity Entity to initialize
   */
  initialize(entity: Entity): void {
    this.log(`Initializing combat for entity: ${entity.id}`);
    
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
    if (entity.properties.legacyData?.character?.classes && Array.isArray(entity.properties.legacyData.character.classes)) {
      let totalBAB = 0;
      for (const characterClass of entity.properties.legacyData.character.classes) {
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
    if (entity.properties.legacyData?.character?.classes && Array.isArray(entity.properties.legacyData.character.classes)) {
      let totalFort = 0;
      let totalRef = 0;
      let totalWill = 0;
      
      for (const characterClass of entity.properties.legacyData.character.classes) {
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
    
    this.log(`Combat initialization complete for entity: ${entity.id}`);
  }
  
  /**
   * Get entity's combat statistics
   * @param entity The entity to get combat statistics for
   * @returns Combat statistics
   */
  getCombatStats(entity: Entity): CombatStats {
    
    // Get ability modifiers
    const strMod = this.abilityCapability.getAbilityModifier(entity, 'strength');
    const dexMod = this.abilityCapability.getAbilityModifier(entity, 'dexterity');
    const conMod = this.abilityCapability.getAbilityModifier(entity, 'constitution');
    const wisMod = this.abilityCapability.getAbilityModifier(entity, 'wisdom');
    
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
        total: this.sumModifiers(meleeModifiers),
        modifiers: meleeModifiers
      },
      rangedAttack: {
        total: this.sumModifiers(rangedModifiers),
        modifiers: rangedModifiers
      },
      cmb: {
        total: this.sumModifiers(cmbModifiers),
        modifiers: cmbModifiers
      },
      cmd: {
        total: this.sumModifiers(cmdModifiers),
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
   * @param entity The entity making the attack
   * @param attackBonus Attack bonus
   * @param options Attack options
   * @returns Attack roll result
   */
  rollAttack(
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
   * @param entity The entity dealing damage
   * @param damageFormula Damage formula (e.g. "1d8+3")
   * @param options Damage options
   * @returns Damage roll result
   */
  rollDamage(
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
   * @param entity The entity to modify
   * @param value Modifier value
   * @param source Source of the modifier
   */
  addBaseAttackBonusModifier(entity: Entity, value: number, source: string): void {
    
    // Ensure combat property exists
    if (!entity.properties.combat) {
      this.initialize(entity);
    }
    
    // Add modifier to base attack bonus
    this.bonusCapability.addBonus(
      entity,
      'base_attack_bonus',
      value,
      source
    );
    
    // Note: This actually gets applied when getCombatStats is called
  }
  
  /**
   * Add a melee attack modifier
   * @param entityId Entity ID
   * @param value Modifier value
   * @param source Source of the modifier
   */
  addMeleeAttackModifier(entityId: string, value: number, source: string): void {
    const entity = this.getEntityOrThrow(entityId);
    
    // Ensure combat property exists
    if (!entity.properties.combat) {
      this.initialize(entity);
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
   * @param entityId Entity ID
   * @param value Modifier value
   * @param source Source of the modifier
   */
  addRangedAttackModifier(entityId: string, value: number, source: string): void {
    const entity = this.getEntityOrThrow(entityId);
    
    // Ensure combat property exists
    if (!entity.properties.combat) {
      this.initialize(entity);
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
   * @param entityId Entity ID
   * @param value Modifier value
   * @param source Source of the modifier
   */
  addCMBModifier(entityId: string, value: number, source: string): void {
    const entity = this.getEntityOrThrow(entityId);
    
    // Ensure combat property exists
    if (!entity.properties.combat) {
      this.initialize(entity);
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
   * @param entityId Entity ID
   * @param value Modifier value
   * @param source Source of the modifier
   */
  addCMDModifier(entityId: string, value: number, source: string): void {
    const entity = this.getEntityOrThrow(entityId);
    
    // Ensure combat property exists
    if (!entity.properties.combat) {
      this.initialize(entity);
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
   * @param entityId Entity ID
   * @param value Modifier value
   * @param source Source of the modifier
   * @param options AC modifier options
   */
  addACModifier(
    entityId: string,
    value: number,
    source: string,
    options: {
      type?: string;
      appliesToTouch?: boolean;
      appliesToFlatFooted?: boolean;
    } = {}
  ): void {
    const entity = this.getEntityOrThrow(entityId);
    
    // Ensure combat property exists
    if (!entity.properties.combat) {
      this.initialize(entity);
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
   * @param entityId Entity ID
   * @param save Save type (fortitude, reflex, will)
   * @param value Modifier value
   * @param source Source of the modifier
   */
  addSaveModifier(
    entityId: string,
    save: 'fortitude' | 'reflex' | 'will',
    value: number,
    source: string
  ): void {
    const entity = this.getEntityOrThrow(entityId);
    
    // Ensure combat property exists
    if (!entity.properties.combat) {
      this.initialize(entity);
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
   * @param entityId Entity ID
   * @param save Save type (fortitude, reflex, will)
   * @param value Base save value
   */
  setBaseSave(
    entityId: string,
    save: 'fortitude' | 'reflex' | 'will',
    value: number
  ): void {
    const entity = this.getEntityOrThrow(entityId);
    
    // Ensure combat property exists
    if (!entity.properties.combat) {
      this.initialize(entity);
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
   * Get entity or throw an error if not found
   * @param entityId Entity ID
   * @returns Entity
   */
  private getEntityOrThrow(entityId: string): Entity {
    const entity = this.getEntity(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }
    return entity;
  }
  
  /**
   * Sum modifiers from an array
   * @param modifiers Array of modifiers
   * @returns Sum of modifier values
   */
  private sumModifiers(modifiers: Array<{ value: number }>): number {
    return modifiers.reduce((sum, mod) => sum + mod.value, 0);
  }
}