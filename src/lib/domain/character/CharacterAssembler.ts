/**
 * Unix-Style Character Assembler
 *
 * This module implements a Unix-style character assembly process that uses file operations
 * for all access to character data and capabilities.
 */

import type { CompleteCharacter } from '$lib/db/gameRules.api';
import type { AssembledCharacter } from './characterTypes';
import type { Entity } from '../kernel/types';
import {
	ErrorCode,
	OpenMode,
	createError,
	withFile,
	withResource,
	success,
	failure,
	createErrorLogger,
	type Result
} from '../kernel/ErrorHandler';

// Unix paths for devices and entity data
const PATHS = {
	// Device files
	DB_DEVICE: '/v_dev/db',
	ABILITY_DEVICE: '/v_dev/ability',
	SKILL_DEVICE: '/v_dev/skill',
	BONUS_DEVICE: '/v_dev/bonus',
	COMBAT_DEVICE: '/v_dev/combat',
	CONDITION_DEVICE: '/v_dev/condition',
	SPELLCASTING_DEVICE: '/v_dev/spellcasting',

	// Character path (canonical)
	PROC_CHARACTER: '/v_proc/character',

	// Process directory
	PROC: '/v_proc',
	PROC_FEATURES: '/v_proc/features',

	// Log files
	LOG: '/v_var/log/character-assembler.log'
};

// Request codes for devices
const REQUEST = {
	INITIALIZE: 0,
	GET_DATA: 1,
	SET_DATA: 2,
	APPLY_FEATURE: 3,
	GET_BREAKDOWN: 4,
	GET_ALL: 5
};

/**
 * Character assembler using Unix principles
 * - All operations use file operations
 * - All resources managed with proper file descriptors
 * - Error handling uses standard error codes
 */
export class UnixCharacterAssembler {
	private kernel: any; // GameKernel instance
	private logger = createErrorLogger('CharacterAssembler');

	/**
	 * Create a new Unix-style character assembler
	 * @param kernel GameKernel instance
	 */
	constructor(kernel: any) {
		this.kernel = kernel;

		// Create log file if it doesn't exist
		if (!kernel.exists(PATHS.LOG)) {
			kernel.create(PATHS.LOG, { entries: [] });
		}

		// Log initialization
		this.log('Unix Character Assembler initialized');
	}

	/**
	 * Log a message to the character assembler log file
	 * @param message Message to log
	 */
	private log(message: string): void {
		try {
			const fd = this.kernel.open(PATHS.LOG, OpenMode.READ_WRITE);
			if (fd < 0) {
				console.error(`Failed to open log file: ${fd}`);
				return;
			}

			try {
				const [readResult, logData] = this.kernel.read(fd);
				if (readResult !== ErrorCode.SUCCESS) {
					console.error(`Failed to read log file: ${readResult}`);
					return;
				}

				// Add new log entry
				logData.entries.push({
					timestamp: new Date().toISOString(),
					message
				});

				// Write back to log file
				const writeResult = this.kernel.write(fd, logData);
				if (writeResult !== ErrorCode.SUCCESS) {
					console.error(`Failed to write to log file: ${writeResult}`);
				}
			} finally {
				this.kernel.close(fd);
			}
		} catch (err) {
			console.error('Error writing to log file:', err);
		}
	}

	/**
	 * Assemble a character using Unix file operations
	 * @param characterData Raw character data from database
	 * @returns Assembled character with calculated values
	 */
	public async assembleCharacter(
		characterData: CompleteCharacter
	): Promise<Result<AssembledCharacter>> {
		this.log(`Assembling character: ${characterData.id} (${characterData.name || 'Unnamed'})`);

		// Create entity and register it with the kernel
		const entityResult = await this.createEntity(characterData);
		if (!entityResult.success) {
			return entityResult;
		}

		const entityPath = `${PATHS.PROC_CHARACTER}/${characterData.id}`;

		// Initialize all capabilities
		const initResult = await this.initializeCapabilities(entityPath);
		if (!initResult.success) {
			return failure(
				initResult.errorCode,
				`Failed to initialize capabilities: ${initResult.errorMessage}`,
				{
					component: 'CharacterAssembler',
					operation: 'assembleCharacter.initializeCapabilities',
					path: entityPath
				}
			);
		}

		// Apply character features
		const featuresResult = await this.applyFeatures(entityPath, characterData);
		if (!featuresResult.success) {
			this.logger.warn(`Failed to apply some features: ${featuresResult.errorMessage}`);
			// Continue anyway - non-critical
		}

		// Calculate character values
		const calculationResult = await this.calculateCharacterValues(entityPath, characterData);
		if (!calculationResult.success) {
			return calculationResult;
		}

		return success(calculationResult.data as AssembledCharacter);
	}

