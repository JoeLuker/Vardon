/**
 * Game API
 *
 * This provides a high-level API for interacting with the game system.
 */

import type { GameRulesAPI } from '$lib/db/gameRules.api';
import type { GameKernel } from '../kernel/GameKernel';
import type { PluginManager } from '../plugins/PluginManager';
import type { Entity } from '../kernel/types';

/**
 * Options for the Game API
 */
interface GameAPIOptions {
	debug?: boolean;
	[key: string]: any;
}

/**
 * Game API class
 * Provides high-level methods for interacting with the game system
 */
export class GameAPI {
	private kernel: GameKernel;
	private pluginManager: PluginManager;
	private dbAPI: GameRulesAPI;
	private options: GameAPIOptions;

	/**
	 * Create a new Game API
	 * @param kernel Game kernel
	 * @param pluginManager Plugin manager
	 * @param dbAPI Database API
	 * @param options Options
	 */
	constructor(
		kernel: GameKernel,
		pluginManager: PluginManager,
		dbAPI: GameRulesAPI,
		options: GameAPIOptions = {}
	) {
		this.kernel = kernel;
		this.pluginManager = pluginManager;
		this.dbAPI = dbAPI;
		this.options = {
			debug: false,
			...options
		};
	}

	/**
	 * Load a character from the database
	 * @param characterId Character ID
	 * @returns Character entity
	 */
	async loadCharacter(characterId: number): Promise<Entity | null> {
		try {
			// Log for debugging
			if (this.options.debug) {
				console.log(`[GameAPI] Loading character: ${characterId}`);
			}

			// Check if we already have the entity
			const entityId = `character-${characterId}`;
			let entity = this.kernel.getEntity(entityId);

			// If entity exists, return it
			if (entity) {
				if (this.options.debug) {
					console.log(`[GameAPI] Character ${characterId} already loaded, returning cached entity`);
				}
				return entity;
			}

			// Get character data from the database
			const rawCharacter = await this.dbAPI.getCompleteCharacterData(characterId);

			if (!rawCharacter) {
				throw new Error(`Character not found: ${characterId}`);
			}

			// Create entity from raw character data
			entity = {
				id: entityId,
				type: 'character',
				name: rawCharacter.name || `Character ${characterId}`,
				properties: {
					// Basic properties
					id: rawCharacter.id,
					name: rawCharacter.name,
					max_hp: rawCharacter.max_hp,
					current_hp: rawCharacter.current_hp,

					// Character-specific data
					rawData: rawCharacter,
					abilities: {}, // Will be populated by the ability capability
					skills: {}, // Will be populated by the skill capability

					// Class and ancestry
					classes:
						rawCharacter.game_character_class?.map((cls) => ({
							id: cls.class_id,
							name: cls.class?.name,
							level: cls.level
						})) || [],

					ancestry: rawCharacter.game_character_ancestry?.[0]?.ancestry?.name || 'Unknown',

					// Features, feats, etc.
					classFeatures: rawCharacter.game_character_class_feature || [],
					feats: rawCharacter.game_character_feat || [],
					spells: rawCharacter.game_character_spell || [],
					corruptions: rawCharacter.game_character_corruption || [],

					// Calculated later
					ac: 10,
					bab: 0
				},
				metadata: {
					createdAt: Date.now(),
					updatedAt: Date.now(),
					version: 1
				}
			};

			// Register entity with kernel
			this.kernel.registerEntity(entity);

			// Initialize character components
			await this.initializeCharacterComponents(entity);

			if (this.options.debug) {
				console.log(`[GameAPI] Character ${characterId} loaded successfully: ${entity.name}`);
			}

			return entity;
		} catch (error) {
			console.error(`[GameAPI] Error loading character ${characterId}:`, error);
			return null;
		}
	}

	/**
	 * Initialize character components
	 * @param entity Character entity
	 */
	private async initializeCharacterComponents(entity: Entity): Promise<void> {
		// Get required capabilities
		const abilityCapability = this.pluginManager.getCapability('ability');
		const skillCapability = this.pluginManager.getCapability('skill');
		const combatCapability = this.pluginManager.getCapability('combat');

		// Initialize ability scores
		if (abilityCapability) {
			// Initialize basic ability scores
			abilityCapability.initialize(entity);

			// Set ability scores from raw data
			const rawData = entity.properties.rawData;
			if (rawData) {
				if (rawData.strength)
					abilityCapability.setAbilityScore(entity, 'strength', rawData.strength);
				if (rawData.dexterity)
					abilityCapability.setAbilityScore(entity, 'dexterity', rawData.dexterity);
				if (rawData.constitution)
					abilityCapability.setAbilityScore(entity, 'constitution', rawData.constitution);
				if (rawData.intelligence)
					abilityCapability.setAbilityScore(entity, 'intelligence', rawData.intelligence);
				if (rawData.wisdom) abilityCapability.setAbilityScore(entity, 'wisdom', rawData.wisdom);
				if (rawData.charisma)
					abilityCapability.setAbilityScore(entity, 'charisma', rawData.charisma);
			}
		}

		// Initialize skills
		if (skillCapability) {
			// Initialize skills
			skillCapability.initialize(entity);

			// Set skill ranks from raw data
			const rawData = entity.properties.rawData;
			if (rawData && rawData.game_character_skill_rank) {
				for (const skillRank of rawData.game_character_skill_rank) {
					if (skillRank.skill_id && skillRank.rank) {
						skillCapability.setSkillRanks(entity, skillRank.skill_id, skillRank.rank);
					}
				}
			}
		}

		// Initialize combat stats
		if (combatCapability) {
			combatCapability.initialize(entity);
		}

		// Apply stored features to the character
		await this.applyStoredCharacterFeatures(entity);
	}

	/**
	 * Apply stored character features
	 * @param entity Character entity
	 */
	private async applyStoredCharacterFeatures(entity: Entity): Promise<void> {
		// TODO: Implement this to apply class features, feats, etc.

		// For now, just log that we'd apply features
		if (this.options.debug) {
			console.log(`[GameAPI] Would apply stored features to character: ${entity.name}`);

			const feats = entity.properties.feats?.length || 0;
			const classFeatures = entity.properties.classFeatures?.length || 0;

			console.log(`[GameAPI] Character has ${feats} feats and ${classFeatures} class features`);
		}
	}
}
