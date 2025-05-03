import type { Entity } from '../types/EntityTypes';
import type { CombatSubsystem, ACBreakdown, SaveBreakdown, AttackBreakdown } from '../types/SubsystemTypes';
import type { AbilitySubsystem } from '../types/SubsystemTypes';
import type { BonusSubsystem } from '../types/SubsystemTypes';

export class CombatSubsystemImpl implements CombatSubsystem {
  id = 'combat';
  version = '1.0.0';
  
  constructor(
    private abilitySubsystem: AbilitySubsystem,
    private bonusSubsystem: BonusSubsystem
  ) {}
  
  /**
   * Initialize combat data from character
   */
  initialize(entity: Entity): void {
    if (!entity.character) return;
    
    // Calculate and set base attack bonus
    if (entity.character.game_character_class) {
      let baseAttackBonus = 0;
      
      for (const charClass of entity.character.game_character_class) {
        if (!charClass.class) continue;
        
        // Get the class's BAB progression type
        const progression = charClass.class.bab_progression || 'medium';
        const level = charClass.level || 0;
        
        // Calculate BAB based on progression type
        // Pathfinder BAB progressions:
        // - Full: level
        // - Medium: level * 3/4
        // - Low: level * 1/2
        let classBab = 0;
        
        if (progression === 'full') {
          classBab = level;
        } else if (progression === 'medium') {
          classBab = Math.floor(level * 0.75);
        } else if (progression === 'low') {
          classBab = Math.floor(level * 0.5);
        }
        
        baseAttackBonus += classBab;
      }
      
      // Store the calculated BAB
      if (!entity.character.baseAttackBonus) {
        entity.character.baseAttackBonus = 0;
      }
      entity.character.baseAttackBonus = baseAttackBonus;
    }
    
    // Initialize saving throws
    if (!entity.character.savingThrows) {
      entity.character.savingThrows = {
        fortitude: 0,
        reflex: 0,
        will: 0
      };
    }
    
    // Calculate base saves from classes
    if (entity.character.game_character_class) {
      let fortitude = 0;
      let reflex = 0;
      let will = 0;
      
      for (const charClass of entity.character.game_character_class) {
        if (!charClass.class) continue;
        
        const level = charClass.level || 0;
        
        // Calculate saves based on class
        // This is a simplification - in a real implementation, you'd look up the class's save progressions
        const goodSave = 2 + Math.floor(level / 2);
        const badSave = Math.floor(level / 3);
        
        // Determine which saves are good for this class
        // This is usually defined in the class data
        const isFortitudeGood = charClass.class.fortitude_progression === 'good';
        const isReflexGood = charClass.class.reflex_progression === 'good';
        const isWillGood = charClass.class.will_progression === 'good';
        
        fortitude += isFortitudeGood ? goodSave : badSave;
        reflex += isReflexGood ? goodSave : badSave;
        will += isWillGood ? goodSave : badSave;
      }
      
      // Store the calculated saves
      entity.character.savingThrows.fortitude = fortitude;
      entity.character.savingThrows.reflex = reflex;
      entity.character.savingThrows.will = will;
    }
  }
  
  getArmorClass(entity: Entity): number {
    // Base AC is 10
    let ac = 10;
    
    // Add Dex modifier
    ac += this.abilitySubsystem.getAbilityModifier(entity, 'dexterity');
    
    // Add bonuses
    ac += this.bonusSubsystem.calculateTotal(entity, 'armor_class');
    
    return ac;
  }
  
  getTouchAC(entity: Entity): number {
    // Touch AC doesn't include armor, shield, or natural armor
    let ac = 10;
    
    // Add Dex modifier
    ac += this.abilitySubsystem.getAbilityModifier(entity, 'dexterity');
    
    // In a complete implementation, we'd filter out non-touch bonuses
    // For MVP, we'll just calculate a simple touch AC
    ac += this.bonusSubsystem.calculateTotal(entity, 'touch_ac');
    
    return ac;
  }
  
  getFlatFootedAC(entity: Entity): number {
    // Flat-footed doesn't include Dex
    let ac = 10;
    
    // Add bonuses (we'd filter out Dex-based bonuses in a complete implementation)
    ac += this.bonusSubsystem.calculateTotal(entity, 'flat_footed_ac');
    
    return ac;
  }
  
  getAttackBonus(entity: Entity, attackType: string): number {
    let baseAttackBonus = entity.character?.baseAttackBonus || 0;
    
    // Add ability modifier based on attack type
    let abilityMod = 0;
    if (attackType === 'melee') {
      abilityMod = this.abilitySubsystem.getAbilityModifier(entity, 'strength');
    } else if (attackType === 'ranged') {
      abilityMod = this.abilitySubsystem.getAbilityModifier(entity, 'dexterity');
    }
    
    // Add bonuses
    const bonuses = this.bonusSubsystem.calculateTotal(entity, `${attackType}_attack`);
    
    return baseAttackBonus + abilityMod + bonuses;
  }
  
  getSavingThrow(entity: Entity, saveType: string): number {
    // Base save value
    const baseSave = entity.character?.savingThrows?.[saveType] || 0;
    
    // Add ability modifier based on save type
    let abilityMod = 0;
    if (saveType === 'fortitude') {
      abilityMod = this.abilitySubsystem.getAbilityModifier(entity, 'constitution');
    } else if (saveType === 'reflex') {
      abilityMod = this.abilitySubsystem.getAbilityModifier(entity, 'dexterity');
    } else if (saveType === 'will') {
      abilityMod = this.abilitySubsystem.getAbilityModifier(entity, 'wisdom');
    }
    
    // Add bonuses
    const bonuses = this.bonusSubsystem.calculateTotal(entity, `save_${saveType}`);
    
    return baseSave + abilityMod + bonuses;
  }
  
