/**
 * Application Initializer - True Unix Architecture
 *
 * This file provides the entry point for initializing the application following strict Unix principles:
 * - Everything is a file
 * - Clean separation of kernel and user space
 * - Files as the primary communication mechanism
 * - Standard I/O operations (open, read, write, close)
 * - Device files for hardware/capability abstraction
 */

import { GameKernel } from './kernel/GameKernel';
import { WebKernel } from './kernel/WebKernel';
import { EventBus } from './kernel/EventBus';
import { GameRulesAPI } from '$lib/db/gameRules.api';
import type { Capability, Entity } from './kernel/types';
import { OpenMode, ErrorCode } from './kernel/types';
import { PluginLoader } from './plugins/PluginLoader';
import { createPluginManager, type PluginManager } from './plugins/PluginManagerComposed';
import { initializeBrowserApplication, type BrowserApplication } from './application-browser';
import {
	createUnixDbDevice,
	createUnixAbilityDevice,
	createUnixBonusDevice,
	createUnixSkillDevice,
	createUnixCombatDevice,
	createUnixConditionDevice
} from './devices';
import { REQUEST } from './devices/constants';

// The Unix Way: Everything is a file, even our capabilities
const PATHS = {
	// Device files
	DB_DEVICE: '/v_dev/db',
	ABILITY_DEVICE: '/v_dev/ability',
	BONUS_DEVICE: '/v_dev/bonus',
	SKILL_DEVICE: '/v_dev/skill',
	COMBAT_DEVICE: '/v_dev/combat',
	CONDITION_DEVICE: '/v_dev/condition',

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

/**
 * Application interface
 */
export interface Application {
	kernel: GameKernel | WebKernel;
	pluginManager: PluginManager;
	loadCharacter: (characterId: number) => Promise<Entity | null>;
	shutdown: () => Promise<void>;
}

/**
 * Detect if we're running in a browser environment
 * @returns Boolean indicating if we're running in a browser
 */
function isBrowserEnvironment(): boolean {
	return (
		typeof window !== 'undefined' &&
		typeof document !== 'undefined' &&
		typeof localStorage !== 'undefined'
	);
}

/**
 * Initialize the application
 * @param options Initialization options
 * @returns The initialized application components
 */
export async function initializeApplication(
	options: { debug?: boolean } = {}
): Promise<Application> {
	// Check if we're running in a browser environment
	if (isBrowserEnvironment()) {
		console.log('[init] Browser environment detected, using WebKernel');
		// Use the browser-specific implementation
		return initializeBrowserApplication(options);
	}

	// Initialize Unix-like kernel for non-browser environments
	console.log('[init] Creating kernel');
	const debug = options.debug ?? true;
	const eventBus = new EventBus(debug);

	// Create kernel (like init process in Unix)
	const kernel = new GameKernel({
		eventEmitter: eventBus,
		debug,
		noFsEvents: false
	});

	// The kernel already creates standard filesystem directories in its constructor
	// so we don't need to create them again, but we'll create application-specific ones
	console.log('[init] Creating filesystem hierarchy');
	// Create application-specific directory structure
	kernel.mkdir('/v_proc/character');
	kernel.mkdir('/v_var/log');

	// Create configuration file with defaults
	console.log('[init] Writing configuration');
	const config = {
		debug,
		version: '1.0.0',
		database: { url: 'postgres://' }
	};
	kernel.create(PATHS.CONFIG, config);

	// Create log file
	console.log('[init] Creating log file');
	kernel.create(PATHS.LOG, { entries: [] });

	// Mount device drivers (like device files in /dev)
	console.log('[init] Mounting device drivers');

	// The Unix Way: Device files are created in /dev
	// Create game rules API for database access
	const gameRulesAPI = new GameRulesAPI();
	const dbDevice = createUnixDbDevice(gameRulesAPI, { debug });
	kernel.mount(PATHS.DB_DEVICE, dbDevice);

	const bonusDevice = createUnixBonusDevice({ debug });
	kernel.mount(PATHS.BONUS_DEVICE, bonusDevice);

	const abilityDevice = createUnixAbilityDevice({ debug });
	kernel.mount(PATHS.ABILITY_DEVICE, abilityDevice);

	const skillDevice = createUnixSkillDevice({ debug });
	kernel.mount(PATHS.SKILL_DEVICE, skillDevice);

	const combatDevice = createUnixCombatDevice({ debug });
	kernel.mount(PATHS.COMBAT_DEVICE, combatDevice);

	const conditionDevice = createUnixConditionDevice({ debug });
	kernel.mount(PATHS.CONDITION_DEVICE, conditionDevice);

	// Initialize plugin system
	console.log('[init] Initializing plugin system');
	const pluginLoader = new PluginLoader(kernel, debug);
	const pluginManager = createPluginManager({ debug, kernel });

	// Log write helper function (Unix-style append to log)
	async function log(message: string): Promise<void> {
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
	 * A promise-based wrapper for writing to a file descriptor
	 * @param fd File descriptor
	 * @param data Data to write
	 * @returns Promise resolving to error code
	 */
	async function writeAsync(fd: number, data: any): Promise<number> {
		// Handle device files with async write methods
		const descriptor = kernel.fileDescriptors?.get(fd);
		if (!descriptor) {
			console.error(`Invalid file descriptor: ${fd}`);
			return ErrorCode.EBADF;
		}

		const device = kernel.mountPoints?.get(descriptor.path);
		if (device && typeof device.write === 'function') {
			try {
				const result = device.write(fd, data);
				// If the device's write method returns a Promise, await it
				if (result instanceof Promise) {
					return await result;
				}
				// Otherwise return the result directly
				return result;
			} catch (error) {
				console.error(`Error writing to device: ${descriptor.path}`, error);
				return ErrorCode.EIO;
			}
		}

		// For non-device files, use the standard write method
		return kernel.write(fd, data);
	}

	/**
	 * Load a character from the database using Unix-style file operations
	 * @param characterId Character ID
	 * @returns Loaded character entity
	 */
	async function loadCharacter(characterId: number): Promise<Entity | null> {
		await log(`Loading character: ${characterId}`);

		// The Unix Way: All operations are file operations

		// 1. Prepare request to database device
		const requestData = {
			operation: 'getCharacter',
			characterId
		};

		// 2. Open database device file (like device files in /dev)
		const dbFd = kernel.open(PATHS.DB_DEVICE, OpenMode.READ_WRITE);
		if (dbFd < 0) {
			console.error(`Failed to open database device: ${PATHS.DB_DEVICE}`);
			return null;
		}

		try {
			// 3. Write request to device file using our writeAsync helper
			const writeResult = await writeAsync(dbFd, requestData);
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

			// 6. Create entity path
			const entityId = `character-${characterId}`;
			const entityPath = `${PATHS.ENTITIES}/${entityId}`;

			// 7. Check if entity file already exists, remove if it does
			if (kernel.exists(entityPath)) {
				const unlinkResult = kernel.unlink(entityPath);
				if (unlinkResult !== ErrorCode.SUCCESS) {
					console.error(`Failed to remove existing entity: ${unlinkResult}`);
					return null;
				}
			}

			// 8. Create base entity file
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

			// 9. Write entity file
			const createResult = kernel.create(entityPath, entity);
			if (!createResult.success) {
				console.error(`Failed to create entity file: ${createResult.errorMessage}`);
				return null;
			}

			// 10. Initialize character with all capability devices using ioctl
			await initializeCharacterWithDevices(entityId);

			// 11. Read the fully initialized character
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
			PATHS.BONUS_DEVICE
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

			// Then shut down the kernel (closes all file descriptors, unmounts devices)
			await kernel.shutdown();

			console.log('Application shutdown complete');
		} catch (error) {
			console.error('Error during shutdown:', error);
		}
	}

	console.log('Application initialized successfully');

	return {
		kernel,
		pluginManager,
		loadCharacter,
		shutdown
	};
}

//------------------------------------------------------------------------------
// Unix-style Device Implementations
//------------------------------------------------------------------------------
