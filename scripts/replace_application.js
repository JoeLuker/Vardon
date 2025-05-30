/**
 * Replace Application Script
 * 
 * This script replaces the current application.ts file with the simplified version
 * that only uses plugins and no longer needs the feature system.
 */

import fs from 'fs';
import path from 'path';

// Paths
const BACKUP_SUFFIX = '.backup';
const SOURCE_PATH = path.resolve('scripts/simplified_application.ts');
const TARGET_PATH = path.resolve('src/lib/domain/application.ts');
const BACKUP_PATH = TARGET_PATH + BACKUP_SUFFIX;

// Main function
async function replaceApplication() {
  try {
    console.log('Starting application replacement...');
    
    // Check if source file exists
    if (!fs.existsSync(SOURCE_PATH)) {
      throw new Error(`Source file not found: ${SOURCE_PATH}`);
    }
    
    // Check if target file exists
    if (!fs.existsSync(TARGET_PATH)) {
      throw new Error(`Target file not found: ${TARGET_PATH}`);
    }
    
    // Create backup of target file
    console.log(`Creating backup of ${TARGET_PATH} to ${BACKUP_PATH}...`);
    fs.copyFileSync(TARGET_PATH, BACKUP_PATH);
    
    // Copy source file to target
    console.log(`Replacing ${TARGET_PATH} with ${SOURCE_PATH}...`);
    fs.copyFileSync(SOURCE_PATH, TARGET_PATH);
    
    console.log('Replacement completed successfully.');
    console.log(`Original file backed up to: ${BACKUP_PATH}`);
    console.log('The application now uses only the plugin system, with no dependence on features.');
  } catch (error) {
    console.error('Error replacing application:', error.message);
    process.exit(1);
  }
}

// Run the script
replaceApplication();