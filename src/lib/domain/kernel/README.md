# Unix Architecture Kernel

This module implements a Unix-like kernel architecture for the Vardon application. It follows the Unix philosophy:

1. Make each program do one thing well
2. Write programs to work together
3. Write programs to handle text streams, because that is a universal interface
4. Everything is a file

## Overview

The Unix architecture in this module consists of several key components:

1. **Kernel** - The core operating system component that manages resources and provides system calls
2. **FileSystem** - A persistent filesystem implemented with localStorage
3. **Capabilities** - Device drivers mounted at specific paths in the filesystem
4. **Process Model** - Plugins that operate on entities (files)
5. **EventBus** - A signal system for inter-process communication

## Key Files

- `Kernel.ts` - The core kernel implementation with system calls
- `FileSystem.ts` - The persistent filesystem implementation
- `types.ts` - Core type definitions for the Unix architecture
- `EventBus.ts` - Event system implementation
- `MessageQueue.ts` - IPC message queue implementation

## Filesystem Structure

The kernel initializes a standard Unix-like filesystem structure:

- `/bin` - Executable plugins
- `/dev` - Device files (capabilities)
- `/etc` - Configuration files
- `/home` - User home directories
- `/proc` - Process information
- `/sys` - System information
- `/tmp` - Temporary files
- `/var` - Variable data
- `/entity` - Game entities

## System Calls

The kernel implements standard Unix system calls:

- `open()` - Open a file descriptor
- `read()` - Read from a file descriptor
- `write()` - Write to a file descriptor
- `close()` - Close a file descriptor
- `mkdir()` - Create a directory
- `unlink()` - Delete a file
- `readdir()` - List directory contents
- `stat()` - Get file information
- `ioctl()` - Device control

## Persistence

The filesystem state is persisted between sessions using localStorage. This allows:

- Persistent configuration settings
- Caching of entity data
- Recovery of state after page reloads

## Error Handling

The kernel uses Unix-style error codes (errno values) for consistent error handling:

- `ENOENT` - No such file or directory
- `EACCES` - Permission denied
- `EBADF` - Bad file descriptor
- `EINVAL` - Invalid argument
- etc.

## Usage Example

```typescript
// Initialize kernel
const kernel = new Kernel({ debug: true });

// Create a file
kernel.create('/tmp/test.json', { data: 'Hello world' });

// Open the file
const fd = kernel.open('/tmp/test.json', OpenMode.READ_WRITE);

// Read file contents
const [readResult, data] = kernel.read(fd);

// Modify data
data.data = 'Updated content';

// Write updated data
kernel.write(fd, data);

// Close file descriptor
kernel.close(fd);

// Clean up
kernel.shutdown();
```

## Device Implementation

Devices (capabilities) can be implemented and mounted in the filesystem:

```typescript
const myDevice = {
  id: 'mydevice',
  version: '1.0.0',
  
  onMount(kernel) {
    console.log('Device mounted');
  },
  
  read(fd, buffer) {
    buffer.data = 'Device data';
    return ErrorCode.SUCCESS;
  },
  
  write(fd, buffer) {
    console.log('Write to device:', buffer);
    return ErrorCode.SUCCESS;
  }
};

// Mount the device
kernel.mount('/dev/mydevice', myDevice);
```