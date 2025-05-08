# Unix Architecture Improvement TODOs

This document outlines current issues with our Unix-style architecture implementation and provides recommended fixes to better align with Unix principles.

## Current Architectural Issues

### 1. Filesystem Persistence Issues

**Problem:** Filesystem structure is recreated on each initialization
- Directories are recreated in multiple places (kernel, capabilities, UI components)
- No persistence between sessions
- Race conditions during directory creation

**Solution:**
- Implement filesystem persistence using localStorage or IndexedDB
- Initialize filesystem structure only once during system boot
- Move all directory creation to a central initialization function in the kernel
- Implement proper mount points that survive restarts

### 2. Kernel/Device Boundary Violations

**Problem:** Devices/capabilities have direct references to the kernel
- Capabilities manipulate filesystem directly
- Window-global kernel references
- Kernel directly accesses capability internals

**Solution:**
- Make kernel truly singleton with proper isolation
- Devices should receive specific capabilities/permissions at mount time
- Use proper system call interface for all kernel operations
- Remove direct references to the kernel from capabilities

### 3. Device Registration & Initialization

**Problem:** Inconsistent device mounting and initialization
- Capabilities sometimes try to create their own directories
- No standard capability registration process
- Manual capability initialization in UI components

**Solution:**
- Create a formal device registration process
- Implement a consistent capability lifecycle (init, mount, unmount, shutdown)
- Move device mounting to a system initialization phase
- Use proper syscall interfaces for device communication

### 4. Process Isolation

**Problem:** Lack of proper process isolation
- UI components have direct access to kernel and capabilities
- No separation between privileged and unprivileged operations
- Components bypass the kernel to access each other

**Solution:**
- Implement a process-like abstraction
- Create user/kernel space separation
- Add permission checks for privileged operations
- Use message passing instead of direct references

### 5. Error Handling

**Problem:** Inconsistent error handling
- Some errors are handled with error codes, others with exceptions
- No uniform error propagation mechanism
- Missing error recovery strategies

**Solution:**
- Implement uniform error codes like in Unix (errno)
- Add proper error propagation throughout the system
- Create recovery mechanisms for common failure scenarios
- Add system-level logging for errors

### 6. Streaming & Piping

**Problem:** Missing Unix-style streaming concepts
- No input/output redirection
- No piping between components
- Operations are monolithic instead of composable

**Solution:**
- Implement stream abstractions
- Add piping between operations
- Make operations compose together like Unix commands
- Implement redirections for inputs and outputs

### 7. File Descriptor Management

**Problem:** File descriptors are not properly managed
- FDs sometimes leak
- No consistent tracking of open descriptors
- Missing standard descriptors (stdin, stdout, stderr)

**Solution:**
- Implement proper file descriptor table
- Add automatic cleanup of file descriptors
- Create standard descriptors for each process
- Add runtime checks for descriptor limits

## Implementation Priorities

1. **High Priority:** Fix filesystem persistence and initialization
2. **High Priority:** Implement proper kernel/capability boundary
3. **Medium Priority:** Standardize error handling
4. **Medium Priority:** Proper file descriptor management
5. **Low Priority:** Add process isolation
6. **Low Priority:** Implement streaming and piping

## Architectural Principles to Follow

- **Everything is a file:** All resources should be accessed through the filesystem
- **Composition over inheritance:** Small tools working together
- **Principle of least privilege:** Components should have minimal access rights
- **Single responsibility:** Each component should do one thing well
- **Separation of concerns:** Kernel, drivers, and applications should have clear boundaries