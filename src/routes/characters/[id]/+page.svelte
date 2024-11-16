<!-- src/routes/+page.svelte -->
<script lang="ts">
    import CharacterHeader from '$lib/components/CharacterHeader.svelte';
    import HPTracker from '$lib/components/HPTracker.svelte';
    import Attributes from '$lib/components/Attributes.svelte';
    import Skills from '$lib/components/Skills.svelte';
    import CombatStats from '$lib/components/CombatStats.svelte';
    import Consumables from '$lib/components/Consumables.svelte';
    import BuffManager from '$lib/components/BuffManager.svelte';
    import SpellManager from '$lib/components/SpellManager.svelte';
    import ClassFeatures from '$lib/components/ClassFeatures.svelte';
    import Discoveries from '$lib/components/Discoveries.svelte';
    import Feats from '$lib/components/Feats.svelte';
    import ABPDisplay from '$lib/components/ABPDisplay.svelte';
    import Traits from '$lib/components/Traits.svelte';
    import { initializeCharacter } from '$lib/state/character.svelte';
    import AncestryDisplay from '$lib/components/AncestryDisplay.svelte';
    import Equipment from '$lib/components/Equipment.svelte';
    import CorruptionViewer from '$lib/components/CorruptionViewer.svelte';
    import type { 
        DatabaseCharacterAttribute,
        DatabaseBaseSkill,
        CharacterSkillRank,
        DatabaseClassSkillRelation,
        DatabaseCharacterCombatStats,
        CharacterBuff,
        DatabaseCharacterEquipment,
        DatabaseCharacterConsumables,
        DatabaseCharacterSpellSlot,
        DatabaseCharacterKnownSpell,
        DatabaseCharacterClassFeature,
        DatabaseCharacterDiscovery,
        DatabaseCharacterFavoredClassBonus,
        CharacterTraitWithBase,
        DatabaseCharacterAncestry,
        DatabaseCharacterAncestralTrait
    } from '$lib/types/character';

    interface LoadedCharacter {
        id: number;
        name: string;
        ancestry: string;
        class: string;
        level: number;
        current_hp: number;
        max_hp: number;
        created_at: string | null;
        updated_at: string | null;
        last_synced_at: string | null;
        is_offline: boolean | null;
        user_id: string | null;
        // Arrays from database
        base_skills: DatabaseBaseSkill[];
        character_skill_ranks: CharacterSkillRank[];
        class_skill_relations: DatabaseClassSkillRelation[];
        character_attributes: DatabaseCharacterAttribute[];
        character_buffs: CharacterBuff[];
        character_combat_stats: DatabaseCharacterCombatStats[];
        character_consumables: DatabaseCharacterConsumables[];
        character_spell_slots: DatabaseCharacterSpellSlot[];
        character_known_spells: DatabaseCharacterKnownSpell[];
        character_class_features: DatabaseCharacterClassFeature[];
        character_discoveries: DatabaseCharacterDiscovery[];
        character_equipment: DatabaseCharacterEquipment[];
        character_favored_class_bonuses: DatabaseCharacterFavoredClassBonus[];
        character_traits: CharacterTraitWithBase[];
        character_ancestries: DatabaseCharacterAncestry[];
        character_ancestral_traits: DatabaseCharacterAncestralTrait[];
    }

    interface LoadedPageData {
        character: LoadedCharacter;
    }

    let { data } = $props<{ data: LoadedPageData }>();
    let character = $derived<LoadedCharacter>(data.character);

    $effect(() => {
        try {
            initializeCharacter(character);
        } catch (error) {
            console.error('Failed to initialize character:', error);
        }
    });
</script>

<div class="mx-auto max-w-7xl p-2 sm:p-4">
    <div class="grid gap-3">
        <CharacterHeader {character} />
        <HPTracker 
            currentHp={character.current_hp} 
            maxHp={character.max_hp} 
        />
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div class="lg:col-span-1">
                <Attributes />
                <Equipment equipment={character.character_equipment} />
            </div>
            <div class="lg:col-span-2">
                <Skills />
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <CombatStats />
            <BuffManager />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div class="grid grid-cols-1 gap-3">
                <SpellManager />
                <Consumables />
            </div>
            <div class="grid grid-cols-1 gap-3">
                <ClassFeatures />
                <Discoveries />
                <Feats />
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <ABPDisplay />
            <AncestryDisplay />
            <Traits />
            <CorruptionViewer />
        </div>
    </div>
</div>