  getCMB(entity: Entity): number {
    const baseAttackBonus = entity.character?.baseAttackBonus || 0;
    const strMod = this.abilitySubsystem.getAbilityModifier(entity, 'strength');
    
    // Size modifier would be included here in a complete implementation
    
    // Add bonuses
    const bonuses = this.bonusSubsystem.calculateTotal(entity, 'cmb');
    
    return baseAttackBonus + strMod + bonuses;
  }
  
  getCMD(entity: Entity): number {
    const baseAttackBonus = entity.character?.baseAttackBonus || 0;
    const strMod = this.abilitySubsystem.getAbilityModifier(entity, 'strength');
    const dexMod = this.abilitySubsystem.getAbilityModifier(entity, 'dexterity');
    
    // Size modifier would be included here
    
    // Add bonuses
    const bonuses = this.bonusSubsystem.calculateTotal(entity, 'cmd');
    
    return 10 + baseAttackBonus + strMod + dexMod + bonuses;
  }
  
  getInitiative(entity: Entity): number {
    const dexMod = this.abilitySubsystem.getAbilityModifier(entity, 'dexterity');
    
    // Add bonuses
    const bonuses = this.bonusSubsystem.calculateTotal(entity, 'initiative');
    
    return dexMod + bonuses;
  }

  /**
   * Get detailed AC breakdown for character sheet display
   */
  getACBreakdown(entity: Entity): ACBreakdown {
    // Get the basic values
    const total = this.getArmorClass(entity);
    const touch = this.getTouchAC(entity);
    const flatFooted = this.getFlatFootedAC(entity);
    
    // Get ability modifiers and bonuses
    const dexModifier = this.abilitySubsystem.getAbilityModifier(entity, 'dexterity');
    
    // For the basic implementation, we'll simplify some of these
    const armorBonus = this.bonusSubsystem.calculateTotal(entity, 'armor_bonus') || 0;
    const shieldBonus = this.bonusSubsystem.calculateTotal(entity, 'shield_bonus') || 0;
    const naturalArmor = this.bonusSubsystem.calculateTotal(entity, 'natural_armor') || 0;
    const deflectionBonus = this.bonusSubsystem.calculateTotal(entity, 'deflection_bonus') || 0;
    const dodgeBonus = this.bonusSubsystem.calculateTotal(entity, 'dodge_bonus') || 0;
    
    // Size modifier (simplified for now)
    const sizeModifier = 0;
    
    // Get all bonus components
    const bonusComponents = this.bonusSubsystem.getComponents(entity, 'armor_class');
    
    return {
      base: 10,
      armorBonus,
      shieldBonus,
      dexModifier,
      sizeModifier,
      naturalArmor,
      deflectionBonus,
      dodgeBonus,
      otherBonuses: {
        total: total - 10 - dexModifier - armorBonus - shieldBonus - naturalArmor - deflectionBonus - dodgeBonus,
        base: 0,
        components: bonusComponents
      },
      total,
      touch,
      flatFooted
    };
  }

  /**
   * Get detailed save breakdown for character sheet display
   */
  getSaveBreakdown(entity: Entity, saveType: string): SaveBreakdown {
    // Get the total save value
    const total = this.getSavingThrow(entity, saveType);
    
    // Get ability details based on save type
    let abilityModifier = 0;
    let abilityUsed = '';
    
    if (saveType === 'fortitude') {
      abilityModifier = this.abilitySubsystem.getAbilityModifier(entity, 'constitution');
      abilityUsed = 'constitution';
    } else if (saveType === 'reflex') {
      abilityModifier = this.abilitySubsystem.getAbilityModifier(entity, 'dexterity');
      abilityUsed = 'dexterity';
    } else if (saveType === 'will') {
      abilityModifier = this.abilitySubsystem.getAbilityModifier(entity, 'wisdom');
      abilityUsed = 'wisdom';
    }
    
    // Base save value
    const baseSave = entity.character?.savingThrows?.[saveType] || 0;
    
    // Get bonus components
    const bonusComponents = this.bonusSubsystem.getComponents(entity, `save_${saveType}`);
    
    return {
      saveType,
      baseSave,
      abilityModifier,
      abilityUsed,
      otherBonuses: {
        total: total - baseSave - abilityModifier,
        base: 0,
        components: bonusComponents
      },
      total
    };
  }

  /**
   * Get detailed attack breakdown for character sheet display
   */
  getAttackBreakdown(entity: Entity, attackType: string): AttackBreakdown {
    // Get the total attack bonus
    const total = this.getAttackBonus(entity, attackType);
    
    // Get base attack bonus
    const baseAttackBonus = entity.character?.baseAttackBonus || 0;
    
    // Get ability details
    let abilityModifier = 0;
    let abilityUsed = '';
    
    if (attackType === 'melee') {
      abilityModifier = this.abilitySubsystem.getAbilityModifier(entity, 'strength');
      abilityUsed = 'strength';
    } else if (attackType === 'ranged') {
      abilityModifier = this.abilitySubsystem.getAbilityModifier(entity, 'dexterity');
      abilityUsed = 'dexterity';
    }
    
    // Size modifier (simplified for now)
    const sizeModifier = 0;
    
    // Get bonus components
    const bonusComponents = this.bonusSubsystem.getComponents(entity, `${attackType}_attack`);
    
    return {
      baseAttackBonus,
      abilityModifier,
      abilityUsed,
      sizeModifier,
      otherBonuses: {
        total: total - baseAttackBonus - abilityModifier - sizeModifier,
        base: 0,
        components: bonusComponents
      },
      total
    };
  }
}
