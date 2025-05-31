/**
 * Unix-style Character Store
 *
 * This module implements a character store following Unix principles:
 * - Uses the filesystem for persistence
 * - Follows standard file operations
 * - Treats characters as files
 */

import type { GameKernel } from '../../kernel/GameKernel';
import type { DatabaseCapability } from '../../capabilities/database';
import type { Entity, CharacterData } from '../../types/EntityTypes';
import { OpenMode, ErrorCode } from '../../kernel/types';
import type { ValidationIssue, ValidationResult } from './CharacterStore';

/**
 * Character store paths in the filesystem
 */
export const CHARACTER_STORE_PATHS = {
	CHARACTERS_DIR: '/usr/share/characters',
	TEMPLATES_DIR: '/usr/share/characters/templates',
	BACKUPS_DIR: '/usr/share/characters/backups',
	EXPORTS_DIR: '/usr/share/characters/exports'
};

/**
 * Unix-style character store
 * Uses the filesystem for character storage rather than external drivers
 */
export class UnixCharacterStore {
	/**
	 * Create character store
	 * @param kernel Kernel for filesystem operations
	 * @param dbCapability Optional database capability for persistence
	 * @param debug Whether to enable debug logging
	 */
	constructor(
		private kernel: GameKernel,
		private dbCapability?: DatabaseCapability,
		private debug: boolean = false
	) {
		this.initializeCharacterFilesystem();
	}

	/**
	 * Initialize the character filesystem structure
	 */
	private initializeCharacterFilesystem(): void {
		// Create required directories if they don't exist
		for (const path of Object.values(CHARACTER_STORE_PATHS)) {
			if (!this.kernel.exists(path)) {
				this.kernel.mkdir(path);
				if (this.debug) {
					console.log(`[UnixCharacterStore] Created directory: ${path}`);
				}
			}
		}
	}

	/**
	 * Validate a character entity
	 * @param entity Entity to validate
	 * @returns Validation result
	 */
	validateEntity(entity: Entity): ValidationResult {
		const issues: ValidationIssue[] = [];

		// Check required fields
		if (!entity.id) {
			issues.push({
				path: 'id',
				message: 'Entity ID is required',
				severity: 'error'
			});
		}

		if (!entity.name) {
			issues.push({
				path: 'name',
				message: 'Entity name is required',
				severity: 'error'
			});
		}

		if (!entity.type) {
			issues.push({
				path: 'type',
				message: 'Entity type is required',
				severity: 'error'
			});
		}

		if (!entity.metadata) {
			issues.push({
				path: 'metadata',
				message: 'Entity metadata is required',
				severity: 'error'
			});
		}

		// Validate character data if present
		if (entity.character) {
			this.validateCharacterData(entity.character, issues);
		}

		return {
			valid: issues.filter((i) => i.severity === 'error').length === 0,
			issues
		};
	}

	/**
	 * Validate character data
	 * @param character Character data to validate
	 * @param issues Issues array to populate
	 */
	private validateCharacterData(character: CharacterData, issues: ValidationIssue[]): void {
		// Validate abilities
		if (character.abilities) {
			const requiredAbilities = [
				'strength',
				'dexterity',
				'constitution',
				'intelligence',
				'wisdom',
				'charisma'
			];

			for (const ability of requiredAbilities) {
				if (character.abilities[ability] === undefined) {
					issues.push({
						path: `character.abilities.${ability}`,
						message: `Ability score ${ability} is required`,
						severity: 'warning'
					});
				} else if (typeof character.abilities[ability] !== 'number') {
					issues.push({
						path: `character.abilities.${ability}`,
						message: `Ability score ${ability} must be a number`,
						severity: 'error'
					});
				}
			}
		}

		// Validate classes
		if (character.classes) {
			character.classes.forEach((cls, index) => {
				if (!cls.id) {
					issues.push({
						path: `character.classes[${index}].id`,
						message: 'Class ID is required',
						severity: 'error'
					});
				}

				if (!cls.name) {
					issues.push({
						path: `character.classes[${index}].name`,
						message: 'Class name is required',
						severity: 'error'
					});
				}

				if (typeof cls.level !== 'number' || cls.level < 1) {
					issues.push({
						path: `character.classes[${index}].level`,
						message: 'Class level must be a positive number',
						severity: 'error'
					});
				}
			});
		}

		// Additional validations could be added here
	}

