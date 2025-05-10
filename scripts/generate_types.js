#!/usr/bin/env node

/**
 * This script generates TypeScript types from the Supabase database schema.
 * It should be run whenever the database schema changes.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  }
};

console.log(`${colors.bright}${colors.fg.cyan}Generating Supabase TypeScript definitions...${colors.reset}`);

try {
  // Check if supabase is installed
  try {
    execSync('npx supabase --version', { stdio: 'ignore' });
  } catch (error) {
    console.log(`${colors.fg.yellow}Supabase CLI not found. Installing...${colors.reset}`);
    execSync('npm install -g supabase');
  }

  // Generate types for local development
  console.log(`${colors.fg.cyan}Using local Supabase instance...${colors.reset}`);
  execSync('npx supabase gen types typescript --local > database.types.ts', { stdio: 'inherit' });

  // Create types directory if it doesn't exist
  const typesDir = path.join(__dirname, '..', 'src', 'lib', 'types');
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }

  console.log(`${colors.fg.green}✓ TypeScript types generated successfully!${colors.reset}`);
  console.log(`${colors.fg.white}Database types written to:${colors.reset} database.types.ts`);
  console.log(`${colors.fg.white}Helper types available at:${colors.reset} src/lib/types/supabase.ts`);
  
  console.log(`\n${colors.bright}${colors.fg.yellow}Next steps:${colors.reset}`);
  console.log(`1. Review the generated types`);
  console.log(`2. Update any components that use database types`);
  console.log(`3. Commit the changes`);

} catch (error) {
  console.error(`${colors.fg.red}Error generating types:${colors.reset}`, error.message);
  process.exit(1);
}