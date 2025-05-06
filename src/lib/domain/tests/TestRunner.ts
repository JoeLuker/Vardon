/**
 * Test Runner
 * 
 * This file provides a simple test runner for system architecture tests.
 */

import { runCharacterTest } from './CharacterTest';
import { runSystemTest } from './SystemTest';

/**
 * Test suites available to run
 */
const TEST_SUITES: Record<string, () => Promise<void>> = {
  character: runCharacterTest,
  system: runSystemTest
};

/**
 * Run selected test suites
 * @param suites Test suites to run
 */
export async function runTests(suites?: string[]): Promise<void> {
  console.group('=== System Architecture Tests ===');
  console.time('Full test suite time');
  
  try {
    const suitesToRun = suites || Object.keys(TEST_SUITES);
    
    console.log(`Running test suites: ${suitesToRun.join(', ')}`);
    
    for (const suite of suitesToRun) {
      if (TEST_SUITES[suite]) {
        console.group(`Running test suite: ${suite}`);
        console.time(`${suite} test suite time`);
        
        try {
          await TEST_SUITES[suite]();
        } catch (error) {
          console.error(`Error in test suite ${suite}:`, error);
        } finally {
          console.timeEnd(`${suite} test suite time`);
          console.groupEnd();
        }
      } else {
        console.warn(`Unknown test suite: ${suite}`);
      }
    }
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    console.timeEnd('Full test suite time');
    console.groupEnd();
  }
}

// Make it available globally for the console
// 'as any' is needed because we're dynamically adding properties to the window object
// which TypeScript doesn't know about at compile time
(window as any).runTests = runTests;

// Auto-run all tests if this file is executed directly
if (typeof window !== 'undefined') {
  runTests().catch(error => {
    console.error('Unhandled error in tests:', error);
  });
}