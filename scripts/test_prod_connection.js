#!/usr/bin/env node

/**
 * Test production database connection
 */

import { createClient } from '@supabase/supabase-js';

// Production Supabase configuration
const PROD_SUPABASE_URL = 'https://pxosfkpgsqkkfhtfkdog.supabase.co';
const PROD_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4b3Nma3Bnc3Fra2ZodGZrZG9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDYwNTc5MCwiZXhwIjoyMDQ2MTgxNzkwfQ.LdRHkkIrukZYfxKEWMxjbzHyMSwY62mqVEifvXUdnZo';

const prodSupabase = createClient(PROD_SUPABASE_URL, PROD_SERVICE_ROLE);

async function testConnection() {
  console.log('🔗 Testing production database connection...\n');
  
  try {
    // Test basic connection
    const { data: healthCheck, error: healthError } = await prodSupabase
      .from('_supabase_health_check')
      .select('*')
      .limit(1);
      
    if (healthError && !healthError.message.includes('does not exist')) {
      console.log('❌ Health check failed:', healthError.message);
    } else {
      console.log('✅ Basic connection successful');
    }
    
    // Check if our tables exist
    const { data: tables, error: tableError } = await prodSupabase.rpc('get_table_info');
    
    if (tableError) {
      console.log('⚠️  Table check failed (this is expected if migrations haven\'t run):', tableError.message);
    } else {
      console.log('✅ Tables accessible');
    }
    
    // Try to query a common table
    const { data: metadata, error: metadataError } = await prodSupabase
      .from('metadata')
      .select('*')
      .limit(1);
      
    if (metadataError) {
      console.log('⚠️  Metadata table not found - migrations need to be run');
      console.log('   Error:', metadataError.message);
    } else {
      console.log('✅ Metadata table exists');
      console.log('   Records found:', metadata?.length || 0);
    }
    
    // Check specific tables
    const testTables = ['game_character', 'class', 'feat', 'spell'];
    console.log('\n📊 Checking key tables:');
    
    for (const tableName of testTables) {
      const { data, error, count } = await prodSupabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`   ✅ ${tableName}: ${count || 0} records`);
      }
    }
    
  } catch (error) {
    console.error('💥 Connection test failed:', error);
  }
}

testConnection();