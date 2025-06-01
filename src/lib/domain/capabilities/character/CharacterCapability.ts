/**
 * Character capability - provides access to character data through kernel interface
 */

import type { Capability } from '../../kernel/types';
import { ErrorCode } from '../../kernel/ErrorHandler';
import type { SupabaseDatabaseDriver } from '../database/SupabaseDatabaseDriver';
import type { CompleteCharacter } from '../../../types/supabase';

/**
 * Character device ioctl request codes
 */
export enum CharacterRequest {
	GET_CHARACTER = 1001,
	UPDATE_CHARACTER = 1002,
	GET_ABILITIES = 1003,
	UPDATE_ABILITY = 1004
}

/**
 * Directory paths used by the character capability
 */
export const CHAR_PATHS = {
	PROC: '/v_proc',
	PROC_CHARACTER: '/v_proc/character'
};

/**
 * Character capability implementation
 * This acts as a device driver for character data
 */
export class CharacterCapability implements Capability {
	readonly id = 'character';
	readonly version = '1.0.0';

	// Implement the kernel property required by the Capability interface
	kernel: any = null;

	// Database driver for data access
	databaseDriver: SupabaseDatabaseDriver | null = null;

	// Called when the device is mounted
	onMount(kernel: any): void {
		console.log(`[CharacterCapability] Device mounting, kernel:`, !!kernel);
		console.log(`[CharacterCapability] Has database driver:`, !!this.databaseDriver);
		this.kernel = kernel;

		// Ensure required directories exist
		this.ensureDirectoriesExist();

		// Try to get database driver from kernel if it's not already set
		if (!this.databaseDriver && kernel) {
			// The Unix Way: Wait for database device availability with event mechanism
			const attachDatabaseDriver = () => {
				// Look for the database device in kernel
				const dbDevice = kernel.mountPoints?.get('/v_dev/db') || kernel.devices?.get('/v_dev/db');
				if (dbDevice) {
					console.log(`[CharacterCapability] Found database driver in kernel, attaching it`);
					// Store a direct reference to the database driver
					this.databaseDriver = dbDevice.driver || dbDevice;

					// Log driver details for debugging
					const driverDetails = {
						hasClient: !!(this.databaseDriver as any).client,
						hasKernel: !!(this.databaseDriver as any).kernel,
						type: this.databaseDriver.constructor ? this.databaseDriver.constructor.name : 'unknown'
					};
					console.log(`[CharacterCapability] Attached database driver details:`, driverDetails);

					// Remove event listener if we successfully attached the driver
					if (kernel.events) {
						kernel.events.off(dbReadySubscription);
					}

					// Emit an event to notify other components that character device is fully ready
					if (kernel.events) {
						kernel.events.emit('character:device_ready', {
							path: '/v_dev/character',
							hasDbDriver: true,
							driverDetails
						});
					}

					return true;
				}
				return false;
			};

			// First try immediate attachment
			if (!attachDatabaseDriver()) {
				console.warn(
					`[CharacterCapability] Database driver not found in kernel during mount, waiting for database:ready event`
				);

				// Subscribe to database:ready event
				let dbReadySubscription = '';
				if (kernel.events) {
					dbReadySubscription = kernel.events.on('database:ready', (event) => {
						console.log(`[CharacterCapability] Received database:ready event:`, event);

						// Try to attach driver again after ready event
						if (attachDatabaseDriver()) {
							console.log(
								`[CharacterCapability] Successfully attached database driver after ready event`
							);
						} else {
							console.error(
								`[CharacterCapability] Failed to attach database driver after ready event`
							);
						}
					});
				}
			}
		}

		// Log character capability mounting to help with debugging
		console.log(`[CharacterCapability] Character device mounted at /dev/character`);
		console.log(`[CharacterCapability] Database driver status after mount:`, !!this.databaseDriver);

		// Emit an event to notify other components
		if (kernel && kernel.events) {
			kernel.events.emit('character:device_ready', {
				path: '/v_dev/character',
				hasDbDriver: !!this.databaseDriver
			});
		}
	}

	// Store loaded character data for quick access
	private characterCache: Map<string, CompleteCharacter> = new Map();

