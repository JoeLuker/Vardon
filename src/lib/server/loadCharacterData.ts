import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

type CharacterDataResponse = {
    character: Record<string, any>;  // Consider defining a more specific type
};

export async function loadCharacterData(
    characterId = 1
): Promise<CharacterDataResponse> {
    console.log('🔄 Server: Loading character data');

    const baseQueries = [
        // Basic character info
        supabase
            .from('characters')
            .select(`
                *,
                character_attributes!inner (*),
                character_combat_stats!inner (*),
                character_consumables!inner (*),
                character_buffs (*)
            `)
            .eq('id', characterId)
            .single(),

        // Related data
        supabase.from('base_skills').select('*, character_skill_ranks!left(*, character_id)'),
        supabase.from('character_class_features').select('*').eq('character_id', characterId),
        supabase.from('character_feats').select('*').eq('character_id', characterId),
        supabase.from('character_discoveries').select('*').eq('character_id', characterId),
        supabase.from('character_extracts').select('*').eq('character_id', characterId),
        supabase.from('character_known_spells').select('*').eq('character_id', characterId),
        supabase.from('character_spell_slots').select('*').eq('character_id', characterId),
        supabase.from('class_skill_relations').select('*'),
        supabase.from('character_favored_class_bonuses').select('*').eq('character_id', characterId),
        supabase.from('character_equipment').select('*').eq('character_id', characterId),
        supabase.from('character_corruptions').select('*').eq('character_id', characterId),
        supabase.from('character_corruption_manifestations').select('*').eq('character_id', characterId),
    ] as const;

    const results = await Promise.all(baseQueries);

    // Error handling
    const errors = results.filter(result => result.error).map(result => result.error);
    if (errors.length > 0) {
        console.error('❌ Server: Error loading character data:', errors);
        throw error(500, 'Failed to load character data');
    }

    const characterResult = results[0] as PostgrestSingleResponse<any>;
    if (!characterResult.data) {
        console.error('❌ Server: Character not found');
        throw error(404, 'Character not found');
    }

    // Simplified response object building
    const responseData = {
        ...characterResult.data,
        base_skills: results[1].data,
        character_class_features: results[2].data,
        character_feats: results[3].data,
        character_discoveries: results[4].data,
        character_extracts: results[5].data,
        character_known_spells: results[6].data,
        character_spell_slots: results[7].data,
        class_skill_relations: results[8].data,
        character_favored_class_bonuses: results[9].data,
        character_equipment: results[10].data,
        character_corruptions: results[11].data,
        character_corruption_manifestations: results[12].data,
    };

    console.log('✅ Server: Character data loaded successfully');
    return { character: responseData };
} 