	/**
	 * Save a character
	 * Follows Unix principle by writing to a file
	 * @param entity Entity to save
	 */
	async saveCharacter(entity: Entity): Promise<void> {
		// Validate the entity
		const validation = this.validateEntity(entity);
		if (!validation.valid) {
			throw new Error(`Invalid character entity: ${JSON.stringify(validation.issues)}`);
		}

		// Clone the entity to avoid reference issues
		const character = JSON.parse(JSON.stringify(entity));

		// Update metadata
		character.metadata.updatedAt = Date.now();
		character.metadata.version = (character.metadata.version || 0) + 1;

		// Save to filesystem
		const charactersDir = CHARACTER_STORE_PATHS.CHARACTERS_DIR;
		const characterPath = `${charactersDir}/${entity.id}`;

		// Check if character file already exists
		let fd: number;
		if (this.kernel.exists(characterPath)) {
			// Update existing character
			fd = this.kernel.open(characterPath, OpenMode.WRITE);
		} else {
			// Create new character file
			const createResult = this.kernel.create(characterPath, character);
			if (!createResult.success) {
				throw new Error(`Failed to create character file: ${createResult.errorMessage}`);
			}
			return;
		}

		if (fd < 0) {
			throw new Error(`Failed to open character file for writing: ${characterPath}`);
		}

		try {
			// Write character data
			const writeResult = this.kernel.write(fd, character);
			if (writeResult !== 0) {
				throw new Error(`Failed to write character data: ${writeResult}`);
			}
		} finally {
			this.kernel.close(fd);
		}

		// If database capability is available, also save to database
		if (this.dbCapability) {
			try {
				const dbPath = `/db/game_character/${entity.id}`;
				const dbFd = this.kernel.open(dbPath, OpenMode.WRITE);
				if (dbFd >= 0) {
					try {
						// Convert entity to database format
						const dbEntity = this.convertEntityToDbFormat(entity);
						this.kernel.write(dbFd, dbEntity);
					} finally {
						this.kernel.close(dbFd);
					}
				}
			} catch (error) {
				console.warn('Failed to save character to database:', error);
				// Continue even if database save fails
			}
		}

		// Create backup
		this.createBackup(entity);
	}

	/**
	 * Load a character
	 * Follows Unix principle by reading from a file
	 * @param id Character ID
	 * @returns Loaded character or null if not found
	 */
	async loadCharacter(id: string): Promise<Entity | null> {
		const characterPath = `${CHARACTER_STORE_PATHS.CHARACTERS_DIR}/${id}`;

		if (!this.kernel.exists(characterPath)) {
			// Try loading from database if capability is available
			if (this.dbCapability) {
				try {
					const dbPath = `/db/game_character/${id}`;
					const dbFd = this.kernel.open(dbPath, OpenMode.READ);
					if (dbFd >= 0) {
						try {
							const buffer: any = {};
							const [result] = this.kernel.read(dbFd, buffer);

							if (result === 0) {
								// Convert database format to entity
								const entity = this.convertDbFormatToEntity(buffer);

								// Save to filesystem for future access
								await this.saveCharacter(entity);

								return entity;
							}
						} finally {
							this.kernel.close(dbFd);
						}
					}
				} catch (error) {
					console.warn('Failed to load character from database:', error);
				}
			}

			return null;
		}

		const fd = this.kernel.open(characterPath, OpenMode.READ);
		if (fd < 0) {
			return null;
		}

		try {
			const buffer: any = {};
			const [result] = this.kernel.read(fd, buffer);

			if (result !== 0) {
				return null;
			}

			// Perform schema migration if needed based on version
			return buffer as Entity;
		} finally {
			this.kernel.close(fd);
		}
	}

