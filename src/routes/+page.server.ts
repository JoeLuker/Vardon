import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async () => {
    console.log('🔄 Server: Loading character data');

    // Load character and related data
    const { data: character, error: characterError } = await supabase
        .from('characters')
        .select(`
            *,
            character_attributes (
                id, str, dex, con, int, wis, cha
            ),
            character_combat_stats (
                id, bombs_left, base_attack_bonus
            ),
            character_consumables (
                id, alchemist_fire, acid, tanglefoot
            ),
            character_buffs (
                id, buff_type, is_active
            ),
            character_spell_slots (
                id, spell_level, total, remaining
            ),
            character_known_spells (
                id, spell_level, spell_name
            ),
            character_class_features (
                id, feature_name, feature_level, active, properties
            ),
            character_discoveries (
                id, discovery_name, selected_level, properties
            ),
            character_feats (
                id, feat_name, feat_type, selected_level, properties
            ),
            character_extracts (
                id, extract_name, extract_level, prepared, used
            ),
            character_skill_ranks (
                id, skill_id, ranks
            )
        `)
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

    // Load all skill-related data in parallel
    const [baseSkillsResult, skillRanksResult, classSkillsResult] = await Promise.all([
        supabase.from('base_skills').select('*'),
        supabase.from('character_skill_ranks')
            .select('*')
            .eq('character_id', character.id),
        supabase.from('class_skill_relations')
            .select('*')
            .eq('class_name', character.class)
    ]);

    if (baseSkillsResult.error || skillRanksResult.error || classSkillsResult.error) {
        console.error('❌ Server: Error loading skill data');
        throw error(500, 'Failed to load skill data');
    }

    console.log('✅ Server: Character and skill data loaded successfully');
    return { 
        character: {
            ...character,
            base_skills: baseSkillsResult.data,
            character_skill_ranks: skillRanksResult.data,
            class_skill_relations: classSkillsResult.data
        }
    };
};