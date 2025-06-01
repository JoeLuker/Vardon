/**
 * Browser Application Initializer - True Unix Architecture
 *
 * This file provides a browser-specific entry point for initializing the application following
 * strict Unix principles, but adapted for the browser environment:
 * - Everything is a file
 * - Clean separation of kernel and user space
 * - Files as the primary communication mechanism
 * - Standard I/O operations (open, read, write, close)
 * - Device files for hardware/capability abstraction
 * - Persistent storage using IndexedDB or localStorage
 */

import { WebKernel, BootStatus } from './kernel/WebKernel';
import { EventBus } from './kernel/EventBus';
import type { Capability, Entity } from './kernel/types';
import { OpenMode, ErrorCode } from './kernel/types';
import { createPluginManager, type PluginManager } from './plugins/PluginManagerComposed';

// The Unix Way: Everything is a file, even our capabilities
const PATHS = {
	// Device files
	DB_DEVICE: '/v_dev/db',
	ABILITY_DEVICE: '/v_dev/ability',
	BONUS_DEVICE: '/v_dev/bonus',
	SKILL_DEVICE: '/v_dev/skill',
	COMBAT_DEVICE: '/v_dev/combat',
	CONDITION_DEVICE: '/v_dev/condition',
	CHARACTER_DEVICE: '/v_dev/character',

	// Data files
	ENTITIES: '/v_entity',
	CHARACTER_PREFIX: '/v_proc/character/',

	// System directories
	BIN: '/v_bin',
	ETC: '/v_etc',
	PROC: '/v_proc',
	TMP: '/v_tmp',
	VAR: '/v_var',

	// Configuration files
	CONFIG: '/v_etc/config.json',

	// Log files
	LOG: '/v_var/log/app.log'
};

// Kernel requests (like ioctl requests in Unix)
const REQUEST = {
	INITIALIZE: 0,
	GET_CHARACTER: 1,
	SET_CHARACTER: 2,
	CALC_ABILITY: 3,
	CALC_SKILL: 4,
	CALC_COMBAT: 5,
	APPLY_BONUS: 6,
	APPLY_CONDITION: 7
};

/**
 * Browser application interface
 */
export interface BrowserApplication {
	kernel: WebKernel;
	pluginManager: PluginManager;
	loadCharacter: (characterId: number) => Promise<Entity | null>;
	shutdown: () => Promise<void>;
	waitForBoot: () => Promise<void>;
	getBootStatus: () => BootStatus;
	getBootProgress: () => number;
}

/**
 * Initialize the browser application
 * @param options Initialization options
 * @returns The initialized application components
 */
