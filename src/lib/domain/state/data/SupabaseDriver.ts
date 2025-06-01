import type { StorageDriver } from './CharacterStore';
import type { Entity } from '../../types/EntityTypes';
import type { GameRulesAPI } from '$lib/db/gameRules.api';
import type { CompleteCharacter } from '$lib/db/gameRules.api';
import { OpenMode } from '../../kernel/types';

/**
 * Unix-style implementation of the StorageDriver interface
 * Provides persistence for characters in the database using Unix file operations
 */
export class SupabaseStorageDriver implements StorageDriver {
	private gameRulesAPI: GameRulesAPI;
	private kernel: any;

	/**
	 * Creates a new SupabaseStorageDriver
	 * @param gameRulesAPI The GameRulesAPI instance for database access
	 */
	constructor(gameRulesAPI: GameRulesAPI) {
		this.gameRulesAPI = gameRulesAPI;
		this.kernel = gameRulesAPI.getKernel();
	}

	/**
	 * Saves a character entity to the database using Unix file operations
	 * @param id The UUID of the entity
	 * @param data The entity data to save
	 */
	async save(id: string, data: Entity): Promise<void> {
		console.log(`[SupabaseStorageDriver] Saving entity: ${id}`);

		// First, check if the character already exists in the database
		const numericId = this.extractNumericId(id);

		if (numericId) {
			try {
				// Get character path
				const entityPath = this.gameRulesAPI.getFileSystemPath('entity', id);

				// Check if the entity exists
				if (this.kernel.exists(entityPath)) {
					// Update existing character
					await this.updateExistingCharacter(numericId, data);
				} else {
					// Try to find the character by ID
					const characterPath = this.gameRulesAPI.getFileSystemPath('character', numericId);

					if (this.kernel.exists(characterPath)) {
						// Update existing character
						await this.updateExistingCharacter(numericId, data);
					} else {
						// Create new character
						await this.createNewCharacter(data);
					}
				}
			} catch (error) {
				console.warn(`Character lookup failed, will attempt to create new: ${error}`);
				// Create new character
				await this.createNewCharacter(data);
			}
		} else {
			// No numeric ID, create new character
			await this.createNewCharacter(data);
		}
	}

	/**
	 * Updates an existing character in the database using Unix file operations
	 * @param numericId The numeric ID of the character in the database
	 * @param data The updated entity data
	 */
	private async updateExistingCharacter(numericId: number, data: Entity): Promise<void> {
		if (!data.character) {
			throw new Error('Cannot update character: character data is missing');
		}

		console.log(`[SupabaseStorageDriver] Updating existing character: ${numericId}`);

		// Use the Unix file operation method in GameRulesAPI to update the character
		const characterPath = this.gameRulesAPI.getFileSystemPath('character', numericId);

		// Get current character data
		const characterData = await this.gameRulesAPI.getCharacterByFileOperation(numericId);
		if (!characterData) {
			throw new Error(`Cannot update character ${numericId}: not found`);
		}

		// Prepare the update data
		const updateData = {
			name: data.name,
			description: data.description || '',
			experience: data.character.experience || 0,
			updated_at: new Date().toISOString()
		};

		// Update the character using file operations
		const success = await this.gameRulesAPI.updateCharacterByFileOperation(numericId, updateData);
		if (!success) {
			throw new Error(`Failed to update character ${numericId}`);
		}

		// Now update the entity file
		const entityPath = this.gameRulesAPI.getFileSystemPath('entity', data.id);

		// Check if entity file exists
		if (!this.kernel.exists(entityPath)) {
			// Create a new entity file
			this.kernel.create(entityPath, {
				...data,
				metadata: {
					...data.metadata,
					databaseId: numericId,
					updatedAt: Date.now()
				}
			});
		} else {
			// Open the entity file
			const fd = this.kernel.open(entityPath, OpenMode.WRITE);
			if (fd < 0) {
				throw new Error(`Failed to open entity file for writing: ${entityPath}`);
			}

			try {
				// Write the updated entity data
				const result = this.kernel.write(fd, {
					...data,
					metadata: {
						...data.metadata,
						databaseId: numericId,
						updatedAt: Date.now()
					}
				});

				if (result !== 0) {
					throw new Error(`Failed to write entity file: ${result}`);
				}
			} finally {
				// Always close the file descriptor
				this.kernel.close(fd);
			}
		}
	}

