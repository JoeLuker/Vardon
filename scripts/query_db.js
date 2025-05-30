/**
 * Direct Supabase Database Query Script
 * 
 * This script directly connects to Supabase and lists available tables
 * and sample data.
 */

// Import required modules
import { createClient } from '@supabase/supabase-js';

// Read environment variables from Vite-defined variables 
// These should be available through import.meta.env in development
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined');
  // We'll continue with hardcoded values for this test script
  
  // This is just an example and will be replaced by your actual values
  // Do not commit these values to version control
  const hardcodedUrl = "https://your-project-ref.supabase.co";
  const hardcodedKey = "your-anon-key";
  
  console.log('Using hardcoded credentials for testing...');

  // Update variables with hardcoded values
  supabaseUrl = hardcodedUrl;
  supabaseAnonKey = hardcodedKey;
}

console.log('Supabase URL:', supabaseUrl);
console.log('Connecting to Supabase...');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function queryDatabase() {
  try {
    // Query characters
    console.log('\n===== Characters =====');
    const { data: characters, error: charactersError } = await supabase
      .from('game_character')
      .select('*');
    
    if (charactersError) {
      console.error('Error fetching characters:', charactersError);
    } else {
      if (characters && characters.length > 0) {
        console.log(`Found ${characters.length} characters:`);
        characters.forEach(char => {
          console.log(`- ID: ${char.id}, Name: ${char.name}, Level: ${char.level || 'N/A'}`);
        });
      } else {
        console.log('No characters found');
      }
    }

    // Query abilities
    console.log('\n===== Abilities =====');
    const { data: abilities, error: abilitiesError } = await supabase
      .from('ability')
      .select('*');
    
    if (abilitiesError) {
      console.error('Error fetching abilities:', abilitiesError);
    } else {
      if (abilities && abilities.length > 0) {
        console.log(`Found ${abilities.length} abilities:`);
        abilities.forEach(ability => {
          console.log(`- ID: ${ability.id}, Name: ${ability.name}, Label: ${ability.label || ability.name}`);
        });
      } else {
        console.log('No abilities found');
      }
    }

    // Query skills
    console.log('\n===== Skills =====');
    const { data: skills, error: skillsError } = await supabase
      .from('skill')
      .select('*')
      .limit(10);
    
    if (skillsError) {
      console.error('Error fetching skills:', skillsError);
    } else {
      if (skills && skills.length > 0) {
        console.log(`Found ${skills.length} skills (showing first 10):`);
        skills.forEach(skill => {
          console.log(`- ID: ${skill.id}, Name: ${skill.name}`);
        });
      } else {
        console.log('No skills found');
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the query function
queryDatabase().then(() => {
  console.log('\nDatabase query complete');
});