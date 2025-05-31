// eslint.config.js
import globals from 'globals';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import sveltePlugin from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
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
			'no-var': 'error',

			// Prevent direct access to database client
			'no-restricted-properties': [
				'error',
				{
					object: 'gameRulesAPI',
					property: 'supabase',
					message:
						'Do not access supabase directly. Use kernel file operations (open, read, write, close) instead.'
				},
				{
					object: 'gameRulesAPI',
					property: 'originalClient',
					message:
						'Do not access the Supabase client directly. Use kernel file operations (open, read, write, close) instead.'
				}
			],

			// Ensure consistent method access patterns
			'no-restricted-syntax': [
				'error',
				{
					selector:
						"CallExpression[callee.object.name='abilityCapability'][callee.property.name='initializeAbilities']",
					message: "Do not use 'initializeAbilities'. Use 'initialize(entity)' instead."
				},
				{
					selector:
						"CallExpression[callee.object.name='skillCapability'][callee.property.name='initializeSkills']",
					message: "Do not use 'initializeSkills'. Use 'initialize(entity)' instead."
				},
				{
					selector:
						"CallExpression[callee.object.name='combatCapability'][callee.property.name='initializeCombatStats']",
					message: "Do not use 'initializeCombatStats'. Use 'initialize(entity)' instead."
				},
				{
					selector:
						"CallExpression[callee.object.name='gameRulesAPI'][callee.property.name='getInitialCharacterData']",
					message: "Do not use 'getInitialCharacterData'. Use 'getCompleteCharacterData' instead."
				},
				{
					selector:
						"CallExpression[callee.object.name='gameRulesAPI'][callee.property.name='getSupabaseClient']",
					message:
						'The getSupabaseClient() method has been removed. Use kernel file operations (open, read, write, close) instead.'
				},
				{
					selector: "ImportDeclaration[source.value='$lib/db/supabaseClient']",
					message:
						'Direct import of supabaseClient is not allowed. Use the Unix file operation methods instead.'
				}
			]
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
