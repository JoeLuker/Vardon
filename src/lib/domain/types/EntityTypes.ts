/**
 * Core entity interface for any game object
 */
export interface Entity {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  character?: CharacterData;
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: number;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Character-specific data structure
 */
export interface CharacterData {
  // Basic character attributes
  level?: number;
  race?: string;
  classes?: CharacterClass[];
  alignment?: string;
  size?: string;
  
  // Ability scores
  abilities?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    [key: string]: number;
  };
  
  // Stats
  baseAttackBonus?: number;
  hitPoints?: {
    max: number;
    current: number;
    temporary: number;
    nonLethal: number;
  };
  skills?: Record<number, SkillData>;
  savingThrows?: {
    fortitude: number;
    reflex: number;
    will: number;
    [key: string]: number;
  };
  
  // Character features
  feats?: FeatData[];
  traits?: TraitData[];
  classFeatures?: ClassFeatureData[];
  
  // Equipment
  equipment?: EquipmentData;
  
  // Bonuses
  bonuses?: Record<string, BonusData[]>;
  
  // Spellcasting
  spellcasting?: Record<string, SpellcastingData>;
  
  // Tracking
  conditions?: string[];
  resources?: Record<string, ResourceData>;
  
  // Character notes
  notes?: string;
  
  // Additional data
  classSkills?: number[];
  [key: string]: any;
}

/**
 * Character class information
 */
export interface CharacterClass {
  id: string;
  name: string;
  level: number;
  hitDie: number;
  skillsPerLevel: number;
  baseAttackBonus: number[];
  baseSaves: {
    fortitude: number[];
    reflex: number[];
    will: number[];
  };
}

/**
 * Skill information
 */
export interface SkillData {
  ranks: number;
  classSkill?: boolean;
  ability: string;
  miscBonus?: number;
  notes?: string;
}

/**
 * Feat data structure
 */
export interface FeatData {
  id: string;
  name: string;
  description?: string;
  options?: Record<string, any>;
  source?: string;
}

/**
 * Character trait data
 */
export interface TraitData {
  id: string;
  name: string;
  type: string;
  description?: string;
  options?: Record<string, any>;
}

/**
 * Class feature data
 */
export interface ClassFeatureData {
  id: string;
  name: string;
  classId: string;
  level: number;
  description?: string;
  options?: Record<string, any>;
}

/**
 * Character equipment data
 */
export interface EquipmentData {
  armor?: ArmorData[];
  weapons?: WeaponData[];
  items?: ItemData[];
  [key: string]: any;
}

/**
 * Armor equipment
 */
export interface ArmorData {
  id: string;
  name: string;
  type: 'light' | 'medium' | 'heavy' | 'shield';
  acBonus: number;
  maxDex?: number;
  checkPenalty?: number;
  spellFailure?: number;
  equipped: boolean;
  properties?: Record<string, any>;
}

/**
 * Weapon equipment
 */
export interface WeaponData {
  id: string;
  name: string;
  category: string;
  damage: string;
  damageType: string;
  critical: string;
  range?: number;
  weight?: number;
  properties?: string[];
  equipped: boolean;
  [key: string]: any;
}

/**
 * Generic item
 */
export interface ItemData {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  description?: string;
  properties?: Record<string, any>;
}

/**
 * Bonus data structure
 */
export interface BonusData {
  value: number;
  type: string;
  source: string;
  condition?: string;
  appliesTo?: string[];
}

/**
 * Spellcasting data
 */
export interface SpellcastingData {
  type: 'prepared' | 'spontaneous';
  casterLevel: number;
  ability: string;
  spellsPerDay: Record<number, number>;
  knownSpells?: Record<number, string[]>;
  preparedSpells?: Record<number, string[]>;
}

/**
 * Resource tracking
 */
export interface ResourceData {
  max: number;
  current: number;
  rechargeCondition?: string;
} 