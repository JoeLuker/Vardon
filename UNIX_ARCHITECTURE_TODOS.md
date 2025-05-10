# Unix Architecture Improvement TODOs

This document outlines current issues with our Unix-style architecture implementation and provides recommended fixes to better align with Unix principles.

## Implementation Progress Report (May 9, 2025)

We've created a comprehensive static analysis script (`check_unix_architecture.sh`) to verify Unix architecture compliance across the codebase. The script checks for direct Supabase imports, database access patterns, deprecated method usage, kernel file operations, Unix-style file paths, and proper file descriptor management.

Current findings:

- **Direct Supabase Imports**: 10 files still directly import from supabaseClient
- **Direct Database Access**: 57+ instances of direct database access found
- **Deprecated Method Usage**: 3 instances of `getSupabaseClient()` usage found
- **Kernel File Operations**: Found 815 uses of kernel file operations (good progress!)
- **Unix File Paths**: Found file paths like `/proc/character/` being used
- **File Descriptor Management**: Potential file descriptor leak with 171 close() calls but 170 open() calls

### Immediate Action Items

Based on the script findings, the following items need to be addressed immediately:

1. **Remove Direct Supabase Imports**: Fix the 10 files still importing directly from supabaseClient
2. **Fix Database Access in CompatibilityLayer**: Update the compatibility layer to use file operations
3. **Fix UI Component Database Access**: Update UI components to use file operations
4. **Fix File Descriptor Management**: Ensure proper try/finally blocks for all file operations
5. **Fix Entity/Schema Path Usage**: Expand use of `/proc/entity/` and `/proc/schema/` paths

### Specific Tasks (Prioritized)

#### High Priority

- [x] **Generate Type-Safe Database Schema**: Generate TypeScript types for database schema (completed May 9, 2025)
  - Created `database.types.ts` with Supabase schema types
  - Added helper types in `src/lib/types/supabase.ts`
  - Updated CharacterCapability and SupabaseDatabaseDriver to use type-safe definitions
  - Added script to regenerate types: `npm run types:generate`

1. **Remove Direct Imports**
   - Fix `/src/lib/db/index.ts` to remove direct export of supabase
   - Update `/src/lib/domain/capabilities/database/SupabaseDatabaseDriver.ts` to use kernel file operations
   - Update `/src/lib/domain/tests/DirectoryExistenceTest.ts` and `/src/lib/domain/tests/SystemTest.ts` for Unix compliance
   - Remove supabase import from `/src/lib/domain/state/data/StreamDatabase.ts`
   - Update `/src/lib/domain/application.ts` and `/src/lib/domain/application-new.ts` to use file operations
   - Migrate route components to file operations:
     - In `/src/routes/+page.svelte`:
       - Remove `import { supabase } from '$lib/db/supabaseClient';`
       - Replace `const gameRules = new GameRulesAPI(supabase);` with `const gameRules = new GameRulesAPI();`
       - Ensure proper kernel initialization
     - In `/src/routes/+layout.svelte` and `/src/routes/characters/[id]/+page.server.ts`: Make similar changes

2. **Fix CompatibilityLayer**
   - Update `/src/lib/domain/capabilities/database/CompatibilityLayer.ts` to replace `getSupabaseClient()` with file operations:
     - Line 273: Replace `const supabase = gameRulesAPI.getSupabaseClient();` with direct file operations
     - Use kernel file operations (open, read, write, close) to perform the same operations
     - Ensure proper try/finally blocks for file descriptors

3. **Balance File Descriptors**
   - Identify the source of the imbalance between open (170) and close (171) operations
   - Ensure all file operations use try-finally blocks for cleanup

#### Medium Priority

4. **Expand File Path Usage**
   - Implement and use `/proc/entity/` paths for entity operations
   - Implement and use `/proc/schema/` paths for schema operations
   - Update documentation in `DATABASE_FILE_PATH_MAPPING.md` if changes are needed

5. **Fix State Drivers**
   - Update `/src/lib/domain/state/data/StreamDatabase.ts` to use file operations
   - Complete the refactoring of `/src/lib/domain/state/data/SupabaseDriver.ts`

#### Low Priority

6. **Enhance ESLint Rules**
   - Add more specific ESLint rules to catch direct database access
   - Add ESLint rule to enforce try-finally blocks for file operations

7. **Improve Documentation**
   - Update developer documentation with examples of proper Unix file operations
   - Create patterns and best practices document for Unix architecture

8. **CI/CD Integration**
   - Add the `check_unix_architecture.sh` script to CI pipeline
   - Fail builds if Unix architecture compliance check fails
   - Add script to pre-commit hook for local development

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