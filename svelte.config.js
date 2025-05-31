// svelte.config.js
import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),

		// Set paths relative to the base path
		paths: {
			base: ''
		},

		// Define path aliases (replacing the baseUrl and paths in tsconfig.json)
		alias: {
			$lib: './src/lib'
		}
	}
};

export default config;
