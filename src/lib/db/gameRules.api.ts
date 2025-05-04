import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/domain/types/supabase';

/**
 * GameRules namespace organizes all types and interfaces related to game rules.
 * This structure provides better organization without runtime overhead.
 */
export namespace GameRules {
  /** Base database types */
  export namespace Base {
    export type Tables = Database['public']['Tables'];
    export type Row<T extends keyof Tables> = Tables[T]['Row'];
  }

  /** Extended entity types with their relationships */
  export namespace Relationships {
    /**
     * Extends the base class type with its class features and spellcasting capabilities
     */
    export interface ClassWithFeatures extends Base.Row<'class'> {
      class_feature?: (Base.Row<'class_feature'> & {
        spellcasting_class_feature?: (Base.Row<'spellcasting_class_feature'> & {
          spellcasting_type?: Base.Row<'spellcasting_type'>;
          spell_progression_type?: Base.Row<'spell_progression_type'>;
          ability?: Base.Row<'ability'>;
        })[]; 
      })[];
    }

    /**
     * Extended corruption manifestation with prerequisite relationships
     */
    export interface ExtendedCorruptionManifestation extends Base.Row<'corruption_manifestation'> {
      prerequisite?: Base.Row<'corruption_manifestation'>;
      prerequisites?: { 
        prerequisite_manifestation_id: number; 
        prerequisite?: Base.Row<'corruption_manifestation'>;
      }[];
    }

    export interface AbpNodeWithBonuses extends Base.Row<'abp_node'> {
      bonuses: (Base.Row<'abp_node_bonus'> & {
        bonus_type: Base.Row<'abp_bonus_type'>;
      })[];
    }

    export interface SpellcastingFeature extends Base.Row<'spellcasting_class_feature'> {
      name?: string;
      label?: string;
      spellcasting_type?: SpellcastingType;
      spell_progression_type?: any;
      ability?: any;
    }

    export interface SpellcastingType extends Base.Row<'spellcasting_type'> {
      name: string;
      spellcasting_type?: string;
    }

    export interface ClassFeatureExt extends Base.Row<'class_feature'> {
      is_archetype?: boolean;
      replaced_feature_ids?: number[];
      alterations?: any[];
      class_feature_benefit?: any[];
      spellcasting_class_feature?: SpellcastingFeature[];
    }

    /**
     * Extended archetype class feature with replacements and alterations
     */
    export interface ArchetypeClassFeature extends Base.Row<'archetype_class_feature'> {
      class_feature?: ClassFeatureExt;
      archetype_class_feature_replacement?: {
        id: number;
        archetype_class_feature_id: number;
        replaced_class_feature_id: number;
      }[];
      archetype_class_feature_alteration?: {
        id: number;
        archetype_class_feature_id: number;
        altered_class_feature_id: number;
      }[];
    }

    /**
     * Extended archetype with its class features
     */
    export interface ArchetypeWithFeatures extends Base.Row<'archetype'> {
      archetype_class_feature?: ArchetypeClassFeature[];
    }
  }

  /** Complete entity types for API responses */
  export namespace Complete {
    /**
     * Complete character data with all related entities.
     * This comprehensive type supports fetching a complete character with a single query.
     */
    export interface Character extends Base.Row<'game_character'> {
      game_character_ability?: (Base.Row<'game_character_ability'> & {
        ability: Base.Row<'ability'>;
      })[];
      game_character_class?: (Base.Row<'game_character_class'> & {
        class: Relationships.ClassWithFeatures;
      })[];
      game_character_abp_choice?: (Base.Row<'game_character_abp_choice'> & {
        node: Base.Row<'abp_node'> & {
          bonuses: (Base.Row<'abp_node_bonus'> & {
            bonus_type: Base.Row<'abp_bonus_type'>;
          })[];
        };
      })[];
      game_character_ancestry?: (Base.Row<'game_character_ancestry'> & {
        ancestry: Base.Row<'ancestry'> & {
          ancestry_trait: (Base.Row<'ancestry_trait'> & {
            ancestry_trait_benefit: (Base.Row<'ancestry_trait_benefit'> & {
              ancestry_trait_benefit_bonus: (Base.Row<'ancestry_trait_benefit_bonus'> & {
                bonus_type: Base.Row<'bonus_type'>;
                target_specifier: Base.Row<'target_specifier'>;
              })[];
            })[];
          })[];
        };
      })[];
      game_character_ancestry_trait?: (Base.Row<'game_character_ancestry_trait'> & {
        ancestry_trait: Base.Row<'ancestry_trait'> & {
          ancestry_trait_benefit: (Base.Row<'ancestry_trait_benefit'> & {
            ancestry_trait_benefit_bonus: (Base.Row<'ancestry_trait_benefit_bonus'> & {
              bonus_type: Base.Row<'bonus_type'>;
              target_specifier: Base.Row<'target_specifier'>;
            })[];
          })[];
        };
      })[];
      game_character_armor?: (Base.Row<'game_character_armor'> & {
        armor: Base.Row<'armor'>;
      })[];
      game_character_equipment?: (Base.Row<'game_character_equipment'> & {
        equipment: Base.Row<'equipment'>;
      })[];
      game_character_feat?: (Base.Row<'game_character_feat'> & {
        feat: Base.Row<'feat'>;
      })[];
      game_character_trait?: (Base.Row<'game_character_trait'> & {
        trait: Base.Row<'trait'>;
      })[];
      game_character_class_feature?: (Base.Row<'game_character_class_feature'> & {
        class_feature: Relationships.ClassFeatureExt;
      })[];
      game_character_corruption_manifestation?: (Base.Row<'game_character_corruption_manifestation'> & {
        manifestation: Relationships.ExtendedCorruptionManifestation;
      })[];
      game_character_corruption?: (Base.Row<'game_character_corruption'> & {
        corruption: Base.Row<'corruption'>;
      })[];
      game_character_skill_rank?: (Base.Row<'game_character_skill_rank'> & {
        skill: Base.Row<'skill'>;
      })[];
      game_character_favored_class_bonus?: (Base.Row<'game_character_favored_class_bonus'> & {
        favored_class_choice: Base.Row<'favored_class_choice'>;
      })[];
      game_character_archetype?: (Base.Row<'game_character_archetype'> & {
        archetype: Relationships.ArchetypeWithFeatures;
      })[];
      spell_slots?: Record<number, Record<number, number>>;
    }
  }

