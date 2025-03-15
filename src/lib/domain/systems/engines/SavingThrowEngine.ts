/**
 * SavingThrowEngine.ts
 * 
 * Handles all saving throw calculations according to core game rules.
 * This engine works universally for ANY entity in the game, not just characters.
 * This is a SYSTEM because:
 * - It implements CORE GAME RULES
 * - It works for ANY ENTITY (character, monster, NPC)
 * - It is a REUSABLE CALCULATION ENGINE
 */

import type { Entity, BonusEntry, ValueWithBreakdown } from '$lib/domain/systems/SystemTypes';
import type { FeatureEffectSystem } from '$lib/domain/systems/FeatureEffectSystem';
import { BonusEngine } from '$lib/domain/systems/engines/BonusEngine';
import { DataAccessLayer } from '$lib/domain/systems/DataAccessLayer';
import type { CompleteCharacter } from '$lib/domain/character/CharacterTypes';

/**
 * Core saving throw engine that handles all save-related calculations
 */
export class SavingThrowEngine {
  private bonusEngine: BonusEngine;
  
  constructor(
    private featureEffectSystem?: FeatureEffectSystem,
    private dataAccessLayer?: DataAccessLayer
  ) {
    this.bonusEngine = new BonusEngine();
    if (featureEffectSystem) {
      this.bonusEngine.setFeatureEffectSystem(featureEffectSystem);
    }
  }

  /**
   * Calculate save progression value for a single class level
   */
  calculateSaveProgressionValue(isGood: boolean, level: number): number {
    if (isGood) {
      return 2 + Math.floor(level / 2);
    } else {
      return Math.floor(level / 3);
    }
  }

  /**
   * Calculate the base saving throw bonus for any entity
   * This is a CORE GAME RULE implementation - universal to all entities
   */
  calculateBaseSave(
    entity: Entity,
    type: 'fortitude' | 'reflex' | 'will'
  ): number {
    // For a real entity (character or monster), we'd calculate based on:
    // - Character class levels and save progressions
    // - Monster CR/HD and save progressions
    
    // This is a simplified placeholder implementation
    return 0;
  }

  /**
   * Build a saving throw with all applicable bonuses
   */
  buildSave(
    label: string,
    baseSave: number,
    abilityModifier: number,
    abilityName: string,
    bonuses: BonusEntry[] = []
  ): ValueWithBreakdown {
    // Create base bonuses
    const saveBonuses: BonusEntry[] = [
      { source: 'Base Save', value: baseSave, type: 'base' },
      { source: abilityName, value: abilityModifier, type: 'ability' }
    ];
    
    // Add feature effect bonuses if available
    if (this.featureEffectSystem) {
      // Get save-specific bonuses
      const saveEffectBonuses = this.bonusEngine.getFeatureEffectBonuses(
        `save_${label.toLowerCase()}`,
        'untyped'
      );
      
      // Get resistance bonuses that apply to all saves
      const resistanceEffectBonuses = this.bonusEngine.getFeatureEffectBonuses(
        'save_all',
        'resistance'
      );
      
      saveBonuses.push(...saveEffectBonuses, ...resistanceEffectBonuses);
    }
    
    // Add provided bonuses
    saveBonuses.push(...bonuses);
    
    // Apply stacking rules and return
    return this.bonusEngine.applyBonusStackingRules(label, saveBonuses);
  }

  /**
   * Calculate a saving throw with full breakdown of bonuses
   */
  calculateSavingThrow(
    entity: Entity,
    saveType: 'fortitude' | 'reflex' | 'will',
    abilityScoreValue: number,
    baseLabel: string = saveType.charAt(0).toUpperCase() + saveType.slice(1)
  ): ValueWithBreakdown {
    // Get base save from entity
    const baseSave = this.calculateBaseSave(entity, saveType);
    
    // Get ability modifier
    const abilityMod = Math.floor((abilityScoreValue - 10) / 2);
    
    // Get associated ability name
    let abilityName: string;
    switch (saveType) {
      case 'fortitude': abilityName = 'Constitution'; break;
      case 'reflex': abilityName = 'Dexterity'; break;
      case 'will': abilityName = 'Wisdom'; break;
      default: abilityName = '';
    }
    
    // Build the save
    return this.buildSave(baseLabel, baseSave, abilityMod, abilityName);
  }
  
  /**
   * Calculate saving throw DC for an ability, spell, or effect
   * Core game rule: DC = 10 + ability modifier + spell level / effect bonus
   */
  calculateSaveDC(
    baseValue: number, 
    spellLevel: number = 0,
    abilityMod: number = 0,
    additionalBonuses: BonusEntry[] = []
  ): number {
    // Start with base DC of 10
    let dc = 10;
    
    // Add base value (class DC, etc.)
    dc += baseValue;
    
    // Add spell level if applicable
    dc += spellLevel;
    
    // Add ability modifier
    dc += abilityMod;
    
    // Add feature effect bonuses if available
    if (this.featureEffectSystem) {
      const effectBonuses = this.bonusEngine.getFeatureEffectBonuses(
        'save_dc',
        'untyped'
      );
      
      // We only care about the total here, not the breakdown
      if (effectBonuses.length > 0) {
        const result = this.bonusEngine.calculateStackedBonuses(effectBonuses);
        dc += result.total;
      }
    } else if (additionalBonuses.length > 0) {
      // If no feature effect system but we have additional bonuses
      const bonusResult = this.bonusEngine.calculateStackedBonuses(additionalBonuses);
      dc += bonusResult.total;
    }
    
    return dc;
  }
  
  /**
   * Determine if a save attempt is successful
   */
  isSaveSuccessful(
    saveModifier: number,
    dc: number,
    rollValue: number = 0 // If 0, assume d20 roll pending
  ): boolean {
    if (rollValue === 0) {
      return false; // Can't determine yet
    }
    
    // Natural 1 always fails, natural 20 always succeeds
    if (rollValue === 1) return false;
    if (rollValue === 20) return true;
    
    // Otherwise, roll + modifier must meet or exceed DC
    return rollValue + saveModifier >= dc;
  }

  /**
   * Calculate base save bonuses from character's classes
   * @param character The character to calculate saves for
   * @returns Object with base save values for fortitude, reflex, and will
   */
  calculateBaseSaves(character: CompleteCharacter): { 
    fortitude: number, 
    reflex: number, 
    will: number 
  } {
    // Default to 0 for all saves
    const result = { fortitude: 0, reflex: 0, will: 0 };
    
    // Return early if no classes
    if (!character.game_character_class || !character.game_character_class.length) {
      return result;
    }
    
    // For each class, add save bonuses based on save progression type
    for (const charClass of character.game_character_class) {
      if (!charClass.class || !charClass.level) continue;
      
      const level = charClass.level;
      
      // Check progression for each save
      for (const saveType of ['fortitude', 'reflex', 'will'] as const) {
        const progression = charClass.class[saveType];
        if (!progression) continue;
        
        // Calculate based on progression type
        let saveBonus = 0;
        
        if (progression === 'good') {
          // Good save: 2 + level/2
          saveBonus = 2 + Math.floor(level / 2);
        } else if (progression === 'poor') {
          // Poor save: level/3
          saveBonus = Math.floor(level / 3);
        }
        
        // Add to the result
        result[saveType] += saveBonus;
      }
    }
    
    return result;
  }
} 