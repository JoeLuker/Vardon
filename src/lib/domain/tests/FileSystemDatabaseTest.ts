/**
 * Unix Database Test
 *
 * This module provides a Unix-style test runner for database capability tests.
 * It follows Unix principles of treating databases as files.
 */

import { runDatabaseCapabilityTest } from './DatabaseCapabilityTest';

/**
 * Main function to run the Unix-style database tests
 */
export async function main(): Promise<number> {
	try {
		console.group('=== Unix Database Tests ===');
		console.time('Database test time');

		const result = await runDatabaseCapabilityTest();
		console.log(result);

		console.timeEnd('Database test time');
		console.groupEnd();

		// Return process exit code (0 for success)
		return result.includes('failed') ? 1 : 0;
	} catch (error) {
		console.error('Unexpected error in database tests:', error);
		return 2;
	}
}

// Make it available globally for the console
(window as any).runUnixDatabaseTests = main;
