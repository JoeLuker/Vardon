import { GameEngine } from './core/GameEngine';
import { FeatureRegistry } from './config/FeatureRegistry';
import { AbilitySubsystemImpl } from './shared/AbilitySubsystemImpl';
import { SkillSubsystemImpl } from './shared/SkillSubsystemImpl';
import { BonusSubsystemImpl } from './shared/BonusSubsystemImpl';
import { CombatSubsystemImpl } from './shared/CombatSubsystemImpl';
import { ConditionSubsystemImpl } from './shared/ConditionSubsystemImpl';
import { PrerequisiteSubsystemImpl } from './shared/PrerequisiteSubsystemImpl';
import { SpellcastingSubsystemImpl } from './shared/SpellcastingSubsystemImpl';
import { SessionState } from './state/active/SessionState';
import { createCharacterStore } from './state/data/CharacterStore';
import { CalculationExplainer } from './introspection/CalculationExplainer';
import { SampleCharacters } from './config/SampleCharacters';
import { supabase } from '$lib/db/supabaseClient';
import { GameRulesAPI } from '$lib/db/gameRules.api';
import { CharacterAssembler } from './character/CharacterAssembler';
import { FeatureOrchestrator } from './core/FeatureOrchestrator';
import './state/data/ModuleInit';

// Features
import { SkillFocusFeature } from './features/feats/SkillFocusFeature';
import { PowerAttackFeature } from './features/feats/PowerAttackFeature';
import { WeaponFocusFeature } from './features/feats/WeaponFocusFeature';
import { DodgeFeature } from './features/feats/DodgeFeature';
import { ToughnessFeature } from './features/feats/ToughnessFeature';
import { ImprovedUnarmedStrikeFeature } from './features/feats/ImprovedUnarmedStrikeFeature';
import { BarbarianRageFeature } from './features/classes/BarbarianRageFeature';
import { ChannelEnergyFeature } from './features/classes/ChannelEnergyFeature';
import { SneakAttackFeature } from './features/classes/SneakAttackFeature';
import { KineticBlastFeature } from './features/classes/KineticBlastFeature';
import { AllureFeature } from './features/corruptions/AllureFeature';

/**
 * Initialize the application with game engine and subsystems
 * @param gameData Optional game data for initialization
 * @returns The initialized application components
 */
