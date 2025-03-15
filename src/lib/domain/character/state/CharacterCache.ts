import type { CharacterCache as CharCacheType, AbpCache } from '$lib/domain/character/CharacterTypes';
import type { GameRulesAPI, CompleteCharacter } from '$lib/db/gameRules.api';
import { DataAccessLayer } from '$lib/domain/systems/DataAccessLayer';
import type { GameRules } from '$lib/db/gameRules.api';

/**
 * Type for data access - either direct API or through DataAccessLayer
 */
type DataAccess = GameRulesAPI | DataAccessLayer;

/**
 * Ensure we have a DataAccessLayer
 */
function ensureDataLayer(access: DataAccess): DataAccessLayer {
    return access instanceof DataAccessLayer 
        ? access 
        : new DataAccessLayer(access);
}

/**
 * Load character cache for calculations
 */
export async function loadCharacterCache(
    char: CompleteCharacter,
    dataAccess: DataAccess
): Promise<CharCacheType> {
    const dataLayer = ensureDataLayer(dataAccess);
    
    // Get ABP data for this character's level
    const abp = await computeAutomaticBonusProgressionNodes(char, dataLayer);
    
    // Get ancestry trait bonuses
    const ancestryTraitBonuses = await precomputeAncestryTraitBonuses(char, dataLayer);
    
    // Get class save bonuses
    const classSaveBonuses = await precomputeClassSaveBonuses(char, dataLayer);
    
    // Get class skill IDs
    const classSkillIds = await getClassSkillIds(char, dataLayer);
    
    return {
        abp,
        ancestryTraitBonuses,
        classSaveBonuses,
        classSkillIds
    };
}

/**
 * Compute all ABP nodes for a character
 */
export async function computeAutomaticBonusProgressionNodes(
    char: CompleteCharacter,
    dataAccess: DataAccess
): Promise<AbpCache> {
    const dataLayer = ensureDataLayer(dataAccess);
    // Access totalLevel from the character, with fallback
    const level = char.game_character_class?.reduce((sum, c) => sum + (c.level || 0), 0) || 1;
    
    // Get ABP data from game rules for character level
    return await dataLayer.getAbpCacheData(level);
}

/**
 * Precompute ancestry trait bonuses
 */
export async function precomputeAncestryTraitBonuses(
    char: CompleteCharacter,
    dataAccess: DataAccess
): Promise<Record<string, any[]>> {
    const dataLayer = ensureDataLayer(dataAccess);
    const ancestriesData = await dataLayer.getAncestryTraitBonuses(char);
    
    // Ensure we have an array
    const ancestries: GameRules.Complete.Character['game_character_ancestry'] = 
        Array.isArray(ancestriesData) ? ancestriesData : [];
    
    // Filter ancestries with valid ancestry traits
    const filteredAncestries = ancestries.filter(ancestry => 
        ancestry?.ancestry?.ancestry_trait && 
        ancestry.ancestry.ancestry_trait.length > 0
    );
    
    // Extract and organize trait bonuses by target
    const traitBonuses = filteredAncestries
      .flatMap(ancestry => ancestry.ancestry?.ancestry_trait || [])
      .flatMap(trait => trait.ancestry_trait_benefit || [])
      .flatMap(benefit => benefit.ancestry_trait_benefit_bonus || [])
      .reduce((sum: Record<string, any[]>, bonus) => {
        const target = bonus.target_specifier?.name || 'misc';
        if (!sum[target]) sum[target] = [];
        sum[target].push({
          source: 'Ancestry',
          value: bonus.value || 0,
          type: bonus.bonus_type?.name || 'untyped'
        });
        return sum;
      }, {});
    
    return traitBonuses;
}

/**
 * Precompute class save bonuses
 */
export async function precomputeClassSaveBonuses(
    _char: CompleteCharacter,
    _dataAccess: DataAccess
): Promise<Record<string, any[]>> {
    // This would use dataLayer but for now return empty record
    return {
        'fortitude': [],
        'reflex': [],
        'will': []
    };
}

/**
 * Get all class skill IDs for a character
 */
export async function getClassSkillIds(
    char: CompleteCharacter,
    dataAccess: DataAccess
): Promise<Set<number>> {
    const dataLayer = ensureDataLayer(dataAccess);
    
    // Get class IDs from character sheet using game_character_class property
    const classIds = (char.game_character_class || []).map(c => c.class.id);
    
    // Get all class skills for these classes
    const classSkillIds = (classIds || [])
      .flatMap(id => dataLayer.getClassSkills([id]))
      .flatMap(skills => skills || [])
      .map((c: any) => c.skill_id)
      .reduce((sum: Set<number>, c: number) => {
        sum.add(c);
        return sum;
      }, new Set<number>());
    
    return classSkillIds;
} 