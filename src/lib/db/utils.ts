import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export function unwatchChannel(channel: RealtimeChannel) {
	supabase.removeChannel(channel);
}