	/**
	 * Ensures the required directory structure exists
	 *
	 * IMPORTANT: This only creates parent directories, not character-specific directories
	 * Characters are FILES, not directories!
	 *
	 * @returns ErrorCode.SUCCESS if successful, otherwise an error code
	 */
	private ensureDirectoriesExist(): number {
		console.log('[CharacterCapability] Ensuring directory structure exists');

		if (!this.kernel) {
			console.error('[CharacterCapability] No kernel reference available');
			return ErrorCode.EINVAL;
		}

		// Create /proc if it doesn't exist
		if (!this.kernel.exists(CHAR_PATHS.PROC)) {
			console.log(`[CharacterCapability] Creating directory: ${CHAR_PATHS.PROC}`);
			const result = this.kernel.mkdir(CHAR_PATHS.PROC);
			if (!result.success) {
				console.error(
					`[CharacterCapability] Failed to create directory: ${CHAR_PATHS.PROC}`,
					result
				);
				return ErrorCode.EIO;
			}
		}

		// Create /proc/character if it doesn't exist
		if (!this.kernel.exists(CHAR_PATHS.PROC_CHARACTER)) {
			console.log(`[CharacterCapability] Creating directory: ${CHAR_PATHS.PROC_CHARACTER}`);
			const result = this.kernel.mkdir(CHAR_PATHS.PROC_CHARACTER);
			if (!result.success) {
				console.error(
					`[CharacterCapability] Failed to create directory: ${CHAR_PATHS.PROC_CHARACTER}`,
					result
				);
				return ErrorCode.EIO;
			}
		}

		return ErrorCode.SUCCESS;
	}

	/**
	 * Read from character device
	 */
	read(fd: number, buffer: any): number {
		// Ensure directories exist before reading
		const dirResult = this.ensureDirectoriesExist();
		if (dirResult !== ErrorCode.SUCCESS) {
			return dirResult;
		}

		// Return device information
		buffer.deviceType = 'character';
		buffer.version = this.version;
		buffer.supportedRequests = Object.keys(CharacterRequest)
			.filter((key) => isNaN(Number(key)))
			.map((key) => ({
				name: key,
				code: CharacterRequest[key as keyof typeof CharacterRequest]
			}));

		return ErrorCode.SUCCESS;
	}

	/**
	 * Helper function to extract character ID from entity path
	 */
	private extractCharacterId(entityPath: string): string {
		// First, ensure the directory structure exists
		if (this.kernel) {
			this.ensureDirectoriesExist();
		}

		// Extract character ID from canonical path format:
		// - /proc/character/123
		const matches = entityPath.match(/\/proc\/character\/(\w+)/);

		if (!matches) {
			console.error(`[CharacterCapability] Invalid path format: ${entityPath}`);
			throw new Error(`Invalid character path format: ${entityPath}`);
		}

		return matches[1];
	}