export async function initializeBrowserApplication(
	options: {
		debug?: boolean;
		autoStart?: boolean;
		onBootStatusChange?: (status: BootStatus, progress: number) => void;
	} = {}
): Promise<BrowserApplication> {
	// Initialize boot process
	console.log('[browser-init] Creating web kernel');
	const debug = options.debug ?? true;
	const eventBus = new EventBus(debug);

	// Create the web-specific kernel (handles browser storage and boot sequence)
	const kernel = new WebKernel({
		eventEmitter: eventBus,
		debug,
		noFsEvents: false,
		autoStart: options.autoStart ?? true
	});

	// Register boot status callback if provided
	if (options.onBootStatusChange) {
		kernel.onBootStatusChange(options.onBootStatusChange);
	}

	// Preregister device capabilities - these will be mounted during boot sequence
	kernel.addPendingCapability('db', createBrowserDbDevice({ debug }));
	kernel.addPendingCapability('bonus', createBrowserBonusDevice({ debug }));
	kernel.addPendingCapability('ability', createBrowserAbilityDevice({ debug }));
	kernel.addPendingCapability('skill', createBrowserSkillDevice({ debug }));
	kernel.addPendingCapability('combat', createBrowserCombatDevice({ debug }));
	kernel.addPendingCapability('condition', createBrowserConditionDevice({ debug }));
	kernel.addPendingCapability('character', createBrowserCharacterDevice({ debug }));

	// Initialize plugin system
	console.log('[browser-init] Initializing plugin system');
	const pluginManager = createPluginManager({ debug, kernel });

	// Function to wait for boot to complete
	async function waitForBoot(): Promise<void> {
		// If boot already completed or failed, return immediately
		const status = kernel.getBootStatus();
		if (status === BootStatus.READY || status === BootStatus.FAILED) {
			return;
		}

		// Otherwise wait for boot to complete or fail
		return new Promise((resolve, reject) => {
			// Check status every 100ms
			const interval = setInterval(() => {
				const status = kernel.getBootStatus();
				if (status === BootStatus.READY) {
					clearInterval(interval);
					resolve();
				} else if (status === BootStatus.FAILED) {
					clearInterval(interval);
					const error = kernel.getBootError() || new Error('Boot failed');
					reject(error);
				}
			}, 100);
		});
	}

	// Log write helper function (Unix-style append to log)
	async function log(message: string): Promise<void> {
		// Wait for boot to complete
		await waitForBoot();

		// The Unix Way: use file operations for everything
		const fd = kernel.open(PATHS.LOG, OpenMode.READ_WRITE);
		if (fd < 0) {
			console.error(`Failed to open log file: ${PATHS.LOG}`);
			return;
		}

		try {
			// Read current log
			const [readResult, logData] = kernel.read(fd);
			if (readResult !== ErrorCode.SUCCESS) {
				console.error(`Failed to read log file: ${readResult}`);
				return;
			}

			// Append entry
			const entries = logData.entries || [];
			entries.push({
				timestamp: new Date().toISOString(),
				message
			});

			// Write updated log
			const writeResult = kernel.write(fd, { entries });
			if (writeResult !== ErrorCode.SUCCESS) {
				console.error(`Failed to write log file: ${writeResult}`);
				return;
			}
		} finally {
			// Always close file descriptor
			kernel.close(fd);
		}
	}

	/**
	 * Load a character from browser storage or database
	 * @param characterId Character ID
	 * @returns Loaded character entity
	 */
	async function loadCharacter(characterId: number): Promise<Entity | null> {
		// Wait for boot to complete
		await waitForBoot();

		await log(`Loading character: ${characterId}`);

		// The Unix Way: All operations are file operations

		// Check if character exists in local filesystem first
		const entityId = `character-${characterId}`;
		const entityPath = `${PATHS.ENTITIES}/${entityId}`;
		const procPath = `${PATHS.CHARACTER_PREFIX}${characterId}`;

		if (kernel.exists(entityPath)) {
			// Character exists locally, load it directly
			const entityFd = kernel.open(entityPath, OpenMode.READ);
			if (entityFd < 0) {
				console.error(`Failed to open local entity file: ${entityPath} (error: ${entityFd})`);
				return null;
			}

			try {
				const [readResult, entity] = kernel.read(entityFd);
				if (readResult !== ErrorCode.SUCCESS) {
					console.error(`Failed to read local entity: ${readResult}`);
					return null;
				}

				await log(`Character ${characterId} loaded from local storage: ${entity.name}`);
				return entity as Entity;
			} finally {
				kernel.close(entityFd);
			}
		}

		// Character not found locally, fetch from database device
		// 1. Prepare request to database device
		const requestData = {
			operation: 'getCharacter',
			characterId
		};

		// 2. Open database device file
		const dbFd = kernel.open(PATHS.DB_DEVICE, OpenMode.READ_WRITE);
		if (dbFd < 0) {
			console.error(`Failed to open database device: ${PATHS.DB_DEVICE}`);
			return null;
		}

		try {
			// 3. Write request to device file
			const writeResult = kernel.write(dbFd, requestData);
			if (writeResult !== ErrorCode.SUCCESS) {
				console.error(`Failed to write to database device: ${writeResult}`);
				return null;
			}

			// 4. Read response from device file
			const [readResult, responseData] = kernel.read(dbFd);
			if (readResult !== ErrorCode.SUCCESS) {
				console.error(`Failed to read from database device: ${readResult}`);
				return null;
			}

			// 5. Check if character was found
			if (!responseData || !responseData.character) {
				console.error(`Character not found: ${characterId}`);
				return null;
			}

			const rawCharacter = responseData.character;

			// 6. Create entity file
			const entity: Entity = {
				id: entityId,
				type: 'character',
				name: rawCharacter.name || `Character ${characterId}`,
				properties: {
					id: rawCharacter.id,
					name: rawCharacter.name,
					rawData: rawCharacter,
					// These will be filled in by capability devices
					abilities: {},
					skills: {},
					conditions: [],
					bonuses: []
				},
				metadata: {
					createdAt: Date.now(),
					updatedAt: Date.now(),
					version: 1
				}
			};

			// 7. Write entity file
			const createResult = kernel.create(entityPath, entity);
			if (!createResult.success) {
				console.error(`Failed to create entity file: ${createResult.errorMessage}`);
				return null;
			}

			// 8. Initialize character with all capability devices using ioctl
			await initializeCharacterWithDevices(entityId);

			// 9. Read the fully initialized character
			const entityFd = kernel.open(entityPath, OpenMode.READ);
			if (entityFd < 0) {
				console.error(
					`Failed to open entity file after initialization: ${entityPath} (error: ${entityFd})`
				);
				return null;
			}

			try {
				const [entityReadResult, initializedEntity] = kernel.read(entityFd);
				if (entityReadResult !== ErrorCode.SUCCESS) {
					console.error(`Failed to read entity after initialization: ${entityReadResult}`);
					return null;
				}

				// 10. Create process entry in /proc/character for active character
				const procCreateResult = kernel.create(procPath, {
					id: characterId,
					entityId,
					entityPath,
					active: true,
					loadedAt: Date.now()
				});

				if (!procCreateResult.success) {
					console.warn(`Failed to create process entry: ${procCreateResult.errorMessage}`);
					// Non-fatal, continue
				}

				await log(`Character ${characterId} loaded successfully: ${initializedEntity.name}`);
				return initializedEntity as Entity;
			} finally {
				kernel.close(entityFd);
			}
		} finally {
			// The Unix Way: Always close file descriptors
			kernel.close(dbFd);
		}
	}

	/**
	 * Initialize a character by sending it through each capability device
	 * @param entityId The character entity ID
	 */
	async function initializeCharacterWithDevices(entityId: string): Promise<void> {
		await log(`Initializing character: ${entityId}`);

		const entityPath = `${PATHS.ENTITIES}/${entityId}`;

		// The Unix Way: Process through each device in sequence with ioctl (device control)
		const devicePaths = [
			PATHS.ABILITY_DEVICE,
			PATHS.SKILL_DEVICE,
			PATHS.COMBAT_DEVICE,
			PATHS.CONDITION_DEVICE,
			PATHS.BONUS_DEVICE,
			PATHS.CHARACTER_DEVICE
		];

		for (const devicePath of devicePaths) {
			// Open device file
			const deviceFd = kernel.open(devicePath, OpenMode.READ_WRITE);
			if (deviceFd < 0) {
				console.error(`Failed to open device: ${devicePath}`);
				continue;
			}

			try {
				// Send initialization request via ioctl
				const ioctlResult = kernel.ioctl(deviceFd, REQUEST.INITIALIZE, { entityPath });
				if (ioctlResult !== ErrorCode.SUCCESS) {
					console.error(`Failed to initialize entity with device ${devicePath}: ${ioctlResult}`);
				} else {
					await log(`Initialized character with device: ${devicePath}`);
				}
			} finally {
				// Always close device file descriptor
				kernel.close(deviceFd);
			}
		}

		// Apply bonuses through bonus device
		const bonusFd = kernel.open(PATHS.BONUS_DEVICE, OpenMode.READ_WRITE);
		if (bonusFd >= 0) {
			try {
				// Apply default bonuses
				const bonuses = [
					{ target: 'strength', value: 2, type: 'enhancement', source: 'ability_enhancement' },
					{ target: 'dexterity', value: 2, type: 'enhancement', source: 'ability_enhancement' }
				];

				for (const bonus of bonuses) {
					const applyResult = kernel.ioctl(bonusFd, REQUEST.APPLY_BONUS, {
						entityPath,
						bonus
					});

					if (applyResult !== ErrorCode.SUCCESS) {
						console.error(`Failed to apply bonus to ${bonus.target}: ${applyResult}`);
					} else {
						await log(`Applied bonus to ${bonus.target}: +${bonus.value} ${bonus.type}`);
					}
				}
			} finally {
				kernel.close(bonusFd);
			}
		}
	}

	/**
	 * Shut down the application
	 */
	async function shutdown(): Promise<void> {
		await log('Shutting down application');

		// The Unix Way: Clean shutdown of all components
		try {
			// First shut down plugin manager
			await pluginManager.shutdown();

			// Then shut down the kernel (closes all file descriptors, unmounts devices, persists filesystem)
			await kernel.shutdown();

			console.log('Application shutdown complete');
		} catch (error) {
			console.error('Error during shutdown:', error);
		}
	}

	// When auto-start is disabled, the caller is responsible for starting the boot sequence
	if (!options.autoStart) {
		console.log('[browser-init] Auto-start disabled, manual boot required');
	}

	return {
		kernel,
		pluginManager,
		loadCharacter,
		shutdown,
		waitForBoot,
		getBootStatus: () => kernel.getBootStatus(),
		getBootProgress: () => kernel.getBootProgress()
	};
}

