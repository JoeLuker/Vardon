import type { Entity } from '../types/EntityTypes';
import type { SpellcastingSubsystem } from '../types/SubsystemTypes';
import type { GameRulesAPI } from '$lib/db/gameRules.api';

/**
 * Implementation of the Spellcasting Subsystem
 * Manages spell slots, spell preparation, and casting for characters
 */
export class SpellcastingSubsystemImpl implements SpellcastingSubsystem {
  id = 'spellcasting';
  version = '1.0.0';
  
  private gameRulesAPI?: GameRulesAPI;
  
  constructor(gameRulesAPI?: GameRulesAPI) {
    this.gameRulesAPI = gameRulesAPI;
  }
  
  /**
   * Initialize spellcasting data for an entity
   */
  initialize(entity: Entity): void {
    if (!entity.character) return;
    
    // Initialize spell slots structure if it doesn't exist
    if (!entity.character.spellSlots) {
      entity.character.spellSlots = {};
    }
    
    // Initialize spell preparation structure if it doesn't exist
    if (!entity.character.preparedSpells) {
      entity.character.preparedSpells = {};
    }
    
    // Load spellcasting class features
    this.loadSpellcastingClassFeatures(entity);
    
    // Load spell slots
    this.loadSpellSlots(entity);
    
    // Load prepared/known spells
    this.loadPreparedSpells(entity);
  }
  
  /**
   * Load spellcasting class features from character data
   */
  private loadSpellcastingClassFeatures(entity: Entity): void {
    if (!entity.character?.game_character_class) return;
    
    const spellcastingClasses: {
      classId: number;
      className: string;
      spellcasting: {
        type: string;
        ability: string;
        isSpontaneous: boolean;
        progression: string;
        maxSpellLevel: number;
      }
    }[] = [];
    
    // Process each class to find spellcasting features
    for (const charClass of entity.character.game_character_class) {
      if (!charClass.class?.class_feature) continue;
      
      for (const feature of charClass.class.class_feature) {
        if (!feature.spellcasting_class_feature?.length) continue;
        
        const spellcasting = feature.spellcasting_class_feature[0];
        if (!spellcasting.spellcasting_type || !spellcasting.spell_progression_type || !spellcasting.ability) {
          continue;
        }
        
        spellcastingClasses.push({
          classId: charClass.class.id,
          className: charClass.class.name,
          spellcasting: {
            type: spellcasting.spellcasting_type.name,
            ability: spellcasting.ability.name,
            isSpontaneous: spellcasting.spell_progression_type.is_spontaneous,
            progression: spellcasting.spell_progression_type.name,
            maxSpellLevel: spellcasting.spell_progression_type.max_spell_level
          }
        });
      }
    }
    
    // Store the spellcasting classes in the entity
    entity.character.spellcastingClasses = spellcastingClasses;
  }
  
  /**
   * Load spell slots from character data
   */
  private loadSpellSlots(entity: Entity): void {
    if (!entity.character?.game_character_spell_slot) return;
    
    // Group spell slots by class and level
    for (const slot of entity.character.game_character_spell_slot) {
      const classId = slot.class_id;
      const spellLevel = slot.spell_level;
      
      if (!classId || spellLevel === undefined) continue;
      
      // Initialize class in spell slots structure if needed
      if (!entity.character.spellSlots[classId]) {
        entity.character.spellSlots[classId] = {};
      }
      
      // Initialize spell level in class if needed
      if (!entity.character.spellSlots[classId][spellLevel]) {
        entity.character.spellSlots[classId][spellLevel] = {
          total: 0,
          used: 0,
          bonus: 0
        };
      }
      
      // Increment total slots
      entity.character.spellSlots[classId][spellLevel].total += 1;
      
      // Mark slot as used if needed
      if (slot.is_used) {
        entity.character.spellSlots[classId][spellLevel].used += 1;
      }
    }
  }
  
  /**
   * Load prepared spells from character data
   */
  private loadPreparedSpells(entity: Entity): void {
    if (!entity.character?.game_character_spell) return;
    
    // Group prepared spells by class, level, and spell
    for (const charSpell of entity.character.game_character_spell) {
      const spellId = charSpell.spell_id;
      const spellLevel = charSpell.level;
      
      if (!spellId || spellLevel === undefined) continue;
      
      // Find which class this spell belongs to
      const classId = this.findSpellClass(entity, spellId, spellLevel);
      
      if (!classId) continue;
      
      // Initialize class in prepared spells structure if needed
      if (!entity.character.preparedSpells[classId]) {
        entity.character.preparedSpells[classId] = {};
      }
      
      // Initialize spell level in class if needed
      if (!entity.character.preparedSpells[classId][spellLevel]) {
        entity.character.preparedSpells[classId][spellLevel] = [];
      }
      
      // Add the spell to the prepared spells list
      entity.character.preparedSpells[classId][spellLevel].push({
        spellId,
        name: charSpell.spell?.name || 'Unknown Spell',
        prepared: charSpell.prepared || 0,
        used: charSpell.used || 0
      });
    }
  }
  
