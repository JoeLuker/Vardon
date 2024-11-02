import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const characterLevel = 5;
const effectiveABPLevel = characterLevel + 2;

const allSkills = {
    acrobatics: { ability: 'dex', classSkill: false },
    appraise: { ability: 'int', classSkill: true },
    bluff: { ability: 'cha', classSkill: false },
    climb: { ability: 'str', classSkill: false },
    craftAlchemy: { ability: 'int', classSkill: true },
    diplomacy: { ability: 'cha', classSkill: false },
    disableDevice: { ability: 'dex', classSkill: true },
    disguise: { ability: 'cha', classSkill: false },
    escapeArtist: { ability: 'dex', classSkill: false },
    fly: { ability: 'dex', classSkill: false },
    handleAnimal: { ability: 'cha', classSkill: false },
    heal: { ability: 'wis', classSkill: false },
    intimidate: { ability: 'cha', classSkill: false },
    knowledgeArcana: { ability: 'int', classSkill: true },
    knowledgeDungeoneering: { ability: 'int', classSkill: false },
    knowledgeEngineering: { ability: 'int', classSkill: true },
    knowledgeGeography: { ability: 'int', classSkill: false },
    knowledgeHistory: { ability: 'int', classSkill: false },
    knowledgeLocal: { ability: 'int', classSkill: true },
    knowledgeNature: { ability: 'int', classSkill: false },
    knowledgeNobility: { ability: 'int', classSkill: false },
    knowledgePlanes: { ability: 'int', classSkill: false },
    knowledgeReligion: { ability: 'int', classSkill: false },
    linguistics: { ability: 'int', classSkill: false },
    perception: { ability: 'wis', classSkill: false },
    perform: { ability: 'cha', classSkill: false },
    profession: { ability: 'wis', classSkill: false },
    ride: { ability: 'dex', classSkill: false },
    senseMotive: { ability: 'wis', classSkill: false },
    sleightOfHand: { ability: 'dex', classSkill: true },
    spellcraft: { ability: 'int', classSkill: true },
    stealth: { ability: 'dex', classSkill: false },
    survival: { ability: 'wis', classSkill: false },
    swim: { ability: 'str', classSkill: false },
    useMagicDevice: { ability: 'cha', classSkill: false }
};

const baseProgression = {
    1: {
        bab: 0,
        fort: 2,
        ref: 2,
        will: 0,
        bombDamage: '1d6',
        baseSpells: { 1: 1 },
        special: ['Alchemy', 'Bomb 1d6', 'Cognatogen', 'Throw Anything', 'Perfect Recall']
    },
    2: {
        bab: 1,
        fort: 3,
        ref: 3,
        will: 0,
        bombDamage: '1d6',
        baseSpells: { 1: 2 },
        special: ['Discovery', 'Perfect Recall']
    },
    3: {
        bab: 2,
        fort: 3,
        ref: 3,
        will: 1,
        bombDamage: '2d6',
        baseSpells: { 1: 3 },
        special: ['Bomb 2d6', 'Swift alchemy']
    },
    4: {
        bab: 3,
        fort: 4,
        ref: 4,
        will: 1,
        bombDamage: '2d6',
        baseSpells: { 1: 3, 2: 1 },
        special: ['Discovery']
    },
    5: {
        bab: 3,
        fort: 4,
        ref: 4,
        will: 1,
        bombDamage: '3d6',
        baseSpells: { 1: 4, 2: 2 },
        special: ['Bomb 3d6']
    }
};

const abpProgression = {
    1: {},
    2: {},
    3: { resistance: 1 },
    4: { armor: 1, weapon: 1 },
    5: { deflection: 1 },
    6: { mental: 2 },
    7: { physical: 2 },
    8: { 
        armor: 2, 
        resistance: 2, 
        toughening: 1, 
        weapon: 2 
    }
};

function getABPBonuses(level) {
    const bonuses = {
        resistance: 0,
        armor: 0,
        weapon: 0,
        deflection: 0,
        mental: 0,
        physical: 0,
        toughening: 0
    };

    for (let i = 1; i <= level; i++) {
        const levelBonuses = abpProgression[i] || {};
        for (const [key, value] of Object.entries(levelBonuses)) {
            bonuses[key] = value;
        }
    }

    return bonuses;
}

const getBaseAttributes = () => {
    const base = {
        str: 10,
        dex: 14,
        con: 12,
        int: 16,
        wis: 10,
        cha: 10
    };

    const racial = {
        str: 0,
        dex: 2,
        con: -2,
        int: 0,
        wis: 2,
        cha: 0
    };

    const levelIncrease = {
        str: 0,
        dex: 0,
        con: 0,
        int: characterLevel >= 4 ? 1 : 0,
        wis: 0,
        cha: 0
    };

    const abpBonuses = getABPBonuses(effectiveABPLevel);
    const abp = {
        str: 0,
        dex: abpBonuses.physical,
        con: 0,
        int: abpBonuses.mental,
        wis: 0,
        cha: 0
    };

    return Object.keys(base).reduce((acc, attr) => {
        acc[attr] = base[attr] + racial[attr] + levelIncrease[attr] + abp[attr];
        return acc;
    }, {});
};

