import type { Entity } from '../types/EntityTypes';
import type { CombatSubsystem } from '../types/SubsystemTypes';
import type { AbilitySubsystem } from '../types/SubsystemTypes';
import type { BonusSubsystem } from '../types/SubsystemTypes';

export class CombatSubsystemImpl implements CombatSubsystem {
  id = 'combat';
  version = '1.0.0';
  
  constructor(
    private abilitySubsystem: AbilitySubsystem,
    private bonusSubsystem: BonusSubsystem
  ) {}
  
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
}
