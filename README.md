# Vardon

A Unix-inspired character management system for Pathfinder 1e that treats game entities as files in a virtual filesystem.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![SvelteKit](https://img.shields.io/badge/SvelteKit-2.0-orange)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## Features

- 🎲 **Complete Pathfinder 1e Character Management** - Full support for characters, classes, feats, spells, and more
- 🗂️ **Unix-Inspired Architecture** - Everything is a "file" with capabilities attached, following Unix design principles
- 🔌 **Plugin System** - Extensible architecture for adding new game features
- 💾 **Dual Storage** - Local browser storage with Supabase cloud sync
- 🎯 **Type-Safe** - Full TypeScript implementation with generated types from database schema
- 📊 **Real-time Calculations** - Automatic calculation of ability modifiers, saving throws, AC, and more

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
# Create a .env file with your Supabase credentials
# See ENV_GUIDE.md for required variables

# Start development server
npm run dev

# Build for production
npm run build
```

## Architecture Overview

Vardon implements a Unix-inspired architecture where game entities are treated as files in a virtual filesystem:

```
/characters/{id}              # Character entities
/characters/{id}/abilities    # Ability scores
/characters/{id}/skills       # Skills
/characters/{id}/combat       # Combat stats
/templates/                   # Character templates
/data/                       # Game rules data
```

### Core Concepts

1. **Kernel** - The core system that manages the virtual filesystem and capabilities
2. **Capabilities** - "Device drivers" that provide specific functionality (abilities, skills, combat)
3. **Entities** - Game objects stored as "files" with metadata and properties
4. **Plugins** - Extensible features that can be composed to create complex behaviors

### Example: Unix-Style Operations

```typescript
// Open a character file
const fd = kernel.open('/characters/123', OpenMode.READ_WRITE);
try {
	// Read character data
	const [result, character] = kernel.read(fd);
	if (result === ErrorCode.SUCCESS) {
		// Modify character
		character.properties.level += 1;
		// Write changes back
		kernel.write(fd, character);
	}
} finally {
	// Always close file descriptors
	kernel.close(fd);
}
```

## Project Structure

```
vardon/
├── src/
│   ├── lib/
│   │   ├── domain/          # Core business logic
│   │   │   ├── kernel/      # Unix-like kernel implementation
│   │   │   ├── capabilities/ # System capabilities (devices)
│   │   │   ├── plugins/     # Feature plugins
│   │   │   └── character/   # Character management
│   │   ├── db/             # Database access layer
│   │   └── ui/             # Svelte components
│   └── routes/             # SvelteKit routes
├── data/                   # Game data in YAML format
├── scripts/               # Utility scripts
└── supabase/             # Database migrations
```

## Data Management

### YAML Anchor/Alias System

Vardon uses a sophisticated YAML data management system that preserves complex cross-references across multiple files. Unlike standard YAML processing, this system allows anchors and aliases to work across file boundaries.

**How it works:**

- `data/split/00-anchors.yaml` - Contains ALL anchor definitions (the "symbol table")
- `data/split/*.yaml` - Individual data sections with alias references (`*anchor_name`)
- Split files are intentionally "incomplete" YAML that reference the anchor file
- The system combines files back into valid YAML with all relationships intact

**Important:** The split YAML files will show "anchor not found" errors in linters - this is expected and correct behavior. These files are intermediate artifacts designed to work together, not as standalone YAML.

```bash
# Split main data file into manageable sections
npm run yaml:split

# Edit individual files while preserving relationships
# (Edit data/split/*.yaml files as needed)

# Combine back into single valid YAML
npm run yaml:combine

# Load combined data to database
npm run yaml:load
```

This approach allows you to:

- ✅ Edit large datasets in manageable chunks
- ✅ Preserve complex ID relationships across files
- ✅ Maintain referential integrity
- ✅ Work with files that would be unwieldy as a single document

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm run test            # Run automated tests with Playwright
npm run test:e2e:ui     # Run tests with interactive UI
npm run test:e2e:headed # Run tests in headed browser mode
npm run test:e2e:debug  # Debug tests step by step
npm run test:e2e:report # Show HTML test report
npm run test:e2e:unix   # Run Unix architecture tests only
npm run test:cli        # Run CLI-based tests
npm run test:unit       # Run unit tests

# Manual Testing
npm run test:manual     # Instructions for manual testing
# 1. Start dev server: npm run dev
# 2. Open http://localhost:5173/diagnostics
# 3. Tests run automatically or use console functions

# Code Quality
npm run lint            # Run ESLint
npm run check           # TypeScript type checking
npm run format          # Format with Prettier

# Data Management
npm run yaml:split      # Split game data into multiple files
npm run yaml:combine    # Combine data files
npm run yaml:load       # Load YAML data to database
npm run types:generate  # Generate TypeScript types from DB
```

### Running Tests

The project includes comprehensive test suites:

```bash
# Automated testing with Playwright
npm run test             # Run all tests automatically
npm run test:e2e:ui      # Interactive test UI
npm run test:e2e:debug   # Debug tests step-by-step

# CLI and Unit Testing
npm run test:cli         # Run CLI-based tests
npm run test:unit        # Run unit tests

# Generate new tests
npm run test:codegen     # Record browser actions as tests

# Manual testing in browser
npm run dev              # Start the development server
# Navigate to: http://localhost:5173/diagnostics

# Browser console functions:
runTests()               # Run all available tests
runUnixArchitectureTest() # Test Unix file system
runCharacterTest()       # Test character system
runApiTests()           # Test API layer
```

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to `.env`
3. Run database migrations:
   ```bash
   npx supabase db push
   ```
4. Load initial game data:
   ```bash
   npm run yaml:load
   ```

## Usage

### Creating a Character

```typescript
import { GameKernel } from '$lib/domain/kernel';
import { CharacterAssembler } from '$lib/domain/character';

// Initialize the kernel
const kernel = new GameKernel();

// Create a character using the assembler
const character = await CharacterAssembler.createCharacter(kernel, {
	name: 'Aragorn',
	level: 5,
	className: 'Ranger',
	ancestry: 'Human'
});

// Access character capabilities
const abilities = character.getCapability(AbilityCapability);
const strength = abilities.getAbilityScore(character, 'strength');
```

### Working with Capabilities

```typescript
// Get capability from entity
const combat = entity.getCapability(CombatCapability);

// Calculate armor class
const ac = combat.getArmorClass(entity);

// Get saving throws
const saves = combat.getSavingThrows(entity);
```

### Using the Plugin System

```typescript
// Register a plugin
kernel.pluginManager.register(new SkillFocusPlugin());

// Activate plugin for an entity
kernel.pluginManager.activate('skill-focus', entity.id, {
	skill: 'perception'
});
```

## API Documentation

### Kernel API

The kernel provides Unix-like file operations:

- `open(path, mode)` - Open a file/entity
- `read(fd, buffer)` - Read data from file descriptor
- `write(fd, data)` - Write data to file descriptor
- `close(fd)` - Close file descriptor
- `create(path, data)` - Create new file/entity
- `unlink(path)` - Delete file/entity

### Capability API

Each capability provides domain-specific operations:

- **AbilityCapability** - Manage ability scores and modifiers
- **SkillCapability** - Handle skill ranks and calculations
- **CombatCapability** - Calculate AC, saves, and combat stats
- **BonusCapability** - Manage bonus stacking rules

### GameRulesAPI

Database access layer for game rules:

- `getCompleteCharacterData(id)` - Load full character data
- `getClassData(id)` - Get class information
- `getFeatData(id)` - Get feat details
- `getSpellData(id)` - Get spell information

## Best Practices

### TypeScript Imports

```typescript
// Use type imports for interfaces
import type { Entity, Capability } from './types';

// Regular imports for classes
import { BaseCapability } from './BaseCapability';
```

### Resource Management

```typescript
// Always use try/finally for cleanup
const fd = kernel.open(path, OpenMode.READ);
try {
	const [result, data] = kernel.read(fd);
	// Process data
} finally {
	kernel.close(fd);
}
```

### Error Handling

```typescript
// Use Result type for operations that can fail
function loadCharacter(id: string): Result<Character> {
	try {
		const character = kernel.readFile(`/characters/${id}`);
		return { ok: true, value: character };
	} catch (error) {
		return { ok: false, error };
	}
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:

- All tests pass (`npm run test`)
- Code is linted (`npm run lint`)
- Types are correct (`npm run check`)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Unix design philosophy
- Built for the Pathfinder 1e community
- Special thanks to all contributors

## Support

- 📚 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/JoeLuker/Varden/issues)
- 💬 [Discussions](https://github.com/JoeLuker/Varden/discussions)

---

Made with ❤️ by the Vardon team
