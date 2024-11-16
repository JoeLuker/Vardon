<script lang="ts">
    import type { DatabaseCharacterEquipment } from '$lib/types/character';

    interface TransformedEquipment extends DatabaseCharacterEquipment {
        displayName: string;
    }

    let { equipment = [] } = $props<{
        equipment: DatabaseCharacterEquipment[]
    }>();

    let equipmentList = $derived(
        equipment.map((item: DatabaseCharacterEquipment): TransformedEquipment => ({
            ...item,
            displayName: item.name
                .replace(/([A-Z])/g, ' $1')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        }))
    );

    type EquipmentByType = Record<string, TransformedEquipment[]>;

    let equipmentByType = $derived(
        equipmentList.reduce((acc: EquipmentByType, item: TransformedEquipment) => {
            if (!acc[item.type]) {
                acc[item.type] = [];
            }
            acc[item.type].push(item);
            return acc;
        }, {} as EquipmentByType)
    );
</script>

<div class="space-y-4">
    <h2 class="text-xl font-bold">Equipment</h2>

    {#each Object.entries(equipmentByType) as [type, items] (type)}
        {@const typedItems = items as TransformedEquipment[]}
        <div class="space-y-2">
            <h3 class="font-semibold capitalize">{type}</h3>
            <ul class="space-y-1">
                {#each typedItems as item (item.id)}
                    <li class="flex items-center gap-2">
                        <span>{item.displayName}</span>
                        {#if item.equipped}
                            <span class="text-sm text-primary">(equipped)</span>
                        {/if}
                    </li>
                {/each}
            </ul>
        </div>
    {/each}

    {#if !equipment.length}
        <div class="text-gray-500">No equipment</div>
    {/if}
</div> 