const getCurrentStats = () => {
    const stats = {
        bab: 0,
        fort: 0,
        ref: 0,
        will: 0,
        bombDamage: '0',
        baseSpells: {},
        special: []
    };
    
    for (let i = 1; i <= characterLevel; i++) {
        const level = baseProgression[i];
        if (!level) continue;
        
        stats.bab = level.bab;
        stats.fort = level.fort;
        stats.ref = level.ref;
        stats.will = level.will;
        stats.bombDamage = level.bombDamage;
        stats.baseSpells = { ...stats.baseSpells, ...level.baseSpells };
        stats.special = [...stats.special, ...level.special];
    }
    
    return stats;
};

function createCharacterStore() {
    const baseAttributes = getBaseAttributes();
    const baseStats = getCurrentStats();

    function calculateModifier(score) {
        if (typeof score !== 'number') return 0;
        return Math.floor((score - 10) / 2);
    }

    function calculateSaves(state) {
        if (!state?.baseStats || !state?.currentAttributes) {
            return { fort: 0, ref: 0, will: 0 };
        }

        const abpBonuses = getABPBonuses(effectiveABPLevel);
        
        const conMod = calculateModifier(state.currentAttributes.con);
        const dexMod = calculateModifier(state.currentAttributes.dex);
        const wisMod = calculateModifier(state.currentAttributes.wis);
        
        return {
            fort: state.baseStats.fort + conMod + abpBonuses.resistance,
            ref: state.baseStats.ref + dexMod + abpBonuses.resistance,
            will: state.baseStats.will + wisMod + abpBonuses.resistance
        };
    }

    function calculateAC(abilityScores, state) {
        if (!abilityScores?.dex) {
            return { normal: 10, touch: 10, flatFooted: 10 };
        }
    
        const abpBonuses = getABPBonuses(effectiveABPLevel);
        const dexMod = calculateModifier(abilityScores.dex);
        
        // Add natural armor bonus if either cognatogen or mutagen is active
        const naturalArmorBonus = (state?.cognatogenActive || state?.dexMutagenActive) ? 2 : 0;
        
        return {
            normal: 10 + dexMod + abpBonuses.armor + abpBonuses.deflection + (abpBonuses.toughening || 0) + naturalArmorBonus,
            touch: 10 + dexMod + abpBonuses.deflection,
            flatFooted: 10 + abpBonuses.armor + abpBonuses.deflection + (abpBonuses.toughening || 0) + naturalArmorBonus
        };
    }

    function calculateSpellSlots(level, state) {
        const intModifier = calculateModifier(state.currentAttributes.int);
        const baseSlots = state.baseStats.baseSpells[level] || 0;
        const bonusSlots = intModifier >= level ? Math.floor((intModifier - level) / 4) + 1 : 0;
        return baseSlots + bonusSlots;
    }

    function calculateHP(baseHP, conScore) {
        const conMod = calculateModifier(conScore);
        return baseHP + (conMod * characterLevel);
    }

    const initialSpellSlots = {};
    Object.keys(baseStats.baseSpells).forEach(level => {
        initialSpellSlots[level] = {
            remaining: calculateSpellSlots(parseInt(level), { 
                currentAttributes: baseAttributes, 
                baseStats 
            })
        };
    });

    const initialState = {
        characterName: "Vardon Salvador",
        characterClass: "Magaambayan Artillery",
        characterRace: "Tengu Scholar of the Ring of Binding",
        playerName: "Aaron",
        
        characterLevel,
        baseAttributes,
        currentAttributes: { ...baseAttributes },
        baseStats,
        currentHP: 35,
        maxHP: 35,
        cognatogenActive: false,
        skills: Object.keys(allSkills).reduce((acc, skillName) => {
            acc[skillName] = {
                ranks: 0,
                classSkill: allSkills[skillName].classSkill,
                ability: allSkills[skillName].ability
            };
            return acc;
        }, {}),
        combat: {
            bombsLeft: 0,
            bab: baseStats.bab
        },
        consumables: {
            alchemistFire: 2,
            acid: 2,
            tanglefoot: 2
        },
        spellSlots: initialSpellSlots,
        knownSpells: {
            1: ['Comprehend Languages', 'Detect Secret Doors', 'Endure Elements', 'Identify'],
            2: ['Cure Moderate Wounds', 'Delay Poison']
        }
    };

    // Initialize bombsLeft with the correct value
    initialState.combat.bombsLeft = calculateModifier(initialState.currentAttributes.int) + characterLevel;

    const store = writable(initialState);
    
    if (browser) {
        const saved = localStorage.getItem('characterState');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.baseStats && parsed.currentAttributes) {
                    // Ensure all skills exist when loading from storage
                    const existingSkills = parsed.skills || {};
                    parsed.skills = Object.keys(allSkills).reduce((acc, skillName) => {
                        acc[skillName] = {
                            ranks: existingSkills[skillName]?.ranks || 0,
                            classSkill: allSkills[skillName].classSkill,
                            ability: allSkills[skillName].ability
                        };
                        return acc;
                    }, {});
                    store.set(parsed);
                }
            } catch (e) {
                console.error('Failed to parse saved character state:', e);
            }
        }
    }

    const characterStore = {
        subscribe: store.subscribe,
        update: store.update,

        calculateSkillBonus: (skillName, state) => {
            if (!state?.skills?.[skillName] || !state?.currentAttributes) {
                return 0;
            }


            
            const skill = state.skills[skillName];
            const ability = skill.ability;
            const abilityMod = calculateModifier(state.currentAttributes[ability]);
            const classSkillBonus = skill.classSkill && skill.ranks > 0 ? 3 : 0;
            const ranks = parseInt(skill.ranks) || 0;

            const isKnowledgeSkill = skillName.toLowerCase().includes("knowledge");
            const BreadthofKnowledgeBonus = 2;
            const additionalMod = isKnowledgeSkill ? abilityMod + BreadthofKnowledgeBonus : 0;
            
            return ranks + abilityMod + classSkillBonus + additionalMod;
        },

        getAvailableSkillPoints: () => {
            return 9; // Hardcoded as requested
        },

        updateSkills: (newSkills) => {
            store.update(state => ({
                ...state,
                skills: Object.keys(allSkills).reduce((acc, skillName) => {
                    acc[skillName] = {
                        ranks: newSkills[skillName]?.ranks || 0,
                        classSkill: allSkills[skillName].classSkill,
                        ability: allSkills[skillName].ability
                    };
                    return acc;
                }, {})
            }));
        },

        calculateSaves,
        calculateAC,
        calculateModifier,
        getSpellDC: (level, state) => {
            if (!state?.currentAttributes?.int) {
                return 10 + level;
            }
            const intMod = calculateModifier(state.currentAttributes.int);
            return 10 + level + intMod;
        },
        getBombsPerDay: (state) => {
            if (!state?.currentAttributes?.int) {
                return characterLevel;
            }
            const intMod = calculateModifier(state.currentAttributes.int);
            return characterLevel + intMod;
        },
        getMaxHP: (state) => {
            if (!state?.currentAttributes?.con) {
                return 35;
            }
            return calculateHP(35, state.currentAttributes.con);
        },
        toggleCognatogen: () => {
            store.update(state => {
                const newState = { ...state };
                newState.cognatogenActive = !state.cognatogenActive;
                
                newState.currentAttributes = { ...state.currentAttributes };
                if (newState.cognatogenActive) {
                    newState.currentAttributes.str -= 2;
                    newState.currentAttributes.int += 4;
                } else {
                    newState.currentAttributes = { ...state.baseAttributes };
                }
                // If mutagen was active, deactivate it as they can't stack
                if (newState.dexMutagenActive) {
                    newState.dexMutagenActive = false;
                }
                return newState;
            });
        },

        toggleDexMutagen: () => {
            store.update(state => {
                const newState = { ...state };
                newState.dexMutagenActive = !state.dexMutagenActive;
                
                newState.currentAttributes = { ...state.currentAttributes };
                if (newState.dexMutagenActive) {
                    newState.currentAttributes.dex += 4;
                    newState.currentAttributes.wis -= 2;
                } else {
                    newState.currentAttributes = { ...state.baseAttributes };
                }
                
                // If cognatogen was active, deactivate it as they can't stack
                if (newState.cognatogenActive) {
                    newState.cognatogenActive = false;
                }
                
                return newState;
            });
        },
        useSpellSlot: (level, remaining) => {
            store.update(state => {
                const maxSlots = calculateSpellSlots(level, state);
                return {
                    ...state,
                    spellSlots: {
                        ...state.spellSlots,
                        [level]: {
                            remaining: Math.min(Math.max(0, remaining), maxSlots)
                        }
                    }
                };
            });
        },
        getSpellSlots: (state) => {
            const slots = {};
            Object.keys(state.baseStats.baseSpells || {}).forEach(level => {
                const maxSlots = calculateSpellSlots(parseInt(level), state);
                slots[level] = {
                    max: maxSlots,
                    remaining: state.spellSlots[level]?.remaining ?? maxSlots
                };
            });
            return slots;
        },
        updateConsumable: (type, amount) => {
            store.update(state => ({
                ...state,
                consumables: {
                    ...state.consumables,
                    [type]: Math.max(0, amount)
                }
            }));
        },
        updateBombs: (remaining) => {
            store.update(state => ({
                ...state,
                combat: {
                    ...state.combat,
                    bombsLeft: Math.max(0, remaining)
                }
            }));
        },
        updateHP: (amount) => {
            store.update(state => ({
                ...state,
                currentHP: Math.max(0, amount)
            }));
        },
        reset: () => {
            store.set(initialState);
            if (browser) {
                localStorage.removeItem('characterState');
            }
        },
        getBaseStats: () => baseStats,
        getCurrentLevel: () => characterLevel
    };

    return characterStore;
}

export const character = createCharacterStore();

if (browser) {
    character.subscribe(state => {
        try {
            localStorage.setItem('characterState', JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save character state:', e);
        }
    });
}