	/**
	 * Delete a character
	 * Follows Unix principle by removing a file
	 * @param id Character ID
	 * @returns Whether deletion was successful
	 */
	async deleteCharacter(id: string): Promise<boolean> {
		const characterPath = `${CHARACTER_STORE_PATHS.CHARACTERS_DIR}/${id}`;

		if (!this.kernel.exists(characterPath)) {
			return false;
		}

		// Create backup before deletion
		const character = await this.loadCharacter(id);
		if (character) {
			this.createBackup(character);
		}

		// Remove from filesystem
		const result = this.kernel.unlink(characterPath);
		if (result !== 0) {
			return false;
		}

		// If database capability is available, also delete from database
		if (this.dbCapability) {
			try {
				const dbPath = `/db/game_character/${id}`;
				// First check if character exists in database
				const dbFd = this.kernel.open(dbPath, OpenMode.READ);
				if (dbFd >= 0) {
					// Character exists, close and delete
					this.kernel.close(dbFd);

					// Use a special delete operation via ioctl
					const dbCapDevice = '/dev/database';
					const dbCapFd = this.kernel.open(dbCapDevice, OpenMode.READ_WRITE);
					if (dbCapFd >= 0) {
						try {
							const deleteParams = {
								operation: 'delete',
								path: dbPath
							};
							this.kernel.ioctl(dbCapFd, 0, deleteParams);
						} finally {
							this.kernel.close(dbCapFd);
						}
					}
				}
			} catch (error) {
				console.warn('Failed to delete character from database:', error);
			}
		}

		return true;
	}

	/**
	 * List all characters
	 * Follows Unix principle by listing a directory
	 * @returns Array of character IDs
	 */
	async listCharacters(): Promise<string[]> {
		const charactersDir = CHARACTER_STORE_PATHS.CHARACTERS_DIR;

		if (!this.kernel.exists(charactersDir)) {
			return [];
		}

		const files = this.kernel.readdir(charactersDir);

		// Filter out directories and special files
		return files.filter((file) => {
			const path = `${charactersDir}/${file}`;
			const stat = this.kernel.stat(path);
			return stat && stat.type === 'file' && !file.startsWith('.');
		});
	}

