/**
 * Database Capability Index
 *
 * This module exports the database capability components for use in the application.
 */

// Export the database driver interface and implementations
export * from './DatabaseDriver';
export * from './SupabaseDatabaseDriver';

// Export the schema descriptor types and utilities
export * from './SchemaDescriptor';

// Export the main database capability
export * from './DatabaseCapability';

// Export a convenience function to create a DatabaseCapability
import { DatabaseCapability, type DatabaseCapabilityOptions } from './DatabaseCapability';
import { SupabaseDatabaseDriver } from './SupabaseDatabaseDriver';
import { logger } from '$lib/utils/Logger';

// Import Supabase client at module level to ensure it's available
let cachedSupabaseClient: any = null;

/**
 * Initialize the Supabase client asynchronously
 */
async function getSupabaseClient() {
	if (cachedSupabaseClient) {
		return cachedSupabaseClient;
	}
	
	try {
		const module = await import('$lib/db/supabaseClient');
		cachedSupabaseClient = module.supabaseClient;
		logger.info('DatabaseCapability', 'getSupabaseClient', 'Successfully imported Supabase client');
		return cachedSupabaseClient;
	} catch (error) {
		logger.error('DatabaseCapability', 'getSupabaseClient', 'Failed to import Supabase client', { error });
		return null;
	}
}

/**
 * Create a new database capability
 * @param options Options for the database capability
 * @returns A configured database capability
 */
export function createDatabaseCapability(
	options: DatabaseCapabilityOptions = {}
): DatabaseCapability {
	// Extract debug setting to pass to driver
	const debug = options.debug || false;

	// Create driver with null client initially - it will be set later
	const driver = new SupabaseDatabaseDriver(null, null, debug);

	// Create capability with driver
	const capability = new DatabaseCapability({
		...options,
		driver
	});

	// Override the onMount method to set the kernel in the driver
	const originalOnMount = capability.onMount;
	capability.onMount = async function (kernel: any): Promise<void> {
		// Call the original onMount method
		originalOnMount.call(this, kernel);

		// Set the kernel in the driver
		(driver as any).kernel = kernel;
		
		// Try to get and set the Supabase client
		const client = await getSupabaseClient();
		if (client) {
			(driver as any)._client = client;
			logger.info('DatabaseCapability', 'onMount', 'Driver kernel and client initialized');
		} else {
			logger.warn('DatabaseCapability', 'onMount', 'Driver kernel initialized but client not available');
		}
	};

	return capability;
}
