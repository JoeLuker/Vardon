/**
 * Combat capability - provides access to combat data through kernel interface
 */

import type { Capability } from '../../kernel/types';
import { ErrorCode } from '../../kernel/ErrorHandler';

/**
 * Combat device ioctl request codes
 */
export enum CombatRequest {
	GET_COMBAT_STATS = 1001,
	GET_CURRENT_HP = 1002,
	UPDATE_CURRENT_HP = 1003,
	GET_SAVES = 1004,
	UPDATE_SAVES = 1005,
	GET_AC_STATS = 1006,

	// Additional codes seen in logs
	GET_HP_STATS = 4097,
	GET_SAVE_STATS = 8193,
	GET_AC_BREAKDOWN = 12295
}

/**
 * Combat capability implementation
 * This acts as a device driver for combat data
 */
export class CombatCapability implements Capability {
	readonly id = 'combat';
	readonly version = '1.0.0';

	// Kernel reference
	kernel: any = null;

	// Cache to store combat data
	private combatCache: Map<string, any> = new Map();

	/**
	 * Called when the device is mounted
	 * @param kernel Reference to the kernel
	 */
	onMount(kernel: any): void {
		console.log(`[CombatCapability] Device mounting, kernel:`, !!kernel);
		this.kernel = kernel;

		// Ensure required directories exist
		this.ensureDirectoriesExist();
	}

	/**
	 * Read from combat device
	 */
	read(fd: number, buffer: any): number {
		// Return device information
		buffer.deviceType = 'combat';
		buffer.version = this.version;
		buffer.supportedRequests = Object.keys(CombatRequest)
			.filter((key) => isNaN(Number(key)))
			.map((key) => ({
				name: key,
				code: CombatRequest[key as keyof typeof CombatRequest]
			}));

		return ErrorCode.SUCCESS;
	}

	/**
	 * Process combat device requests
	 */
	ioctl(fd: number, request: number, arg: any): number {
		console.log(`[CombatCapability] Processing ioctl request ${request}`, arg);

		switch (request) {
			case CombatRequest.GET_COMBAT_STATS:
				return this.getCombatStats(arg);

			case CombatRequest.GET_CURRENT_HP:
			case CombatRequest.GET_HP_STATS: // Alias for GET_CURRENT_HP
				return this.getCurrentHP(arg);

			case CombatRequest.UPDATE_CURRENT_HP:
				return this.updateCurrentHP(arg);

			case CombatRequest.GET_SAVES:
			case CombatRequest.GET_SAVE_STATS: // Alias for GET_SAVES
				return this.getSaves(arg);

			case CombatRequest.UPDATE_SAVES:
				return this.updateSaves(arg);

			case CombatRequest.GET_AC_STATS:
			case CombatRequest.GET_AC_BREAKDOWN: // Alias for GET_AC_STATS
				return this.getACStats(arg);

			default:
				console.error(`[CombatCapability] Unknown request code: ${request}`);
				return ErrorCode.EINVAL;
		}
	}

	/**
	 * Get combat stats for character
	 */
	private getCombatStats(arg: any): number {
		const { entityPath } = arg;

		if (!entityPath) {
			console.error(`[CombatCapability] No entity path provided`);
			return ErrorCode.EINVAL;
		}

		// Ensure directories exist
		this.ensureDirectoriesExist();

		// Extract character ID from entity path
		const characterId = this.extractCharacterId(entityPath);

		// Get cached data or create default
		let stats = this.combatCache.get(characterId);

		if (!stats) {
			// Create default combat stats
			stats = {
				hp: {
					max: 45,
					current: 45,
					temp: 0,
					nonlethal: 0
				},
				saves: {
					fortitude: {
						base: 5,
						total: 7,
						misc: 0,
						breakdown: {
							base: 5,
							ability: 2,
							magic: 0,
							misc: 0
						}
					},
					reflex: {
						base: 5,
						total: 8,
						misc: 0,
						breakdown: {
							base: 5,
							ability: 3,
							magic: 0,
							misc: 0
						}
					},
					will: {
						base: 2,
						total: 4,
						misc: 0,
						breakdown: {
							base: 2,
							ability: 2,
							magic: 0,
							misc: 0
						}
					}
				},
				ac: {
					total: 16,
					touch: 13,
					flatFooted: 13,
					breakdown: {
						armor: 0,
						shield: 0,
						dex: 3,
						size: 0,
						natural: 0,
						deflection: 0,
						misc: 3
					}
				},
				initiative: {
					total: 7,
					breakdown: {
						dex: 3,
						misc: 4
					}
				},
				bab: 5,
				cmb: 5,
				cmd: 18
			};

			// Cache the data
			this.combatCache.set(characterId, stats);
		}

		// Add to result
		arg.stats = { ...stats };

		return ErrorCode.SUCCESS;
	}