	/**
	 * Process character device requests
	 */
	async ioctl(fd: number, request: number, arg: any): Promise<number> {
		console.log(`[CharacterCapability] Processing ioctl request ${request}`, arg);

		// Ensure directories exist before processing any request
		const dirResult = this.ensureDirectoriesExist();
		if (dirResult !== ErrorCode.SUCCESS) {
			return dirResult;
		}

		// Verify database driver is available before processing any request
		if (!this.databaseDriver) {
			console.error(`[CharacterCapability] Database driver not available during ioctl call`);

			// Try to find database driver in kernel - with improved driver reference extraction
			if (this.kernel) {
				const dbDevice =
					this.kernel.mountPoints?.get('/v_dev/db') || this.kernel.devices?.get('/v_dev/db');
				if (dbDevice) {
					console.log(
						`[CharacterCapability] Found database driver in kernel, attaching it during ioctl`
					);

					// Try to get the actual driver instance - it might be nested in the device object
					this.databaseDriver = dbDevice.driver || dbDevice;

					// Log detailed driver information to help debugging
					const driverDetails = {
						hasClient: !!(this.databaseDriver as any).client,
						hasKernel: !!(this.databaseDriver as any).kernel,
						type: this.databaseDriver.constructor
							? this.databaseDriver.constructor.name
							: 'unknown',
						methods: Object.getOwnPropertyNames((this.databaseDriver as any).__proto__).filter(
							(m) => typeof (this.databaseDriver as any)[m] === 'function'
						)
					};
					console.log(
						`[CharacterCapability] Attached database driver details during ioctl:`,
						driverDetails
					);

					// Emit event to notify that we've recovered the driver connection
					if (this.kernel.events) {
						this.kernel.events.emit('character:recovered_db_connection', {
							timestamp: Date.now(),
							request: request,
							driverDetails
						});
					}
				} else {
					// Try to wait for the database to be ready - implements a retry mechanism
					console.warn(
						`[CharacterCapability] Database driver not found in kernel during ioctl, will retry up to 3 times`
					);

					// The Unix Way: Emit clear event for diagnostic purposes
					if (this.kernel.events) {
						this.kernel.events.emit('character:missing_db_driver', {
							timestamp: Date.now(),
							request: request
						});
					}

					// Set up retry mechanism with a small delay
					const MAX_RETRIES = 3;
					let retries = 0;
					let dbDriverFound = false;

					// Attempt retry with exponential backoff
					while (retries < MAX_RETRIES && !dbDriverFound) {
						retries++;
						console.log(
							`[CharacterCapability] Retry ${retries}/${MAX_RETRIES} to find database driver`
						);

						// Wait a bit before retry (exponential backoff)
						const delay = 50 * Math.pow(2, retries - 1);
						await new Promise((resolve) => setTimeout(resolve, delay));

						// Try again
						const dbDevice =
							this.kernel.mountPoints?.get('/v_dev/db') || this.kernel.devices?.get('/v_dev/db');
						if (dbDevice) {
							console.log(`[CharacterCapability] Found database driver on retry ${retries}`);
							this.databaseDriver = dbDevice.driver || dbDevice;
							dbDriverFound = true;
							break;
						}
					}

					// If still not found after retries, return error
					if (!dbDriverFound) {
						console.error(
							`[CharacterCapability] Database driver not found after ${MAX_RETRIES} retries`
						);
						if (arg) {
							arg.errorDetails = {
								errorType: 'MISSING_DATABASE_DRIVER',
								message: 'Database driver not available after retries',
								retries: MAX_RETRIES
							};
						}
						return ErrorCode.ENOSYS;
					}
				}
			} else {
				console.error(`[CharacterCapability] Kernel not available during ioctl`);
				if (arg) {
					arg.errorDetails = {
						errorType: 'MISSING_KERNEL',
						message: 'Kernel not available'
					};
				}
				return ErrorCode.ENOSYS;
			}
		}

		try {
			let result;
			switch (request) {
				case CharacterRequest.GET_CHARACTER:
					result = await this.getCharacter(arg);
					console.log(`[CharacterCapability] Get character ioctl result: ${result}`);
					return result;

				case CharacterRequest.UPDATE_CHARACTER:
					result = this.updateCharacter(arg);
					console.log(`[CharacterCapability] Update character ioctl result: ${result}`);
					return result;

				case CharacterRequest.GET_ABILITIES:
					result = this.getAbilities(arg);
					console.log(`[CharacterCapability] Get abilities ioctl result: ${result}`);
					return result;

				case CharacterRequest.UPDATE_ABILITY:
					result = this.updateAbility(arg);
					console.log(`[CharacterCapability] Update ability ioctl result: ${result}`);
					return result;

				default:
					console.error(`[CharacterCapability] Unknown request code: ${request}`);
					return ErrorCode.EINVAL;
			}
		} catch (error) {
			console.error(`[CharacterCapability] Error processing ioctl request:`, error);
			// Create a more detailed error in the buffer
			if (arg) {
				arg.errorDetails = {
					message: error.message || 'Unknown error',
					stack: error.stack,
					error: String(error)
				};
			}
			return ErrorCode.EIO;
		}
	}

