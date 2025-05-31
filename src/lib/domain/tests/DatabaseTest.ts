/**
 * Database Integration Testing Utility
 *
 * This file provides utilities for testing the data flow between the database and UI components
 * in the Unix-inspired architecture.
 */

import { initializeApplication } from '../application';
import type { GameRulesAPI, CompleteCharacter } from '$lib/db/gameRules.api';
import type { Entity } from '../types/EntityTypes';
import type { AssembledCharacter } from '../character/characterTypes';

/**
 * Test the complete data flow from database to UI components
 */
export async function testDatabaseToUIFlow(): Promise<void> {
	console.log('Starting Database to UI Flow Test');

	// Initialize application
	const app = initializeApplication({});
	const { gameAPI, characterAssembler, engine } = app;

	try {
		// Step 1: Load characters from database
		console.log('Step 1: Loading characters from database');
		const characters = await loadCharactersFromDatabase(gameAPI);
		if (characters.length === 0) {
			console.log('No characters found in database. Test cannot continue.');
			return;
		}

		console.log(`Found ${characters.length} characters in database`);

		// Step 2: Process each character through the assembler
		console.log('Step 2: Processing characters through assembler');
		const results = await processCharacters(characters, characterAssembler);

		// Step 3: Analyze results
		console.log('Step 3: Analyzing assembly results');
		analyzeResults(results);

		// Step 4: Test feature activation/deactivation
		if (results.length > 0) {
			console.log('Step 4: Testing feature activation/deactivation');
			await testFeatureToggling(results[0].entity, engine);
		}

		console.log('Database to UI Flow Test completed successfully');
	} catch (error) {
		console.error('Error in Database to UI Flow Test:', error);
	}
}

/**
 * Load all characters from the database
 */
async function loadCharactersFromDatabase(gameAPI: GameRulesAPI): Promise<CompleteCharacter[]> {
	// Get all character IDs
	const { data: characterData } = await gameAPI.supabase
		.from('game_character')
		.select('id, name')
		.limit(5); // Limit to 5 for testing purposes

	if (!characterData || characterData.length === 0) {
		return [];
	}

	// Load complete data for each character
	const characterPromises = characterData.map((char) => gameAPI.getCompleteCharacterData(char.id));

	const characters = await Promise.all(characterPromises);
	return characters.filter((char): char is CompleteCharacter => char !== null);
}

/**
 * Process characters through the assembler
 */
async function processCharacters(
	characters: CompleteCharacter[],
	characterAssembler: any
): Promise<{ character: CompleteCharacter; assembled: AssembledCharacter; entity: Entity }[]> {
	const results = [];

	for (const character of characters) {
		console.log(`Processing character: ${character.name} (ID: ${character.id})`);

		try {
			// Create the assembled character
			const assembled = await characterAssembler.assembleCharacter(character);

			// Get the entity from the engine
			const entityId = character.id.toString();
			const entity = characterAssembler.engine.getEntity(entityId);

			if (!entity) {
				console.warn(`Entity not found for character ${character.name} (ID: ${character.id})`);
				continue;
			}

			results.push({ character, assembled, entity });
			console.log(`Successfully processed character: ${character.name}`);
		} catch (error) {
			console.error(`Error processing character ${character.name} (ID: ${character.id}):`, error);
		}
	}

	return results;
}

/**
 * Analyze assembly results
 */
function analyzeResults(
	results: { character: CompleteCharacter; assembled: AssembledCharacter; entity: Entity }[]
): void {
	if (results.length === 0) {
		console.log('No results to analyze');
		return;
	}

	console.log(`Analyzing ${results.length} results`);

	for (const { character, assembled, entity } of results) {
		console.log(`\nAnalysis for character: ${character.name} (ID: ${character.id})`);

		// Check if abilities were processed correctly
		checkAbilities(character, assembled, entity);

		// Check if skills were processed correctly
		checkSkills(character, assembled, entity);

		// Check if features were processed correctly
		checkFeatures(character, entity);

		// Check if classes were processed correctly
		checkClasses(character, assembled, entity);

		console.log(`Analysis complete for ${character.name}`);
	}
}

/**
 * Check if abilities were processed correctly
 */
function checkAbilities(
	character: CompleteCharacter,
	assembled: AssembledCharacter,
	entity: Entity
): void {
	console.log('Checking abilities:');

	if (!character.game_character_ability || character.game_character_ability.length === 0) {
		console.log('  No abilities found in character data');
		return;
	}

	let abilitiesFound = 0;
	let abilitiesMatched = 0;

	for (const abilityData of character.game_character_ability) {
		if (!abilityData.ability) continue;

		const abilityName = abilityData.ability.name.toLowerCase();
		const abilityValue = abilityData.value;

		abilitiesFound++;

		// Check if the assembled character has this ability
		if (assembled[abilityName as keyof AssembledCharacter]) {
			const assembledAbility = assembled[abilityName as keyof AssembledCharacter] as any;
			const entityAbility = entity.character?.abilities?.[abilityName];

			console.log(
				`  ${abilityName}: DB=${abilityValue}, Assembled=${assembledAbility.total}, Entity=${entityAbility}`
			);

			if (entityAbility === abilityValue) {
				abilitiesMatched++;
			}
		} else {
			console.log(`  ${abilityName}: Not found in assembled character`);
		}
	}

	console.log(`  Abilities matched: ${abilitiesMatched}/${abilitiesFound}`);
}

/**
 * Check if skills were processed correctly
 */
