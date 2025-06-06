/**
 * CharacterFileService - Handles ONLY character file operations
 * Follows Unix philosophy: does one thing well (character file I/O)
 */

import type { Kernel } from '../kernel/Kernel';
import type { CompleteCharacter } from '../types/supabase';
import { ErrorCode } from '../kernel/types';
import { VFSPATHS, getCharacterPath, getCharacterLockPath } from '../constants/paths';
import { logger } from '../utils/Logger';
// Define Result type locally to avoid import issues
export interface Result<T> {
	success: boolean;
	errorCode: ErrorCode;
	errorMessage?: string;
	data?: T;
}

export interface CharacterFileOperations {
	exists(characterId: number): boolean;
	read(characterId: number): Result<CompleteCharacter>;
	write(characterId: number, data: CompleteCharacter): Result<void>;
	delete(characterId: number): Result<void>;
	lock(characterId: number): Result<void>;
	unlock(characterId: number): Result<void>;
}

export class CharacterFileService implements CharacterFileOperations {
	constructor(private kernel: Kernel) {}

	exists(characterId: number): boolean {
		const path = getCharacterPath(characterId);
		return this.kernel.exists(path);
	}

	read(characterId: number): Result<CompleteCharacter> {
		const path = getCharacterPath(characterId);
		
		if (!this.kernel.exists(path)) {
			return {
				success: false,
				errorCode: ErrorCode.ENOENT,
				errorMessage: `Character file not found: ${path}`
			};
		}

		const fd = this.kernel.open(path, 0x01); // READ
		if (fd < 0) {
			return {
				success: false,
				errorCode: -fd,
				errorMessage: `Failed to open character file: ${path}`
			};
		}

		try {
			const [readResult, data] = this.kernel.read(fd);
			if (readResult !== ErrorCode.SUCCESS) {
				return {
					success: false,
					errorCode: readResult,
					errorMessage: `Failed to read character file: ${path}`
				};
			}

			return {
				success: true,
				errorCode: ErrorCode.SUCCESS,
				data: data as CompleteCharacter
			};
		} finally {
			this.kernel.close(fd);
		}
	}

	write(characterId: number, data: CompleteCharacter): Result<void> {
		const path = getCharacterPath(characterId);
		
		// Ensure parent directory exists
		const parentDir = VFSPATHS.PROCESS.CHARACTER;
		if (!this.kernel.exists(parentDir)) {
			const mkdirResult = this.kernel.mkdir(parentDir);
			if (mkdirResult !== ErrorCode.SUCCESS) {
				return {
					success: false,
					errorCode: mkdirResult,
					errorMessage: `Failed to create character directory: ${parentDir}`
				};
			}
		}

		// Create or update the file
		const result = this.kernel.create(path, data);
		
		return {
			success: result.success,
			errorCode: result.success ? ErrorCode.SUCCESS : ErrorCode.EIO,
			errorMessage: result.errorMessage
		};
	}

	delete(characterId: number): Result<void> {
		const path = getCharacterPath(characterId);
		
		if (!this.kernel.exists(path)) {
			return {
				success: true, // Already doesn't exist
				errorCode: ErrorCode.SUCCESS
			};
		}

		const unlinkResult = this.kernel.unlink(path);
		return {
			success: unlinkResult === ErrorCode.SUCCESS,
			errorCode: unlinkResult,
			errorMessage: unlinkResult !== ErrorCode.SUCCESS ? `Failed to delete character file` : undefined
		};
	}

	lock(characterId: number): Result<void> {
		const lockPath = getCharacterLockPath(characterId);
		
		// Check if already locked
		if (this.kernel.exists(lockPath)) {
			return {
				success: false,
				errorCode: ErrorCode.EBUSY,
				errorMessage: `Character ${characterId} is locked`
			};
		}

		// Create lock file
		const result = this.kernel.create(lockPath, {
			pid: process.pid,
			timestamp: Date.now(),
			characterId
		});

		return {
			success: result.success,
			errorCode: result.success ? ErrorCode.SUCCESS : ErrorCode.EIO,
			errorMessage: result.errorMessage
		};
	}

	unlock(characterId: number): Result<void> {
		const lockPath = getCharacterLockPath(characterId);
		
		if (!this.kernel.exists(lockPath)) {
			return {
				success: true, // Not locked
				errorCode: ErrorCode.SUCCESS
			};
		}

		const unlinkResult = this.kernel.unlink(lockPath);
		return {
			success: unlinkResult === ErrorCode.SUCCESS,
			errorCode: unlinkResult,
			errorMessage: unlinkResult !== ErrorCode.SUCCESS ? `Failed to remove lock file` : undefined
		};
	}
}