	/**
	 * Creates a new character in the database using Unix file operations
	 * @param data The character entity data
	 */
	private async createNewCharacter(data: Entity): Promise<void> {
		if (!data.character) {
			throw new Error('Cannot create character: character data is missing');
		}

		console.log(`[SupabaseStorageDriver] Creating new character: ${data.name}`);

		// Use the character creation path
		const creationPath = '/v_proc/character/create';

		// Open the creation path
		const fd = this.kernel.open(creationPath, OpenMode.WRITE);
		if (fd < 0) {
			throw new Error(`Failed to open character creation path: ${creationPath}`);
		}

		try {
			// Prepare the character data
			const characterData = {
				name: data.name,
				description: data.description || '',
				experience: data.character.experience || 0,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				// Include ability scores
				ability_scores: data.character.abilities || {
					strength: 10,
					dexterity: 10,
					constitution: 10,
					intelligence: 10,
					wisdom: 10,
					charisma: 10
				},
				// Include classes
				classes: data.character.classes || [],
				// Include feats
				feats: data.character.feats || [],
				// Include skills
				skills: data.character.skills || {}
			};

			// Write the new character data
			const result = this.kernel.write(fd, characterData);

			if (result !== 0) {
				throw new Error(`Failed to create character: ${result}`);
			}

			// Read back the created character to get its ID
			const buffer: any = {};
			const [readResult] = this.kernel.read(fd, buffer);

			if (readResult !== 0 || !buffer.id) {
				throw new Error(`Failed to read back created character: ${readResult}`);
			}

			const newCharId = buffer.id;

			// Set the numeric ID in the entity for future reference
			data.metadata = data.metadata || {};
			data.metadata.databaseId = newCharId;

			// Create entity file
			const entityPath = this.gameRulesAPI.getFileSystemPath('entity', data.id);

			// Check if entity directory exists
			const entityDir = '/v_entity';
			if (!this.kernel.exists(entityDir)) {
				const mkdirResult = this.kernel.mkdir(entityDir, true);
				if (!mkdirResult.success) {
					throw new Error(`Failed to create entity directory: ${mkdirResult.errorMessage}`);
				}
			}

			// Create the entity file
			const createResult = this.kernel.create(entityPath, {
				...data,
				metadata: {
					...data.metadata,
					databaseId: newCharId,
					createdAt: Date.now(),
					updatedAt: Date.now()
				}
			});

			if (!createResult.success) {
				throw new Error(`Failed to create entity file: ${createResult.errorMessage}`);
			}

			console.log(
				`[SupabaseStorageDriver] Successfully created new character with ID: ${newCharId}`
			);
		} finally {
			// Always close the file descriptor
			this.kernel.close(fd);
		}
	}

	/**
	 * Updates character abilities in the database using Unix file operations
	 * @param characterId The character ID
	 * @param abilities The ability scores
	 */
	private async updateCharacterAbilities(
		characterId: number,
		abilities: Record<string, number>
	): Promise<void> {
		// Import the utility directly since this is within a class
		const { getAbilityIdFromName } = await import('../../utils/DatabaseMappings');

		// Fetch all abilities to get their IDs using kernel file operations
		const abilityData = await this.gameRulesAPI.getAllAbility();
		const abilityMap = new Map(abilityData.map((a) => [a.name.toLowerCase(), a.id]));

		// For each ability, update or create the record
		for (const [abilityName, value] of Object.entries(abilities)) {
			const abilityId = abilityMap.get(abilityName.toLowerCase());
			if (!abilityId) {
				console.warn(`Unknown ability: ${abilityName}`);
				continue;
			}

			// The Unix path for character ability
			const abilityPath = `/v_proc/character/${characterId}/ability/${abilityId}`;

			// Check if the path exists - ability record already exists
			if (this.kernel.exists(abilityPath)) {
				// Update existing ability - use file operations
				const fd = this.kernel.open(abilityPath, OpenMode.WRITE);
				if (fd < 0) {
					console.error(`Failed to open ability file: ${abilityPath}`);
					continue;
				}

				try {
					// Write updated ability value
					const result = this.kernel.write(fd, { value });
					if (result !== 0) {
						console.error(`Failed to update ability: ${result}`);
					}
				} finally {
					// Always close file descriptor
					this.kernel.close(fd);
				}
			} else {
				// Create a new ability record
				const createPath = `/v_proc/character/${characterId}/ability/create`;
				const fd = this.kernel.open(createPath, OpenMode.WRITE);
				if (fd < 0) {
					console.error(`Failed to open ability creation path: ${createPath}`);
					continue;
				}

				try {
					// Create new ability record with value
					const result = this.kernel.write(fd, {
						game_character_id: characterId,
						ability_id: abilityId,
						value
					});

					if (result !== 0) {
						console.error(`Failed to create ability: ${result}`);
					}
				} finally {
					// Always close file descriptor
					this.kernel.close(fd);
				}
			}
		}
	}