  /**
   * Find which class a spell belongs to
   */
  private findSpellClass(entity: Entity, spellId: number, level: number): number | null {
    // This is a simplified implementation
    // In a real implementation, you'd check spell lists to determine which class the spell belongs to
    
    if (!entity.character?.spellcastingClasses?.length) return null;
    
    // For now, just return the first spellcasting class that can cast spells of this level
    for (const spellcastingClass of entity.character.spellcastingClasses) {
      if (level <= spellcastingClass.spellcasting.maxSpellLevel) {
        return spellcastingClass.classId;
      }
    }
    
    return null;
  }
  
  /**
   * Get spell slots for a class and level
   */
  getSpellSlots(entity: Entity, classId: number, spellLevel: number): { total: number; used: number; remaining: number } {
    if (!entity.character?.spellSlots?.[classId]?.[spellLevel]) {
      return { total: 0, used: 0, remaining: 0 };
    }
    
    const slots = entity.character.spellSlots[classId][spellLevel];
    return {
      total: slots.total + (slots.bonus || 0),
      used: slots.used || 0,
      remaining: (slots.total + (slots.bonus || 0)) - (slots.used || 0)
    };
  }
  
  /**
   * Get all spell slots for an entity
   */
  getAllSpellSlots(entity: Entity): Record<number, Record<number, { total: number; used: number; remaining: number }>> {
    const result: Record<number, Record<number, { total: number; used: number; remaining: number }>> = {};
    
    if (!entity.character?.spellSlots) return result;
    
    // Process each class
    for (const classId in entity.character.spellSlots) {
      result[Number(classId)] = {};
      
      // Process each spell level
      for (const level in entity.character.spellSlots[classId]) {
        const slots = entity.character.spellSlots[classId][level];
        result[Number(classId)][Number(level)] = {
          total: slots.total + (slots.bonus || 0),
          used: slots.used || 0,
          remaining: (slots.total + (slots.bonus || 0)) - (slots.used || 0)
        };
      }
    }
    
    return result;
  }
  
  /**
   * Get prepared spells for a class and level
   */
  getPreparedSpells(entity: Entity, classId: number, spellLevel: number): any[] {
    if (!entity.character?.preparedSpells?.[classId]?.[spellLevel]) {
      return [];
    }
    
    return entity.character.preparedSpells[classId][spellLevel];
  }
  
  /**
   * Get all prepared spells for an entity
   */
  getAllPreparedSpells(entity: Entity): Record<number, Record<number, any[]>> {
    const result: Record<number, Record<number, any[]>> = {};
    
    if (!entity.character?.preparedSpells) return result;
    
    // Process each class
    for (const classId in entity.character.preparedSpells) {
      result[Number(classId)] = {};
      
      // Process each spell level
      for (const level in entity.character.preparedSpells[classId]) {
        result[Number(classId)][Number(level)] = entity.character.preparedSpells[classId][level];
      }
    }
    
    return result;
  }
  