//------------------------------------------------------------------------------
// Browser Device Implementations
//------------------------------------------------------------------------------

/**
 * Create a browser-specific database device
 * This fetches from network when available, falls back to local data
 * @param options Device options
 * @returns A capability for database access
 */
function createBrowserDbDevice(options: { debug?: boolean } = {}): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'db',
		version: '1.0.0',
		kernel: null,

		onMount(kernel: any): void {
			this.kernel = kernel;
			if (debug) console.log(`[db] Device mounted`);
		},

		// Unix-style read method
		read(fd: number, buffer: any): number {
			if (debug) console.log(`[db] Reading from descriptor ${fd}`);

			// Return response data stored during write or ioctl operation
			if (buffer._responseData) {
				Object.assign(buffer, buffer._responseData);
				delete buffer._responseData;
				return ErrorCode.SUCCESS;
			}

			return ErrorCode.EINVAL;
		},

		// Unix-style write method
		write(fd: number, buffer: any): number {
			if (debug) console.log(`[db] Writing to descriptor ${fd}:`, buffer);

			// Process request based on operation type
			if (buffer.operation === 'getCharacter') {
				const characterId = buffer.characterId;

				// First check if there's a character cache file
				const cachePath = `/var/cache/character_${characterId}.json`;
				if (this.kernel.exists(cachePath)) {
					const [readResult, cacheData] = this.kernel.read(cachePath);
					if (readResult === ErrorCode.SUCCESS && cacheData) {
						// Use cached data
						buffer._responseData = {
							operation: 'getCharacterResponse',
							success: true,
							character: cacheData,
							source: 'cache'
						};
						return ErrorCode.SUCCESS;
					}
				}

				// No cache or cache read failed, return mock data
				// In a real implementation, this would make an API call
				buffer._responseData = {
					operation: 'getCharacterResponse',
					success: true,
					source: 'mock',
					character: {
						id: characterId,
						name: `Character ${characterId}`,
						max_hp: 25,
						current_hp: 25,
						game_character_ability: [
							{ ability_id: 401, value: 14 },
							{ ability_id: 402, value: 16 },
							{ ability_id: 403, value: 12 },
							{ ability_id: 404, value: 10 },
							{ ability_id: 405, value: 8 },
							{ ability_id: 406, value: 16 }
						],
						game_character_class: [{ class_id: 1, level: 5, class: { name: 'Fighter' } }],
						game_character_ancestry: [{ ancestry: { name: 'Human' } }]
					}
				};

				// Cache the data for future use
				this.kernel.create(cachePath, buffer._responseData.character, true);

				return ErrorCode.SUCCESS;
			}

			return ErrorCode.EINVAL;
		},

		// Unix-style ioctl method
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[db] IOCTL request ${request} on fd ${fd}:`, arg);

			if (request === REQUEST.INITIALIZE) {
				return ErrorCode.SUCCESS;
			}

			return ErrorCode.EINVAL;
		}
	};
}

/**
 * Create a browser-specific ability device
 * @param options Device options
 * @returns A capability for ability calculations
 */
function createBrowserAbilityDevice(options: { debug?: boolean } = {}): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'ability',
		version: '1.0.0',
		kernel: null,

		onMount(kernel: any): void {
			this.kernel = kernel;
			if (debug) console.log(`[ability] Device mounted`);
		},

		// Process control operations via ioctl
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[ability] IOCTL request ${request} on fd ${fd}:`, arg);

			if (!this.kernel) {
				console.error(`[ability] Kernel not available`);
				return ErrorCode.EINVAL;
			}

			if (request === REQUEST.INITIALIZE) {
				const { entityPath } = arg;
				if (!entityPath) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) {
					console.error(`[ability] Failed to open entity file: ${entityPath} (error: ${entityFd})`);
					return ErrorCode.ENOENT;
				}

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Get raw character data
					const rawCharacter = entity.properties.rawData;

					// Calculate abilities from raw data
					const abilityMap = {
						401: 'strength',
						402: 'dexterity',
						403: 'constitution',
						404: 'intelligence',
						405: 'wisdom',
						406: 'charisma'
					};

					const abilities: Record<string, any> = {};

					// Process each ability score
					if (rawCharacter.game_character_ability) {
						for (const ability of rawCharacter.game_character_ability) {
							const abilityId = ability.ability_id;
							const abilityName = abilityMap[abilityId] || `ability_${abilityId}`;
							const score = ability.value || 10;

							// Calculate modifier
							const modifier = Math.floor((score - 10) / 2);

							// Store structured ability data with breakdown
							abilities[abilityName] = {
								label: abilityName.charAt(0).toUpperCase() + abilityName.slice(1),
								total: score,
								modifier: modifier,
								modifiers: [{ source: 'Base', value: score }]
							};
						}
					}

					// Update entity with ability data
					entity.properties.abilities = abilities;

					// Write updated entity back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					// Always close entity file descriptor
					this.kernel.close(entityFd);
				}
			}

			// Handle a specific GET_BREAKDOWN request for getting ability details
			if (request === REQUEST.CALC_ABILITY) {
				const { entityPath, ability } = arg;
				if (!entityPath || !ability) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ);
				if (entityFd < 0) return ErrorCode.ENOENT;

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Return ability breakdown
					const abilities = entity.properties.abilities || {};
					const abilityData = abilities[ability];

					if (!abilityData) return ErrorCode.ENOENT;

					// Store breakdown in buffer
					arg._result = abilityData;

					return ErrorCode.SUCCESS;
				} finally {
					this.kernel.close(entityFd);
				}
			}

			return ErrorCode.EINVAL;
		}
	};
}