	/**
	 * Updates character classes in the database using Unix file operations
	 * @param characterId The character ID
	 * @param classes The character's classes
	 */
	private async updateCharacterClasses(
		characterId: number,
		classes: Array<{ id: string; name: string; level: number }>
	): Promise<void> {
		// First get all available classes using file operations
		const classesPath = '/v_schema/class/list';
		const classesFd = this.kernel.open(classesPath, OpenMode.READ);
		if (classesFd < 0) {
			console.error(`Failed to open classes list: ${classesPath}`);
			throw new Error('Failed to fetch class data');
		}

		let classData: any[] = [];
		try {
			const buffer: any = {};
			const [result] = this.kernel.read(classesFd, buffer);
			if (result !== 0) {
				console.error(`Failed to read classes list: ${result}`);
				throw new Error('Failed to fetch class data');
			}
			classData = buffer.entities || [];
		} finally {
			this.kernel.close(classesFd);
		}

		const classMap = new Map(classData.map((c) => [c.name.toLowerCase(), c.id]));

		// Get existing character classes using the character classes path
		const characterClassesPath = `/v_proc/character/${characterId}/class/list`;
		const existingClassesFd = this.kernel.open(characterClassesPath, OpenMode.READ);

		let existingClasses: any[] = [];
		if (existingClassesFd >= 0) {
			try {
				const buffer: any = {};
				const [result] = this.kernel.read(existingClassesFd, buffer);
				if (result === 0) {
					existingClasses = buffer.classes || [];
				}
			} finally {
				this.kernel.close(existingClassesFd);
			}
		}

		const existingClassMap = new Map(existingClasses.map((c) => [c.class_id, c]));

		// Process each class
		for (const cls of classes) {
			const classId = classMap.get(cls.name.toLowerCase());

			if (!classId) {
				console.warn(`Unknown class: ${cls.name}`);
				continue;
			}

			const existingClass = existingClassMap.get(classId);
			const classPath = `/v_proc/character/${characterId}/class/${classId}`;

			if (existingClass) {
				// Update existing class if level has changed
				if (existingClass.level !== cls.level) {
					const fd = this.kernel.open(classPath, OpenMode.WRITE);
					if (fd < 0) {
						console.error(`Failed to open class file: ${classPath}`);
						continue;
					}

					try {
						// Write updated class level
						const result = this.kernel.write(fd, { level: cls.level });
						if (result !== 0) {
							console.error(`Failed to update class: ${result}`);
						}
					} finally {
						this.kernel.close(fd);
					}
				}
			} else {
				// Create a new class record
				const createPath = `/v_proc/character/${characterId}/class/create`;
				const fd = this.kernel.open(createPath, OpenMode.WRITE);
				if (fd < 0) {
					console.error(`Failed to open class creation path: ${createPath}`);
					continue;
				}

				try {
					// Create new class record with level
					const result = this.kernel.write(fd, {
						game_character_id: characterId,
						class_id: classId,
						level: cls.level
					});

					if (result !== 0) {
						console.error(`Failed to create class: ${result}`);
					}
				} finally {
					this.kernel.close(fd);
				}
			}
		}

		// Remove classes that are no longer present
		const currentClassIds = classes
			.map((c) => classMap.get(c.name.toLowerCase()))
			.filter(Boolean) as number[];

		const classesToRemove = Array.from(existingClassMap.values()).filter(
			(c) => !currentClassIds.includes(c.class_id)
		);

		// Delete each class that's no longer present
		for (const classToRemove of classesToRemove) {
			const deletePath = `/v_proc/character/${characterId}/class/${classToRemove.class_id}`;
			const fd = this.kernel.open(deletePath, OpenMode.WRITE);
			if (fd >= 0) {
				try {
					// Use a special write operation to indicate deletion
					const result = this.kernel.write(fd, { _delete: true });
					if (result !== 0) {
						console.error(`Failed to delete class: ${result}`);
					}
				} finally {
					this.kernel.close(fd);
				}
			}
		}
	}

	/**
	 * Updates character feats in the database using Unix file operations
	 * @param characterId The character ID
	 * @param feats The character's feats
	 */
	private async updateCharacterFeats(
		characterId: number,
		feats: Array<{ id: string; name: string }>
	): Promise<void> {
		// First get all available feats using file operations
		const featsPath = '/v_schema/feat/list';
		const featsFd = this.kernel.open(featsPath, OpenMode.READ);
		if (featsFd < 0) {
			console.error(`Failed to open feats list: ${featsPath}`);
			throw new Error('Failed to fetch feat data');
		}

		let featData: any[] = [];
		try {
			const buffer: any = {};
			const [result] = this.kernel.read(featsFd, buffer);
			if (result !== 0) {
				console.error(`Failed to read feats list: ${result}`);
				throw new Error('Failed to fetch feat data');
			}
			featData = buffer.entities || [];
		} finally {
			this.kernel.close(featsFd);
		}

		const featMap = new Map(featData.map((f) => [f.name.toLowerCase(), f.id]));

		// Get existing character feats using the character feats path
		const characterFeatsPath = `/v_proc/character/${characterId}/feat/list`;
		const existingFeatsFd = this.kernel.open(characterFeatsPath, OpenMode.READ);

		let existingFeats: any[] = [];
		if (existingFeatsFd >= 0) {
			try {
				const buffer: any = {};
				const [result] = this.kernel.read(existingFeatsFd, buffer);
				if (result === 0) {
					existingFeats = buffer.feats || [];
				}
			} finally {
				this.kernel.close(existingFeatsFd);
			}
		}

		const existingFeatMap = new Map(existingFeats.map((f) => [f.feat_id, f]));

		// Process each feat
		for (const feat of feats) {
			const featId = featMap.get(feat.name.toLowerCase());

			if (!featId) {
				console.warn(`Unknown feat: ${feat.name}`);
				continue;
			}

			// Only add the feat if it doesn't already exist
			if (!existingFeatMap.has(featId)) {
				// Create a new feat record
				const createPath = `/v_proc/character/${characterId}/feat/create`;
				const fd = this.kernel.open(createPath, OpenMode.WRITE);
				if (fd < 0) {
					console.error(`Failed to open feat creation path: ${createPath}`);
					continue;
				}

				try {
					// Create new feat record
					const result = this.kernel.write(fd, {
						game_character_id: characterId,
						feat_id: featId
					});

					if (result !== 0) {
						console.error(`Failed to create feat: ${result}`);
					}
				} finally {
					this.kernel.close(fd);
				}
			}
		}

		// Remove feats that are no longer present
		const currentFeatIds = feats
			.map((f) => featMap.get(f.name.toLowerCase()))
			.filter(Boolean) as number[];

		const featsToRemove = Array.from(existingFeatMap.values()).filter(
			(f) => !currentFeatIds.includes(f.feat_id)
		);

		// Delete each feat that's no longer present
		for (const featToRemove of featsToRemove) {
			const deletePath = `/v_proc/character/${characterId}/feat/${featToRemove.feat_id}`;
			const fd = this.kernel.open(deletePath, OpenMode.WRITE);
			if (fd >= 0) {
				try {
					// Use a special write operation to indicate deletion
					const result = this.kernel.write(fd, { _delete: true });
					if (result !== 0) {
						console.error(`Failed to delete feat: ${result}`);
					}
				} finally {
					this.kernel.close(fd);
				}
			}
		}
	}

