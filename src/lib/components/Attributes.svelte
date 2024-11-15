<!-- src/lib/components/Stats.svelte -->
<script lang="ts">
    import { character } from '$lib/state/character.svelte';
    import { calculateCharacterStats } from '$lib/utils/characterCalculations';
    import { getABPBonuses } from '$lib/types/abp';
    import type { CharacterAttributes } from '$lib/types/character';
    
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

    // Calculate all stats
    let stats = $derived(calculateCharacterStats(
        character,
        getABPBonuses(character.level)
    ));

    // Transform attributes for display
    let attributesList = $derived(attributeDefinitions.map(attr => ({
        ...attr,
        value: {
            base: stats.attributes.base[attr.key],
            permanent: stats.attributes.permanent[attr.key],
            temporary: stats.attributes.temporary[attr.key],
            modifier: {
                permanent: stats.attributes.modifiers.permanent[attr.key],
                temporary: stats.attributes.modifiers.temporary[attr.key]
            }
        }
    })));

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
                    {#if description}
                        <div class="invisible absolute -top-2 left-1/2 z-10 w-48 -translate-x-1/2 
                                  transform rounded bg-gray-800 px-2 py-1 text-center text-xs 
                                  text-white opacity-0 transition-all group-hover:visible 
                                  group-hover:opacity-100">
                            {description}
                        </div>
                    {/if}
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="min-w-[3rem] text-2xl font-bold tabular-nums">
                            {value.base}
                        </span>
                        {#if value.permanent !== value.base || value.temporary !== value.permanent}
                            <div class="flex items-center text-sm">
                                {#if value.permanent !== value.base}
                                    <span class="text-primary">→ {value.permanent}</span>
                                {/if}
                                {#if value.temporary !== value.permanent}
                                    <span class="text-gray-500">→ {value.temporary}</span>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    <div class="text-right">
                        <span class="text-lg text-gray-600 tabular-nums">
                            {formatModifier(value.modifier.temporary)}
                        </span>
                        {#if value.modifier.temporary !== value.modifier.permanent}
                            <div class="text-xs text-gray-500">
                                ({formatModifier(value.modifier.permanent)} base)
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>
</section>