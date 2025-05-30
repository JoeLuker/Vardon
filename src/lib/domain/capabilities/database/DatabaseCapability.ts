/**
 * Database Capability
 * 
 * This module implements a Unix-style capability for database access.
 * It integrates with the kernel and provides a consistent interface
 * for accessing database resources through file-like operations.
 */

import type { Capability, Entity } from '../../kernel/types';
import { ErrorCode, OpenMode } from '../../kernel/types';
import type { CapabilityOptions } from '../BaseCapability';
import type { DatabaseDriver, DatabasePath } from './DatabaseDriver';
import { SupabaseDatabaseDriver } from './SupabaseDatabaseDriver';
import type { SchemaDescriptor } from './SchemaDescriptor';

/**
 * Options for the database capability
 */
export interface DatabaseCapabilityOptions extends CapabilityOptions {
  /** Custom database driver */
  driver?: DatabaseDriver;
}

/**
 * Database capability implementation
 */
export class DatabaseCapability implements Capability {
  /** Capability identifier */
  readonly id: string = 'database';
  
  /** Capability version */
  readonly version: string;
  
  /** Debug mode flag */
  private debug: boolean;
  
  /** Database driver */
  private driver: DatabaseDriver;
  
  /** Map of open file descriptors */
  private openFiles: Map<number, number> = new Map();
  
  /** Reference to the kernel (set when mounted) */
  private kernel: any = null;
  
  /**
   * Create a new database capability
   * @param options Capability options
   */
  constructor(options: DatabaseCapabilityOptions = {}) {
    this.version = options.version || '1.0.0';
    this.debug = options.debug || false;

    if (!options.driver) {
      throw new Error('DatabaseCapability requires a driver. Use kernel.mount("/dev/db", new DatabaseCapability({ driver }))')
    }

    this.driver = options.driver;
    this.log('Database capability initialized');
  }
  
  /**
   * Log a message if debug mode is enabled
   * @param message Message to log
   * @param data Optional data to log
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      if (data !== undefined) {
        console.log(`[${this.id}] ${message}`, data);
      } else {
        console.log(`[${this.id}] ${message}`);
      }
    }
  }
  
  /**
   * Log an error
   * @param message Error message
   * @param error Error object or details
   */
  private error(message: string, error?: any): void {
    if (error !== undefined) {
      console.error(`[${this.id}] ${message}`, error);
    } else {
      console.error(`[${this.id}] ${message}`);
    }
  }
  
  /**
   * Mount the capability to the kernel
   * @param kernel Kernel instance
   */
  onMount(kernel: any): void {
    this.kernel = kernel;
    this.log('Database capability mounted');

    // Initialize directory structure
    this.initializeDirectoryStructure();
  }

  /**
   * Initialize the directory structure for database resources
   * This ensures all required directories exist
   */
  private initializeDirectoryStructure(): void {
    if (!this.kernel) {
      this.error('Kernel not available for directory initialization');
      return;
    }

    // Directory structure follows our file path mapping
    const directories = [
      // Core directories
      '/proc',
      '/entity',
      '/etc',
      '/dev',

      // Proc subdirectories
      '/proc/character',
      '/proc/ability',

      // Entity subdirectories
      '/entity',

      // Schema directories
      '/etc/schema',
      '/etc/schema/ability',
      '/etc/schema/class',
      '/etc/schema/feat',
      '/etc/schema/skill',

      // Device files directory
      '/dev'
    ];

    // Create each directory
    for (const dir of directories) {
      if (!this.kernel.exists(dir)) {
        this.log(`Creating directory: ${dir}`);
        const result = this.kernel.mkdir(dir, true);

        if (!result.success) {
          this.error(`Failed to create directory ${dir}: ${result.errorMessage}`);
        }
      }
    }

    // Do not create the /dev/db device file directly
    // It should be mounted by the application through kernel.mount()
    // This avoids conflict between creating a file and mounting a device at the same path
    this.log('Database capability ready for mounting');

    this.log('Directory structure initialized');
  }
  