/**
 * Create a browser-specific bonus device
 * @param options Device options
 * @returns A capability for bonus tracking
 */
function createBrowserBonusDevice(options: { debug?: boolean } = {}): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'bonus',
		version: '1.0.0',
		kernel: null,

		onMount(kernel: any): void {
			this.kernel = kernel;
			if (debug) console.log(`[bonus] Device mounted`);
		},

		// Process control operations via ioctl
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[bonus] IOCTL request ${request} on fd ${fd}:`, arg);

			if (!this.kernel) {
				console.error(`[bonus] Kernel not available`);
				return ErrorCode.EINVAL;
			}

			if (request === REQUEST.INITIALIZE) {
				// Initialize bonus tracking for the entity
				const { entityPath } = arg;
				if (!entityPath) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) {
					console.error(`[bonus] Failed to open entity file: ${entityPath} (error: ${entityFd})`);
					return ErrorCode.ENOENT;
				}

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Initialize bonus tracking
					entity.properties.bonuses = [];

					// Write updated entity back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					// Always close entity file descriptor
					this.kernel.close(entityFd);
				}
			}

			if (request === REQUEST.APPLY_BONUS) {
				// Apply bonus to entity
				const { entityPath, bonus } = arg;
				if (!entityPath || !bonus) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) return ErrorCode.ENOENT;

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Add bonus to tracked bonuses
					entity.properties.bonuses = entity.properties.bonuses || [];
					entity.properties.bonuses.push(bonus);

					// Apply bonus to target ability
					if (entity.properties.abilities && entity.properties.abilities[bonus.target]) {
						const ability = entity.properties.abilities[bonus.target];

						// Add to modifiers breakdown
						ability.modifiers = ability.modifiers || [];
						ability.modifiers.push({
							source: bonus.source,
							value: bonus.value
						});

						// Recalculate total
						ability.total = ability.modifiers.reduce((sum, mod) => sum + mod.value, 0);

						// Recalculate modifier
						ability.modifier = Math.floor((ability.total - 10) / 2);
					}

					// Write updated entity back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					// Always close entity file descriptor
					this.kernel.close(entityFd);
				}
			}

			return ErrorCode.EINVAL;
		}
	};
}

/**
 * Create a browser-specific skill device
 * @param options Device options
 * @returns A capability for skill calculations
 */
function createBrowserSkillDevice(options: { debug?: boolean } = {}): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'skill',
		version: '1.0.0',
		kernel: null,

		onMount(kernel: any): void {
			this.kernel = kernel;
			if (debug) console.log(`[skill] Device mounted`);
		},

		// Process control operations via ioctl
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[skill] IOCTL request ${request} on fd ${fd}:`, arg);

			if (!this.kernel) {
				console.error(`[skill] Kernel not available`);
				return ErrorCode.EINVAL;
			}

			if (request === REQUEST.INITIALIZE) {
				// Initialize skills for the entity
				const { entityPath } = arg;
				if (!entityPath) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) {
					console.error(`[skill] Failed to open entity file: ${entityPath} (error: ${entityFd})`);
					return ErrorCode.ENOENT;
				}

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Get abilities for skill calculations
					const abilities = entity.properties.abilities || {};

					// Initialize skills with default values
					const skills: Record<string, any> = {
						acrobatics: {
							label: 'Acrobatics',
							ability: 'dexterity',
							total: abilities.dexterity?.modifier || 0,
							modifiers: [{ source: 'Dexterity', value: abilities.dexterity?.modifier || 0 }]
						},
						arcana: {
							label: 'Arcana',
							ability: 'intelligence',
							total: abilities.intelligence?.modifier || 0,
							modifiers: [{ source: 'Intelligence', value: abilities.intelligence?.modifier || 0 }]
						},
						athletics: {
							label: 'Athletics',
							ability: 'strength',
							total: abilities.strength?.modifier || 0,
							modifiers: [{ source: 'Strength', value: abilities.strength?.modifier || 0 }]
						}
					};

					// Update entity with skill data
					entity.properties.skills = skills;

					// Write updated entity back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					// Always close entity file descriptor
					this.kernel.close(entityFd);
				}
			}

			if (request === REQUEST.CALC_SKILL) {
				// Process skill calculation request
				const { entityPath, skill } = arg;
				if (!entityPath || !skill) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ);
				if (entityFd < 0) return ErrorCode.ENOENT;

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Return skill breakdown
					const skills = entity.properties.skills || {};
					const skillData = skills[skill];

					if (!skillData) return ErrorCode.ENOENT;

					// Store breakdown in buffer
					arg._result = skillData;

					return ErrorCode.SUCCESS;
				} finally {
					this.kernel.close(entityFd);
				}
			}

			return ErrorCode.EINVAL;
		}
	};
}

