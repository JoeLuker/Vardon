/**
 * Capability System Tests
 *
 * This module demonstrates the Unix-style architecture of the capability system.
 * It shows how capabilities are composed together with explicit dependencies
 * and how plugins can use these capabilities to implement game features.
 */

import { Entity } from '../kernel/types';
// Import the composition-based providers (Unix-style)
import { createBonusCapability } from '../capabilities/bonus/BonusCapabilityComposed';
import { createAbilityCapability } from '../capabilities/ability/AbilityCapabilityComposed';
import { createSkillCapability } from '../capabilities/skill/SkillCapabilityComposed';

/**
 * Run a capability system test
 */
export async function runCapabilityTest() {
  console.log('=== Running Capability System Test ===');
  
  // Create a test entity
  const entity: Entity = {
    id: 'test-entity-1',
    type: 'character',
    name: 'Test Character',
    properties: {},
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    }
  };
  
  // Create the capability instances with explicit dependencies
  // Note how this follows the Unix philosophy of small, focused components
  // with explicit wiring between them
  
  // 1. Create the bonus capability (no dependencies)
  const bonusCapability = createBonusCapability({
    debug: true,
    stackSameType: false
  });
  
  // 2. Create the ability capability (depends on bonus capability)
  const abilityCapability = createAbilityCapability(
    bonusCapability,
    {
      debug: true,
      defaultAbilities: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
    }
  );
  
  // 3. Create the skill capability (depends on ability and bonus capabilities)
  const skillCapability = createSkillCapability(
    abilityCapability,
    bonusCapability,
    {
      debug: true,
      skills: [
        { id: 1, name: 'Acrobatics', abilityType: 'dexterity', isTrainedOnly: false, hasArmorCheckPenalty: true },
        { id: 2, name: 'Climb', abilityType: 'strength', isTrainedOnly: false, hasArmorCheckPenalty: true },
        { id: 3, name: 'Knowledge (Arcana)', abilityType: 'intelligence', isTrainedOnly: true, hasArmorCheckPenalty: false }
      ]
    }
  );
  
  // Initialize the capabilities
  console.log('\nInitializing capabilities...');
  bonusCapability.initialize?.(entity);
  abilityCapability.initialize?.(entity);
  skillCapability.initialize?.(entity);
  
  // Set up some base values
  console.log('\nSetting up test values...');
  abilityCapability.setAbilityScore(entity, 'strength', 14);
  abilityCapability.setAbilityScore(entity, 'dexterity', 16);
  abilityCapability.setAbilityScore(entity, 'intelligence', 12);
  
  skillCapability.setSkillRanks(entity, 1, 5); // Acrobatics
  skillCapability.setSkillRanks(entity, 3, 3); // Knowledge (Arcana)
  
  skillCapability.setClassSkill(entity, 1, true); // Acrobatics is a class skill
  
  // Apply some bonuses
  console.log('\nApplying bonuses...');
  abilityCapability.applyAbilityBonus(entity, 'dexterity', 2, 'enhancement', 'Cat\'s Grace');
  skillCapability.applySkillBonus(entity, 1, 2, 'competence', 'Skill Focus');
  
  // Show how different capabilities interact
  console.log('\n=== Test Results ===');
  
  // Get ability scores
  const strScore = abilityCapability.getAbilityScore(entity, 'strength');
  const dexScore = abilityCapability.getAbilityScore(entity, 'dexterity');
  const intScore = abilityCapability.getAbilityScore(entity, 'intelligence');
  
  console.log(`Strength: ${strScore} (Modifier: ${abilityCapability.getAbilityModifier(entity, 'strength')})`);
  console.log(`Dexterity: ${dexScore} (Modifier: ${abilityCapability.getAbilityModifier(entity, 'dexterity')})`);
  console.log(`Intelligence: ${intScore} (Modifier: ${abilityCapability.getAbilityModifier(entity, 'intelligence')})`);
  
  // Get skill bonuses
  const acrobatics = skillCapability.getSkillBreakdown(entity, 1);
  const climb = skillCapability.getSkillBreakdown(entity, 2);
  const knowledgeArcana = skillCapability.getSkillBreakdown(entity, 3);
  
  console.log('\nSkill Breakdowns:');
  console.log('Acrobatics:', JSON.stringify(acrobatics, null, 2));
  console.log('Climb:', JSON.stringify(climb, null, 2));
  console.log('Knowledge (Arcana):', JSON.stringify(knowledgeArcana, null, 2));
  
  // Demonstrate how an enhancment to ability flows to skills
  console.log('\nApplying an enhancement to Strength and observing effect on Climb:');
  console.log(`Before: Climb bonus = ${skillCapability.getSkillBonus(entity, 2)}`);
  
  abilityCapability.applyAbilityBonus(entity, 'strength', 4, 'enhancement', 'Bull\'s Strength');
  
  console.log(`After: Climb bonus = ${skillCapability.getSkillBonus(entity, 2)}`);
  console.log(`Strength is now ${abilityCapability.getAbilityScore(entity, 'strength')} (Modifier: ${abilityCapability.getAbilityModifier(entity, 'strength')})`);
  
  // Clean up
  console.log('\nShutting down capabilities...');
  await Promise.all([
    bonusCapability.shutdown?.(),
    abilityCapability.shutdown?.(),
    skillCapability.shutdown?.()
  ]);
  
  console.log('\n=== Capability Test Complete ===');
}

// Allow direct execution
if (require.main === module) {
  runCapabilityTest().catch(console.error);
}