	/**
	 * Create an entity from character data and register it with the kernel
	 * @param characterData Raw character data
	 * @returns Entity path if successful
	 */
	private async createEntity(characterData: CompleteCharacter): Promise<Result<string>> {
		const entityPath = `${PATHS.PROC_CHARACTER}/${characterData.id}`;

		// Create entity object
		const entity: Entity = {
			id: characterData.id.toString(),
			type: 'character',
			name: characterData.name || 'Unnamed Character',
			properties: {},
			metadata: {
				createdAt: Date.now(),
				updatedAt: Date.now(),
				version: 1
			}
		};

		// Store character data in entity properties
		entity.properties.characterData = characterData;

		// Check if entity already exists
		if (this.kernel.exists(entityPath)) {
			// Entity exists - open it and update
			return withFile(this.kernel, entityPath, OpenMode.WRITE, (fd) => {
				const writeResult = this.kernel.write(fd, entity);
				if (writeResult !== ErrorCode.SUCCESS) {
					return failure(writeResult, `Failed to update entity: ${entityPath}`, {
						component: 'CharacterAssembler',
						operation: 'createEntity.update',
						path: entityPath,
						fd
					});
				}

				return success(entityPath);
			});
		} else {
			// Entity doesn't exist - create it
			const createResult = this.kernel.create(entityPath, entity);
			if (!createResult.success) {
				return failure(
					createResult.errorCode || ErrorCode.EIO,
					`Failed to create entity: ${entityPath}`,
					{
						component: 'CharacterAssembler',
						operation: 'createEntity.create',
						path: entityPath
					}
				);
			}

			this.log(`Created entity: ${entityPath}`);
			return success(entityPath);
		}
	}

	/**
	 * Initialize all capabilities with entity data
	 * @param entityPath Path to the entity
	 * @returns Success or failure result
	 */
	private async initializeCapabilities(entityPath: string): Promise<Result<void>> {
		const capabilities = [
			{ path: PATHS.ABILITY_DEVICE, name: 'ability' },
			{ path: PATHS.SKILL_DEVICE, name: 'skill' },
			{ path: PATHS.BONUS_DEVICE, name: 'bonus' },
			{ path: PATHS.COMBAT_DEVICE, name: 'combat' },
			{ path: PATHS.CONDITION_DEVICE, name: 'condition' },
			{ path: PATHS.SPELLCASTING_DEVICE, name: 'spellcasting' }
		];

		// Initialize each capability
		for (const capability of capabilities) {
			if (!this.kernel.exists(capability.path)) {
				this.logger.warn(`Capability device not found: ${capability.path}`, null, {
					operation: 'initializeCapabilities',
					path: capability.path
				});
				continue; // Skip this capability
			}

			const result = await withFile(this.kernel, capability.path, OpenMode.READ_WRITE, (fd) => {
				// Use IOCTL to initialize
				const ioctlResult = this.kernel.ioctl(fd, REQUEST.INITIALIZE, {
					entityPath
				});

				if (ioctlResult !== ErrorCode.SUCCESS) {
					return failure(ioctlResult, `Failed to initialize capability: ${capability.name}`, {
						component: 'CharacterAssembler',
						operation: 'initializeCapabilities.ioctl',
						path: capability.path,
						fd
					});
				}

				return success(undefined);
			});

			if (!result.success) {
				// Non-critical capabilities can fail
				if (capability.name === 'condition' || capability.name === 'spellcasting') {
					this.logger.warn(`Failed to initialize optional capability: ${capability.name}`, null, {
						path: capability.path,
						errorCode: result.errorCode
					});
				} else {
					// Critical capabilities must succeed
					return result;
				}
			}
		}

		return success(undefined);
	}