/**
 * Create a browser-specific combat device
 * @param options Device options
 * @returns A capability for combat calculations
 */
function createBrowserCombatDevice(options: { debug?: boolean } = {}): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'combat',
		version: '1.0.0',
		kernel: null,

		onMount(kernel: any): void {
			this.kernel = kernel;
			if (debug) console.log(`[combat] Device mounted`);
		},

		// Process control operations via ioctl
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[combat] IOCTL request ${request} on fd ${fd}:`, arg);

			if (!this.kernel) {
				console.error(`[combat] Kernel not available`);
				return ErrorCode.EINVAL;
			}

			if (request === REQUEST.INITIALIZE) {
				// Initialize combat stats for the entity
				const { entityPath } = arg;
				if (!entityPath) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) {
					console.error(`[combat] Failed to open entity file: ${entityPath} (error: ${entityFd})`);
					return ErrorCode.ENOENT;
				}

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Get abilities for combat calculations
					const abilities = entity.properties.abilities || {};

					// Calculate base AC
					const dexMod = abilities.dexterity?.modifier || 0;

					// Initialize combat stats
					entity.properties.combat = {
						ac: {
							label: 'Armor Class',
							total: 10 + dexMod,
							modifiers: [
								{ source: 'Base', value: 10 },
								{ source: 'Dexterity', value: dexMod }
							]
						},
						initiative: {
							label: 'Initiative',
							total: dexMod,
							modifiers: [{ source: 'Dexterity', value: dexMod }]
						},
						bab: {
							label: 'Base Attack Bonus',
							total: 5, // Example for a level 5 fighter
							modifiers: [{ source: 'Class Level', value: 5 }]
						},
						attacks: {
							melee: {
								label: 'Melee Attack',
								total: 5 + (abilities.strength?.modifier || 0),
								modifiers: [
									{ source: 'BAB', value: 5 },
									{ source: 'Strength', value: abilities.strength?.modifier || 0 }
								]
							},
							ranged: {
								label: 'Ranged Attack',
								total: 5 + (abilities.dexterity?.modifier || 0),
								modifiers: [
									{ source: 'BAB', value: 5 },
									{ source: 'Dexterity', value: abilities.dexterity?.modifier || 0 }
								]
							}
						}
					};

					// Write updated entity back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					// Always close entity file descriptor
					this.kernel.close(entityFd);
				}
			}

			if (request === REQUEST.CALC_COMBAT) {
				// Process combat calculation request
				const { entityPath, stat } = arg;
				if (!entityPath || !stat) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ);
				if (entityFd < 0) return ErrorCode.ENOENT;

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Return combat stat
					const combat = entity.properties.combat || {};
					let statData;

					// Handle nested stats like attacks.melee
					if (stat.includes('.')) {
						const [category, specific] = stat.split('.');
						statData = combat[category]?.[specific];
					} else {
						statData = combat[stat];
					}

					if (!statData) return ErrorCode.ENOENT;

					// Store breakdown in buffer
					arg._result = statData;

					return ErrorCode.SUCCESS;
				} finally {
					this.kernel.close(entityFd);
				}
			}

			return ErrorCode.EINVAL;
		}
	};
}

/**
 * Create a browser-specific condition device
 * @param options Device options
 * @returns A capability for condition tracking
 */
function createBrowserConditionDevice(options: { debug?: boolean } = {}): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'condition',
		version: '1.0.0',
		kernel: null,

		onMount(kernel: any): void {
			this.kernel = kernel;
			if (debug) console.log(`[condition] Device mounted`);
		},

		// Process control operations via ioctl
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[condition] IOCTL request ${request} on fd ${fd}:`, arg);

			if (!this.kernel) {
				console.error(`[condition] Kernel not available`);
				return ErrorCode.EINVAL;
			}

			if (request === REQUEST.INITIALIZE) {
				// Initialize conditions for the entity
				const { entityPath } = arg;
				if (!entityPath) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) {
					console.error(
						`[condition] Failed to open entity file: ${entityPath} (error: ${entityFd})`
					);
					return ErrorCode.ENOENT;
				}

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Initialize empty conditions list
					entity.properties.conditions = [];

					// Write updated entity back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					// Always close entity file descriptor
					this.kernel.close(entityFd);
				}
			}

			if (request === REQUEST.APPLY_CONDITION) {
				// Apply condition to entity
				const { entityPath, condition } = arg;
				if (!entityPath || !condition) return ErrorCode.EINVAL;

				// Open entity file
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) return ErrorCode.ENOENT;

				try {
					// Read entity data
					const [readResult, entity] = this.kernel.read(entityFd);
					if (readResult !== ErrorCode.SUCCESS) return readResult;

					// Add condition
					entity.properties.conditions = entity.properties.conditions || [];
					entity.properties.conditions.push({
						...condition,
						appliedAt: Date.now()
					});

					// Write updated entity back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					this.kernel.close(entityFd);
				}
			}

			return ErrorCode.EINVAL;
		}
	};
}

