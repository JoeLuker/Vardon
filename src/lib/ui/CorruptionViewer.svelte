<script lang="ts">
    import { getCharacter } from '$lib/state/character.svelte';
    import type { DatabaseCharacterCorruption, DatabaseCharacterCorruptionManifestation } from '$lib/domain/types/character';

    let { characterId } = $props<{ characterId: number; }>();

    let character = $derived(getCharacter(characterId));

    interface CorruptionProperties {
        lastFeedDate?: string;
        requiresDailyFeeding?: boolean;
        hasSpiderClimb?: boolean;
        invitedDwellings?: string[];
    }

    // Get corruptions and manifestations
    let corruptions = $derived(character.character_corruptions ?? []);
    let manifestations = $derived(character.character_corruption_manifestations ?? []);

    // Helper function to get manifestations for a specific corruption
    function getManifestationsForCorruption(corruptionId: number): DatabaseCharacterCorruptionManifestation[] {
        return manifestations.filter(m => m.corruption_id === corruptionId);
    }

    // Helper function to format date
    function formatDate(dateString: string | null): string {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString();
    }

    // Helper to check if feeding is required today
    function needsFeedingToday(corruption: DatabaseCharacterCorruption & { properties?: CorruptionProperties }): boolean {
        if (!corruption.properties?.lastFeedDate || !corruption.properties.requiresDailyFeeding) return false;

        const lastFeed = new Date(corruption.properties.lastFeedDate);
        const today = new Date();
        return lastFeed.toDateString() !== today.toDateString();
    }

    // Helper to get corruption stage description
    function getStageDescription(stage: number | null): string {
        if (!stage) return 'No Stage';
        return `Stage ${stage}`;
    }
</script>

<div class="space-y-6">
    {#each corruptions as corruption}
        <div class="card p-4 bg-gray-50">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-primary">
                        {corruption.corruption_type}
                        {#if needsFeedingToday(corruption)}
                            <span class="text-sm text-red-600 ml-2">
                                (Feeding Required)
                            </span>
                        {/if}
                    </h3>
                    <div class="text-sm text-gray-600">
                        {getStageDescription(corruption.corruption_stage)}
                    </div>
                </div>
                
                <div class="text-right text-sm">
                    <div class="font-medium">
                        Blood Consumed: {corruption.blood_consumed ?? 0}/{corruption.blood_required ?? 0}
                    </div>
                    <div class="text-gray-600">
                        Last Fed: {formatDate(corruption.last_feed_date)}
                    </div>
                </div>
            </div>

            <div class="space-y-2">
                <h4 class="font-medium">Manifestations:</h4>
                <div class="grid gap-2">
                    {#each getManifestationsForCorruption(corruption.id) as manifestation}
                        <div class="bg-white p-3 rounded-lg shadow-sm">
                            <div class="flex items-center justify-between">
                                <span class="font-medium">{manifestation.manifestation_name}</span>
                                <div class="flex gap-2">
                                    {#if manifestation.gift_active}
                                        <span class="text-green-600 text-sm">Gift Active</span>
                                    {/if}
                                    {#if manifestation.stain_active}
                                        <span class="text-red-600 text-sm">Stain Active</span>
                                    {/if}
                                </div>
                            </div>
                            {#if manifestation.prerequisite_manifestation}
                                <div class="text-sm text-gray-600">
                                    Requires: {manifestation.prerequisite_manifestation}
                                </div>
                            {/if}
                            {#if manifestation.min_manifestation_level}
                                <div class="text-sm text-gray-600">
                                    Min Level: {manifestation.min_manifestation_level}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>

            {#if (corruption as DatabaseCharacterCorruption & { properties?: CorruptionProperties }).properties?.hasSpiderClimb}
                <div class="mt-2 text-sm text-gray-600">
                    Special: Has Spider Climb ability
                </div>
            {/if}
        </div>
    {/each}

    {#if corruptions.length === 0}
        <div class="text-center text-gray-600 py-4">
            No corruptions present
        </div>
    {/if}
</div>