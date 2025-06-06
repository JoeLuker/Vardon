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
import {
	createBrowserDbDevice,
	createUnixAbilityDevice,
	createUnixBonusDevice,
	createUnixSkillDevice,
	createUnixCombatDevice,
	createUnixConditionDevice,
	createBrowserCharacterDevice
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
	kernel.addPendingCapability('bonus', createUnixBonusDevice({ debug }));
	kernel.addPendingCapability('ability', createUnixAbilityDevice({ debug }));
	kernel.addPendingCapability('skill', createUnixSkillDevice({ debug }));
	kernel.addPendingCapability('combat', createUnixCombatDevice({ debug }));
	kernel.addPendingCapability('condition', createUnixConditionDevice({ debug }));
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