  /** Processed entity types (transformed for specific use cases) */
  export namespace Processed {
    export interface ClassFeature {
      id: number;
      name: string;
      label: string;
      description: string;
      type: string;
      level: number;
      class_name: string;
      is_archetype: boolean;
      replaced_feature_ids: number[];
      alterations: {
        alteringFeature: {
          id: number;
          name: string;
          label: string;
        };
      }[];
      class_feature_benefit: {
        id: number;
        name: string;
        label: string | null;
        feature_level: number | null;
        class_feature_benefit_bonus: {
          id: number;
          value: number;
          bonus_type: {
            name: string;
          };
          target_specifier: {
            name: string;
          };
        }[];
      }[];
    }
  }

  /** Callback types for real-time subscriptions */
  export namespace Callbacks {
    export type RealtimeCallback<T extends keyof Base.Tables> = (
      type: 'INSERT' | 'UPDATE' | 'DELETE',
      row: Base.Row<T> | null
    ) => void | Promise<void>;
  }
}

// Using the shortened type references
type Tables = GameRules.Base.Tables;
type Row<T extends keyof Tables> = GameRules.Base.Row<T>;
type RealtimeCallback<T extends keyof Tables> = GameRules.Callbacks.RealtimeCallback<T>;

/**
 * GameRulesAPI provides a centralized interface for accessing and manipulating
 * game rules data in the database. It optimizes for query performance by 
 * using deeply nested queries to avoid the N+1 query problem.
 */
export class GameRulesAPI {
  /**
   * Organized query templates for reuse across methods
   * Keeping these as properties allows for consistency and maintainability
   */
  private readonly queries = {
    /**
     * Complete character query with all related entities
     * This query is intentionally comprehensive to avoid multiple roundtrips
     */
    completeCharacter: `
      *,
      game_character_ability(*, ability(*)),
      game_character_class(
        *,
        class(
          *,
          class_feature(
            *,
            spellcasting_class_feature(
              *,
              spellcasting_type(*),
              spell_progression_type(*, spell_progression(*)),
              ability(*)
            )
          )
        )
      ),
      game_character_abp_choice(
        *,
        node:abp_node(
          *,
          bonuses:abp_node_bonus(*, bonus_type:abp_bonus_type(*))
        )
      ),
      game_character_ancestry(
        *, 
        ancestry(
          *,
          ancestry_trait(
            *,
            ancestry_trait_benefit(
              *,
              ancestry_trait_benefit_bonus(
                *,
                bonus_type(*),
                target_specifier(*)
              )
            ),
            replacing_traits:ancestry_trait_replacement!replacing_trait_id(
              replaced_trait:ancestry_trait!replaced_trait_id(*)
            )
          )
        )
      ),
      game_character_ancestry_trait(
        *,
        ancestry_trait(
          *,
          ancestry_trait_benefit(
            *,
            ancestry_trait_benefit_bonus(
              *,
              bonus_type(*),
              target_specifier(*)
            )
          ),
          replacing_traits:ancestry_trait_replacement!replacing_trait_id(
            replaced_trait:ancestry_trait!replaced_trait_id(*)
          )
        )
      ),
      game_character_armor(*, armor(*)),
      game_character_equipment(*, equipment(*)),
      game_character_feat(*, feat(*)),
      game_character_trait(*, trait(*)),
      game_character_class_feature(
        *, 
        class_feature(
          *, 
          spellcasting_class_feature(
            *,
            spellcasting_type(*),
            spell_progression_type(*),
            ability(*)
          ),
          class_feature_benefit(
            *, 
            class_feature_benefit_bonus(
              *,
              bonus_type(*),
              target_specifier(*)
            )
          )
        )
      ),
      game_character_corruption_manifestation(
        *, 
        manifestation:corruption_manifestation(*)
      ),
      game_character_corruption(*, corruption(*)),
      game_character_skill_rank(*, skill(*, ability(*))),
      game_character_favored_class_bonus(*, favored_class_choice(*)),
      game_character_archetype(
        *, 
        archetype(
          *, 
          archetype_class_feature(
            *, 
            class_feature(
              *, 
              class_feature_benefit(
                *, 
                class_feature_benefit_bonus(
                  *,
                  bonus_type(*),
                  target_specifier(*)
                )
              )
            ), 
            archetype_class_feature_alteration(*), 
            archetype_class_feature_replacement(*)
          )
        )
      )
    `,
    
    abpNode: `
      *,
      bonuses:abp_node_bonus(
        *,
        bonus_type:abp_bonus_type(*)
      )
    `,

    processedClassFeatures: `
      *,
      class(
        *,
        class_feature(
          *,
          spellcasting_class_feature(
            *,
            spellcasting_type(*),
            spell_progression_type(*),
            ability(*)
          )
        )
      )
    `
  };