	/**
	 * Updates character skills in the database using Unix file operations
	 * @param characterId The character ID
	 * @param skills The character's skills with ranks
	 */
	private async updateCharacterSkills(
		characterId: number,
		skills: Record<string, { ranks: number; classSkill: boolean }>
	): Promise<void> {
		// First get all available skills using file operations
		const skillsPath = '/v_schema/skill/list';
		const skillsFd = this.kernel.open(skillsPath, OpenMode.READ);
		if (skillsFd < 0) {
			console.error(`Failed to open skills list: ${skillsPath}`);
			throw new Error('Failed to fetch skill data');
		}

		let skillData: any[] = [];
		try {
			const buffer: any = {};
			const [result] = this.kernel.read(skillsFd, buffer);
			if (result !== 0) {
				console.error(`Failed to read skills list: ${result}`);
				throw new Error('Failed to fetch skill data');
			}
			skillData = buffer.entities || [];
		} finally {
			this.kernel.close(skillsFd);
		}

		const skillMap = new Map(skillData.map((s) => [s.name.toLowerCase(), s.id]));

		// Get existing character skill ranks using the character skills path
		const characterSkillsPath = `/v_proc/character/${characterId}/skill/list`;
		const existingSkillsFd = this.kernel.open(characterSkillsPath, OpenMode.READ);

		let existingSkills: any[] = [];
		if (existingSkillsFd >= 0) {
			try {
				const buffer: any = {};
				const [result] = this.kernel.read(existingSkillsFd, buffer);
				if (result === 0) {
					existingSkills = buffer.skills || [];
				}
			} finally {
				this.kernel.close(existingSkillsFd);
			}
		}

		// Group existing skills by skill ID
		const existingSkillRanks = new Map<number, { count: number; records: any[] }>();
		for (const skill of existingSkills) {
			const skillId = skill.skill_id;
			const existing = existingSkillRanks.get(skillId) || { count: 0, records: [] };
			existing.count += 1;
			existing.records.push(skill);
			existingSkillRanks.set(skillId, existing);
		}

		// Process each skill
		for (const [skillName, skillInfo] of Object.entries(skills)) {
			const skillId = skillMap.get(skillName.toLowerCase());

			if (!skillId) {
				console.warn(`Unknown skill: ${skillName}`);
				continue;
			}

			const existing = existingSkillRanks.get(skillId) || { count: 0, records: [] };
			const existingRanks = existing.count;
			const desiredRanks = skillInfo.ranks;

			if (desiredRanks > existingRanks) {
				// Add additional ranks
				const ranksToAdd = desiredRanks - existingRanks;
				for (let i = 0; i < ranksToAdd; i++) {
					// Create a new skill rank record
					const createPath = `/v_proc/character/${characterId}/skill/create`;
					const fd = this.kernel.open(createPath, OpenMode.WRITE);
					if (fd < 0) {
						console.error(`Failed to open skill creation path: ${createPath}`);
						continue;
					}

					try {
						// Create new skill rank record
						const result = this.kernel.write(fd, {
							game_character_id: characterId,
							skill_id: skillId,
							applied_at_level: i + existingRanks + 1
						});

						if (result !== 0) {
							console.error(`Failed to create skill rank: ${result}`);
						}
					} finally {
						this.kernel.close(fd);
					}
				}
			} else if (desiredRanks < existingRanks) {
				// Remove excess ranks
				// Sort records by applied_at_level in descending order
				const records = existing.records.sort(
					(a, b) => (b.applied_at_level || 0) - (a.applied_at_level || 0)
				);

				// Take the records to remove
				const ranksToRemove = records.slice(0, existingRanks - desiredRanks);

				for (const rank of ranksToRemove) {
					// Delete the skill rank record
					const deletePath = `/v_proc/character/${characterId}/skill/rank/${rank.id}`;
					const fd = this.kernel.open(deletePath, OpenMode.WRITE);
					if (fd < 0) {
						console.error(`Failed to open skill rank deletion path: ${deletePath}`);
						continue;
					}

					try {
						// Use a special write operation to indicate deletion
						const result = this.kernel.write(fd, { _delete: true });
						if (result !== 0) {
							console.error(`Failed to delete skill rank: ${result}`);
						}
					} finally {
						this.kernel.close(fd);
					}
				}
			}
		}
	}

