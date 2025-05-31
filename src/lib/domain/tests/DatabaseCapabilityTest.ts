/**
 * Database Capability Integration Test
 *
 * This module tests the integration of the Database Capability with the application.
 * It follows Unix principles by treating database access as file operations.
 */

import { initializeApplication } from '../application';
import { createDatabaseCapability } from '../capabilities/database';
import { OpenMode, ErrorCode } from '../kernel/types';

/**
 * Run the database capability test
 * @returns Test result message
 */
export async function runDatabaseCapabilityTest(): Promise<string> {
	console.log('Running Database Capability Integration Test');

	// Initialize application with debug mode
	const app = await initializeApplication({ debug: true });

	try {
		const kernel = app.kernel;
		const dbAPI = app.dbAPI;

		// Test 1: Verify that database capability is mounted
		console.log('Test 1: Verify Database Capability is mounted');
		const dbCapability = kernel.getCapability('database');
		if (!dbCapability) {
			throw new Error('Database capability not found in kernel');
		}
		console.log('Database capability is mounted');

		// Test 2: Test access to abilities through database capability
		console.log('Test 2: Access abilities through database capability');
		const abilitiesPath = '/db/ability/all';
		const abilitiesFd = kernel.open(abilitiesPath, OpenMode.READ);
		if (abilitiesFd < 0) {
			throw new Error(`Failed to open abilities path: ${abilitiesPath}`);
		}

		try {
			// Read the abilities
			const buffer: any = {};
			const [result] = kernel.read(abilitiesFd, buffer);

			if (result !== 0) {
				throw new Error(`Failed to read abilities: ${result}`);
			}

			console.log(`Successfully read ${Array.isArray(buffer) ? buffer.length : 0} abilities`);

			// Verify the structure
			if (!Array.isArray(buffer)) {
				throw new Error('Expected abilities to be an array');
			}

			// Check if we have at least the core abilities
			const coreAbilityNames = [
				'strength',
				'dexterity',
				'constitution',
				'intelligence',
				'wisdom',
				'charisma'
			];
			const abilityNames = buffer.map((ability: any) => ability.name.toLowerCase());

			for (const coreName of coreAbilityNames) {
				if (!abilityNames.includes(coreName)) {
					throw new Error(`Core ability ${coreName} not found in abilities`);
				}
			}

			console.log('All core abilities found');
		} finally {
			// Always close the file descriptor
			kernel.close(abilitiesFd);
		}

		// Test 3: Test access to skills through database capability
		console.log('Test 3: Access skills through database capability');
		const skillsPath = '/db/skill/all';
		const skillsFd = kernel.open(skillsPath, OpenMode.READ);
		if (skillsFd < 0) {
			throw new Error(`Failed to open skills path: ${skillsPath}`);
		}

		try {
			// Read the skills
			const buffer: any = {};
			const [result] = kernel.read(skillsFd, buffer);

			if (result !== 0) {
				throw new Error(`Failed to read skills: ${result}`);
			}

			console.log(`Successfully read ${Array.isArray(buffer) ? buffer.length : 0} skills`);

			// Verify the structure
			if (!Array.isArray(buffer)) {
				throw new Error('Expected skills to be an array');
			}

			// Check if we have at least one core skill
			const coreSkillNames = ['acrobatics', 'stealth', 'perception'];
			const skillNames = buffer.map((skill: any) => skill.name.toLowerCase());

			let foundSkill = false;
			for (const coreName of coreSkillNames) {
				if (skillNames.includes(coreName)) {
					foundSkill = true;
					break;
				}
			}

			if (!foundSkill) {
				throw new Error(`No core skills found in skills list`);
			}

			console.log('Core skills found');
		} finally {
			// Always close the file descriptor
			kernel.close(skillsFd);
		}

		// Test 4: Create a test character with file operations
		console.log('Test 4: Create a test character with file operations');
		const characterPath = '/db/character/test';

		// First check if it exists
		if (await checkPathExists(kernel, characterPath)) {
			console.log('Test character already exists, deleting...');
			// Delete existing character
			const result = kernel.unlink(characterPath);
			if (result !== 0) {
				throw new Error(`Failed to delete existing test character: ${result}`);
			}
		}

		// Create character file
		const characterData = {
			id: 'test',
			name: 'Integration Test Character',
			level: 1,
			max_hp: 10,
			current_hp: 10,
			properties: {
				abilities: {
					strength: 10,
					dexterity: 12,
					constitution: 14,
					intelligence: 16,
					wisdom: 8,
					charisma: 10
				}
			}
		};

		const createResult = kernel.create(characterPath, characterData);
		if (!createResult.success) {
			throw new Error(`Failed to create test character: ${createResult.errorMessage}`);
		}

		console.log('Test character created');

		// Read the character back
		const characterFd = kernel.open(characterPath, OpenMode.READ);
		if (characterFd < 0) {
			throw new Error(`Failed to open test character: ${characterFd}`);
		}

		try {
			// Read the character
			const buffer: any = {};
			const [result] = kernel.read(characterFd, buffer);

			if (result !== 0) {
				throw new Error(`Failed to read test character: ${result}`);
			}

			// Verify the data
			if (buffer.name !== 'Integration Test Character') {
				throw new Error(`Character name mismatch: ${buffer.name}`);
			}

			console.log('Test character read successfully');
		} finally {
			// Always close the file descriptor
			kernel.close(characterFd);
		}

		// Test 5: Update the test character
		console.log('Test 5: Update the test character');
		const updateFd = kernel.open(characterPath, OpenMode.READ_WRITE);
		if (updateFd < 0) {
			throw new Error(`Failed to open test character for update: ${updateFd}`);
		}

		try {
			// Read the current character
			const buffer: any = {};
			const [readResult] = kernel.read(updateFd, buffer);

			if (readResult !== 0) {
				throw new Error(`Failed to read test character for update: ${readResult}`);
			}

			// Update the character
			buffer.current_hp = 5;
			buffer.properties.abilities.strength = 12;

			// Write the updated character
			const writeResult = kernel.write(updateFd, buffer);

			if (writeResult !== 0) {
				throw new Error(`Failed to write updated test character: ${writeResult}`);
			}

			console.log('Test character updated successfully');
		} finally {
			// Always close the file descriptor
			kernel.close(updateFd);
		}

		// Read the character again to verify update
		const verifyFd = kernel.open(characterPath, OpenMode.READ);
		if (verifyFd < 0) {
			throw new Error(`Failed to open test character for verification: ${verifyFd}`);
		}

		try {
			// Read the character
			const buffer: any = {};
			const [result] = kernel.read(verifyFd, buffer);

			if (result !== 0) {
				throw new Error(`Failed to read test character for verification: ${result}`);
			}

			// Verify the updated data
			if (buffer.current_hp !== 5) {
				throw new Error(`Character HP not updated: ${buffer.current_hp}`);
			}

			if (buffer.properties.abilities.strength !== 12) {
				throw new Error(`Character strength not updated: ${buffer.properties.abilities.strength}`);
			}

			console.log('Test character update verified');
		} finally {
			// Always close the file descriptor
			kernel.close(verifyFd);
		}

		// Clean up - delete test character
		console.log('Cleaning up test character');
		const deleteResult = kernel.unlink(characterPath);
		if (deleteResult !== 0) {
			throw new Error(`Failed to delete test character: ${deleteResult}`);
		}

		return 'Database Capability Integration Test completed successfully';
	} catch (error) {
		console.error('Database Capability Integration Test failed:', error);
		return `Database Capability Integration Test failed: ${error.message}`;
	} finally {
		// Clean up
		if (app.shutdown) {
			await app.shutdown();
		}
	}
}

/**
 * Check if a path exists
 * @param kernel Kernel instance
 * @param path Path to check
 * @returns True if path exists, false otherwise
 */
async function checkPathExists(kernel: any, path: string): Promise<boolean> {
	try {
		const fd = kernel.open(path, OpenMode.READ);
		if (fd < 0) {
			return false;
		}
		kernel.close(fd);
		return true;
	} catch {
		return false;
	}
}