export async function initializeApplication(gameData?: any) {
  // Create feature registry first
  const featureRegistry = new FeatureRegistry();
  
  // Create game engine with feature registry
  const engine = new GameEngine(featureRegistry);
  
  // Create event bus reference
  const events = engine.events;
  
  // Use existing gameAPI if passed from outside or create a new one
  const gameAPI = gameData?.gameAPI || new GameRulesAPI(supabase);
  
  // Create the FeatureOrchestrator for dynamic feature creation
  const featureOrchestrator = new FeatureOrchestrator(engine, featureRegistry, gameAPI);
  
  // Set the orchestrator in the engine
  engine.setFeatureOrchestrator(featureOrchestrator);
  
  // Register subsystems in the correct order for dependency resolution
  const bonusSubsystem = new BonusSubsystemImpl();
  engine.registerSubsystem('bonus', bonusSubsystem);
  
  const abilitySubsystem = new AbilitySubsystemImpl(bonusSubsystem);
  engine.registerSubsystem('ability', abilitySubsystem);
  
  // Inject dependencies into skill subsystem
  const skillSubsystem = new SkillSubsystemImpl({ skills: [] }, abilitySubsystem, bonusSubsystem);
  engine.registerSubsystem('skill', skillSubsystem);
  
  const combatSubsystem = new CombatSubsystemImpl(abilitySubsystem, bonusSubsystem);
  engine.registerSubsystem('combat', combatSubsystem);
  
  const conditionSubsystem = new ConditionSubsystemImpl(bonusSubsystem);
  engine.registerSubsystem('condition', conditionSubsystem);
  
  // Register the spellcasting subsystem
  const spellcastingSubsystem = new SpellcastingSubsystemImpl(gameAPI);
  engine.registerSubsystem('spellcasting', spellcastingSubsystem);
  
  // Register the prerequisite subsystem
  const prerequisiteSubsystem = new PrerequisiteSubsystemImpl(gameAPI);
  engine.registerSubsystem('prerequisite', prerequisiteSubsystem);
  
  // Create session state
  const sessionState = new SessionState(events);
  
  // Create character store with database integration
  const characterStore = createCharacterStore(gameAPI);
  
  // Create calculation explainer
  const calculationExplainer = new CalculationExplainer(
    abilitySubsystem,
    skillSubsystem,
    bonusSubsystem,
    combatSubsystem
  );
  
  // Phase 1: Register explicitly imported features for backward compatibility
  // These will eventually be loaded dynamically via the filesystem
  featureRegistry.register(SkillFocusFeature);
  featureRegistry.register(PowerAttackFeature);
  featureRegistry.register(WeaponFocusFeature);
  featureRegistry.register(DodgeFeature);
  featureRegistry.register(ToughnessFeature);
  featureRegistry.register(ImprovedUnarmedStrikeFeature);
  featureRegistry.register(BarbarianRageFeature);
  featureRegistry.register(ChannelEnergyFeature);
  featureRegistry.register(SneakAttackFeature);
  featureRegistry.register(KineticBlastFeature);
  featureRegistry.register(AllureFeature);
  
  // Phase 2: Preload commonly used features from the filesystem
  // This helps avoid repeated dynamic imports during gameplay
  await featureRegistry.preloadFeatures([
    'feat.power_attack',
    'feat.weapon_focus_unarmed_strike',
    'feat.dodge',
    'feat.toughness',
    'class.elemental_focus',
    'class.burn',
    'class.gather_power',
    'corruption.vampiric_grace',
    'corruption.fangs'
  ]);
  
  // Load sample characters for testing
  const sampleCharacters = {
    fighter: SampleCharacters.getFighter(),
    rogue: SampleCharacters.getRogue(),
    barbarian: SampleCharacters.getBarbarian(),
    cleric: SampleCharacters.getCleric(),
    multiclass: SampleCharacters.getMulticlass()
  };
  
  // Register all sample characters
  for (const character of Object.values(sampleCharacters)) {
    engine.registerEntity(character);
    sessionState.addEntity(character);
    
    // Initialize all subsystems for this entity
    try {
      // Call initialize on each subsystem
      if (abilitySubsystem.initialize) abilitySubsystem.initialize(character);
      if (skillSubsystem.initialize) skillSubsystem.initialize(character);
      if (bonusSubsystem.initialize) bonusSubsystem.initialize(character);
      if (combatSubsystem.initialize) combatSubsystem.initialize(character);
      if (conditionSubsystem.initialize) conditionSubsystem.initialize(character);
      if (spellcastingSubsystem.initialize) spellcastingSubsystem.initialize(character);
      if (prerequisiteSubsystem.initialize) prerequisiteSubsystem.initialize(character);
      
      // Apply Power Attack for fighter and barbarian
      if (character.character?.classes?.some(c => ['fighter', 'barbarian'].includes(c.id))) {
        // Only apply if character doesn't already have it
        const hasPowerAttack = character.character?.feats?.some(f => f.id === 'feat.power_attack');
        if (!hasPowerAttack) {
          try {
            await engine.activateFeature('feat.power_attack', character, { penalty: 1 });
          } catch (error) {
            console.warn(`Failed to apply Power Attack to ${character.name}:`, error);
          }
        }
      }
      
      console.log(`Character ${character.name} initialized successfully`);
    } catch (error) {
      console.error(`Error initializing character ${character.name}:`, error);
    }
  }
  
  console.log('Loaded sample characters:', Object.keys(sampleCharacters));
  
  // Create character assembler with database support
  console.log('Creating CharacterAssembler with:', {
    hasEngine: !!engine,
    hasGameAPI: !!gameAPI,
    hasFeatureRegistry: !!featureRegistry
  });
  
  let characterAssembler;
  try {
    if (!engine) {
      throw new Error('Cannot create CharacterAssembler: engine is null or undefined');
    }
    
    // Always log the engine and gameAPI details for debugging
    console.log('Engine details:', {
      hasEvents: !!engine.events,
      hasSubsystems: engine.getSubsystemNames().length > 0,
      subsystems: engine.getSubsystemNames()
    });
    
    if (gameAPI) {
      console.log('GameAPI available:', {
        hasSupabase: !!gameAPI.supabase,
        methods: Object.keys(gameAPI).filter(k => typeof gameAPI[k] === 'function')
      });
    }
    
    // Verify necessary parameters are correctly passed
    characterAssembler = new CharacterAssembler(engine, gameAPI, featureRegistry);
    
    // Verify characterAssembler was properly created
    if (!characterAssembler) {
      throw new Error('CharacterAssembler constructor returned null or undefined');
    }
    
    // Check if assembleCharacter method exists
    if (typeof characterAssembler.assembleCharacter !== 'function') {
      throw new Error('CharacterAssembler missing required assembleCharacter method');
    }
    
    console.log('CharacterAssembler created successfully');
  } catch (error) {
    console.error('Failed to create CharacterAssembler:', error);
    
    // Create a minimal version as fallback with explicit error handling
    console.warn('Creating fallback CharacterAssembler with just engine');
    try {
      if (!engine) {
        throw new Error('Cannot create fallback CharacterAssembler: engine is null or undefined');
      }
      
      characterAssembler = new CharacterAssembler(engine);
      
      // Verify the fallback was created
      if (!characterAssembler) {
        throw new Error('Fallback CharacterAssembler constructor returned null or undefined');
      }
      
      console.log('Fallback CharacterAssembler created successfully');
    } catch (fallbackError) {
      console.error('Critical error: Failed to create fallback CharacterAssembler:', fallbackError);
      // Create an emergency placeholder object with the minimum required interface
      console.warn('Creating emergency placeholder CharacterAssembler');
      characterAssembler = {
        assembleCharacter: async (character) => {
          console.warn('Using emergency placeholder CharacterAssembler');
          return {
            ...character,
            id: character.id,
            name: character.name || 'Character',
            totalLevel: 1,
            // Add minimum required properties
            strength: { total: 10, modifier: 0, label: 'Strength', modifiers: [] },
            dexterity: { total: 10, modifier: 0, label: 'Dexterity', modifiers: [] },
            constitution: { total: 10, modifier: 0, label: 'Constitution', modifiers: [] },
            intelligence: { total: 10, modifier: 0, label: 'Intelligence', modifiers: [] },
            wisdom: { total: 10, modifier: 0, label: 'Wisdom', modifiers: [] },
            charisma: { total: 10, modifier: 0, label: 'Charisma', modifiers: [] },
            skills: {},
            saves: { fortitude: { total: 0, label: 'Fortitude', modifiers: [] }, 
                     reflex: { total: 0, label: 'Reflex', modifiers: [] }, 
                     will: { total: 0, label: 'Will', modifiers: [] } },
            ac: { total: 10, label: 'AC', modifiers: [] },
            touch_ac: { total: 10, label: 'Touch AC', modifiers: [] },
            flat_footed_ac: { total: 10, label: 'Flat-footed AC', modifiers: [] }
          };
        }
      };
      console.log('Emergency placeholder CharacterAssembler created');
    }
  }
  
  // Generate a detailed report for the fighter as an example
  try {
    const fighterReport = calculationExplainer.getCharacterReport(sampleCharacters.fighter);
    console.log('Fighter character report:', fighterReport);
  } catch (error) {
    console.error('Error generating fighter report:', error);
  }
  
  return {
    engine,
    featureRegistry,
    sessionState,
    characterStore,
    calculationExplainer,
    gameAPI,
    sampleCharacters,
    characterAssembler,
    featureOrchestrator
  };
} 