	/**
	 * Updates active features in the database using Unix file operations
	 * @param characterId The character ID
	 * @param entity The full entity with active features
	 */
	private async updateActiveFeatures(characterId: number, entity: Entity): Promise<void> {
		if (!entity.activeFeatures) return;

		// Use entity file path to get entity database ID
		const entityMetadataPath = `/v_proc/character/${characterId}/entity`;
		const entityMetadataFd = this.kernel.open(entityMetadataPath, OpenMode.READ);

		if (entityMetadataFd < 0) {
			console.error(`Failed to open entity metadata: ${entityMetadataPath}`);
			throw new Error(`Entity record not found for character ID ${characterId}`);
		}

		let entityId: number;
		try {
			const buffer: any = {};
			const [result] = this.kernel.read(entityMetadataFd, buffer);
			if (result !== 0 || !buffer.id) {
				console.error(`Failed to read entity metadata: ${result}`);
				throw new Error(`Entity record not found for character ID ${characterId}`);
			}
			entityId = buffer.id;
		} finally {
			this.kernel.close(entityMetadataFd);
		}

		// Get existing active features using the feature path
		const featuresPath = `/v_proc/character/${characterId}/feature/list`;
		const existingFeaturesFd = this.kernel.open(featuresPath, OpenMode.READ);

		let existingFeatures: any[] = [];
		if (existingFeaturesFd >= 0) {
			try {
				const buffer: any = {};
				const [result] = this.kernel.read(existingFeaturesFd, buffer);
				if (result === 0) {
					existingFeatures = buffer.features || [];
				}
			} finally {
				this.kernel.close(existingFeaturesFd);
			}
		}

		const existingFeatureMap = new Map(existingFeatures.map((f) => [f.feature_path, f]));

		// Process each active feature
		for (const feature of entity.activeFeatures) {
			const featurePath = feature.path;
			const existingFeature = existingFeatureMap.get(featurePath);

			if (existingFeature) {
				// The file path for this specific feature
				const featureFilePath = `/v_proc/character/${characterId}/feature/${existingFeature.id}`;

				if (existingFeature.deactivated_at && feature.active) {
					// Reactivate the feature
					const fd = this.kernel.open(featureFilePath, OpenMode.WRITE);
					if (fd < 0) {
						console.error(`Failed to open feature for reactivation: ${featureFilePath}`);
						continue;
					}

					try {
						// Update the feature to reactivate it
						const result = this.kernel.write(fd, {
							activated_at: new Date().toISOString(),
							deactivated_at: null,
							state: feature.state || {},
							options: feature.options || {}
						});

						if (result !== 0) {
							console.error(`Failed to reactivate feature: ${result}`);
						}
					} finally {
						this.kernel.close(fd);
					}
				} else if (!existingFeature.deactivated_at && !feature.active) {
					// Deactivate the feature
					const fd = this.kernel.open(featureFilePath, OpenMode.WRITE);
					if (fd < 0) {
						console.error(`Failed to open feature for deactivation: ${featureFilePath}`);
						continue;
					}

					try {
						// Update to deactivate the feature
						const result = this.kernel.write(fd, {
							deactivated_at: new Date().toISOString()
						});

						if (result !== 0) {
							console.error(`Failed to deactivate feature: ${result}`);
						}
					} finally {
						this.kernel.close(fd);
					}
				} else if (feature.active) {
					// Update state and options if active
					const fd = this.kernel.open(featureFilePath, OpenMode.WRITE);
					if (fd < 0) {
						console.error(`Failed to open feature for update: ${featureFilePath}`);
						continue;
					}

					try {
						// Update the feature state and options
						const result = this.kernel.write(fd, {
							state: feature.state || {},
							options: feature.options || {}
						});

						if (result !== 0) {
							console.error(`Failed to update feature: ${result}`);
						}
					} finally {
						this.kernel.close(fd);
					}
				}
			} else if (feature.active) {
				// Create new active feature
				const createPath = `/v_proc/character/${characterId}/feature/create`;
				const fd = this.kernel.open(createPath, OpenMode.WRITE);
				if (fd < 0) {
					console.error(`Failed to open feature creation path: ${createPath}`);
					continue;
				}

				try {
					// Create new active feature
					const result = this.kernel.write(fd, {
						entity_id: entityId,
						feature_id: parseInt(feature.id) || 0,
						feature_path: featurePath,
						feature_type: feature.type || 'unknown',
						activated_at: new Date().toISOString(),
						state: feature.state || {},
						options: feature.options || {}
					});

					if (result !== 0) {
						console.error(`Failed to create feature: ${result}`);
					}
				} finally {
					this.kernel.close(fd);
				}
			}
		}

		// Deactivate features that are no longer in the list
		const currentFeaturePaths = entity.activeFeatures.map((f) => f.path);
		const featuresToDeactivate = Array.from(existingFeatureMap.values()).filter(
			(f) => !f.deactivated_at && !currentFeaturePaths.includes(f.feature_path)
		);

		// Deactivate each feature that is no longer in the list
		for (const feature of featuresToDeactivate) {
			const featurePath = `/v_proc/character/${characterId}/feature/${feature.id}`;
			const fd = this.kernel.open(featurePath, OpenMode.WRITE);
			if (fd >= 0) {
				try {
					// Update to deactivate the feature
					const result = this.kernel.write(fd, {
						deactivated_at: new Date().toISOString()
					});

					if (result !== 0) {
						console.error(`Failed to deactivate feature: ${result}`);
					}
				} finally {
					this.kernel.close(fd);
				}
			}
		}
	}

