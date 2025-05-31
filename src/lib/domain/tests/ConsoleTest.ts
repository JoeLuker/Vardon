import { initializeUnixApplication } from '../unix-application';
import type { AbilityCapability } from '../capabilities/ability/types';

// Initialize the application with Unix architecture
console.log('Initializing Unix application...');
let app;

async function init() {
	try {
		// Enable debug mode for detailed logging
		app = await initializeUnixApplication({ debug: true });

		// Extract components
		const { gameAPI } = app;

		// Test character loading
		console.log('\n=== Testing Character Loading ===');
		try {
			const characterId = 1; // Example character ID
			const character = await gameAPI.loadCharacter(characterId);

			if (!character) {
				console.log('Character not found');
				return;
			}

			console.log(`Loaded character: ${character.name}`);

			// Get ability scores using the ability capability
			const abilityCapability = gameAPI.getCapability('ability') as AbilityCapability;

			if (abilityCapability) {
				// Show all abilities
				console.log('\n=== Character Abilities ===');
				const standardAbilities = [
					'strength',
					'dexterity',
					'constitution',
					'intelligence',
					'wisdom',
					'charisma'
				];
				standardAbilities.forEach((ability) => {
					const abilityValue = abilityCapability.getAbilityBreakdown(character, ability);
					console.log(`${ability}: ${abilityValue.total} (Modifier: ${abilityValue.modifier})`);
				});
			}

			// Test Power Attack
			console.log('\n=== Testing Power Attack ===');
			try {
				const result = gameAPI.applyPlugin(characterId, 'power_attack', { penalty: 2 });
				console.log('Power Attack activated with result:', result);
			} catch (error) {
				console.error('Error testing Power Attack:', error);
			}
		} catch (error) {
			console.error('Error loading character:', error);
		}

		console.log('\n=== Testing Complete ===');
	} catch (error) {
		console.error('Error initializing application:', error);
	}
}

// Run the async initialization
init().catch((error) => {
	console.error('Unhandled error during initialization:', error);
});

// Export function to run database tests
export function runDatabaseTestsFromConsole(): void {
	// Import dynamically to avoid circular dependencies
	import('./DatabaseTest')
		.then((module) => {
			module.runDatabaseTest();
		})
		.catch((error) => {
			console.error('Error running database tests:', error);
		});
}

// Export function to run Unix character tests
export function runUnixCharacterTestFromConsole(): void {
	// Import dynamically to avoid circular dependencies
	import('./UnixCharacterTest')
		.then((module) => {
			module.runUnixCharacterTest();
		})
		.catch((error) => {
			console.error('Error running Unix character test:', error);
		});
}

// Export function to run Unix architecture tests
export function runUnixArchitectureTestFromConsole(): void {
	// Import dynamically to avoid circular dependencies
	import('./UnixArchitectureTest')
		.then((module) => {
			module.runUnixArchitectureTest();
		})
		.catch((error) => {
			console.error('Error running Unix architecture test:', error);
		});
}

// Export function to run all Unix tests
export function runUnixTestsFromConsole(suites?: string[]): void {
	// Import dynamically to avoid circular dependencies
	import('./UnixTestRunner')
		.then((module) => {
			module.runUnixTests(suites);
		})
		.catch((error) => {
			console.error('Error running Unix tests:', error);
		});
}

// Make functions available globally for the console
// 'as any' is needed here because we're dynamically adding properties to the window object
// which TypeScript doesn't know about at compile time
(window as any).runDatabaseTests = runDatabaseTestsFromConsole;
(window as any).runUnixCharacterTest = runUnixCharacterTestFromConsole;
(window as any).runUnixArchitectureTest = runUnixArchitectureTestFromConsole;
(window as any).runUnixTests = runUnixTestsFromConsole;
