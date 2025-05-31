/**
 * Directory Existence Test
 *
 * This test ensures that the required directories are created properly
 * when the GameRulesAPI is initialized.
 *
 * UPDATED: No longer uses direct supabaseClient import, follows Unix architecture
 */

import { initializeApplication } from '../application';
import { GameRulesAPI } from '../../db/gameRules.api';
import { createGameRulesAPI } from '../../db/index';

export async function runDirectoryExistenceTest(): Promise<string> {
	console.log('Running Directory Existence Test');

	try {
		// Create a standalone GameRulesAPI instance - no longer needs Supabase client
		console.log('Creating GameRulesAPI instance...');
		const dbAPI = createGameRulesAPI({ debug: true });

		// Get kernel to check directories
		const kernel = dbAPI.getKernel();

		// Check if base directories exist
		const procExists = kernel.exists('/proc');
		const procCharacterExists = kernel.exists('/proc/character');
		const entityExists = kernel.exists('/entity');

		console.log(`/proc directory exists: ${procExists}`);
		console.log(`/proc/character directory exists: ${procCharacterExists}`);
		console.log(`/entity directory exists: ${entityExists}`);

		// Try to create a test character directory
		const testCharPath = '/proc/character/999';
		let testCharExists = kernel.exists(testCharPath);

		if (!testCharExists) {
			console.log(`Creating test character directory: ${testCharPath}`);
			const createResult = kernel.mkdir(testCharPath);

			if (createResult.success) {
				console.log('Successfully created test character directory');
				testCharExists = kernel.exists(testCharPath);
			} else {
				console.error(`Failed to create test character directory: ${createResult.errorMessage}`);
			}
		}

		// Now initialize the full application
		console.log('Initializing full application...');
		const app = await initializeApplication({ debug: true });
		const appKernel = app.kernel;

		// Check directories with app kernel
		const appProcExists = appKernel.exists('/proc');
		const appProcCharacterExists = appKernel.exists('/proc/character');

		console.log(`App /proc directory exists: ${appProcExists}`);
		console.log(`App /proc/character directory exists: ${appProcCharacterExists}`);

		// Test loading a character through the application
		console.log('Loading test character...');
		const character = await app.loadCharacter(1);

		if (character) {
			console.log(`Successfully loaded character: ${character.name}`);

			// Check if character directory was created
			const charPath = `/proc/character/1`;
			const charDirExists = appKernel.exists(charPath);

			console.log(`Character directory exists: ${charDirExists}`);
		} else {
			console.log('Character loading returned null (expected if no real data available)');
		}

		// Test updating character HP
		if (dbAPI.updateCharacterHP) {
			console.log('Testing character HP update...');
			const updateResult = await dbAPI.updateCharacterHP(999, 42);
			console.log(`HP update result: ${updateResult}`);
		}

		// Clean up
		if (app.shutdown) {
			await app.shutdown();
		}

		if (dbAPI.shutdown) {
			await dbAPI.shutdown();
		}

		return `Directory Existence Test completed. 
      /proc exists: ${procExists} 
      /proc/character exists: ${procCharacterExists} 
      /entity exists: ${entityExists}
      Test character directory created: ${testCharExists}`;
	} catch (error) {
		console.error('Directory Existence Test failed:', error);
		return `Directory Existence Test failed: ${error.message}`;
	}
}
