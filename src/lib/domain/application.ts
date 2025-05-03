import { GameEngine } from './core/GameEngine';
import { FeatureRegistry } from './config/FeatureRegistry';
import { AbilitySubsystemImpl } from './shared/AbilitySubsystemImpl';
import { SkillSubsystemImpl } from './shared/SkillSubsystemImpl';
import { BonusSubsystemImpl } from './shared/BonusSubsystemImpl';
import { CombatSubsystemImpl } from './shared/CombatSubsystemImpl';
import { ConditionSubsystemImpl } from './shared/ConditionSubsystemImpl';
import { SessionState } from './state/active/SessionState';
import { LocalStorageDriver, CharacterStore } from './state/data/CharacterStore';
import { CalculationExplainer } from './introspection/CalculationExplainer';
import { GameRulesAPI } from './core/GameAPI';
import { SampleCharacters } from './config/SampleCharacters';
import { createClient } from '@supabase/supabase-js';

// Features
import { SkillFocusFeature } from './features/feats/SkillFocusFeature';
import { PowerAttackFeature } from './features/feats/PowerAttackFeature';
import { WeaponFocusFeature } from './features/feats/WeaponFocusFeature';
import { BarbarianRageFeature } from './features/classes/BarbarianRageFeature';
import { ChannelEnergyFeature } from './features/classes/ChannelEnergyFeature';
import { SneakAttackFeature } from './features/classes/SneakAttackFeature';

/**
 * Application setup
 */
export function initializeApplication(gameData: any) {
  // Create feature registry first
  const featureRegistry = new FeatureRegistry();
  
  // Create game engine with feature registry
  const engine = new GameEngine(featureRegistry);
  
  // Create event bus reference
  const events = engine.events;
  
  // Register subsystems in the correct order for dependency resolution
  const bonusSubsystem = new BonusSubsystemImpl();
  engine.registerSubsystem('bonus', bonusSubsystem);
  
  const abilitySubsystem = new AbilitySubsystemImpl(bonusSubsystem);
  engine.registerSubsystem('ability', abilitySubsystem);
  
  // Inject dependencies into skill subsystem
  const skillSubsystem = new SkillSubsystemImpl(gameData, abilitySubsystem, bonusSubsystem);
  engine.registerSubsystem('skill', skillSubsystem);
  
  const combatSubsystem = new CombatSubsystemImpl(abilitySubsystem, bonusSubsystem);
  engine.registerSubsystem('combat', combatSubsystem);
  
  const conditionSubsystem = new ConditionSubsystemImpl(bonusSubsystem);
  engine.registerSubsystem('condition', conditionSubsystem);
  
  // Create session state
  const sessionState = new SessionState(events);
  
  // Create character store
  const storageDriver = new LocalStorageDriver();
  const characterStore = new CharacterStore(storageDriver);
  
  // Create calculation explainer
  const calculationExplainer = new CalculationExplainer(
    abilitySubsystem,
    skillSubsystem,
    bonusSubsystem,
    combatSubsystem
  );
  
  // Get environment variables for Supabase
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Create the GameRulesAPI for external systems
  const gameAPI = new GameRulesAPI(supabase);
  
  // Register features
  featureRegistry.register(SkillFocusFeature);
  featureRegistry.register(PowerAttackFeature);
  featureRegistry.register(WeaponFocusFeature);
  featureRegistry.register(BarbarianRageFeature);
  featureRegistry.register(ChannelEnergyFeature);
  featureRegistry.register(SneakAttackFeature);
  
  // Load sample characters for testing
  const sampleCharacters = {
    fighter: SampleCharacters.getFighter(),
    rogue: SampleCharacters.getRogue(),
    barbarian: SampleCharacters.getBarbarian(),
    cleric: SampleCharacters.getCleric(),
    multiclass: SampleCharacters.getMulticlass()
  };
  
  // Register all sample characters
  Object.values(sampleCharacters).forEach(character => {
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
      
      // Apply Power Attack for fighter and barbarian
      if (character.character?.classes?.some(c => ['fighter', 'barbarian'].includes(c.id))) {
        // Only apply if character doesn't already have it
        const hasPowerAttack = character.character?.feats?.some(f => f.id === 'feat.power_attack');
        if (!hasPowerAttack) {
          engine.activateFeature('feat.power_attack', character, { penalty: 1 });
        }
      }
      
      console.log(`Character ${character.name} initialized successfully`);
    } catch (error) {
      console.error(`Error initializing character ${character.name}:`, error);
    }
  });
  
  console.log('Loaded sample characters:', Object.keys(sampleCharacters));
  
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
    sampleCharacters
  };
} 