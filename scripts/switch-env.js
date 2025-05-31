#!/usr/bin/env node

/**
 * Environment Switcher for Vardon
 *
 * Usage:
 *   npm run env:local     # Switch to local development
 *   npm run env:prod      # Switch to production
 *   npm run env:status    # Show current environment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const envFile = path.join(projectRoot, '.env');
const localEnvFile = path.join(projectRoot, '.env.local');
const prodEnvFile = path.join(projectRoot, '.env.production');

function getCurrentEnv() {
	if (!fs.existsSync(envFile)) {
		return 'none';
	}

	const envContent = fs.readFileSync(envFile, 'utf8');

	if (envContent.includes('127.0.0.1:54321')) {
		return 'local';
	} else if (envContent.includes('pxosfkpgsqkkfhtfkdog.supabase.co')) {
		return 'production';
	}

	return 'unknown';
}

function switchToLocal() {
	if (!fs.existsSync(localEnvFile)) {
		console.error('❌ .env.local file not found!');
		process.exit(1);
	}

	fs.copyFileSync(localEnvFile, envFile);
	console.log('✅ Switched to local development environment');
	console.log('   Database: Local Supabase (127.0.0.1:54321)');
	console.log('   Make sure your local Supabase is running: supabase start');
}

function switchToProduction() {
	if (!fs.existsSync(prodEnvFile)) {
		console.error('❌ .env.production file not found!');
		process.exit(1);
	}

	fs.copyFileSync(prodEnvFile, envFile);
	console.log('✅ Switched to production environment');
	console.log('   Database: Production Supabase (pxosfkpgsqkkfhtfkdog.supabase.co)');
	console.log('   ⚠️  BE CAREFUL - You are now working with PRODUCTION data!');
}

function showStatus() {
	const currentEnv = getCurrentEnv();

	console.log('🔍 Current Environment Status:');
	console.log('='.repeat(40));

	switch (currentEnv) {
		case 'local':
			console.log('📍 Environment: LOCAL DEVELOPMENT');
			console.log('🗄️  Database: Local Supabase (127.0.0.1:54321)');
			console.log('✅ Safe for development');
			break;

		case 'production':
			console.log('📍 Environment: PRODUCTION');
			console.log('🗄️  Database: Production Supabase (pxosfkpgsqkkfhtfkdog.supabase.co)');
			console.log('⚠️  CAUTION: Working with live data');
			break;

		case 'none':
			console.log('📍 Environment: NO .env FILE');
			console.log('❌ No environment configured');
			break;

		default:
			console.log('📍 Environment: UNKNOWN');
			console.log('❓ Environment configuration not recognized');
			break;
	}

	console.log('='.repeat(40));
	console.log('');
	console.log('💡 Commands:');
	console.log('   npm run env:local  - Switch to local development');
	console.log('   npm run env:prod   - Switch to production');
	console.log('   npm run env:status - Show this status');
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
	case 'local':
		switchToLocal();
		break;

	case 'production':
	case 'prod':
		switchToProduction();
		break;

	case 'status':
	default:
		showStatus();
		break;
}