	/**
	 * Apply features to the character
	 * @param entityPath Path to the entity
	 * @param characterData Raw character data
	 * @returns Success or failure result
	 */
	private async applyFeatures(
		entityPath: string,
		characterData: CompleteCharacter
	): Promise<Result<void>> {
		// Get feature categories to apply
		const featureCategories = [
			{
				name: 'ancestry',
				items: characterData.game_character_ancestry_trait?.map((x) => x.ancestry_trait) || [],
				getPath: (item: any) => `ancestry.${item.name?.toLowerCase().replace(/\s+/g, '_')}`
			},
			{
				name: 'class',
				items: characterData.game_character_class_feature?.map((x) => x.class_feature) || [],
				getPath: (item: any) => `class.${item.name?.toLowerCase().replace(/\s+/g, '_')}`
			},
			{
				name: 'feat',
				items: characterData.game_character_feat?.map((x) => x.feat) || [],
				getPath: (item: any) => `feat.${item.name?.toLowerCase().replace(/\s+/g, '_')}`
			},
			{
				name: 'corruption',
				items:
					characterData.game_character_corruption_manifestation?.map((x) => x.manifestation) || [],
				getPath: (item: any) => `corruption.${item.name?.toLowerCase().replace(/\s+/g, '_')}`
			}
		];

		// Apply each category
		for (const category of featureCategories) {
			for (const item of category.items) {
				if (!item) continue;

				const featurePath = category.getPath(item);
				const procPath = `${PATHS.PROC_FEATURES}/${featurePath}`;

				try {
					// Check if feature exists in /v_proc/features
					if (this.kernel.exists(procPath)) {
						// Feature exists - apply it using file operations
						await withFile(this.kernel, procPath, OpenMode.READ_WRITE, (fd) => {
							// Request feature activation
							return this.kernel.write(fd, {
								action: 'activate',
								entityPath,
								options: {}
							});
						});
					} else {
						// Feature not found - apply fallback bonuses for some types
						if (category.name === 'ancestry' || category.name === 'class') {
							await this.applyFallbackBonuses(entityPath, item, category.name);
						}
					}
				} catch (err) {
					this.logger.warn(`Failed to apply ${category.name} feature: ${featurePath}`, err, {
						operation: 'applyFeatures',
						featurePath
					});
				}
			}
		}

		// Apply equipment effects
		await this.applyEquipmentEffects(entityPath, characterData);

		return success(undefined);
	}

	/**
	 * Apply fallback bonuses for features that don't have implementations
	 * @param entityPath Path to the entity
	 * @param feature Feature data
	 * @param featureType Type of feature (ancestry or class)
	 */
	private async applyFallbackBonuses(
		entityPath: string,
		feature: any,
		featureType: string
	): Promise<void> {
		const bonuses = [];

		// Extract bonuses from ancestry traits
		if (featureType === 'ancestry' && feature.ancestry_trait_benefit) {
			for (const benefit of feature.ancestry_trait_benefit) {
				if (!benefit.ancestry_trait_benefit_bonus) continue;

				for (const bonus of benefit.ancestry_trait_benefit_bonus) {
					if (!bonus.target_specifier || !bonus.bonus_type) continue;

					bonuses.push({
						target: bonus.target_specifier.name || '',
						value: bonus.value || 0,
						type: bonus.bonus_type.name || 'untyped',
						source: feature.name || 'Ancestry Trait'
					});
				}
			}
		}

		// Extract bonuses from class features
		if (featureType === 'class' && feature.class_feature_benefit) {
			for (const benefit of feature.class_feature_benefit) {
				if (!benefit.class_feature_benefit_bonus) continue;

				for (const bonus of benefit.class_feature_benefit_bonus) {
					if (!bonus.target_specifier || !bonus.bonus_type) continue;

					bonuses.push({
						target: bonus.target_specifier.name || '',
						value: bonus.value || 0,
						type: bonus.bonus_type.name || 'untyped',
						source: feature.name || 'Class Feature'
					});
				}
			}
		}

		// Apply all collected bonuses
		if (bonuses.length > 0) {
			await withFile(this.kernel, PATHS.BONUS_DEVICE, OpenMode.READ_WRITE, (fd) => {
				for (const bonus of bonuses) {
					// Use IOCTL to apply bonus
					this.kernel.ioctl(fd, REQUEST.SET_DATA, {
						entityPath,
						operation: 'addBonus',
						target: bonus.target,
						value: bonus.value,
						type: bonus.type,
						source: bonus.source
					});
				}

				return ErrorCode.SUCCESS;
			});
		}
	}