  /**
   * Cache for frequently accessed reference data
   * This helps avoid redundant queries for static or slow-changing data
   */
  private cache = {
    abp: {
      nodes: null as GameRules.Relationships.AbpNodeWithBonuses[] | null,
      nodeGroups: null as any[] | null,
      nodeBonuses: null as any[] | null,
      bonusTypes: null as any[] | null
    },
    abilities: null as any[] | null,
    skills: null as any[] | null,
    feats: null as Row<'feat'>[] | null
  };

  /**
   * Active real-time subscriptions
   * Tracking these allows proper cleanup when they're no longer needed
   */
  private activeSubscriptions: ReturnType<SupabaseClient['channel']>[] = [];

  /**
   * Creates a new GameRulesAPI instance
   * @param supabase The Supabase client used for database access
   */
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Generic method to fetch an entity by ID
   * @param table The table name
   * @param id The entity ID
   * @param query The query string (defaults to '*')
   * @returns The entity data or null if not found
   */
  private async getEntityById<T extends keyof Tables>(
    table: T,
    id: number,
    query: string = '*'
  ): Promise<Row<T> | null> {
    try {
      const { data, error } = await this.supabase
        .from(table)
        .select(query)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Use double casting with unknown to satisfy TypeScript
      return data as unknown as Row<T>;
    } catch (err: any) {
      // Handle 406 errors (no rows found)
      if (err?.code === '406' || err?.status === 406 || 
          (err?.message && err?.message.includes('JSON object requested, multiple (or no) rows returned'))) {
        console.warn(`No ${table} found with ID ${id}`);
        return null;
      }
      
      throw new Error(`Failed to fetch ${table} with id ${id}: ${err.message || err}`);
    }
  }