  /**
   * Shut down the capability
   */
  async shutdown(): Promise<void> {
    // Close all open files
    for (const [fd, dbFd] of this.openFiles.entries()) {
      await this.driver.close(dbFd);
    }
    
    this.openFiles.clear();
    this.log('Database capability shut down');
  }
  
  /**
   * Handle open operation
   * @param path Path to open
   * @param mode Open mode
   * @param ctx Operation context
   * @returns File descriptor or error code
   */
  async onOpen(path: string, mode: number, ctx: any): Promise<number> {
    try {
      this.log(`Opening ${path} with mode ${mode}`);
      
      // Open the database resource
      const dbFd = await this.driver.open(path, mode);
      
      if (dbFd < 0) {
        this.error(`Failed to open ${path}: ${dbFd}`);
        return dbFd;
      }
      
      // Store mapping from capability FD to database driver FD
      const fd = ctx.allocateFd(path, mode);
      this.openFiles.set(fd, dbFd);
      
      this.log(`Opened ${path} as fd ${fd} (db fd ${dbFd})`);
      return fd;
    } catch (error) {
      this.error(`Error opening ${path}:`, error);
      return ErrorCode.EIO;
    }
  }
  
  /**
   * Handle read operation
   * @param fd File descriptor
   * @param buffer Buffer to read into
   * @param ctx Operation context
   * @returns Error code
   */
  async onRead(fd: number, buffer: any, ctx: any): Promise<number> {
    try {
      this.log(`Reading from fd ${fd}`);

      // Get the database FD
      const dbFd = this.openFiles.get(fd);
      if (dbFd === undefined) {
        this.error(`Invalid file descriptor: ${fd}`);
        return ErrorCode.EBADF;
      }

      // Get file info from context if available
      const fileInfo = ctx.openFiles?.get(fd);
      const path = fileInfo?.path || '';

      // Handle special path patterns
      if (path.startsWith('/proc/character/')) {
        const result = await this.handleCharacterRead(path, buffer, dbFd);
        if (result !== undefined) {
          return result;
        }
      } else if (path.startsWith('/entity/')) {
        const result = await this.handleEntityRead(path, buffer, dbFd);
        if (result !== undefined) {
          return result;
        }
      } else if (path.startsWith('/etc/schema/')) {
        const result = await this.handleSchemaRead(path, buffer, dbFd);
        if (result !== undefined) {
          return result;
        }
      }

      // Default behavior: read from the database
      const result = await this.driver.read(dbFd, buffer);

      if (result !== 0) {
        this.error(`Failed to read from fd ${fd}: ${result}`);
      } else {
        this.log(`Read from fd ${fd} successful`);
      }

      return result;
    } catch (error) {
      this.error(`Error reading from fd ${fd}:`, error);
      return ErrorCode.EIO;
    }
  }

  /**
   * Handle character-specific read operations
   * @param path File path
   * @param buffer Buffer to read into
   * @param dbFd Database file descriptor
   * @returns Error code or undefined if not handled
   */
  private async handleCharacterRead(
    path: string,
    buffer: any,
    dbFd: number
  ): Promise<number | undefined> {
    // Handle character list
    if (path === '/proc/character/list') {
      // Read all characters
      const result = await this.driver.read(dbFd, buffer);
      return result;
    }

    // Handle individual character paths: /proc/character/{id}
    const characterIdMatch = path.match(/\/proc\/character\/(\d+)$/);
    if (characterIdMatch) {
      const characterId = parseInt(characterIdMatch[1], 10);

      // Read character by ID
      const result = await this.driver.read(dbFd, buffer);

      // If successful and no data was read, try to populate from database
      if (result === 0 && Object.keys(buffer).length === 0) {
        this.log(`No data in buffer for character ${characterId}, trying to fetch from database`);

        // Use ioctl to get character data
        const tempBuffer: any = {};
        const ioctlResult = await this.driver.ioctl(dbFd, DatabaseOperation.GET_BY_ID, {
          characterId,
          buffer: tempBuffer
        });

        if (ioctlResult === 0 && tempBuffer.data) {
          // Copy data to the original buffer
          Object.assign(buffer, tempBuffer.data);
          return 0;
        }
      }

      return result;
    }

    return undefined; // Not handled by this method
  }

