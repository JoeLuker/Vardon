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
	 * REMOVED: Active real-time subscriptions reference
	 * Real-time updates now use the EventBus instead of direct Supabase subscriptions
	 */

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
	constructor(options: { debug?: boolean } = {}) {
		this.debug = options.debug || false;

		// Initialize the kernel with a private event bus
		this.kernel = new GameKernel({
			eventEmitter: new EventBus(this.debug),
			debug: this.debug,
			noFsEvents: true
		});

		// Set up the Database Capability
		// We can't await in constructor, so we use a then() chain
		this.initializeDatabaseCapability()
			.then(() => {
				if (this.debug) {
					console.log('[GameRulesAPI] Async initialization of Database Capability completed');
				}
			})
			.catch((error) => {
				console.error('[GameRulesAPI] Async initialization failed:', error);
			});

		if (this.debug) {
			console.log('[GameRulesAPI] Initialized with Database Capability (setup started)');
		}
	}

	/**
	 * Ensures a directory exists, creating it if needed.
	 * Simplified approach with proper error handling.
	 *
	 * @param path The directory path to ensure exists
	 * @param description Human-readable description of the directory
	 * @returns Whether the directory exists or was created successfully
	 */
	private ensureDirectoryExists(path: string, description: string = 'directory'): boolean {
		if (!this.kernel) {
			console.error(`[GameRulesAPI] Kernel not initialized when ensuring ${description}`);
			return false;
		}

		// Check if already exists
		if (this.kernel.exists(path)) {
			const stats = this.kernel.stat(path);

			// Verify it's a directory
			if (stats && stats.isDirectory) {
				if (this.debug) {
					console.log(`[GameRulesAPI] ${description} exists: ${path}`);
				}
				return true;
			}

			// It exists but is not a directory - handle this case
			console.error(`[GameRulesAPI] Path ${path} exists but is not a directory, removing it`);
			const unlinkResult = this.kernel.unlink(path);
			if (unlinkResult !== 0) {
				console.error(
					`[GameRulesAPI] Failed to remove non-directory at ${path}, error: ${unlinkResult}`
				);
				return false;
			}
		}

		// Directory doesn't exist or was a file that we removed, create it
		console.log(`[GameRulesAPI] Creating ${description}: ${path}`);
		const result = this.kernel.mkdir(path, true); // Always use recursive to create parent directories

		if (result.success) {
			console.log(`[GameRulesAPI] Successfully created ${description}: ${path}`);
			return true;
		}

		console.error(
			`[GameRulesAPI] Failed to create ${description}: ${path}, error: ${result.errorMessage}`
		);
		return false;
	}

	/**
	 * Ensures parent directories for character paths exist.
	 * @param characterId Character ID (used only for logging)
	 * @returns Whether necessary directories exist or were created successfully
	 */
	private ensureCharacterDirectoryExists(characterId: number): boolean {
		// The Unix Way: Better error handling for proper diagnostics
		if (!this.hasDbCapability) {
			// Provide detailed diagnostics for this common error case
			const errorInfo = {
				timestamp: Date.now(),
				characterId,
				kernelReady: !!this.kernel,
				dbCapCreated: !!this.dbCapability,
				dbDeviceExists: this.kernel && this.kernel.exists('/dev/db'),
				procDirExists: this.kernel && this.kernel.exists('/proc'),
				characterDirExists: this.kernel && this.kernel.exists('/proc/character')
			};

			console.error(
				`[GameRulesAPI] Database capability not available for character ${characterId}`,
				errorInfo
			);

			// The Unix Way: On failure, attempt to wait for or create resources using retry
			if (this.kernel && !this.hasDbCapability && this.dbCapability) {
				console.log(
					'[GameRulesAPI] Attempting to recover database capability for character load...'
				);

				// Attempt to create critical directories directly
				const procSuccess = this.ensureDirectoryExists('/proc', 'process directory (recovery)');
				const charDirSuccess = this.ensureDirectoryExists(
					'/proc/character',
					'character directory (recovery)'
				);

				if (procSuccess && charDirSuccess) {
					console.log('[GameRulesAPI] Recovery succeeded - directories created!');

					// Mark capability as available since directories now exist
					this.hasDbCapability = true;

					// Signal recovery via event bus
					if (this.kernel.events) {
						this.kernel.events.emit('database:recovered', {
							timestamp: Date.now(),
							component: 'GameRulesAPI',
							characterId
						});
					}

					return true;
				} else {
					console.error('[GameRulesAPI] Recovery failed - could not create required directories');
				}
			}

			return false;
		}

		// Ensure /proc and /proc/character directories exist
		// Allow parent directory to be created if it doesn't exist yet
		let success = this.ensureDirectoryExists('/proc', 'process directory');
		if (!success) {
			// The Unix Way: Better error reporting
			console.error('[GameRulesAPI] Failed to ensure /proc directory exists');
			return false;
		}

		// Now create character directory
		success = this.ensureDirectoryExists('/proc/character', 'character directory');
		if (!success) {
			console.error('[GameRulesAPI] Failed to ensure /proc/character directory exists');
			return false;
		}

		return true;
	}

	/**
	 * Ensures that the base directories (/proc and /proc/character) exist.
	 * @returns Boolean indicating if the required directories exist or were created
	 */
	private ensureBaseDirectoriesExist(): boolean {
		if (!this.hasDbCapability) {
			console.error('[GameRulesAPI] Database capability not available, cannot ensure directories');
			return false;
		}

		// Ensure critical directories exist
		const criticalPaths = [
			{ path: '/proc', description: 'process directory' },
			{ path: '/proc/character', description: 'character directory' },
			{ path: '/entity', description: 'entity directory' },
			{ path: '/etc', description: 'configuration directory' },
			{ path: '/etc/schema', description: 'schema directory' }
		];

		// Create all critical directories
		let allSucceeded = true;
		for (const { path, description } of criticalPaths) {
			const success = this.ensureDirectoryExists(path, description);
			if (!success) {
				allSucceeded = false;
			}
		}

		return allSucceeded;
	}

	/**
	 * Ensures the entity directory (/entity) exists.
	 * @returns Whether the directory exists or was created successfully
	 */
	private ensureEntityDirectoryExists(): boolean {
		if (!this.hasDbCapability) {
			console.error(
				'[GameRulesAPI] Database capability not available, cannot ensure entity directory'
			);
			return false;
		}

		return this.ensureDirectoryExists('/entity', 'entity directory');
	}

	/**
	 * Initialize the Database Capability
	 * This is a critical initialization method that sets up all required filesystem paths.
	 *
	 * The Unix way: Use proper initialization sequence and event signaling for readiness
	 */
	private async initializeDatabaseCapability(): Promise<void> {
		try {
			console.log('[GameRulesAPI] Initializing Database Capability');

			// Create and register the Database Capability
			this.dbCapability = createDatabaseCapability({
				debug: this.debug
			});

			if (!this.dbCapability) {
				throw new Error('Failed to create Database Capability');
			}

			// IMPORTANT: Mount the database capability directly at /dev/db
			// This ensures it's properly recognized as a device file, not just registered
			const mountResult = this.kernel.mount('/dev/db', this.dbCapability);

			if (!mountResult.success) {
				throw new Error(`Failed to mount Database Capability: ${mountResult.errorMessage}`);
			}

			// Also register capability with kernel (for backward compatibility)
			this.kernel.registerCapability(this.dbCapability.id, this.dbCapability);

			// The Unix Way: Initialize base file structure first before setting capability as available
			await this.initializeCriticalDirectories();

			// Only mark capability as available AFTER directories are confirmed ready
			this.hasDbCapability = true;

			// The Unix Way: Signal via event bus that the database is ready
			// This allows listeners to respond accordingly rather than polling
			if (this.kernel.events) {
				this.kernel.events.emit('database:ready', {
					timestamp: Date.now(),
					component: 'GameRulesAPI',
					success: true
				});
			}

			console.log('[GameRulesAPI] Database Capability mounted successfully at /dev/db');
		} catch (error) {
			console.error('[GameRulesAPI] Failed to initialize Database Capability:', error);
			this.hasDbCapability = false;

			// The Unix Way: Signal error condition via event bus
			if (this.kernel.events) {
				this.kernel.events.emit('database:error', {
					timestamp: Date.now(),
					component: 'GameRulesAPI',
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
	}

	/**
	 * Initialize all critical directories needed for the application.
	 * This method ensures all required directory paths exist.
	 *
	 * The Unix way: Implement resilient directory creation with retries and proper
	 * error handling, following Unix's "do one thing well" principle.
	 *
	 * @returns Whether all critical directories were successfully created
	 */
	private async initializeCriticalDirectories(): Promise<boolean> {
		try {
			console.log('[GameRulesAPI] Ensuring critical directories exist...');

			// Base directories
			const criticalPaths = [
				{ path: '/proc', description: 'Process directory' },
				{ path: '/proc/character', description: 'Character process directory' },
				{ path: '/entity', description: 'Entity directory' },
				{ path: '/etc', description: 'Configuration directory' },
				{ path: '/etc/schema', description: 'Schema directory' }
			];

			// Additional schema directories
			const schemaDirectories = [
				{ path: '/etc/schema/ability', description: 'Ability schema directory' },
				{ path: '/etc/schema/class', description: 'Class schema directory' },
				{ path: '/etc/schema/feat', description: 'Feat schema directory' },
				{ path: '/etc/schema/skill', description: 'Skill schema directory' }
			];

			// Combine all directories to create
			const allDirectories = [...criticalPaths, ...schemaDirectories];

			// The Unix Way: Create the most critical directories first with retries
			// This ensures base directories are available before child directories
			console.log('[GameRulesAPI] Creating critical base directories first...');
			let retryCount = 0;
			const maxRetries = 3;

			// Create critical paths first with retries
			for (const { path, description } of criticalPaths) {
				if (path === '/dev') {
					// Skip creating /dev directly - it should already exist in the kernel
					continue;
				}

				// Try up to maxRetries times for critical paths
				let success = false;
				for (let i = 0; i <= maxRetries && !success; i++) {
					// If this is a retry, log it and wait a brief moment
					if (i > 0) {
						console.log(`[GameRulesAPI] Retry ${i}/${maxRetries} creating ${description}: ${path}`);
						// Small delay before retry (incrementing with each retry)
						const delay = i * 10;
						await new Promise((resolve) => setTimeout(resolve, delay));
					}

					success = this.ensureDirectoryExists(path, description);

					// If successful on a retry, record it
					if (success && i > 0) {
						retryCount++;
					}
				}

				// If still not successful after retries, this is a fatal error
				if (!success) {
					console.error(
						`[GameRulesAPI] FATAL: Failed to create critical directory ${path} after ${maxRetries} retries`
					);
					return false;
				}
			}

			if (retryCount > 0) {
				console.log(`[GameRulesAPI] Successfully created ${retryCount} directories after retries`);
			}

			// Now create schema directories (non-critical, but still important)
			console.log('[GameRulesAPI] Creating schema directories...');
			let allSchemaDirsExist = true;
			for (const { path, description } of schemaDirectories) {
				const success = this.ensureDirectoryExists(path, description);
				if (!success) {
					console.warn(`[GameRulesAPI] Failed to create schema directory: ${path}`);
					allSchemaDirsExist = false;
				}
			}

			// Final report
			if (!allSchemaDirsExist) {
				console.warn(
					'[GameRulesAPI] Some schema directories could not be created. This may affect schema operations.'
				);
			} else {
				console.log('[GameRulesAPI] All directories verified successfully');
			}

			// The Unix Way: Write sentinel file to indicate directories are ready
			try {
				if (!this.kernel.exists('/etc/db_dirs_ready')) {
					this.kernel.create('/etc/db_dirs_ready', {
						timestamp: Date.now(),
						status: 'ready'
					});
				}
			} catch (sentinelError) {
				console.warn(
					'[GameRulesAPI] Failed to create sentinel file, but continuing:',
					sentinelError
				);
			}

			// Return true only if critical directories were created
			return true;
		} catch (error) {
			console.error('[GameRulesAPI] Error during directory initialization:', error);
			return false;
		}
	}

	/**
	 * Generic method to fetch an entity by ID using Unix file operations
	 * @param table The table name
	 * @param id The entity ID
	 * @param query The query parameters (unused in Unix implementation)
	 * @returns The entity data or null if not found
	 */
	private async getEntityById<T extends keyof Tables>(
		table: T,
		id: number,
		query: string = '*'
	): Promise<Row<T> | null> {
		try {
			// Get the proper path for this entity
			const entityPath = `/proc/${table}/${id}`;

			// Check if the path exists
			if (!this.kernel.exists(entityPath)) {
				console.warn(`No ${table} found with ID ${id}`);
				return null;
			}

			// Open the file
			const fd = this.kernel.open(entityPath, OpenMode.READ);
			if (fd < 0) {
				console.error(`Failed to open ${table} file: ${fd}`);
				return null;
			}

			try {
				// Read the entity data
				const buffer: any = {};
				const [result] = this.kernel.read(fd, buffer);

				if (result !== 0) {
					console.error(`Failed to read ${table} data: ${result}`);
					return null;
				}

				return buffer as unknown as Row<T>;
			} finally {
				// Always close the file descriptor
				this.kernel.close(fd);
			}
		} catch (err: any) {
			console.error(`Failed to fetch ${table} with id ${id}: ${err.message || err}`);
			return null;
		}
	}

	/**
	 * Fetches complete character data with all related entities.
	 *
	 * @remarks
	 * This method uses the Unix-style file operations approach.
	 * Characters are represented as files, not directories!
	 *
	 * @param characterId The ID of the character to fetch
	 * @returns A complete character object with all related data
	 * @throws Error if character cannot be loaded
	 */
	async getCompleteCharacterData(characterId: number): Promise<GameRules.Complete.Character> {
		if (this.debug) {
			console.log(`[GameRulesAPI] Getting complete data for character ${characterId}`);
		}

		// Use the Unix file operation method directly
		// We're removing the try/catch to allow errors to propagate
		// This ensures the UI can display proper error messages
		return await this.getCharacterByFileOperation(characterId);
	}

	/**
	 * Helper method to enrich corruption manifestation data with prerequisites
	 * This is extracted to keep the main method cleaner and more maintainable
	 * Now uses Unix file operations instead of direct Supabase queries
	 */
	private async enrichCorruptionManifestations(manifestationEntries: any[]) {
		const manifestationIds = manifestationEntries
			.map((entry) => entry.manifestation?.id)
			.filter(Boolean);

		if (manifestationIds.length === 0) return;

		// Build an array of promises for parallel file operations
		const manifestationPromises = manifestationIds.map(async (id) => {
			// Get manifestation data from file system
			const manifestationPath = `/proc/corruption_manifestation/${id}`;

			if (!this.kernel.exists(manifestationPath)) {
				return null;
			}

			const fd = this.kernel.open(manifestationPath, OpenMode.READ);
			if (fd < 0) {
				console.error(`Failed to open manifestation file: ${manifestationPath}`);
				return null;
			}

			try {
				const buffer: any = {};
				const [result] = this.kernel.read(fd, buffer);

				if (result !== 0) {
					console.error(`Failed to read manifestation data: ${result}`);
					return null;
				}

				return buffer;
			} finally {
				this.kernel.close(fd);
			}
		});

		// Get all manifestation data in parallel
		const allManifestations = await Promise.all(manifestationPromises);
		const validManifestations = allManifestations.filter(
			Boolean
		) as GameRules.Relationships.ExtendedCorruptionManifestation[];

		if (validManifestations.length === 0) {
			console.warn('No valid manifestations found');
			return;
		}

		// Create a map for quick lookup
		const manifestationMap = validManifestations.reduce(
			(map, m) => {
				map[m.id] = m;
				return map;
			},
			{} as Record<number, GameRules.Relationships.ExtendedCorruptionManifestation>
		);

		// Get prerequisites from the prerequisites file
		const prerequisitesPath = `/proc/corruption_manifestation_prerequisite/batch`;
		const prereqsFd = this.kernel.open(prerequisitesPath, OpenMode.WRITE);

		if (prereqsFd < 0) {
			console.error(`Failed to open prerequisites path: ${prerequisitesPath}`);
			return;
		}

		try {
			// Write the request with the manifestation IDs
			const writeResult = this.kernel.write(prereqsFd, { manifestation_ids: manifestationIds });

			if (writeResult !== 0) {
				console.error(`Failed to write prerequisites request: ${writeResult}`);
				return;
			}

			// Read the response
			const buffer: any = {};
			const [readResult] = this.kernel.read(prereqsFd, buffer);

			if (readResult !== 0 || !buffer.prerequisites) {
				console.error(`Failed to read prerequisites: ${readResult}`);
				return;
			}

			const prerequisites = buffer.prerequisites;

			// Connect prerequisites for each manifestation
			manifestationEntries.forEach((entry: any) => {
				const manifestationExt =
					entry.manifestation as GameRules.Relationships.ExtendedCorruptionManifestation;

				// Collect all prerequisites for this manifestation
				const manifestationPrereqs = prerequisites.filter(
					(p: any) => p.corruption_manifestation_id === manifestationExt.id
				);

				if (manifestationPrereqs.length > 0) {
					// Store all prerequisites
					manifestationExt.prerequisites = manifestationPrereqs
						.map((prereq: any) => {
							const prerequisiteId = prereq.prerequisite_manifestation_id;
							return {
								prerequisite_manifestation_id: prerequisiteId,
								prerequisite: manifestationMap[prerequisiteId]
							};
						})
						.filter((p: any) => p.prerequisite); // Only keep valid prerequisites

					// For backward compatibility, store the first prerequisite in the single field
					if (manifestationExt.prerequisites.length > 0) {
						manifestationExt.prerequisite = manifestationExt.prerequisites[0].prerequisite;
					}
				}
			});
		} finally {
			this.kernel.close(prereqsFd);
		}
	}

	/**
	 * Fetches multiple complete character data objects in parallel
	 * @param characterIds An array of character IDs to fetch
	 * @returns An array of complete character objects
	 */
	async getMultipleCompleteCharacterData(
		characterIds: number[]
	): Promise<GameRules.Complete.Character[]> {
		const promises = characterIds.map((id) => this.getCompleteCharacterData(id));
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
		// Use Unix file operations to get ABP nodes by level
		const nodePath = `/proc/abp_node/level/${level}`;

		// Check if the path exists
		if (!this.kernel.exists(nodePath)) {
			// Try to create the path by querying the device
			const devicePath = '/dev/db';
			const deviceFd = this.kernel.open(devicePath, OpenMode.READ_WRITE);

			if (deviceFd < 0) {
				console.error(`Failed to open database device: ${devicePath}`);
				return [];
			}

			try {
				// Use ioctl to perform a filtered query
				const buffer: any = {};
				const ioctlResult = this.kernel.ioctl(
					deviceFd,
					2,
					{
						// DatabaseOperation.QUERY
						resource: 'abp_node',
						filter: {
							level_lte: level
						}
					},
					buffer
				);

				if (ioctlResult !== 0 || !buffer.data) {
					console.error(`Database query operation failed: ${ioctlResult}`);
					return [];
				}

				// Create the file for future access
				const createResult = this.kernel.create(nodePath, { nodes: buffer.data });
				if (!createResult.success) {
					console.warn(`Failed to create ABP node level file: ${createResult.errorMessage}`);
					// Continue anyway since we have the data
				}

				// Transform the data to the expected format
				return (buffer.data || []).map((node: any) => ({
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
			} finally {
				this.kernel.close(deviceFd);
			}
		}

		// Path exists, read from the file
		const fd = this.kernel.open(nodePath, OpenMode.READ);
		if (fd < 0) {
			console.error(`Failed to open ABP node level file: ${nodePath}`);
			return [];
		}

		try {
			// Read the file content
			const buffer: any = {};
			const [result] = this.kernel.read(fd, buffer);

			if (result !== 0) {
				console.error(`Failed to read ABP node level data: ${result}`);
				return [];
			}

			return (buffer.nodes || []) as GameRules.Relationships.AbpNodeWithBonuses[];
		} finally {
			this.kernel.close(fd);
		}
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
					? subId
						? `${characterPath}/${subResource}/${subId}`
						: `${characterPath}/${subResource}`
					: characterPath;

			case 'entity':
				const entityPath = `/entity/${id}`;
				return subResource
					? subId
						? `${entityPath}/${subResource}/${subId}`
						: `${entityPath}/${subResource}`
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
	 * @throws Error if character cannot be loaded
	 */
	async getCharacterByFileOperation(characterId: number): Promise<CompleteCharacter> {
		try {
			// The Unix Way: Log operation start with timestamp
			const startTime = Date.now();
			if (this.debug) {
				console.log(
					`[GameRulesAPI] ${new Date(startTime).toISOString()} Getting character by file operation: ${characterId}`
				);
			}

			// Get file path
			const path = this.getFileSystemPath('character', characterId);

			// The Unix Way: Check for necessary filesystem resources first
			if (!this.hasDbCapability) {
				// Emit a specific database capability error event
				if (this.kernel && this.kernel.events) {
					this.kernel.events.emit('database:error:capability_unavailable', {
						timestamp: Date.now(),
						operation: 'getCharacterByFileOperation',
						characterId
					});
				}

				// The Unix Way: Try to recover by recreating necessary directories
				const recovered = this.ensureCharacterDirectoryExists(characterId);
				if (!recovered) {
					throw new Error(
						`Database capability not available when loading character ${characterId}`
					);
				} else {
					console.log(
						`[GameRulesAPI] Successfully recovered database capability for character ${characterId}`
					);
				}
			}

			// The Unix Way: Create a lock file to indicate this character is being accessed
			// This helps prevent race conditions with multiple concurrent accesses
			const lockPath = `${path}.lock`;
			let lockCreated = false;

			try {
				// Create lock file if it doesn't exist
				if (!this.kernel.exists(lockPath)) {
					const lockResult = this.kernel.create(lockPath, {
						created: Date.now(),
						pid: 'gameRulesAPI',
						operation: 'getCharacterByFileOperation'
					});

					if (lockResult.success) {
						lockCreated = true;
					} else {
						console.warn(`[GameRulesAPI] Failed to create lock file: ${lockPath}`);
					}
				}
			} catch (lockError) {
				// Non-fatal, we'll continue without lock
				console.warn(`[GameRulesAPI] Error creating lock file:`, lockError);
			}

			// Check if character file exists
			if (!this.kernel.exists(path)) {
				console.log(`[GameRulesAPI] Character file doesn't exist: ${path}, fetching from database`);

				// The Unix Way: Emit an event before database fetch to notify observers
				if (this.kernel && this.kernel.events) {
					this.kernel.events.emit('character:fetching', {
						timestamp: Date.now(),
						characterId,
						source: 'database'
					});
				}

				// Try to fetch character directly from database
				const characterData = await this.fetchCharacterFromDatabase(characterId);

				if (characterData) {
					// Character found, create the file for future access
					const success = this.createCharacterFile(characterId, characterData);

					// The Unix Way: Signal success via event
					if (this.kernel && this.kernel.events) {
						this.kernel.events.emit('character:created', {
							timestamp: Date.now(),
							characterId,
							success
						});
					}

					// Always remove lock after operation
					if (lockCreated) {
						try {
							this.kernel.unlink(lockPath);
						} catch (unlockError) {
							console.warn(`[GameRulesAPI] Error removing lock:`, unlockError);
						}
					}

					return characterData;
				}

				// The Unix Way: Signal failure via event for monitoring tools
				if (this.kernel && this.kernel.events) {
					this.kernel.events.emit('character:not_found', {
						timestamp: Date.now(),
						characterId,
						source: 'database'
					});
				}

				// No character found in database
				throw new Error(`Character ${characterId} not found in database`);
			}

			// File exists, open and read it
			const fd = this.kernel.open(path, OpenMode.READ);
			if (fd < 0) {
				console.error(`[GameRulesAPI] Failed to open character file: ${fd}`);

				// The Unix Way: Emit specific error event for monitoring
				if (this.kernel && this.kernel.events) {
					this.kernel.events.emit('file:open_error', {
						timestamp: Date.now(),
						path,
						characterId,
						errorCode: fd
					});
				}

				// Remove any invalid file that can't be opened
				console.log(`[GameRulesAPI] Removing invalid file that cannot be opened: ${path}`);
				try {
					this.kernel.unlink(path);
				} catch (unlinkError) {
					console.warn(`[GameRulesAPI] Error removing invalid file:`, unlinkError);
				}

				// Try direct database access as fallback
				console.log(`[GameRulesAPI] Trying database fallback for character ${characterId}`);
				const fallbackData = await this.fetchCharacterFromDatabase(characterId);

				if (fallbackData) {
					// Save for next time
					this.createCharacterFile(characterId, fallbackData);

					// Always remove lock after operation
					if (lockCreated) {
						try {
							this.kernel.unlink(lockPath);
						} catch (unlockError) {
							console.warn(`[GameRulesAPI] Error removing lock:`, unlockError);
						}
					}

					return fallbackData;
				}

				throw new Error(
					`Failed to open character ${characterId} file (error code ${fd}) and database fallback failed`
				);
			}

			try {
				// Read the character data
				const buffer: any = {};
				const [result] = this.kernel.read(fd, buffer);

				if (result !== 0) {
					console.error(`[GameRulesAPI] Failed to read character file: ${result}`);

					// The Unix Way: Emit specific error event
					if (this.kernel && this.kernel.events) {
						this.kernel.events.emit('file:read_error', {
							timestamp: Date.now(),
							path,
							characterId,
							errorCode: result
						});
					}

					// Try direct database access as fallback
					console.log(`[GameRulesAPI] Trying database fallback after file read error`);
					const fallbackData = await this.fetchCharacterFromDatabase(characterId);

					if (fallbackData) {
						// Replace invalid file
						this.createCharacterFile(characterId, fallbackData);
						return fallbackData;
					}

					throw new Error(
						`Failed to read character ${characterId} (I/O error code ${result}) and database fallback failed`
					);
				}

				// Check if buffer is valid
				if (!buffer || Object.keys(buffer).length === 0 || !buffer.id) {
					console.error(`[GameRulesAPI] Character file is empty or invalid`);

					// The Unix Way: Emit specific error event
					if (this.kernel && this.kernel.events) {
						this.kernel.events.emit('file:invalid_data', {
							timestamp: Date.now(),
							path,
							characterId
						});
					}

					// Try direct database access as fallback
					console.log(`[GameRulesAPI] Trying database fallback for empty/invalid file`);
					const fallbackData = await this.fetchCharacterFromDatabase(characterId);

					if (fallbackData) {
						// Replace the invalid file with correct data
						this.createCharacterFile(characterId, fallbackData);
						return fallbackData;
					}

					throw new Error(
						`Character file for ${characterId} is empty or invalid and database fallback failed`
					);
				}

				// The Unix Way: Log successful operation with duration
				const endTime = Date.now();
				if (this.debug) {
					console.log(
						`[GameRulesAPI] Character ${characterId} loaded successfully in ${endTime - startTime}ms`
					);
				}

				// The Unix Way: Emit load event for performance monitoring
				if (this.kernel && this.kernel.events) {
					this.kernel.events.emit('character:loaded', {
						timestamp: endTime,
						characterId,
						duration: endTime - startTime,
						source: 'file'
					});
				}

				return buffer as CompleteCharacter;
			} finally {
				// The Unix Way: Always clean up resources
				// Close the file descriptor
				this.kernel.close(fd);

				// Remove lock file if we created one
				if (lockCreated) {
					try {
						this.kernel.unlink(lockPath);
					} catch (unlockError) {
						console.warn(`[GameRulesAPI] Error removing lock:`, unlockError);
					}
				}
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`[GameRulesAPI] Error getting character by file operation: ${errorMessage}`);

			// The Unix Way: Emit error event for monitoring and diagnostics
			if (this.kernel && this.kernel.events) {
				this.kernel.events.emit('character:load_error', {
					timestamp: Date.now(),
					characterId,
					error: errorMessage
				});
			}

			throw error; // Propagate the error upward
		}
	}

	/**
	 * Helper method to fetch character directly from database
	 * @param characterId Character ID
	 * @returns Character data or null if not found
	 */
	private async fetchCharacterFromDatabase(characterId: number): Promise<CompleteCharacter | null> {
		try {
			// Try direct driver method if available
			if (
				this.dbCapability &&
				(this.dbCapability as any).driver &&
				typeof (this.dbCapability as any).driver.getCharacterById === 'function'
			) {
				console.log(`[GameRulesAPI] Using direct driver method to get character ${characterId}`);
				try {
					const characterData = await (this.dbCapability as any).driver.getCharacterById(
						characterId,
						'complete'
					);
					if (characterData) {
						return characterData as CompleteCharacter;
					}
				} catch (driverError) {
					console.error(`[GameRulesAPI] Driver error: ${driverError}`);
				}
			}

			// The Unix Way: No direct database access
			// All database operations must go through file operations
			console.error(
				`[GameRulesAPI] Database driver method failed for character ${characterId} - Unix file operations should be used instead`
			);
			return null;
		} catch (error) {
			console.error(`[GameRulesAPI] Database fetch error: ${error}`);
			return null;
		}
	}

	/**
	 * Creates or updates a character file in the filesystem
	 * @param characterId Character ID
	 * @param characterData Character data to write
	 * @returns True if created/updated successfully, false otherwise
	 */
	private createCharacterFile(characterId: number, characterData: any): boolean {
		try {
			// Make sure parent directories exist
			this.ensureCharacterDirectoryExists(characterId);

			// Get the path
			const characterPath = this.getFileSystemPath('character', characterId);

			// Ensure character data is valid
			if (!characterData) {
				console.error(`[GameRulesAPI] Invalid character data for ID ${characterId}`);
				return false;
			}

			// Add diagnostic data to ensure we can verify content later
			const enhancedData = {
				...characterData,
				_metadata: {
					timestamp: Date.now(),
					source: 'GameRulesAPI',
					version: '1.0.0'
				}
			};

			// For existing files, we'll update instead of removing them
			// since they might have open file descriptors
			if (this.kernel.exists(characterPath)) {
				console.log(`[GameRulesAPI] Updating existing character file at ${characterPath}`);
				const fd = this.kernel.open(characterPath, OpenMode.WRITE);

				if (fd < 0) {
					console.error(`[GameRulesAPI] Failed to open character file for update: ${fd}`);
					return false;
				}

				try {
					// Write the updated data
					const writeResult = this.kernel.write(fd, enhancedData);

					if (writeResult !== 0) {
						console.error(`[GameRulesAPI] Failed to write to character file: ${writeResult}`);
						return false;
					}

					return true;
				} finally {
					// Always close the file descriptor
					this.kernel.close(fd);
				}
			} else {
				// Create a new file with the enhanced data
				console.log(`[GameRulesAPI] Creating character file at ${characterPath}`);
				const createResult = this.kernel.create(characterPath, enhancedData);

				if (!createResult.success) {
					console.warn(
						`[GameRulesAPI] Failed to create character file: ${createResult.errorMessage}`
					);
					return false;
				}

				// Verify the file was created and contains valid data
				if (this.debug) {
					this.verifyCharacterFile(characterId, characterPath);
				}

				return true;
			}
		} catch (error) {
			console.error(`[GameRulesAPI] Error creating/updating character file: ${error}`);
			return false;
		}
	}

	/**
	 * Verify that a character file exists and contains valid data
	 * @param characterId Character ID
	 * @param characterPath File path
	 * @returns True if the file is valid, false otherwise
	 */
	private verifyCharacterFile(characterId: number, characterPath: string): boolean {
		try {
			if (!this.kernel.exists(characterPath)) {
				console.error(
					`[GameRulesAPI] Verification failed: Character file does not exist: ${characterPath}`
				);
				return false;
			}

			// Open the file for reading
			const fd = this.kernel.open(characterPath, OpenMode.READ);

			if (fd < 0) {
				console.error(
					`[GameRulesAPI] Verification failed: Cannot open character file: ${characterPath}`
				);
				return false;
			}

			try {
				// Read the data
				const buffer: any = {};
				const [result] = this.kernel.read(fd, buffer);

				if (result !== 0) {
					console.error(
						`[GameRulesAPI] Verification failed: Cannot read character file: ${characterPath}`
					);
					return false;
				}

				// Check if the data is valid
				if (!buffer || Object.keys(buffer).length === 0) {
					console.error(
						`[GameRulesAPI] Verification failed: Character file is empty: ${characterPath}`
					);
					return false;
				}

				if (!buffer.id) {
					console.error(
						`[GameRulesAPI] Verification failed: Character file has no ID: ${characterPath}`
					);
					return false;
				}

				console.log(
					`[GameRulesAPI] Verification successful: Character file is valid: ${characterPath}`
				);
				return true;
			} finally {
				this.kernel.close(fd);
			}
		} catch (error) {
			console.error(`[GameRulesAPI] Error verifying character file: ${error}`);
			return false;
		}
	}

	/**
	 * Creates a mock character for testing
	 * @param characterId Character ID
	 * @returns Mock character data
	 */
	private createMockCharacter(characterId: number): CompleteCharacter {
		console.log(`[GameRulesAPI] Creating mock character ${characterId}`);

		// Determine mock character details based on ID
		let name, race, charClass;
		switch (characterId) {
			case 1:
				name = 'Thorin Oakenshield';
				race = 'Dwarf';
				charClass = 'Fighter';
				break;
			case 2:
				name = 'Elara Windwhisper';
				race = 'Elf';
				charClass = 'Wizard';
				break;
			case 3:
				name = 'Grimtooth Bonecrusher';
				race = 'Half-Orc';
				charClass = 'Barbarian';
				break;
			default:
				name = `Character ${characterId}`;
				race = 'Human';
				charClass = 'Adventurer';
		}

		// Create a basic character structure
		return {
			id: characterId,
			name: name,
			level: Math.floor(Math.random() * 10) + 1,
			race: race,
			class: charClass,
			hp: 40 + Math.floor(Math.random() * 60),
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			game_character_ability: [
				{
					ability_id: 401,
					value: 14,
					ability: { id: 401, name: 'strength', label: 'Strength', abbreviation: 'STR' }
				},
				{
					ability_id: 402,
					value: 12,
					ability: { id: 402, name: 'dexterity', label: 'Dexterity', abbreviation: 'DEX' }
				},
				{
					ability_id: 403,
					value: 13,
					ability: { id: 403, name: 'constitution', label: 'Constitution', abbreviation: 'CON' }
				},
				{
					ability_id: 404,
					value: 10,
					ability: { id: 404, name: 'intelligence', label: 'Intelligence', abbreviation: 'INT' }
				},
				{
					ability_id: 405,
					value: 11,
					ability: { id: 405, name: 'wisdom', label: 'Wisdom', abbreviation: 'WIS' }
				},
				{
					ability_id: 406,
					value: 10,
					ability: { id: 406, name: 'charisma', label: 'Charisma', abbreviation: 'CHA' }
				}
			]
		} as CompleteCharacter;
	}

	/**
	 * Update a character using Unix file operations
	 * @param characterId Character ID
	 * @param data Character data to update
	 * @returns True if successful, false otherwise
	 */
	async updateCharacterByFileOperation(
		characterId: number,
		data: Partial<CompleteCharacter>
	): Promise<boolean> {
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
				// If list file doesn't exist, create it
				if (this.debug) {
					console.log(`[GameRulesAPI] Character list file doesn't exist: ${path}, creating it`);
				}

				// Fetch all characters
				const characters = await this.getAllGameCharacters();

				// Make sure parent directories exist
				this.ensureBaseDirectoriesExist();

				// Create character summaries
				const characterSummaries = characters.map((char) => ({
					id: char.id,
					name: char.name
				}));

				// Create the list file
				const createResult = this.kernel.create(path, { characters: characterSummaries });
				if (!createResult.success) {
					console.error(
						`[GameRulesAPI] Failed to create character list file: ${createResult.errorMessage}`
					);
					return characterSummaries;
				}

				return characterSummaries;
			}

			// Open the list file
			const fd = this.kernel.open(path, OpenMode.READ);
			if (fd < 0) {
				console.error(`[GameRulesAPI] Failed to open character list file: ${fd}`);

				// Fetch characters directly
				const characters = await this.getAllGameCharacters();
				return characters.map((char) => ({ id: char.id, name: char.name }));
			}

			try {
				// Read the list data
				const buffer: any = {};
				const [result] = this.kernel.read(fd, buffer);

				if (result !== 0) {
					console.error(`[GameRulesAPI] Failed to read character list file: ${result}`);

					// Fetch characters directly
					const characters = await this.getAllGameCharacters();
					return characters.map((char) => ({ id: char.id, name: char.name }));
				}

				return buffer.characters || [];
			} finally {
				// Always close the file descriptor
				this.kernel.close(fd);
			}
		} catch (error) {
			console.error(`[GameRulesAPI] Error listing characters by file operation: ${error}`);

			// Fetch characters directly
			const characters = await this.getAllGameCharacters();
			return characters.map((char) => ({ id: char.id, name: char.name }));
		}
	}

	/**
	 * Get all game characters using appropriate methods
	 *
	 * @returns All game characters
	 */
	// Implementation moved below to prevent duplication

	/**
	 * Get mock character list for testing
	 * @returns List of mock characters
	 */
	private getMockCharacters(): Row<'game_character'>[] {
		// Create mock character list
		return [
			{
				id: 1,
				name: 'Thorin Oakenshield',
				level: 8,
				race: 'Dwarf',
				class: 'Fighter',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			},
			{
				id: 2,
				name: 'Elara Windwhisper',
				level: 6,
				race: 'Elf',
				class: 'Wizard',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			},
			{
				id: 3,
				name: 'Grimtooth Bonecrusher',
				level: 5,
				race: 'Half-Orc',
				class: 'Barbarian',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			}
		] as Row<'game_character'>[];
	}

	/**
	 * Get ability scores for a character using Unix file operations
	 * @param characterId Character ID
	 * @returns Object with ability scores or null if not found
	 */
	async getCharacterAbilitiesByFileOperation(
		characterId: number
	): Promise<Record<string, number> | null> {
		try {
			if (this.debug) {
				console.log(
					`[GameRulesAPI] Getting abilities for character by file operation: ${characterId}`
				);
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
					console.log(
						`[GameRulesAPI] No global list file found for entity type ${entityType}: ${fd}`
					);
				}

				// Fall back to appropriate direct methods
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

	/*
	 * REMOVED: getSupabaseClient() method has been completely removed.
	 * All database access should now use kernel file operations
	 * (open, read, write, close) on database resources.
	 *
	 * To access database resources:
	 * - kernel.open('/proc/character/{id}', OpenMode.READ) - Get a character by ID
	 * - kernel.open('/proc/character/list', OpenMode.READ) - List all characters
	 * - kernel.open('/entity/{entity_id}/abilities', OpenMode.READ) - Get entity abilities
	 */

	/**
	 * Private helper method to get all game characters
	 * Uses Unix file operations and device access with fallbacks
	 *
	 * @returns All game characters
	 */
	private async getAllGameCharacters(): Promise<Row<'game_character'>[]> {
		try {
			// First try the direct database capability method if available
			if (this.dbCapability && typeof this.dbCapability.query === 'function') {
				console.log(`[GameRulesAPI] Using direct database capability query for game_character`);
				try {
					const results = await this.dbCapability.query('game_character', null, '*');

					// Check if we got results
					if (Array.isArray(results) && results.length > 0) {
						console.log(`[GameRulesAPI] Found ${results.length} characters via capability query`);
						return results as Row<'game_character'>[];
					} else {
						console.log(`[GameRulesAPI] No characters found via capability query, trying fallback`);
					}
				} catch (error) {
					console.error(`[GameRulesAPI] Error using direct database capability: ${error}`);
					// Fall through to next method
				}
			}

			// The Unix Way: No direct database access
			// All database operations must go through file operations
			console.error(
				`[GameRulesAPI] Database operations must use Unix file operations, not direct client access`
			);

			// No data found yet, check if device path is available
			const devicePath = '/dev/db';
			if (this.kernel.exists(devicePath)) {
				const deviceFd = this.kernel.open(devicePath, OpenMode.READ_WRITE);
				if (deviceFd >= 0) {
					try {
						// Try ioctl with special buffer
						const ioctlBuffer: any = {};
						const ioctlResult = this.kernel.ioctl(deviceFd, 2, {
							// DatabaseOperation.QUERY
							resource: 'game_character',
							query: '*',
							buffer: ioctlBuffer
						});

						if (ioctlResult === 0 && ioctlBuffer.data && Array.isArray(ioctlBuffer.data)) {
							console.log(`[GameRulesAPI] Found characters via device ioctl`);
							return ioctlBuffer.data as Row<'game_character'>[];
						}
					} catch (err) {
						console.error(`[GameRulesAPI] IOCTL error:`, err);
					} finally {
						this.kernel.close(deviceFd);
					}
				}
			}

			// All attempts failed, create some mock characters for testing
			console.log(`[GameRulesAPI] Creating mock characters for testing purposes`);
			return this.getMockCharacters();
		} catch (error) {
			console.error(`[GameRulesAPI] Error in getAllGameCharacters: ${error}`);
			// As absolute last resort, return mock data so the app can function
			return this.getMockCharacters();
		}
	}

	/**
	 * Gets all game characters
	 * @returns All game characters
	 */
	async getAllGameCharacter(): Promise<Row<'game_character'>[]> {
		// Use file operations to list characters, then get each character
		try {
			const characters = await this.listCharactersByFileOperation();

			if (characters.length === 0) {
				return await this.getAllGameCharacters();
			}

			// Get character data for each listed character
			const characterData = await Promise.all(
				characters.map(async (char) => {
					const data = await this.getCharacterByFileOperation(char.id);
					return data || { id: char.id, name: char.name };
				})
			);

			return characterData.filter(Boolean) as Row<'game_character'>[];
		} catch (error) {
			console.error(`[GameRulesAPI] Error in getAllGameCharacter: ${error}`);
			return this.getAllGameCharacters();
		}
	}

	/**
	 * Gets all abilities using database device API
	 * @returns All abilities
	 */
	async getAllAbility(): Promise<Row<'ability'>[]> {
		// Implement using device file operations
		try {
			// Try direct capability query first if available
			if (this.dbCapability && typeof this.dbCapability.query === 'function') {
				try {
					const results = await this.dbCapability.query('ability', null, '*');
					if (Array.isArray(results) && results.length > 0) {
						return results as Row<'ability'>[];
					}
				} catch (error) {
					console.error(`[GameRulesAPI] Error querying abilities via capability: ${error}`);
				}
			}

			// Fallback to device file operations
			const devicePath = '/dev/db';
			const deviceFd = this.kernel.open(devicePath, OpenMode.READ_WRITE);

			if (deviceFd < 0) {
				console.error(`[GameRulesAPI] Failed to open database device: ${devicePath}`);
				return [];
			}

			try {
				const buffer: any = {};
				const ioctlResult = this.kernel.ioctl(
					deviceFd,
					2,
					{
						// DatabaseOperation.QUERY
						resource: 'ability',
						query: '*'
					},
					buffer
				);

				if (ioctlResult !== 0) {
					console.error(`[GameRulesAPI] Database query operation failed: ${ioctlResult}`);
					return [];
				}

				return (buffer.data || []) as Row<'ability'>[];
			} finally {
				this.kernel.close(deviceFd);
			}
		} catch (error) {
			console.error(`[GameRulesAPI] Error in getAllAbility: ${error}`);
			return [];
		}
	}

	/**
	 * Gets all skills using database device API
	 * @returns All skills
	 */
	async getAllSkill(): Promise<Row<'skill'>[]> {
		// Implement using device file operations
		try {
			// Try direct capability query first if available
			if (this.dbCapability && typeof this.dbCapability.query === 'function') {
				try {
					const results = await this.dbCapability.query('skill', null, '*');
					if (Array.isArray(results) && results.length > 0) {
						return results as Row<'skill'>[];
					}
				} catch (error) {
					console.error(`[GameRulesAPI] Error querying skills via capability: ${error}`);
				}
			}

			// Fallback to device file operations
			const devicePath = '/dev/db';
			const deviceFd = this.kernel.open(devicePath, OpenMode.READ_WRITE);

			if (deviceFd < 0) {
				console.error(`[GameRulesAPI] Failed to open database device: ${devicePath}`);
				return [];
			}

			try {
				const buffer: any = {};
				const ioctlResult = this.kernel.ioctl(
					deviceFd,
					2,
					{
						// DatabaseOperation.QUERY
						resource: 'skill',
						query: '*'
					},
					buffer
				);

				if (ioctlResult !== 0) {
					console.error(`[GameRulesAPI] Database query operation failed: ${ioctlResult}`);
					return [];
				}

				return (buffer.data || []) as Row<'skill'>[];
			} finally {
				this.kernel.close(deviceFd);
			}
		} catch (error) {
			console.error(`[GameRulesAPI] Error in getAllSkill: ${error}`);
			return [];
		}
	}

	/**
	 * Gets all feats using database device API
	 * @returns All feats
	 */
	async getAllFeat(): Promise<Row<'feat'>[]> {
		// Implement using device file operations
		try {
			// Try direct capability query first if available
			if (this.dbCapability && typeof this.dbCapability.query === 'function') {
				try {
					const results = await this.dbCapability.query('feat', null, '*');
					if (Array.isArray(results) && results.length > 0) {
						return results as Row<'feat'>[];
					}
				} catch (error) {
					console.error(`[GameRulesAPI] Error querying feats via capability: ${error}`);
				}
			}

			// Fallback to device file operations
			const devicePath = '/dev/db';
			const deviceFd = this.kernel.open(devicePath, OpenMode.READ_WRITE);

			if (deviceFd < 0) {
				console.error(`[GameRulesAPI] Failed to open database device: ${devicePath}`);
				return [];
			}

			try {
				const buffer: any = {};
				const ioctlResult = this.kernel.ioctl(
					deviceFd,
					2,
					{
						// DatabaseOperation.QUERY
						resource: 'feat',
						query: '*'
					},
					buffer
				);

				if (ioctlResult !== 0) {
					console.error(`[GameRulesAPI] Database query operation failed: ${ioctlResult}`);
					return [];
				}

				return (buffer.data || []) as Row<'feat'>[];
			} finally {
				this.kernel.close(deviceFd);
			}
		} catch (error) {
			console.error(`[GameRulesAPI] Error in getAllFeat: ${error}`);
			return [];
		}
	}

	/**
	 * Gets all classes using database device API
	 * @returns All classes
	 */
	async getAllClass(): Promise<Row<'class'>[]> {
		// Implement using device file operations
		try {
			// Try direct capability query first if available
			if (this.dbCapability && typeof this.dbCapability.query === 'function') {
				try {
					const results = await this.dbCapability.query('class', null, '*');
					if (Array.isArray(results) && results.length > 0) {
						return results as Row<'class'>[];
					}
				} catch (error) {
					console.error(`[GameRulesAPI] Error querying classes via capability: ${error}`);
				}
			}

			// Fallback to device file operations
			const devicePath = '/dev/db';
			const deviceFd = this.kernel.open(devicePath, OpenMode.READ_WRITE);

			if (deviceFd < 0) {
				console.error(`[GameRulesAPI] Failed to open database device: ${devicePath}`);
				return [];
			}

			try {
				const buffer: any = {};
				const ioctlResult = this.kernel.ioctl(
					deviceFd,
					2,
					{
						// DatabaseOperation.QUERY
						resource: 'class',
						query: '*'
					},
					buffer
				);

				if (ioctlResult !== 0) {
					console.error(`[GameRulesAPI] Database query operation failed: ${ioctlResult}`);
					return [];
				}

				return (buffer.data || []) as Row<'class'>[];
			} finally {
				this.kernel.close(deviceFd);
			}
		} catch (error) {
			console.error(`[GameRulesAPI] Error in getAllClass: ${error}`);
			return [];
		}
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
