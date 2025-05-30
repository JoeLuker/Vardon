/**
 * Unix Error Handling Tests
 * 
 * This file contains tests for the Unix-style error handling system.
 */

import { 
  ErrorCode,
  createError,
  success,
  failure,
  processErrorCode,
  withResource,
  withFile,
  tryWithResources,
  createErrorLogger,
  type Result,
  type SystemError
} from '../kernel/ErrorHandler';

/**
 * Test the error handling system
 * @returns Result of the test
 */
export async function testErrorHandling(): Promise<boolean> {
  console.log('\n----- TESTING ERROR HANDLING -----\n');
  
  let testsPassed = true;
  
  // Test error codes
  try {
    console.log('Testing error codes...');
    
    // Check that ErrorCode.SUCCESS is 0
    if (ErrorCode.SUCCESS !== 0) {
      console.error(`ERROR: ErrorCode.SUCCESS should be 0, got ${ErrorCode.SUCCESS}`);
      testsPassed = false;
    }
    
    console.log('Error codes test PASSED');
  } catch (err) {
    console.error('Error codes test FAILED:', err);
    testsPassed = false;
  }
  
  // Test createError
  try {
    console.log('Testing createError...');
    
    const error = createError(
      ErrorCode.ENOENT,
      'File not found',
      {
        component: 'TestComponent',
        operation: 'testOperation',
        path: '/test/path'
      }
    );
    
    // Check error structure
    if (error.code !== ErrorCode.ENOENT) {
      console.error(`ERROR: Expected error code ENOENT, got ${error.code}`);
      testsPassed = false;
    }
    
    if (error.message !== 'File not found') {
      console.error(`ERROR: Expected error message "File not found", got "${error.message}"`);
      testsPassed = false;
    }
    
    if (error.context.component !== 'TestComponent') {
      console.error(`ERROR: Expected component "TestComponent", got "${error.context.component}"`);
      testsPassed = false;
    }
    
    console.log('createError test PASSED');
  } catch (err) {
    console.error('createError test FAILED:', err);
    testsPassed = false;
  }
  
  // Test success/failure
  try {
    console.log('Testing success/failure...');
    
    const successResult = success<number>(42);
    
    // Check success result structure
    if (!successResult.success) {
      console.error('ERROR: Success result should have success=true');
      testsPassed = false;
    }
    
    if (successResult.errorCode !== ErrorCode.SUCCESS) {
      console.error(`ERROR: Success result should have errorCode=SUCCESS, got ${successResult.errorCode}`);
      testsPassed = false;
    }
    
    if (successResult.data !== 42) {
      console.error(`ERROR: Success result should have data=42, got ${successResult.data}`);
      testsPassed = false;
    }
    
    const failureResult = failure<number>(
      ErrorCode.ENOENT,
      'File not found',
      {
        component: 'TestComponent',
        operation: 'testOperation'
      }
    );
    
    // Check failure result structure
    if (failureResult.success) {
      console.error('ERROR: Failure result should have success=false');
      testsPassed = false;
    }
    
    if (failureResult.errorCode !== ErrorCode.ENOENT) {
      console.error(`ERROR: Failure result should have errorCode=ENOENT, got ${failureResult.errorCode}`);
      testsPassed = false;
    }
    
    if (failureResult.errorMessage !== 'File not found') {
      console.error(`ERROR: Failure result should have errorMessage="File not found", got "${failureResult.errorMessage}"`);
      testsPassed = false;
    }
    
    console.log('success/failure test PASSED');
  } catch (err) {
    console.error('success/failure test FAILED:', err);
    testsPassed = false;
  }
  
  // Test processErrorCode
  try {
    console.log('Testing processErrorCode...');
    
    const successResult = processErrorCode<string>(ErrorCode.SUCCESS, 'data');
    
    // Check success result structure
    if (!successResult.success) {
      console.error('ERROR: Success result should have success=true');
      testsPassed = false;
    }
    
    if (successResult.data !== 'data') {
      console.error(`ERROR: Success result should have data="data", got ${successResult.data}`);
      testsPassed = false;
    }
    
    const failureResult = processErrorCode<string>(ErrorCode.ENOENT);
    
    // Check failure result structure
    if (failureResult.success) {
      console.error('ERROR: Failure result should have success=false');
      testsPassed = false;
    }
    
    if (failureResult.errorCode !== ErrorCode.ENOENT) {
      console.error(`ERROR: Failure result should have errorCode=ENOENT, got ${failureResult.errorCode}`);
      testsPassed = false;
    }
    
    console.log('processErrorCode test PASSED');
  } catch (err) {
    console.error('processErrorCode test FAILED:', err);
    testsPassed = false;
  }
  
  // Test withResource
  try {
    console.log('Testing withResource...');
    
    // Mock resource
    const mockResource = {
      id: 'test-resource',
      isOpen: true,
      close: function() {
        this.isOpen = false;
      }
    };
    
    // Test successful operation
    const successResult = await withResource<typeof mockResource, string>(
      // Allocator
      () => ({ ...mockResource }),
      // Releaser
      (resource) => {
        resource.close();
      },
      // Operation
      (resource) => {
        return `Resource ${resource.id} accessed`;
      }
    );
    
    // Check success result
    if (!successResult.success) {
      console.error('ERROR: withResource successful operation should return success=true');
      testsPassed = false;
    }
    
    if (successResult.data !== 'Resource test-resource accessed') {
      console.error(`ERROR: withResource should return correct data, got "${successResult.data}"`);
      testsPassed = false;
    }
    
    // Test failing operation
    const failureResult = await withResource<typeof mockResource, string>(
      // Allocator
      () => ({ ...mockResource }),
      // Releaser
      (resource) => {
        resource.close();
      },
      // Operation that throws
      () => {
        throw new Error('Operation failed');
      }
    );
    
    // Check failure result
    if (failureResult.success) {
      console.error('ERROR: withResource failed operation should return success=false');
      testsPassed = false;
    }
    
    if (!failureResult.errorMessage?.includes('Operation failed')) {
      console.error(`ERROR: withResource should include original error message, got "${failureResult.errorMessage}"`);
      testsPassed = false;
    }
    
    console.log('withResource test PASSED');
  } catch (err) {
    console.error('withResource test FAILED:', err);
    testsPassed = false;
  }
  
  // Test tryWithResources
  try {
    console.log('Testing tryWithResources...');
    
    let resourceClosed = false;
    
    // Test successful operation
    const successResult = tryWithResources<string>(
      // Operation
      () => 'Operation succeeded',
      // Cleanup
      () => {
        resourceClosed = true;
      }
    );
    
    // Check success result
    if (!successResult.success) {
      console.error('ERROR: tryWithResources successful operation should return success=true');
      testsPassed = false;
    }
    
    if (successResult.data !== 'Operation succeeded') {
      console.error(`ERROR: tryWithResources should return correct data, got "${successResult.data}"`);
      testsPassed = false;
    }
    
    if (!resourceClosed) {
      console.error('ERROR: tryWithResources should have called cleanup function');
      testsPassed = false;
    }
    
    // Reset state
    resourceClosed = false;
    
    // Test failing operation
    const failureResult = tryWithResources<string>(
      // Operation that throws
      () => {
        throw new Error('Operation failed');
      },
      // Cleanup
      () => {
        resourceClosed = true;
      }
    );
    
    // Check failure result
    if (failureResult.success) {
      console.error('ERROR: tryWithResources failed operation should return success=false');
      testsPassed = false;
    }
    
    if (!resourceClosed) {
      console.error('ERROR: tryWithResources should have called cleanup function even after failure');
      testsPassed = false;
    }
    
    console.log('tryWithResources test PASSED');
  } catch (err) {
    console.error('tryWithResources test FAILED:', err);
    testsPassed = false;
  }
  
  // Test error logger
  try {
    console.log('Testing createErrorLogger...');
    
    // Create logger with a test component name
    const logger = createErrorLogger('TestComponent');
    
    // Check that logger has required methods
    if (typeof logger.error !== 'function') {
      console.error('ERROR: Logger should have error method');
      testsPassed = false;
    }
    
    if (typeof logger.warn !== 'function') {
      console.error('ERROR: Logger should have warn method');
      testsPassed = false;
    }
    
    if (typeof logger.info !== 'function') {
      console.error('ERROR: Logger should have info method');
      testsPassed = false;
    }
    
    if (typeof logger.debug !== 'function') {
      console.error('ERROR: Logger should have debug method');
      testsPassed = false;
    }
    
    // Test error method with a standard Error
    const error = new Error('Test error');
    const sysError = logger.error('An error occurred', error, {
      operation: 'testOperation'
    });
    
    // Check the returned SystemError
    if (sysError.code !== ErrorCode.EIO) {
      console.error(`ERROR: Logger error method should return SystemError with default EIO code, got ${sysError.code}`);
      testsPassed = false;
    }
    
    if (sysError.context.component !== 'TestComponent') {
      console.error(`ERROR: Logger error method should set component name, got ${sysError.context.component}`);
      testsPassed = false;
    }
    
    if (sysError.context.operation !== 'testOperation') {
      console.error(`ERROR: Logger error method should pass operation context, got ${sysError.context.operation}`);
      testsPassed = false;
    }
    
    console.log('createErrorLogger test PASSED');
  } catch (err) {
    console.error('createErrorLogger test FAILED:', err);
    testsPassed = false;
  }
  
  // Final result
  if (testsPassed) {
    console.log('\n✅ ALL ERROR HANDLING TESTS PASSED');
  } else {
    console.error('\n❌ SOME ERROR HANDLING TESTS FAILED');
  }
  
  return testsPassed;
}

