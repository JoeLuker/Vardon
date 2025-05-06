# Vardon Engine Documentation

This file serves as an index to the documentation for the Vardon Character Engine.

## Core Documentation

1. **[UNIX Architecture](./UNIX_ARCHITECTURE_COMPLETE.md)** - Complete documentation of the Unix-based architecture implementation
2. **[Philosophy](./PHILOSOPHY.md)** - Core philosophy and principles of the Vardon engine
3. **[MVP Requirements](./MVP_REQUIREMENTS.md)** - Core feature requirements for the Minimum Viable Product
4. **[Naming Conventions](./NAMING.md)** - Naming conventions and Unix concept mapping
5. **[Database Integration](./DATABASE_INTEGRATION.md)** - How database integration works in the Unix architecture

## Architecture Overview

The Vardon Character Engine is built on Unix architecture principles, with a focus on:

- **Small, composable components** that do one thing well
- **Everything is a file** file-system approach to resource management
- **Composition over inheritance** with factory functions returning composed objects
- **Explicit dependency injection** through function parameters
- **Proper resource management** with open/read/write/close patterns

## Key Components

1. **GameKernel** - Core Unix-like filesystem implementation
2. **Capabilities** - Small, focused components providing specific functionality (mounted as devices)
3. **Plugins** - Features composed from capabilities (like processes in Unix)
4. **Entities** - Game objects stored as files in the filesystem

## Development Guidelines

When working on the Vardon engine:

1. **Follow Unix Philosophy**: Write small, focused functions that do one thing well
2. **Use Composition**: Prefer composition over inheritance
3. **Manage Resources**: Always close file descriptors with try/finally blocks
4. **Be Explicit**: Make dependencies explicit through function parameters
5. **Use Standard Interfaces**: Implement read/write/ioctl interfaces for components
6. **Follow Error Patterns**: Use Unix-style error codes for error handling