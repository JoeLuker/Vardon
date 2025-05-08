/**
 * Skill capability - provides access to skill data through kernel interface
 */

import type { Capability } from '../../kernel/types';
import { ErrorCode } from '../../kernel/ErrorHandler';

/**
 * Skill device ioctl request codes
 */
export enum SkillRequest {
  GET_SKILLS = 1001,
  GET_SKILL_RANKS = 1002,
  ADD_SKILL_RANK = 1003,
  REMOVE_SKILL_RANK = 1004
}

/**
 * Skill capability implementation
 * This acts as a device driver for skill data
 */
export class SkillCapability implements Capability {
  readonly id = 'skill';
  readonly version = '1.0.0';
  
  // Kernel reference
  kernel: any = null;
  
  // Called when the device is mounted
  onMount(kernel: any): void {
    console.log(`[SkillCapability] Device mounting, kernel:`, !!kernel);
    this.kernel = kernel;
  }
  
  // Cache to store skill data
  private skillCache: Map<string, any[]> = new Map();
  private rankCache: Map<string, any[]> = new Map();
  
  /**
   * Helper function to extract character ID from entity path
   */
  private extractCharacterId(entityPath: string): string {
    // Extract character ID from canonical path format:
    // - /proc/character/123
    const matches = entityPath.match(/\/proc\/character\/(\w+)/);
    
    if (!matches) {
      console.error(`[SkillCapability] Invalid path format: ${entityPath}`);
      throw new Error(`Invalid character path format: ${entityPath}`);
    }
    
    return matches[1];
  }

  /**
   * Read from skill device
   */
  read(fd: number, buffer: any): number {
    // Return device information
    buffer.deviceType = 'skill';
    buffer.version = this.version;
    buffer.supportedRequests = Object.keys(SkillRequest)
      .filter(key => isNaN(Number(key)))
      .map(key => ({ 
        name: key, 
        code: SkillRequest[key as keyof typeof SkillRequest] 
      }));
    
    return ErrorCode.SUCCESS;
  }
  
  /**
   * Process skill device requests
   */
  ioctl(fd: number, request: number, arg: any): number {
    console.log(`[SkillCapability] Processing ioctl request ${request}`, arg);
    
    switch (request) {
      case SkillRequest.GET_SKILLS:
        return this.getSkills(arg);
        
      case SkillRequest.GET_SKILL_RANKS:
        return this.getSkillRanks(arg);
        
      case SkillRequest.ADD_SKILL_RANK:
        return this.addSkillRank(arg);
        
      case SkillRequest.REMOVE_SKILL_RANK:
        return this.removeSkillRank(arg);
        
      default:
        console.error(`[SkillCapability] Unknown request code: ${request}`);
        return ErrorCode.EINVAL;
    }
  }
  
  /**
   * Get all skills for character
   */
  private getSkills(arg: any): number {
    const { entityPath } = arg;
    
    if (!entityPath) {
      console.error(`[SkillCapability] No entity path provided`);
      return ErrorCode.EINVAL;
    }
    
    // Extract character ID from entity path
    const characterId = this.extractCharacterId(entityPath);
    
    // Provide simulated skills data
    const skills = [
      { id: 1, name: 'acrobatics', label: 'Acrobatics', ability: 'DEX', trained_only: false },
      { id: 2, name: 'appraise', label: 'Appraise', ability: 'INT', trained_only: false },
      { id: 3, name: 'bluff', label: 'Bluff', ability: 'CHA', trained_only: false },
      { id: 4, name: 'climb', label: 'Climb', ability: 'STR', trained_only: false },
      { id: 5, name: 'craft', label: 'Craft', ability: 'INT', trained_only: false },
      { id: 6, name: 'diplomacy', label: 'Diplomacy', ability: 'CHA', trained_only: false },
      { id: 7, name: 'disable_device', label: 'Disable Device', ability: 'DEX', trained_only: true },
      { id: 8, name: 'disguise', label: 'Disguise', ability: 'CHA', trained_only: false },
      { id: 9, name: 'escape_artist', label: 'Escape Artist', ability: 'DEX', trained_only: false },
      { id: 10, name: 'fly', label: 'Fly', ability: 'DEX', trained_only: false }
    ];
    
    // Provide simulated character skill ranks
    const skillsWithRanks = skills.map(skill => ({
      skillId: skill.id,
      isClassSkill: Math.random() > 0.5,
      skillRanks: Array.from({ length: Math.floor(Math.random() * 4) }, (_, i) => ({
        level: i + 1,
        rank: 1
      }))
    }));
    
    // Cache the skills data
    this.skillCache.set(characterId, skills);
    
    // Add to result
    arg.skills = skills;
    arg.skillsWithRanks = skillsWithRanks;
    
    return ErrorCode.SUCCESS;
  }
  
  /**
   * Get skill ranks for a character
   */
  private getSkillRanks(arg: any): number {
    const { entityPath, skillId } = arg;
    
    if (!entityPath) {
      console.error(`[SkillCapability] No entity path provided`);
      return ErrorCode.EINVAL;
    }
    
    // Extract character ID from entity path
    const characterId = this.extractCharacterId(entityPath);
    
    // Get cached ranks or create empty array
    let ranks = this.rankCache.get(characterId) || [];
    
    // Filter by skill ID if provided
    if (skillId) {
      ranks = ranks.filter(rank => rank.skill_id === skillId);
    }
    
    // Add to result
    arg.ranks = ranks;
    
    return ErrorCode.SUCCESS;
  }
  
  /**
   * Add a skill rank
   */
  private addSkillRank(arg: any): number {
    const { entityPath, skillId, level } = arg;
    
    if (!entityPath || !skillId || !level) {
      console.error(`[SkillCapability] Missing required parameters for adding skill rank`);
      return ErrorCode.EINVAL;
    }
    
    // Extract character ID from entity path
    const characterId = this.extractCharacterId(entityPath);
    
    // Get cached ranks or create empty array
    const ranks = this.rankCache.get(characterId) || [];
    
    // Check if rank already exists
    const existingRank = ranks.find(rank => 
      rank.skill_id === skillId && rank.applied_at_level === level
    );
    
    if (existingRank) {
      console.error(`[SkillCapability] Skill rank already exists`);
      return ErrorCode.EEXIST;
    }
    
    // Add new rank
    ranks.push({
      id: Date.now(),
      game_character_id: characterId,
      skill_id: skillId,
      applied_at_level: level
    });
    
    // Update cache
    this.rankCache.set(characterId, ranks);
    
    return ErrorCode.SUCCESS;
  }
  
  /**
   * Remove a skill rank
   */
  private removeSkillRank(arg: any): number {
    const { entityPath, skillId, level } = arg;
    
    if (!entityPath || !skillId || !level) {
      console.error(`[SkillCapability] Missing required parameters for removing skill rank`);
      return ErrorCode.EINVAL;
    }
    
    // Extract character ID from entity path
    const characterId = this.extractCharacterId(entityPath);
    
    // Get cached ranks or create empty array
    const ranks = this.rankCache.get(characterId) || [];
    
    // Find rank to remove
    const rankIndex = ranks.findIndex(rank => 
      rank.skill_id === skillId && rank.applied_at_level === level
    );
    
    if (rankIndex === -1) {
      console.error(`[SkillCapability] Skill rank not found`);
      return ErrorCode.ENOENT;
    }
    
    // Remove rank
    ranks.splice(rankIndex, 1);
    
    // Update cache
    this.rankCache.set(characterId, ranks);
    
    return ErrorCode.SUCCESS;
  }
}