	/**
	 * Get a character by ID
	 */
	private async getCharacter(arg: any): Promise<number> {
		// Check parameters - now support 'operation' field for Unix-style IOCTL
		const { operation, entityPath, characterId } = arg;

		if ((!operation || operation !== 'getCharacter') && !entityPath && !characterId) {
			console.error(`[CharacterCapability] Invalid parameters for character operation`);
			return ErrorCode.EINVAL;
		}

		// Ensure directory structure exists
		const dirResult = this.ensureDirectoriesExist();
		if (dirResult !== ErrorCode.SUCCESS) {
			return dirResult;
		}

		// Extract the character ID from path if not provided
		const id = characterId || this.extractCharacterId(entityPath);

		try {
			// Check if we have a database driver available
			if (!this.databaseDriver) {
				console.error(`[CharacterCapability] No database driver available during getCharacter`);

				// The Unix Way: Attempt recovery one more time
				if (this.kernel) {
					console.log(
						`[CharacterCapability] Attempting last-ditch database driver recovery in getCharacter`
					);

					// Try to get the database driver from kernel - with improved driver extraction
					const dbDevice =
						this.kernel.mountPoints?.get('/v_dev/db') || this.kernel.devices?.get('/v_dev/db');

					if (dbDevice) {
						// Try to get the driver reference from the device
						this.databaseDriver = dbDevice.driver || dbDevice;
						console.log(`[CharacterCapability] Recovered database driver in getCharacter`);

						// Emit recovery event
						if (this.kernel.events) {
							this.kernel.events.emit('character:recovered_db_driver', {
								timestamp: Date.now(),
								characterId: id,
								source: 'getCharacter'
							});
						}
					} else {
						// No recovery possible
						return ErrorCode.ENOSYS;
					}
				} else {
					// No kernel, no recovery
					return ErrorCode.ENOSYS;
				}
			}

			console.log(`[CharacterCapability] Using database driver to get character ${id}`);

			// Add comprehensive diagnostic info about database driver
			const driverInfo = {
				hasClient: !!(this.databaseDriver as any).client,
				hasKernel: !!(this.databaseDriver as any).kernel,
				schemaCount: (this.databaseDriver as any).schemaRegistry?.size || 'unknown',
				type: this.databaseDriver.constructor ? this.databaseDriver.constructor.name : 'unknown',
				hasGetCharacterById: typeof (this.databaseDriver as any).getCharacterById === 'function',
				hasQuery: typeof (this.databaseDriver as any).query === 'function',
				isSupabaseDriver: (this.databaseDriver.constructor?.name || '').includes('Supabase')
			};
			console.log(`[CharacterCapability] Database driver details:`, driverInfo);

			// Check if id is a string or number and handle it appropriately
			// For string IDs that aren't numeric, we'll try to find by name instead (future feature)
			// For now, we'll parse it as a number or use the string directly
			const characterId = id.toString().match(/^\d+$/)
				? Number(id)
				: isNaN(parseInt(id))
					? id
					: parseInt(id);

			// Implementing retry mechanism (up to 3 attempts)
			const MAX_RETRIES = 3;
			let retryCount = 0;
			let lastError = null;

			while (retryCount < MAX_RETRIES) {
				try {
					console.log(
						`[CharacterCapability] Attempt ${retryCount + 1}/${MAX_RETRIES} to get character ${characterId}`
					);

					// Try multiple approaches to fetch character data from the database
					let characterData;

					// The Unix Way: Use only approved database driver methods
					if (typeof this.databaseDriver.getCharacterById === 'function') {
						console.log(`[CharacterCapability] Using direct getCharacterById method`);
						characterData = await this.databaseDriver.getCharacterById(characterId, 'complete');
					}
					// Try query method if available
					else if (typeof (this.databaseDriver as any).query === 'function') {
						console.log(`[CharacterCapability] Using driver.query method`);
						const results = await (this.databaseDriver as any).query(
							'game_character',
							{ id: characterId },
							'*'
						);
						characterData = Array.isArray(results) && results.length > 0 ? results[0] : null;
					}
					// No proper method found
					else {
						// The Unix Way: No direct database access allowed
						throw new Error(
							`Database operations must use Unix file operations - direct client access not allowed`
						);
					}

					// If we got character data, process it
					if (characterData && characterData.id) {
						console.log(
							`[CharacterCapability] Successfully loaded character from database: ${characterData.id}, ${characterData.name}`
						);

						// Store in the argument buffer
						arg.character = characterData;

						// Cache the character data
						this.characterCache.set(String(characterData.id), characterData);

						// Success - return immediately
						return ErrorCode.SUCCESS;
					} else {
						console.error(
							`[CharacterCapability] Invalid character data received (attempt ${retryCount + 1})`
						);
						retryCount++;
						await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
						continue;
					}
				} catch (dbError) {
					lastError = dbError;
					console.error(
						`[CharacterCapability] Database error getting character (attempt ${retryCount + 1}):`,
						dbError
					);

					// Increment retry counter
					retryCount++;

					// Short delay before retry (exponential backoff)
					if (retryCount < MAX_RETRIES) {
						const delay = 100 * Math.pow(2, retryCount - 1);
						console.log(`[CharacterCapability] Retrying after ${delay}ms...`);
						await new Promise((resolve) => setTimeout(resolve, delay));
					}
				}
			}

			// All retries failed - provide error details
			console.error(
				`[CharacterCapability] All ${MAX_RETRIES} attempts to fetch character ${characterId} failed`
			);

			// Try to provide more specific error details based on the last error
			if (lastError) {
				console.error(`[CharacterCapability] Database error getting character:`, lastError);

				// Try to provide more specific error details
				if (lastError.message?.includes('not found')) {
					console.error(`[CharacterCapability] Character ID ${characterId} not found in database`);
					arg.errorDetails = {
						errorType: 'CHARACTER_NOT_FOUND',
						characterId,
						message: `Character with ID ${characterId} not found`
					};
					return ErrorCode.ENOENT; // No such file or directory
				}

				if (lastError.message?.includes('Database error')) {
					console.error(`[CharacterCapability] Database connection error`);
					arg.errorDetails = {
						errorType: 'DATABASE_CONNECTION',
						message: 'Database connection issue'
					};
				}

				return ErrorCode.EIO;
			}
		} catch (error) {
			console.error(`[CharacterCapability] Error getting character data:`, error);
			arg.errorDetails = {
				errorType: 'GENERAL_ERROR',
				message: error.message || 'Unknown error'
			};
			return ErrorCode.EIO;
		}
	}

