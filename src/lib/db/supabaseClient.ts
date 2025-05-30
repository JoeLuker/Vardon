/**
 * Internal Supabase Client Module - FOR INTERNAL USE ONLY
 *
 * @deprecated Direct access to the Supabase client is not supported.
 * This module should ONLY be used by internal implementation of the database capability.
 * All application code should use Unix-style file operations.
 *
 * Correct Unix architecture usage:
 * const kernel = new GameKernel();
 * const fd = kernel.open('/proc/character/1', OpenMode.READ);
 * const buffer = {};
 * const [result] = kernel.read(fd, buffer);
 * kernel.close(fd);
 *
 * DO NOT IMPORT THIS MODULE DIRECTLY IN APPLICATION CODE!
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/domain/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Missing Supabase environment variables');
}

// Internal client instance for GameRulesAPI
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
	db: {
		schema: 'public'
	},
	realtime: {
		params: {
			eventsPerSecond: 10,
			heartbeat_interval_ms: 60000 // Configure longer heartbeat interval
		}
	},
	auth: {
		persistSession: true,
		autoRefreshToken: true
	}
});

// Export for internal module use only - DO NOT IMPORT THIS IN APPLICATION CODE
// This is only used by the database driver implementation
export { supabaseClient };
