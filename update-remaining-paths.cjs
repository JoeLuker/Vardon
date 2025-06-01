#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define all path replacements including the ones we found
const replacements = [
  // Device paths
  { from: "'/dev/db'", to: "'/v_dev/db'" },
  { from: '"/dev/db"', to: '"/v_dev/db"' },
  { from: "kernel.mount('/dev/db'", to: "kernel.mount('/v_dev/db'" },
  { from: 'kernel.mount("/dev/db"', to: 'kernel.mount("/v_dev/db"' },
  { from: "devicePath = '/dev/db'", to: "devicePath = '/v_dev/db'" },
  { from: 'devicePath = "/dev/db"', to: 'devicePath = "/v_dev/db"' },
  
  // Schema paths
  { from: "'/etc/schema'", to: "'/v_etc/schema'" },
  { from: '"/etc/schema"', to: '"/v_etc/schema"' },
  { from: "'/etc/db_dirs_ready'", to: "'/v_etc/db_dirs_ready'" },
  { from: '"/etc/db_dirs_ready"', to: '"/v_etc/db_dirs_ready"' },
  { from: "kernel.exists('/etc/db_dirs_ready')", to: "kernel.exists('/v_etc/db_dirs_ready')" },
  { from: 'kernel.exists("/etc/db_dirs_ready")', to: 'kernel.exists("/v_etc/db_dirs_ready")' },
  { from: "kernel.create('/etc/db_dirs_ready'", to: "kernel.create('/v_etc/db_dirs_ready'" },
  
  // Proc paths
  { from: "'/proc/character/create'", to: "'/v_proc/character/create'" },
  { from: '"/proc/character/create"', to: '"/v_proc/character/create"' },
  { from: "`/proc/character/${", to: "`/v_proc/character/${" },
  { from: "'/proc/corruption_manifestation'", to: "'/v_proc/corruption_manifestation'" },
  { from: "'/proc/corruption_manifestation_prerequisite'", to: "'/v_proc/corruption_manifestation_prerequisite'" },
  { from: "'/proc/abp_node'", to: "'/v_proc/abp_node'" },
  { from: "`/proc/${table}/${id}`", to: "`/v_proc/${table}/${id}`" },
  { from: "'/schema/class/list'", to: "'/v_schema/class/list'" },
  { from: "'/schema/feat/list'", to: "'/v_schema/feat/list'" },
  { from: "'/schema/skill/list'", to: "'/v_schema/skill/list'" },
  
  // Entity paths
  { from: "`/entity/${entityData.uuid}`", to: "`/v_entity/${entityData.uuid}`" },
  { from: "`/entity/${id}", to: "`/v_entity/${id}" },
  { from: "`/entity/${entityId}", to: "`/v_entity/${entityId}" },
  { from: "'/entity/'", to: "'/v_entity/'" },
  { from: '"/entity/"', to: '"/v_entity/"' },
  
  // Variable paths  
  { from: "'/var/log'", to: "'/v_var/log'" },
  { from: '"/var/log"', to: '"/v_var/log"' },
  
  // Path construction patterns
  { from: "case 'character':\n\t\t\t\t\tconst characterPath = `/proc/character/${id}`", to: "case 'character':\n\t\t\t\t\tconst characterPath = `/v_proc/character/${id}`" },
  { from: "case 'entity':\n\t\t\t\t\tconst entityPath = `/entity/${id}`", to: "case 'entity':\n\t\t\t\t\tconst entityPath = `/v_entity/${id}`" },
  { from: "return `/proc/${resourceType}/${id}`", to: "return `/v_proc/${resourceType}/${id}`" },
  { from: "return `/etc/schema/${resourceType}/${id === 'all' ? 'list' : id}`", to: "return `/v_etc/schema/${resourceType}/${id === 'all' ? 'list' : id}`" },
  
  // Standard directories in Kernel.ts that should NOT have v_ prefix
  { from: "standardDirs = ['/v_dev', '/v_proc', '/v_entity', '/v_etc', '/var', '/tmp', '/bin']", to: "standardDirs = ['/v_dev', '/v_proc', '/v_entity', '/v_etc', '/v_var', '/v_tmp', '/v_bin']" },
  { from: "const entityPath = `/entity/${entity.id}`", to: "const entityPath = `/v_entity/${entity.id}`" },
  { from: "const path = `/entity/${entityId}`", to: "const path = `/v_entity/${entityId}`" },
  { from: "const entityPath = `/entity/${entityId}`", to: "const entityPath = `/v_entity/${entityId}`" },
  { from: "const devicePath = `/dev/${id}`", to: "const devicePath = `/v_dev/${id}`" },
];

// Find all TypeScript and Svelte files
function findFiles(dir, ext) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'build' && file !== '.svelte-kit') {
      results = results.concat(findFiles(filePath, ext));
    } else if (stat.isFile() && ext.some(e => file.endsWith(e))) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Update a file
function updateFile(filePath) {
  try {
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
    }
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('Finding all TypeScript and Svelte files...\n');

const srcFiles = findFiles(path.join(__dirname, 'src'), ['.ts', '.svelte']);
console.log(`Found ${srcFiles.length} files to check\n`);

let updatedCount = 0;
for (const file of srcFiles) {
  if (updateFile(file)) {
    updatedCount++;
  }
}

console.log(`\n✅ Updated ${updatedCount} files`);

// Run grep to verify
console.log('\nChecking for any remaining old paths...\n');
try {
  execSync('grep -rn "\'/dev/db\\|\'/etc/db_dirs_ready\\|\'/etc/schema\\|`/proc/\\|`/entity/\\|\'/proc/character/create\\|\'/schema/" src/ || true', { stdio: 'inherit' });
} catch (e) {
  // grep returns non-zero if no matches found, which is what we want
}

console.log('\n✅ Path update complete!');