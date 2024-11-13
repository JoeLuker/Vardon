export interface CharacterAttributes {
	str: number;
	dex: number;
	con: number;
	int: number;
	wis: number;
	cha: number;
}

export interface CombatStats {
	bombs_left: number;
	base_attack_bonus: number;
}

export interface Consumables {
	alchemist_fire: number;
	acid: number;
	tanglefoot: number;
}

export type AttributeKey = keyof CharacterAttributes;
export type ConsumableKey = 'alchemist_fire' | 'acid' | 'tanglefoot';

export interface Character {
	id: number;
	name: string;
	class: string;
	race: string;
	level: number;
	current_hp: number;
	max_hp: number;
	is_offline: boolean | null;
	created_at: string | null;
	updated_at: string | null;
	last_synced_at: string | null;
	user_id: string | null;
	character_attributes: CharacterAttributes[];
	character_combat_stats: CombatStats[];
	character_consumables: Consumables[];
}

export interface CharacterWithRelations extends Character {
	character_buffs: Array<{
		buff_type: string;
		is_active: boolean | null;
	}>;
	character_spell_slots: Array<{
		spell_level: number;
		total: number;
		remaining: number;
	}>;
	character_known_spells: Array<{
		spell_level: number;
		spell_name: string;
	}>;
	character_skills: Array<{
		ability: string;
		class_skill: boolean | null;
		ranks: number;
		skill_name: string;
	}>;
}
