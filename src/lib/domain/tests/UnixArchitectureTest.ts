/**
 * Unix Architecture Test
 * 
 * This test script demonstrates the new Unix-like architecture with persistent filesystem.
 */

import { Kernel, FileSystem, FileType } from '../kernel';
import { ErrorCode, OpenMode } from '../kernel/types';

/**
 * Run a basic test of the Unix architecture
 */
export async function runUnixArchitectureTest(): Promise<void> {
  console.log("==== Unix Architecture Test Starting ====");
  
  // Create a new kernel with debug logging
  const kernel = new Kernel({ debug: true });
  
  console.log("\n=== Creating and navigating filesystem structure ===");
  
  // Create a test directory
  const mkdirResult = kernel.mkdir('/test');
  console.log(`Create /test directory: ${mkdirResult.success ? 'success' : mkdirResult.errorMessage}`);
  
  // Create a test file
  const createResult = kernel.create('/test/hello.txt', { message: 'Hello, Unix world!' });
  console.log(`Create test file: ${createResult.success ? 'success' : createResult.errorMessage}`);
  
  // List files in the /test directory
  const [lsResult, entries] = kernel.readdir('/test');
  console.log(`List /test directory (${entries.length} entries):`);
  entries.forEach((entry) => {
    console.log(`  - ${entry.name} (${entry.type})`);
  });
  
  console.log("\n=== Working with file descriptors ===");
  
  // Open the file
  const fd = kernel.open('/test/hello.txt', OpenMode.READ);
  console.log(`Open file descriptor: ${fd}`);
  
  // Read from file descriptor
  const [readResult, data] = kernel.read(fd);
  console.log(`Read result: ${readResult === ErrorCode.SUCCESS ? 'success' : readResult}`);
  console.log(`File content: ${JSON.stringify(data)}`);
  
  // Close file descriptor
  const closeResult = kernel.close(fd);
  console.log(`Close file: ${closeResult === ErrorCode.SUCCESS ? 'success' : closeResult}`);
  
  console.log("\n=== Testing device mounting ===");
  
  // Create a test device
  const testDevice = {
    id: 'test-device',
    version: '1.0.0',
    
    onMount(kernel: any): void {
      console.log("Test device mounted");
    },
    
    read(fd: number, buffer: any): number {
      console.log(`Device read from fd ${fd}`);
      buffer.deviceData = { message: "Reading from test device" };
      return ErrorCode.SUCCESS;
    },
    
    write(fd: number, buffer: any): number {
      console.log(`Device write to fd ${fd}: ${JSON.stringify(buffer)}`);
      return ErrorCode.SUCCESS;
    }
  };
  
  // Mount the device
  const mountResult = kernel.mount('/dev/test', testDevice);
  console.log(`Mount device: ${mountResult.success ? 'success' : mountResult.errorMessage}`);
  
  // Open the device file
  const deviceFd = kernel.open('/dev/test', OpenMode.READ_WRITE);
  console.log(`Open device fd: ${deviceFd}`);
  
  // Read from device
  const deviceBuffer = {};
  const [deviceReadResult, deviceData] = kernel.read(deviceFd);
  console.log(`Device read result: ${deviceReadResult === ErrorCode.SUCCESS ? 'success' : deviceReadResult}`);
  console.log(`Device data: ${JSON.stringify(deviceData)}`);
  
  // Write to device
  const deviceWriteResult = kernel.write(deviceFd, { command: "test" });
  console.log(`Device write result: ${deviceWriteResult === ErrorCode.SUCCESS ? 'success' : deviceWriteResult}`);
  
  // Close device
  kernel.close(deviceFd);
  
  console.log("\n=== Persistence test ===");
  
  // Unmount filesystem (this saves to localStorage)
  await kernel.shutdown();
  console.log("Kernel shutdown complete");
  
  // Create a new kernel instance (should restore from localStorage)
  console.log("\nCreating new kernel instance (should restore state)...");
  const kernel2 = new Kernel({ debug: true });
  
  // Check if our test file is still there
  const fileExists = kernel2.exists('/test/hello.txt');
  console.log(`Test file still exists: ${fileExists}`);
  
  if (fileExists) {
    // Read the file to verify contents
    const fd2 = kernel2.open('/test/hello.txt', OpenMode.READ);
    const [readResult2, data2] = kernel2.read(fd2);
    console.log(`Read from restored file: ${JSON.stringify(data2)}`);
    kernel2.close(fd2);
  }
  
  // Shut down the second kernel
  await kernel2.shutdown();
  
  console.log("\n==== Unix Architecture Test Complete ====");
}

// Auto-run the test if this file is executed directly
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    runUnixArchitectureTest().catch(console.error);
  });
}