  /**
   * Handle entity-specific read operations
   * @param path File path
   * @param buffer Buffer to read into
   * @param dbFd Database file descriptor
   * @returns Error code or undefined if not handled
   */
  private async handleEntityRead(
    path: string,
    buffer: any,
    dbFd: number
  ): Promise<number | undefined> {
    // Parse entity path: /entity/{id}/...
    const pathParts = path.split('/').filter(Boolean);

    // Need at least "/entity/{id}"
    if (pathParts.length < 2) {
      return undefined;
    }

    const entityId = pathParts[1];
    const subResource = pathParts.length > 2 ? pathParts[2] : null;
    const subId = pathParts.length > 3 ? pathParts[3] : null;

    // Handle entity read
    if (!subResource) {
      // Read entire entity
      const result = await this.driver.read(dbFd, buffer);
      return result;
    }

    // Handle sub-resource read
    if (subResource) {
      // Read sub-resource
      const tempBuffer: any = {};
      const result = await this.driver.read(dbFd, tempBuffer);

      if (result === 0) {
        // Extract and return only the requested sub-resource
        if (tempBuffer.properties && tempBuffer.properties[subResource]) {
          if (subId && tempBuffer.properties[subResource][subId]) {
            // Return specific sub-resource item
            Object.assign(buffer, tempBuffer.properties[subResource][subId]);
          } else {
            // Return entire sub-resource
            Object.assign(buffer, tempBuffer.properties[subResource]);
          }
        } else if (tempBuffer[subResource]) {
          // Handle the case where sub-resource is at the top level
          if (subId && tempBuffer[subResource][subId]) {
            Object.assign(buffer, tempBuffer[subResource][subId]);
          } else {
            Object.assign(buffer, tempBuffer[subResource]);
          }
        } else {
          // Sub-resource not found
          this.error(`Sub-resource not found: ${subResource}`);
          return ErrorCode.ENOENT;
        }
      }

      return result;
    }

    return undefined; // Not handled by this method
  }

  /**
   * Handle schema-specific read operations
   * @param path File path
   * @param buffer Buffer to read into
   * @param dbFd Database file descriptor
   * @returns Error code or undefined if not handled
   */
  private async handleSchemaRead(
    path: string,
    buffer: any,
    dbFd: number
  ): Promise<number | undefined> {
    // Parse schema path: /etc/schema/{type}/...
    const pathParts = path.split('/').filter(Boolean);

    // Need at least "/etc/schema/{type}"
    if (pathParts.length < 3) {
      return undefined;
    }

    const schemaType = pathParts[2];
    const schemaId = pathParts.length > 3 ? pathParts[3] : null;

    // Handle schema list
    if (schemaId === 'list') {
      // Read all schemas of this type
      const result = await this.driver.ioctl(dbFd, DatabaseOperation.GET_ALL, {
        schemaType,
        buffer
      });
      return result;
    }

    // Handle specific schema by ID
    if (schemaId && schemaId !== 'list') {
      // Read schema by ID
      const result = await this.driver.ioctl(dbFd, DatabaseOperation.GET_BY_ID, {
        schemaType,
        schemaId,
        buffer
      });
      return result;
    }

    return undefined; // Not handled by this method
  }
  
