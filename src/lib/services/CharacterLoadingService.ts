import type { GameKernel, WebKernel } from '$lib/domain/kernel';
import { OpenMode, ErrorCode } from '$lib/domain/kernel';
import type { AssembledCharacter } from '$lib/domain/character/CharacterTypes';
import { logger } from '$lib/utils/Logger';

/**
 * Service responsible for loading character data from the kernel
 */
export class CharacterLoadingService {
	private readonly kernel: GameKernel | WebKernel;
	private readonly debug: boolean;

	constructor(kernel: GameKernel | WebKernel, debug: boolean = false) {
		this.kernel = kernel;
		this.debug = debug;
	}

	/**
	 * Load a character by ID
	 */
	async loadCharacter(
		characterId: number,
		preloadedData?: Partial<AssembledCharacter>
	): Promise<AssembledCharacter> {
		const characterPath = `/v_proc/character/${characterId}`;

		// Check if character device is available
		this.ensureDevicesAvailable();

		// Open character device
		const deviceFd = this.kernel.open('/v_dev/character', OpenMode.READ);
		if (deviceFd < 0) {
			throw new Error(`Failed to open character device: ${ErrorCode[-deviceFd]}`);
		}

		try {
			// Load character data through device
			const character = await this.loadCharacterFromDevice(deviceFd, characterId, characterPath);

			// Merge with preloaded data if available
			if (preloadedData && typeof preloadedData === 'object') {
				logger.debug('CharacterLoadingService', 'loadCharacter', 'Merging preloaded data');
				Object.assign(character, preloadedData);
			}

			// Store character in proc filesystem
			await this.storeCharacterInProc(characterPath, character);

			return character;
		} finally {
			this.kernel.close(deviceFd);
		}
	}

	/**
	 * Check if all required resources are available
	 */
	checkResourcesAvailable(): boolean {
		if (!this.kernel) return false;

		// Ensure devices map exists
		if (!this.kernel.devices) {
			this.kernel.devices = new Map();
		}

		const hasCharDevice = this.kernel.devices.has('/v_dev/character');
		const hasDbDevice = this.kernel.devices.has('/v_dev/db');
		const dbDirsReady = this.kernel.exists('/v_etc/db_dirs_ready');

		return hasCharDevice && hasDbDevice && dbDirsReady;
	}

	/**
	 * Get diagnostic info for the last load operation
	 */
	getDiagnosticInfo(character: AssembledCharacter): Record<string, any> {
		return {
			characterId: character.id,
			loadTime: new Date().toISOString(),
			source: 'device',
			ancestryId: character.game_character_ancestry?.[0]?.ancestry_id,
			ancestry: character.game_character_ancestry?.[0]?.ancestry?.name,
			classes: character.game_character_class?.map((c) => c.class?.name),
			level: character.totalLevel
		};
	}

	/**
	 * Ensure required devices are available
	 */
	private ensureDevicesAvailable(): void {
		if (!this.kernel.devices) {
			logger.error('CharacterLoadingService', 'ensureDevicesAvailable', 'Device map is undefined');
			this.kernel.devices = new Map();
		}

		if (!this.kernel.devices.has('/v_dev/character')) {
			const availableDevices = Array.from(this.kernel.devices.keys());
			logger.error(
				'CharacterLoadingService',
				'ensureDevicesAvailable',
				'Character device not found',
				{ availableDevices }
			);
			throw new Error(`Character device not mounted: ${ErrorCode.EDEVNOTREADY}`);
		}
	}

	/**
	 * Load character data from device
	 */
	private async loadCharacterFromDevice(
		deviceFd: number,
		characterId: number,
		characterPath: string
	): Promise<AssembledCharacter> {
		const buffer: any = {
			operation: 'getCharacter',
			entityPath: characterPath,
			characterId
		};

		logger.debug('CharacterLoadingService', 'loadCharacterFromDevice', 'Calling ioctl', {
			characterId,
			buffer
		});

		const result = await this.kernel.ioctl(deviceFd, 1001, buffer);

		if (result !== 0) {
			logger.error('CharacterLoadingService', 'loadCharacterFromDevice', 'ioctl failed', {
				result,
				errorDetails: buffer.errorDetails
			});
			throw new Error(`Failed to get character data: ${ErrorCode[result]}`);
		}

		// Validate character data
		const loadedCharacter = buffer.character as AssembledCharacter;
		if (!loadedCharacter?.id) {
			logger.error('CharacterLoadingService', 'loadCharacterFromDevice', 'Invalid character data', {
				buffer
			});
			throw new Error('Invalid character data received from device');
		}

		// Calculate and add totalLevel
		const totalLevel = this.calculateTotalLevel(loadedCharacter);
		loadedCharacter.totalLevel = totalLevel;

		// Transform ABP data
		this.transformAbpData(loadedCharacter);

		logger.info(
			'CharacterLoadingService',
			'loadCharacterFromDevice',
			'Character loaded successfully',
			{
				id: loadedCharacter.id,
				name: loadedCharacter.name,
				totalLevel,
				hasAbpChoices: !!loadedCharacter.game_character_abp_choice
			}
		);

		return loadedCharacter;
	}

	/**
	 * Calculate total character level
	 */
	private calculateTotalLevel(character: AssembledCharacter): number {
		return (
			character.game_character_class?.reduce(
				(sum, classEntry) => sum + (classEntry.level || 0),
				0
			) || 0
		);
	}

	/**
	 * Transform ABP data to match AssembledCharacter interface
	 */
	private transformAbpData(character: AssembledCharacter): void {
		if (character.game_character_abp_choice) {
			character.abpData = {
				nodes: character.game_character_abp_choice.map((choice) => choice.node).filter(Boolean),
				appliedBonuses: []
			};
		} else {
			character.abpData = {
				nodes: [],
				appliedBonuses: []
			};
		}
	}

	/**
	 * Store character data in proc filesystem
	 */
	private async storeCharacterInProc(
		characterPath: string,
		character: AssembledCharacter
	): Promise<void> {
		const stats = this.kernel.stat(characterPath);

		// Fix directory issues if needed
		if (stats?.isDirectory()) {
			logger.debug('CharacterLoadingService', 'storeCharacterInProc', 'Removing directory', {
				characterPath
			});
			this.kernel.unlink(characterPath);
		}

		// Ensure parent directories exist
		this.ensureProcDirectories();

		// Create/update character file
		if (!this.kernel.exists(characterPath) || stats?.isDirectory()) {
			logger.debug('CharacterLoadingService', 'storeCharacterInProc', 'Creating character file', {
				characterPath
			});

			const createResult = this.kernel.create(characterPath, character);
			if (!createResult.success) {
				logger.warn(
					'CharacterLoadingService',
					'storeCharacterInProc',
					'Failed to create character file',
					{ error: createResult.errorMessage }
				);
			}
		}
	}

	/**
	 * Ensure /proc directories exist
	 */
	private ensureProcDirectories(): void {
		if (!this.kernel.exists('/v_proc')) {
			logger.debug('CharacterLoadingService', 'ensureProcDirectories', 'Creating /v_proc');
			this.kernel.mkdir('/v_proc');
		}

		if (!this.kernel.exists('/v_proc/character')) {
			logger.debug(
				'CharacterLoadingService',
				'ensureProcDirectories',
				'Creating /v_proc/character'
			);
			this.kernel.mkdir('/v_proc/character');
		}
	}
}
