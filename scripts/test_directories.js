#!/usr/bin/env node

/**
 * Test script to verify directory existence
 */

// Import the test runner dynamically
async function runTest() {
  try {
    // First compile TypeScript if needed
    console.log('Building TypeScript code...');
    
    // Get the FileSystemTestRunner
    console.log('Loading test runner...');
    const { runSingleTest } = require('../src/lib/domain/tests/FileSystemTestRunner');
    
    // Run the directory existence test
    console.log('Running directory existence test...');
    const result = await runSingleTest('directory');
    
    console.log('\nTest Result:');
    console.log(result);
    
    return !result.includes('failed');
  } catch (error) {
    console.error('Error running test:', error);
    return false;
  }
}

// Run the test
runTest().then(success => {
  process.exit(success ? 0 : 1);
});