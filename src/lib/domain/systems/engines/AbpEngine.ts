/**
 * AbpEngine.ts
 * 
 * Core automatic bonus progression calculation engine.
 * This handles pure data operations and calculations without
 * state management or feature registration.
 */

import { DataAccessLayer } from '../DataAccessLayer';

/**
 * Interface for an ABP node with bonuses
 */
export interface AbpNode {
  id: number;
  groupId: number;
  name: string;
  label: string | null;
  requiresChoice: boolean;
  bonuses: AbpBonus[];
}

/**
 * Interface for an ABP bonus
 */
export interface AbpBonus {
  id: number;
  value: number;
  targetSpecifier: string | null;
  bonusType: {
    id: number;
    name: string;
  };
}

/**
 * Result of node validation
 */
export interface NodeValidationResult {
  isValid: boolean;
  issues: string[];
}

/**
 * Core Automatic Bonus Progression engine for calculations
 */
export class AbpEngine {
  constructor(
    private dataAccessLayer: DataAccessLayer
  ) {}
  
  /**
   * Get the ABP nodes relevant for an entity's level
   */
  async getAbpNodes(entityLevel: number): Promise<AbpNode[]> {
    // Fetch ABP data from data access layer
    const abpData = await this.dataAccessLayer.getAbpCacheData(entityLevel);
    
    if (!abpData) {
      return [];
    }
    
    // Convert to our clean interface
    return abpData.nodes.map((node: any) => ({
      id: node.id,
      groupId: node.group_id,
      name: node.name,
      label: node.label,
      requiresChoice: node.requires_choice,
      bonuses: this.mapBonuses(node.bonuses)
    }));
  }
  
  /**
   * Map raw bonus data to our clean interface
   */
  private mapBonuses(bonuses: any[]): AbpBonus[] {
    if (!bonuses || !Array.isArray(bonuses)) {
      return [];
    }
    
    return bonuses.map(bonus => ({
      id: bonus.id,
      value: bonus.value,
      targetSpecifier: bonus.target_specifier,
      bonusType: {
        id: bonus.bonus_type.id,
        name: bonus.bonus_type.name
      }
    }));
  }
  
  /**
   * Calculate total ABP bonus for a specific target
   */
  async calculateAbpBonus(
    level: number,
    target: string,
    selectedNodeIds: number[] = []
  ): Promise<number> {
    const nodes = await this.getAbpNodes(level);
    
    // Filter to applicable nodes
    const applicableNodes = nodes.filter(node => 
      !node.requiresChoice || selectedNodeIds.includes(node.id)
    );
    
    // Find highest bonus of each type for the target
    const bonusesByType: Record<string, number> = {};
    
    for (const node of applicableNodes) {
      for (const bonus of node.bonuses) {
        // Skip if doesn't match target
        if (bonus.targetSpecifier !== target) continue;
        
        const type = bonus.bonusType.name;
        
        // Take highest bonus of each type
        if (!bonusesByType[type] || bonus.value > bonusesByType[type]) {
          bonusesByType[type] = bonus.value;
        }
      }
    }
    
    // Sum up the bonuses
    return Object.values(bonusesByType).reduce((sum, value) => sum + value, 0);
  }
  
  /**
   * Validate a set of selected node IDs against available nodes
   */
  validateNodeSelection(
    selectedNodeIds: number[],
    availableNodes: AbpNode[]
  ): NodeValidationResult {
    const result: NodeValidationResult = {
      isValid: true,
      issues: []
    };
    
    // Check that all selected nodes exist in available nodes
    const invalidNodeIds = selectedNodeIds.filter(id => 
      !availableNodes.some(node => node.id === id)
    );
    
    if (invalidNodeIds.length > 0) {
      result.isValid = false;
      result.issues.push(`Selected node IDs not found: ${invalidNodeIds.join(', ')}`);
    }
    
    // Check that we don't have multiple selections from the same group
    const groupSelections: Record<number, number[]> = {};
    
    // Group selected nodes by group ID
    for (const nodeId of selectedNodeIds) {
      const node = availableNodes.find(n => n.id === nodeId);
      if (!node) continue;
      
      const groupId = node.groupId;
      if (!groupSelections[groupId]) {
        groupSelections[groupId] = [];
      }
      
      groupSelections[groupId].push(nodeId);
    }
    
    // Check for multiple selections in the same group
    for (const [groupId, selections] of Object.entries(groupSelections)) {
      if (selections.length > 1) {
        result.isValid = false;
        result.issues.push(`Multiple selections from group ${groupId}: ${selections.join(', ')}`);
      }
    }
    
    // Ensure all required choices are made
    const requiredGroups = new Set(
      availableNodes
        .filter(node => node.requiresChoice)
        .map(node => node.groupId)
    );
    
    const selectedGroups = new Set(Object.keys(groupSelections));
    
    // Find missing required groups
    const missingGroups = [...requiredGroups].filter(groupId => 
      !selectedGroups.has(String(groupId))
    );
    
    if (missingGroups.length > 0) {
      result.isValid = false;
      result.issues.push(`Missing required selections for groups: ${missingGroups.join(', ')}`);
    }
    
    return result;
  }
} 