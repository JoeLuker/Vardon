import type { SupabaseClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '$lib/domain/types/supabase';
import type {
    AbpNode,
    AbpNodeBonus
} from './gameRules.types';

type Tables = Database['public']['Tables']
export type Row<T extends keyof Tables> = Tables[T]['Row']

// Extend the base types with their relationships
interface ClassWithFeatures extends Row<'class'> {
    class_feature?: (Row<'class_feature'> & {
        spellcasting_class_feature?: (Row<'spellcasting_class_feature'> & {
            spellcasting_type?: Row<'spellcasting_type'>;
            spell_progression_type?: Row<'spell_progression_type'>;
            ability?: Row<'ability'>;
        })[]; 
    })[];
}

interface CompleteCharacter extends Row<'game_character'> {
    game_character_ability?: (Row<'game_character_ability'> & {
        ability: Row<'ability'>;
    })[];
    game_character_class?: (Row<'game_character_class'> & {
        class: ClassWithFeatures;
    })[];
    game_character_abp_choice?: (Row<'game_character_abp_choice'> & {
        node: Row<'abp_node'> & {
            bonuses: (Row<'abp_node_bonus'> & {
                bonus_type: Row<'abp_bonus_type'>;
            })[];
        };
    })[];
    game_character_ancestry?: (Row<'game_character_ancestry'> & {
        ancestry: Row<'ancestry'> & {
            ancestry_trait: (Row<'ancestry_trait'> & {
                ancestry_trait_benefit: (Row<'ancestry_trait_benefit'> & {
                    ancestry_trait_benefit_bonus: (Row<'ancestry_trait_benefit_bonus'> & {
                        bonus_type: Row<'bonus_type'>;
                        target_specifier: Row<'target_specifier'>;
                    })[];
                })[];
            })[];
        };
    })[];
    game_character_ancestry_trait?: (Row<'game_character_ancestry_trait'> & {
        ancestry_trait: Row<'ancestry_trait'> & {
            ancestry_trait_benefit: (Row<'ancestry_trait_benefit'> & {
                ancestry_trait_benefit_bonus: (Row<'ancestry_trait_benefit_bonus'> & {
                    bonus_type: Row<'bonus_type'>;
                    target_specifier: Row<'target_specifier'>;
                })[];
            })[];
        };
    })[];
    game_character_armor?: (Row<'game_character_armor'> & {
        armor: Row<'armor'>;
    })[];
    game_character_equipment?: (Row<'game_character_equipment'> & {
        equipment: Row<'equipment'>;
    })[];
    game_character_feat?: (Row<'game_character_feat'> & {
        feat: Row<'feat'>;
    })[];
    game_character_trait?: (Row<'game_character_trait'> & {
        trait: Row<'trait'>;
    })[];
    game_character_class_feature?: (Row<'game_character_class_feature'> & {
        class_feature: Row<'class_feature'>;
    })[];
    game_character_corruption_manifestation?: GameCharacterCorruptionManifestationData[];
    game_character_corruption?: (Row<'game_character_corruption'> & {
        corruption: Row<'corruption'>;
    })[];
    game_character_skill_rank?: (Row<'game_character_skill_rank'> & {
        skill: Row<'skill'>;
    })[];
    game_character_favored_class_bonus?: (Row<'game_character_favored_class_bonus'> & {
        favored_class_choice: Row<'favored_class_choice'>;
    })[];
    game_character_archetype?: (Row<'game_character_archetype'> & {
        archetype: Row<'archetype'>;
    })[];
    spell_slots?: Record<number, Record<number, number>>;
}

interface AbpNodeWithBonuses extends Row<'abp_node'> {
    bonuses: (Row<'abp_node_bonus'> & {
        bonus_type: Row<'abp_bonus_type'>;
    })[];
}

// Add these type definitions
interface GameCharacterClassData {
    class_info: Row<'class'>;
}

interface GameCharacterCorruptionManifestationData extends Row<'game_character_corruption_manifestation'> {
    manifestation: Row<'corruption_manifestation'>;
    corruption_manifestation?: {
        id: number;
        name: string;
        description: string;
    };
}

interface GameCharacterFavoredClassBonusData extends Row<'game_character_favored_class_bonus'> {
    favored_class_choice?: {
        id: number;
        name: string;
        description: string;
    };
}

// Update the RealtimeCallback type
type RealtimeCallback<T extends keyof Tables> = (
    type: 'INSERT' | 'UPDATE' | 'DELETE',
    row: Row<T> | null
) => void | Promise<void>;

export interface ProcessedClassFeature {
    id: number;
    name: string;
    label: string;
    description: string;
    type: string;
    level: number;
    class_name: string;
    is_archetype: boolean;
    replaced_feature_ids: number[];
    alterations: {
        alteringFeature: {
            id: number;
            name: string;
            label: string;
        };
    }[];
    class_feature_benefit: {
        id: number;
        name: string;
        label: string | null;
        feature_level: number | null;
        class_feature_benefit_bonus: {
            id: number;
            value: number;
            bonus_type: {
                name: string;
            };
            target_specifier: {
                name: string;
            };
        }[];
    }[];
}

export class GameRulesAPI {
    // Add cache properties
    private abpCache: {
        nodes?: AbpNodeWithBonuses[];
        nodeGroups?: any[];
        nodeBonuses?: any[];
        bonusTypes?: any[];
    } = {};

    // Cache for abilities and skills
    private abilityCache: any[] | null = null;
    private skillCache: any[] | null = null;

    // Add cache for spell progression
    private spellProgressionCache: {
        types?: Row<'spell_progression_type'>[];
        progressions?: Row<'spell_progression'>[];
    } = {};

    constructor(private supabase: SupabaseClient<Database>) {}

    async getCompleteCharacterData(characterId: number): Promise<CompleteCharacter> {
        const { data, error } = await this.supabase
            .from('game_character')
            .select(`
                *,
                game_character_ability(*, ability(*)),
                game_character_class(
                    *,
                    class(
                        *,
                        class_feature(
                            *,
                            spellcasting_class_feature(
                                *,
                                spellcasting_type(*),
                                spell_progression_type(*, spell_progression(*)),
                                ability(*)
                            )
                        )
                    )
                ),
                game_character_abp_choice(
                    *,
                    node:abp_node(
                        *,
                        bonuses:abp_node_bonus(*, bonus_type:abp_bonus_type(*))
                    )
                ),
                game_character_ancestry(
                    *, 
                    ancestry(
                        *,
                        ancestry_trait(
                            *,
                            ancestry_trait_benefit(
                                *,
                                ancestry_trait_benefit_bonus(                                *,
                                bonus_type(*),
                                target_specifier(*))
                            ),
                            replacing_traits:ancestry_trait_replacement!replacing_trait_id(
                                replaced_trait:ancestry_trait!replaced_trait_id(*)
                            )
                        )
                    )
                ),
                game_character_ancestry_trait(
                    *,
                    ancestry_trait(
                        *,
                        ancestry_trait_benefit(
                            *,
                            ancestry_trait_benefit_bonus(                                *,
                                bonus_type(*),
                                target_specifier(*))
                        ),
                        replacing_traits:ancestry_trait_replacement!replacing_trait_id(
                            replaced_trait:ancestry_trait!replaced_trait_id(*)
                        )
                    )
                ),
                game_character_armor(*, armor(*)),
                game_character_equipment(*, equipment(*)),
                game_character_feat(*, feat(*)),
                game_character_trait(*, trait(*)),
                game_character_spell_slot(*),
                game_character_spell(
                    *,
                    spell(
                        *,
                        spell_school_mapping(*),
                        spell_component_mapping(spell_component(*)),
                        spell_casting_time_mapping(spell_casting_time(*)),
                        spell_range_mapping(spell_range(*)),
                        spell_duration_mapping(spell_duration(*)),
                        spell_target_mapping(spell_target(*))
                    )
                ),
                game_character_class_feature(
                    *, 
                    class_feature(
                        *, 
                        spellcasting_class_feature(
                            *,
                            spellcasting_type(*),
                            spell_progression_type(*),
                            ability(*)
                        ),
                        class_feature_benefit(
                            *, 
                            class_feature_benefit_bonus(
                                *,
                                bonus_type(*),
                                target_specifier(*)
                            )
                        )
                    )
                ),
                game_character_corruption_manifestation(*, manifestation:corruption_manifestation(*)),
                game_character_corruption(*, corruption(*)),
                game_character_skill_rank(*, skill(*, ability(*))),
                game_character_favored_class_bonus(*, favored_class_choice(*)),
                game_character_archetype(
                    *, 
                    archetype(
                        *, 
                        archetype_class_feature(
                            *, 
                            class_feature(
                                *, 
                                class_feature_benefit(
                                    *, 
                                    class_feature_benefit_bonus(
                                        *,
                                        bonus_type(*),
                                        target_specifier(*)
                                    )
                                )
                            ), 
                            archetype_class_feature_alteration(*), 
                            archetype_class_feature_replacement(*)
                        )
                    )
                )
            `)
            .eq('id', characterId)
            .single();

        if (error) throw new Error(`Failed to fetch character data: ${error.message}`);
        if (!data) throw new Error(`No character found with id ${characterId}`);

        return {
            ...data
        } as CompleteCharacter;
    }

    async getAbpNode(nodeId: number): Promise<AbpNodeWithBonuses> {
        const { data, error } = await this.supabase
            .from('abp_node')
            .select(`
                *,
                bonuses:abp_node_bonus(
                    *,
                    bonus_type:abp_bonus_type(*)
                )
            `)
            .eq('id', nodeId)
            .single();

        if (error) throw new Error(`Failed to fetch ABP node: ${error.message}`);
        if (!data) throw new Error(`No ABP node found with id ${nodeId}`);
        
        return data as AbpNodeWithBonuses;
    }

    async getAbpNodesForLevel(level: number): Promise<AbpNodeWithBonuses[]> {
        const { data, error } = await this.supabase
            .from('abp_node')
            .select(`
                *,
                abp_node_bonus (
                    *,
                    bonus_type:abp_bonus_type (
                        *
                    )
                ),
                group:abp_node_group!inner (
                    *
                )
            `)
            .lte('group.level', level);

        if (error) throw error;
        
        return (data || []).map(node => ({
            id: node.id,
            group_id: node.group_id,
            name: node.name,
            label: node.label,
            description: node.description,
            requires_choice: node.requires_choice,
            created_at: node.created_at,
            updated_at: node.updated_at,
            bonuses: (node.abp_node_bonus || []).map((bonus: any) => ({
                id: bonus.id,
                node_id: bonus.node_id,
                bonus_type_id: bonus.bonus_type_id,
                value: bonus.value,
                target_specifier: bonus.target_specifier,
                created_at: bonus.created_at,
                updated_at: bonus.updated_at,
                bonus_type: bonus.bonus_type
            }))
        }));
    }

    async getAllAbpNode(): Promise<AbpNodeWithBonuses[]> {
        const { data, error } = await this.supabase
            .from('abp_node')
            .select(`
                *,
                bonuses:abp_node_bonus(
                    *,
                    bonus_type:abp_bonus_type(*)
                )
            `);

        if (error) throw error;
        return data as AbpNodeWithBonuses[];
    }

    async getAllAbpNodeGroup() {
        if (!this.abpCache.nodeGroups) {
            const { data, error } = await this.supabase
                .from('abp_node_group')
                .select('*');

            if (error) throw error;
            this.abpCache.nodeGroups = data;
        }
        return this.abpCache.nodeGroups;
    }

    async getAllAbpNodeBonus() {
        if (!this.abpCache.nodeBonuses) {
            const { data, error } = await this.supabase
                .from('abp_node_bonus')
                .select('*');

            if (error) throw error;
            this.abpCache.nodeBonuses = data;
        }
        return this.abpCache.nodeBonuses;
    }

    async getAllAbpBonusType() {
        if (!this.abpCache.bonusTypes) {
            const { data, error } = await this.supabase
                .from('abp_bonus_type')
                .select('*');

            if (error) throw error;
            this.abpCache.bonusTypes = data;
        }
        return this.abpCache.bonusTypes;
    }

    async getAllSkill() {
        // Load into cache if not already loaded
        if (!this.skillCache) {
            const { data, error } = await this.supabase
                .from('skill')
                .select('*, ability(*)');

            if (error) throw error;
            this.skillCache = data;
        }
        return this.skillCache;
    }

    async getAllClassSkill() {
        const { data, error } = await this.supabase
            .from('class_skill')
            .select('*');

        if (error) throw error;
        return data;
    }

    async getAbpCacheData(effectiveLevel: number) {
        // Use cached data if available
        if (!this.abpCache.nodes || !this.abpCache.bonusTypes) {
            const [nodes, bonusTypes] = await Promise.all([
                this.getAbpNodesForLevel(effectiveLevel),
                this.getAllAbpBonusType()
            ]);
            
            this.abpCache.nodes = nodes;
            this.abpCache.bonusTypes = bonusTypes;
        }

        // Now we know bonusTypes is defined
        const bonusTypeMap = (this.abpCache.bonusTypes || []).reduce((acc, type) => {
            acc[type.id] = type.name;
            return acc;
        }, {} as Record<number, string>);

        return {
            nodes: this.abpCache.nodes || [],
            bonusTypes: bonusTypeMap
        };
    }

    // Fix method name to match usage
    async getAbpNodeById(nodeId: number): Promise<AbpNodeWithBonuses> {
        return this.getAbpNode(nodeId);
    }

    async getAllGameCharacter() {
        const { data, error } = await this.supabase
            .from('game_character')
            .select('*');

        if (error) throw error;
        return data;
    }

    async getAllClass() {
        const { data, error } = await this.supabase
            .from('class')
            .select('*');

        if (error) throw error;
        return data;
    }

    async getAllFeat() {
        const { data, error } = await this.supabase
            .from('feat')
            .select('*');

        if (error) throw error;
        return data;
    }

    async getMultipleCompleteCharacterData(characterIds: number[]): Promise<CompleteCharacter[]> {
        // Use Promise.all to run multiple queries in parallel
        return Promise.all(
            characterIds.map(id => this.getCompleteCharacterData(id))
        );
    }

    // Update the watch methods to use the correct callback type
    watchGameCharacter(callback: RealtimeCallback<'game_character'>) {
        return this.watchTable('game_character', callback);
    }

    watchGameCharacterSkillRank(callback: RealtimeCallback<'game_character_skill_rank'>) {
        return this.watchTable('game_character_skill_rank', callback);
    }

    // Add all the other watch methods
    watchGameCharacterAbility(callback: RealtimeCallback<'game_character_ability'>) {
        return this.watchTable('game_character_ability', callback);
    }

    watchGameCharacterClass(callback: RealtimeCallback<'game_character_class'>) {
        return this.watchTable('game_character_class', callback);
    }

    watchGameCharacterFeat(callback: RealtimeCallback<'game_character_feat'>) {
        return this.watchTable('game_character_feat', callback);
    }

    watchGameCharacterArchetype(callback: RealtimeCallback<'game_character_archetype'>) {
        return this.watchTable('game_character_archetype', callback);
    }

    watchGameCharacterAncestry(callback: RealtimeCallback<'game_character_ancestry'>) {
        return this.watchTable('game_character_ancestry', callback);
    }

    watchGameCharacterClassFeature(callback: RealtimeCallback<'game_character_class_feature'>) {
        return this.watchTable('game_character_class_feature', callback);
    }

    watchGameCharacterCorruption(callback: RealtimeCallback<'game_character_corruption'>) {
        return this.watchTable('game_character_corruption', callback);
    }

    watchGameCharacterCorruptionManifestation(callback: RealtimeCallback<'game_character_corruption_manifestation'>) {
        return this.watchTable('game_character_corruption_manifestation', callback);
    }

    watchGameCharacterWildTalent(callback: RealtimeCallback<'game_character_wild_talent'>) {
        return this.watchTable('game_character_wild_talent', callback);
    }

    watchGameCharacterEquipment(callback: RealtimeCallback<'game_character_equipment'>) {
        return this.watchTable('game_character_equipment', callback);
    }

    watchGameCharacterArmor(callback: RealtimeCallback<'game_character_armor'>) {
        return this.watchTable('game_character_armor', callback);
    }

    watchGameCharacterAbpChoice(callback: RealtimeCallback<'game_character_abp_choice'>) {
        return this.watchTable('game_character_abp_choice', callback);
    }

    // Helper method for watching tables
    private watchTable<T extends keyof Tables>(
        table: T, 
        callback: RealtimeCallback<T>
    ) {
        return this.supabase
            .channel(`${table}_changes`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table 
            }, (payload: RealtimePostgresChangesPayload<Row<T>>) => {
                const type = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
                const row = type === 'DELETE' ? payload.old as Row<T> : payload.new as Row<T>;
                callback(type, row);
            })
            .subscribe();
    }

    // Update the updateGameCharacter method signature
    async updateGameCharacter(id: number, data: Partial<Row<'game_character'>>) {
        const { data: result, error } = await this.supabase
            .from('game_character')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    }

    async deleteGameCharacterSkillRank(id: number) {
        const { error } = await this.supabase
            .from('game_character_skill_rank')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async createGameCharacterSkillRank(data: {
        game_character_id: number;
        skill_id: number;
        applied_at_level: number;
    }) {
        const { error } = await this.supabase
            .from('game_character_skill_rank')
            .insert({
                game_character_id: data.game_character_id,
                skill_id: data.skill_id,
                applied_at_level: data.applied_at_level
            });

        if (error) throw error;
    }

    // Track active subscriptions
    private activeSubscriptions: ReturnType<SupabaseClient['channel']>[] = [];

    stopAllWatchers() {
        this.activeSubscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
        this.activeSubscriptions = [];
    }

    // Add method to clear cache if needed
    clearAbpCache() {
        this.abpCache = {};
    }

    async getAllAbility() {
        // Load into cache if not already loaded
        if (!this.abilityCache) {
            const { data, error } = await this.supabase
                .from('ability')
                .select('*');

            if (error) throw error;
            this.abilityCache = data;
        }
        return this.abilityCache;
    }

    async getProcessedClassFeatures(characterId: number, level: number): Promise<ProcessedClassFeature[]> {
        // First get the character's class
        const { data: charData, error: charError } = await this.supabase
            .from('game_character_class')
            .select(`
                class_id,
                level,
                class!inner (
                    name
                )
            `)
            .eq('game_character_id', characterId)
            .single();

        if (charError) throw new Error(`Failed to fetch character class: ${charError.message}`);
        if (!charData) throw new Error(`No class found for character ${characterId}`);

        // Get the character's archetypes in a separate query
        const { data: archetypeData, error: archetypeError } = await this.supabase
            .from('game_character_archetype')
            .select('archetype_id')
            .eq('game_character_id', characterId);

        if (archetypeError) throw new Error(`Failed to fetch character archetypes: ${archetypeError.message}`);

        // Get the list of archetype IDs the character has
        const characterArchetypeIds = archetypeData.map(gca => gca.archetype_id);

        // Get all class features and archetype replacements
        const { data, error } = await this.supabase
            .from('class_feature')
            .select(`
                id,
                name,
                label,
                description,
                type,
                feature_level,
                class!inner (
                    name
                ),
                class_feature_benefit (
                    id,
                    name,
                    label,
                    feature_level,
                    class_feature_benefit_bonus (
                        id,
                        value,
                        bonus_type (
                            name
                        ),
                        target_specifier (
                            name
                        )
                    )
                ),
                archetype_class_features:archetype_class_feature!feature_id (
                    archetype (
                        id
                    ),
                    archetype_class_feature_replacements:archetype_class_feature_replacement (
                        replaced_class_feature_id
                    ),
                    archetype_class_feature_alterations:archetype_class_feature_alteration (
                        altering_feature:class_feature!inner (
                            id,
                            name,
                            label
                        )
                    )
                ),
                replaced_by:archetype_class_feature_replacement!replaced_class_feature_id (
                    archetype_class_feature:archetype_class_feature (
                        archetype (
                            id
                        )
                    )
                )
            `)
            .eq('class_id', charData.class_id)
            .lte('feature_level', level)
            .lte('class_feature_benefit.feature_level', level);

        if (error) throw new Error(`Failed to fetch class features: ${error.message}`);
        if (!data) return [];

        // Filter and process features
        return data
            .filter(feature => {
                // Check if this feature is replaced by any archetype the character has
                const isReplaced = feature.replaced_by?.some(replacement => 
                    characterArchetypeIds.includes(replacement.archetype_class_feature?.archetype?.id)
                );

                // Keep features that aren't replaced
                return !isReplaced;
            })
            .map(feature => {
                // Filter archetype features to only those the character has
                const relevantArchetypeFeature = feature.archetype_class_features
                    ?.find(acf => characterArchetypeIds.includes(acf.archetype?.id));

                return {
                    id: feature.id,
                    name: feature.name,
                    label: feature.label || feature.name,
                    description: feature.description || '',
                    type: feature.type || '',
                    level: feature.feature_level || 0,
                    class_name: feature.class?.name || 'Unknown Class',
                    is_archetype: !!relevantArchetypeFeature?.archetype,
                    replaced_feature_ids: relevantArchetypeFeature?.archetype_class_feature_replacements
                        ?.map(r => r.replaced_class_feature_id)
                        .filter((id): id is number => id !== null) ?? [],
                    alterations: relevantArchetypeFeature?.archetype_class_feature_alterations
                        ?.map(alt => ({
                            alteringFeature: {
                                id: alt.altering_feature.id,
                                name: alt.altering_feature.name,
                                label: alt.altering_feature.label || alt.altering_feature.name
                            }
                        })) ?? [],
                    // Add the class_feature_benefit data
                    class_feature_benefit: feature.class_feature_benefit?.map(benefit => ({
                        id: benefit.id,
                        name: benefit.name,
                        label: benefit.label || benefit.name,
                        feature_level: benefit.feature_level || 0,
                        class_feature_benefit_bonus: benefit.class_feature_benefit_bonus?.map(bonus => ({
                            id: bonus.id,
                            value: bonus.value,
                            bonus_type: {
                                name: bonus.bonus_type?.name || ''
                            },
                            target_specifier: {
                                name: bonus.target_specifier?.name || ''
                            }
                        })) || []
                    })) || []
                };
            });
    }

    // Get available spell slots for a character's spellcasting feature at a level
    async getSpellSlots(progressionTypeId: number, classLevel: number): Promise<Record<number, number>> {
        // Load progression data if not cached
        if (!this.spellProgressionCache.progressions) {
            const { data, error } = await this.supabase
                .from('spell_progression')
                .select('*')
                .order('class_level', { ascending: false });

            if (error) throw error;
            this.spellProgressionCache.progressions = data;
        }

        console.log("BLOOGAGOOGA", this.spellProgressionCache.progressions);

        // Filter to relevant entries and build slots map
        const slots: Record<number, number> = {};
        const entries = this.spellProgressionCache.progressions
            .filter(entry => 
                entry.progression_type_id === progressionTypeId && 
                entry.class_level <= classLevel
            );

        // Take the most recent entry for each spell level
        for (const entry of entries) {
            if (slots[entry.spell_level] === undefined) {
                slots[entry.spell_level] = entry.slots;
            }
        }

        return slots;
    }

    // // Get spellcasting info for a class feature
    // async getSpellcastingFeature(classFeatureId: number): Promise<SpellcastingFeature | null> {
    //     const { data, error } = await this.supabase
    //         .from('spellcasting_class_feature')
    //         .select('*')
    //         .eq('class_feature_id', classFeatureId)
    //         .single();

    //     if (error) return null;
    //     return data as SpellcastingFeature;
    // }

    // Get all spell progression types
    async getAllSpellProgressionType(): Promise<Row<'spell_progression_type'>[]> {
        if (!this.spellProgressionCache.types) {
            const { data, error } = await this.supabase
                .from('spell_progression_type')
                .select('*');

            if (error) throw error;
            this.spellProgressionCache.types = data;
        }
        return this.spellProgressionCache.types;
    }

    // Clear spell progression cache if needed
    clearSpellProgressionCache() {
        this.spellProgressionCache = {};
    }
}

export type { 
    CompleteCharacter, 
    AbpNodeWithBonuses,
    AbpNode,
    AbpNodeBonus,
    GameCharacterClassData,
    GameCharacterCorruptionManifestationData,
    GameCharacterFavoredClassBonusData
};