	/**
	 * Loads a character entity from the database by ID using Unix file operations
	 * @param id The UUID of the entity to load
	 * @returns The loaded entity or null if not found
	 */
	async load(id: string): Promise<Entity | null> {
		try {
			console.log(`[SupabaseStorageDriver] Loading entity: ${id}`);

			// First, check if the entity file exists
			const entityPath = this.gameRulesAPI.getFileSystemPath('entity', id);

			if (this.kernel.exists(entityPath)) {
				// Load the entity from the entity file
				const fd = this.kernel.open(entityPath, OpenMode.READ);
				if (fd < 0) {
					console.error(`Failed to open entity file: ${entityPath}`);
					return null;
				}

				try {
					// Read the entity data
					const buffer: any = {};
					const [result] = this.kernel.read(fd, buffer);

					if (result !== 0) {
						console.error(`Failed to read entity file: ${result}`);
						return null;
					}

					// Get the database ID from the entity metadata
					const characterId = buffer.metadata?.databaseId;

					if (characterId) {
						// Make sure we have the latest character data
						const characterData = await this.gameRulesAPI.getCharacterByFileOperation(characterId);

						if (characterData) {
							// Update any changed fields in the entity
							buffer.name = characterData.name || buffer.name;
							buffer.description = characterData.description || buffer.description;

							// If the character has abilities, update them
							if (characterData.game_character_ability && buffer.character.abilities) {
								for (const ability of characterData.game_character_ability) {
									if (ability.ability) {
										const abilityName = ability.ability.name.toLowerCase();
										buffer.character.abilities[abilityName] = ability.value || 10;
									}
								}
							}
						}
					}

					return buffer as Entity;
				} finally {
					// Always close the file descriptor
					this.kernel.close(fd);
				}
			}

			// Entity file doesn't exist, try to find the character by a direct lookup
			const numericId = this.extractNumericId(id);

			if (numericId) {
				// Try to load the character data directly
				const characterData = await this.gameRulesAPI.getCharacterByFileOperation(numericId);

				if (characterData) {
					// Construct an entity from the character data
					const entity = this.constructEntityFromDatabaseCharacter(
						{ id: 0, name: id, type: 'character', ref_id: numericId },
						characterData,
						[] // No active features yet
					);

					// Create the entity file for next time
					const createResult = this.kernel.create(entityPath, entity);
					if (!createResult.success) {
						console.warn(`Failed to create entity file: ${createResult.errorMessage}`);
					}

					return entity;
				}
			}

			console.warn(`Entity with UUID ${id} not found`);
			return null;
		} catch (error) {
			console.error('Error loading character:', error);
			return null;
		}
	}

	/**
	 * Gets active features for an entity using Unix file operations
	 * @param entityId The database entity ID
	 * @returns Array of active features
	 */
	private async getActiveFeatures(entityId: number): Promise<any[]> {
		// Get active features using the entity features path
		const featuresPath = `/v_entity/${entityId}/features`;
		const featuresFd = this.kernel.open(featuresPath, OpenMode.READ);

		if (featuresFd < 0) {
			console.error(`Failed to open entity features: ${featuresPath}`);
			return [];
		}

		try {
			// Read the active features
			const buffer: any = {};
			const [result] = this.kernel.read(featuresFd, buffer);
			if (result !== 0) {
				console.error(`Failed to read entity features: ${result}`);
				return [];
			}

			// Return only active features (those without deactivated_at)
			const allFeatures = buffer.features || [];
			return allFeatures.filter((feature: any) => !feature.deactivated_at);
		} finally {
			// Always close file descriptor
			this.kernel.close(featuresFd);
		}
	}

