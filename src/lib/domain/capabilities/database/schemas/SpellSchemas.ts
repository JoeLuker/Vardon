/**
 * Spell-related Schema Descriptors
 *
 * This module provides schema descriptors for spell-related entities in the database.
 * It follows Unix principles by providing a clear contract for data structure.
 */

import type { SchemaDescriptor } from '../SchemaDescriptor';

/**
 * Spell schema descriptor
 */
export const SpellSchema: SchemaDescriptor = {
	tableName: 'spell',
	primaryKey: 'id',
	fields: [
		{
			dbField: 'id',
			property: 'id',
			required: true
		},
		{
			dbField: 'name',
			property: 'name',
			required: true
		},
		{
			dbField: 'label',
			property: 'label'
		},
		{
			dbField: 'description',
			property: 'description'
		},
		{
			dbField: 'level',
			property: 'level',
			defaultValue: 0
		},
		{
			dbField: 'school_id',
			property: 'schoolId'
		},
		{
			dbField: 'casting_time_id',
			property: 'castingTimeId'
		},
		{
			dbField: 'range_id',
			property: 'rangeId'
		},
		{
			dbField: 'duration_id',
			property: 'durationId'
		},
		{
			dbField: 'target_id',
			property: 'targetId'
		},
		{
			dbField: 'saving_throw',
			property: 'savingThrow'
		},
		{
			dbField: 'spell_resistance',
			property: 'spellResistance'
		}
	],
	relations: {
		school: {
			tableName: 'spell_school',
			foreignKey: 'school_id',
			referencedKey: 'id',
			isArray: false,
			schema: {
				tableName: 'spell_school',
				primaryKey: 'id',
				fields: [
					{
						dbField: 'id',
						property: 'id',
						required: true
					},
					{
						dbField: 'name',
						property: 'name',
						required: true
					},
					{
						dbField: 'label',
						property: 'label'
					}
				]
			}
		},
		castingTime: {
			tableName: 'spell_casting_time',
			foreignKey: 'casting_time_id',
			referencedKey: 'id',
			isArray: false,
			schema: {
				tableName: 'spell_casting_time',
				primaryKey: 'id',
				fields: [
					{
						dbField: 'id',
						property: 'id',
						required: true
					},
					{
						dbField: 'name',
						property: 'name',
						required: true
					},
					{
						dbField: 'label',
						property: 'label'
					}
				]
			}
		},
		range: {
			tableName: 'spell_range',
			foreignKey: 'range_id',
			referencedKey: 'id',
			isArray: false,
			schema: {
				tableName: 'spell_range',
				primaryKey: 'id',
				fields: [
					{
						dbField: 'id',
						property: 'id',
						required: true
					},
					{
						dbField: 'name',
						property: 'name',
						required: true
					},
					{
						dbField: 'label',
						property: 'label'
					}
				]
			}
		},
		duration: {
			tableName: 'spell_duration',
			foreignKey: 'duration_id',
			referencedKey: 'id',
			isArray: false,
			schema: {
				tableName: 'spell_duration',
				primaryKey: 'id',
				fields: [
					{
						dbField: 'id',
						property: 'id',
						required: true
					},
					{
						dbField: 'name',
						property: 'name',
						required: true
					},
					{
						dbField: 'label',
						property: 'label'
					}
				]
			}
		},
		target: {
			tableName: 'spell_target',
			foreignKey: 'target_id',
			referencedKey: 'id',
			isArray: false,
			schema: {
				tableName: 'spell_target',
				primaryKey: 'id',
				fields: [
					{
						dbField: 'id',
						property: 'id',
						required: true
					},
					{
						dbField: 'name',
						property: 'name',
						required: true
					},
					{
						dbField: 'label',
						property: 'label'
					}
				]
			}
		}
	}
};

/**
 * Character Spell schema descriptor
 */
export const CharacterSpellSchema: SchemaDescriptor = {
	tableName: 'game_character_spell',
	primaryKey: 'id',
	fields: [
		{
			dbField: 'id',
			property: 'id',
			required: true
		},
		{
			dbField: 'game_character_id',
			property: 'characterId',
			required: true
		},
		{
			dbField: 'spell_id',
			property: 'spellId',
			required: true
		},
		{
			dbField: 'spell_level',
			property: 'spellLevel',
			defaultValue: 0
		},
		{
			dbField: 'prepared',
			property: 'prepared',
			defaultValue: false
		},
		{
			dbField: 'active',
			property: 'active',
			defaultValue: false
		},
		{
			dbField: 'notes',
			property: 'notes'
		}
	],
	relations: {
		spell: {
			tableName: 'spell',
			foreignKey: 'spell_id',
			referencedKey: 'id',
			isArray: false,
			schema: SpellSchema
		}
	}
};

/**
 * Character Spell Slot schema descriptor
 */
export const CharacterSpellSlotSchema: SchemaDescriptor = {
	tableName: 'game_character_spell_slot',
	primaryKey: 'id',
	fields: [
		{
			dbField: 'id',
			property: 'id',
			required: true
		},
		{
			dbField: 'game_character_id',
			property: 'characterId',
			required: true
		},
		{
			dbField: 'spell_level',
			property: 'spellLevel',
			required: true
		},
		{
			dbField: 'total',
			property: 'total',
			defaultValue: 0
		},
		{
			dbField: 'used',
			property: 'used',
			defaultValue: 0
		},
		{
			dbField: 'bonus',
			property: 'bonus',
			defaultValue: 0
		}
	]
};

/**
 * Spell List schema descriptor
 */
export const SpellListSchema: SchemaDescriptor = {
	tableName: 'spell_list',
	primaryKey: 'id',
	fields: [
		{
			dbField: 'id',
			property: 'id',
			required: true
		},
		{
			dbField: 'name',
			property: 'name',
			required: true
		},
		{
			dbField: 'label',
			property: 'label'
		},
		{
			dbField: 'description',
			property: 'description'
		}
	]
};

/**
 * Spell List Spell Mapping schema descriptor
 */
export const SpellListSpellSchema: SchemaDescriptor = {
	tableName: 'spell_list_spell_mapping',
	primaryKey: 'id',
	fields: [
		{
			dbField: 'id',
			property: 'id',
			required: true
		},
		{
			dbField: 'spell_list_id',
			property: 'spellListId',
			required: true
		},
		{
			dbField: 'spell_id',
			property: 'spellId',
			required: true
		},
		{
			dbField: 'spell_level',
			property: 'spellLevel',
			required: true
		}
	],
	relations: {
		spell: {
			tableName: 'spell',
			foreignKey: 'spell_id',
			referencedKey: 'id',
			isArray: false,
			schema: SpellSchema
		},
		spellList: {
			tableName: 'spell_list',
			foreignKey: 'spell_list_id',
			referencedKey: 'id',
			isArray: false,
			schema: SpellListSchema
		}
	}
};
