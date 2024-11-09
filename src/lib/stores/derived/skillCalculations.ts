// /src/lib/stores/derived/skillCalculations.ts
import { derived } from 'svelte/store';
import type { SkillState, Skills, SkillName, AbilityForSkill } from '$lib/types';
import { SKILL_ABILITIES } from '$lib/stores/constants';
import { skills } from '../base/skills';
import { currentModifiers } from './attributeCalculations';

export const skillCalculations = {
  modifiers: derived(currentModifiers, ($modifiers) => {
    const skillMods: Partial<Record<SkillName, number>> = {};
    
    Object.entries(SKILL_ABILITIES).forEach(([skillName, ability]) => {
      const typedSkill = skillName as SkillName;
      const typedAbility = ability as AbilityForSkill;
      skillMods[typedSkill] = $modifiers[typedAbility] || 0;
    });

    return skillMods;
  }),

  totals: derived(
    [skills, currentModifiers],
    ([$skills, $modifiers]): Record<string, number> => {
      const totals: Record<string, number> = {};
      
      Object.entries($skills.skills || {}).forEach(([skillName, skill]) => {
        const ability = SKILL_ABILITIES[skillName as SkillName];
        if (!ability) return;

        const abilityMod = $modifiers[ability] || 0;
        const ranks = skill.ranks || 0;
        const classSkillBonus = skill.classSkill && ranks > 0 ? 3 : 0;
        const breadthOfKnowledgeBonus = ranks > 0 ? 2 : 0; // From Breadth of Knowledge feat

        totals[skillName] = ranks + abilityMod + classSkillBonus + breadthOfKnowledgeBonus;
      });

      return totals;
    }
  )
};

export const calculateSkillModifiers = (
  skillState: SkillState,
  abilityModifiers: Record<AbilityForSkill, number>
): Record<string, number> => {
  const modifiers: Record<string, number> = {};
  
  Object.entries(SKILL_ABILITIES).forEach(([skillName, ability]) => {
    modifiers[skillName] = abilityModifiers[ability as AbilityForSkill] || 0;
  });

  return modifiers;
};

export const calculateSkillTotal = (
  skill: Skills[SkillName],
  abilityMod: number
): number => {
  const ranks = skill.ranks || 0;
  const classSkillBonus = skill.classSkill && ranks > 0 ? 3 : 0;
  const breadthOfKnowledgeBonus = ranks > 0 ? 2 : 0;

  return ranks + abilityMod + classSkillBonus + breadthOfKnowledgeBonus;
};