  /**
   * Fetches complete character data with all related entities in a single query.
   * 
   * @remarks
   * This method uses a deeply nested query structure to avoid the N+1 query problem.
   * While this results in a complex type structure, it significantly improves performance
   * compared to multiple separate queries.
   * 
   * @param characterId The ID of the character to fetch
   * @returns A complete character object with all related data
   */
  async getCompleteCharacterData(characterId: number): Promise<GameRules.Complete.Character | null> {
    try {
      const { data, error } = await this.supabase
        .from('game_character')
        .select(this.queries.completeCharacter)
        .eq('id', characterId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Safely cast the data to the expected type
      const characterData = data as unknown as GameRules.Complete.Character;
      
      // Enrich corruption manifestations if present
      if (characterData?.game_character_corruption_manifestation?.length) {
        await this.enrichCorruptionManifestations(characterData.game_character_corruption_manifestation);
      }

      return characterData;
    } catch (err: any) {
      // Handle 406 "Not Acceptable" error, which occurs when no rows found
      if (err?.code === '406' || err?.status === 406 || 
          (err?.message && err?.message.includes('JSON object requested, multiple (or no) rows returned'))) {
        console.warn(`No character found with ID ${characterId}`);
        return null;
      }
      
      // For other errors, rethrow
      throw new Error(`Failed to fetch character data: ${err.message || err}`);
    }
  }

  /**
   * Helper method to enrich corruption manifestation data with prerequisites
   * This is extracted to keep the main method cleaner and more maintainable
   */
  private async enrichCorruptionManifestations(manifestationEntries: any[]) {
    const manifestationIds = manifestationEntries
      .map(entry => entry.manifestation?.id)
      .filter(Boolean);
      
    if (manifestationIds.length === 0) return;
    
    // Get all manifestations to have the full set
    const { data: allManifestations, error: manifestationsError } = await this.supabase
      .from('corruption_manifestation')
      .select('*')
      .in('id', manifestationIds);
      
    if (manifestationsError || !allManifestations) {
      console.error('Failed to fetch manifestations:', manifestationsError);
      return;
    }
    
    // Create a map for quick lookup
    const manifestationMap = allManifestations.reduce((map, m) => {
      map[m.id] = m;
      return map;
    }, {} as Record<number, GameRules.Relationships.ExtendedCorruptionManifestation>);
    
    // Get prerequisites relationships from the relationship table
    const { data: prerequisites, error: prerequisitesError } = await this.supabase
      .from('corruption_manifestation_prerequisite')
      .select('*')
      .in('corruption_manifestation_id', manifestationIds);
      
    if (prerequisitesError || !prerequisites) {
      console.error('Failed to fetch prerequisites:', prerequisitesError);
      return;
    }
    
    // Connect prerequisites for each manifestation
    manifestationEntries.forEach((entry: any) => {
      const manifestationExt = entry.manifestation as GameRules.Relationships.ExtendedCorruptionManifestation;
      
      // Collect all prerequisites for this manifestation
      const manifestationPrereqs = prerequisites.filter(
        p => p.corruption_manifestation_id === manifestationExt.id
      );
      
      if (manifestationPrereqs.length > 0) {
        // Store all prerequisites
        manifestationExt.prerequisites = manifestationPrereqs.map(prereq => {
          const prerequisiteId = prereq.prerequisite_manifestation_id;
          return {
            prerequisite_manifestation_id: prerequisiteId,
            prerequisite: manifestationMap[prerequisiteId]
          };
        }).filter(p => p.prerequisite); // Only keep valid prerequisites
        
        // For backward compatibility, store the first prerequisite in the single field
        if (manifestationExt.prerequisites.length > 0) {
          manifestationExt.prerequisite = manifestationExt.prerequisites[0].prerequisite;
        }
      }
    });
  }

  /**
   * Fetches multiple complete character data objects in parallel
   * @param characterIds An array of character IDs to fetch
   * @returns An array of complete character objects
   */
  async getMultipleCompleteCharacterData(
    characterIds: number[]
  ): Promise<GameRules.Complete.Character[]> {
    const promises = characterIds.map(id => this.getCompleteCharacterData(id));
    const results = await Promise.all(promises);
    
    // Filter out null results
    return results.filter((char): char is GameRules.Complete.Character => char !== null);
  }

  /**
   * Gets an ABP node by ID with its bonuses
   * @param nodeId The ID of the ABP node to fetch
   * @returns The ABP node with its bonuses
   */
  async getAbpNode(nodeId: number): Promise<GameRules.Relationships.AbpNodeWithBonuses | null> {
    return this.getAbpNodeById(nodeId);
  }

  /**
   * Get an ABP node by ID with its bonuses
   * @param nodeId The ID of the node to fetch
   * @returns The ABP node with its bonuses or null if not found
   */
  async getAbpNodeById(nodeId: number): Promise<GameRules.Relationships.AbpNodeWithBonuses | null> {
    return this.getEntityById(
      'abp_node',
      nodeId,
      `
        *,
        bonuses:abp_node_bonus (
          *,
          bonus_type:abp_bonus_type (*)
        )
      `
    ) as Promise<GameRules.Relationships.AbpNodeWithBonuses | null>;
  }

  /**
   * Gets all ABP nodes available at a given level
   * @param level The character level to filter nodes by
   * @returns Array of ABP nodes with their bonuses
   */
  async getAbpNodesForLevel(level: number): Promise<GameRules.Relationships.AbpNodeWithBonuses[]> {
    const { data, error } = await this.supabase
      .from('abp_node')
      .select(`
        *,
        abp_node_bonus (
          *,
          bonus_type:abp_bonus_type (
            *
          )
        ),
        group:abp_node_group!inner (
          *
        )
      `)
      .lte('group.level', level);

    if (error) throw error;
    
    return (data || []).map(node => ({
      id: node.id,
      group_id: node.group_id,
      name: node.name,
      label: node.label,
      description: node.description,
      requires_choice: node.requires_choice,
      created_at: node.created_at,
      updated_at: node.updated_at,
      bonuses: (node.abp_node_bonus || []).map((bonus: any) => ({
        id: bonus.id,
        node_id: bonus.node_id,
        bonus_type_id: bonus.bonus_type_id,
        value: bonus.value,
        target_specifier: bonus.target_specifier,
        created_at: bonus.created_at,
        updated_at: bonus.updated_at,
        bonus_type: bonus.bonus_type
      }))
    })) as GameRules.Relationships.AbpNodeWithBonuses[];
  }

  /**
   * Gets processed class features for a character at a specific level
   * This transforms the raw data into a more usable format for the UI
   * 
   * @param characterId The ID of the character
   * @param level The level to get features for
   * @returns Processed class features or an empty array if no class data found
   */
  async getProcessedClassFeatures(
    characterId: number, 
    level: number
  ): Promise<GameRules.Processed.ClassFeature[]> {
    try {
      // First get the character's class
      const { data: charData, error: charError } = await this.supabase
        .from('game_character_class')
        .select(this.queries.processedClassFeatures)
        .eq('game_character_id', characterId)
        .eq('level', level)
        .single();

      if (charError) {
        // Check for 406 Not Acceptable error (no rows)
        if (charError.code === 'PGRST116') {
          console.warn(`No class data found for character ${characterId} at level ${level}`);
          return []; // Return empty array instead of throwing
        }
        throw charError;
      }
      
      if (!charData) return []; // Safeguard in case data is null

      // Safely cast to avoid type errors
      const safeCharData = charData as unknown as { 
        class: { 
          name: string;
          class_feature: GameRules.Relationships.ClassFeatureExt[] 
        } 
      };
      
      const { class: classInfo } = safeCharData;
      const { class_feature } = classInfo;
      const className = classInfo.name || 'Unknown Class';

      if (!class_feature || class_feature.length === 0) {
        throw new Error(`No class features found for character ${characterId} at level ${level}`);
      }

      const processedFeatures: GameRules.Processed.ClassFeature[] = [];

      for (const feature of class_feature) {
        const { spellcasting_class_feature } = feature;

        // If there are no spellcasting features, process the regular class feature
        if (!spellcasting_class_feature || spellcasting_class_feature.length === 0) {
          // Create a processed feature from the regular class feature
          const processedFeature: GameRules.Processed.ClassFeature = {
            id: feature.id,
            name: feature.name || '',
            label: feature.label || '',
            description: feature.description || '',
            type: 'Regular', // Set a default type for non-spellcasting features
            level,
            class_name: className,
            is_archetype: feature.is_archetype || false,
            replaced_feature_ids: feature.replaced_feature_ids || [],
            alterations: feature.alterations || [],
            class_feature_benefit: feature.class_feature_benefit || []
          };
          
          processedFeatures.push(processedFeature);
          continue; // Skip the spellcasting-specific processing
        }

        // Process spellcasting features if present
        for (const spellcastingFeature of spellcasting_class_feature) {
          const { spellcasting_type, spell_progression_type, ability } = spellcastingFeature;

          if (!spellcasting_type || !spell_progression_type || !ability) {
            throw new Error(`Incomplete spellcasting feature data for class feature ${feature.id} of character ${characterId} at level ${level}`);
          }

          // Use defined interfaces with optional chaining
          const { id } = spellcastingFeature;
          const name = spellcastingFeature.name || '';
          const label = spellcastingFeature.label || '';
          
          // Get the type name safely
          const typeName = spellcasting_type.name || 'Unknown';
          
          const processedFeature: GameRules.Processed.ClassFeature = {
            id,
            name,
            label,
            description: feature.description || '', // Provide empty string as fallback for null
            type: typeName,
            level,
            class_name: className,
            // Use optional chaining with defaults
            is_archetype: feature.is_archetype || false,
            replaced_feature_ids: feature.replaced_feature_ids || [],
            alterations: feature.alterations || [],
            class_feature_benefit: feature.class_feature_benefit || []
          };

          processedFeatures.push(processedFeature);
        }
      }

      return processedFeatures;
    } catch (err: any) {
      // Handle 406 errors (record not found)
      if (err?.code === '406' || err?.status === 406 || 
          (err?.message && err?.message.includes('JSON object requested, multiple (or no) rows returned'))) {
        console.warn(`Attempted to fetch non-existent class features for character ${characterId} at level ${level}`);
        return []; // Return empty array instead of throwing
      }
      
      throw new Error(`Failed to fetch processed class features: ${err.message || err}`);
    }
  }

  /**
   * Gets all ABP nodes from the database
   * @returns All ABP nodes with their bonuses
   */
  async getAllAbpNode(): Promise<GameRules.Relationships.AbpNodeWithBonuses[]> {
    const { data, error } = await this.supabase
      .from('abp_node')
      .select(this.queries.abpNode);

    if (error) throw error;
    return data as unknown as GameRules.Relationships.AbpNodeWithBonuses[];
  }

  /**
   * Gets all ABP node groups, with caching for performance
   * @returns All ABP node groups
   */
  async getAllAbpNodeGroup(): Promise<any[]> {
    if (!this.cache.abp.nodeGroups) {
      const { data, error } = await this.supabase
        .from('abp_node_group')
        .select('*');

      if (error) throw error;
      this.cache.abp.nodeGroups = data;
    }
    return this.cache.abp.nodeGroups || [];
  }

  /**
   * Gets all ABP node bonuses, with caching for performance
   * @returns All ABP node bonuses
   */
  async getAllAbpNodeBonus(): Promise<any[]> {
    if (!this.cache.abp.nodeBonuses) {
      const { data, error } = await this.supabase
        .from('abp_node_bonus')
        .select('*');

      if (error) throw error;
      this.cache.abp.nodeBonuses = data;
    }
    return this.cache.abp.nodeBonuses || [];
  }

  /**
   * Gets all ABP bonus types, with caching for performance
   * @returns All ABP bonus types
   */
  async getAllAbpBonusType(): Promise<any[]> {
    if (!this.cache.abp.bonusTypes) {
      const { data, error } = await this.supabase
        .from('abp_bonus_type')
        .select('*');

      if (error) throw error;
      this.cache.abp.bonusTypes = data;
    }
    return this.cache.abp.bonusTypes || [];
  }

  /**
   * Gets all skills with their associated abilities, with caching for performance
   * @returns All skills
   */
  async getAllSkill(): Promise<any[]> {
    // Load into cache if not already loaded
    if (!this.cache.skills) {
      const { data, error } = await this.supabase
        .from('skill')
        .select('*, ability(*)');

      if (error) throw error;
      this.cache.skills = data;
    }
    return this.cache.skills || [];
  }

  /**
   * Gets all abilities, with caching for performance
   * @returns All abilities
   */
  async getAllAbility(): Promise<any[]> {
    // Load into cache if not already loaded
    if (!this.cache.abilities) {
      const { data, error } = await this.supabase
        .from('ability')
        .select('*');

      if (error) throw error;
      this.cache.abilities = data;
    }
    return this.cache.abilities || [];
  }

  /**
   * Gets all class skills
   * @returns All class-skill relationships
   */
  async getAllClassSkill(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('class_skill')
      .select('*');

    if (error) throw error;
    return data;
  }

  /**
   * Gets all game characters
   * @returns All game characters
   */
  async getAllGameCharacter(): Promise<Row<'game_character'>[]> {
    const { data, error } = await this.supabase
      .from('game_character')
      .select('*');

    if (error) throw error;
    return data;
  }

  /**
   * Gets all classes
   * @returns All classes
   */
  async getAllClass(): Promise<Row<'class'>[]> {
    const { data, error } = await this.supabase
      .schema('features' as any)
      .from('class')
      .select('*');

    if (error) throw error;
    return data;
  }

  /**
   * Gets all feats
   * @returns All feats
   */
  async getAllFeat(): Promise<Row<'feat'>[]> {
    if (this.cache.feats) {
      return this.cache.feats;
    }
    
    const { data, error } = await this.supabase
      .schema('features' as any)
      .from('feat')
      .select('*');
    
    if (error) throw error;
    
    this.cache.feats = data || [];
    return data || [];
  }

  /**
   * Get all favored class bonuses for a character
   * @param gameCharacterId The character ID to get favored class bonuses for
   * @returns Array of favored class bonus records with their related choice data
   */
  async getFavoredClassBonuses(gameCharacterId: number): Promise<(Row<'game_character_favored_class_bonus'> & { choice?: Row<'favored_class_choice'> })[]> {
    const { data, error } = await this.supabase
      .from('game_character_favored_class_bonus')
      .select('*, favored_class_choice(*)')
      .eq('game_character_id', gameCharacterId);
      
    if (error) throw error;
    
    // Transform to match expected structure with choice property
    return (data || []).map(bonus => {
      const { favored_class_choice, ...rest } = bonus;
      return {
        ...rest,
        choice: favored_class_choice
      };
    });
  }
  
  /**
   * Get a specific favored class choice by ID
   * @param choiceId The ID of the favored class choice to get
   * @returns The favored class choice record or null if not found
   */
  async getFavoredClassChoice(choiceId: number): Promise<Row<'favored_class_choice'> | null> {
    return this.getEntityById('favored_class_choice', choiceId);
  }

  /**
   * Gets pre-calculated ABP cache data for a specific level
   * @param effectiveLevel The character's effective level
   * @returns ABP nodes and bonus types for the given level
   */
  async getAbpCacheData(effectiveLevel: number): Promise<{
    nodes: GameRules.Relationships.AbpNodeWithBonuses[];
    bonusTypes: Record<number, string>;
  }> {
    // Use cached data if available, otherwise load it
    if (!this.cache.abp.nodes || !this.cache.abp.bonusTypes) {
      const [nodes, bonusTypes] = await Promise.all([
        this.getAbpNodesForLevel(effectiveLevel),
        this.getAllAbpBonusType()
      ]);
      
      this.cache.abp.nodes = nodes;
      this.cache.abp.bonusTypes = bonusTypes;
    }

    // Create a map of bonus type IDs to names
    const bonusTypeMap = (this.cache.abp.bonusTypes || []).reduce((acc, type) => {
      acc[type.id] = type.name;
      return acc;
    }, {} as Record<number, string>);

    return {
      nodes: this.cache.abp.nodes || [],
      bonusTypes: bonusTypeMap
    };
  }

  /**
   * Clears the ABP cache
   * Call this after making changes to ABP-related data
   */
  clearAbpCache(): void {
    this.cache.abp = {
      nodes: null,
      nodeGroups: null,
      nodeBonuses: null,
      bonusTypes: null
    };
  }

  /**
   * Gets all corruption manifestations with their prerequisites
   * This method includes the prerequisites for each manifestation
   * @returns All corruption manifestations with prerequisite relationships
   */
  async getAllCorruptionManifestations(): Promise<GameRules.Relationships.ExtendedCorruptionManifestation[]> {
    // First, get all manifestations
    const { data, error } = await this.supabase
      .from('corruption_manifestation')
      .select('*')
      .order('name');

    if (error) throw new Error(`Failed to fetch corruption manifestations: ${error.message}`);
    if (!data || data.length === 0) return [];
    
    // Create a map for quick lookups
    const manifestationMap = data.reduce((map, m) => {
      map[m.id] = m;
      return map;
    }, {} as Record<number, GameRules.Relationships.ExtendedCorruptionManifestation>);
    
    // Get all prerequisites from the relationship table
    const { data: prerequisites, error: prerequisitesError } = await this.supabase
      .from('corruption_manifestation_prerequisite')
      .select('*');
      
    if (prerequisitesError) {
      console.error('Failed to fetch prerequisites:', prerequisitesError);
    } else if (prerequisites && prerequisites.length > 0) {
      // Group prerequisites by manifestation ID
      const prereqsByManifestationId = prerequisites.reduce((acc, prereq) => {
        const id = prereq.corruption_manifestation_id;
        if (!acc[id]) acc[id] = [];
        acc[id].push(prereq);
        return acc;
      }, {} as Record<number, any[]>);
      
      // Connect prerequisites for each manifestation
      Object.keys(prereqsByManifestationId).forEach(manifestationIdStr => {
        const manifestationId = parseInt(manifestationIdStr);
        const manifestation = manifestationMap[manifestationId] as GameRules.Relationships.ExtendedCorruptionManifestation;
        
        if (manifestation) {
          // Store all prerequisites
          manifestation.prerequisites = prereqsByManifestationId[manifestationId].map(prereq => {
            const prerequisiteId = prereq.prerequisite_manifestation_id;
            return {
              prerequisite_manifestation_id: prerequisiteId,
              prerequisite: manifestationMap[prerequisiteId]
            };
          }).filter(p => p.prerequisite);
          
          // For backward compatibility, store the first prerequisite in the single field
          if (manifestation.prerequisites.length > 0) {
            manifestation.prerequisite = manifestation.prerequisites[0].prerequisite;
          }
        }
      });
    }
    
    return data as GameRules.Relationships.ExtendedCorruptionManifestation[];
  }

  /**
   * Adds a prerequisite relationship between two corruption manifestations
   * @param manifestationId The ID of the manifestation
   * @param prerequisiteId The ID of the prerequisite manifestation
   * @returns The created relationship
   */
  async addCorruptionManifestationPrerequisite(
    manifestationId: number,
    prerequisiteId: number
  ): Promise<any> {
    const { data, error } = await this.supabase
      .from('corruption_manifestation_prerequisite')
      .insert({
        corruption_manifestation_id: manifestationId,
        prerequisite_manifestation_id: prerequisiteId
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add prerequisite relationship: ${error.message}`);
    return data;
  }

  /**
   * Removes a prerequisite relationship between two corruption manifestations
   * @param manifestationId The ID of the manifestation
   * @param prerequisiteId The ID of the prerequisite manifestation
   * @returns True if the relationship was removed successfully
   */
  async removeCorruptionManifestationPrerequisite(
    manifestationId: number,
    prerequisiteId: number
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('corruption_manifestation_prerequisite')
      .delete()
      .match({ 
        corruption_manifestation_id: manifestationId,
        prerequisite_manifestation_id: prerequisiteId
      });

    if (error) throw new Error(`Failed to remove prerequisite relationship: ${error.message}`);
    return true;
  }

  /**
   * Gets all prerequisites for a specific corruption manifestation
   * @param manifestationId The ID of the manifestation
   * @returns An array of prerequisites for the manifestation
   */
  async getCorruptionManifestationPrerequisites(manifestationId: number): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('corruption_manifestation_prerequisite')
      .select(`
        *,
        prerequisite:corruption_manifestation!prerequisite_manifestation_id(*)
      `)
      .eq('corruption_manifestation_id', manifestationId);

    if (error) throw new Error(`Failed to get prerequisite relationships: ${error.message}`);
    return data || [];
  }

  /**
   * Gets analytics data for a corruption manifestation
   * @param manifestationId The ID of the manifestation
   * @returns Analytics data for the manifestation
   * @todo Implement real analytics
   */
  async getCorruptionManifestationAnalytics(manifestationId: number): Promise<any> {
    console.warn(`Method not fully implemented: getCorruptionManifestationAnalytics for ${manifestationId}`);
    return { manifestationId, usage: 0 }; // Return a dummy value
  }

  /**
   * Creates a watcher for a database table and properly tracks the subscription
   * @param table The table to watch
   * @param callback The callback to execute when the table changes
   * @returns The subscription channel that can be used to unsubscribe
   */
  private createWatcher<T extends keyof Tables>(
    table: T,
    callback: RealtimeCallback<T>
  ): ReturnType<SupabaseClient['channel']> {
    const subscription = this.watchTable(table, callback);
    this.activeSubscriptions.push(subscription);
    return subscription;
  }

  /**
   * Helper method for watching tables
   * @param table The table to watch
   * @param callback The callback to execute when the table changes
   * @returns The subscription channel that can be used to unsubscribe
   */
  private watchTable<T extends keyof Tables>(
    table: T,
    callback: RealtimeCallback<T>
  ): ReturnType<SupabaseClient['channel']> {
    return this.supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table 
      }, (payload: RealtimePostgresChangesPayload<Row<T>>) => {
        const type = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const row = type === 'DELETE' ? payload.old as Row<T> : payload.new as Row<T>;
        callback(type, row);
      })
      .subscribe();
  }

  /**
   * Stops all active watchers
   * Call this when you no longer need real-time updates
   */
  stopAllWatchers(): void {
    this.activeSubscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.activeSubscriptions = [];
  }

  // ==== WATCH METHODS ====
  // These methods create and return watchers for specific tables
  
  /**
   * Creates a watcher for game_character table changes
   */
  watchGameCharacter(callback: RealtimeCallback<'game_character'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character', callback);
  }

  /**
   * Creates a watcher for game_character_ability table changes
   */
  watchGameCharacterAbility(callback: RealtimeCallback<'game_character_ability'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character_ability', callback);
  }

  /**
   * Creates a watcher for game_character_ancestry table changes
   */
  watchGameCharacterAncestry(callback: RealtimeCallback<'game_character_ancestry'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character_ancestry', callback);
  }

  /**
   * Creates a watcher for game_character_archetype table changes
   */
  watchGameCharacterArchetype(callback: RealtimeCallback<'game_character_archetype'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character_archetype', callback);
  }

  /**
   * Creates a watcher for game_character_armor table changes
   */
  watchGameCharacterArmor(callback: RealtimeCallback<'game_character_armor'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character_armor', callback);
  }

  /**
   * Creates a watcher for game_character_class table changes
   */
  watchGameCharacterClass(callback: RealtimeCallback<'game_character_class'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character_class', callback);
  }

  /**
   * Creates a watcher for game_character_class_feature table changes
   */
  watchGameCharacterClassFeature(callback: RealtimeCallback<'game_character_class_feature'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character_class_feature', callback);
  }

  /**
   * Creates a watcher for game_character_corruption table changes
   */
  watchGameCharacterCorruption(callback: RealtimeCallback<'game_character_corruption'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character_corruption', callback);
  }

  /**
   * Creates a watcher for game_character_corruption_manifestation table changes
   */
  watchGameCharacterCorruptionManifestation(callback: RealtimeCallback<'game_character_corruption_manifestation'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character_corruption_manifestation', callback);
  }

  /**
   * Creates a watcher for game_character_equipment table changes
   */
  watchGameCharacterEquipment(callback: RealtimeCallback<'game_character_equipment'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character_equipment', callback);
  }

  /**
   * Creates a watcher for game_character_feat table changes
   */
  watchGameCharacterFeat(callback: RealtimeCallback<'game_character_feat'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character_feat', callback);
  }

  /**
   * Creates a watcher for game_character_skill_rank table changes
   */
  watchGameCharacterSkillRank(callback: RealtimeCallback<'game_character_skill_rank'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character_skill_rank', callback);
  }

  /**
   * Creates a watcher for game_character_wild_talent table changes
   */
  watchGameCharacterWildTalent(callback: RealtimeCallback<'game_character_wild_talent'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character_wild_talent', callback);
  }

  /**
   * Creates a watcher for game_character_abp_choice table changes
   */
  watchGameCharacterAbpChoice(callback: RealtimeCallback<'game_character_abp_choice'>): ReturnType<SupabaseClient['channel']> {
    return this.createWatcher('game_character_abp_choice', callback);
  }

  // ==== CRUD OPERATIONS ====
  // These methods create, update, or delete records
  
  /**
   * Updates a game character
   * @param id The ID of the character to update
   * @param data The data to update
   * @returns The updated character or null if not found
   */
  async updateGameCharacter(
    id: number,
    data: Partial<Row<'game_character'>>
  ): Promise<Row<'game_character'> | null> {
    try {
      const { data: updatedData, error } = await this.supabase
        .from('game_character')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedData as Row<'game_character'>;
    } catch (err: any) {
      // Handle 406 errors (record not found)
      if (err?.code === '406' || err?.status === 406 || 
          (err?.message && err?.message.includes('JSON object requested, multiple (or no) rows returned'))) {
        console.warn(`Attempted to update non-existent character with ID ${id}`);
        return null;
      }
      
      throw new Error(`Failed to update character: ${err.message || err}`);
    }
  }

  /**
   * Creates a skill rank for a character
   * @param data The skill rank data
   */
  async createGameCharacterSkillRank(data: {
    game_character_id: number;
    skill_id: number;
    applied_at_level: number;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('game_character_skill_rank')
      .insert({
        game_character_id: data.game_character_id,
        skill_id: data.skill_id,
        applied_at_level: data.applied_at_level
      });

    if (error) throw error;
  }

  /**
   * Deletes a character skill rank
   * @param id The ID of the skill rank to delete
   */
  async deleteGameCharacterSkillRank(id: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('game_character_skill_rank')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      // If error is 406 (Not Acceptable), it means the record doesn't exist
      // In this case, we can safely ignore the error as the end result is the same
      if (err?.code === '406' || err?.status === 406) {
        console.warn(`Attempted to delete non-existent skill rank with ID ${id}. Ignoring.`);
        return;
      }
      throw err;
    }
  }

  /**
   * Updates the attack bonus for a character class
   * @param characterClassId The ID of the character class
   * @param details The attack bonus details
   * @todo Implement this method
   */
  updateCharacterClassAttack(characterClassId: number, details: { attack_bonus: number }): void {
    console.warn(`Method not fully implemented: updateCharacterClassAttack for class ${characterClassId} with bonus ${details.attack_bonus}`);
    // Actual implementation would go here
  }

  // More methods to be added in subsequent updates...
}

// Direct exports of types for easier importing
export type CompleteCharacter = GameRules.Complete.Character;
export type ProcessedClassFeature = GameRules.Processed.ClassFeature;