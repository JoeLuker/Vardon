#!/usr/bin/env node

/**
 * Quick data load to production
 * Load essential data manually to ensure it works
 */

import { createClient } from '@supabase/supabase-js';

// Production Supabase configuration
const PROD_SUPABASE_URL = 'https://pxosfkpgsqkkfhtfkdog.supabase.co';
const PROD_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4b3Nma3Bnc3Fra2ZodGZrZG9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDYwNTc5MCwiZXhwIjoyMDQ2MTgxNzkwfQ.LdRHkkIrukZYfxKEWMxjbzHyMSwY62mqVEifvXUdnZo';

const prodSupabase = createClient(PROD_SUPABASE_URL, PROD_SERVICE_ROLE);

async function loadSampleData() {
  console.log('🚀 Loading sample data to production...\n');
  
  try {
    // Load basic abilities
    console.log('📦 Loading abilities...');
    const abilities = [
      { id: 1, name: 'Strength', description: 'Physical power', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, name: 'Dexterity', description: 'Agility and reflexes', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 3, name: 'Constitution', description: 'Health and stamina', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 4, name: 'Intelligence', description: 'Reasoning capability', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 5, name: 'Wisdom', description: 'Perception and insight', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 6, name: 'Charisma', description: 'Force of personality', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
    
    const { data: abilityData, error: abilityError } = await prodSupabase
      .from('ability')
      .insert(abilities);
      
    if (abilityError) {
      console.log(`   ❌ Abilities: ${abilityError.message}`);
    } else {
      console.log(`   ✅ Abilities loaded: ${abilities.length} records`);
    }
    
    // Load basic classes
    console.log('📦 Loading classes...');
    const classes = [
      { id: 1, name: 'Fighter', description: 'Masters of combat', hit_die: 10, skill_ranks_per_level: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, name: 'Wizard', description: 'Masters of arcane magic', hit_die: 6, skill_ranks_per_level: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 3, name: 'Rogue', description: 'Masters of stealth and skill', hit_die: 8, skill_ranks_per_level: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
    
    const { data: classData, error: classError } = await prodSupabase
      .from('class')
      .insert(classes);
      
    if (classError) {
      console.log(`   ❌ Classes: ${classError.message}`);
    } else {
      console.log(`   ✅ Classes loaded: ${classes.length} records`);
    }
    
    // Load basic skills
    console.log('📦 Loading skills...');
    const skills = [
      { id: 1, name: 'Acrobatics', description: 'Balance and tumbling', ability_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, name: 'Athletics', description: 'Climbing, jumping, swimming', ability_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 3, name: 'Perception', description: 'Noticing things', ability_id: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 4, name: 'Stealth', description: 'Moving unseen', ability_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 5, name: 'Spellcraft', description: 'Understanding magic', ability_id: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
    
    const { data: skillData, error: skillError } = await prodSupabase
      .from('skill')
      .insert(skills);
      
    if (skillError) {
      console.log(`   ❌ Skills: ${skillError.message}`);
    } else {
      console.log(`   ✅ Skills loaded: ${skills.length} records`);
    }
    
    // Create a test character
    console.log('📦 Creating test character...');
    const testCharacter = {
      id: 1,
      name: 'Test Character',
      level: 1,
      experience_points: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: characterData, error: characterError } = await prodSupabase
      .from('game_character')
      .insert([testCharacter]);
      
    if (characterError) {
      console.log(`   ❌ Character: ${characterError.message}`);
    } else {
      console.log(`   ✅ Character created: ${testCharacter.name}`);
    }
    
    console.log('\n🎉 Sample data loaded successfully!');
    
    // Verify the data
    console.log('\n🔍 Verifying loaded data...');
    
    const { data: verifyAbilities, error: verifyError } = await prodSupabase
      .from('ability')
      .select('name')
      .limit(6);
      
    if (!verifyError && verifyAbilities?.length > 0) {
      console.log(`   ✅ Abilities verified: ${verifyAbilities.map(a => a.name).join(', ')}`);
    }
    
    const { data: verifyClasses } = await prodSupabase
      .from('class')
      .select('name')
      .limit(3);
      
    if (verifyClasses?.length > 0) {
      console.log(`   ✅ Classes verified: ${verifyClasses.map(c => c.name).join(', ')}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Failed to load sample data:', error);
    return false;
  }
}

loadSampleData();