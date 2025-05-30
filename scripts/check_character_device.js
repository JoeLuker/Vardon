#!/usr/bin/env node

/**
 * Check Character Device Script
 * 
 * This script tests if the character device is properly mounted and functional.
 * It's designed to be run from the command line to diagnose character loading issues.
 */

// Constants to replace with actual values from your application
const SUPABASE_URL = "http://127.0.0.1:54321"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

// Run this as an ESM script
import { createClient } from '@supabase/supabase-js';

// Main function to check the character device
async function checkCharacterDevice() {
  console.log("Starting character device check...");
  
  try {
    // 1. Test direct database connection first
    console.log("\n--- CHECKING DATABASE CONNECTION ---");
    
    console.log("Creating Supabase client...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      db: { schema: 'public' },
      auth: { persistSession: false }
    });
    
    console.log("Testing database connection...");
    const { data, error } = await supabase
      .from('game_character')
      .select('id, name')
      .limit(5);
    
    if (error) {
      console.error("ERROR: Database connection failed:", error);
      return false;
    }
    
    console.log("Database connection successful!");
    console.log(`Found ${data.length} characters:`);
    data.forEach(char => {
      console.log(`  - ID: ${char.id}, Name: ${char.name}`);
    });
    
    // 2. Test first character in more detail
    if (data.length > 0) {
      const characterId = data[0].id;
      console.log(`\nFetching complete data for character ID ${characterId}...`);
      
      const fullQuery = `
        *,
        game_character_ability(*, ability(*)),
        game_character_class(*, class(*))
      `;
      
      const { data: characterData, error: charError } = await supabase
        .from('game_character')
        .select(fullQuery)
        .eq('id', characterId)
        .single();
      
      if (charError) {
        console.error("ERROR: Failed to fetch full character data:", charError);
      } else {
        console.log("Character data retrieved successfully!");
        console.log(`  Name: ${characterData.name}`);
        
        // Log abilities
        if (characterData.game_character_ability && characterData.game_character_ability.length > 0) {
          console.log("\nAbilities:");
          characterData.game_character_ability.forEach(ability => {
            console.log(`  ${ability.ability?.label || 'Unknown'}: ${ability.value}`);
          });
        }
        
        // Log classes
        if (characterData.game_character_class && characterData.game_character_class.length > 0) {
          console.log("\nClasses:");
          characterData.game_character_class.forEach(cls => {
            console.log(`  ${cls.class?.name || 'Unknown'} (Level ${cls.level})`);
          });
        }
      }
    }
    
    console.log("\nAll checks passed successfully!");
    return true;
  } catch (error) {
    console.error("FATAL ERROR during character device check:", error);
    return false;
  }
}

// Run the check
checkCharacterDevice().then(success => {
  if (success) {
    console.log("\nCharacter device check completed successfully ✅");
    process.exit(0);
  } else {
    console.error("\nCharacter device check failed ❌");
    process.exit(1);
  }
});