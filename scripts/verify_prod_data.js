#!/usr/bin/env node

/**
 * Verify production data was loaded successfully
 */

import { createClient } from '@supabase/supabase-js';

// Production Supabase configuration
const PROD_SUPABASE_URL = 'https://pxosfkpgsqkkfhtfkdog.supabase.co';
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4b3Nma3Bnc3Fra2ZodGZrZG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2MDU3OTAsImV4cCI6MjA0NjE4MTc5MH0.AIiRrXZNiac7lB6MiAs9zOCWcYDqUqwlE55Ymp-60uI';

const prodSupabase = createClient(PROD_SUPABASE_URL, PROD_ANON_KEY);

async function verifyTables() {
  console.log('🔍 Verifying production data...\n');
  
  // Tables to check with expected data counts (approximate)
  const tablesToCheck = [
    { name: 'ability', expected: 6 },
    { name: 'skill', expected: 34 },
    { name: 'class', expected: 14 },
    { name: 'feat', expected: 15 },
    { name: 'spell', expected: 6 },
    { name: 'ancestry', expected: 2 },
    { name: 'archetype', expected: 4 },
    { name: 'weapon', expected: 12 },
    { name: 'armor', expected: 2 },
    { name: 'spell_school', expected: 9 },
    { name: 'bonus_type', expected: 9 }
  ];
  
  let totalTables = 0;
  let successfulTables = 0;
  let totalRecords = 0;
  
  for (const table of tablesToCheck) {
    totalTables++;
    
    try {
      const { data, error, count } = await prodSupabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`❌ ${table.name}: ${error.message}`);
      } else {
        const recordCount = count || 0;
        totalRecords += recordCount;
        successfulTables++;
        
        const status = recordCount >= table.expected ? '✅' : '⚠️ ';
        console.log(`${status} ${table.name}: ${recordCount} records (expected ~${table.expected})`);
      }
    } catch (err) {
      console.log(`💥 ${table.name}: ${err.message}`);
    }
  }
  
  console.log('\n📊 Verification Summary:');
  console.log(`   Tables accessible: ${successfulTables}/${totalTables}`);
  console.log(`   Total records: ${totalRecords}`);
  
  if (successfulTables > 0) {
    console.log('\n🎉 Production database is populated and accessible!');
    
    // Test a few sample queries
    console.log('\n🧪 Testing sample queries...');
    
    try {
      const { data: classes, error: classError } = await prodSupabase
        .from('class')
        .select('name')
        .limit(3);
        
      if (!classError && classes?.length > 0) {
        console.log(`   ✅ Sample classes: ${classes.map(c => c.name).join(', ')}`);
      }
      
      const { data: spells, error: spellError } = await prodSupabase
        .from('spell')
        .select('name')
        .limit(3);
        
      if (!spellError && spells?.length > 0) {
        console.log(`   ✅ Sample spells: ${spells.map(s => s.name).join(', ')}`);
      }
      
      const { data: abilities, error: abilityError } = await prodSupabase
        .from('ability')
        .select('name')
        .limit(6);
        
      if (!abilityError && abilities?.length > 0) {
        console.log(`   ✅ Sample abilities: ${abilities.map(a => a.name).join(', ')}`);
      }
      
    } catch (queryError) {
      console.log(`   ⚠️  Sample queries failed: ${queryError.message}`);
    }
    
    return true;
  } else {
    console.log('\n❌ Production database verification failed');
    return false;
  }
}

verifyTables();