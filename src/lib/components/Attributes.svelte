<!-- src/lib/components/Stats.svelte -->
<script lang="ts">
    import type { CharacterAttributes } from '$lib/types/character';
    import { getCharacter } from '$lib/state/character.svelte';
    import { calculateCharacterStats } from '$lib/utils/characterCalculations';

    let { characterId } = $props<{ characterId: number; }>();

    interface AttributeDefinition { 
        key: keyof CharacterAttributes; 
        label: string;
        description?: string;
    }

    // Define attributes configuration
    const attributeDefinitions = $state.raw<AttributeDefinition[]>([
        { key: 'str', label: 'Strength', description: 'Melee attacks, climbing, carrying capacity' },
        { key: 'dex', label: 'Dexterity', description: 'Ranged attacks, AC, reflex saves' },
        { key: 'con', label: 'Constitution', description: 'HP, fortitude saves' },
        { key: 'int', label: 'Intelligence', description: 'Skill points, extract DCs' },
        { key: 'wis', label: 'Wisdom', description: 'Will saves, perception' },
        { key: 'cha', label: 'Charisma', description: 'Social interactions' }
    ]);

    // Derive the character from state
    let character = $derived(getCharacter(characterId));

    // Derive stats by recalculating each time 'character' changes
    let stats = $derived.by(() => calculateCharacterStats(character));

    // Transform attributes for display with modifier sources
    let attributesList = $derived.by(() => {
        return attributeDefinitions.map(attr => {
            const base = stats.attributes.base[attr.key];
            const permanent = stats.attributes.permanent[attr.key];
            const temporary = stats.attributes.temporary[attr.key];

            return {
                ...attr,
                value: {
                    base,
                    permanent,
                    temporary,
                    modifier: {
                        permanent: stats.attributes.modifiers.permanent[attr.key],
                        temporary: stats.attributes.modifiers.temporary[attr.key]
                    },
                    sources: {
                        ancestry: stats.attributes.bonuses.ancestry.values[attr.key] ? {
                            label: stats.attributes.bonuses.ancestry.source,
                            value: stats.attributes.bonuses.ancestry.values[attr.key] ?? 0
                        } : null,
                        abp: (
                            (stats.attributes.bonuses.abp.mental?.attribute === attr.key && 
                             stats.attributes.bonuses.abp.mental) ||
                            (stats.attributes.bonuses.abp.physical?.attribute === attr.key && 
                             stats.attributes.bonuses.abp.physical)
                        ) ? {
                            label: (attr.key === stats.attributes.bonuses.abp.mental?.attribute 
                                ? 'Mental' 
                                : 'Physical') + ' Prowess (ABP)',
                            value: attr.key === stats.attributes.bonuses.abp.mental?.attribute ? 
                                stats.attributes.bonuses.abp.mental.value : 
                                stats.attributes.bonuses.abp.physical?.value ?? 0
                        } : null,
                        buffs: stats.attributes.bonuses.buffs
                            .filter(buff => buff.values[attr.key])
                            .map(buff => ({
                                source: buff.source,
                                value: buff.values[attr.key] ?? 0
                            }))
                    }
                }
            };
        });
    });

    function formatModifier(num: number): string {
        return num >= 0 ? `+${num}` : num.toString();
    }
</script>

<section class="card">
    <h2 class="mb-4 text-xl font-bold">Attributes</h2>

    <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
        {#each attributesList as { label, description, value }}
            <div class="group relative rounded bg-gray-50 p-4 hover:bg-gray-100">
                <div class="mb-2">
                    <span class="text-sm font-medium text-gray-700">{label}</span>
                    <!-- Main tooltip -->
                    <div class="invisible absolute -top-2 left-1/2 z-10 w-64 -translate-x-1/2 
                                transform rounded bg-gray-800 px-3 py-2 text-sm text-white 
                                opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                        <div class="mb-2">{description}</div>
                        
                        <!-- Modifier Sources -->
                        <div class="space-y-1 text-xs">
                            <div class="font-medium">Base Score: {value.base}</div>
                            
                            {#if value.sources.ancestry}
                                <div>
                                    {value.sources.ancestry.label}: 
                                    {formatModifier(value.sources.ancestry.value)}
                                </div>
                            {/if}
                            
                            {#if value.sources.abp}
                                <div>
                                    {value.sources.abp.label}: 
                                    {formatModifier(value.sources.abp.value)}
                                </div>
                            {/if}
                            
                            {#if value.sources.buffs.length > 0}
                                {#each value.sources.buffs as buff}
                                    <div>
                                        {buff.source}: {formatModifier(buff.value)}
                                    </div>
                                {/each}
                            {/if}
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="space-y-1">
                        <!-- Base Score -->
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-gray-500">Base:</span>
                            <span class="text-xl font-bold tabular-nums">{value.base}</span>
                        </div>

                        <!-- Permanent Modifiers -->
                        {#if value.sources.ancestry}
                            <div class="text-sm">
                                <span class="text-gray-500">{value.sources.ancestry.label}:</span>
                                <span class="font-medium">{formatModifier(value.sources.ancestry.value)}</span>
                            </div>
                        {/if}

                        {#if value.sources.abp}
                            <div class="text-sm">
                                <span class="text-gray-500">{value.sources.abp.label}:</span>
                                <span class="font-medium">{formatModifier(value.sources.abp.value)}</span>
                            </div>
                        {/if}

                        <!-- Permanent Total -->
                        <div class="flex items-center gap-2 border-t border-gray-200 pt-1">
                            <span class="text-sm text-gray-500">Permanent:</span>
                            <span class="text-xl font-bold tabular-nums text-primary">{value.permanent}</span>
                        </div>

                        <!-- Temporary Modifiers -->
                        {#if value.sources.buffs.length > 0}
                            <div class="border-t border-gray-200 pt-1">
                                {#each value.sources.buffs as buff}
                                    <div class="text-sm">
                                        <span class="text-gray-500">{buff.source}:</span>
                                        <span class="font-medium">{formatModifier(buff.value)}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        <!-- Final Total -->
                        {#if value.temporary !== value.permanent}
                            <div class="flex items-center gap-2 border-t border-gray-200 pt-1">
                                <span class="text-sm text-gray-500">Total:</span>
                                <span class="text-xl font-bold tabular-nums text-accent">{value.temporary}</span>
                            </div>
                        {/if}
                    </div>

                    <!-- Modifier Display -->
                    <div class="text-right">
                        <div class="text-2xl font-bold text-gray-600 tabular-nums">
                            {formatModifier(value.modifier.temporary)}
                        </div>
                        {#if value.modifier.temporary !== value.modifier.permanent}
                            <div class="text-sm text-gray-500">
                                ({formatModifier(value.modifier.permanent)} base)
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>
</section>