	/**
	 * Apply equipment effects to the character
	 * @param entityPath Path to the entity
	 * @param characterData Raw character data
	 */
	private async applyEquipmentEffects(
		entityPath: string,
		characterData: CompleteCharacter
	): Promise<void> {
		// Apply armor bonuses
		if (characterData.game_character_armor) {
			await withFile(this.kernel, PATHS.BONUS_DEVICE, OpenMode.READ_WRITE, (fd) => {
				// For each armor piece
				for (const charArmor of characterData.game_character_armor) {
					if (!charArmor.armor) continue;

					const armor = charArmor.armor;

					// Apply armor bonus to AC
					this.kernel.ioctl(fd, REQUEST.SET_DATA, {
						entityPath,
						operation: 'addBonus',
						target: 'ac',
						value: armor.ac_bonus || 0,
						type: 'armor',
						source: armor.name || 'Armor'
					});
				}

				return ErrorCode.SUCCESS;
			});

			// Store max dex info in entity
			for (const charArmor of characterData.game_character_armor) {
				if (!charArmor.armor || charArmor.armor.max_dex_bonus === undefined) continue;

				// Update entity with max dex info
				await withFile(this.kernel, entityPath, OpenMode.READ_WRITE, (fd) => {
					// Read current entity data
					const [readResult, entity] = this.kernel.read(fd);
					if (readResult !== ErrorCode.SUCCESS) {
						return readResult;
					}

					// Update entity with armor info
					if (!entity.properties.armorInfo) entity.properties.armorInfo = {};
					entity.properties.armorInfo.maxDex = charArmor.armor.max_dex_bonus;

					// Write updated entity
					return this.kernel.write(fd, entity);
				});
			}
		}
	}

