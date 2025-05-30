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
import { supabaseClient } from '$lib/db/supabaseClient';

/**
 * Create a new database capability
 * @param options Options for the database capability
 * @returns A configured database capability
 */
export function createDatabaseCapability(options: DatabaseCapabilityOptions = {}): DatabaseCapability {
  // Extract debug setting to pass to driver
  const debug = options.debug || false;

  // Create driver with Supabase client
  // Note: We can't pass kernel yet because the DatabaseCapability hasn't been mounted
  // but we'll set it later in the onMount method
  const driver = new SupabaseDatabaseDriver(supabaseClient, null, debug);

  // Create capability with driver
  const capability = new DatabaseCapability({
    ...options,
    driver
  });

  // Override the onMount method to set the kernel in the driver
  const originalOnMount = capability.onMount;
  capability.onMount = function(kernel: any): void {
    // Call the original onMount method
    originalOnMount.call(this, kernel);

    // Set the kernel in the driver
    (driver as any).kernel = kernel;
    console.log('[DatabaseCapability] Driver kernel initialized');
  };

  return capability;
}