  /**
   * Prepare a spell
   */
  prepareSpell(entity: Entity, classId: number, spellId: number, spellLevel: number): boolean {
    if (!entity.character?.preparedSpells) return false;
    
    // Check if this class can prepare spells
    const spellcastingClass = entity.character.spellcastingClasses?.find(c => c.classId === classId);
    if (!spellcastingClass || spellcastingClass.spellcasting.isSpontaneous) {
      // Spontaneous casters don't prepare spells
      return false;
    }
    
    // Initialize structures if needed
    if (!entity.character.preparedSpells[classId]) {
      entity.character.preparedSpells[classId] = {};
    }
    
    if (!entity.character.preparedSpells[classId][spellLevel]) {
      entity.character.preparedSpells[classId][spellLevel] = [];
    }
    
    // Check if the spell is already prepared
    const preparedSpell = entity.character.preparedSpells[classId][spellLevel].find(s => s.spellId === spellId);
    
    if (preparedSpell) {
      // Increment the prepared count
      preparedSpell.prepared += 1;
    } else {
      // Add the spell to the prepared list
      entity.character.preparedSpells[classId][spellLevel].push({
        spellId,
        name: this.getSpellName(spellId) || 'Unknown Spell',
        prepared: 1,
        used: 0
      });
    }
    
    entity.metadata.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Unprepare a spell
   */
  unprepareSpell(entity: Entity, classId: number, spellId: number, spellLevel: number): boolean {
    if (!entity.character?.preparedSpells?.[classId]?.[spellLevel]) return false;
    
    // Find the spell in the prepared list
    const spellIndex = entity.character.preparedSpells[classId][spellLevel].findIndex(s => s.spellId === spellId);
    
    if (spellIndex === -1) return false;
    
    const spell = entity.character.preparedSpells[classId][spellLevel][spellIndex];
    
    if (spell.prepared > 1) {
      // Decrement the prepared count
      spell.prepared -= 1;
    } else {
      // Remove the spell from the prepared list
      entity.character.preparedSpells[classId][spellLevel].splice(spellIndex, 1);
    }
    
    entity.metadata.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Cast a spell
   */
  castSpell(entity: Entity, classId: number, spellId: number, spellLevel: number): boolean {
    if (!entity.character?.preparedSpells?.[classId]?.[spellLevel] || 
        !entity.character?.spellSlots?.[classId]?.[spellLevel]) {
      return false;
    }
    
    // Check if we have remaining spell slots
    const slots = this.getSpellSlots(entity, classId, spellLevel);
    if (slots.remaining <= 0) {
      return false;
    }
    
    // For prepared casters, check if the spell is prepared
    const spellcastingClass = entity.character.spellcastingClasses?.find(c => c.classId === classId);
    if (!spellcastingClass) return false;
    
    if (!spellcastingClass.spellcasting.isSpontaneous) {
      // For prepared casters, find the spell in the prepared list
      const preparedSpell = entity.character.preparedSpells[classId][spellLevel].find(s => s.spellId === spellId);
      
      if (!preparedSpell || preparedSpell.prepared <= preparedSpell.used) {
        return false;
      }
      
      // Increment the used count
      preparedSpell.used += 1;
    }
    
    // Use a spell slot
    entity.character.spellSlots[classId][spellLevel].used += 1;
    
    entity.metadata.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Reset spell slots (e.g. after resting)
   */
  resetSpellSlots(entity: Entity, classId?: number): boolean {
    if (!entity.character?.spellSlots) return false;
    
    if (classId) {
      // Reset slots for just one class
      if (!entity.character.spellSlots[classId]) return false;
      
      for (const level in entity.character.spellSlots[classId]) {
        entity.character.spellSlots[classId][level].used = 0;
      }
    } else {
      // Reset slots for all classes
      for (const classId in entity.character.spellSlots) {
        for (const level in entity.character.spellSlots[classId]) {
          entity.character.spellSlots[classId][level].used = 0;
        }
      }
    }
    
    entity.metadata.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Reset prepared spells (e.g. after resting)
   */
  resetPreparedSpells(entity: Entity, classId?: number): boolean {
    if (!entity.character?.preparedSpells) return false;
    
    if (classId) {
      // Reset prepared spells for just one class
      if (!entity.character.preparedSpells[classId]) return false;
      
      for (const level in entity.character.preparedSpells[classId]) {
        for (const spell of entity.character.preparedSpells[classId][level]) {
          spell.used = 0;
        }
      }
    } else {
      // Reset prepared spells for all classes
      for (const classId in entity.character.preparedSpells) {
        for (const level in entity.character.preparedSpells[classId]) {
          for (const spell of entity.character.preparedSpells[classId][level]) {
            spell.used = 0;
          }
        }
      }
    }
    
    entity.metadata.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Add a bonus spell slot
   */
  addBonusSpellSlot(entity: Entity, classId: number, spellLevel: number, count: number = 1): boolean {
    if (!entity.character?.spellSlots) {
      entity.character = { spellSlots: {} };
    }
    
    // Initialize class in spell slots structure if needed
    if (!entity.character.spellSlots[classId]) {
      entity.character.spellSlots[classId] = {};
    }
    
    // Initialize spell level in class if needed
    if (!entity.character.spellSlots[classId][spellLevel]) {
      entity.character.spellSlots[classId][spellLevel] = {
        total: 0,
        used: 0,
        bonus: 0
      };
    }
    
    // Add bonus slots
    entity.character.spellSlots[classId][spellLevel].bonus += count;
    
    entity.metadata.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Helper method to get a spell name
   */
  private getSpellName(spellId: number): string | undefined {
    // In a real implementation, you'd look up the spell name from the database
    // For now, this is a placeholder
    return `Spell ${spellId}`;
  }
}