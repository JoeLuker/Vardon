import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/domain/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
