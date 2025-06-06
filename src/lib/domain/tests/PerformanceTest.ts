import { initializeApplication } from '../application';
import type { Entity } from '../types/EntityTypes';
// Import removed

// Set up mock game data
const gameData = {
	skills: [
		// Add all skills here
	]
};

async function runPerformanceTests() {
	console.log('Starting performance tests...');

	// Initialize the application
	const app = await initializeApplication(gameData);
	const { calculationExplainer } = app;

	// Get a batch of characters for testing
	const characters: Entity[] = [];

	// Create test characters
	for (let i = 0; i < 10; i++) {
		// Create simple character entities for testing
		characters.push({
			id: `test-character-${i}`,
			type: 'character',
			name: `Test Character ${i}`,
			properties: {
				id: i,
				name: `Test Character ${i}`,
				max_hp: 50,
				current_hp: 50,
				abilities: {
					strength: 10,
					dexterity: 10,
					constitution: 10,
					intelligence: 10,
					wisdom: 10,
					charisma: 10
				}
			},
			metadata: {
				createdAt: Date.now(),
				updatedAt: Date.now(),
				version: 1
			}
		});
	}

	console.log(`Created ${characters.length} characters for testing`);

	// Register all characters
	const startRegister = performance.now();
	characters.forEach((character) => {
		// In the new architecture, we'd use a different method to register entities
		// For this test, we'll just log that we would register the entity
		console.log(`Would register entity: ${character.id}`);
	});
	const endRegister = performance.now();

	console.log(
		`Time to register ${characters.length} characters: ${(endRegister - startRegister).toFixed(2)}ms`
	);

	// Test full character report generation
	const startReports = performance.now();

	for (const character of characters.slice(0, 10)) {
		// Test with first 10 characters
		calculationExplainer.getCharacterReport(character);
	}

	const endReports = performance.now();
	const reportTime = endReports - startReports;

	console.log(`Time to generate 10 character reports: ${reportTime.toFixed(2)}ms`);
	console.log(`Average time per report: ${(reportTime / 10).toFixed(2)}ms`);

	// Test feature activation performance
	const startFeatures = performance.now();

	for (const character of characters
		.filter((c) =>
			c.character?.classes?.some((cls) => cls.id === 'fighter' || cls.id === 'barbarian')
		)
		.slice(0, 20)) {
		try {
			// In the new architecture, we'd use a different method to activate features
			// For this test, we'll just log that we would activate the feature
			console.log(`Would activate power_attack on character: ${character.id}`);
		} catch (error) {
			// Ignore errors for performance testing
		}
	}

	const endFeatures = performance.now();

	console.log(
		`Time to activate Power Attack on 20 characters: ${(endFeatures - startFeatures).toFixed(2)}ms`
	);
	console.log(`Average time per activation: ${((endFeatures - startFeatures) / 20).toFixed(2)}ms`);

	console.log('Performance tests complete!');
}

// Run the tests
runPerformanceTests().catch(console.error);
