import type { Entity } from '../types/EntityTypes';
import type { BonusSubsystem, BonusBreakdown } from '../types/SubsystemTypes';

export class BonusSubsystemImpl implements BonusSubsystem {
  id = 'bonus';
  version = '1.0.0';
  
  // Bonuses that don't stack with themselves
  private readonly TYPED_BONUSES = [
    'armor', 'shield', 'enhancement', 'deflection', 'natural',
    'dodge', 'circumstance', 'morale', 'resistance', 'insight', 'sacred', 'profane'
  ];
  
  /**
   * ABP bonus types that have special handling
   * These are considered high-priority bonuses that should be applied last
   * to ensure they take precedence over normal equipment bonuses
   */
  private readonly ABP_BONUS_TYPES = [
    'abp_armor', 'abp_shield', 'abp_weapon', 'abp_resistance', 'abp_deflection', 
    'abp_natural', 'abp_enhancement'
  ];
  
  /**
   * Initialize bonus subsystem for entity
   */
  initialize(entity: Entity): void {
    if (!entity.character) return;
    
    // Ensure bonuses structure exists
    if (!entity.character.bonuses) {
      entity.character.bonuses = {};
    }
    
    // Process ABP bonuses if present
    // The actual application of ABP bonuses is now handled in DatabaseFeatureInitializer.applyABPChoices()
    // This is just an extra initialization hook in case we need specific ABP handling
    
    // Process ancestry trait bonuses
    if (entity.character.game_character_ancestry_trait) {
      for (const charTrait of entity.character.game_character_ancestry_trait) {
        if (!charTrait.ancestry_trait?.ancestry_trait_benefit) continue;
        
        for (const benefit of charTrait.ancestry_trait.ancestry_trait_benefit) {
          if (!benefit.ancestry_trait_benefit_bonus) continue;
          
          for (const bonus of benefit.ancestry_trait_benefit_bonus) {
            if (!bonus.target_specifier || !bonus.bonus_type) continue;
            
            this.addBonus(
              entity,
              bonus.target_specifier.name || '',
              bonus.value || 0,
              bonus.bonus_type.name || 'untyped',
              charTrait.ancestry_trait.name || 'Ancestry Trait'
            );
          }
        }
      }
    }
    
    // Process class feature bonuses in a similar way
    // This is simplified for brevity
  }
  
  addBonus(entity: Entity, target: string, value: number, type = 'untyped', source = 'unknown'): void {
    if (!entity.character) entity.character = {};
    if (!entity.character.bonuses) entity.character.bonuses = {};
    if (!entity.character.bonuses[target]) entity.character.bonuses[target] = [];
    
    entity.character.bonuses[target].push({
      value,
      type,
      source
    });
    
    entity.metadata.updatedAt = Date.now();
  }
  
  removeBonus(entity: Entity, target: string, source: string): void {
    if (!entity.character?.bonuses?.[target]) return;
    
    entity.character.bonuses[target] = entity.character.bonuses[target]
      .filter((bonus: any) => bonus.source !== source);
      
    entity.metadata.updatedAt = Date.now();
  }
  
  calculateTotal(entity: Entity, target: string): number {
    const breakdown = this.getBreakdown(entity, target);
    return breakdown.total;
  }
  
  getBreakdown(entity: Entity, target: string): BonusBreakdown {
    const bonuses = entity.character?.bonuses?.[target] || [];
    const base = 0; // In a real implementation, this would come from base value logic
    
    // Group bonuses by type
    const byType: Record<string, number[]> = {};
    
    for (const bonus of bonuses) {
      if (!byType[bonus.type]) byType[bonus.type] = [];
      byType[bonus.type].push(bonus.value);
    }
    
    // Calculate total by type, applying stacking rules
    let total = base;
    const components: Array<{value: number, type: string, source: string}> = [];
    
    // First process normal typed bonuses (highest of each type)
    for (const type of this.TYPED_BONUSES) {
      // Skip ABP bonus types - they're processed separately
      if (this.ABP_BONUS_TYPES.includes(type)) continue;
      
      if (!byType[type] || byType[type].length === 0) continue;
      
      // Get highest value of this type
      const values = byType[type];
      const max = Math.max(...values);
      
      // Find the source of the max value
      const source = bonuses.find(b => b.type === type && b.value === max)?.source || 'unknown';
      
      if (max > 0) { // Only add positive bonuses
        total += max;
        components.push({ value: max, type, source });
      }
    }
    
    // Process ABP bonus types separately (they take precedence over normal bonuses)
    for (const abpType of this.ABP_BONUS_TYPES) {
      if (!byType[abpType] || byType[abpType].length === 0) continue;
      
      // Get highest value of this ABP type
      const values = byType[abpType];
      const max = Math.max(...values);
      
      // Find the source of the max value
      const source = bonuses.find(b => b.type === abpType && b.value === max)?.source || 'unknown';
      
      if (max > 0) { // Only add positive bonuses
        total += max;
        components.push({ value: max, type: abpType, source });
        
        // Remove equivalent non-ABP bonus types if they exist
        // For example, abp_armor trumps armor
        const normalType = abpType.replace('abp_', '');
        if (this.TYPED_BONUSES.includes(normalType) && components.some(c => c.type === normalType)) {
          // Find and remove the normal type bonus
          const normalIndex = components.findIndex(c => c.type === normalType);
          if (normalIndex >= 0) {
            // Subtract the value from the total
            total -= components[normalIndex].value;
            // Remove the component
            components.splice(normalIndex, 1);
            console.log(`ABP bonus type ${abpType} replaced normal bonus type ${normalType}`);
          }
        }
      }
    }
    
    // Then add all untyped bonuses (which stack)
    const untyped = byType['untyped'] || [];
    for (let i = 0; i < untyped.length; i++) {
      const value = untyped[i];
      const source = bonuses.find(b => b.type === 'untyped' && b.value === value)?.source || 'unknown';
      
      total += value;
      components.push({ value, type: 'untyped', source });
    }
    
    // Always add penalties (they stack)
    for (const bonus of bonuses) {
      if (bonus.value < 0) {
        total += bonus.value;
        components.push({ value: bonus.value, type: bonus.type, source: bonus.source });
      }
    }
    
    return {
      total,
      base,
      components
    };
  }

  /**
   * Get the individual bonus components for a target
   * This is useful for UI displays and tooltips
   */
  getComponents(entity: Entity, target: string): Array<{source: string, value: number, type?: string}> {
    const breakdown = this.getBreakdown(entity, target);
    return breakdown.components.map(component => ({
      source: component.source,
      value: component.value,
      type: component.type
    }));
  }

  /**
   * Check if a specific bonus exists
   */
  hasBonus(entity: Entity, target: string, source: string): boolean {
    if (!entity.character?.bonuses?.[target]) return false;
    
    return entity.character.bonuses[target].some(
      (bonus: any) => bonus.source === source
    );
  }
  
  /**
   * Get all bonuses for an entity
   */
  getAllBonuses(entity: Entity): Record<string, BonusBreakdown> {
    if (!entity.character?.bonuses) return {};
    
    const result: Record<string, BonusBreakdown> = {};
    
    for (const target in entity.character.bonuses) {
      result[target] = this.getBreakdown(entity, target);
    }
    
    return result;
  }
} 