	/**
	 * Constructs an entity object from database character data
	 * @param entityData The entity record
	 * @param characterData The character data from the database
	 * @param activeFeatures Active features for the entity
	 * @returns A constructed entity
	 */
	private constructEntityFromDatabaseCharacter(
		entityData: any,
		characterData: CompleteCharacter,
		activeFeatures: any[]
	): Entity {
		// Build the ability scores object
		const abilities: Record<string, number> = {};
		characterData.game_character_ability?.forEach((ability) => {
			if (ability.ability) {
				abilities[ability.ability.name.toLowerCase()] = ability.value || 10;
			}
		});

		// Build the classes array
		const classes =
			characterData.game_character_class?.map((cls) => ({
				id: `class_${cls.class_id}`,
				name: cls.class?.name || 'Unknown',
				level: cls.level
			})) || [];

		// Build the feats array
		const feats =
			characterData.game_character_feat?.map((feat) => ({
				id: `feat_${feat.feat_id}`,
				name: feat.feat?.name || 'Unknown Feat'
			})) || [];

		// Build the traits array
		const traits =
			characterData.game_character_trait?.map((trait) => ({
				id: `trait_${trait.trait_id}`,
				name: trait.trait?.name || 'Unknown Trait'
			})) || [];

		// Build the skills object
		const skills: Record<string, { ranks: number; classSkill: boolean }> = {};

		// First, build a map of skill IDs to skill names
		const skillNameMap = new Map<number, string>();

		// Create a map of class skills based on character classes
		const classSkills = new Set<number>();

		// Check which skills are class skills based on character's classes
		if (characterData.game_character_class) {
			for (const charClass of characterData.game_character_class) {
				if (charClass.class?.id) {
					// In a real implementation, we would query class_skill table
					// For now, we'll assume all skills can be class skills
				}
			}
		}

		// Group skill ranks by skill
		const skillRanks = new Map<number, number>();
		if (characterData.game_character_skill_rank) {
			for (const rank of characterData.game_character_skill_rank) {
				const skillId = rank.skill_id;
				skillRanks.set(skillId, (skillRanks.get(skillId) || 0) + 1);

				// Also build the skill name map while we're at it
				if (rank.skill?.name) {
					skillNameMap.set(skillId, rank.skill.name.toLowerCase());
				}
			}
		}

		// Create the skills object using both maps
		for (const [skillId, ranks] of skillRanks.entries()) {
			const skillName = skillNameMap.get(skillId);
			if (!skillName) continue; // Skip if we don't have a name for this skill

			const isClassSkill = classSkills.has(skillId);

			skills[skillName] = {
				ranks,
				classSkill: isClassSkill
			};
		}

		// Add all skills with 0 ranks for completeness
		if (characterData.game_character_skill_rank) {
			for (const rank of characterData.game_character_skill_rank) {
				if (rank.skill?.name) {
					const skillName = rank.skill.name.toLowerCase();
					if (!skills[skillName]) {
						skills[skillName] = { ranks: 0, classSkill: false };
					}
				}
			}
		}

		// Calculate derived values
		const constitutionMod = Math.floor((abilities['constitution'] || 10) - 10) / 2;

		// Calculate base values for hit points
		let baseHitPoints = 0;
		if (characterData.game_character_class) {
			for (const charClass of characterData.game_character_class) {
				// Default hit die values based on class - would be more accurate from database
				let hitDie = 6; // Default d6
				if (charClass.class) {
					const className = charClass.class.name.toLowerCase();
					if (['barbarian'].includes(className)) hitDie = 12;
					else if (['fighter', 'paladin', 'ranger'].includes(className)) hitDie = 10;
					else if (['alchemist', 'bard', 'cleric', 'druid', 'monk', 'rogue'].includes(className))
						hitDie = 8;
				}
				// Simplistic HP calculation (in real system would be more complex)
				const classLevel = charClass.level || 0;
				baseHitPoints += hitDie + (hitDie / 2 + 0.5) * (classLevel - 1);
			}
		}

		// Add Constitution bonus
		const hpFromCon = constitutionMod * classes.reduce((sum, cls) => sum + cls.level, 0);
		const maxHitPoints = baseHitPoints + hpFromCon;

		// Calculate BAB and saves
		let baseAttackBonus = 0;
		let baseFortSave = 0;
		let baseRefSave = 0;
		let baseWillSave = 0;

		if (characterData.game_character_class) {
			for (const charClass of characterData.game_character_class) {
				if (!charClass.class) continue;

				const className = charClass.class.name.toLowerCase();
				const level = charClass.level || 0;

				// High BAB: Fighter, Barbarian, Ranger, Paladin (1:1)
				// Medium BAB: Alchemist, Bard, Cleric, Druid, Monk, Rogue (3:4)
				// Low BAB: Sorcerer, Wizard, etc. (1:2)
				if (['fighter', 'barbarian', 'ranger', 'paladin'].includes(className)) {
					baseAttackBonus += level;
				} else if (['alchemist', 'bard', 'cleric', 'druid', 'monk', 'rogue'].includes(className)) {
					baseAttackBonus += Math.floor(level * 0.75);
				} else {
					baseAttackBonus += Math.floor(level * 0.5);
				}

				// Good saves (2 + level/2)
				// Bad saves (0 + level/3)
				if (['barbarian', 'fighter', 'paladin', 'ranger', 'monk', 'druid'].includes(className)) {
					baseFortSave += 2 + Math.floor(level / 2);
				} else {
					baseFortSave += Math.floor(level / 3);
				}

				if (['bard', 'monk', 'ranger', 'rogue', 'alchemist'].includes(className)) {
					baseRefSave += 2 + Math.floor(level / 2);
				} else {
					baseRefSave += Math.floor(level / 3);
				}

				if (['bard', 'cleric', 'druid', 'monk', 'sorcerer', 'wizard'].includes(className)) {
					baseWillSave += 2 + Math.floor(level / 2);
				} else {
					baseWillSave += Math.floor(level / 3);
				}
			}
		}

		// Add character customizations to base values
		const strMod = Math.floor((abilities['strength'] || 10) - 10) / 2;
		const dexMod = Math.floor((abilities['dexterity'] || 10) - 10) / 2;
		const conMod = Math.floor((abilities['constitution'] || 10) - 10) / 2;
		const intMod = Math.floor((abilities['intelligence'] || 10) - 10) / 2;
		const wisMod = Math.floor((abilities['wisdom'] || 10) - 10) / 2;
		const chaMod = Math.floor((abilities['charisma'] || 10) - 10) / 2;

		// Build active features
		const mappedActiveFeatures = activeFeatures.map((feature) => ({
			id: feature.feature_id.toString(),
			path: feature.feature_path,
			type: feature.feature_type,
			active: true,
			state: feature.state || {},
			options: feature.options || {}
		}));

		// Construct the entity
		return {
			id: entityData.uuid,
			type: entityData.type,
			name: characterData.name,
			description: characterData.description,
			properties: entityData.properties || {},
			character: {
				experience: characterData.experience || 0,
				abilities,
				classes,
				feats,
				traits,
				skills,
				hitPoints: {
					max: Math.max(1, Math.floor(maxHitPoints)),
					current: Math.max(1, Math.floor(maxHitPoints)),
					temporary: 0,
					nonLethal: 0
				},
				baseAttackBonus: baseAttackBonus,
				savingThrows: {
					fortitude: baseFortSave + conMod,
					reflex: baseRefSave + dexMod,
					will: baseWillSave + wisMod
				},
				classFeatures: [],
				ancestry: characterData.game_character_ancestry?.[0]?.ancestry?.name || ''
			},
			activeFeatures: mappedActiveFeatures,
			metadata: {
				createdAt: new Date(entityData.created_at || Date.now()).getTime(),
				updatedAt: new Date(entityData.updated_at || Date.now()).getTime(),
				version: 1,
				databaseId: characterData.id
			}
		};
	}

