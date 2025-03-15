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
    
    // First add all typed bonuses (highest of each type)
    for (const type of this.TYPED_BONUSES) {
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
} 