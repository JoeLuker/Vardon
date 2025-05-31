/**
 * Plugin System Tests
 *
 * This module demonstrates the Unix-style architecture of the plugin system.
 * It shows how plugins can be registered, loaded and applied to entities.
 */

import type { Entity } from '../kernel/types';
import { createBonusCapability } from '../capabilities/bonus/BonusCapabilityComposed';
import { createAbilityCapability } from '../capabilities/ability/AbilityCapabilityComposed';
import { createSkillCapability } from '../capabilities/skill/SkillCapabilityComposed';
import { PluginManagerComposed } from '../plugins/PluginManagerComposed';
import { SkillFocusPlugin } from '../plugins/feats/SkillFocusPlugin';

/**
 * Run a plugin system test
 */
export async function runPluginTest() {
	console.log('=== Running Plugin System Test ===');

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

	// Create the plugin manager
	const pluginManager = new PluginManagerComposed({ debug: true });

	// Create and register capabilities
	console.log('\nRegistering capabilities...');

	// 1. Bonus capability (no dependencies)
	const bonusCapability = createBonusCapability({
		debug: true,
		stackSameType: false
	});
	pluginManager.registerCapability(bonusCapability);

	// 2. Ability capability (depends on bonus capability)
	const abilityCapability = createAbilityCapability(bonusCapability, {
		debug: true,
		defaultAbilities: [
			'strength',
			'dexterity',
			'constitution',
			'intelligence',
			'wisdom',
			'charisma'
		]
	});
	pluginManager.registerCapability(abilityCapability);

	// 3. Skill capability (depends on ability and bonus capabilities)
	const skillCapability = createSkillCapability(abilityCapability, bonusCapability, {
		debug: true,
		skills: [
			{
				id: 1,
				name: 'Acrobatics',
				abilityType: 'dexterity',
				isTrainedOnly: false,
				hasArmorCheckPenalty: true
			},
			{
				id: 2,
				name: 'Climb',
				abilityType: 'strength',
				isTrainedOnly: false,
				hasArmorCheckPenalty: true
			},
			{
				id: 3,
				name: 'Knowledge (Arcana)',
				abilityType: 'intelligence',
				isTrainedOnly: true,
				hasArmorCheckPenalty: false
			}
		]
	});
	pluginManager.registerCapability(skillCapability);

	// Create and register plugins
	console.log('\nRegistering plugins...');

	// Skill Focus plugin
	const skillFocusPlugin = new SkillFocusPlugin({
		name: 'Skill Focus',
		description: 'You are particularly adept at a specific skill.',
		prerequisites: 'None.',
		benefit:
			'You get a +3 bonus on all checks involving the chosen skill. If you have 10 or more ranks in that skill, this bonus increases to +6.',
		isRepeatable: true,
		debug: true
	});
	pluginManager.registerPlugin(skillFocusPlugin);

	// Initialize the entity
	console.log('\nInitializing entity...');
	pluginManager.initializeEntity(entity);

	// Set up some base values
	console.log('\nSetting up test values...');
	abilityCapability.setAbilityScore(entity, 'dexterity', 16);
	skillCapability.setSkillRanks(entity, 1, 5); // 5 ranks in Acrobatics

	// Check if we can apply the Skill Focus plugin
	console.log('\nChecking if we can apply Skill Focus plugin...');
	const canApply = pluginManager.canApplyPlugin(entity, 'skill-focus');
	console.log(
		`Can apply Skill Focus: ${canApply.valid}${canApply.reason ? ' - ' + canApply.reason : ''}`
	);

	if (canApply.valid) {
		// Apply the Skill Focus plugin to Acrobatics
		console.log('\nApplying Skill Focus to Acrobatics...');
		const result = pluginManager.applyPlugin(entity, 'skill-focus', { skillId: 1 }); // Acrobatics
		console.log('Apply result:', result);

		// Get the skill bonus after applying the feat
		const acrobaticsBeforeRankIncrease = skillCapability.getSkillBreakdown(entity, 1);
		console.log('\nAcrobatics after applying Skill Focus:');
		console.log(`Ranks: ${acrobaticsBeforeRankIncrease.ranks}`);
		console.log(`Total bonus: ${acrobaticsBeforeRankIncrease.total}`);
		console.log(`Bonus components:`, acrobaticsBeforeRankIncrease.otherBonuses.components);

		// Now increase the ranks to 10 and see how Skill Focus adapts
		console.log('\nIncreasing Acrobatics ranks to 10...');
		skillCapability.setSkillRanks(entity, 1, 10); // 10 ranks in Acrobatics

		// Apply Skill Focus again to update the bonus
		pluginManager.applyPlugin(entity, 'skill-focus', { skillId: 1 }); // Acrobatics

		// Get the skill bonus after increasing ranks
		const acrobaticsAfterRankIncrease = skillCapability.getSkillBreakdown(entity, 1);
		console.log('\nAcrobatics after increasing ranks to 10:');
		console.log(`Ranks: ${acrobaticsAfterRankIncrease.ranks}`);
		console.log(`Total bonus: ${acrobaticsAfterRankIncrease.total}`);
		console.log(`Bonus components:`, acrobaticsAfterRankIncrease.otherBonuses.components);

		// Now apply Skill Focus to a different skill since it's repeatable
		console.log('\nApplying Skill Focus to Knowledge (Arcana)...');
		const knowledgeSkillId = 3; // Knowledge (Arcana)
		const result2 = pluginManager.applyPlugin(entity, 'skill-focus', { skillId: knowledgeSkillId });
		console.log('Apply result:', result2);

		// Get all skills to see multiple Skill Focus feats in action
		const allSkills = skillCapability.getAllSkills(entity);
		console.log('\nAll skills after applying Skill Focus to multiple skills:');
		for (const [_, skill] of Object.entries(allSkills)) {
			console.log(`${skill.skillName}: Ranks ${skill.ranks}, Total ${skill.total}`);
			if (skill.otherBonuses.components.length > 0) {
				console.log(`  Bonuses: ${JSON.stringify(skill.otherBonuses.components)}`);
			}
		}

		// List all plugins registered
		console.log('\nRegistered plugins:');
		const allPlugins = pluginManager.getAllPluginMetadata();
		for (const plugin of allPlugins) {
			console.log(`- ${plugin.name} (${plugin.id}): ${plugin.description}`);
			console.log(`  Required capabilities: ${plugin.requiredCapabilities.join(', ')}`);
		}

		// List all capabilities registered
		console.log('\nRegistered capabilities:');
		const allCapabilities = pluginManager.getAllCapabilities();
		for (const capability of allCapabilities) {
			console.log(`- ${capability.id} (${capability.version})`);
		}
	}

	// Clean up
	console.log('\nShutting down plugin manager...');
	await pluginManager.shutdown();

	console.log('\n=== Plugin Test Complete ===');
}

// Allow direct execution
if (require.main === module) {
	runPluginTest().catch(console.error);
}