	/**
	 * Calculate all character values using capability devices
	 * @param entityPath Path to the entity
	 * @param characterData Raw character data
	 * @returns Calculated character values
	 */
	private async calculateCharacterValues(
		entityPath: string,
		characterData: CompleteCharacter
	): Promise<Result<AssembledCharacter>> {
		try {
			// Get entity data
			const entityResult = await withFile(this.kernel, entityPath, OpenMode.READ, (fd) => {
				const [readResult, entity] = this.kernel.read(fd);
				if (readResult !== ErrorCode.SUCCESS) {
					return failure(readResult, `Failed to read entity: ${entityPath}`, {
						component: 'CharacterAssembler',
						operation: 'calculateCharacterValues.readEntity',
						path: entityPath,
						fd
					});
				}

				return success(entity);
			});

			if (!entityResult.success || !entityResult.data) {
				return failure(
					entityResult.errorCode,
					entityResult.errorMessage || 'Failed to read entity',
					entityResult.errorContext
				);
			}

			const entity = entityResult.data as Entity;

			// Calculate ability scores
			const abilities = await this.calculateAbilityScores(entityPath);

			// Calculate combat stats
			const combatStats = await this.calculateCombatStats(entityPath);

			// Calculate skills
			const skills = await this.calculateSkills(entityPath, characterData);

			// Calculate spellcasting
			const spellcasting = await this.calculateSpellcasting(entityPath);

			// Calculate total level
			const totalLevel =
				characterData.game_character_class?.reduce(
					(sum, classEntry) => sum + (classEntry.level || 0),
					0
				) || 0;

			// Get ABP node data
			const abpNodes = characterData.game_character_abp_choice?.map((choice) => choice.node) || [];

			// Get favored class bonus data
			const favoredClassBonuses = characterData.game_character_favored_class_bonus || [];

			// Return assembled character
			return success({
				...characterData,

				// Ability scores
				strength: abilities.strength,
				dexterity: abilities.dexterity,
				constitution: abilities.constitution,
				intelligence: abilities.intelligence,
				wisdom: abilities.wisdom,
				charisma: abilities.charisma,

				// Ability modifiers
				strMod: abilities.strength.total ? Math.floor((abilities.strength.total - 10) / 2) : 0,
				dexMod: abilities.dexterity.total ? Math.floor((abilities.dexterity.total - 10) / 2) : 0,
				conMod: abilities.constitution.total
					? Math.floor((abilities.constitution.total - 10) / 2)
					: 0,
				intMod: abilities.intelligence.total
					? Math.floor((abilities.intelligence.total - 10) / 2)
					: 0,
				wisMod: abilities.wisdom.total ? Math.floor((abilities.wisdom.total - 10) / 2) : 0,
				chaMod: abilities.charisma.total ? Math.floor((abilities.charisma.total - 10) / 2) : 0,

				// Combat stats
				saves: combatStats.saves,
				ac: combatStats.ac,
				touch_ac: combatStats.touch_ac,
				flat_footed_ac: combatStats.flat_footed_ac,
				initiative: combatStats.initiative,
				cmb: combatStats.cmb,
				cmd: combatStats.cmd,

				// Skills
				skills: skills.skills,

				// Attacks
				attacks: combatStats.attacks,

				// Character data
				totalLevel,
				skillsWithRanks: skills.skillsWithRanks,
				processedClassFeatures: [],

				// Spellcasting data
				spellcastingClasses: spellcasting.spellcastingClasses,
				preparedSpells: spellcasting.preparedSpells,
				spellSlots: spellcasting.spellSlots,

				// Skill points - placeholder implementation
				skillPoints: {
					total: {},
					remaining: {}
				},

				// ABP data for UI display
				abpData: {
					nodes: abpNodes,
					appliedBonuses: entity.properties.bonuses
						? Object.entries(entity.properties.bonuses).flatMap(([target, bonuses]) =>
								(bonuses as Array<{ value: number; type: string; source: string }>)
									.filter((b) => b.source.startsWith('ABP:'))
									.map((b) => ({
										target,
										...b
									}))
							)
						: []
				},

				// Favored Class Bonus data for UI display
				favoredClassData: {
					bonuses: favoredClassBonuses,
					appliedBonuses: entity.properties.bonuses
						? Object.entries(entity.properties.bonuses).flatMap(([target, bonuses]) =>
								(bonuses as Array<{ value: number; type: string; source: string }>)
									.filter((b) => b.source.includes('Favored Class'))
									.map((b) => ({
										target,
										...b
									}))
							)
						: [],
					skillRanks: entity.properties.favoredClassBonuses?.skillRanks || 0
				}
			});
		} catch (err) {
			return failure(
				ErrorCode.EIO,
				`Error calculating character values: ${err instanceof Error ? err.message : String(err)}`,
				{
					component: 'CharacterAssembler',
					operation: 'calculateCharacterValues',
					path: entityPath
				}
			);
		}
	}