  /**
   * Handle write operation
   * @param fd File descriptor
   * @param buffer Data to write
   * @param ctx Operation context
   * @returns Error code
   */
  async onWrite(fd: number, buffer: any, ctx: any): Promise<number> {
    try {
      this.log(`Writing to fd ${fd}`);

      // Get the database FD
      const dbFd = this.openFiles.get(fd);
      if (dbFd === undefined) {
        this.error(`Invalid file descriptor: ${fd}`);
        return ErrorCode.EBADF;
      }

      // Get file info from context if available
      const fileInfo = ctx.openFiles?.get(fd);
      const path = fileInfo?.path || '';

      // Handle special path patterns
      if (path.startsWith('/proc/character/')) {
        const result = await this.handleCharacterWrite(path, buffer, dbFd);
        if (result !== undefined) {
          return result;
        }
      } else if (path.startsWith('/entity/')) {
        const result = await this.handleEntityWrite(path, buffer, dbFd);
        if (result !== undefined) {
          return result;
        }
      }

      // Default behavior: write to the database
      const result = await this.driver.write(dbFd, buffer);

      if (result !== 0) {
        this.error(`Failed to write to fd ${fd}: ${result}`);
      } else {
        this.log(`Write to fd ${fd} successful`);
      }

      return result;
    } catch (error) {
      this.error(`Error writing to fd ${fd}:`, error);
      return ErrorCode.EIO;
    }
  }

  /**
   * Handle character-specific write operations
   * @param path File path
   * @param buffer Data to write
   * @param dbFd Database file descriptor
   * @returns Error code or undefined if not handled
   */
  private async handleCharacterWrite(
    path: string,
    buffer: any,
    dbFd: number
  ): Promise<number | undefined> {
    // Handle character creation
    if (path === '/proc/character/create') {
      // Create a new character
      const result = await this.driver.ioctl(dbFd, DatabaseOperation.CREATE, {
        data: buffer
      });
      return result;
    }

    // Handle individual character paths: /proc/character/{id}
    const characterIdMatch = path.match(/\/proc\/character\/(\d+)$/);
    if (characterIdMatch) {
      const characterId = parseInt(characterIdMatch[1], 10);

      // Write character data
      const result = await this.driver.ioctl(dbFd, DatabaseOperation.UPDATE, {
        characterId,
        data: buffer
      });
      return result;
    }

    return undefined; // Not handled by this method
  }

  /**
   * Handle entity-specific write operations
   * @param path File path
   * @param buffer Data to write
   * @param dbFd Database file descriptor
   * @returns Error code or undefined if not handled
   */
  private async handleEntityWrite(
    path: string,
    buffer: any,
    dbFd: number
  ): Promise<number | undefined> {
    // Parse entity path: /entity/{id}/...
    const pathParts = path.split('/').filter(Boolean);

    // Need at least "/entity/{id}"
    if (pathParts.length < 2) {
      return undefined;
    }

    const entityId = pathParts[1];
    const subResource = pathParts.length > 2 ? pathParts[2] : null;
    const subId = pathParts.length > 3 ? pathParts[3] : null;

    // Handle entity write (no sub-resource)
    if (!subResource) {
      // Write entire entity
      const result = await this.driver.ioctl(dbFd, DatabaseOperation.UPDATE, {
        entityId,
        data: buffer
      });
      return result;
    }

    // Handle sub-resource write
    if (subResource) {
      // First, read the existing entity data
      const entity: any = {};
      const readResult = await this.driver.read(dbFd, entity);

      if (readResult !== 0) {
        this.error(`Failed to read entity data for sub-resource update: ${readResult}`);
        return readResult;
      }

      // Initialize properties if needed
      if (!entity.properties) {
        entity.properties = {};
      }

      // Initialize the sub-resource if needed
      if (!entity.properties[subResource]) {
        entity.properties[subResource] = {};
      }

      // Update the sub-resource
      if (subId) {
        // Update a specific item within the sub-resource
        entity.properties[subResource][subId] = buffer;
      } else {
        // Update the entire sub-resource
        entity.properties[subResource] = buffer;
      }

      // Update the entity's timestamp
      if (entity.metadata) {
        entity.metadata.updatedAt = Date.now();
      }

      // Write back the updated entity
      const writeResult = await this.driver.ioctl(dbFd, DatabaseOperation.UPDATE, {
        entityId,
        data: entity
      });

      return writeResult;
    }

    return undefined; // Not handled by this method
  }
  
