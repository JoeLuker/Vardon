// /src/lib/stores/base/skills.ts
import { writable, derived, get } from 'svelte/store';
import type { SkillState, Skills, SkillName } from '$lib/types';
import { skillService } from '$lib/services';
import { SKILL_ABILITIES, CLASS_SKILLS } from '../constants';

function createSkillsStore() {
  const initialState: SkillState = {
    skills: {} as Skills,
    pointsByLevel: Array(5).fill({}).map(() => ({})),
    errors: []
  };

  const { subscribe, set, update } = writable<SkillState>(initialState);

  return {
    subscribe,
    skills: derived({ subscribe }, $state => $state.skills),
    errors: derived({ subscribe }, $state => $state.errors),

    async init(characterId: number) {
      try {
        const skills = await skillService.loadSkills(characterId);
        const pointsByLevel = await skillService.getSkillPointsByLevel(characterId);
        
        // Transform pointsByLevel into the expected format
        const formattedPointsByLevel = Array(5).fill({}).map((_, i) => {
          const levelData = pointsByLevel[i] || { used: 0, total: 0, remaining: 0 };
          const skillPoints: Record<string, boolean> = {};
          Object.keys(skills).forEach(skillName => {
            skillPoints[skillName] = levelData.used > 0;
          });
          return skillPoints;
        });

        update(s => ({
          ...s,
          skills,
          pointsByLevel: formattedPointsByLevel,
          errors: []
        }));
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to load skills']
        }));
      }
    },

    hasPointAtLevel(level: number, skillName: SkillName): boolean {
      const state = get({ subscribe });
      return Boolean(state.pointsByLevel[level]?.[skillName]);
    },

    async toggleSkillPoint(characterId: number, level: number, skillName: SkillName) {
      try {
        const currentValue = this.hasPointAtLevel(level, skillName);
        const newValue = !currentValue;

        update(s => ({
          ...s,
          pointsByLevel: s.pointsByLevel.map((levelPoints, idx) =>
            idx === level ? { ...levelPoints, [skillName]: newValue } : levelPoints
          ),
          errors: []
        }));

        const totalRanks = this.getTotalRanks(skillName);
        await skillService.updateRanks(characterId, skillName, 
          newValue ? totalRanks + 1 : totalRanks - 1
        );
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to toggle skill point']
        }));
      }
    },

    getTotalRanks(skillName: SkillName): number {
      const state = get({ subscribe });
      return state.pointsByLevel.reduce((total, levelPoints) => 
        total + (levelPoints[skillName] ? 1 : 0), 0
      );
    },

    clearErrors() {
      update(s => ({ ...s, errors: [] }));
    }
  };
}

export const skills = createSkillsStore();