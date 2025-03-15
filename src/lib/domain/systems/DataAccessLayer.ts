import type { GameRulesAPI } from '$lib/db/gameRules.api';
import type { CompleteCharacter } from '$lib/domain/character/CharacterTypes';
import type { FavoredClassBonus } from './SystemTypes';

/**
 * A unified layer for accessing game data with intelligent caching
 */
export class DataAccessLayer {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  constructor(private gameRules: GameRulesAPI, private cacheDuration: number = 300000) {}
  
  /**
   * Expose needed GameRulesAPI methods safely through adapter methods
   */
  public getAbpCacheData(level: number): Promise<any> {
    return this.gameRules.getAbpCacheData(level);
  }

  public getCompleteCharacterData(characterId: number): Promise<CompleteCharacter | null> {
    return this.gameRules.getCompleteCharacterData(characterId);
  }

  /**
   * Get cached data or fetch and cache new data
   */
  async getData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && now - cached.timestamp < this.cacheDuration) {
      return cached.data as T;
    }
    
    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: now });
    return data;
  }

  /**
   * Get class skills for provided class IDs
   */
  async getClassSkills(classIds: number[]): Promise<Set<number>> {
    return this.getData(
      `class_skills:${classIds.join(',')}`,
      async () => {
        const classSkills = await this.gameRules.getAllClassSkill();
        return new Set(
          classSkills
            .filter(cs => classIds.includes(cs.class_id))
            .map(cs => cs.skill_id)
        );
      }
    );
  }

  /**
   * Get all skills
   */
  async getAllSkills(): Promise<any[]> {
    return this.getData(
      'skills:all',
      () => this.gameRules.getAllSkill()
    );
  }

  /**
   * Get all abilities
   */
  async getAllAbilities(): Promise<any[]> {
    return this.getData(
      'abilities:all',
      () => this.gameRules.getAllAbility()
    );
  }

  /**
   * Get ABP bonuses for a character
   */
  async getAbpBonuses(level: number, chosenNodeIds: number[] = []): Promise<Record<string, number>> {
    return this.getData(
      `abp_bonuses:${level}:${chosenNodeIds.join(',')}`,
      async () => {
        const cache = await this.gameRules.getAbpCacheData(level);
        const result: Record<string, number> = {};
        
        // Process all nodes
        for (const node of cache.nodes) {
          // Skip choice nodes that weren't chosen
          if (node.requires_choice && !chosenNodeIds.includes(node.id)) {
            continue;
          }

          // Skip non-choice nodes in choice groups if a choice was made
          if (!node.requires_choice && node.group_id) {
            const groupHasChoice = cache.nodes.some(n => 
              n.group_id === node.group_id && n.requires_choice
            );
            const choiceMadeInGroup = chosenNodeIds.some(chosenId => 
              cache.nodes.some(n => 
                n.id === chosenId && n.group_id === node.group_id
              )
            );
            if (groupHasChoice && choiceMadeInGroup) {
              continue;
            }
          }

          // Add bonuses from valid nodes
          for (const bonus of node.bonuses) {
            // Get the target name (can be empty string for general bonuses)
            const targetName = bonus.target_specifier || '';
            
            if (!result[targetName]) {
              result[targetName] = 0;
            }
            
            // For simply getting total values, just keep the highest
            result[targetName] = Math.max(result[targetName], bonus.value);
          }
        }
        
        return result;
      }
    );
  }

  /**
   * Get favored class bonus choices for a character
   */
  async getFavoredClassBonuses(gameCharacterId: number): Promise<FavoredClassBonus[]> {
    return this.getData(
      `favored_class_bonuses:${gameCharacterId}`,
      async () => {
        try {
          // Use the new method in gameRules API
          const rawBonuses = await this.gameRules.getFavoredClassBonuses(gameCharacterId);
          
          // Convert to our interface type to ensure compatibility
          return rawBonuses.map(bonus => {
            return {
              id: bonus.id,
              game_character_id: bonus.game_character_id,
              class_id: bonus.class_id,
              choice_id: bonus.choice_id,
              level: bonus.level,
              choice: bonus.choice ? {
                id: bonus.choice.id,
                name: bonus.choice.name,
                label: bonus.choice.label || undefined // Convert null to undefined
              } : undefined
            };
          });
        } catch (error) {
          console.error('Error getting favored class bonuses:', error);
          return [];
        }
      }
    );
  }

  /**
   * Get processed class features for a character
   */
  async getProcessedClassFeatures(characterId: number, level: number): Promise<any[]> {
    return this.getData(
      `processed_class_features:${characterId}:${level}`,
      async () => {
        return await this.gameRules.getProcessedClassFeatures(characterId, level);
      }
    );
  }

  /**
   * Get complete character data
   */
  async getCharacter(characterId: number): Promise<CompleteCharacter | null> {
    // Character data is volatile, so we use a short expiry time
    return this.getData(
      `character:${characterId}`,
      () => this.gameRules.getCompleteCharacterData(characterId)
    );
  }

  /**
   * Get ancestry trait bonuses for a character
   */
  async getAncestryTraitBonuses(char: CompleteCharacter): Promise<Record<string, any[]>> {
    return this.getData(
      `ancestry_trait_bonuses:${char.id}`,
      async () => {
        const result: Record<string, any[]> = {};
        
        // Skip processing if no character data
        if (!char) return result;
        
        // First, collect all relevant ancestry traits efficiently
        const ancestryTraits = [];
        
        // Add standard ancestry traits
        if (char.game_character_ancestry?.[0]?.ancestry?.ancestry_trait) {
          ancestryTraits.push(...char.game_character_ancestry[0].ancestry.ancestry_trait);
        }
        
        // Add optional/alternate traits
        if (char.game_character_ancestry_trait?.length) {
          for (const entry of char.game_character_ancestry_trait) {
            if (entry.ancestry_trait) {
              ancestryTraits.push(entry.ancestry_trait);
            }
          }
        }
        
        // If no traits found, return empty result
        if (ancestryTraits.length === 0) return result;
        
        // Process each trait to extract bonuses
        for (const trait of ancestryTraits) {
          if (!trait.ancestry_trait_benefit?.length) continue;
          
          for (const benefit of trait.ancestry_trait_benefit) {
            if (!benefit.ancestry_trait_benefit_bonus?.length) continue;
            
            // Process each bonus
            for (const bonus of benefit.ancestry_trait_benefit_bonus) {
              // Skip invalid bonuses
              if (!bonus.target_specifier || !bonus.bonus_type || typeof bonus.value !== 'number') continue;
              
              // Get target key (e.g., "strength", "dexterity")
              let targetName = '';
              
              // Handle target specifier based on its type
              if (typeof bonus.target_specifier === 'string') {
                targetName = String(bonus.target_specifier).toLowerCase();
              } else if (typeof bonus.target_specifier === 'object' && bonus.target_specifier !== null) {
                // Cast to prevent 'never' type errors
                const targetObj = bonus.target_specifier as any;
                if (targetObj.name && typeof targetObj.name === 'string') {
                  targetName = targetObj.name.toLowerCase();
                }
              }
              
              // Skip if no valid target name
              if (!targetName) continue;
              
              // Get bonus type
              let bonusType = 'racial'; // Default type
              
              // Handle bonus type based on its type
              if (typeof bonus.bonus_type === 'string') {
                bonusType = String(bonus.bonus_type).toLowerCase();
              } else if (typeof bonus.bonus_type === 'object' && bonus.bonus_type !== null) {
                // Cast to prevent 'never' type errors
                const typeObj = bonus.bonus_type as any;
                if (typeObj.name && typeof typeObj.name === 'string') {
                  bonusType = typeObj.name.toLowerCase();
                }
              }
              
              // Create bonus entry
              const bonusEntry = {
                source: `Ancestry: ${trait.label || trait.name}`,
                value: bonus.value,
                type: bonusType
              };
              
              // Initialize array for this target if it doesn't exist
              if (!result[targetName]) {
                result[targetName] = [];
              }
              
              // Add to the appropriate target array
              result[targetName].push(bonusEntry);
            }
          }
        }
        
        return result;
      }
    );
  }

  /**
   * Clear specific entries from cache
   */
  clearCache(keyPattern?: RegExp): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (keyPattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear character data from cache
   */
  clearCharacterCache(characterId: number): void {
    this.clearCache(new RegExp(`^character:${characterId}`));
    this.clearCache(new RegExp(`^ancestry_trait_bonuses:${characterId}`));
    this.clearCache(new RegExp(`^processed_class_features:${characterId}`));
  }
} 