  /**
   * Handle close operation
   * @param fd File descriptor
   * @param ctx Operation context
   * @returns Error code
   */
  async onClose(fd: number, ctx: any): Promise<number> {
    try {
      this.log(`Closing fd ${fd}`);
      
      // Get the database FD
      const dbFd = this.openFiles.get(fd);
      if (dbFd === undefined) {
        this.error(`Invalid file descriptor: ${fd}`);
        return ErrorCode.EBADF;
      }
      
      // Close the database resource
      const result = await this.driver.close(dbFd);
      
      // Remove the FD mapping
      this.openFiles.delete(fd);
      
      if (result !== 0) {
        this.error(`Failed to close fd ${fd}: ${result}`);
      } else {
        this.log(`Closed fd ${fd} successfully`);
      }
      
      return result;
    } catch (error) {
      this.error(`Error closing fd ${fd}:`, error);
      return ErrorCode.EIO;
    }
  }
  
  /**
   * Handle I/O control operation
   * @param fd File descriptor
   * @param request Request code
   * @param arg Operation arguments
   * @param ctx Operation context
   * @returns Error code
   */
  async ioctl(fd: number, request: number, arg: any): Promise<number> {
    try {
      this.log(`IOCTL on fd ${fd}, request ${request}`);

      // IMPORTANT: This is the standard ioctl implementation that needs to be
      // available for device compatibility. The kernel calls this method directly,
      // not onIoctl.

      // Handle common operations
      if (request === 1) { // DatabaseOperation.READ
        // Handle read operation
        this.log(`Database read operation: ${JSON.stringify(arg)}`);

        if (arg.resource === 'character' && arg.id) {
          // Get character by ID
          try {
            const buffer = arg.buffer || {};
            const character = await this.driver.getCharacterById(arg.id, arg.query || '*');

            if (character) {
              buffer.data = character;
              return 0; // Success
            } else {
              return ErrorCode.ENOENT; // Not found
            }
          } catch (error) {
            this.error(`Error fetching character: ${error}`);
            return ErrorCode.EIO;
          }
        }
      } else if (request === 2) { // DatabaseOperation.QUERY
        // Handle query operation
        this.log(`Database query operation: ${JSON.stringify(arg)}`);

        if (arg.resource) {
          try {
            const result = await this.driver.query(arg.resource, arg.filter, arg.query);
            if (arg.buffer) {
              arg.buffer.data = result;
            }
            return 0; // Success
          } catch (error) {
            this.error(`Error executing query: ${error}`);
            return ErrorCode.EIO;
          }
        }
      }

      // If we have a context object with file descriptors, use the previous method
      if (arguments.length > 3 && arguments[3]) {
        return this.onIoctl(fd, request, arg, arguments[3]);
      }

      // For direct device operations
      // First check if we have a driver with ioctl support
      if (this.driver && typeof this.driver.ioctl === 'function') {
        try {
          // Pass through to driver
          return await this.driver.ioctl(fd, request, arg);
        } catch (error) {
          this.error(`Error in driver ioctl: ${error}`);
          return ErrorCode.EIO;
        }
      }

      return 0; // Default success for operations we don't specifically handle
    } catch (error) {
      this.error(`Error in IOCTL on fd ${fd}:`, error);
      return ErrorCode.EIO;
    }
  }

