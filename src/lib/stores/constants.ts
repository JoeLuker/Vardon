export const CHARACTER_LEVEL = 5;
export const EFFECTIVE_ABP_LEVEL = CHARACTER_LEVEL + 2;

export const CLASS_SKILLS = {
  acrobatics: true,
  appraise: true,
  craftAlchemy: true,
  disableDevice: true,
  knowledgeArcana: true,
  knowledgeNature: true,
  perception: true,
  sleightOfHand: true,
  spellcraft: true,
  useMagicDevice: true
} as const;

export const SKILL_ABILITIES = {
  acrobatics: 'dex',
  appraise: 'int',
  bluff: 'cha',
  climb: 'str',
  craftAlchemy: 'int',
  diplomacy: 'cha',
  disableDevice: 'dex',
  disguise: 'cha',
  escapeArtist: 'dex',
  fly: 'dex',
  handleAnimal: 'cha',
  heal: 'wis',
  intimidate: 'cha',
  knowledgeArcana: 'int',
  knowledgeDungeoneering: 'int',
  knowledgeEngineering: 'int',
  knowledgeGeography: 'int',
  knowledgeHistory: 'int',
  knowledgeLocal: 'int',
  knowledgeNature: 'int',
  knowledgeNobility: 'int',
  knowledgePlanes: 'int',
  knowledgeReligion: 'int',
  linguistics: 'int',
  perception: 'wis',
  perform: 'cha',
  ride: 'dex',
  senseMotive: 'wis',
  sleightOfHand: 'dex',
  spellcraft: 'int',
  stealth: 'dex',
  survival: 'wis',
  swim: 'str',
  useMagicDevice: 'cha'
} as const;

// Alias for SKILL_ABILITIES to fix import error
export const SKILL_ATTRIBUTE_MAP = SKILL_ABILITIES;