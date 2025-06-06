/**
 * Database Field Mappings
 *
 * This utility module centralizes database field mappings and property name conversions
 * to avoid inconsistencies in the codebase. This follows the Unix philosophy of
 * keeping things simple and well-defined.
 */

/**
 * Standard mapping between ability IDs and ability names
 * These match the values in the database and YAML files
 */
export const ABILITY_ID_MAPPING: Record<number, string> = {
	401: 'strength',
	402: 'dexterity',
	403: 'constitution',
	404: 'intelligence',
	405: 'wisdom',
	406: 'charisma'
};

/**
 * Reverse mapping (name to ID) for convenience
 */
export const ABILITY_NAME_TO_ID: Record<string, number> = Object.entries(ABILITY_ID_MAPPING).reduce(
	(acc, [id, name]) => {
		acc[name] = parseInt(id);
		return acc;
	},
	{} as Record<string, number>
);

/**
 * Field name mapping for character ability scores
 * Some parts of the code expect 'score', while the database uses 'value'
 */
export const ABILITY_SCORE_FIELD_NAMES = ['value', 'score'];

/**
 * Safely get a property from an object, checking multiple possible field names
 * @param obj The object to get a property from
 * @param fieldNames Array of possible field names to check
 * @param defaultValue Default value to return if no field is found
 * @returns The value of the first found field, or the default value
 */
export function getSafeProperty<T>(obj: any, fieldNames: string[], defaultValue: T): T {
	if (!obj) return defaultValue;

	for (const fieldName of fieldNames) {
		if (obj[fieldName] !== undefined) {
			return obj[fieldName];
		}
	}

	return defaultValue;
}

/**
 * Get an ability score from a game_character_ability entry
 * @param abilityEntry The game_character_ability entry
 * @param defaultValue Default value to return if no score is found
 * @returns The ability score
 */
export function getAbilityScore(abilityEntry: any, defaultValue: number = 10): number {
	return getSafeProperty<number>(abilityEntry, ABILITY_SCORE_FIELD_NAMES, defaultValue);
}

/**
 * Get the ability name from an ability ID
 * @param abilityId The ability ID
 * @returns The ability name, or undefined if not found
 */
export function getAbilityNameFromId(abilityId: number): string | undefined {
	return ABILITY_ID_MAPPING[abilityId];
}

/**
 * Get the ability ID from an ability name
 * @param abilityName The ability name (case insensitive)
 * @returns The ability ID, or undefined if not found
 */
export function getAbilityIdFromName(abilityName: string): number | undefined {
	const normalizedName = abilityName.toLowerCase();
	return ABILITY_NAME_TO_ID[normalizedName];
}

/**
 * Extract ability scores from game_character_ability array
 * @param abilityEntries Array of game_character_ability entries
 * @returns Record of ability scores keyed by ability name
 */
export function extractAbilityScores(abilityEntries: any[]): Record<string, number> {
	const abilities: Record<string, number> = {
		strength: 10,
		dexterity: 10,
		constitution: 10,
		intelligence: 10,
		wisdom: 10,
		charisma: 10
	};

	if (!abilityEntries || !Array.isArray(abilityEntries)) {
		return abilities;
	}

	for (const abilityEntry of abilityEntries) {
		const abilityId = abilityEntry.ability_id;
		const abilityName = getAbilityNameFromId(abilityId);

		if (abilityName) {
			const score = getAbilityScore(abilityEntry);
			abilities[abilityName] = score;
		}
	}

	return abilities;
}
