/**
 * Unix Architecture Test Runner
 * 
 * This module provides a simple test runner for the Unix architecture tests.
 */

import { runUnixArchitectureTest } from './UnixArchitectureTest';
import { runUnixCharacterTest } from './UnixCharacterTest';

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
  
  const tests = [
    { name: 'Unix Architecture Test', fn: runUnixArchitectureTest },
    { name: 'Unix Character Test', fn: runUnixCharacterTest }
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

// Allow running directly
if (typeof window === 'undefined' && require.main === module) {
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