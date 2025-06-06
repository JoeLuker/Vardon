/**
 * CharacterDataService - Orchestrates character data access
 * Handles the logic of trying file first, then database
 * This is the ONLY service that should coordinate between storage layers
 */

import type { Kernel } from '../kernel/Kernel';
import type { DatabaseCapability } from '../capabilities/database/DatabaseCapability';
import type { CompleteCharacter } from '../types/supabase';
import type { Result } from './CharacterFileService';
import { CharacterFileService } from './CharacterFileService';
import { CacheService } from './CacheService';
import { logger, LogLevel } from '../utils/Logger';
import { ErrorCode } from '../kernel/types';

export class CharacterDataService {
	private fileService: CharacterFileService;
	private cache: CacheService;

	constructor(
		private kernel: Kernel,
		private database: DatabaseCapability
	) {
		this.fileService = new CharacterFileService(kernel);
		this.cache = new CacheService();
	}

	async getCharacter(characterId: number): Promise<Result<CompleteCharacter>> {
		const cacheKey = `character:${characterId}`;
		
		// 1. Check cache first
		const cached = this.cache.get<CompleteCharacter>(cacheKey);
		if (cached) {
			logger.debug('CharacterDataService', 'getCharacter', `Cache hit for character ${characterId}`);
			return {
				success: true,
				errorCode: ErrorCode.SUCCESS,
				data: cached
			};
		}

		// 2. Try to lock the character
		const lockResult = this.fileService.lock(characterId);
		if (!lockResult.success && lockResult.errorCode !== ErrorCode.EBUSY) {
			logger.error('CharacterDataService', 'getCharacter', 'Failed to acquire lock', lockResult);
		}

		try {
			// 3. Try file first
			if (this.fileService.exists(characterId)) {
				const fileResult = this.fileService.read(characterId);
				if (fileResult.success && fileResult.data) {
					logger.info('CharacterDataService', 'getCharacter', `Loaded character ${characterId} from file`);
					this.cache.set(cacheKey, fileResult.data);
					return fileResult;
				}
			}

			// 4. Fall back to database
			logger.info('CharacterDataService', 'getCharacter', `Loading character ${characterId} from database`);
			const dbResult = await this.database.getCharacterById(characterId);
			
			if (!dbResult.success) {
				return dbResult;
			}

			// 5. Save to file for next time
			const writeResult = this.fileService.write(characterId, dbResult.data!);
			if (!writeResult.success) {
				logger.warn('CharacterDataService', 'getCharacter', 'Failed to cache character to file', writeResult);
			}

			// 6. Update cache
			this.cache.set(cacheKey, dbResult.data!);

			return dbResult;
		} finally {
			// Always unlock
			this.fileService.unlock(characterId);
		}
	}

	async saveCharacter(characterId: number, data: CompleteCharacter): Promise<Result<void>> {
		// 1. Save to database
		const dbResult = await this.database.updateCharacter(characterId, data);
		if (!dbResult.success) {
			return dbResult;
		}

		// 2. Update file
		const fileResult = this.fileService.write(characterId, data);
		if (!fileResult.success) {
			logger.warn('CharacterDataService', 'saveCharacter', 'Failed to update character file', fileResult);
		}

		// 3. Update cache
		const cacheKey = `character:${characterId}`;
		this.cache.set(cacheKey, data);

		return {
			success: true,
			errorCode: ErrorCode.SUCCESS
		};
	}

	clearCache(): void {
		this.cache.clear();
	}
}