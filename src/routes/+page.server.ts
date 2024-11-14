import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async () => {
	console.log('🔄 Server: Loading character data');

	const { data: character, error: characterError } = await supabase
		.from('characters')
		.select(
			`
            *,
            character_attributes (
                str, dex, con, int, wis, cha
            ),
            character_combat_stats (
                bombs_left, base_attack_bonus
            ),
            character_consumables (
                alchemist_fire, acid, tanglefoot
            ),
            character_buffs (
                buff_type,
                is_active
            ),
            character_spell_slots (
                spell_level, total, remaining
            ),
            character_known_spells (
                spell_level, spell_name
            ),
            character_class_features (
                feature_name, feature_level, active, properties
            ),
            character_discoveries (
                discovery_name, selected_level, properties
            ),
            character_feats (
                feat_name, feat_type, selected_level, properties
            )
        `
		)
		.eq('id', 1)
		.single();

	if (characterError) {
		console.error('❌ Server: Error loading character:', characterError);
		throw error(500, 'Failed to load character data');
	}

	if (!character) {
		console.error('❌ Server: Character not found');
		throw error(404, 'Character not found');
	}

	console.log('✅ Server: Character loaded successfully');
	return { character };
};