	/**
	 * Calculate ability scores for the character
	 * @param entityPath Path to the entity
	 * @returns Ability score data
	 */
	private async calculateAbilityScores(entityPath: string): Promise<any> {
		const abilities = {
			strength: { label: 'Strength', modifiers: [], total: 10 },
			dexterity: { label: 'Dexterity', modifiers: [], total: 10 },
			constitution: { label: 'Constitution', modifiers: [], total: 10 },
			intelligence: { label: 'Intelligence', modifiers: [], total: 10 },
			wisdom: { label: 'Wisdom', modifiers: [], total: 10 },
			charisma: { label: 'Charisma', modifiers: [], total: 10 }
		};

		try {
			// Get breakdowns from ability device
			await withFile(this.kernel, PATHS.ABILITY_DEVICE, OpenMode.READ_WRITE, (fd) => {
				for (const abilityName of Object.keys(abilities)) {
					// Request ability breakdown
					const ioctlResult = this.kernel.ioctl(fd, REQUEST.GET_BREAKDOWN, {
						entityPath,
						ability: abilityName
					});

					if (ioctlResult !== ErrorCode.SUCCESS) {
						this.logger.warn(`Failed to get ${abilityName} breakdown`, null, {
							operation: 'calculateAbilityScores',
							ability: abilityName,
							errorCode: ioctlResult
						});
						continue;
					}

					// Read the result
					const [readResult, breakdown] = this.kernel.read(fd);
					if (readResult !== ErrorCode.SUCCESS) {
						this.logger.warn(`Failed to read ${abilityName} breakdown result`, null, {
							operation: 'calculateAbilityScores.read',
							ability: abilityName,
							errorCode: readResult
						});
						continue;
					}

					// Store in ability result
					if (breakdown) {
						abilities[abilityName] = {
							label: abilityName.charAt(0).toUpperCase() + abilityName.slice(1),
							modifiers:
								breakdown.bonuses?.components?.map((c) => ({
									source: c.source,
									value: c.value
								})) || [],
							total: breakdown.total || 10
						};
					}
				}

				return ErrorCode.SUCCESS;
			});
		} catch (err) {
			this.logger.error('Error calculating ability scores', err, {
				operation: 'calculateAbilityScores',
				path: entityPath
			});
		}

		return abilities;
	}

	/**
	 * Calculate combat stats for the character
	 * @param entityPath Path to the entity
	 * @returns Combat stat data
	 */
	private async calculateCombatStats(entityPath: string): Promise<any> {
		const result = {
			saves: {
				fortitude: { label: 'Fortitude', modifiers: [], total: 0 },
				reflex: { label: 'Reflex', modifiers: [], total: 0 },
				will: { label: 'Will', modifiers: [], total: 0 }
			},
			ac: { label: 'AC', modifiers: [], total: 10 },
			touch_ac: { label: 'Touch AC', modifiers: [], total: 10 },
			flat_footed_ac: { label: 'Flat-footed AC', modifiers: [], total: 10 },
			initiative: { label: 'Initiative', modifiers: [], total: 0 },
			cmb: { label: 'CMB', modifiers: [], total: 0 },
			cmd: { label: 'CMD', modifiers: [], total: 10 },
			attacks: {
				melee: { label: 'Melee Attack', modifiers: [], total: 0 },
				ranged: { label: 'Ranged Attack', modifiers: [], total: 0 },
				bomb: {
					label: 'Bomb Attack',
					attack: { label: 'Bomb Attack', modifiers: [], total: 0 },
					damage: { label: 'Bomb Damage', modifiers: [], total: 0 },
					bombDice: 0
				}
			}
		};

		try {
			// Get combat stat breakdowns
			await withFile(this.kernel, PATHS.COMBAT_DEVICE, OpenMode.READ_WRITE, (fd) => {
				// Get saves
				for (const saveType of ['fortitude', 'reflex', 'will']) {
					// Request save breakdown
					const ioctlResult = this.kernel.ioctl(fd, REQUEST.GET_BREAKDOWN, {
						entityPath,
						saveType
					});

					if (ioctlResult === ErrorCode.SUCCESS) {
						// Read the result
						const [readResult, breakdown] = this.kernel.read(fd);
						if (readResult === ErrorCode.SUCCESS && breakdown) {
							result.saves[saveType] = {
								label: saveType.charAt(0).toUpperCase() + saveType.slice(1),
								modifiers:
									breakdown.otherBonuses?.components?.map((c) => ({
										source: c.source,
										value: c.value
									})) || [],
								total: breakdown.total || 0
							};
						}
					}
				}

				// Get AC breakdown
				const acIoctlResult = this.kernel.ioctl(fd, REQUEST.GET_BREAKDOWN, {
					entityPath,
					stat: 'ac'
				});

				if (acIoctlResult === ErrorCode.SUCCESS) {
					// Read the result
					const [readResult, acBreakdown] = this.kernel.read(fd);
					if (readResult === ErrorCode.SUCCESS && acBreakdown) {
						// Normal AC
						result.ac = {
							label: 'AC',
							modifiers:
								acBreakdown.otherBonuses?.components?.map((c) => ({
									source: c.source,
									value: c.value
								})) || [],
							total: acBreakdown.total || 10
						};

						// Touch AC
						result.touch_ac = {
							label: 'Touch AC',
							modifiers:
								acBreakdown.otherBonuses?.components?.map((c) => ({
									source: c.source,
									value: c.value
								})) || [],
							total: acBreakdown.touch || 10
						};

						// Flat-footed AC
						result.flat_footed_ac = {
							label: 'Flat-footed AC',
							modifiers:
								acBreakdown.otherBonuses?.components?.map((c) => ({
									source: c.source,
									value: c.value
								})) || [],
							total: acBreakdown.flatFooted || 10
						};
					}
				}

				// Get attack breakdowns
				for (const attackType of ['melee', 'ranged']) {
					// Request attack breakdown
					const ioctlResult = this.kernel.ioctl(fd, REQUEST.GET_BREAKDOWN, {
						entityPath,
						attackType
					});

					if (ioctlResult === ErrorCode.SUCCESS) {
						// Read the result
						const [readResult, breakdown] = this.kernel.read(fd);
						if (readResult === ErrorCode.SUCCESS && breakdown) {
							result.attacks[attackType] = {
								label: `${attackType.charAt(0).toUpperCase() + attackType.slice(1)} Attack`,
								modifiers:
									breakdown.otherBonuses?.components?.map((c) => ({
										source: c.source,
										value: c.value
									})) || [],
								total: breakdown.total || 0
							};
						}
					}
				}

				// Get other combat stats
				const statsToGet = [
					{ name: 'initiative', label: 'Initiative' },
					{ name: 'cmb', label: 'CMB' },
					{ name: 'cmd', label: 'CMD' }
				];

				for (const stat of statsToGet) {
					// Request stat value
					const ioctlResult = this.kernel.ioctl(fd, REQUEST.GET_DATA, {
						entityPath,
						stat: stat.name
					});

					if (ioctlResult === ErrorCode.SUCCESS) {
						// Read the result
						const [readResult, data] = this.kernel.read(fd);
						if (readResult === ErrorCode.SUCCESS && data) {
							result[stat.name] = {
								label: stat.label,
								modifiers: [],
								total: data.value || 0
							};
						}
					}
				}

				return ErrorCode.SUCCESS;
			});
		} catch (err) {
			this.logger.error('Error calculating combat stats', err, {
				operation: 'calculateCombatStats',
				path: entityPath
			});
		}

		return result;
	}

