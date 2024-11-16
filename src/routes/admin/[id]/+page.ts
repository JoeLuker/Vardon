import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) {
        throw error(400, 'Invalid character ID');
    }
    return {};
}; 