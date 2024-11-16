import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { Character, CharacterBuff, SkillRankSource } from '$lib/types/character';

export async function loadCharacterData(characterId: number) {
    console.log('🔄 Server: Loading character data');
    
    try {
        // First, get the specific character
        const { data: characterData, error: characterError } = await supabase
            .from('characters')
            .select()
            .eq('id', characterId)
            .single();

        if (characterError) {
            console.log('❌ Server: Error loading character:', JSON.stringify(characterError, null, 2));
            throw error(500, 'Error loading character data');
        }

        if (!characterData) {
            console.log('❌ Server: No character found with ID:', characterId);
            throw error(404, 'Character not found');
        }

        // Then get all the related data
        const [
            { data: attributes },
            { data: buffs },
            { data: skillRanks },
            { data: baseSkills },
            { data: classSkillRelations },
            { data: classFeatures },
            { data: abpBonuses },
            { data: combatStats },
            { data: equipment },
            { data: feats },
            { data: discoveries },
            { data: favoredClassBonuses },
            { data: consumables },
            { data: spellSlots },
            { data: knownSpells },
            { data: extracts },
            { data: corruptionManifestations },
            { data: corruptions },
            { data: traits },
            { data: ancestries },
            { data: ancestralTraits }
        ] = await Promise.all([
            supabase
                .from('character_attributes')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_buffs')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_skill_ranks')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('base_skills')
                .select('*'),
            supabase
                .from('class_skill_relations')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_class_features')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_abp_bonuses')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_combat_stats')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_equipment')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_feats')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_discoveries')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_favored_class_bonuses')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_consumables')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_spell_slots')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_known_spells')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_extracts')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_corruption_manifestations')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_corruptions')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_traits')
                .select('*, base_traits(*)')
                .eq('character_id', characterId),
            supabase
                .from('character_ancestries')
                .select('*')
                .eq('character_id', characterId),
            supabase
                .from('character_ancestral_traits')
                .select('*')
                .eq('character_id', characterId)
        ]);

        const character: Character = {
            ...characterData,
            character_attributes: attributes || [],
            character_buffs: (buffs || []).map(buff => ({
                ...buff,
                buff_type: buff.buff_type as CharacterBuff['buff_type']
            })),
            character_skill_ranks: (skillRanks || []).map(rank => ({
                ...rank,
                source: rank.source as SkillRankSource
            })),
            base_skills: baseSkills || [],
            class_skill_relations: classSkillRelations || [],
            character_class_features: classFeatures || [],
            character_abp_bonuses: abpBonuses || [],
            character_combat_stats: combatStats || [],
            character_equipment: equipment || [],
            character_feats: feats || [],
            character_discoveries: discoveries || [],
            character_favored_class_bonuses: favoredClassBonuses || [],
            character_consumables: consumables || [],
            character_spell_slots: spellSlots || [],
            character_known_spells: knownSpells || [],
            character_extracts: extracts || [],
            character_corruption_manifestations: corruptionManifestations || [],
            character_corruptions: corruptions || [],
            character_traits: (traits || []).map(trait => ({
                ...trait,
                base_traits: trait.base_traits || undefined
            })),
            character_ancestries: ancestries || [],
            character_ancestral_traits: ancestralTraits || []
        };

        console.log('✅ Server: Character data loaded successfully');
        return { character };
    } catch (e) {
        console.log('❌ Server: Error loading character data:', e);
        throw error(500, 'Error loading character data');
    }
} 