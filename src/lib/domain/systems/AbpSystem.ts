/**
 * AbpSystem.ts
 * 
 * System for Automatic Bonus Progression that registers ABP effects
 * with the FeatureEffectSystem and maintains ABP state.
 */

import type { Entity } from './SystemTypes';
import type { FeatureEffectSystem } from './FeatureEffectSystem';
import { DataAccessLayer } from './DataAccessLayer';
import { AbpEngine } from './engines/AbpEngine';
import type { AbpNode, AbpBonus } from './engines/AbpEngine';

/**
 * System for managing ABP effects
 */
export class AbpSystem {
  private abpEngine: AbpEngine;
  
  constructor(
    private dataAccessLayer: DataAccessLayer,
    private featureEffectSystem: FeatureEffectSystem
  ) {
    this.abpEngine = new AbpEngine(dataAccessLayer);
  }
  
  /**
   * Apply ABP bonuses to an entity
   */
  async applyAbpBonuses(
    entity: Entity, 
    level: number,
    selectedNodeIds: number[] = []
  ): Promise<void> {
    console.log(`[ABP SYSTEM] Applying ABP bonuses for level ${level} with selected nodes:`, selectedNodeIds);
    
    // Clear any existing ABP effects to prevent duplicates
    this.featureEffectSystem.removeEffectsBySourcePrefix('ABP:');
    
    // Get available ABP nodes
    const nodes = await this.abpEngine.getAbpNodes(level);
    
    // Filter to selected and automatic nodes
    const applicableNodes = nodes.filter(node => 
      !node.requiresChoice || selectedNodeIds.includes(node.id)
    );
    
    // Process each node and register its effects
    for (const node of applicableNodes) {
      for (const bonus of node.bonuses) {
        // Map target and type
        const mappedTarget = this.mapAbpTargetToSystemTarget(
          bonus.targetSpecifier || 'unspecified', 
          bonus.bonusType.name
        );
        
        const mappedType = this.mapBonusTypeToEffectType(bonus.bonusType.name);
        
        // Register the effect with the feature effect system
        this.featureEffectSystem.addEffect({
          id: `abp-${node.id}-${bonus.id}`,
          source: `ABP: ${node.label || node.name}`,
          type: mappedType,
          target: mappedTarget,
          value: bonus.value,
          priority: 30 // Medium-high priority for ABP effects
        });
        
        console.log(`[ABP SYSTEM] Registered ABP effect: ${mappedTarget} +${bonus.value} (${bonus.bonusType.name})`);
      }
    }
  }
  
  /**
   * Map ABP target specifiers to appropriate system targets
   */
  private mapAbpTargetToSystemTarget(target: string, bonusType: string): string {
    // Handle special ability score targeting for "first" specifiers
    if (target === 'first') {
      // Map "first" target specifier to actual ability name based on bonus type name
      if (bonusType === 'mental_prowess_int') return 'ability.intelligence';
      if (bonusType === 'mental_prowess_wis') return 'ability.wisdom';
      if (bonusType === 'mental_prowess_cha') return 'ability.charisma';
      if (bonusType === 'physical_prowess_str') return 'ability.strength';
      if (bonusType === 'physical_prowess_dex') return 'ability.dexterity';
      if (bonusType === 'physical_prowess_con') return 'ability.constitution';
    }
    
    // Handle ability targets
    if (target.startsWith('ability.')) {
      return target; // Already in the right format
    }
    
    // Map common ABP targets to system targets
    switch (target.toLowerCase()) {
      case 'weapon':
        return 'attack'; // Target attack stats
      case 'armor':
        return 'ac'; // Target AC
      case 'shield':
        return 'ac'; // Also targets AC but with shield type
      case 'resistance':
        return 'save_all'; // Target all saves with resistance bonus
      case 'deflection':
        return 'ac'; // Targets AC with deflection type
      case 'natural':
        return 'ac'; // Targets AC with natural armor type
      default:
        return target; // Preserve original if no mapping
    }
  }
  
  /**
   * Map ABP bonus types to system effect types
   */
  private mapBonusTypeToEffectType(bonusType: string): string {
    // Handle special bonus type mapping
    if (bonusType.includes('prowess')) {
      return 'enhancement'; // All prowess bonuses are enhancement bonuses
    }
    
    // Direct mappings
    switch (bonusType.toLowerCase()) {
      case 'armor':
        return 'armor';
      case 'shield':
        return 'shield';
      case 'deflection':
        return 'deflection';
      case 'natural_armor':
      case 'natural':
        return 'natural armor';
      case 'resistance':
        return 'resistance';
      case 'enhancement':
        return 'enhancement';
      default:
        return bonusType.toLowerCase(); // Use as-is if no special mapping
    }
  }
  
  /**
   * Validate node selection for an entity
   */
  async validateNodeSelection(
    level: number,
    selectedNodeIds: number[]
  ): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    // Get available nodes
    const nodes = await this.abpEngine.getAbpNodes(level);
    
    // Use the engine to validate node selection
    return this.abpEngine.validateNodeSelection(selectedNodeIds, nodes);
  }
} 