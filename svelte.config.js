// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Specify Node.js runtime version for Vercel
			runtime: 'nodejs20.x',
			// Split configuration to avoid build-time issues
			split: true
		}),

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
