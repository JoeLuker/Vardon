import globals from 'globals';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import sveltePlugin from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	// Base JavaScript configuration
	js.configs.recommended,

	// Stylistic rules
	{
		plugins: { '@stylistic': stylistic },
		rules: {
			'@stylistic/semi': ['error', 'always'],
			'@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
			'@stylistic/comma-dangle': ['error', 'never']
		}
	},

	// Svelte configuration
	{
		files: ['**/*.svelte'],
		...sveltePlugin.configs['flat/recommended'],
		rules: {
			'svelte/valid-compile': 'error',
			'svelte/no-dupe-style-properties': 'error',
			'svelte/no-unused-svelte-ignore': 'error',
			'svelte/html-quotes': ['error', { prefer: 'single' }],
			'svelte/spaced-html-comment': 'error',
			'svelte/no-inner-declarations': 'error'
		}
	},

	// Global variables
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021
			},
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module'
			}
		}
	},

	// Project-specific rules
	{
		rules: {
			'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'no-debugger': 'warn',
			'prefer-const': 'error',
			'no-var': 'error'
		}
	},

	// Prettier integration (should be last)
	prettier,
	sveltePlugin.configs['flat/prettier'],

	// Ignore patterns
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'node_modules/',
			'dist/',
			'coverage/',
			'*.config.js',
			'vite.config.*.timestamp-*'
		]
	}
];
