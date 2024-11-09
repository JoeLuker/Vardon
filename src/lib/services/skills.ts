// /src/lib/services/skills.ts
import { db } from './database';
import type { Skills, Skill, SkillName } from '$lib/types/character';
import { CLASS_SKILLS, SKILL_ABILITIES } from '$lib/stores/constants';
import type { Database } from '$lib/types/supabase';

type SkillInsert = Database['public']['Tables']['character_skills']['Insert'];

export class SkillService {
  async loadSkills(characterId: number): Promise<Skills> {
    try {
      const rows = await db.skills.get(characterId);
      
      // Initialize with default values
      const formattedSkills = Object.entries(SKILL_ABILITIES).reduce(
        (acc, [skillName, ability]) => ({
          ...acc,
          [skillName]: {
            ability,
            classSkill: CLASS_SKILLS[skillName as keyof typeof CLASS_SKILLS] || false,
            ranks: 0
          }
        }),
        {} as Skills
      );

      // Update with database values
      if (Array.isArray(rows)) {
        rows.forEach((row) => {
          if (row.skill_name && formattedSkills[row.skill_name as SkillName]) {
            formattedSkills[row.skill_name as SkillName] = {
              ...formattedSkills[row.skill_name as SkillName],
              ranks: row.ranks || 0,
              classSkill: row.class_skill || false,
              ability: row.ability as Skill['ability']
            };
          }
        });
      }

      return formattedSkills;
    } catch (error) {
      console.error('Failed to load skills:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to load skills');
    }
  }

  async updateSkill(
    characterId: number, 
    skillName: SkillName, 
    updates: Partial<Skill>
  ): Promise<void> {
    try {
      const data = {
        character_id: characterId,
        skill_name: skillName,
        ability: updates.ability || SKILL_ABILITIES[skillName],
        class_skill: updates.classSkill ?? CLASS_SKILLS[skillName as keyof typeof CLASS_SKILLS] ?? false,
        ranks: updates.ranks ?? 0,
        sync_status: 'synced' as const,
        updated_at: new Date().toISOString() as string
      } satisfies SkillInsert;

      await db.skills.upsert(data);
    } catch (error) {
      console.error('Failed to update skill:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update skill');
    }
  }

  async updateRanks(
    characterId: number,
    skillName: SkillName,
    ranks: number
  ): Promise<void> {
    return this.updateSkill(characterId, skillName, { ranks });
  }

  async getSkillPointsByLevel(characterId: number): Promise<Array<{
    used: number;
    total: number;
    remaining: number;
  }>> {
    try {
      const skills = await this.loadSkills(characterId);
      const pointsPerLevel = this.getPointsPerLevel();
      const maxLevel = 5; // Current character level

      // Initialize array with default values
      const pointsByLevel = Array(maxLevel).fill(null).map(() => ({
        total: pointsPerLevel,
        used: 0,
        remaining: pointsPerLevel
      }));

      // Calculate used points per level based on ranks
      Object.values(skills).forEach(skill => {
        const ranks = skill.ranks || 0;
        for (let i = 0; i < ranks && i < maxLevel; i++) {
          pointsByLevel[i].used++;
          pointsByLevel[i].remaining--;
        }
      });

      return pointsByLevel;
    } catch (error) {
      console.error('Failed to get skill points by level:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get skill points by level');
    }
  }

  private getPointsPerLevel(): number {
    const basePoints = 4; // Base for Mindchemist
    const intModifier = 5; // INT 20 gives +5
    const favoredClassBonus = 1; // fcb
    return basePoints + intModifier + favoredClassBonus;
  }

  async reset(characterId: number): Promise<void> {
    try {
      // Initialize all skills with 0 ranks
      const promises = Object.keys(SKILL_ABILITIES).map(skillName => {
        const data = {
          character_id: characterId,
          skill_name: skillName,
          ranks: 0,
          ability: SKILL_ABILITIES[skillName as keyof typeof SKILL_ABILITIES],
          class_skill: CLASS_SKILLS[skillName as keyof typeof CLASS_SKILLS] || false,
          sync_status: 'synced' as const,
          updated_at: new Date().toISOString() as string
        } satisfies SkillInsert;

        return db.skills.upsert(data);
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to reset skills:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to reset skills');
    }
  }
}

export const skillService = new SkillService();