	/**
	 * Create a new character with default values
	 * Follows Unix principle by creating a template-based file
	 * @param name Character name
	 * @returns New character entity
	 */
	createNewCharacter(name: string): Entity {
		const id = `character_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

		// Check if template exists
		const templatePath = `${CHARACTER_STORE_PATHS.TEMPLATES_DIR}/default`;
		if (this.kernel.exists(templatePath)) {
			// Use template as base
			const fd = this.kernel.open(templatePath, OpenMode.READ);
			if (fd >= 0) {
				try {
					const buffer: any = {};
					const [result] = this.kernel.read(fd, buffer);

					if (result === 0) {
						// Clone template and customize
						const entity = JSON.parse(JSON.stringify(buffer));
						entity.id = id;
						entity.name = name;
						entity.metadata.createdAt = Date.now();
						entity.metadata.updatedAt = Date.now();
						entity.metadata.version = 1;

						return entity;
					}
				} finally {
					this.kernel.close(fd);
				}
			}
		}

		// Fall back to default character creation
		return {
			id,
			type: 'character',
			name,
			properties: {},
			character: {
				abilities: {
					strength: 10,
					dexterity: 10,
					constitution: 10,
					intelligence: 10,
					wisdom: 10,
					charisma: 10
				},
				hitPoints: {
					max: 0,
					current: 0,
					temporary: 0,
					nonLethal: 0
				},
				baseAttackBonus: 0,
				savingThrows: {
					fortitude: 0,
					reflex: 0,
					will: 0
				},
				skills: {},
				feats: [],
				traits: [],
				classFeatures: [],
				classes: []
			},
			metadata: {
				createdAt: Date.now(),
				updatedAt: Date.now(),
				version: 1
			}
		};
	}

	/**
	 * Create a backup of a character
	 * Follows Unix principle by creating a timestamped copy
	 * @param entity Entity to backup
	 */
	private createBackup(entity: Entity): void {
		const backupsDir = CHARACTER_STORE_PATHS.BACKUPS_DIR;
		const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
		const backupPath = `${backupsDir}/${entity.id}_${timestamp}`;

		// Create backup file
		const createResult = this.kernel.create(backupPath, entity);
		if (!createResult.success && this.debug) {
			console.warn(`Failed to create character backup: ${createResult.errorMessage}`);
		}
	}

	/**
	 * Export a character to a file
	 * Follows Unix principle by creating an export file
	 * @param entity Entity to export
	 * @returns Path to the exported file
	 */
	exportCharacter(entity: Entity): string {
		const exportsDir = CHARACTER_STORE_PATHS.EXPORTS_DIR;
		const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
		const exportPath = `${exportsDir}/${entity.name.replace(/\s+/g, '_')}_${timestamp}.json`;

		// Create export file with pretty-printed JSON
		const exportData = JSON.stringify(entity, null, 2);
		const createResult = this.kernel.create(exportPath, exportData);

		if (!createResult.success) {
			throw new Error(`Failed to export character: ${createResult.errorMessage}`);
		}

		return exportPath;
	}

	/**
	 * Import a character from a file
	 * Follows Unix principle by reading from a file
	 * @param importPath Path to the import file
	 * @returns Imported character entity
	 */
	importCharacter(importPath: string): Entity {
		if (!this.kernel.exists(importPath)) {
			throw new Error(`Import file not found: ${importPath}`);
		}

		const fd = this.kernel.open(importPath, OpenMode.READ);
		if (fd < 0) {
			throw new Error(`Failed to open import file: ${importPath}`);
		}

		try {
			// When reading a JSON file, we get the string content
			const buffer: any = {};
			const [result] = this.kernel.read(fd, buffer);

			if (result !== 0) {
				throw new Error(`Failed to read import file: ${importPath}`);
			}

			let entity: Entity;

			try {
				// Parse JSON string
				entity = JSON.parse(buffer.toString());
			} catch (error) {
				throw new Error(`Invalid JSON format in import file: ${error.message}`);
			}

			// Validate the entity
			const validation = this.validateEntity(entity);
			if (!validation.valid) {
				throw new Error(`Invalid character data: ${JSON.stringify(validation.issues)}`);
			}

			// Update the import timestamp
			entity.metadata.importedAt = Date.now();

			return entity;
		} finally {
			this.kernel.close(fd);
		}
	}

	/**
	 * Convert an entity to database format
	 * @param entity Entity to convert
	 * @returns Database format object
	 */
	private convertEntityToDbFormat(entity: Entity): any {
		// Sample conversion logic - in a real implementation, this would map
		// entity properties to the database schema
		return {
			id: entity.id,
			type: entity.type,
			name: entity.name,
			properties: entity.properties || {},
			metadata: entity.metadata || {}
			// Add other database fields as needed
		};
	}

	/**
	 * Convert database format to entity
	 * @param dbObject Database object
	 * @returns Entity
	 */
	private convertDbFormatToEntity(dbObject: any): Entity {
		// Sample conversion logic - in a real implementation, this would map
		// database fields to entity properties
		return {
			id: dbObject.id,
			type: dbObject.type || 'character',
			name: dbObject.name,
			properties: dbObject.properties || {},
			character: dbObject.character_data || {},
			metadata: dbObject.metadata || {
				createdAt: Date.now(),
				updatedAt: Date.now(),
				version: 1
			}
		};
	}
}

/**
 * Factory function to create a UnixCharacterStore
 * @param kernel Kernel for filesystem operations
 * @param dbCapability Optional database capability for persistence
 * @param debug Whether to enable debug logging
 * @returns UnixCharacterStore instance
 */
export function createUnixCharacterStore(
	kernel: GameKernel,
	dbCapability?: DatabaseCapability,
	debug: boolean = false
): UnixCharacterStore {
	return new UnixCharacterStore(kernel, dbCapability, debug);
}
