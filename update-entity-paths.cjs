#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define entity-specific replacements
const replacements = [
  // Entity path replacements
  { from: "'/entity/{entity_id}/abilities'", to: "'/v_entity/{entity_id}/abilities'" },
  { from: '"/entity/{entity_id}/abilities"', to: '"/v_entity/{entity_id}/abilities"' },
  { from: "`/db/entity/${entityId}`", to: "`/v_db/entity/${entityId}`" },
  { from: "`/db/entity/${entity.id}`", to: "`/v_db/entity/${entity.id}`" },
  { from: "// /entity/{id}/combat/stats", to: "// /v_entity/{id}/combat/stats" },
  { from: "// /entity/{id}/combat/ac", to: "// /v_entity/{id}/combat/ac" },
  { from: "// /entity/{id}/combat/saves", to: "// /v_entity/{id}/combat/saves" },
  { from: "const entityPath = `/entity/character-${characterId}`", to: "const entityPath = `/v_entity/character-${characterId}`" },
  { from: "await kernel.create('/entity/test-entity'", to: "await kernel.create('/v_entity/test-entity'" },
  { from: "const fd = kernel.open('/entity/test-entity')", to: "const fd = kernel.open('/v_entity/test-entity')" },
  { from: "return entityPath.replace(/^\\/entity\\//", to: "return entityPath.replace(/^\\/v_entity\\//"},
  { from: "replace(/^\\/entity\\//, '/var/entity/')", to: "replace(/^\\/v_entity\\//, '/v_var/entity/')" },
  { from: "const entityPath = `/entity/${characterId}`", to: "const entityPath = `/v_entity/${characterId}`" },
  { from: "const entityPath = `/entity/${entityId}`", to: "const entityPath = `/v_entity/${entityId}`" },
  { from: "const path = `/entity/${entity.id}`", to: "const path = `/v_entity/${entity.id}`" },
  { from: "const path = `/entity/${entityId}`", to: "const path = `/v_entity/${entityId}`" },
  { from: "`Entity path must start with /entity/ or /proc/character/", to: "`Entity path must start with /v_entity/ or /v_proc/character/" },
  { from: "const entityPath = processInfo.path || `/entity/character-${characterId}`", to: "const entityPath = processInfo.path || `/v_entity/character-${characterId}`" },
  
  // Documentation updates (less critical but good for consistency)
  { from: "- `/entity/` - Entity data", to: "- `/v_entity/` - Entity data" },
  { from: "- Stored at `/entity/{entity_id}`", to: "- Stored at `/v_entity/{entity_id}`" },
  { from: 'const entityPath = `/entity/${entityId}`;', to: 'const entityPath = `/v_entity/${entityId}`;' },
  { from: 'entityPath: `/entity/${entityId}`,', to: 'entityPath: `/v_entity/${entityId}`,'},
];

// Files to update
const filesToUpdate = [
  'src/lib/db/gameRules.api.ts',
  'src/lib/domain/capabilities/database/DatabaseCapability.ts',
  'src/lib/domain/capabilities/combat/CombatCapabilityComposed.ts',
  'src/lib/domain/fs-init.ts',
  'src/lib/domain/tests/InvariantCheckingTest.ts',
  'src/lib/domain/utils/DataPipeline.ts',
  'src/lib/domain/utils/CharacterPipelines.ts',
  'src/lib/domain/application-browser.ts',
  'src/lib/domain/kernel/GameKernel.ts',
  'src/lib/domain/kernel/InvariantChecker.ts',
  'src/lib/domain/kernel/Kernel.ts',
  'src/lib/domain/docs/architecture/error-handling.md',
  'src/lib/domain/UNIX_PLUGIN_ARCHITECTURE.md',
];

// Function to update a file
function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  File not found: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let changeCount = 0;
    
    for (const replacement of replacements) {
      const beforeLength = content.length;
      content = content.split(replacement.from).join(replacement.to);
      if (content.length !== beforeLength) {
        modified = true;
        changeCount++;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${filePath} (${changeCount} replacements)`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Update all files
console.log('Updating remaining entity paths...\n');

let updatedCount = 0;
for (const file of filesToUpdate) {
  const fullPath = path.join(__dirname, file);
  if (updateFile(fullPath)) {
    updatedCount++;
  }
}

console.log(`\n✅ Updated ${updatedCount} files`);
console.log('\n✅ Entity path update complete!');