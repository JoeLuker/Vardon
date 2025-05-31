#!/usr/bin/env node

/**
 * Compare local and production database content
 */

import { createClient } from '@supabase/supabase-js';

// Local Supabase configuration
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Production Supabase configuration
const PROD_SUPABASE_URL = 'https://pxosfkpgsqkkfhtfkdog.supabase.co';
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4b3Nma3Bnc3Fra2ZodGZrZG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2MDU3OTAsImV4cCI6MjA0NjE4MTc5MH0.AIiRrXZNiac7lB6MiAs9zOCWcYDqUqwlE55Ymp-60uI';

const localSupabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_ANON_KEY);
const prodSupabase = createClient(PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY);

async function getTableCount(client, tableName) {
  try {
    const { data, error, count } = await client
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      return { error: error.message };
    }
    
    return { count: count || 0 };
  } catch (err) {
    return { error: err.message };
  }
}

async function compareEnvironments() {
  console.log('🔍 Comparing Local vs Production Database Content\n');
  
  const tablesToCheck = [
    'ability', 'skill', 'class', 'feat', 'spell', 'ancestry', 'archetype',
    'weapon', 'armor', 'spell_school', 'bonus_type', 'game_character'
  ];
  
  console.log('| Table | Local | Production | Status |');
  console.log('|-------|--------|------------|--------|');
  
  let localTotal = 0;
  let prodTotal = 0;
  let differences = 0;
  
  for (const tableName of tablesToCheck) {
    const localResult = await getTableCount(localSupabase, tableName);
    const prodResult = await getTableCount(prodSupabase, tableName);
    
    const localCount = localResult.error ? '❌' : localResult.count;
    const prodCount = prodResult.error ? '❌' : prodResult.count;
    
    let status = '✅';
    if (localResult.error || prodResult.error) {
      status = '❌ Error';
    } else if (localResult.count !== prodResult.count) {
      status = '⚠️  Different';
      differences++;
    }
    
    console.log(`| ${tableName.padEnd(13)} | ${String(localCount).padEnd(6)} | ${String(prodCount).padEnd(10)} | ${status} |`);
    
    if (!localResult.error) localTotal += localResult.count;
    if (!prodResult.error) prodTotal += prodResult.count;
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Local total records: ${localTotal}`);
  console.log(`   Production total records: ${prodTotal}`);
  console.log(`   Tables with differences: ${differences}`);
  
  if (differences === 0 && localTotal > 0 && prodTotal > 0) {
    console.log('\n🎉 Environments are synchronized!');
    return true;
  } else if (prodTotal === 0) {
    console.log('\n⚠️  Production database is empty - needs data migration');
    return false;
  } else {
    console.log('\n⚠️  Environments are out of sync');
    return false;
  }
}

compareEnvironments();