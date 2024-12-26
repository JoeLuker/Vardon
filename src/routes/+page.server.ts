import { supabase } from '$lib/db/supabaseClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const { data: characters, error } = await supabase
        .from('characters')
        .select('id, name, class, ancestry, level')
        .order('updated_at', { ascending: false });

    if (error) {
        throw error;
    }

    return {
        characters
    };
};