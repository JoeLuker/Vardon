// src/routes/admin/+page.server.ts
import { supabase } from "$lib/supabaseClient";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    // Load all character data in parallel
    const [
        characterResult,
        skillsResult,
        featuresResult,
        featsResult,
        discoveriesResult,
        equipmentResult,
        extractsResult,
        spellsResult,
        spellSlotsResult,
        corruptionsResult,
        manifestationsResult,
        classSkillsResult
    ] = await Promise.all([
        // Basic character info with attributes, combat stats, consumables, and buffs
        supabase
            .from('characters')
            .select(`
                *,
                character_attributes!inner (*),
                character_combat_stats!inner (*),
                character_consumables!inner (*),
                character_buffs (*)
            `)
            .eq('id', 1)
            .single(),

        // Skills and ranks
        supabase
            .from('base_skills')
            .select(`
                *,
                character_skill_ranks!left (
                    *,
                    character_id
                )
            `),

        // Class features
        supabase
            .from('character_class_features')
            .select('*')
            .eq('character_id', 1),

        // Feats
        supabase
            .from('character_feats')
            .select('*')
            .eq('character_id', 1),

        // Discoveries
        supabase
            .from('character_discoveries')
            .select('*')
            .eq('character_id', 1),

        // Equipment
        supabase
            .from('character_equipment')
            .select('*')
            .eq('character_id', 1),

        // Extracts
        supabase
            .from('character_extracts')
            .select('*')
            .eq('character_id', 1),

        // Known spells
        supabase
            .from('character_known_spells')
            .select('*')
            .eq('character_id', 1),

        // Spell slots
        supabase
            .from('character_spell_slots')
            .select('*')
            .eq('character_id', 1),

        // Corruptions
        supabase
            .from('character_corruptions')
            .select('*')
            .eq('character_id', 1),

        // Corruption manifestations
        supabase
            .from('character_corruption_manifestations')
            .select('*')
            .eq('character_id', 1),

        // Class skill relations
        supabase
            .from('class_skill_relations')
            .select('*')
    ]);

    // Check for errors
    const results = [
        characterResult, skillsResult, featuresResult, featsResult,
        discoveriesResult, equipmentResult, extractsResult, spellsResult,
        spellSlotsResult, corruptionsResult, manifestationsResult, classSkillsResult
    ];

    const errors = results
        .filter(result => result.error)
        .map(result => result.error);

    if (errors.length > 0) {
        console.error('Failed to load character data:', errors);
        throw error(500, 'Failed to load character data');
    }

    if (!characterResult.data) {
        throw error(404, 'Character not found');
    }

    // Combine all data
    return {
        character: {
            ...characterResult.data,
            base_skills: skillsResult.data,
            character_class_features: featuresResult.data,
            character_feats: featsResult.data,
            character_discoveries: discoveriesResult.data,
            character_equipment: equipmentResult.data,
            character_extracts: extractsResult.data,
            character_known_spells: spellsResult.data,
            character_spell_slots: spellSlotsResult.data,
            character_corruptions: corruptionsResult.data,
            character_corruption_manifestations: manifestationsResult.data,
            class_skill_relations: classSkillsResult.data
        }
    };
};