  /**
   * Original onIoctl implementation - called with context from ioctl
   * @param fd File descriptor
   * @param request Request code
   * @param arg Operation arguments
   * @param ctx Operation context
   * @returns Error code
   */
  async onIoctl(fd: number, request: number, arg: any, ctx: any): Promise<number> {
    try {
      this.log(`onIoctl called with fd ${fd}, request ${request}`);

      // Get the database FD
      const dbFd = this.openFiles.get(fd);
      if (dbFd === undefined) {
        this.error(`Invalid file descriptor: ${fd}`);
        return ErrorCode.EBADF;
      }

      // Get file info from context if available
      const fileInfo = ctx.openFiles?.get(fd);
      const path = fileInfo?.path || '';

      // Check if this is a special operation based on path pattern
      if (path.startsWith('/proc/character/')) {
        const result = await this.handleCharacterIoctl(fd, path, request, arg, dbFd);
        if (result !== undefined) {
          return result;
        }
      } else if (path.startsWith('/entity/')) {
        const result = await this.handleEntityIoctl(fd, path, request, arg, dbFd);
        if (result !== undefined) {
          return result;
        }
      } else if (path === '/dev/db') {
        const result = await this.handleDatabaseDeviceIoctl(fd, request, arg, dbFd);
        if (result !== undefined) {
          return result;
        }
      }

      // Forward to the database driver for standard operations
      const result = await this.driver.ioctl(dbFd, request, arg);

      if (result !== 0) {
        this.error(`Failed IOCTL on fd ${fd}: ${result}`);
      } else {
        this.log(`IOCTL on fd ${fd} successful`);
      }

      return result;
    } catch (error) {
      this.error(`Error in onIoctl for fd ${fd}:`, error);
      return ErrorCode.EIO;
    }
  }

  /**
   * Handle IOCTL operations specific to characters
   * @param fd File descriptor
   * @param path File path
   * @param request Request code
   * @param arg Operation arguments
   * @param dbFd Database file descriptor
   * @returns Error code or undefined if not handled
   */
  private async handleCharacterIoctl(
    fd: number,
    path: string,
    request: number,
    arg: any,
    dbFd: number
  ): Promise<number | undefined> {
    // Extract character ID from path: /proc/character/{id}
    const characterIdMatch = path.match(/\/proc\/character\/(\d+)/);
    const characterId = characterIdMatch ? parseInt(characterIdMatch[1], 10) : null;

    if (!characterId) {
      // Special case for the list path
      if (path === '/proc/character/list') {
        if (request === DatabaseOperation.GET_ALL) {
          // Get all characters
          return await this.driver.ioctl(dbFd, request, arg);
        }
      }
      return undefined; // Not handled
    }

    switch (request) {
      case DatabaseOperation.GET_BY_ID:
        // Get character by ID
        arg.characterId = characterId;
        return await this.driver.ioctl(dbFd, request, arg);

      case DatabaseOperation.UPDATE:
        // Update character data
        if (!arg.data) {
          this.error('No data provided for update operation');
          return ErrorCode.EINVAL;
        }
        arg.characterId = characterId;
        return await this.driver.ioctl(dbFd, request, arg);

      case DatabaseOperation.DELETE:
        // Delete character
        arg.characterId = characterId;
        return await this.driver.ioctl(dbFd, request, arg);

      default:
        return undefined; // Not handled by this method
    }
  }

  /**
   * Handle IOCTL operations specific to entities
   * @param fd File descriptor
   * @param path File path
   * @param request Request code
   * @param arg Operation arguments
   * @param dbFd Database file descriptor
   * @returns Error code or undefined if not handled
   */
  private async handleEntityIoctl(
    fd: number,
    path: string,
    request: number,
    arg: any,
    dbFd: number
  ): Promise<number | undefined> {
    // Extract entity ID and sub-resources from path: /entity/{id}/...
    const pathParts = path.split('/').filter(Boolean);

    // Need at least "/entity/{id}"
    if (pathParts.length < 2) {
      return undefined;
    }

    const entityId = pathParts[1];
    const subResource = pathParts.length > 2 ? pathParts[2] : null;
    const subId = pathParts.length > 3 ? pathParts[3] : null;

    // Handle entity operations
    switch (request) {
      case DatabaseOperation.GET_BY_ID:
        // Get entity by ID
        arg.entityId = entityId;
        return await this.driver.ioctl(dbFd, request, arg);

      case DatabaseOperation.UPDATE:
        // Update entity data
        if (!arg.data) {
          this.error('No data provided for update operation');
          return ErrorCode.EINVAL;
        }
        arg.entityId = entityId;
        return await this.driver.ioctl(dbFd, request, arg);

      case DatabaseOperation.DELETE:
        // Delete entity
        arg.entityId = entityId;
        return await this.driver.ioctl(dbFd, request, arg);
    }

    // Handle sub-resource operations
    if (subResource) {
      // Add sub-resource information to the arguments
      arg.entityId = entityId;
      arg.subResource = subResource;

      if (subId) {
        arg.subId = subId;
      }

      return await this.driver.ioctl(dbFd, request, arg);
    }

    return undefined; // Not handled by this method
  }