// Mock kernel for testing
const mockKernel = {
  open: (path: string) => 42,
  close: (fd: number) => ErrorCode.SUCCESS,
  read: (fd: number) => [ErrorCode.SUCCESS, { data: 'test' }],
  write: (fd: number, data: any) => ErrorCode.SUCCESS
};

// Test withFile
export async function testWithFile(): Promise<boolean> {
  console.log('\n----- TESTING WITH FILE -----\n');
  
  let testsPassed = true;
  
  try {
    console.log('Testing withFile...');
    
    // Test successful operation
    const result = await withFile<string>(
      mockKernel,
      '/test/path',
      'r',
      (fd) => {
        if (fd !== 42) {
          throw new Error(`Expected fd 42, got ${fd}`);
        }
        return 'File operation succeeded';
      }
    );
    
    // Check success result
    if (!result.success) {
      console.error('ERROR: withFile successful operation should return success=true');
      testsPassed = false;
    }
    
    if (result.data !== 'File operation succeeded') {
      console.error(`ERROR: withFile should return correct data, got "${result.data}"`);
      testsPassed = false;
    }
    
    console.log('withFile test PASSED');
  } catch (err) {
    console.error('withFile test FAILED:', err);
    testsPassed = false;
  }
  
  // Final result
  if (testsPassed) {
    console.log('\n✅ ALL WITHFILE TESTS PASSED');
  } else {
    console.error('\n❌ SOME WITHFILE TESTS FAILED');
  }
  
  return testsPassed;
}

/**
 * Run all error handling tests
 */
export async function runErrorHandlingTests(): Promise<boolean> {
  console.log('\n===== RUNNING ERROR HANDLING TESTS =====\n');
  
  const results = await Promise.all([
    testErrorHandling(),
    testWithFile(),
  ]);
  
  const allPassed = results.every(r => r);
  
  if (allPassed) {
    console.log('\n✅ ALL ERROR HANDLING TESTS PASSED\n');
  } else {
    console.error('\n❌ SOME ERROR HANDLING TESTS FAILED\n');
  }
  
  return allPassed;
}

// Allow running this module directly
if (require.main === module) {
  runErrorHandlingTests().catch(console.error);
}