function checkSkills(
	character: CompleteCharacter,
	assembled: AssembledCharacter,
	entity: Entity
): void {
	console.log('Checking skills:');

	if (!character.game_character_skill_rank || character.game_character_skill_rank.length === 0) {
		console.log('  No skills found in character data');
		return;
	}

	// Group skills by skill ID
	const skillRanks = new Map<number, number>();
	for (const rankData of character.game_character_skill_rank) {
		const skillId = rankData.skill_id;
		skillRanks.set(skillId, (skillRanks.get(skillId) || 0) + 1);
	}

	console.log(`  Found ${skillRanks.size} skills with ranks in character data`);

	// Check if the assembled character has these skills
	if (!assembled.skills) {
		console.log('  No skills found in assembled character');
		return;
	}

	// Check if entity has skill data
	if (!entity.character?.skills) {
		console.log('  No skills found in entity');
		return;
	}

	// Count matched skills
	let matchedSkillCount = 0;

	for (const [skillId, ranks] of skillRanks.entries()) {
		if (assembled.skills[skillId]) {
			const skillName =
				character.game_character_skill_rank?.find((rank) => rank.skill_id === skillId)?.skill
					?.name || `Skill ${skillId}`;

			console.log(
				`  ${skillName} (ID: ${skillId}): Ranks=${ranks}, Entity ranks=${entity.character.skills[skillName.toLowerCase()]?.ranks || 0}`
			);

			if (entity.character.skills[skillName.toLowerCase()]?.ranks === ranks) {
				matchedSkillCount++;
			}
		}
	}

	console.log(`  Skills matched: ${matchedSkillCount}/${skillRanks.size}`);
}

/**
 * Check if features were processed correctly
 */
function checkFeatures(character: CompleteCharacter, entity: Entity): void {
	console.log('Checking features:');

	// Count expected features
	const featCount = character.game_character_feat?.length || 0;
	const classFeatureCount = character.game_character_class_feature?.length || 0;
	const traitCount = character.game_character_ancestry_trait?.length || 0;

	console.log(
		`  Expected features: ${featCount} feats, ${classFeatureCount} class features, ${traitCount} traits`
	);

	// Count active features
	const activeFeatureCount = entity.activeFeatures?.length || 0;
	console.log(`  Active features in entity: ${activeFeatureCount}`);

	if (entity.activeFeatures && entity.activeFeatures.length > 0) {
		console.log('  Active features:');
		entity.activeFeatures.forEach((feature) => {
			console.log(`    ${feature.path} (active: ${feature.active})`);
		});
	}
}

/**
 * Check if classes were processed correctly
 */
function checkClasses(
	character: CompleteCharacter,
	assembled: AssembledCharacter,
	entity: Entity
): void {
	console.log('Checking classes:');

	if (!character.game_character_class || character.game_character_class.length === 0) {
		console.log('  No classes found in character data');
		return;
	}

	console.log(`  Found ${character.game_character_class.length} classes in character data`);

	// Check if the entity has these classes
	if (!entity.character?.classes) {
		console.log('  No classes found in entity');
		return;
	}

	// Count matched classes
	let matchedClassCount = 0;

	for (const classData of character.game_character_class) {
		if (!classData.class) continue;

		const className = classData.class.name;
		const classLevel = classData.level || 0;

		const entityClass = entity.character.classes.find(
			(c) => c.name.toLowerCase() === className.toLowerCase()
		);

		if (entityClass) {
			console.log(`  ${className}: Level=${classLevel}, Entity level=${entityClass.level}`);

			if (entityClass.level === classLevel) {
				matchedClassCount++;
			}
		} else {
			console.log(`  ${className}: Not found in entity`);
		}
	}

	console.log(`  Classes matched: ${matchedClassCount}/${character.game_character_class.length}`);
	console.log(
		`  Total level: DB=${character.game_character_class.reduce((sum, c) => sum + (c.level || 0), 0)}, Assembled=${assembled.totalLevel}`
	);
}

/**
 * Test feature activation/deactivation
 */
async function testFeatureToggling(entity: Entity, engine: any): Promise<void> {
	console.log('Testing feature toggling:');

	// Find an active feature to test
	const activeFeature = entity.activeFeatures?.find((f) => f.active);

	if (!activeFeature) {
		console.log('  No active features found to test toggles');
		return;
	}

	const featurePath = activeFeature.path;
	console.log(`  Testing feature: ${featurePath}`);

	// Get current state
	console.log(`  Initial state: ${activeFeature.active ? 'active' : 'inactive'}`);

	try {
		// Deactivate feature
		console.log('  Deactivating feature...');
		engine.deactivateFeature(featurePath, entity);

		// Check if feature was deactivated
		const featureAfterDeactivate = entity.activeFeatures?.find((f) => f.path === featurePath);
		console.log(`  After deactivation: ${featureAfterDeactivate?.active ? 'active' : 'inactive'}`);

		// Reactivate feature
		console.log('  Reactivating feature...');
		engine.activateFeature(featurePath, entity);

		// Check if feature was reactivated
		const featureAfterReactivate = entity.activeFeatures?.find((f) => f.path === featurePath);
		console.log(`  After reactivation: ${featureAfterReactivate?.active ? 'active' : 'inactive'}`);

		console.log('  Feature toggling test completed successfully');
	} catch (error) {
		console.error('  Error during feature toggling test:', error);
	}
}

// Export a function to run the test from the console
export function runDatabaseTest(): void {
	testDatabaseToUIFlow()
		.then(() => console.log('Database test complete'))
		.catch((error) => console.error('Database test failed:', error));
}

// We no longer need to expose this directly here
// The ModuleInit.ts file will handle making the function globally available