	/**
	 * Get current HP for character
	 */
	private getCurrentHP(arg: any): number {
		const { entityPath } = arg;

		if (!entityPath) {
			console.error(`[CombatCapability] No entity path provided`);
			return ErrorCode.EINVAL;
		}

		// Ensure directories exist
		this.ensureDirectoriesExist();

		// Extract character ID from entity path
		const characterId = this.extractCharacterId(entityPath);

		// Get cached data or create default
		let stats = this.combatCache.get(characterId);

		if (!stats) {
			// Get full combat stats first
			const result = this.getCombatStats({ entityPath });
			if (result !== ErrorCode.SUCCESS) {
				return result;
			}

			stats = this.combatCache.get(characterId);
		}

		// Add HP to result
		arg.hp = { ...stats.hp };

		return ErrorCode.SUCCESS;
	}

	/**
	 * Update current HP for character
	 */
	private updateCurrentHP(arg: any): number {
		const { entityPath, hp } = arg;

		if (!entityPath || !hp) {
			console.error(`[CombatCapability] Missing required parameters for updating HP`);
			return ErrorCode.EINVAL;
		}

		// Ensure directories exist
		this.ensureDirectoriesExist();

		// Extract character ID from entity path
		const characterId = this.extractCharacterId(entityPath);

		// Get cached data or create default
		let stats = this.combatCache.get(characterId);

		if (!stats) {
			// Get full combat stats first
			const result = this.getCombatStats({ entityPath });
			if (result !== ErrorCode.SUCCESS) {
				return result;
			}

			stats = this.combatCache.get(characterId);
		}

		// Update HP
		stats.hp = { ...stats.hp, ...hp };

		// Cache the updated data
		this.combatCache.set(characterId, stats);

		return ErrorCode.SUCCESS;
	}

	/**
	 * Get saves for character
	 */
	private getSaves(arg: any): number {
		const { entityPath } = arg;

		if (!entityPath) {
			console.error(`[CombatCapability] No entity path provided`);
			return ErrorCode.EINVAL;
		}

		// Ensure directories exist
		this.ensureDirectoriesExist();

		// Extract character ID from entity path
		const characterId = this.extractCharacterId(entityPath);

		// Get cached data or create default
		let stats = this.combatCache.get(characterId);

		if (!stats) {
			// Get full combat stats first
			const result = this.getCombatStats({ entityPath });
			if (result !== ErrorCode.SUCCESS) {
				return result;
			}

			stats = this.combatCache.get(characterId);
		}

		// Add saves to result
		arg.saves = { ...stats.saves };

		return ErrorCode.SUCCESS;
	}

	/**
	 * Update saves for character
	 */
	private updateSaves(arg: any): number {
		const { entityPath, saves } = arg;

		if (!entityPath || !saves) {
			console.error(`[CombatCapability] Missing required parameters for updating saves`);
			return ErrorCode.EINVAL;
		}

		// Ensure directories exist
		this.ensureDirectoriesExist();

		// Extract character ID from entity path
		const characterId = this.extractCharacterId(entityPath);

		// Get cached data or create default
		let stats = this.combatCache.get(characterId);

		if (!stats) {
			// Get full combat stats first
			const result = this.getCombatStats({ entityPath });
			if (result !== ErrorCode.SUCCESS) {
				return result;
			}

			stats = this.combatCache.get(characterId);
		}

		// Update saves
		stats.saves = { ...stats.saves, ...saves };

		// Cache the updated data
		this.combatCache.set(characterId, stats);

		return ErrorCode.SUCCESS;
	}

	/**
	 * Get AC stats for character
	 */
	private getACStats(arg: any): number {
		const { entityPath } = arg;

		if (!entityPath) {
			console.error(`[CombatCapability] No entity path provided`);
			return ErrorCode.EINVAL;
		}

		// Ensure directories exist
		this.ensureDirectoriesExist();

		// Extract character ID from entity path
		const characterId = this.extractCharacterId(entityPath);

		// Get cached data or create default
		let stats = this.combatCache.get(characterId);

		if (!stats) {
			// Get full combat stats first
			const result = this.getCombatStats({ entityPath });
			if (result !== ErrorCode.SUCCESS) {
				return result;
			}

			stats = this.combatCache.get(characterId);
		}

		// Add AC to result
		arg.ac = { ...stats.ac };

		return ErrorCode.SUCCESS;
	}

	/**
	 * Helper function to extract character ID from entity path
	 */
	private extractCharacterId(entityPath: string): string {
		// Extract character ID from canonical path format:
		// - /proc/character/123
		const matches = entityPath.match(/\/proc\/character\/(\w+)/);

		if (!matches) {
			console.error(`[CombatCapability] Invalid path format: ${entityPath}`);
			throw new Error(`Invalid character path format: ${entityPath}`);
		}

		return matches[1];
	}

	/**
	 * Ensure required directories exist
	 * Creates /proc and /proc/character directories if they don't exist
	 */
	private ensureDirectoriesExist(): void {
		if (!this.kernel) {
			console.error(`[CombatCapability] Cannot create directories: kernel not available`);
			return;
		}

		// Check if /proc exists, create if not
		if (!this.kernel.exists('/proc')) {
			console.log(`[CombatCapability] Creating /proc directory`);
			this.kernel.mkdir('/proc');
		}

		// Check if /proc/character exists, create if not
		if (!this.kernel.exists('/proc/character')) {
			console.log(`[CombatCapability] Creating /proc/character directory`);
			this.kernel.mkdir('/proc/character');
		}
	}
}
