<script lang="ts">
    import { character } from '$lib/state/character.svelte';
    import type { DatabaseCharacterEquipment } from '$lib/types/character';

    interface TransformedEquipment extends DatabaseCharacterEquipment {
        displayName: string;
    }

    // Transform equipment for display
    let equipmentList = $derived(
        (character.character_equipment ?? []).map((equipment: DatabaseCharacterEquipment): TransformedEquipment => ({
            ...equipment,
            displayName: equipment.name
                .replace(/([A-Z])/g, ' $1')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        }))
    );

    // Group equipment by type
    let equipmentByType = $derived(
        equipmentList.reduce((acc: Record<string, TransformedEquipment[]>, equipment: TransformedEquipment) => {
            if (!acc[equipment.type]) {
                acc[equipment.type] = [];
            }
            acc[equipment.type].push(equipment);
            return acc;
        }, {})
    );

    // Format type name for display
    function formatEquipmentType(type: string): string {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
</script>

<div class="card">
    <h2 class="mb-4 font-bold">Equipment</h2>
    {#each Object.entries(equipmentByType) as [type, items]}
        <div class="mb-6 last:mb-0">
            <h3 class="mb-2 text-lg font-semibold text-primary">
                {formatEquipmentType(type)}
            </h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                {#each items as equipment (equipment.id)}
                    <div class="rounded bg-gray-50 p-3 hover:bg-gray-100">
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="font-medium">{equipment.displayName}</div>
                                {#if equipment.equipped}
                                    <div class="mt-1 text-sm text-primary">Equipped</div>
                                {/if}
                                {#if equipment.properties && Object.keys(equipment.properties).length > 0}
                                    <div class="mt-1 text-sm text-gray-600">
                                        {#each Object.entries(equipment.properties) as [key, value]}
                                            <div>
                                                <span class="font-medium">{key}:</span> {value}
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/each}

    {#if !character.character_equipment?.length}
        <div class="text-gray-500">No equipment</div>
    {/if}
</div> 