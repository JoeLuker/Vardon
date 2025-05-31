# Vardon CLI Test Suite

This directory contains comprehensive CLI tests for the Vardon Unix-inspired Pathfinder character management system. These tests can be run independently from the command line without requiring a browser or web interface.

## Test Structure

### Test Suites

1. **unix-architecture-tests.ts** - Core Unix filesystem and kernel validation
2. **character-system-tests.ts** - Character creation, abilities, skills, and combat
3. **database-tests.ts** - Database capability and schema validation
4. **filesystem-tests.ts** - Virtual filesystem persistence and storage
5. **capability-tests.ts** - Capability composition and device operations
6. **plugin-tests.ts** - Plugin system and feat application
7. **performance-tests.ts** - Performance benchmarks and optimization
8. **integration-tests.ts** - Full end-to-end system integration

### Test Framework

The CLI test framework (`cli-runner.ts`) provides:

- Colorized output with ANSI codes
- Assertion helpers for common test patterns
- Performance timing and measurement
- Test filtering and verbose output
- Automatic test discovery and registration

## Running Tests

### All Tests

```bash
npm run test:cli
```

### Verbose Output

```bash
npm run test:cli:verbose
```

### Specific Test Suites

```bash
npm run test:cli:unix         # Unix architecture
npm run test:cli:character    # Character system
npm run test:cli:database     # Database operations
npm run test:cli:filesystem   # Filesystem persistence
npm run test:cli:capability   # Capability system
npm run test:cli:plugin       # Plugin system
npm run test:cli:performance  # Performance benchmarks
npm run test:cli:integration  # Integration tests
```

### Filter Tests

```bash
npm run test:cli filesystem   # Any suite containing "filesystem"
npm run test:cli:verbose performance  # Performance tests with verbose output
```

## Test Categories

### 🔧 Unix Architecture Tests

Validates core Unix principles:

- Absolute path enforcement
- File descriptor management
- Standard directory structure (/dev, /proc, /entity, etc.)
- Device mounting and unmounting
- File permissions and access control
- Path normalization and resolution

### 👤 Character System Tests

Tests character mechanics:

- Character entity creation and modification
- Ability score calculations and modifiers
- Skill rank and bonus calculations
- Combat statistics (AC, HP, saves)
- Multi-class character handling
- Character templates and validation

### 💾 Database Tests

Validates database integration:

- Database capability mounting
- Schema registration and validation
- Query execution through filesystem
- Batch operations and error handling
- Connection lifecycle management
- Metadata queries

### 📁 Filesystem Tests

Tests virtual filesystem:

- File creation and persistence
- Directory hierarchy persistence
- Storage size limits and optimization
- Mount point persistence
- Corruption recovery
- Cross-session data persistence

### ⚙️ Capability Tests

Tests capability composition:

- Capability mounting and unmounting
- Device file operations (read/write)
- Multiple capability composition
- Inter-capability communication
- Error handling and validation
- Performance optimization

### 🔌 Plugin Tests

Tests plugin system:

- Plugin registration and discovery
- Plugin execution and error handling
- Skill Focus feat application
- Plugin dependencies and signals
- Options validation and lifecycle

### ⚡ Performance Tests

Benchmarks system performance:

- Filesystem operation throughput
- Kernel syscall performance
- Character calculation speed
- Memory efficiency patterns
- Concurrent operation handling
- Large data processing

### 🔗 Integration Tests

End-to-end system validation:

- Complete character creation workflow
- Character progression and leveling
- Combat damage and healing
- Equipment and bonus stacking
- Spell management
- System-wide event propagation

## Test Output

### Success Example

```
🚀 Starting Vardon CLI Tests...

Vardon CLI Test Runner

Running Unix Architecture Tests
Tests for Unix-style filesystem, kernel syscalls, and device management

  ✓ Absolute path validation (2.1ms)
  ✓ File descriptor lifecycle (15.3ms)
  ✓ Directory creation and listing (8.7ms)
  ...

Unix Architecture: 10 passed, 0 failed (245.1ms)
```

### Failure Example

```
Running Character System Tests
Tests for character entities, abilities, skills, and combat calculations

  ✗ Create basic character entity
    Expected true, got false
  ✓ Ability score initialization and modifiers (12.4ms)
  ...

Character System: 9 passed, 1 failed (198.3ms)
```

## Writing New Tests

### Basic Test Structure

```typescript
import { registerTestSuite, TestContext, results } from './cli-runner';

registerTestSuite({
	name: 'My Test Suite',
	description: 'Tests for my feature',
	tags: ['feature', 'unit'],
	run: async () => {
		const ctx = new TestContext('My Tests');

		ctx.test('should do something', () => {
			ctx.assertEquals(1 + 1, 2, '1 + 1 should equal 2');
		});

		await ctx.asyncTest('should do async thing', async () => {
			const result = await someAsyncOperation();
			ctx.assertNotNull(result, 'Should return a result');
		});

		results.push(ctx.getResults());
	}
});
```

### Assertion Methods

- `assertEquals(actual, expected, message?)`
- `assertNotEquals(actual, expected, message?)`
- `assertTrue(value, message?)`
- `assertFalse(value, message?)`
- `assertNull(value, message?)`
- `assertNotNull(value, message?)`
- `assertDefined(value, message?)`
- `assertThrows(fn, expectedError?)`
- `assertAsyncThrows(fn, expectedError?)`
- `assertGreaterThan(actual, expected, message?)`
- `assertLessThan(actual, expected, message?)`
- `assertArrayEquals(actual, expected, message?)`
- `assertContains(haystack, needle, message?)`

## Performance Benchmarks

The performance tests provide baseline measurements:

| Operation               | Target    | Typical   |
| ----------------------- | --------- | --------- |
| File Creation           | >100/sec  | ~500/sec  |
| File Reading            | >1000/sec | ~2000/sec |
| Syscalls                | >1000/sec | ~1500/sec |
| Character Creation      | >10/sec   | ~25/sec   |
| Character Loading       | >100/sec  | ~200/sec  |
| Capability Calculations | >50/sec   | ~100/sec  |

## CI/CD Integration

Tests are designed for automated CI/CD:

```yaml
# Example GitHub Actions
- name: Run CLI Tests
  run: npm run test:cli

- name: Run Performance Tests
  run: npm run test:cli:performance
```

## Debugging Failed Tests

1. **Verbose Output**: Add `--verbose` flag for detailed test execution
2. **Single Suite**: Run specific test suite to isolate issues
3. **Console Logs**: Tests include performance metrics and debug info
4. **Stack Traces**: Failed assertions include stack traces

## Test Environment

Tests run in Node.js with:

- TypeScript compilation via ts-node
- Mock localStorage for browser APIs
- Unix-style path handling
- ANSI color output for terminals

## Best Practices

1. **Independent Tests**: Each test should be self-contained
2. **Cleanup**: Tests should clean up resources (files, entities)
3. **Performance**: Include timing for critical operations
4. **Error Handling**: Test both success and failure cases
5. **Documentation**: Clear test names and assertion messages
