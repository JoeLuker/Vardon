// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib')
		},
		extensions: ['.js', '.ts']
	},
	server: {
		port: 5173,
		strictPort: false, // Allow fallback to another port if 5173 is taken
		host: true, // Listen on all addresses, including LAN and public addresses
		open: false // Don't open the browser automatically
	}
});