/**
 * Create a browser-specific character device
 * @param options Device options
 * @returns A capability for overall character management
 */
function createBrowserCharacterDevice(options: { debug?: boolean } = {}): Capability {
	const debug = options.debug ?? false;

	return {
		id: 'character',
		version: '1.0.0',
		kernel: null,

		onMount(kernel: any): void {
			this.kernel = kernel;
			if (debug) console.log(`[character] Device mounted`);
		},

		// Process control operations via ioctl
		ioctl(fd: number, request: number, arg: any): number {
			if (debug) console.log(`[character] IOCTL request ${request} on fd ${fd}:`, arg);

			if (!this.kernel) {
				console.error(`[character] Kernel not available`);
				return ErrorCode.EINVAL;
			}

			if (request === REQUEST.INITIALIZE) {
				// Initialize last step for character
				const { entityPath } = arg;
				if (!entityPath) return ErrorCode.EINVAL;

				// Extract character ID from path
				const match = entityPath.match(/character-(\d+)$/);
				if (!match) return ErrorCode.EINVAL;

				const characterId = match[1];
				if (!characterId) return ErrorCode.EINVAL;

				// Create status file in /proc directory
				const procPath = `/v_proc/character/${characterId}`;
				const statusResult = this.kernel.create(procPath, {
					id: characterId,
					path: entityPath,
					status: 'initialized',
					timestamp: Date.now()
				});

				if (!statusResult.success) {
					if (debug)
						console.warn(`[character] Failed to create status file: ${statusResult.errorMessage}`);
					// Non-fatal error, continue
				}

				return ErrorCode.SUCCESS;
			}

			if (request === REQUEST.GET_CHARACTER) {
				// Get character information
				const { characterId } = arg;
				if (!characterId) return ErrorCode.EINVAL;

				// Check if character exists in /proc
				const procPath = `/v_proc/character/${characterId}`;
				if (!this.kernel.exists(procPath)) {
					if (debug) console.warn(`[character] Character not found in /proc: ${characterId}`);
					return ErrorCode.ENOENT;
				}

				// Read character process info
				const [readResult, processInfo] = this.kernel.read(procPath);
				if (readResult !== ErrorCode.SUCCESS) {
					if (debug) console.error(`[character] Failed to read process info: ${readResult}`);
					return readResult;
				}

				// Read entity file
				const entityPath = processInfo.path || `/v_entity/character-${characterId}`;
				if (!this.kernel.exists(entityPath)) {
					if (debug) console.warn(`[character] Character entity not found: ${entityPath}`);
					return ErrorCode.ENOENT;
				}

				const [entityReadResult, entity] = this.kernel.read(entityPath);
				if (entityReadResult !== ErrorCode.SUCCESS) {
					if (debug) console.error(`[character] Failed to read entity: ${entityReadResult}`);
					return entityReadResult;
				}

				// Store result in arg buffer
				arg._result = entity;
				return ErrorCode.SUCCESS;
			}

			if (request === REQUEST.SET_CHARACTER) {
				// Update character information
				const { characterId, data } = arg;
				if (!characterId || !data) return ErrorCode.EINVAL;

				// Check if character exists in /proc
				const procPath = `/v_proc/character/${characterId}`;
				if (!this.kernel.exists(procPath)) {
					if (debug) console.warn(`[character] Character not found in /proc: ${characterId}`);
					return ErrorCode.ENOENT;
				}

				// Read character process info
				const [readResult, processInfo] = this.kernel.read(procPath);
				if (readResult !== ErrorCode.SUCCESS) {
					if (debug) console.error(`[character] Failed to read process info: ${readResult}`);
					return readResult;
				}

				// Read entity file
				const entityPath = processInfo.path || `/v_entity/character-${characterId}`;
				if (!this.kernel.exists(entityPath)) {
					if (debug) console.warn(`[character] Character entity not found: ${entityPath}`);
					return ErrorCode.ENOENT;
				}

				// Write updated data
				const entityFd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
				if (entityFd < 0) return ErrorCode.ENOENT;

				try {
					// Read current entity
					const [entityReadResult, entity] = this.kernel.read(entityFd);
					if (entityReadResult !== ErrorCode.SUCCESS) return entityReadResult;

					// Update with new data
					Object.assign(entity, data);
					entity.metadata.updatedAt = Date.now();

					// Write back
					const writeResult = this.kernel.write(entityFd, entity);
					if (writeResult !== ErrorCode.SUCCESS) return writeResult;

					return ErrorCode.SUCCESS;
				} finally {
					this.kernel.close(entityFd);
				}
			}

			return ErrorCode.EINVAL;
		}
	};
}