	/**
	 * Calculate skill values for the character
	 * @param entityPath Path to the entity
	 * @param characterData Raw character data
	 * @returns Skill data
	 */
	private async calculateSkills(
		entityPath: string,
		characterData: CompleteCharacter
	): Promise<any> {
		const result = {
			skills: {},
			skillsWithRanks: []
		};

		try {
			// Get skills from skill device
			await withFile(this.kernel, PATHS.SKILL_DEVICE, OpenMode.READ_WRITE, (fd) => {
				// Request all skills
				const ioctlResult = this.kernel.ioctl(fd, REQUEST.GET_ALL, {
					entityPath
				});

				if (ioctlResult !== ErrorCode.SUCCESS) {
					this.logger.warn('Failed to get skills', null, {
						operation: 'calculateSkills',
						errorCode: ioctlResult
					});
					return ioctlResult;
				}

				// Read the result
				const [readResult, allSkills] = this.kernel.read(fd);
				if (readResult !== ErrorCode.SUCCESS) {
					this.logger.warn('Failed to read skills result', null, {
						operation: 'calculateSkills.read',
						errorCode: readResult
					});
					return readResult;
				}

				// Convert to UI format
				if (allSkills) {
					for (const [skillId, skill] of Object.entries(allSkills)) {
						result.skills[skillId] = {
							label: skill.skillName,
							modifiers:
								skill.otherBonuses?.components?.map((c) => ({
									source: c.source,
									value: c.value
								})) || [],
							total: skill.total || 0,
							overrides: {
								trained_only: skill.isTrainedOnly
							}
						};
					}
				}

				// Generate skills with ranks data
				if (characterData.game_character_skill_rank) {
					// Group ranks by skill
					const ranksBySkill: Record<number, { level: number; rank: number }[]> = {};
					const skillNames: Record<number, string> = {};

					for (const rankData of characterData.game_character_skill_rank) {
						if (!ranksBySkill[rankData.skill_id]) {
							ranksBySkill[rankData.skill_id] = [];
							// Store the skill name if available
							if (rankData.skill) {
								skillNames[rankData.skill_id] = rankData.skill.name;
							}
						}

						ranksBySkill[rankData.skill_id].push({
							level: rankData.applied_at_level,
							rank: 1 // Each entry represents 1 rank
						});
					}

					// Request class skill checks
					for (const [skillId, ranks] of Object.entries(ranksBySkill)) {
						const skillIdNum = Number(skillId);

						// Check if class skill
						const classSkillResult = this.kernel.ioctl(fd, REQUEST.GET_DATA, {
							entityPath,
							operation: 'isClassSkill',
							skillId: skillIdNum
						});

						let isClassSkill = false;
						if (classSkillResult === ErrorCode.SUCCESS) {
							// Read the result
							const [readClassSkillResult, classSkillData] = this.kernel.read(fd);
							if (readClassSkillResult === ErrorCode.SUCCESS && classSkillData) {
								isClassSkill = classSkillData.isClassSkill || false;
							}
						}

						// Add to result
						result.skillsWithRanks.push({
							skillId: skillIdNum,
							name: skillNames[skillIdNum] || `Skill ${skillId}`,
							isClassSkill,
							skillRanks: ranks
						});
					}
				}

				return ErrorCode.SUCCESS;
			});
		} catch (err) {
			this.logger.error('Error calculating skills', err, {
				operation: 'calculateSkills',
				path: entityPath
			});
		}

		return result;
	}