	/**
	 * Update a character
	 */
	private updateCharacter(arg: any): number {
		const { entityPath, character } = arg;

		if (!entityPath || !character) {
			console.error(`[CharacterCapability] No entity path or character data provided`);
			return ErrorCode.EINVAL;
		}

		// Ensure directory structure exists
		const dirResult = this.ensureDirectoriesExist();
		if (dirResult !== ErrorCode.SUCCESS) {
			return dirResult;
		}

		// Update the cache
		this.characterCache.set(character.id, character);

		return ErrorCode.SUCCESS;
	}

	/**
	 * Get character abilities
	 */
	private getAbilities(arg: any): number {
		const { entityPath } = arg;

		if (!entityPath) {
			console.error(`[CharacterCapability] No entity path provided`);
			return ErrorCode.EINVAL;
		}

		// Ensure directory structure exists
		const dirResult = this.ensureDirectoriesExist();
		if (dirResult !== ErrorCode.SUCCESS) {
			return dirResult;
		}

		const characterId = this.extractCharacterId(entityPath);
		const character = this.characterCache.get(characterId);

		if (!character) {
			console.error(`[CharacterCapability] Character not found: ${characterId}`);
			return ErrorCode.ENOENT;
		}

		arg.abilities = character.abilities || {
			STR: 10,
			DEX: 10,
			CON: 10,
			INT: 10,
			WIS: 10,
			CHA: 10
		};

		return ErrorCode.SUCCESS;
	}

	/**
	 * Update character ability
	 */
	private updateAbility(arg: any): number {
		const { entityPath, ability, value } = arg;

		if (!entityPath || !ability || value === undefined) {
			console.error(`[CharacterCapability] Missing required parameters for ability update`);
			return ErrorCode.EINVAL;
		}

		// Ensure directory structure exists
		const dirResult = this.ensureDirectoriesExist();
		if (dirResult !== ErrorCode.SUCCESS) {
			return dirResult;
		}

		const characterId = this.extractCharacterId(entityPath);
		const character = this.characterCache.get(characterId);

		if (!character) {
			console.error(`[CharacterCapability] Character not found: ${characterId}`);
			return ErrorCode.ENOENT;
		}

		if (!character.abilities) {
			character.abilities = {};
		}

		character.abilities[ability] = value;

		return ErrorCode.SUCCESS;
	}
}
