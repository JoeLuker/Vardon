/**
 * AbilityEngine.ts
 *
 * Core system for ability score calculations that apply universally.
 * This belongs in SYSTEMS because:
 * - It implements CORE GAME RULES for ability scores
 * - It works for ANY ENTITY (character, monster, NPC)
 * - It is a REUSABLE CALCULATION ENGINE
 */

import type { Entity } from '$lib/domain/systems/SystemTypes';
import type { ValueWithBreakdown } from '$lib/domain/character/CharacterTypes';
import type { BonusEntry } from '$lib/domain/systems/SystemTypes';
import type { FeatureEffectSystem } from '$lib/domain/systems/FeatureEffectSystem';
import { DataAccessLayer } from '$lib/domain/systems/DataAccessLayer';
import { BonusEngine } from '$lib/domain/systems/engines/BonusEngine';

export class AbilityEngine {
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
   * Calculate ability modifier from ability score
   * Standard formula: (score - 10) / 2, rounded down
   */
  calculateAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Apply ability score racial modifiers
   */
  applyRacialModifiers(
    baseScore: number, 
    racialModifier: number
  ): number {
    return baseScore + racialModifier;
  }

  /**
   * Apply bonus stacking rules to ability score bonuses
   */
  applyAbilityBonusStacking(
    abilityName: string,
    baseScore: number,
    bonuses: BonusEntry[]
  ): ValueWithBreakdown {
    console.log(`[ABILITY DEBUG] applyAbilityBonusStacking for ${abilityName}, base: ${baseScore}, bonuses:`, bonuses);
    
    // Ensure all bonuses have required fields with defaults for optional fields
    const normalizedBonuses = bonuses.map(bonus => ({
      source: bonus.source,
      value: bonus.value,
      type: bonus.type || 'untyped',
      condition: bonus.condition,
      priority: bonus.priority
    }));
    
    // Group bonuses by type
    const typedBonuses: Record<string, { source: string; value: number }> = {};
    const untypedBonuses: Array<{ source: string; value: number }> = [];
    const penalties: Array<{ source: string; value: number }> = [];
    
    // Process bonuses according to stacking rules
    for (const bonus of normalizedBonuses) {
      // Skip bonuses with value of 0
      if (bonus.value === 0) continue;
      
      // Treat negative values as penalties (they always stack)
      if (bonus.value < 0) {
        penalties.push({ source: bonus.source, value: bonus.value });
        continue;
      }
      
      // Handle typed bonuses (take highest of each type)
      if (bonus.type && bonus.type !== 'untyped') {
        if (!typedBonuses[bonus.type] || typedBonuses[bonus.type].value < bonus.value) {
          typedBonuses[bonus.type] = { source: bonus.source, value: bonus.value };
        }
      } else {
        // Untyped bonuses always stack
        untypedBonuses.push({ source: bonus.source, value: bonus.value });
      }
    }
    
    // Calculate total
    let total = baseScore;
    
    // Build modifiers list - include base score first
    const modifiers: Array<{ source: string; value: number }> = [
      { source: 'Base Score', value: baseScore }
    ];
    
    // Add typed bonuses
    for (const type in typedBonuses) {
      total += typedBonuses[type].value;
      modifiers.push(typedBonuses[type]);
    }
    
    // Add untyped bonuses
    for (const bonus of untypedBonuses) {
      total += bonus.value;
      modifiers.push(bonus);
    }
    
    // Add penalties
    for (const penalty of penalties) {
      total += penalty.value;
      modifiers.push(penalty);
    }
    
    // Get proper label based on ability name
    let label = abilityName;
    switch (abilityName.toLowerCase()) {
      case 'strength': label = 'Strength'; break;
      case 'dexterity': label = 'Dexterity'; break;
      case 'constitution': label = 'Constitution'; break;
      case 'intelligence': label = 'Intelligence'; break;
      case 'wisdom': label = 'Wisdom'; break;
      case 'charisma': label = 'Charisma'; break;
    }
    
    // Return result with breakdown
    return {
      label,
      total,
      modifiers
    };
  }

  /**
   * Calculate a complete ability score with all bonuses
   */
  calculateAbilityScore(
    entity: Entity,
    abilityName: string,
    baseScore: number,
    bonuses: BonusEntry[] = []
  ): ValueWithBreakdown {
    console.log(`[ABILITY DEBUG] calculateAbilityScore called for ${abilityName} with base score ${baseScore}`);
    
    // Check if the feature effect system is available to get ABP bonuses
    if (this.featureEffectSystem) {
      // Get bonuses for this ability from feature effects including ABP
      const featureEffectBonuses = this.featureEffectSystem.getEffectsForTarget(`ability.${abilityName}`);
      console.log(`[ABILITY DEBUG] Feature effects for ${abilityName}:`, featureEffectBonuses);
      
      // Extract numeric effects as bonus entries
      if (featureEffectBonuses.length > 0) {
        const abpBonuses = this.bonusEngine.extractNumericEffects(
          featureEffectBonuses.map(effect => ({ 
            source: effect.source, 
            value: effect.value,
            type: effect.type
          }))
        );
        console.log(`[ABILITY DEBUG] Converted bonuses for ${abilityName}:`, abpBonuses);
        
        // Combine existing bonuses with ABP bonuses
        bonuses = [...bonuses, ...abpBonuses];
      }
    } else {
      console.log(`[ABILITY DEBUG] No feature effect system available for ABP bonuses`);
    }
    
    // Apply stacking rules to get the final ability score
    return this.applyAbilityBonusStacking(abilityName, baseScore, bonuses);
  }

  /**
   * Calculate all six ability scores for an entity
   */
  calculateAllAbilityScores(
    entity: Entity,
    baseScores: Record<string, number>,
    bonuses: Record<string, BonusEntry[]> = {}
  ): Record<string, ValueWithBreakdown> {
    const abilityNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const result: Record<string, ValueWithBreakdown> = {};
    
    abilityNames.forEach(ability => {
      const baseScore = baseScores[ability] || 10;
      const abilityBonuses = bonuses[ability] || [];
      
      result[ability] = this.calculateAbilityScore(
        entity,
        ability.charAt(0).toUpperCase() + ability.slice(1),
        baseScore,
        abilityBonuses
      );
    });
    
    return result;
  }
  
  /**
   * Get ability modifiers from a set of ability scores
   */
  getAbilityModifiers(
    abilityScores: Record<string, ValueWithBreakdown>
  ): Record<string, number> {
    const result: Record<string, number> = {};
    
    Object.entries(abilityScores).forEach(([ability, data]) => {
      result[ability + 'Mod'] = this.calculateAbilityModifier(data.total);
    });
    
    return result;
  }
} 