	/**
	 * Extracts a numeric database ID from an entity UUID
	 * @param id The entity UUID
	 * @returns The numeric database ID or null if not found
	 */
	private extractNumericId(id: string): number | null {
		// First check if the UUID contains embedded metadata
		if (id.includes('_db_')) {
			const match = id.match(/_db_(\d+)_/);
			if (match && match[1]) {
				return parseInt(match[1], 10);
			}
		}

		// Otherwise, query the entity table
		return null;
	}

	/**
	 * Deletes a character from the database using Unix file operations
	 * @param id The UUID of the entity to delete
	 * @returns True if successful
	 */
	async delete(id: string): Promise<boolean> {
		try {
			console.log(`[SupabaseStorageDriver] Deleting entity: ${id}`);

			// First check if the entity file exists
			const entityPath = this.gameRulesAPI.getFileSystemPath('entity', id);

			if (this.kernel.exists(entityPath)) {
				// Get the character ID from the entity before deleting
				const fd = this.kernel.open(entityPath, OpenMode.READ);

				if (fd < 0) {
					console.error(`Failed to open entity file for reading: ${entityPath}`);
					return false;
				}

				let characterId: number | null = null;

				try {
					// Read the entity data to get character ID
					const buffer: any = {};
					const [result] = this.kernel.read(fd, buffer);

					if (result === 0 && buffer.metadata?.databaseId) {
						characterId = buffer.metadata.databaseId;
					}
				} finally {
					// Always close the file descriptor
					this.kernel.close(fd);
				}

				// Delete the entity file
				const unlinkResult = this.kernel.unlink(entityPath);
				if (unlinkResult !== 0) {
					console.error(`Failed to delete entity file: ${unlinkResult}`);
					return false;
				}

				// If we have a character ID, delete the character file too
				if (characterId) {
					const characterPath = this.gameRulesAPI.getFileSystemPath('character', characterId);

					if (this.kernel.exists(characterPath)) {
						const characterUnlinkResult = this.kernel.unlink(characterPath);
						if (characterUnlinkResult !== 0) {
							console.warn(`Failed to delete character file: ${characterUnlinkResult}`);
							// Continue anyway, as the entity is already deleted
						}
					}

					// Use an ioctl to delete from database too
					const devicePath = '/v_dev/db';
					const deviceFd = this.kernel.open(devicePath, OpenMode.READ_WRITE);

					if (deviceFd >= 0) {
						try {
							// Send a delete request
							const ioctlResult = this.kernel.ioctl(deviceFd, 5, {
								// DatabaseOperation.DELETE
								resource: 'character',
								id: characterId
							});

							if (ioctlResult !== 0) {
								console.warn(`Database delete operation failed: ${ioctlResult}`);
								// Continue anyway, as we've already deleted the files
							}
						} finally {
							this.kernel.close(deviceFd);
						}
					}
				}

				return true;
			}

			// Entity not found
			console.warn(`Entity with UUID ${id} not found for deletion`);
			return false;
		} catch (error) {
			console.error('Error deleting character:', error);
			return false;
		}
	}

	/**
	 * Lists all character entities using Unix file operations
	 * @returns Array of entity UUIDs
	 */
	async list(): Promise<string[]> {
		try {
			console.log(`[SupabaseStorageDriver] Listing all characters`);

			// First, check if the list file exists
			const listPath = '/v_proc/character/list';

			if (this.kernel.exists(listPath)) {
				// Read the list file
				const fd = this.kernel.open(listPath, OpenMode.READ);

				if (fd < 0) {
					console.error(`Failed to open character list file: ${listPath}`);
					return [];
				}

				try {
					// Read the character list
					const buffer: any = {};
					const [result] = this.kernel.read(fd, buffer);

					if (result !== 0) {
						console.error(`Failed to read character list: ${result}`);
						return [];
					}

					// Extract character IDs
					if (buffer.characters && Array.isArray(buffer.characters)) {
						// Use the list from the file
						return buffer.characters
							.map((char) => char.id || char.uuid || char.name)
							.filter(Boolean);
					}

					return [];
				} finally {
					// Always close the file descriptor
					this.kernel.close(fd);
				}
			}

			// No list file, scan the entity directory
			const entityDir = '/v_entity';

			if (this.kernel.exists(entityDir)) {
				// Try to list all files in the entity directory
				const stats = this.kernel.stat(entityDir);

				if (stats && stats.isDirectory) {
					// Get directory contents
					const contents = this.kernel.readdir(entityDir);

					// Filter for character entities
					if (Array.isArray(contents)) {
						// Read each file to check if it's a character
						const characterIds: string[] = [];

						for (const item of contents) {
							const path = `${entityDir}/${item}`;

							if (this.kernel.exists(path)) {
								const stats = this.kernel.stat(path);

								if (stats && stats.isFile) {
									// Read the file to check if it's a character entity
									const fd = this.kernel.open(path, OpenMode.READ);

									if (fd >= 0) {
										try {
											// Read the entity data
											const buffer: any = {};
											const [result] = this.kernel.read(fd, buffer);

											if (result === 0 && buffer.type === 'character') {
												characterIds.push(buffer.id);
											}
										} finally {
											this.kernel.close(fd);
										}
									}
								}
							}
						}

						return characterIds;
					}
				}
			}

			// Fallback: try to list characters directly from GameRulesAPI
			const characters = await this.gameRulesAPI.listCharactersByFileOperation();
			return characters.map((char) => `character_${char.id}`);
		} catch (error) {
			console.error('Error listing characters:', error);
			return [];
		}
	}
}
