import type { SupabaseClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '$lib/domain/types/supabase';

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

// Add the extended corruption_manifestation interface
interface ExtendedCorruptionManifestation extends Row<'corruption_manifestation'> {
    prerequisite?: Row<'corruption_manifestation'>;
    prerequisites?: { 
        prerequisite_manifestation_id: number; 
        prerequisite?: Row<'corruption_manifestation'>;
    }[];
}

export interface CompleteCharacter extends Row<'game_character'> {
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
    game_character_corruption_manifestation?: (Row<'game_character_corruption_manifestation'> & {
        manifestation: ExtendedCorruptionManifestation;
    })[];
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
    
    // Removing runtime-computed properties to keep this interface as a pure database representation
}

interface AbpNodeWithBonuses extends Row<'abp_node'> {
    bonuses: (Row<'abp_node_bonus'> & {
        bonus_type: Row<'abp_bonus_type'>;
    })[];
}

// Add these type definitions
// interface GameCharacterAbilityData {
//     ability_id: number;
//     ability: Row<'ability'>;
//     base: number;
//     adjustments: Array<{amount: number, source: string, type?: string}> | null;
// }

// interface GameCharacterArmorData {
//     // ... existing code ...
// }

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

// Add interfaces for the spellcasting feature and type
interface SpellcastingFeature extends Row<'spellcasting_class_feature'> {
    name?: string;
    label?: string;
    spellcasting_type?: SpellcastingType;
    spell_progression_type?: any;
    ability?: any;
}

interface SpellcastingType extends Row<'spellcasting_type'> {
    name: string;
    spellcasting_type?: string;
}

interface ClassFeatureExt extends Row<'class_feature'> {
    is_archetype?: boolean;
    replaced_feature_ids?: number[];
    alterations?: any[];
    class_feature_benefit?: any[];
    spellcasting_class_feature?: SpellcastingFeature[];
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
                game_character_corruption_manifestation(
                    *, 
                    manifestation:corruption_manifestation(*)
                ),
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

        // After getting the data, fetch the prerequisites separately
        if (data.game_character_corruption_manifestation?.length > 0) {
            const manifestationIds = data.game_character_corruption_manifestation
                .map(entry => entry.manifestation?.id)
                .filter(Boolean);
                
            if (manifestationIds.length > 0) {
                // Get all manifestations to have the full set
                const { data: allManifestations, error: manifestationsError } = await this.supabase
                    .from('corruption_manifestation')
                    .select('*')
                    .in('id', manifestationIds);
                    
                if (!manifestationsError && allManifestations) {
                    // Create a map for quick lookup
                    const manifestationMap = allManifestations.reduce((map, m) => {
                        map[m.id] = m;
                        return map;
                    }, {} as Record<number, ExtendedCorruptionManifestation>);
                    
                    // Get prerequisites relationships from the relationship table
                    const { data: prerequisites, error: prerequisitesError } = await this.supabase
                        .from('corruption_manifestation_prerequisite')
                        .select('*')
                        .in('corruption_manifestation_id', manifestationIds);
                        
                    if (!prerequisitesError && prerequisites) {
                        // Connect prerequisites for each manifestation
                        data.game_character_corruption_manifestation.forEach((entry: any) => {
                            const manifestationExt = entry.manifestation as ExtendedCorruptionManifestation;
                            
                            // Collect all prerequisites for this manifestation
                            const manifestationPrereqs = prerequisites.filter(
                                p => p.corruption_manifestation_id === manifestationExt.id
                            );
                            
                            if (manifestationPrereqs.length > 0) {
                                // Store all prerequisites
                                manifestationExt.prerequisites = manifestationPrereqs.map(prereq => {
                                    const prerequisiteId = prereq.prerequisite_manifestation_id;
                                    return {
                                        prerequisite_manifestation_id: prerequisiteId,
                                        prerequisite: manifestationMap[prerequisiteId]
                                    };
                                }).filter(p => p.prerequisite); // Only keep valid prerequisites
                                
                                // For backward compatibility, store the first prerequisite in the single field
                                if (manifestationExt.prerequisites.length > 0) {
                                    manifestationExt.prerequisite = manifestationExt.prerequisites[0].prerequisite;
                                }
                            }
                        });
                    }
                }
            }
        }

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
                *,
                class(
                    *,
                    class_feature(
                        *,
                        spellcasting_class_feature(
                            *,
                            spellcasting_type(*),
                            spell_progression_type(*),
                            ability(*)
                        )
                    )
                )
            `)
            .eq('game_character_id', characterId)
            .eq('level', level)
            .single();

        if (charError) throw charError;
        if (!charData) throw new Error(`No class data found for character ${characterId} at level ${level}`);

        const { class: classInfo } = charData;
        const { class_feature } = classInfo;

        if (!class_feature || class_feature.length === 0) {
            throw new Error(`No class features found for character ${characterId} at level ${level}`);
        }

        const processedFeatures: ProcessedClassFeature[] = [];

        for (const feature of class_feature as ClassFeatureExt[]) {
            const { spellcasting_class_feature } = feature;

            // If there are no spellcasting features, process the regular class feature
            if (!spellcasting_class_feature || spellcasting_class_feature.length === 0) {
                // Create a processed feature from the regular class feature
                const processedFeature: ProcessedClassFeature = {
                    id: feature.id,
                    name: feature.name || '',
                    label: feature.label || '',
                    description: feature.description || '',
                    type: 'Regular', // Set a default type for non-spellcasting features
                    level,
                    class_name: classInfo.name,
                    is_archetype: feature.is_archetype || false,
                    replaced_feature_ids: feature.replaced_feature_ids || [],
                    alterations: feature.alterations || [],
                    class_feature_benefit: feature.class_feature_benefit || []
                };
                
                processedFeatures.push(processedFeature);
                continue; // Skip the spellcasting-specific processing
            }

            // Process spellcasting features if present
            for (const spellcastingFeature of spellcasting_class_feature) {
                const { spellcasting_type, spell_progression_type, ability } = spellcastingFeature;

                if (!spellcasting_type || !spell_progression_type || !ability) {
                    throw new Error(`Incomplete spellcasting feature data for class feature ${feature.id} of character ${characterId} at level ${level}`);
                }

                // Use defined interfaces with optional chaining
                const { id } = spellcastingFeature;
                const name = spellcastingFeature.name || '';
                const label = spellcastingFeature.label || '';
                
                // Get the type name safely
                const typeName = spellcasting_type.name || 'Unknown';
                
                const processedFeature: ProcessedClassFeature = {
                    id,
                    name,
                    label,
                    description: feature.description || '', // Provide empty string as fallback for null
                    type: typeName,
                    level,
                    class_name: classInfo.name,
                    // Use optional chaining with defaults
                    is_archetype: feature.is_archetype || false,
                    replaced_feature_ids: feature.replaced_feature_ids || [],
                    alterations: feature.alterations || [],
                    class_feature_benefit: feature.class_feature_benefit || []
                };

                processedFeatures.push(processedFeature);
            }
        }

        return processedFeatures;
    }

    // Update the method to get all corruption manifestations with prerequisites
    async getAllCorruptionManifestations(): Promise<ExtendedCorruptionManifestation[]> {
        // First, get all manifestations
        const { data, error } = await this.supabase
            .from('corruption_manifestation')
            .select('*')
            .order('name');

        if (error) throw new Error(`Failed to fetch corruption manifestations: ${error.message}`);
        if (!data || data.length === 0) return [];
        
        // Create a map for quick lookups
        const manifestationMap = data.reduce((map, m) => {
            map[m.id] = m;
            return map;
        }, {} as Record<number, ExtendedCorruptionManifestation>);
        
        // Get all prerequisites from the relationship table
        const { data: prerequisites, error: prerequisitesError } = await this.supabase
            .from('corruption_manifestation_prerequisite')
            .select('*');
            
        if (prerequisitesError) {
            console.error('Failed to fetch prerequisites:', prerequisitesError);
        } else if (prerequisites && prerequisites.length > 0) {
            // Group prerequisites by manifestation ID
            const prereqsByManifestationId = prerequisites.reduce((acc, prereq) => {
                const id = prereq.corruption_manifestation_id;
                if (!acc[id]) acc[id] = [];
                acc[id].push(prereq);
                return acc;
            }, {} as Record<number, any[]>);
            
            // Connect prerequisites for each manifestation
            Object.keys(prereqsByManifestationId).forEach(manifestationIdStr => {
                const manifestationId = parseInt(manifestationIdStr);
                const manifestation = manifestationMap[manifestationId] as ExtendedCorruptionManifestation;
                
                if (manifestation) {
                    // Store all prerequisites
                    manifestation.prerequisites = prereqsByManifestationId[manifestationId].map(prereq => {
                        const prerequisiteId = prereq.prerequisite_manifestation_id;
                        return {
                            prerequisite_manifestation_id: prerequisiteId,
                            prerequisite: manifestationMap[prerequisiteId]
                        };
                    }).filter(p => p.prerequisite);
                    
                    // For backward compatibility, store the first prerequisite in the single field
                    if (manifestation.prerequisites.length > 0) {
                        manifestation.prerequisite = manifestation.prerequisites[0].prerequisite;
                    }
                }
            });
        }
        
        return data as ExtendedCorruptionManifestation[];
    }

    // Method to add a prerequisite relationship
    async addCorruptionManifestationPrerequisite(
        manifestationId: number,
        prerequisiteId: number
    ) {
        const { data, error } = await this.supabase
            .from('corruption_manifestation_prerequisite')
            .insert({
                corruption_manifestation_id: manifestationId,
                prerequisite_manifestation_id: prerequisiteId
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to add prerequisite relationship: ${error.message}`);
        return data;
    }

    // Method to remove a prerequisite relationship
    async removeCorruptionManifestationPrerequisite(
        manifestationId: number,
        prerequisiteId: number
    ) {
        const { error } = await this.supabase
            .from('corruption_manifestation_prerequisite')
            .delete()
            .match({ 
                corruption_manifestation_id: manifestationId,
                prerequisite_manifestation_id: prerequisiteId
            });

        if (error) throw new Error(`Failed to remove prerequisite relationship: ${error.message}`);
        return true;
    }

    // Method to get all prerequisites for a manifestation
    async getCorruptionManifestationPrerequisites(manifestationId: number) {
        const { data, error } = await this.supabase
            .from('corruption_manifestation_prerequisite')
            .select(`
                *,
                prerequisite:corruption_manifestation!prerequisite_manifestation_id(*)
            `)
            .eq('corruption_manifestation_id', manifestationId);

        if (error) throw new Error(`Failed to get prerequisite relationships: ${error.message}`);
        return data || [];
    }

    updateCharacterClassAttack(characterClassId: number, details: { attack_bonus: number }) {
        // This is a stub method - implementation will use characterClassId and details
        console.log(`Would update attack bonus for character class ${characterClassId} to ${details.attack_bonus}`);
        // Actual implementation would go here
    }

    async getCorruptionManifestationAnalytics(manifestationId: number) {
        // This is a stub method - implementation will use manifestationId
        console.log(`Would get analytics for manifestation ${manifestationId}`);
        // Actual implementation would go here
        return { manifestationId, usage: 0 }; // Return a dummy value
    }
}