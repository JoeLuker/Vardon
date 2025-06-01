#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define path replacements
const replacements = [
  // Directory creation
  { from: "mkdir('/proc')", to: "mkdir('/v_proc')" },
  { from: 'mkdir("/proc")', to: 'mkdir("/v_proc")' },
  { from: "mkdir('/proc/character')", to: "mkdir('/v_proc/character')" },
  { from: 'mkdir("/proc/character")', to: 'mkdir("/v_proc/character")' },
  { from: "mkdir('/entity')", to: "mkdir('/v_entity')" },
  { from: 'mkdir("/entity")', to: 'mkdir("/v_entity")' },
  { from: "mkdir('/etc')", to: "mkdir('/v_etc')" },
  { from: 'mkdir("/etc")', to: 'mkdir("/v_etc")' },
  { from: "mkdir('/dev')", to: "mkdir('/v_dev')" },
  { from: 'mkdir("/dev")', to: 'mkdir("/v_dev")' },
  { from: "mkdir('/proc/features')", to: "mkdir('/v_proc/features')" },
  { from: 'mkdir("/proc/features")', to: 'mkdir("/v_proc/features")' },
  
  // Path references
  { from: "'/proc'", to: "'/v_proc'" },
  { from: '"/proc"', to: '"/v_proc"' },
  { from: "'/proc/character'", to: "'/v_proc/character'" },
  { from: '"/proc/character"', to: '"/v_proc/character"' },
  { from: "'/entity'", to: "'/v_entity'" },
  { from: '"/entity"', to: '"/v_entity"' },
  { from: "'/etc'", to: "'/v_etc'" },
  { from: '"/etc"', to: '"/v_etc"' },
  { from: "'/dev'", to: "'/v_dev'" },
  { from: '"/dev"', to: '"/v_dev"' },
  { from: "'/proc/features'", to: "'/v_proc/features'" },
  { from: '"/proc/features"', to: '"/v_proc/features"' },
  { from: "'/proc/ability'", to: "'/v_proc/ability'" },
  { from: '"/proc/ability"', to: '"/v_proc/ability"' },
  { from: "'/proc/character/list'", to: "'/v_proc/character/list'" },
  { from: '"/proc/character/list"', to: '"/v_proc/character/list"' },
  { from: "'/proc/schema'", to: "'/v_proc/schema'" },
  { from: '"/proc/schema"', to: '"/v_proc/schema"' },
  { from: "'/var/log'", to: "'/v_var/log'" },
  { from: '"/var/log"', to: '"/v_var/log"' },
  { from: "'/dev/ability'", to: "'/v_dev/ability'" },
  { from: '"/dev/ability"', to: '"/v_dev/ability"' },
  { from: "'/dev/skill'", to: "'/v_dev/skill'" },
  { from: '"/dev/skill"', to: '"/v_dev/skill"' },
  { from: "'/dev/combat'", to: "'/v_dev/combat'" },
  { from: '"/dev/combat"', to: '"/v_dev/combat"' },
  { from: "'/dev/condition'", to: "'/v_dev/condition'" },
  { from: '"/dev/condition"', to: '"/v_dev/condition"' },
  { from: "'/dev/bonus'", to: "'/v_dev/bonus'" },
  { from: '"/dev/bonus"', to: '"/v_dev/bonus"' },
  { from: "'/dev/character'", to: "'/v_dev/character'" },
  { from: '"/dev/character"', to: '"/v_dev/character"' },
];

// Files to update
const filesToUpdate = [
  // UI Components
  'src/lib/ui/CharacterPage.svelte',
  'src/lib/ui/Saves.svelte',
  'src/lib/ui/CharacterLoader.svelte',
  'src/lib/ui/ACStats.svelte',
  'src/lib/ui/SpellSlots.svelte',
  'src/lib/ui/Spells.svelte',
  'src/lib/ui/AbilityScores.svelte',
  
  // Capability files
  'src/lib/domain/capabilities/skill/SkillCapabilityComposed.ts',
  'src/lib/domain/capabilities/combat/CombatCapability.ts',
  
  // Test files
  'src/lib/domain/tests/FileSystemTestRunner.ts',
  'src/lib/domain/tests/DirectoryExistenceTest.ts',
  
  // Route files
  'src/routes/+page.svelte',
  'src/routes/diagnostics/+page.svelte',
  'src/routes/+layout.svelte',
  
  // Other capability files
  'src/lib/domain/capabilities/ability/AbilityCapabilityImpl.ts',
  'src/lib/domain/capabilities/character/CharacterCapability.ts',
  
  // Kernel files
  'src/lib/domain/kernel/FileSystem.ts',
  'src/lib/domain/kernel/Kernel.ts',
  
  // Database and state files
  'src/lib/db/gameRules.api.ts',
  'src/lib/domain/state/data/SupabaseDriver.ts',
];

// Function to update a file
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const replacement of replacements) {
      if (content.includes(replacement.from)) {
        content = content.split(replacement.from).join(replacement.to);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Update all files
console.log('Updating paths to use v_ prefix...\n');

for (const file of filesToUpdate) {
  updateFile(path.join(__dirname, file));
}

console.log('\n✅ Path update complete!');