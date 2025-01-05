<script lang="ts">
    import { characterStore } from '$lib/state/characterStore';
    import * as Sheet from "$lib/components/ui/sheet";
    import { Badge } from "$lib/components/ui/badge";
    import { Eye, EyeOff } from 'lucide-svelte';
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import * as Tabs from "$lib/components/ui/tabs";
    
    interface Skill {
        id: number;
        name: string;
        ability: string;
        ranks: number;
        trained_only: boolean;
        armor_check_penalty?: boolean;
    }

    // Format modifier to always show + or -
    function formatModifier(mod: number): string {
        return mod >= 0 ? `+${mod}` : `${mod}`;
    }

    let classSkills = $derived($characterStore?.classes[0]?.class_skills ?? []);

    let skillsByAbility = $derived($characterStore?.baseSkills?.reduce((acc, skill) => {
        const ability = skill.ability.toLowerCase();
        if (!acc[ability]) {
            acc[ability] = [];
        }
        acc[ability].push({
            ...skill,
            ranks: $characterStore?.skillsWithRanks?.find(s => s.skillId === skill.id)?.totalRanks ?? 0,
            name: skill.name,
            trained_only: skill.trained_only ?? false, // Ensure trained_only is always boolean
            armor_check_penalty: skill.armor_check_penalty ?? false // Ensure armor_check_penalty is always boolean
        });
        return acc;
    }, {} as Record<string, Skill[]>) ?? {});

    // Add $state for reactive updates
    let selectedSkill = $state<Skill | null>(null);
    let sheetOpen = $state(false);

    // Add state for showing unusable skills
    let showUnusableSkills = $state(false);

    // Add view mode state
    let viewMode = $state('ability'); // 'ability' or 'alphabetical'

    // Add derived alphabetical skills list
    let alphabeticalSkills = $derived(
        Object.values(skillsByAbility)
            .flat()
            .sort((a, b) => a.name.localeCompare(b.name))
    );
</script>

