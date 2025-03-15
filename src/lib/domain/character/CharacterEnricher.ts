import type { CharacterCache, EnrichedCharacter, ValueWithBreakdown } from '$lib/domain/character/CharacterTypes';
import type { CompleteCharacter } from '$lib/db/gameRules.api';
import type { GameRulesAPI } from '$lib/db/gameRules.api';
import type { Entity } from '$lib/domain/systems/SystemTypes';
import { abilityMod, calculateTotalLevel, buildGenericStat, calculateBaseSaves, getAbpResistanceBonus, calculateBAB, calculateSkillModifiers, buildSkillsWithRanks } from '../CharacterUtils';
import { AbilityEngine } from '$lib/domain/systems/engines/AbilityEngine';
import { loadCharacterCache } from './state/CharacterCache';
import { FeatureEffectSystem } from '$lib/domain/systems/FeatureEffectSystem';
import { DataAccessLayer } from '$lib/domain/systems/DataAccessLayer';
import { 
    calculateClasses,
    processClassFeatures
} from '$lib/domain/character/CharacterFeatures';
import { CharacterSystems } from '$lib/domain/systems/CharacterSystems';
import { SkillEngine } from '$lib/domain/systems/engines/SkillEngine';
import { CharacterSheetCalculator } from './CharacterSheetCalculator';
import { calculateTotalCharacterLevel } from './utils/CharacterUtils';
import { CharacterCalculator } from './CharacterCalculator';
import { SystemFactory } from '$lib/domain/systems/SystemFactory';
import { EngineFactory } from '$lib/domain/systems/engines/EngineFactory';

// Define GameCache interface for global storing
interface GameCache {
  abp: Record<number, any>;
  characterCache: Record<string, any>;
  lastRefresh?: number;
}

// Extend Window interface
declare global {
  interface Window {
    gameCache?: GameCache;
  }
}

// Interface for ability score calculation result
interface AbilityScoreResult {
  label?: string;
  name?: string;
  total: number;
  value?: number;
  modifiers: Array<{source: string; value: number}>;
  breakdown?: Array<{source: string; value: number}>;
}

/**
 * CharacterEnricher.ts
 * 
 * Coordinates the enrichment of character data by applying systems,
 * delegating calculations, and assembling results.
 */

/**
 * Enriches character data with explicit dependencies
 */
export class CharacterEnricher {
  private dataLayer: DataAccessLayer;
  
  /**
   * Constructor
   * @param gameRulesOrDataLayer Either the game rules API or data access layer
   */
  constructor(gameRulesOrDataLayer: GameRulesAPI | DataAccessLayer) {
    if (gameRulesOrDataLayer instanceof DataAccessLayer) {
      this.dataLayer = gameRulesOrDataLayer;
    } else {
      this.dataLayer = new DataAccessLayer(gameRulesOrDataLayer);
    }
  }
  
  /**
   * Enrich a character with calculated values
   * @param character The character to enrich
   * @returns An enriched character with calculated values
   */
  async enrichCharacter(character: CompleteCharacter): Promise<EnrichedCharacter> {
    console.log(`[ENRICHER] Enriching character ${character.name} (ID: ${character.id})`);
    
    // Step 1: Load cache to improve performance
    const cache = await this.loadCharacterCache(character);
    console.log('[ENRICHER] Character cache loaded');
    
    // Step 2: Create system factory and apply all systems
    const systemFactory = new SystemFactory(this.dataLayer);
    await systemFactory.applyAllSystems(character);
    console.log('[ENRICHER] Systems applied, effects registered');
    
    // Step 3: Create engine factory with feature effect system
    const engineFactory = new EngineFactory(
      systemFactory.featureEffectSystem,
      this.dataLayer
    );
    
    // Step 4: Create calculator with explicit dependencies
    const calculator = new CharacterCalculator(
      engineFactory.abilityEngine,
      engineFactory.savingThrowEngine,
      engineFactory.attackEngine,
      engineFactory.armorEngine,
      engineFactory.skillEngine,
      systemFactory.featureEffectSystem
    );
    
    // Step 5: Calculate character sheet
    const characterSheet = calculator.calculateCharacterSheet(character);
    console.log('[ENRICHER] Character sheet calculated');
    
    // Step 6: Convert to enriched character format
    const enriched = this.convertToEnrichedCharacter(
      character,
      characterSheet,
      cache,
      engineFactory.abilityEngine,
      engineFactory.skillEngine,
      calculator.getCapabilityFactory()
    );
    console.log('[ENRICHER] Character sheet converted to enriched format');
    
    return enriched;
  }
  
