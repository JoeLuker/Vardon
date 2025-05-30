/**
 * Unix Architecture Test Runner
 * 
 * This module provides a simple test runner for the Unix architecture tests.
 */

import { runUnixArchitectureTest } from './UnixArchitectureTest';
import { runUnixCharacterTest } from './UnixCharacterTest';
import { runDatabaseCapabilityTest } from './DatabaseCapabilityTest';
import { runErrorHandlingTests } from './ErrorHandlingTest';
import { runDirectoryExistenceTest } from './DirectoryExistenceTest';

/**
 * Test result interface
 */
interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  duration: number;
}

/**
 * Run a specific test and return the result
 * @param testName Test name
 * @param testFn Test function
 * @returns Test result
 */
async function runTest(testName: string, testFn: () => Promise<string>): Promise<TestResult> {
  console.log(`\nRunning test: ${testName}...`);
  console.log('-'.repeat(50));
  
  const startTime = performance.now();
  
  try {
    const result = await testFn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log('-'.repeat(50));
    console.log(`✅ Test "${testName}" completed in ${duration.toFixed(2)}ms`);
    
    return {
      testName,
      success: true,
      message: result,
      duration
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error('-'.repeat(50));
    console.error(`❌ Test "${testName}" failed in ${duration.toFixed(2)}ms`);
    console.error(error);
    
    return {
      testName,
      success: false,
      message: error.message || String(error),
      duration
    };
  }
}

/**
 * Run all Unix architecture tests
 * @returns Summary of test results
 */
export async function runAllUnixTests(): Promise<string> {
  console.log('Unix Architecture Test Runner');
  console.log('============================');
  
  /**
   * Test for the new Unix character assembler
   */
  async function runUnixCharacterAssemblerTest(): Promise<string> {
    console.log('Running Unix Character Assembler Test...');
    
    try {
      // Import dynamically to avoid circular dependencies
      const { UnixCharacterAssembler } = await import('../character/CharacterAssembler.unix');
      const { GameKernel } = await import('../kernel/GameKernel');
      
      // Create test kernel
      const kernel = new GameKernel({
        debug: true,
        noFsEvents: false
      });
      
      // Create standard directories
      kernel.mkdir('/dev');
      kernel.mkdir('/entity');
      kernel.mkdir('/proc');
      kernel.mkdir('/proc/features');
      kernel.mkdir('/var');
      kernel.mkdir('/var/log');
      
      // Create character assembler
      const assembler = new UnixCharacterAssembler(kernel);
      
      // Create test character data
      const characterData = {
        id: 123,
        name: 'Test Character',
        game_character_class: [
          { level: 5, class: { name: 'Fighter' } }
        ],
        game_character_ancestry: [
          { ancestry: { name: 'Human' } }
        ]
      };
      
      // Attempt to assemble character
      console.log('Assembling test character...');
      const result = await assembler.assembleCharacter(characterData);
      
      // Check result
      if (result.success) {
        console.log('Character assembly successful!');
        console.log('Character name:', result.data.name);
        return 'Unix Character Assembler Test completed successfully';
      } else {
        console.error('Character assembly failed:', result.errorMessage);
        return `Unix Character Assembler Test failed: ${result.errorMessage}`;
      }
    } catch (error) {
      console.error('Unix Character Assembler Test failed with exception:', error);
      throw error;
    }
  }

  const tests = [
    { name: 'Directory Existence Test', fn: runDirectoryExistenceTest },
    { name: 'Unix Architecture Test', fn: runUnixArchitectureTest },
    { name: 'Unix Character Test', fn: runUnixCharacterTest },
    { name: 'Unix Database Test', fn: runDatabaseCapabilityTest },
    { name: 'Unix Error Handling Test', fn: runErrorHandlingTests },
    { name: 'Unix Character Assembler Test', fn: runUnixCharacterAssemblerTest }
  ];
  
  const results: TestResult[] = [];
  
  for (const test of tests) {
    const result = await runTest(test.name, test.fn);
    results.push(result);
  }
  
  // Print summary
  console.log('\nTest Summary');
  console.log('===========');
  
  let passed = 0;
  let failed = 0;
  
  for (const result of results) {
    if (result.success) {
      passed++;
      console.log(`✅ ${result.testName}: PASSED (${result.duration.toFixed(2)}ms)`);
    } else {
      failed++;
      console.log(`❌ ${result.testName}: FAILED (${result.duration.toFixed(2)}ms)`);
      console.log(`   Error: ${result.message}`);
    }
  }
  
  // Final summary
  const totalTests = results.length;
  const passRate = Math.round((passed / totalTests) * 100);
  
  const summary = `${passed}/${totalTests} tests passed (${passRate}%)`;
  console.log(`\n${summary}`);
  
  return summary;
}

/**
 * Run a single test by name
 * @param testName Name of the test to run
 * @returns Test result
 */
export async function runSingleTest(testName: string): Promise<string> {
  const tests = {
    'directory': runDirectoryExistenceTest,
    'architecture': runUnixArchitectureTest,
    'character': runUnixCharacterTest,
    'database': runDatabaseCapabilityTest,
    'error': runErrorHandlingTests
  };
  
  const testFn = tests[testName.toLowerCase()];
  
  if (!testFn) {
    return `Test "${testName}" not found. Available tests: ${Object.keys(tests).join(', ')}`;
  }
  
  const result = await runTest(testName, testFn);
  
  return result.success 
    ? `✅ Test "${testName}" passed: ${result.message}`
    : `❌ Test "${testName}" failed: ${result.message}`;
}

// Allow running directly
if (typeof window === 'undefined' && require.main === module) {
  // Check if a specific test was requested
  const testName = process.argv[2];
  
  if (testName) {
    runSingleTest(testName).then(
      result => {
        console.log(`\n${result}`);
        process.exit(result.includes('✅') ? 0 : 1);
      },
      error => {
        console.error('Runner error:', error);
        process.exit(1);
      }
    );
  } else {
    // Run all tests
    runAllUnixTests().then(
      result => {
        console.log(`\n${result}`);
        // Exit with appropriate code
        process.exit(result.includes('100%') ? 0 : 1);
      },
      error => {
        console.error('Runner error:', error);
        process.exit(1);
      }
    );
  }
}