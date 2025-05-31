#!/usr/bin/env node

/**
 * List all tables in production database
 */

import { createClient } from '@supabase/supabase-js';

const PROD_SUPABASE_URL = 'https://pxosfkpgsqkkfhtfkdog.supabase.co';
const PROD_SERVICE_ROLE =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4b3Nma3Bnc3Fra2ZodGZrZG9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDYwNTc5MCwiZXhwIjoyMDQ2MTgxNzkwfQ.LdRHkkIrukZYfxKEWMxjbzHyMSwY62mqVEifvXUdnZo';

const prodSupabase = createClient(PROD_SUPABASE_URL, PROD_SERVICE_ROLE);

async function listTables() {
	console.log('📋 Listing all tables in production database...\n');

	try {
		// Query information_schema to list tables
		const { data, error } = await prodSupabase.rpc('get_tables_info');

		if (error) {
			console.log('⚠️  Using alternative method to list tables...');

			// Try a direct approach by testing some table names
			const testTables = [
				'metadata',
				'game_character',
				'class',
				'feat',
				'spell',
				'ability',
				'ancestry',
				'archetype',
				'weapon',
				'armor',
				'skill',
				'trait',
				'bonus_type',
				'spell_school',
				'element',
				'rule'
			];

			console.log('🔍 Testing for common table existence:');
			let foundTables = [];

			for (const tableName of testTables) {
				try {
					const { data: testData, error: testError } = await prodSupabase
						.from(tableName)
						.select('*')
						.limit(1);

					if (!testError) {
						foundTables.push(tableName);
						console.log(`   ✅ ${tableName} - exists`);
					} else {
						console.log(`   ❌ ${tableName} - ${testError.message}`);
					}
				} catch (err) {
					console.log(`   💥 ${tableName} - ${err.message}`);
				}
			}

			console.log(`\n📊 Found ${foundTables.length} tables out of ${testTables.length} tested`);

			if (foundTables.length > 0) {
				console.log('\n✅ Production database has tables, ready for data import');
				return true;
			} else {
				console.log('\n❌ No tables found in production database');
				return false;
			}
		} else {
			console.log('✅ Tables found:', data);
			return true;
		}
	} catch (error) {
		console.error('💥 Failed to list tables:', error);
		return false;
	}
}

listTables();