  /**
   * Load character cache for calculations
   */
  private async loadCharacterCache(character: CompleteCharacter): Promise<CharacterCache> {
    // Use the existing cache loading utility
    return await loadCharacterCache(character, this.dataLayer);
  }
  
  /**
   * Convert a character and its calculated sheet to an EnrichedCharacter
   * Now takes explicit engine dependencies
   */
  private convertToEnrichedCharacter(
    character: CompleteCharacter,
    sheet: any,
    cache: CharacterCache,
    abilityEngine: AbilityEngine,
    skillEngine: SkillEngine,
    capabilityFactory: any
  ): EnrichedCharacter {
    // Start with a copy of the original character
    const enriched = { ...character } as EnrichedCharacter;
    
    // Add ability scores
    enriched.strength = sheet.abilityScores.strength;
    enriched.dexterity = sheet.abilityScores.dexterity;
    enriched.constitution = sheet.abilityScores.constitution;
    enriched.intelligence = sheet.abilityScores.intelligence;
    enriched.wisdom = sheet.abilityScores.wisdom;
    enriched.charisma = sheet.abilityScores.charisma;
    
    // Add ability modifiers using the explicitly passed abilityEngine
    enriched.strMod = abilityEngine.calculateAbilityModifier(sheet.abilityScores.strength.total);
    enriched.dexMod = abilityEngine.calculateAbilityModifier(sheet.abilityScores.dexterity.total);
    enriched.conMod = abilityEngine.calculateAbilityModifier(sheet.abilityScores.constitution.total);
    enriched.intMod = abilityEngine.calculateAbilityModifier(sheet.abilityScores.intelligence.total);
    enriched.wisMod = abilityEngine.calculateAbilityModifier(sheet.abilityScores.wisdom.total);
    enriched.chaMod = abilityEngine.calculateAbilityModifier(sheet.abilityScores.charisma.total);
    
    // Add saves
    enriched.saves = sheet.saves;
    
    // Add AC values
    enriched.ac = sheet.combat.ac;
    enriched.touch_ac = sheet.combat.touchAC;
    enriched.flat_footed_ac = sheet.combat.flatFootedAC;
    
    // Add initiative
    enriched.initiative = sheet.combat.initiative;
    
    // Add combat stats
    enriched.cmb = sheet.combat.cmb;
    enriched.cmd = sheet.combat.cmd;
    
    // Add attacks
    enriched.attacks = {
      melee: sheet.combat.meleeAttack,
      ranged: sheet.combat.rangedAttack,
      bomb: sheet.combat.bomb || {
        attack: { label: 'Bomb Attack', modifiers: [], total: 0 },
        damage: { label: 'Bomb Damage', modifiers: [], total: 0 },
        bombDice: 0
      }
    };
    
    // Add skills
    enriched.skills = sheet.skills;
    
    // Process skill ranks using passed skillEngine
    enriched.skillsWithRanks = skillEngine.buildSkillsWithRanks(character);
    
    // Calculate meta information
    enriched.totalLevel = calculateTotalCharacterLevel(character);
    
    // Add class features from sheet
    enriched.processedClassFeatures = sheet.classFeatures.map((feature: any) => ({
      id: feature.id,
      name: feature.name,
      description: feature.description,
      level: feature.level,
      class_id: 0, // Not available in sheet format
      class_name: feature.className,
      type: 'Ex', // Default
      replaced_feature_ids: [],
      class_feature_benefit: [] // Not available in sheet format
    }));
    
    // Add empty spell slots (this would be populated in a full implementation)
    enriched.spellSlots = {};
    
    // Add empty skill points (this would be populated in a full implementation)
    enriched.skillPoints = {
      total: {},
      remaining: {}
    };
    
    return enriched;
  }
  
