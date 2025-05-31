import { SupabaseStorageDriver } from './SupabaseDriver';

// Create a global modules object if it doesn't exist
if (typeof window !== 'undefined') {
	window.VardonModules = window.VardonModules || {};

	// Add our modules to the global object
	window.VardonModules.SupabaseDriver = {
		SupabaseStorageDriver
	};

	// Also expose the database test runner
	window.runDatabaseTests = async () => {
		try {
			// Dynamic import to avoid circular dependencies
			const DatabaseTest = await import('../../tests/DatabaseTest');
			DatabaseTest.runDatabaseTest();
		} catch (error) {
			console.error('Error running database tests:', error);
		}
	};

	console.log('Vardon modules initialized');
}

// Add type declaration for global modules
declare global {
	interface Window {
		VardonModules: {
			SupabaseDriver: {
				SupabaseStorageDriver: any;
			};
			[key: string]: any;
		};
		runDatabaseTests: () => Promise<void>;
	}
}
