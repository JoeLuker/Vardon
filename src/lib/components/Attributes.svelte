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

<section class="p-4 card">
    <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-bold">Attributes</h2>
    </div>

    <div class="space-y-1">
        {#each attributesList as { label, description, value }}
            <!-- One line per attribute, compact styling -->
            <div 
                class="group relative flex items-center justify-between rounded px-2 py-1 text-sm bg-gray-50 hover:bg-gray-100"
            >
                <!-- Left side: attribute name -->
                <div class="flex items-center space-x-2">
                    <span class="font-medium">{label}</span>
                </div>

                <!-- Right side: show modifier and totals -->
                <div class="text-right">
                    <!-- Show permanent and temporary if different -->
                    {#if value.temporary !== value.permanent}
                        <!-- Show temporary total -->
                        <div class="font-bold text-accent tabular-nums">{value.temporary}</div>
                        <div class="text-xs text-gray-500">({value.permanent} base)</div>
                    {:else}
                        <div class="font-bold tabular-nums">{value.permanent}</div>
                    {/if}
                    <!-- Modifier -->
                    <div class="text-sm text-gray-700">{formatModifier(value.modifier.temporary)}</div>
                </div>

                <!-- Tooltip with details -->
                <div 
                    class="invisible absolute left-1/2 top-full z-10 mt-1 w-48 -translate-x-1/2 transform rounded bg-gray-800 px-3 py-2 text-xs text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100"
                >
                    <div class="mb-2 font-medium">{description}</div>
                    <div>Base: {value.base}</div>
                    {#if value.sources.ancestry}
                        <div>{value.sources.ancestry.label}: {formatModifier(value.sources.ancestry.value)}</div>
                    {/if}
                    {#if value.sources.abp}
                        <div>{value.sources.abp.label}: {formatModifier(value.sources.abp.value)}</div>
                    {/if}
                    {#if value.sources.buffs.length > 0}
                        {#each value.sources.buffs as buff}
                            <div>{buff.source}: {formatModifier(buff.value)}</div>
                        {/each}
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</section>
