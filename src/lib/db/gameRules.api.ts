import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/domain/types/supabase';
import { GameKernel } from '$lib/domain/kernel/GameKernel';
import { createDatabaseCapability } from '$lib/domain/capabilities/database';
import { OpenMode } from '$lib/domain/kernel/types';
import { EventBus } from '$lib/domain/kernel/EventBus';

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
 * game rules data in the database. It optimizes for query performance and follows
 * Unix architecture principles by treating database resources as files.
 * 
 * This implementation serves as the SINGLE ENTRY POINT for all database access
 * in the application, following Unix principles of file operations.
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

  /** Original Supabase client for backward compatibility */
  private originalClient: SupabaseClient<Database>;
  
  /** Kernel instance for Unix-style file operations */
  private kernel: GameKernel;
  
  /** Database capability reference */
  private dbCapability: any;
  
  /** Flag indicating if the Database Capability is available */
  private hasDbCapability: boolean = false;
  
  /** Debug mode flag */
  private debug: boolean;
  
  /**
   * Creates a new GameRulesAPI instance
   * @param options Additional options
   */
  constructor(
    options: { debug?: boolean } = {}
  ) {
    // Import Supabase client only when needed
    const { supabaseClient } = require('./supabaseClient');
    this.supabase = supabaseClient;
    this.originalClient = this.supabase;
    this.debug = options.debug || false;

    // Initialize the kernel with a private event bus
    this.kernel = new GameKernel({
      eventEmitter: new EventBus(this.debug),
      debug: this.debug,
      noFsEvents: true
    });

    // Set up the Database Capability
    this.initializeDatabaseCapability();

    if (this.debug) {
      console.log('[GameRulesAPI] Initialized with Database Capability');
    }
  }
  
  /**
   * Ensures parent directories for character paths exist.
   * 
   * IMPORTANT: Characters are represented as files, not directories.
   * This method only ensures the parent directory /proc/character exists.
   * 
   * @param characterId Character ID (used only for logging)
   * @returns Whether necessary directories exist or were created successfully
   */
  private ensureCharacterDirectoryExists(characterId: number): boolean {
    if (!this.hasDbCapability) {
      console.error(`[GameRulesAPI] Database capability not available for character ${characterId}`);
      return false;
    }
    
    // First ensure base directories exist
    if (!this.ensureBaseDirectoriesExist()) {
      console.error(`[GameRulesAPI] Failed to ensure base directories exist for character ${characterId}`);
      
      // Double-check specific path needed
      const characterDirPath = '/proc/character';
      const exists = this.kernel.exists(characterDirPath);
      
      if (!exists) {
        console.error(`[GameRulesAPI] Critical directory ${characterDirPath} does not exist, attempting direct creation`);
        
        // Last attempt to create directly 
        const result = this.kernel.mkdir(characterDirPath, true);
        if (!result.success) {
          console.error(`[GameRulesAPI] Final attempt to create ${characterDirPath} failed: ${result.errorMessage}`);
          return false;
        }
        
        console.log(`[GameRulesAPI] Successfully created ${characterDirPath} on final attempt`);
        return true;
      }
      
      // If we reach here, directory exists despite earlier failure
      console.log(`[GameRulesAPI] Character directory exists but ensureBaseDirectoriesExist() reported failure`);
      return true;
    }
    
    // Do NOT create a directory for the character ID itself
    // Characters are represented as files, not directories!
    return true;
  }
  
  /**
   * Ensures that the base directories (/proc and /proc/character) exist.
   * This is a critical method that makes multiple attempts to create required directories.
   * 
   * @returns Boolean indicating if the required directories exist or were created
   */
  private ensureBaseDirectoriesExist(): boolean {
    if (!this.hasDbCapability) {
      console.error('[GameRulesAPI] Database capability not available, cannot ensure directories');
      return false;
    }
    
    const procPath = '/proc';
    const characterDirPath = '/proc/character';
    
    // Check kernel is initialized
    if (!this.kernel) {
      console.error('[GameRulesAPI] Kernel not initialized');
      return false;
    }
    
    // First try the optimistic case - both directories exist
    if (this.kernel.exists(procPath) && this.kernel.exists(characterDirPath)) {
      return true;
    }
    
    // Create the directories with multiple attempts if needed
    const createDir = (path: string, description: string): boolean => {
      if (this.kernel.exists(path)) {
        return true; // Already exists
      }
      
      console.log(`[GameRulesAPI] ${description} does not exist, creating: ${path}`);
      
      // First attempt - use recursive flag
      const result = this.kernel.mkdir(path, true);
      if (result.success) {
        return true;
      }
      
      console.error(`[GameRulesAPI] Failed to create ${description}: ${result.errorMessage}`);
      
      // Second attempt - verify parent directory and try again
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      if (!this.kernel.exists(parentPath)) {
        console.log(`[GameRulesAPI] Parent directory ${parentPath} doesn't exist, creating it first`);
        const parentResult = this.kernel.mkdir(parentPath, true);
        if (!parentResult.success) {
          console.error(`[GameRulesAPI] Failed to create parent directory: ${parentResult.errorMessage}`);
          return false;
        }
      }
      
      // Try again after ensuring parent exists
      const retryResult = this.kernel.mkdir(path, false);
      if (retryResult.success) {
        return true;
      }
      
      // Final check - did it actually succeed despite reporting failure?
      if (this.kernel.exists(path)) {
        console.log(`[GameRulesAPI] Directory exists despite mkdir failure: ${path}`);
        return true;
      }
      
      console.error(`[GameRulesAPI] All attempts to create ${description} failed: ${retryResult.errorMessage}`);
      return false;
    };
    
    // Create /proc first
    if (!createDir(procPath, 'proc directory')) {
      return false;
    }
    
    // Then create /proc/character
    if (!createDir(characterDirPath, 'character directory')) {
      return false;
    }
    
    // Final verification
    const procExists = this.kernel.exists(procPath);
    const characterDirExists = this.kernel.exists(characterDirPath);
    
    if (!procExists || !characterDirExists) {
      console.error(`[GameRulesAPI] Directory verification failed: /proc=${procExists}, /proc/character=${characterDirExists}`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Ensures the entity directory (/entity) exists.
   * Creates it if it doesn't exist, with robust retries and error handling.
   * 
   * @returns Whether the directory exists or was created successfully
   */
  private ensureEntityDirectoryExists(): boolean {
    if (!this.hasDbCapability) {
      console.error('[GameRulesAPI] Database capability not available, cannot ensure entity directory');
      return false;
    }
    
    const entityPath = '/entity';
    
    // Check if kernel is initialized
    if (!this.kernel) {
      console.error('[GameRulesAPI] Kernel not initialized for entity directory check');
      return false;
    }
    
    // Check if /entity exists
    if (this.kernel.exists(entityPath)) {
      // Verify it's actually a directory
      const stats = this.kernel.stat(entityPath);
      if (stats && stats.isDirectory) {
        return true;
      }
      
      // It exists but is not a directory - this is bad
      console.error(`[GameRulesAPI] Path ${entityPath} exists but is not a directory, attempting to fix`);
      
      // Try to remove the file
      const unlinkResult = this.kernel.unlink(entityPath);
      if (unlinkResult !== 0) {
        console.error(`[GameRulesAPI] Failed to remove non-directory at ${entityPath}, error: ${unlinkResult}`);
        return false;
      }
      
      // Now try to create it again
      console.log(`[GameRulesAPI] Successfully removed non-directory at ${entityPath}, creating directory`);
    } else {
      console.log(`[GameRulesAPI] Entity directory does not exist, creating: ${entityPath}`);
    }
    
    // First attempt - simple mkdir
    const entityResult = this.kernel.mkdir(entityPath, true);
    if (entityResult.success) {
      console.log(`[GameRulesAPI] Successfully created entity directory: ${entityPath}`);
      return true;
    }
    
    console.error(`[GameRulesAPI] Failed to create entity directory: ${entityResult.errorMessage}`);
    
    // Second attempt - ensure parent directory (root) exists first
    const rootExists = this.kernel.exists('/');
    if (!rootExists) {
      console.error('[GameRulesAPI] Root directory does not exist, this is a serious error!');
      
      // Try to initialize filesystem by ensuring base directories exist
      this.ensureBaseDirectoriesExist();
      
      // Try again with non-recursive since we're at root
      const rootAttempt = this.kernel.mkdir(entityPath, false);
      if (!rootAttempt.success) {
        console.error(`[GameRulesAPI] All attempts to create entity directory failed: ${rootAttempt.errorMessage}`);
        return false;
      }
    }
    
    // Final check - did it actually succeed despite errors?
    if (this.kernel.exists(entityPath)) {
      const stats = this.kernel.stat(entityPath);
      if (stats && stats.isDirectory) {
        console.log(`[GameRulesAPI] Entity directory exists despite reporting creation failure: ${entityPath}`);
        return true;
      }
    }
    
    console.error(`[GameRulesAPI] All attempts to create ${entityPath} failed`);
    return false;
  }
  
  /**
   * Initialize the Database Capability
   * This is a critical initialization method that sets up all required filesystem paths.
   */
  private initializeDatabaseCapability(): void {
    try {
      console.log('[GameRulesAPI] Initializing Database Capability');
      
      // Create and register the Database Capability
      this.dbCapability = createDatabaseCapability({
        debug: this.debug
      });
      
      if (!this.dbCapability) {
        throw new Error('Failed to create Database Capability');
      }
      
      // Register capability with kernel
      this.kernel.registerCapability(this.dbCapability.id, this.dbCapability);
      this.hasDbCapability = true;
      
      // Ensure all critical directories exist
      this.initializeCriticalDirectories();
      
      console.log('[GameRulesAPI] Database Capability mounted successfully');
    } catch (error) {
      console.error('[GameRulesAPI] Failed to initialize Database Capability:', error);
      this.hasDbCapability = false;
    }
  }
  
  /**
   * Initialize all critical directories needed for the application.
   * This method ensures all required directory paths exist.
   */
  private initializeCriticalDirectories(): void {
    try {
      // Create the critical directory paths with status reporting
      const criticalPaths = [
        { path: '/proc', description: 'Process directory' },
        { path: '/proc/character', description: 'Character process directory' },
        { path: '/entity', description: 'Entity directory' },
        { path: '/dev', description: 'Device directory' }
      ];
      
      console.log('[GameRulesAPI] Ensuring critical directories exist...');
      
      // First check if base directories exist
      if (!this.ensureBaseDirectoriesExist()) {
        console.error('[GameRulesAPI] Failed to create base directories');
        
        // Critical error - try individual directory creation
        for (const { path, description } of criticalPaths) {
          const exists = this.kernel.exists(path);
          console.log(`[GameRulesAPI] ${description} (${path}): ${exists ? 'EXISTS' : 'MISSING'}`);
          
          if (!exists) {
            console.log(`[GameRulesAPI] Creating ${description}: ${path}`);
            const result = this.kernel.mkdir(path, true);
            console.log(`[GameRulesAPI] Creation result: ${result.success ? 'SUCCESS' : 'FAILED - ' + result.errorMessage}`);
          }
        }
      }
      
      // Also ensure entity directory exists
      if (!this.ensureEntityDirectoryExists()) {
        console.error('[GameRulesAPI] Failed to create entity directory');
      }
      
      // Final verification of all critical paths
      let allPathsExist = true;
      for (const { path, description } of criticalPaths) {
        const exists = this.kernel.exists(path);
        const stats = exists ? this.kernel.stat(path) : undefined;
        const isDirectory = stats ? stats.isDirectory : false;
        
        console.log(`[GameRulesAPI] Verification - ${description} (${path}): ${exists ? (isDirectory ? 'EXISTS (directory)' : 'EXISTS (not directory)') : 'MISSING'}`);
        
        if (!exists || !isDirectory) {
          allPathsExist = false;
        }
      }
      
      if (!allPathsExist) {
        console.error('[GameRulesAPI] Some critical directories are still missing after initialization');
        if (this.hasDbCapability) {
          console.warn('[GameRulesAPI] Database capability may not function correctly');
        }
      } else {
        console.log('[GameRulesAPI] All critical directories verified successfully');
      }
    } catch (error) {
      console.error('[GameRulesAPI] Error during directory initialization:', error);
    }
  }

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
   * Fetches complete character data with all related entities.
   *
   * @remarks
   * This method uses the simpler getCharacterByFileOperation method,
   * which implements the Unix-style file operations approach.
   *
   * IMPORTANT: Characters are represented as files, not directories!
   *
   * @param characterId The ID of the character to fetch
   * @returns A complete character object with all related data
   */
  async getCompleteCharacterData(characterId: number): Promise<GameRules.Complete.Character | null> {
    try {
      if (this.debug) {
        console.log(`[GameRulesAPI] Getting complete data for character ${characterId}`);
      }

      // Use the new Unix file operation method
      const character = await this.getCharacterByFileOperation(characterId);

      // Return the character data (the method handles fallbacks internally)
      return character;
    } catch (err: any) {
      console.error(`[GameRulesAPI] Error fetching character data: ${err.message || err}`);
      // Fall back to legacy implementation in case of unexpected errors
      return this.legacyGetCompleteCharacterData(characterId);
    }
  }
  
  /**
   * Legacy implementation of getCompleteCharacterData using direct database queries.
   * This is used as a fallback when the DatabaseCapability is not available.
   * 
   * @param characterId The ID of the character to fetch
   * @returns A complete character object with all related data
   */
  async legacyGetCompleteCharacterData(characterId: number): Promise<GameRules.Complete.Character | null> {
    try {
      if (this.debug) {
        console.log(`[GameRulesAPI] Using legacy method for character ${characterId}`);
      }
      
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

  // Rest of the class methods follow...

  /**
   * Get the kernel instance
   * @returns Kernel instance with Database Capability mounted
   */
  getKernel(): GameKernel {
    return this.kernel;
  }

  /**
   * Get the full path for a database resource following Unix convention
   * @param resourceType Type of resource (character, ability, etc.)
   * @param id Resource ID
   * @param subResource Optional sub-resource name
   * @param subId Optional sub-resource ID
   * @returns Unix-style file path
   */
  getFileSystemPath(
    resourceType: string,
    id: number | string,
    subResource?: string,
    subId?: number | string
  ): string {
    // Build path based on resource type
    switch (resourceType) {
      case 'character':
        const characterPath = `/proc/character/${id}`;
        return subResource
          ? (subId ? `${characterPath}/${subResource}/${subId}` : `${characterPath}/${subResource}`)
          : characterPath;

      case 'entity':
        const entityPath = `/entity/${id}`;
        return subResource
          ? (subId ? `${entityPath}/${subResource}/${subId}` : `${entityPath}/${subResource}`)
          : entityPath;

      case 'ability':
      case 'class':
      case 'feat':
      case 'skill':
        return `/etc/schema/${resourceType}/${id === 'all' ? 'list' : id}`;

      default:
        return `/proc/${resourceType}/${id}`;
    }
  }

  /**
   * Get a character by ID using Unix file operations
   * @param characterId Character ID
   * @returns Character data or null if not found
   */
  async getCharacterByFileOperation(characterId: number): Promise<CompleteCharacter | null> {
    try {
      if (this.debug) {
        console.log(`[GameRulesAPI] Getting character by file operation: ${characterId}`);
      }

      // Get file path
      const path = this.getFileSystemPath('character', characterId);

      // Check if file exists
      if (!this.kernel.exists(path)) {
        // If file doesn't exist, try to create it from database
        if (this.debug) {
          console.log(`[GameRulesAPI] Character file doesn't exist: ${path}, fetching from database`);
        }

        // Fetch from database using legacy method
        const characterData = await this.legacyGetCompleteCharacterData(characterId);
        if (!characterData) {
          if (this.debug) {
            console.log(`[GameRulesAPI] No character data found in database for ID: ${characterId}`);
          }
          return null;
        }

        // Make sure parent directories exist
        this.ensureCharacterDirectoryExists(characterId);

        // Create the character file
        if (this.debug) {
          console.log(`[GameRulesAPI] Creating character file at ${path}`);
        }

        const createResult = this.kernel.create(path, characterData);
        if (!createResult.success) {
          console.error(`[GameRulesAPI] Failed to create character file: ${createResult.errorMessage}`);
          return characterData;
        }
      }

      // Open the file
      const fd = this.kernel.open(path, OpenMode.READ);
      if (fd < 0) {
        console.error(`[GameRulesAPI] Failed to open character file: ${fd}`);
        return this.legacyGetCompleteCharacterData(characterId);
      }

      // Read the character data
      const buffer: any = {};
      const [result] = this.kernel.read(fd, buffer);

      // Close the file descriptor
      this.kernel.close(fd);

      if (result !== 0) {
        console.error(`[GameRulesAPI] Failed to read character file: ${result}`);
        return this.legacyGetCompleteCharacterData(characterId);
      }

      return buffer as CompleteCharacter;
    } catch (error) {
      console.error(`[GameRulesAPI] Error getting character by file operation: ${error}`);
      return this.legacyGetCompleteCharacterData(characterId);
    }
  }

  /**
   * Update a character using Unix file operations
   * @param characterId Character ID
   * @param data Character data to update
   * @returns True if successful, false otherwise
   */
  async updateCharacterByFileOperation(characterId: number, data: Partial<CompleteCharacter>): Promise<boolean> {
    try {
      if (this.debug) {
        console.log(`[GameRulesAPI] Updating character by file operation: ${characterId}`);
      }

      // Get file path
      const path = this.getFileSystemPath('character', characterId);

      // Get current character data
      const currentCharacter = await this.getCharacterByFileOperation(characterId);
      if (!currentCharacter) {
        console.error(`[GameRulesAPI] Cannot update non-existent character: ${characterId}`);
        return false;
      }

      // Merge the updated data with the current data
      const updatedCharacter = { ...currentCharacter, ...data };

      // Open the file for writing
      const fd = this.kernel.open(path, OpenMode.WRITE);
      if (fd < 0) {
        console.error(`[GameRulesAPI] Failed to open character file for writing: ${fd}`);
        return false;
      }

      // Write the updated character data
      const result = this.kernel.write(fd, updatedCharacter);

      // Close the file descriptor
      this.kernel.close(fd);

      if (result !== 0) {
        console.error(`[GameRulesAPI] Failed to write character file: ${result}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`[GameRulesAPI] Error updating character by file operation: ${error}`);
      return false;
    }
  }

  /**
   * List all characters using Unix file operations
   * @returns Array of character summaries
   */
  async listCharactersByFileOperation(): Promise<{ id: number; name: string }[]> {
    try {
      if (this.debug) {
        console.log(`[GameRulesAPI] Listing characters by file operation`);
      }

      // Get file path
      const path = '/proc/character/list';

      // Check if list file exists
      if (!this.kernel.exists(path)) {
        // If list file doesn't exist, create it from database
        if (this.debug) {
          console.log(`[GameRulesAPI] Character list file doesn't exist: ${path}, creating from database`);
        }

        // Fetch all characters using legacy method
        const characters = await this.getAllGameCharacter();

        // Make sure parent directories exist
        this.ensureBaseDirectoriesExist();

        // Create character summaries
        const characterSummaries = characters.map(char => ({
          id: char.id,
          name: char.name
        }));

        // Create the list file
        const createResult = this.kernel.create(path, { characters: characterSummaries });
        if (!createResult.success) {
          console.error(`[GameRulesAPI] Failed to create character list file: ${createResult.errorMessage}`);
          return characterSummaries;
        }
      }

      // Open the list file
      const fd = this.kernel.open(path, OpenMode.READ);
      if (fd < 0) {
        console.error(`[GameRulesAPI] Failed to open character list file: ${fd}`);

        // Fall back to legacy method
        const characters = await this.getAllGameCharacter();
        return characters.map(char => ({ id: char.id, name: char.name }));
      }

      // Read the list data
      const buffer: any = {};
      const [result] = this.kernel.read(fd, buffer);

      // Close the file descriptor
      this.kernel.close(fd);

      if (result !== 0) {
        console.error(`[GameRulesAPI] Failed to read character list file: ${result}`);

        // Fall back to legacy method
        const characters = await this.getAllGameCharacter();
        return characters.map(char => ({ id: char.id, name: char.name }));
      }

      return buffer.characters || [];
    } catch (error) {
      console.error(`[GameRulesAPI] Error listing characters by file operation: ${error}`);

      // Fall back to legacy method
      const characters = await this.getAllGameCharacter();
      return characters.map(char => ({ id: char.id, name: char.name }));
    }
  }

  /**
   * Get ability scores for a character using Unix file operations
   * @param characterId Character ID
   * @returns Object with ability scores or null if not found
   */
  async getCharacterAbilitiesByFileOperation(characterId: number): Promise<Record<string, number> | null> {
    try {
      if (this.debug) {
        console.log(`[GameRulesAPI] Getting abilities for character by file operation: ${characterId}`);
      }

      // Get file path
      const path = this.getFileSystemPath('character', characterId, 'abilities');

      // Check if character exists
      const characterPath = this.getFileSystemPath('character', characterId);
      if (!this.kernel.exists(characterPath)) {
        if (this.debug) {
          console.log(`[GameRulesAPI] Character ${characterId} doesn't exist`);
        }
        return null;
      }

      // Open the character file to extract abilities
      const fd = this.kernel.open(characterPath, OpenMode.READ);
      if (fd < 0) {
        console.error(`[GameRulesAPI] Failed to open character file: ${fd}`);
        return null;
      }

      // Read the character data
      const buffer: any = {};
      const [result] = this.kernel.read(fd, buffer);

      // Close the file descriptor
      this.kernel.close(fd);

      if (result !== 0) {
        console.error(`[GameRulesAPI] Failed to read character file: ${result}`);
        return null;
      }

      // Extract abilities from the character data
      const abilityScores: Record<string, number> = {};

      if (buffer.game_character_ability) {
        for (const ability of buffer.game_character_ability) {
          if (ability.ability) {
            abilityScores[ability.ability.name.toLowerCase()] = ability.value || 10;
          }
        }
      }

      return abilityScores;
    } catch (error) {
      console.error(`[GameRulesAPI] Error getting character abilities by file operation: ${error}`);
      return null;
    }
  }

  /**
   * Get entity by ID using Unix file operations
   * @param entityId Entity ID
   * @returns Entity data or null if not found
   */
  async getEntityByFileOperation(entityId: string): Promise<any | null> {
    try {
      if (this.debug) {
        console.log(`[GameRulesAPI] Getting entity by file operation: ${entityId}`);
      }

      // Get file path
      const path = this.getFileSystemPath('entity', entityId);

      // Check if file exists
      if (!this.kernel.exists(path)) {
        if (this.debug) {
          console.log(`[GameRulesAPI] Entity file doesn't exist: ${path}`);
        }
        return null;
      }

      // Open the file
      const fd = this.kernel.open(path, OpenMode.READ);
      if (fd < 0) {
        console.error(`[GameRulesAPI] Failed to open entity file: ${fd}`);
        return null;
      }

      // Read the entity data
      const buffer: any = {};
      const [result] = this.kernel.read(fd, buffer);

      // Close the file descriptor
      this.kernel.close(fd);

      if (result !== 0) {
        console.error(`[GameRulesAPI] Failed to read entity file: ${result}`);
        return null;
      }

      return buffer;
    } catch (error) {
      console.error(`[GameRulesAPI] Error getting entity by file operation: ${error}`);
      return null;
    }
  }

  /**
   * Get all entities of a specific type using Unix file operations
   * @param entityType Type of entity to retrieve
   * @returns Array of entities or empty array if none found
   */
  async getAllEntitiesByType(entityType: string): Promise<any[]> {
    try {
      if (this.debug) {
        console.log(`[GameRulesAPI] Getting all entities by type: ${entityType}`);
      }

      // Get file path
      const path = this.getFileSystemPath(entityType, 'all');

      // Open the file
      const fd = this.kernel.open(path, OpenMode.READ);
      if (fd < 0) {
        if (this.debug) {
          console.log(`[GameRulesAPI] No global list file found for entity type ${entityType}: ${fd}`);
        }

        // Fall back to legacy method
        switch (entityType) {
          case 'ability':
            return this.getAllAbility();
          case 'skill':
            return this.getAllSkill();
          case 'feat':
            return this.getAllFeat();
          case 'class':
            return this.getAllClass();
          default:
            return [];
        }
      }

      // Read the entity list data
      const buffer: any = {};
      const [result] = this.kernel.read(fd, buffer);

      // Close the file descriptor
      this.kernel.close(fd);

      if (result !== 0) {
        console.error(`[GameRulesAPI] Failed to read entity list file: ${result}`);
        return [];
      }

      return buffer.entities || [];
    } catch (error) {
      console.error(`[GameRulesAPI] Error getting entities by type: ${error}`);
      return [];
    }
  }

  /**
   * Get the Supabase client for direct database access.
   *
   * @deprecated This method is provided only for compatibility during transition to Unix architecture.
   * Use kernel file operations and database capability instead, such as:
   * - kernel.open('/path/to/resource')
   * - kernel.read(fd, buffer)
   * - kernel.write(fd, data)
   *
   * Example:
   * const fd = kernel.open('/proc/character/1', OpenMode.READ);
   * const buffer = {};
   * kernel.read(fd, buffer);
   * kernel.close(fd);
   *
   * @returns The original Supabase client instance
   */
  /**
   * Returns the internal Supabase client for direct database access.
   *
   * @deprecated This method is provided only for backward compatibility during transition to Unix architecture.
   * Use kernel file operations and database capability instead. This method will be removed in a future version.
   *
   * Preferred Unix-style alternatives:
   * - kernel.open('/proc/character/1', OpenMode.READ)
   * - kernel.read(fd)
   * - kernel.write(fd, data)
   * - kernel.close(fd)
   *
   * @returns The Supabase client instance
   */
  getSupabaseClient(): SupabaseClient<Database> {
    console.warn('DEPRECATED: getSupabaseClient() is deprecated and will be removed in a future version.');
    console.warn('Use kernel file operations instead of direct Supabase access.');
    console.warn('Example: kernel.open("/proc/character/1", OpenMode.READ), kernel.read(fd), kernel.close(fd)');

    return this.supabase;
  }

  /**
   * Gets all game characters
   * @returns All game characters
   */
  async getAllGameCharacter(): Promise<Row<'game_character'>[]> {
    // Use file operations instead of direct database access
    const characters = await this.listCharactersByFileOperation();

    // Convert to the expected return type
    const result = await Promise.all(
      characters.map(async (char) => {
        const characterData = await this.getCharacterByFileOperation(char.id);
        return characterData || { id: char.id, name: char.name };
      })
    );

    return result.filter(Boolean) as Row<'game_character'>[];
  }

  /*
   * REMOVED: getSupabaseClient() method has been removed as part of the transition to Unix-style
   * file operations. All database access should now use kernel file operations
   * (open, read, write, close) on database resources instead.
   *
   * To access database resources:
   * - kernel.open('/proc/character/{id}', OpenMode.READ) - Get a character by ID
   * - kernel.open('/proc/character/list', OpenMode.READ) - List all characters
   * - kernel.open('/entity/{entity_id}/abilities', OpenMode.READ) - Get entity abilities
   */
}

// Direct exports of types for easier importing
export type CompleteCharacter = GameRules.Complete.Character;
export type ProcessedClassFeature = GameRules.Processed.ClassFeature;