	/**
	 * Calculate spellcasting data for the character
	 * @param entityPath Path to the entity
	 * @returns Spellcasting data
	 */
	private async calculateSpellcasting(entityPath: string): Promise<any> {
		const result = {
			spellcastingClasses: [],
			preparedSpells: {},
			spellSlots: {}
		};

		// Check if spellcasting device exists
		if (!this.kernel.exists(PATHS.SPELLCASTING_DEVICE)) {
			return result;
		}

		try {
			// Get spellcasting data
			await withFile(this.kernel, PATHS.SPELLCASTING_DEVICE, OpenMode.READ_WRITE, (fd) => {
				// Get spellcasting classes
				const classesResult = this.kernel.ioctl(fd, REQUEST.GET_DATA, {
					entityPath,
					operation: 'getSpellcastingClasses'
				});

				if (classesResult === ErrorCode.SUCCESS) {
					// Read the result
					const [readResult, classesData] = this.kernel.read(fd);
					if (readResult === ErrorCode.SUCCESS && classesData) {
						result.spellcastingClasses = classesData.spellcastingClasses || [];
					}
				}

				// Get prepared spells
				const preparedResult = this.kernel.ioctl(fd, REQUEST.GET_DATA, {
					entityPath,
					operation: 'getAllPreparedSpells'
				});

				if (preparedResult === ErrorCode.SUCCESS) {
					// Read the result
					const [readResult, preparedData] = this.kernel.read(fd);
					if (readResult === ErrorCode.SUCCESS && preparedData) {
						result.preparedSpells = preparedData;
					}
				}

				// Get spell slots
				const slotsResult = this.kernel.ioctl(fd, REQUEST.GET_DATA, {
					entityPath,
					operation: 'getAllSpellSlots'
				});

				if (slotsResult === ErrorCode.SUCCESS) {
					// Read the result
					const [readResult, slotsData] = this.kernel.read(fd);
					if (readResult === ErrorCode.SUCCESS && slotsData) {
						result.spellSlots = slotsData;
					}
				}

				return ErrorCode.SUCCESS;
			});
		} catch (err) {
			this.logger.error('Error calculating spellcasting data', err, {
				operation: 'calculateSpellcasting',
				path: entityPath
			});
		}

		return result;
	}
}
