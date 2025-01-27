<!-- src/lib/ui/SkillRankGrid.svelte -->
<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Alert, AlertDescription } from '$lib/components/ui/alert';
    import { Badge } from '$lib/components/ui/badge';
    import type { EnrichedCharacter } from '$lib/domain/characterCalculations';
    import _ from 'lodash';
    import { fade } from 'svelte/transition';

    interface BaseSkill {
        id: number;
        name: string;
        label: string;
        ability_id: number;
        trained_only: boolean;
        armor_check_penalty?: boolean;
    }

    interface SkillWithRanks {
        skillId: number;
        name: string;
        label: string;
        ability_label: string;
        totalRanks: number;
        ranksByLevel: Record<number, boolean>;
    }

    interface UpdateOperation {
        skillId: number;
        level: number;
        type: 'add' | 'remove';
        previousState?: Record<number, boolean>;
    }

    let { 
        character,
        onUpdateDB = async (_changes: any) => {},
    } = $props<{
        character?: EnrichedCharacter | null;
        onUpdateDB?: (changes: any) => Promise<void>;
    }>();

    let operationInProgress = $state<UpdateOperation | null>(null);
    let error = $state<string | null>(null);

    let skills = $derived(() => {
        const baseSkills = character?.baseSkills || [];
        if (!baseSkills.length) return [];
        return _.memoize(() => _.sortBy(baseSkills, 'label'))() as BaseSkill[];
    });

    let levelNumbers = $derived(() => {
        const length = character?.totalLevel ?? 0;
        return Array.from({ length }, (_, i) => i + 1);
    });

    // Helper to check if a skill is a class skill
    function isClassSkill(skillId: number): boolean {
        return character?.classes[0]?.class_skills?.includes(skillId) || false;
    }

    // Handle clicking a skill rank cell
    async function handleCellClick(skillId: number, level: number) {
        if (operationInProgress) return;
        if (!character) return;
        
        const skillData = character.skillsWithRanks?.find((s: SkillWithRanks) => s.skillId === skillId);
        const hasRank = skillData?.ranksByLevel[level] ?? false;
        
        // Validate the operation
        if (!hasRank) {
            const remaining = character.skillPoints?.remaining[level] ?? 0;
            if (remaining <= 0) {
                error = "No skill points remaining for this level";
                setTimeout(() => error = null, 3000); // Auto-clear error after 3s
                return;
            }
        }

        // Create operation
        const operation: UpdateOperation = {
            skillId,
            level,
            type: hasRank ? 'remove' : 'add',
            previousState: skillData ? {...skillData.ranksByLevel} : {}
        };

        try {
            // Apply optimistic update
            operationInProgress = operation;
            applySkillUpdate(operation);

            // Attempt server update
            await onUpdateDB(operation);

            // Success - clear operation
            operationInProgress = null;
            error = null;

        } catch (err) {
            // Rollback on failure
            if (skillData && operation.previousState) {
                skillData.ranksByLevel = operation.previousState;
                skillData.totalRanks = Object.keys(operation.previousState).length;
            }
            
            console.error('Failed skill update:', err);
            error = 'Failed to update skill rank. Please try again.';
            setTimeout(() => error = null, 3000);
            
        } finally {
            operationInProgress = null;
        }
    }

    function applySkillUpdate(operation: UpdateOperation) {
        if (!character) return;

        // Find the skill in the character's skillsWithRanks array
        const skillData = character.skillsWithRanks?.find((s: SkillWithRanks) => s.skillId === operation.skillId);
        if (!skillData) return;

        // Update the skill ranks optimistically
        if (operation.type === 'add') {
            skillData.totalRanks++;
            skillData.ranksByLevel[operation.level] = true;
            
            // Update remaining skill points
            if (character.skillPoints?.remaining) {
                character.skillPoints.remaining[operation.level]--;
            }
        } else {
            skillData.totalRanks--;
            delete skillData.ranksByLevel[operation.level];
            
            // Update remaining skill points
            if (character.skillPoints?.remaining) {
                character.skillPoints.remaining[operation.level]++;
            }
        }
    }
</script>

{#if error}
    <div transition:fade>
        <Alert variant="destructive" class="mb-4">
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    </div>
{/if}

<div class="overflow-x-auto">
    <table class="w-full border-collapse">
        <thead>
            <tr>
                <th class="sticky left-0 bg-background p-2 text-left">
                    <div class="font-medium">Skill</div>
                    <div class="text-xs text-muted-foreground">Points/Level</div>
                </th>
                {#each levelNumbers() as currentLevel (currentLevel)}
                    <th class="p-2 text-center">
                        <div class="text-sm font-medium">Level {currentLevel}</div>
                        <div class="text-xs text-muted-foreground">
                            {character?.skillPoints?.remaining[currentLevel] ?? 0} / {character?.skillPoints?.total[currentLevel] ?? 0}
                        </div>
                    </th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#each skills() as skill (skill.id)}
                <tr>
                    <td class="sticky left-0 bg-background p-2 font-medium">
                        <div>
                            {skill.label}
                            {#if isClassSkill(skill.id)}
                                <Badge variant="default" class="ml-1 text-xs text-secondary">Class Skill</Badge>
                            {/if}
                            {#if skill.trained_only}
                                <Badge variant="secondary" class="ml-1 text-xs text-muted-foreground">Trained Only</Badge>
                            {/if}
                        </div>
                    </td>
                    {#each levelNumbers() as level}
                        {@const skillData = character?.skillsWithRanks?.find((s: SkillWithRanks) => s.skillId === skill.id)}
                        {@const hasRank = skillData?.ranksByLevel[level] ?? false}
                        <td class="p-1 text-center">
                            <Button
                                variant={hasRank ? "default" : "outline"}
                                size="sm"
                                class="h-8 w-8"
                                disabled={!!operationInProgress}
                                onclick={() => handleCellClick(skill.id, level)}
                            >
                                {hasRank ? "1" : "0"}
                            </Button>
                        </td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
</div>