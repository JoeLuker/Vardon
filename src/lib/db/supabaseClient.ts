/**
 * Internal Supabase Client Module - FOR INTERNAL USE ONLY
 *
 * @deprecated Direct access to the Supabase client is not supported.
 * This module should ONLY be used by internal implementation of the database capability.
 * All application code should use Unix-style file operations.
 *
 * Correct Unix architecture usage:
 * const kernel = new GameKernel();
 * const fd = kernel.open('/v_proc/character/1', OpenMode.READ);
 * const buffer = {};
 * const [result] = kernel.read(fd, buffer);
 * kernel.close(fd);
 *
 * DO NOT IMPORT THIS MODULE DIRECTLY IN APPLICATION CODE!
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/domain/types/supabase';

// Handle both browser (Vite) and Node.js (SSR) environments
const supabaseUrl =
	typeof import.meta.env !== 'undefined'
		? import.meta.env.VITE_SUPABASE_URL
		: process.env.VITE_SUPABASE_URL;

const supabaseAnonKey =
	typeof import.meta.env !== 'undefined'
		? import.meta.env.VITE_SUPABASE_ANON_KEY
		: process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	console.error('Supabase environment variables missing:', {
		url: !!supabaseUrl,
		key: !!supabaseAnonKey,
		env: typeof import.meta.env !== 'undefined' ? 'Vite' : 'Node'
	});
	throw new Error(
		'Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
	);
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