<!-- Add container div -->
<div class="skills-container">
    <Tabs.Root value={viewMode} onValueChange={(value) => viewMode = value} class="w-full">
        <div class="tabs-header">
            <Tabs.List class="grid w-full grid-cols-[1fr_1fr_2px_auto] h-12">
                <Tabs.Trigger value="ability" class="h-full">By Ability</Tabs.Trigger>
                <Tabs.Trigger value="alphabetical" class="h-full">Alphabetical</Tabs.Trigger>
                <div class="pill-divider"></div>    
                <Button
                    variant="secondary"
                    size="icon"
                    class="toggle-unusable h-full"
                    onclick={() => showUnusableSkills = !showUnusableSkills}
                >
                    {#if showUnusableSkills}
                        <Eye size={20} />
                    {:else}
                        <EyeOff size={20} />
                    {/if}
                </Button>
            </Tabs.List>
        </div>


        <Tabs.Content value="ability">
            <div class="ability-cards">
                {#each Object.entries(skillsByAbility) as [ability, skills]}
                    <Card.Root>
                        <Card.Header>
                            <Card.Title>{ability.toUpperCase()}</Card.Title>
                        </Card.Header>
                        <Card.Content>
                            <div class="skills-grid">
                                {#each skills.filter(skill => showUnusableSkills || !(skill.trained_only && skill.ranks === 0)) as skill}
                                    {@const isClassSkill = classSkills.includes(skill.id)}
                                    {@const isUnusable = skill.trained_only && skill.ranks === 0}
                                    <button 
                                        class="skill"
                                        class:is-class-skill={isClassSkill}
                                        class:unusable={isUnusable}
                                        onclick={() => {
                                            selectedSkill = skill;
                                            sheetOpen = true;
                                        }}
                                        type="button"
                                    >
                                        <span class="skill-name">
                                            {skill.name || `Skill ${skill.id}`}
                                        </span>
                                        <span class="modifier">{formatModifier($characterStore?.skill_modifiers[skill.id] ?? 0)}</span>
                                    </button>
                                {/each}
                            </div>
                        </Card.Content>
                    </Card.Root>
                {/each}
            </div>
        </Tabs.Content>

        <Tabs.Content value="alphabetical">
            <Card.Root>
                <Card.Header>
                    <Card.Title>All Skills</Card.Title>
                    <Card.Description>All skills sorted alphabetically</Card.Description>
                </Card.Header>
                <Card.Content>
                    <div class="skills-grid">
                        {#each alphabeticalSkills.filter(skill => showUnusableSkills || !(skill.trained_only && skill.ranks === 0)) as skill}
                            {@const isClassSkill = classSkills.includes(skill.id)}
                            {@const isUnusable = skill.trained_only && skill.ranks === 0}
                            <button 
                                class="skill"
                                class:is-class-skill={isClassSkill}
                                class:unusable={isUnusable}
                                onclick={() => {
                                    selectedSkill = skill;
                                    sheetOpen = true;
                                }}
                                type="button"
                            >
                                <span class="skill-name">
                                    {skill.name || `Skill ${skill.id}`}
                                </span>
                                <span class="modifier">{formatModifier($characterStore?.skill_modifiers[skill.id] ?? 0)}</span>
                                <Badge variant="secondary" class="ability-badge">
                                    {skill.ability.toUpperCase()}
                                </Badge>
                            </button>
                        {/each}
                    </div>
                </Card.Content>
            </Card.Root>
        </Tabs.Content>
    </Tabs.Root>
</div>

<!-- Mobile Skill Sheet -->
<Sheet.Root bind:open={sheetOpen}>
    <Sheet.Content side="bottom">
        {#if selectedSkill}
            <Sheet.Header>
                <Sheet.Title>{selectedSkill.name}</Sheet.Title>
            </Sheet.Header>
            <div class="sheet-content">
                <p>Ability: {selectedSkill.ability}</p>
                <p>Total Modifier: {formatModifier($characterStore?.skill_modifiers[selectedSkill.id] ?? 0)}</p>
                <p>Ranks: {selectedSkill.ranks}</p>
                {#if classSkills.includes(selectedSkill.id) && selectedSkill.ranks > 0}
                    <p>Class Skill: +3</p>
                {/if}
                {#if selectedSkill.trained_only}
                    <p class="trained-only-note">This skill requires training to use.</p>
                {/if}
            </div>
        {/if}
    </Sheet.Content>
</Sheet.Root>

<style lang="postcss">
    .skills-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem;
    }

    .header {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        margin-bottom: 1rem;
    }

    .header-content {
        min-width: 150px; /* Match the new min-width of skill items */
        display: flex;
        justify-content: flex-end;
    }

    .ability-cards {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
    }

    .ability-group {
        padding: 1.5rem;
        background: hsl(var(--card));
        border: 1px solid hsl(var(--border));
        border-radius: var(--radius-lg);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .ability-group:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    }

    .ability-title {
        font-size: 1.125rem;
        font-weight: 700;
        margin: 0.5rem 0;
        color: hsl(var(--foreground));
        text-transform: uppercase;
        letter-spacing: 0.1em;
        border-bottom: 2px solid hsl(var(--border));
        padding-bottom: 0.75rem;
        text-align: center;
    }

    .skills-grid {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .sheet-content {
        padding: 1rem;
        line-height: 1.6;
    }

    .trained-only-note {
        margin-top: 1rem;
        font-style: italic;
        color: hsl(var(--text-2));
    }

    .skill-indicator {
        width: 12px;
        height: 12px;
        border: 2px solid hsl(var(--border));
        border-radius: 50%;
        margin-right: 0.75rem;
        flex-shrink: 0;
    }

    .skill-indicator.has-ranks {
        background-color: hsl(var(--border));
    }

    .skill {
        width: 100%;
        padding: 0.75rem 1rem;
        min-height: 48px;
        text-align: left;
        background: hsl(var(--background));
        border: 1px solid hsl(var(--border) / 0.2);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: var(--radius);
        position: relative;
        flex: 1;
        transition: all 0.2s ease;
    }

    .skill:hover {
        background-color: hsl(var(--accent));
        border-color: hsl(var(--border));
        transform: translateX(2px);
    }

    .skill.is-class-skill {
        background-color: hsl(var(--primary) / 0.1);
        border-color: hsl(var(--primary) / 0.2);
    }
    

    .skill.unusable {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: hsl(var(--muted));
    }

    .skill.unusable:hover {
        background-color: hsl(var(--muted));
        transform: none;
    }

    .skill-name {
        margin-right: 0.5rem;
        flex: 1;
    }

    .modifier {
        font-size: 1.25rem;
        font-weight: 600;
        color: hsl(var(--primary));
        min-width: 3rem;
        text-align: right;
    }

    .toggle-unusable {
        display: flex;
        margin-left: auto;
        padding: 0.5rem;
        background: none;
        border: none;
        cursor: pointer;
        color: hsl(var(--foreground));
        border-radius: var(--radius);
    }

    .toggle-unusable:hover {
        background-color: hsl(var(--accent));
    }

    .ability-badge {
        margin-left: auto;
        margin-right: 0.5rem;
        text-transform: uppercase;
        font-size: 0.75rem;
    }

    .tabs-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0 0.5rem;
    }

    .divider {
        height: 1px;
        background-color: hsl(var(--border));
        margin: 0.5rem 0;
        width: 100%;
    }

    .toggle-unusable {
        flex-shrink: 0;
    }

    .pill-divider {
        width: 2px;
        height: 24px; /* Adjust this value to control the height of the pill */
        background-color: hsl(var(--border));
        border-radius: 9999px;
        margin: auto 0;
    }
</style>