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
import { GameAPI } from './core/GameAPI';
import { SampleCharacters } from './config/SampleCharacters';

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
  
  const skillSubsystem = new SkillSubsystemImpl(gameData);
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
  
  // Create the GameAPI for external systems
  const gameAPI = new GameAPI(
    engine,
    featureRegistry,
    sessionState,
    characterStore,
    calculationExplainer
  );
  
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
    
    // Try to apply some initial features based on character type
    try {
      // Apply Power Attack for fighter and barbarian
      if (character.character?.classes?.some(c => ['fighter', 'barbarian'].includes(c.id))) {
        engine.activateFeature('feat.power_attack', character, { penalty: 1 });
      }
      
      // Apply Weapon Focus for fighter
      if (character.character?.classes?.some(c => c.id === 'fighter')) {
        // Assuming the character already has Weapon Focus in their feats
        const weaponType = character.character?.feats?.find(f => f.id === 'feat.weapon_focus')?.options?.weaponType || 'longsword';
        engine.activateFeature('feat.weapon_focus', character, { weaponType });
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