  /**
   * Get the DataAccessLayer instance
   */
  getDataAccessLayer(): DataAccessLayer {
    return this.dataLayer;
  }
}

/**
 * Helper function to ensure we have a GameRulesAPI instance
 */
function ensureGameRulesAPI(dataLayer: DataAccessLayer | GameRulesAPI): GameRulesAPI {
  if (dataLayer instanceof DataAccessLayer) {
    // Use the getCompleteCharacterData method which is public
    // We just need to verify the instance has valid game rules
    if (!dataLayer.getCompleteCharacterData) {
      throw new Error('No game rules API available');
    }
    return dataLayer as unknown as GameRulesAPI;
  }
  return dataLayer;
}

/**
 * Standalone function to enrich character data
 * Will eventually be migrated into the CharacterEnricher class
 */
export async function enrichCharacterData(
    char: CompleteCharacter,
    gameRulesOrDataLayer: GameRulesAPI | DataAccessLayer
): Promise<EnrichedCharacter> {
    const gameRules = ensureGameRulesAPI(gameRulesOrDataLayer);
    
    // Calculate basic enriched character data
    const totalLevel = calculateTotalLevel(char);
    
    // Load cache to improve performance
    const cache = await loadCharacterCache(char, gameRules);
    
    // Store cache in global gameCache for reuse
    storeCharacterCacheGlobally(char.id, cache);
    
    // Create enriched character base from the original character
    const enriched = char as unknown as EnrichedCharacter;
    
    // Create a DataAccessLayer to use for systems
    const dataLayer = new DataAccessLayer(gameRules);
    
    // Create and set up CharacterSystems
    const characterSystems = new CharacterSystems(dataLayer);
    
    // Apply all systems including ABP bonuses
    await characterSystems.applyAllSystems(char);
    
    // Get the FeatureEffectSystem with ABP effects registered
    const featureEffectSystem = characterSystems.getFeatureEffectSystem();
    
    // Debug all registered effects to check ABP bonuses
    if (featureEffectSystem) {
        console.log("All feature effects:", featureEffectSystem.getEffects());
    }
    
    // Create CombatEngineProvider with feature effect system
    const combatEngineProvider = featureEffectSystem ? 
        new CombatEngineProvider(featureEffectSystem, dataLayer) : undefined;
    
    // Create entity from character for use with systems
    const entity = characterToEntity(char);
    console.log('[ABILITIES DEBUG] Created entity from character:', { 
        entityId: entity.id, 
        hasCharacter: !!entity.character 
    });
    
    // The feature effect system includes effects from:
    // - ABP bonuses (already handled)
    // - Corruption effects (including Allure) 
    // - Feat effects (including Dodge)
    // - Trait effects (including Clever Wordplay and Pragmatic Activator)
    // These are registered by the respective systems in CharacterSystems
    
    // Create AbilityEngine with the feature effect system to access ABP bonuses
    const abilityEngine = new AbilityEngine(featureEffectSystem, dataLayer);

    // Convert AbilityScore to ValueWithBreakdown
    function convertToValueWithBreakdown(abilityScore: AbilityScoreResult): ValueWithBreakdown {
        return {
            label: abilityScore.label || abilityScore.name || 'Ability Score',
            total: abilityScore.total || abilityScore.value || 0,
            modifiers: abilityScore.modifiers || abilityScore.breakdown || [],
        };
    }

    // Extract base ability scores from character (now properly typed)
    const getBaseScore = (value: any): number => {
        if (typeof value === 'object' && value !== null && 'total' in value) {
            return value.total;
        }
        if (typeof value === 'number') {
            return value;
        }
        return 10; // Default value
    };

    // Fix the ability lookups by using lowercase names to match the data structure
    const baseStrength = getBaseScore(char.game_character_ability?.find(a => a.ability?.name === 'strength')?.value);
    const baseDexterity = getBaseScore(char.game_character_ability?.find(a => a.ability?.name === 'dexterity')?.value);
    const baseConstitution = getBaseScore(char.game_character_ability?.find(a => a.ability?.name === 'constitution')?.value);
    const baseIntelligence = getBaseScore(char.game_character_ability?.find(a => a.ability?.name === 'intelligence')?.value);
    const baseWisdom = getBaseScore(char.game_character_ability?.find(a => a.ability?.name === 'wisdom')?.value);
    const baseCharisma = getBaseScore(char.game_character_ability?.find(a => a.ability?.name === 'charisma')?.value);

    // Add debug logging to help diagnose ability score issues
    console.log('[ABILITIES DEBUG] Found ability scores in character data:', {
        strength: baseStrength,
        dexterity: baseDexterity,
        constitution: baseConstitution,
        intelligence: baseIntelligence,
        wisdom: baseWisdom,
        charisma: baseCharisma,
        ability_array: char.game_character_ability?.map(a => ({name: a.ability?.name, value: a.value}))
    });

    // Add this function to properly convert a character to an Entity
    function characterToEntity(character: CompleteCharacter): Entity {
        return {
            id: character.id || 0,
            character: character
        };
    }

    // Get ancestry trait bonuses for abilities
    const ancestryBonuses = await dataLayer.getAncestryTraitBonuses(char);
    console.log('[ABILITIES DEBUG] Ancestry bonuses:', ancestryBonuses);

    // Calculate ability scores with bonuses
    const strength = abilityEngine.calculateAbilityScore(entity, 'strength', baseStrength, ancestryBonuses.strength || []);
    const dexterity = abilityEngine.calculateAbilityScore(entity, 'dexterity', baseDexterity, ancestryBonuses.dexterity || []);
    const constitution = abilityEngine.calculateAbilityScore(entity, 'constitution', baseConstitution, ancestryBonuses.constitution || []);
    const intelligence = abilityEngine.calculateAbilityScore(entity, 'intelligence', baseIntelligence, ancestryBonuses.intelligence || []);
    const wisdom = abilityEngine.calculateAbilityScore(entity, 'wisdom', baseWisdom, ancestryBonuses.wisdom || []);
    const charisma = abilityEngine.calculateAbilityScore(entity, 'charisma', baseCharisma, ancestryBonuses.charisma || []);
    
    // Assign ability scores to the enriched character
    enriched.strength = convertToValueWithBreakdown(strength);
    enriched.dexterity = convertToValueWithBreakdown(dexterity);
    enriched.constitution = convertToValueWithBreakdown(constitution);
    enriched.intelligence = convertToValueWithBreakdown(intelligence);
    enriched.wisdom = convertToValueWithBreakdown(wisdom);
    enriched.charisma = convertToValueWithBreakdown(charisma);
    
    // Calculate ability modifiers
    enriched.strMod = abilityMod(strength.total);
    enriched.dexMod = abilityMod(dexterity.total);
    enriched.conMod = abilityMod(constitution.total);
    enriched.intMod = abilityMod(intelligence.total);
    enriched.wisMod = abilityMod(wisdom.total);
    enriched.chaMod = abilityMod(charisma.total);
    
    // Calculate saving throws
    // Get base saves from classes
    const baseSaves = calculateBaseSaves(char);
    console.log('[SAVES DEBUG] Base saves from classes:', baseSaves);
    
    // Get ABP resistance bonus for saves
    const abpResistanceBonus = getAbpResistanceBonus(featureEffectSystem);
    console.log('[SAVES DEBUG] ABP resistance bonus:', abpResistanceBonus);
    
    // Create save modifiers
    const fortitudeSaveModifiers = [
        { source: 'Base', value: baseSaves.fortitude },
        { source: 'CON', value: enriched.conMod }
    ];
    
    const reflexSaveModifiers = [
        { source: 'Base', value: baseSaves.reflex },
        { source: 'DEX', value: enriched.dexMod }
    ];
    
    const willSaveModifiers = [
        { source: 'Base', value: baseSaves.will },
        { source: 'WIS', value: enriched.wisMod }
    ];
    
    // Add ABP resistance bonus if present
    if (abpResistanceBonus > 0) {
        const abpMod = { source: 'ABP: Resistance', value: abpResistanceBonus };
        fortitudeSaveModifiers.push(abpMod);
        reflexSaveModifiers.push(abpMod);
        willSaveModifiers.push(abpMod);
    }
    
    // Create the save objects using the buildGenericStat utility
    const fortitudeSave = buildGenericStat('Fortitude', fortitudeSaveModifiers);
    const reflexSave = buildGenericStat('Reflex', reflexSaveModifiers);
    const willSave = buildGenericStat('Will', willSaveModifiers);
    
    enriched.saves = {
        fortitude: fortitudeSave,
        reflex: reflexSave,
        will: willSave
    };
    
    // Calculate AC and combat stats
    // If we have a combatEngineProvider, use it; otherwise create placeholder stats
    let acStats;
    if (combatEngineProvider) {
        const sizeCategory = (char.game_character_ancestry?.[0]?.ancestry?.size || 'medium').toLowerCase();
        const acResults = combatEngineProvider.armorEngine.calculateACSet(
            { id: char.id, character: char },
            enriched.dexMod,
            sizeCategory,
            []
        );
        // Match the property names expected by our enriched character
        acStats = {
            ac: acResults.normal,
            touch_ac: acResults.touch,
            flat_footed_ac: acResults.flatFooted
        };
    } else {
        // Fallback to simple AC calculations
        acStats = {
            ac: {
                label: 'AC',
                modifiers: [{ source: 'Base', value: 10 }, { source: 'DEX', value: enriched.dexMod }],
                total: 10 + enriched.dexMod
            },
            touch_ac: {
                label: 'Touch AC',
                modifiers: [{ source: 'Base', value: 10 }, { source: 'DEX', value: enriched.dexMod }],
                total: 10 + enriched.dexMod
            },
            flat_footed_ac: {
                label: 'Flat-Footed AC',
                modifiers: [{ source: 'Base', value: 10 }],
                total: 10
            }
        };
    }
    
    enriched.ac = acStats.ac;
    enriched.touch_ac = acStats.touch_ac;
    enriched.flat_footed_ac = acStats.flat_footed_ac;
    
    // Calculate initiative
    enriched.initiative = buildGenericStat('Initiative', [
        { source: 'DEX', value: enriched.dexMod }
    ]);
    
    // Calculate attacks
    let attackStats;
    if (combatEngineProvider) {
        const entity = { id: char.id, character: char };
        const sizeCategory = (char.game_character_ancestry?.[0]?.ancestry?.size || 'medium').toLowerCase();
        
        // Calculate BAB
        const baseAttackBonus = calculateBAB(char);
        
        // Use the proper attack engine
        const melee = combatEngineProvider.attackEngine.buildAttack(
            'Melee',
            baseAttackBonus,
            enriched.strMod,
            'Strength',
            combatEngineProvider.combatEngine.getSizeModifierForAttacks(sizeCategory)
        );
        
        const ranged = combatEngineProvider.attackEngine.buildAttack(
            'Ranged',
            baseAttackBonus,
            enriched.dexMod,
            'Dexterity',
            combatEngineProvider.combatEngine.getSizeModifierForAttacks(sizeCategory)
        );
        
        const cmb = combatEngineProvider.combatEngine.buildCMB(
            baseAttackBonus,
            enriched.strMod,
            combatEngineProvider.combatEngine.getSizeModifierForManeuvers(sizeCategory)
        );
        
        const cmd = combatEngineProvider.combatEngine.buildCMD(
            baseAttackBonus,
            enriched.strMod,
            enriched.dexMod,
            combatEngineProvider.combatEngine.getSizeModifierForManeuvers(sizeCategory)
        );
        
        const bomb = {
            attack: combatEngineProvider.attackEngine.buildAttack(
                'Bomb',
                baseAttackBonus,
                enriched.dexMod,
                'Dexterity',
                combatEngineProvider.combatEngine.getSizeModifierForAttacks(sizeCategory)
            ),
            damage: combatEngineProvider.attackEngine.buildDamage(
                'Bomb Damage',
                enriched.intMod
            ),
            bombDice: Math.floor((calculateTotalLevel(char) + 1) / 2)
        };
        
        // Set values directly
        enriched.attacks = { melee, ranged, bomb };
        enriched.cmb = cmb;
        enriched.cmd = cmd;
    } else {
        // Fallback to simple calculation
        const bab = calculateTotalLevel(char);
        
        const melee = buildGenericStat('Melee Attack', [
            { source: 'BAB', value: bab },
            { source: 'STR', value: enriched.strMod }
        ]);
        
        const ranged = buildGenericStat('Ranged Attack', [
            { source: 'BAB', value: bab },
            { source: 'DEX', value: enriched.dexMod }
        ]);
        
        const cmb = buildGenericStat('CMB', [
            { source: 'BAB', value: bab },
            { source: 'STR', value: enriched.strMod }
        ]);
        
        const cmd = buildGenericStat('CMD', [
            { source: 'Base', value: 10 },
            { source: 'BAB', value: bab },
            { source: 'STR', value: enriched.strMod },
            { source: 'DEX', value: enriched.dexMod }
        ]);
        
        const bomb = {
            attack: buildGenericStat('Bomb Attack', [
                { source: 'BAB', value: bab },
                { source: 'DEX', value: enriched.dexMod }
            ]),
            damage: buildGenericStat('Bomb Damage', [
                { source: 'INT', value: enriched.intMod }
            ]),
            bombDice: Math.floor((calculateTotalLevel(char) + 1) / 2)
        };
        
        // Set values directly
        enriched.attacks = { melee, ranged, bomb };
        enriched.cmb = cmb;
        enriched.cmd = cmd;
    }
    
    // ========= Skills Section =========
    console.log('[SKILLS DEBUG] Calculating skill modifiers');
    
    // Get all skills from the rules to ensure we have a complete set
    const allSkills = await gameRules.getAllSkill();
    console.log(`[SKILLS DEBUG] Got ${allSkills.length} skills from rules API`);
    
    // Store the complete set as a property on the character for reference
    (char as any).game_skill = allSkills;
    
    // Debug all registered effects before skill calculation
    if (featureEffectSystem) {
        const allEffects = featureEffectSystem.getEffects();
        console.log('[SKILLS DEBUG] All registered effects before skill calculation:', allEffects);
        
        // Check for specific effects like Allure
        const allureEffects = allEffects.filter((e: any) => 
            e.source && e.source.includes('Allure')
        );
        if (allureEffects.length > 0) {
            console.log('[SKILLS DEBUG] Found Allure effects:', allureEffects);
        } else {
            console.log('[SKILLS DEBUG] No Allure effects found in the system');
        }
    }
    
    // Create ability modifiers mapping for skills
    const abilityModifiers = {
        strength: enriched.strMod,
        dexterity: enriched.dexMod,
        constitution: enriched.conMod,
        intelligence: enriched.intMod,
        wisdom: enriched.wisMod,
        charisma: enriched.chaMod
    };
    
    enriched.skills = calculateSkillModifiers(char, abilityModifiers, featureEffectSystem);
    
    // Log summary of skills after calculation
    console.log(`[SKILLS DEBUG] Calculated ${Object.keys(enriched.skills).length} skill modifiers`);
    
    // Sample a few skills to understand what we have
    const sampleSkillIds = [
        30, // Bluff (charisma)
        28, // Acrobatics (dexterity)
        29, // Appraise (intelligence)
        54, // Perception (wisdom)
        60  // Stealth (dexterity)
    ];
    
    // Log info about these specific skills
    for (const id of sampleSkillIds) {
        const skill = enriched.skills[id];
        if (skill) {
            console.log(`[SKILLS DEBUG] Skill ${id} (${skill.label}): total=${skill.total}, modifiers=${skill.modifiers.length}, has_overrides=${!!skill.overrides}`);
        } else {
            console.error(`[SKILLS DEBUG] Important skill ID ${id} is missing from enriched skills!`);
        }
    }

    // ========= Build Skills With Ranks =========
    enriched.skillsWithRanks = buildSkillsWithRanks(char);
    
    // ========= Calculate Skill Points =========
    console.log('[SKILLS DEBUG] Calculating skill points');
    
    // Initialize skill points structure
    enriched.skillPoints = {
        total: {},
        remaining: {}
    };
    
    // Create a SkillEngine
    const skillEngine = new SkillEngine(featureEffectSystem, dataLayer);
    
    // Extract character classes with their base skill points
    const characterClasses = (char.game_character_class || []).map(charClass => {
        // Get the base skill points from the class
        const baseSkillPoints = charClass.class?.skill_ranks_per_level || 2; // Default to 2 if not specified
        
        // Determine if this is a favored class
        // Check character's favored class bonuses to see if this class has any
        const isFavoredClass = (char.game_character_favored_class_bonus || []).some(
            fcb => fcb.class_id === charClass.class_id
        );
        
        return {
            classId: charClass.class_id,
            level: charClass.level || 1,
            baseSkillPoints,
            isFavoredClass
        };
    });
    
    // Extract skill ranks with level information
    const skillRanks = (char.game_character_skill_rank || []).map(rank => ({
        level: rank.applied_at_level || 1,
        skillId: rank.skill_id
    }));
    
    // Get racial bonus to skill points (if any)
    const racialBonusSkillPoints = 0; // TODO: Implement if racial bonus exists
    
    // Calculate skill points
    try {
        const skillPointsData = await skillEngine.calculateSkillPointsWithRemaining(
            entity,
            intelligence.total,
            characterClasses,
            skillRanks,
            racialBonusSkillPoints
        );
        
        // Set skill points data on the enriched character
        enriched.skillPoints = skillPointsData;
        
        console.log(`[SKILLS DEBUG] Calculated skill points for ${characterClasses.length} classes across ${totalLevel} levels`);
        console.log(`[SKILLS DEBUG] Total skill points by level:`, 
            Object.entries(skillPointsData.total).map(([level, data]) => `Level ${level}: ${data.total}`).join(', ')
        );
    } catch (error) {
        console.error('[SKILLS DEBUG] Error calculating skill points:', error);
    }
    
    // Set metadata
    enriched.totalLevel = totalLevel;
    
    // Process class features instead of using an empty array
    enriched.processedClassFeatures = await processClassFeatures(char, gameRulesOrDataLayer);
    
    // Set spell slots (placeholder for now)
    enriched.spellSlots = {};
    
    return enriched;
}

/**
 * Store character cache in global gameCache
 */
function storeCharacterCacheGlobally(charId: number, cache: CharacterCache): void {
    if (typeof window === 'undefined') return;
    
    // Initialize if needed
    if (!window.gameCache) {
        window.gameCache = {
            abp: {},
            characterCache: {},
            lastRefresh: Date.now()
        };
    }
    
    // Store ABP data in global cache
    if (cache.abp?.nodes) {
        const level = getCharacterLevel(cache.abp);
        if (level > 0) {
            window.gameCache.abp[level] = cache.abp.nodes;
        }
    }
    
    // Store character cache by character ID
    window.gameCache.characterCache[charId] = cache;
    
    console.log(`Stored character ${charId} cache in global gameCache`);
    console.log(`  ABP data: ${Object.keys(window.gameCache.abp).length} levels`);
    console.log(`  Character cache: ${Object.keys(window.gameCache.characterCache).length} characters`);
    console.log(`  Ancestry trait bonuses: ${Object.keys(cache.ancestryTraitBonuses).length} ability types`);
}

/**
 * Get character level from ABP cache
 */
function getCharacterLevel(abpCache: any): number {
    return abpCache?.level || 0;
} 