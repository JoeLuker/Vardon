/**
 * Supabase Client Module
 *
 * @deprecated Direct access to the Supabase client should be avoided.
 * Instead, use the GameRulesAPI or Unix-style file operations.
 *
 * Example usage with Unix architecture:
 * const kernel = new GameKernel();
 * const fd = kernel.open('/proc/character/1', OpenMode.READ);
 * const [result, data] = kernel.read(fd);
 * kernel.close(fd);
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

// Export for internal module use only
export { supabaseClient };
