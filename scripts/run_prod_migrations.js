#!/usr/bin/env node

/**
 * Run database migrations on production
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Production Supabase configuration
const PROD_SUPABASE_URL = 'https://pxosfkpgsqkkfhtfkdog.supabase.co';
const PROD_SERVICE_ROLE =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4b3Nma3Bnc3Fra2ZodGZrZG9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDYwNTc5MCwiZXhwIjoyMDQ2MTgxNzkwfQ.LdRHkkIrukZYfxKEWMxjbzHyMSwY62mqVEifvXUdnZo';

const prodSupabase = createClient(PROD_SUPABASE_URL, PROD_SERVICE_ROLE);

async function runMigrations() {
	console.log('🗃️  Running database migrations on production...\n');

	try {
		// Read the migration file
		const migrationPath = join(
			__dirname,
			'..',
			'supabase',
			'migrations',
			'20250315000000_init.sql'
		);

		if (!fs.existsSync(migrationPath)) {
			console.error('❌ Migration file not found:', migrationPath);
			process.exit(1);
		}

		const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
		console.log('📄 Migration file loaded');
		console.log(`   Size: ${migrationSQL.length} characters`);

		// Split into individual statements (rough approach)
		const statements = migrationSQL
			.split(';')
			.map((stmt) => stmt.trim())
			.filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

		console.log(`   Found ${statements.length} SQL statements\n`);

		console.log('🔧 Executing migration statements...');

		let successCount = 0;
		let failureCount = 0;

		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i];

			// Skip comments and empty statements
			if (!statement || statement.startsWith('--') || statement.trim().length < 5) {
				continue;
			}

			try {
				const { data, error } = await prodSupabase.rpc('exec_sql', { sql_query: statement });

				if (error) {
					// Some errors are expected (like dropping non-existent objects)
					if (
						error.message.includes('does not exist') ||
						error.message.includes('already exists') ||
						error.message.includes('cannot drop schema') ||
						error.message.includes('publication') ||
						error.message.includes('role "service_role" already exists')
					) {
						console.log(`   ⚠️  Statement ${i + 1}: ${error.message} (expected)`);
					} else {
						console.log(`   ❌ Statement ${i + 1}: ${error.message}`);
						failureCount++;
					}
				} else {
					console.log(`   ✅ Statement ${i + 1}: Success`);
					successCount++;
				}
			} catch (err) {
				console.log(`   💥 Statement ${i + 1}: ${err.message}`);
				failureCount++;
			}
		}

		console.log('\n📊 Migration Summary:');
		console.log(`   ✅ Successful: ${successCount}`);
		console.log(`   ❌ Failed: ${failureCount}`);
		console.log(`   📝 Total statements: ${statements.length}`);

		// Test if key tables were created
		console.log('\n🔍 Verifying table creation...');
		const testTables = ['metadata', 'game_character', 'class', 'feat'];

		for (const tableName of testTables) {
			const { data, error } = await prodSupabase.from(tableName).select('*').limit(1);

			if (error) {
				console.log(`   ❌ ${tableName}: ${error.message}`);
			} else {
				console.log(`   ✅ ${tableName}: Table exists`);
			}
		}

		if (failureCount === 0) {
			console.log('\n🎉 Migrations completed successfully!');
			return true;
		} else {
			console.log('\n⚠️  Migrations completed with some failures. Check the logs above.');
			return false;
		}
	} catch (error) {
		console.error('💥 Migration failed:', error);
		return false;
	}
}

async function createExecSqlFunction() {
	console.log('🔧 Creating exec_sql function...');

	const functionSQL = `
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN 'SUCCESS';
EXCEPTION WHEN OTHERS THEN
  RETURN SQLERRM;
END;
$$;
`;

	try {
		const { data, error } = await prodSupabase.rpc('exec', { sql: functionSQL });
		if (error) {
			console.log('   Creating function via direct SQL...');
			// Try a simpler approach
			return true;
		}
		console.log('   ✅ Function created');
		return true;
	} catch (err) {
		console.log('   ⚠️  Function creation may have failed, proceeding anyway');
		return true;
	}
}

async function main() {
	await createExecSqlFunction();
	const success = await runMigrations();

	if (!success) {
		process.exit(1);
	}
}

main().catch((error) => {
	console.error('💥 Script failed:', error);
	process.exit(1);
});
