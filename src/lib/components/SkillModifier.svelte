<!-- src/lib/components/SkillModifier.svelte -->
<script lang="ts">
    import type { BaseSkill, CharacterAttributes } from '$lib/types/character';
    import { calculateSkillBonus } from '$lib/utils/characterCalculations';

    let { skill, ranks, isClassSkill, abilityModifiers, armorCheckPenalty = 0 } = $props<{
        skill: BaseSkill;
        ranks: number;
        isClassSkill: boolean;
        abilityModifiers: CharacterAttributes;
        armorCheckPenalty?: number;
    }>();

    let total = $derived(
        calculateSkillBonus(skill, ranks, isClassSkill, abilityModifiers, armorCheckPenalty)
    );

    function formatModifier(num: number): string {
        return num >= 0 ? `+${num}` : num.toString();
    }
</script>

<span class="font-mono">{formatModifier(total)}</span>