  /**
   * Handle IOCTL operations specific to the database device
   * @param fd File descriptor
   * @param request Request code
   * @param arg Operation arguments
   * @param dbFd Database file descriptor
   * @returns Error code or undefined if not handled
   */
  private async handleDatabaseDeviceIoctl(
    fd: number,
    request: number,
    arg: any,
    dbFd: number
  ): Promise<number | undefined> {
    // Special DB device operations
    switch (request) {
      case DatabaseOperation.QUERY:
        // Execute custom query
        if (!arg.query) {
          this.error('No query provided for query operation');
          return ErrorCode.EINVAL;
        }
        return await this.driver.ioctl(dbFd, request, arg);

      default:
        return undefined; // Not handled by this method
    }
  }
  
  /**
   * Register a schema with the database driver
   * @param resourceType Resource type name
   * @param schema Schema descriptor
   */
  registerSchema(resourceType: string, schema: SchemaDescriptor): void {
    if (this.driver instanceof SupabaseDatabaseDriver) {
      this.driver.registerSchema(resourceType, schema);
      this.log(`Registered schema for ${resourceType}`);
    } else {
      this.error(`Cannot register schema: driver does not support schema registration`);
    }
  }
  
  /**
   * Load an entity from the database
   * @param entityId Entity ID
   * @returns Entity or null if not found
   */
  async loadEntity(entityId: string): Promise<Entity | null> {
    try {
      this.log(`Loading entity ${entityId}`);
      
      // Check if the entity exists
      const exists = await this.driver.exists(`/db/entity/${entityId}`);
      
      if (!exists) {
        this.log(`Entity ${entityId} not found`);
        return null;
      }
      
      // Open the entity
      const fd = await this.driver.open(`/db/entity/${entityId}`, OpenMode.READ);
      
      if (fd < 0) {
        this.error(`Failed to open entity ${entityId}: ${fd}`);
        return null;
      }
      
      try {
        // Read the entity
        const entity: any = {};
        const result = await this.driver.read(fd, entity);
        
        if (result !== 0) {
          this.error(`Failed to read entity ${entityId}: ${result}`);
          return null;
        }
        
        this.log(`Loaded entity ${entityId} successfully`);
        return entity as Entity;
      } finally {
        // Always close the file descriptor
        await this.driver.close(fd);
      }
    } catch (error) {
      this.error(`Error loading entity ${entityId}:`, error);
      return null;
    }
  }
  
  /**
   * Save an entity to the database
   * @param entity Entity to save
   * @returns True if successful, false otherwise
   */
  async saveEntity(entity: Entity): Promise<boolean> {
    try {
      this.log(`Saving entity ${entity.id}`);
      
      // Check if the entity exists
      const exists = await this.driver.exists(`/db/entity/${entity.id}`);
      
      // Open the entity with the appropriate mode
      const mode = exists ? OpenMode.READ_WRITE : OpenMode.WRITE;
      const fd = await this.driver.open(`/db/entity/${entity.id}`, mode);
      
      if (fd < 0) {
        this.error(`Failed to open entity ${entity.id}: ${fd}`);
        return false;
      }
      
      try {
        // Write the entity
        const result = await this.driver.write(fd, entity);
        
        if (result !== 0) {
          this.error(`Failed to write entity ${entity.id}: ${result}`);
          return false;
        }
        
        this.log(`Saved entity ${entity.id} successfully`);
        return true;
      } finally {
        // Always close the file descriptor
        await this.driver.close(fd);
      }
    } catch (error) {
      this.error(`Error saving entity ${entity.id}:`, error);
      return false;
    }
  }
  
