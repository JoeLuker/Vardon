<script lang="ts">
  import { supabaseClient } from '$lib/db/supabaseClient';
  import { onMount } from 'svelte';

  let queryResults = "";
  let isLoading = true;
  let hasError = false;
  let errorMessage = "";

  onMount(async () => {
    try {
      isLoading = true;
      hasError = false;
      queryResults = "Querying database...\n";
      
      // Test connection
      queryResults += "\n===== Checking Connection =====\n";
      const { data: connectionTest, error: connectionError } = await supabaseClient
        .from('game_character')
        .select('count()')
        .limit(1);
        
      if (connectionError) {
        queryResults += `Connection error: ${connectionError.message}\n`;
        hasError = true;
      } else {
        queryResults += "Connection successful!\n";
      }
      
      // Query game characters
      queryResults += "\n===== Characters =====\n";
      const { data: characters, error: charactersError } = await supabaseClient
        .from('game_character')
        .select('*');
      
      if (charactersError) {
        queryResults += `Error fetching characters: ${charactersError.message}\n`;
      } else if (characters && characters.length > 0) {
        queryResults += `Found ${characters.length} characters:\n`;
        characters.forEach(char => {
          queryResults += `- ID: ${char.id}, Name: ${char.name}, Level: ${char.level || 'N/A'}\n`;
        });
      } else {
        queryResults += "No characters found\n";
      }
      
      // Query abilities
      queryResults += "\n===== Abilities =====\n";
      const { data: abilities, error: abilitiesError } = await supabaseClient
        .from('ability')
        .select('*');
      
      if (abilitiesError) {
        queryResults += `Error fetching abilities: ${abilitiesError.message}\n`;
      } else if (abilities && abilities.length > 0) {
        queryResults += `Found ${abilities.length} abilities:\n`;
        abilities.forEach(ability => {
          queryResults += `- ID: ${ability.id}, Name: ${ability.name}, Label: ${ability.label || ability.name}\n`;
        });
      } else {
        queryResults += "No abilities found\n";
      }
      
      // Query skills
      queryResults += "\n===== Skills =====\n";
      const { data: skills, error: skillsError } = await supabaseClient
        .from('skill')
        .select('*')
        .limit(10);
      
      if (skillsError) {
        queryResults += `Error fetching skills: ${skillsError.message}\n`;
      } else if (skills && skills.length > 0) {
        queryResults += `Found ${skills.length} skills (showing first 10):\n`;
        skills.forEach(skill => {
          queryResults += `- ID: ${skill.id}, Name: ${skill.name}\n`;
        });
      } else {
        queryResults += "No skills found\n";
      }
      
      // Query recent tables (checking if tables exist)
      queryResults += "\n===== Available Tables =====\n";
      const { data: tableList, error: tableError } = await supabaseClient
        .from('game_character')
        .select('*')
        .limit(1);
      
      if (tableError) {
        queryResults += `Error checking tables: ${tableError.message}\n`;
        queryResults += "Tables: Unknown - Cannot access tables\n";
      } else {
        queryResults += "Found the following tables:\n";
        queryResults += "- game_character\n";
        
        // Try to access other tables to see if they exist
        const tables = [
          'ability', 'skill', 'feat', 'class', 
          'game_character_ability', 'game_character_skill_rank'
        ];
        
        for (const table of tables) {
          const { error } = await supabaseClient.from(table).select('count()').limit(1);
          if (!error) {
            queryResults += `- ${table}\n`;
          }
        }
      }
      
      queryResults += "\nDatabase query complete!";
    } catch (err) {
      hasError = true;
      errorMessage = err.message || "Unknown error";
      queryResults += `\nUnexpected error: ${errorMessage}`;
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="query-database">
  <h2 class="text-2xl font-bold mb-4">Direct Database Query Results</h2>
  
  {#if isLoading}
    <div class="loading">
      <p>Loading database data...</p>
      <div class="loading-spinner"></div>
    </div>
  {/if}
  
  {#if hasError}
    <div class="error bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p><strong>Error:</strong> {errorMessage}</p>
    </div>
  {/if}
  
  <pre class="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-[70vh]">{queryResults}</pre>
</div>

<style>
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: #09f;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 10px auto;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>