  /**
   * Check if an entity exists in the database
   * @param entityId Entity ID
   * @returns True if entity exists, false otherwise
   */
  async entityExists(entityId: string): Promise<boolean> {
    try {
      const exists = await this.driver.exists(`/db/entity/${entityId}`);
      this.log(`Entity ${entityId} exists: ${exists}`);
      return exists;
    } catch (error) {
      this.error(`Error checking if entity ${entityId} exists:`, error);
      return false;
    }
  }

  /**
   * Direct query method for capabilities who need to bypass the device file system
   * @param resourceType Resource type to query (table name)
   * @param filter Optional filter criteria
   * @param queryStr Optional query string
   * @returns Array of matching resources
   */
  async query(resourceType: string, filter?: any, queryStr: string = '*'): Promise<any[]> {
    try {
      this.log(`Direct query on ${resourceType} with filter:`, filter);

      if (!this.driver || typeof this.driver.query !== 'function') {
        this.error(`Driver does not support direct query`);
        return [];
      }

      const results = await this.driver.query(resourceType, filter, queryStr);
      return results;
    } catch (error) {
      this.error(`Error in direct query:`, error);
      return [];
    }
  }

  /**
   * Get a character by ID using Unix file operations
   * @param characterId Character ID
   * @returns Character data or null if not found
   */
  async getCharacterByUnixFileOperation(characterId: number): Promise<any | null> {
    try {
      if (!this.kernel) {
        this.error('Kernel not available for character retrieval');
        return null;
      }

      const path = `/proc/character/${characterId}`;

      // Check if the file exists
      if (!this.kernel.exists(path)) {
        this.log(`Character file doesn't exist: ${path}`);
        return null;
      }

      // Open the file
      const fd = this.kernel.open(path, OpenMode.READ);
      if (fd < 0) {
        this.error(`Failed to open character file: ${path}`);
        return null;
      }

      try {
        // Read the character data
        const buffer: any = {};
        const [result] = this.kernel.read(fd, buffer);

        if (result !== 0) {
          this.error(`Failed to read character ${characterId}: ${result}`);
          return null;
        }

        return buffer;
      } finally {
        // Always close the file descriptor
        this.kernel.close(fd);
      }
    } catch (error) {
      this.error(`Error retrieving character ${characterId}:`, error);
      return null;
    }
  }

  /**
   * Update a character using Unix file operations
   * @param characterId Character ID
   * @param data Character data to update
   * @returns True if successful, false otherwise
   */
  async updateCharacterByUnixFileOperation(characterId: number, data: any): Promise<boolean> {
    try {
      if (!this.kernel) {
        this.error('Kernel not available for character update');
        return false;
      }

      const path = `/proc/character/${characterId}`;

      // Check if the file exists
      if (!this.kernel.exists(path)) {
        this.error(`Character file doesn't exist: ${path}`);
        return false;
      }

      // Open the file
      const fd = this.kernel.open(path, OpenMode.WRITE);
      if (fd < 0) {
        this.error(`Failed to open character file for writing: ${path}`);
        return false;
      }

      try {
        // Write the character data
        const result = this.kernel.write(fd, data);

        if (result !== 0) {
          this.error(`Failed to write character ${characterId}: ${result}`);
          return false;
        }

        return true;
      } finally {
        // Always close the file descriptor
        this.kernel.close(fd);
      }
    } catch (error) {
      this.error(`Error updating character ${characterId}:`, error);
      return false;
    }
  }
}