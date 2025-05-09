/**
 * Supabase Database Driver Implementation
 *
 * This module implements the DatabaseDriver interface for Supabase.
 * Following Unix principles, this driver abstracts the details of the Supabase client
 * and provides a consistent file-like interface for database operations.
 *
 * UPDATED: No longer directly imports supabaseClient - must be provided from the kernel
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DatabaseDriver, DatabasePath } from './DatabaseDriver';
import { DatabaseErrorCode, DatabaseOperation } from './DatabaseDriver';
import { prepareForDatabase, normalizeFromDatabase } from './SchemaDescriptor';
import type { SchemaDescriptor } from './SchemaDescriptor';
import { getSchemaRegistry } from './SchemaRegistry';
import { OpenMode } from '../../kernel/types';
import type { GameKernel } from '../../kernel/GameKernel';

/**
 * File descriptor information for an open database resource
 */
interface FileDescriptorInfo {
  /** Unique file descriptor number */
  fd: number;
  
  /** Path that was opened */
  path: string;
  
  /** Parsed database path */
  dbPath: DatabasePath;
  
  /** Open mode */
  mode: number;
  
  /** Schema for the resource */
  schema: SchemaDescriptor;
  
  /** Cached data (if any) */
  data?: any;
}

/**
 * Supabase implementation of the DatabaseDriver
 */
export class SupabaseDatabaseDriver implements DatabaseDriver {
  /** Supabase client instance */
  private client: SupabaseClient;

  /** Kernel instance for Unix file operations */
  private kernel: GameKernel | null;

  /** Map of file descriptors to resource info */
  private openFiles: Map<number, FileDescriptorInfo> = new Map();

  /** Current file descriptor counter */
  private nextFd: number = 3; // Start at 3 (0, 1, 2 are reserved in Unix)

  /** Schema registry by resource type */
  private schemaRegistry: Map<string, SchemaDescriptor> = new Map();

  /** Debug mode flag */
  private debug: boolean;
  
  /**
   * Create a new Supabase database driver
   * @param client Supabase client instance (REQUIRED - no longer has a default)
   * @param kernel GameKernel instance (optional, for filesystem operations)
   * @param debug Whether to enable debug logging
   */
  constructor(client: SupabaseClient, kernel?: GameKernel, debug: boolean = false) {
    if (!client) {
      throw new Error('SupabaseDatabaseDriver requires a Supabase client. Use kernel.mount("/dev/db", new SupabaseDatabaseDriver(client))');
    }

    this.client = client;
    this.kernel = kernel || null;
    this.debug = debug;

    // Use the centralized Schema Registry
    const schemaRegistry = getSchemaRegistry(debug);

    // Copy schemas from the registry
    for (const schemaType of schemaRegistry.getSchemaTypes()) {
      const schema = schemaRegistry.getSchema(schemaType);
      if (schema) {
        this.registerSchema(schemaType, schema);
      }
    }

    if (this.debug) {
      console.log('[SupabaseDatabaseDriver] Initialized with schemas:',
        Array.from(this.schemaRegistry.keys()));
      if (this.kernel) {
        console.log('[SupabaseDatabaseDriver] Using kernel for Unix file operations');
      } else {
        console.log('[SupabaseDatabaseDriver] No kernel provided, falling back to direct Supabase access');
      }
    }
  }
  
  /**
   * Register a schema for a resource type
   * @param resourceType Resource type name
   * @param schema Schema descriptor
   */
  registerSchema(resourceType: string, schema: SchemaDescriptor): void {
    this.schemaRegistry.set(resourceType, schema);
  }
  
  /**
   * Get the schema for a resource type
   * @param resourceType Resource type name
   * @returns Schema descriptor or undefined if not found
   */
  getSchema(resourceType: string): SchemaDescriptor | undefined {
    return this.schemaRegistry.get(resourceType);
  }
  
  /**
   * Parse a database path into components
   * @param path Path string (e.g., "/db/character/1/ability/strength" or "/proc/character/1")
   * @returns Parsed DatabasePath
   */
  parsePath(path: string): DatabasePath {
    let resourceOffset = 0;
    let resource = '';
    let parts: string[];
    
    // Handle path formats
    if (path.startsWith('/db/')) {
      // Standard database path
      parts = path.substring(4).split('/');
      resourceOffset = 0;
    } else if (path.startsWith('/proc/character/')) {
      // Character in proc directory - the canonical format
      parts = path.substring(16).split('/');
      resource = 'character';
      resourceOffset = 1;
    } else {
      throw new Error(`Invalid database path: ${path}. Must start with /db/ or /proc/character/`);
    }
    
    // For custom paths with resourceOffset, we only need the ID
    if (resourceOffset === 1 && parts.length < 1) {
      throw new Error(`Invalid database path: ${path}. Must have at least an ID`);
    } else if (resourceOffset === 0 && parts.length < 2) {
      throw new Error(`Invalid database path: ${path}. Must have at least a resource type and ID`);
    }
    
    const dbPath: DatabasePath = {
      resource: resourceOffset === 0 ? parts[0] : resource,
      id: resourceOffset === 0 ? parts[1] : parts[0]
    };
    
    // If there are more components, they represent sub-resource type and ID
    // Adjust indices based on resource offset
    const subResourceIndex = resourceOffset === 0 ? 2 : 1;
    const subIdIndex = resourceOffset === 0 ? 3 : 2;
    
    if (parts.length >= subResourceIndex + 2) {
      dbPath.subResource = parts[subResourceIndex];
      dbPath.subId = parts[subIdIndex];
    }
    
    return dbPath;
  }
  
  /**
   * Open a database resource and get a file descriptor
   * @param path Resource path
   * @param mode Open mode (read, write, etc.)
   * @returns File descriptor (non-negative) or error code (negative)
   */
  async open(path: string, mode: number): Promise<number> {
    try {
      // Parse the path
      const dbPath = this.parsePath(path);
      
      // Determine the schema to use
      let schema: SchemaDescriptor | undefined;
      
      if (dbPath.subResource) {
        // For sub-resources, we need a composite schema identifier
        schema = this.getSchema(`${dbPath.resource}_${dbPath.subResource}`);
        
        // If not found, try the sub-resource directly
        if (!schema) {
          schema = this.getSchema(dbPath.subResource);
        }
      } else {
        // For main resources, use the resource directly
        schema = this.getSchema(dbPath.resource);
      }
      
      if (!schema) {
        if (this.debug) {
          console.error(`[SupabaseDatabaseDriver] No schema found for ${path}`);
        }
        return DatabaseErrorCode.INVALID_OPERATION;
      }
      
      // Create a file descriptor
      const fd = this.nextFd++;
      
      // Store file descriptor info
      this.openFiles.set(fd, {
        fd,
        path,
        dbPath,
        mode,
        schema
      });
      
      if (this.debug) {
        console.log(`[SupabaseDatabaseDriver] Opened ${path} as fd ${fd}`);
      }
      
      return fd;
    } catch (error) {
      console.error(`[SupabaseDatabaseDriver] Error opening ${path}:`, error);
      return DatabaseErrorCode.DB_ERROR;
    }
  }
  
  /**
   * Read data from an opened database resource
   * @param fd File descriptor from open()
   * @param buffer Buffer to write data into (passed by reference)
   * @returns Error code (0 for success)
   */
  async read<T>(fd: number, buffer: T): Promise<number> {
    try {
      // Get file descriptor info
      const fileInfo = this.openFiles.get(fd);
      if (!fileInfo) {
        return DatabaseErrorCode.INVALID_OPERATION;
      }
      
      // Check if read is allowed
      if (!(fileInfo.mode & OpenMode.READ)) {
        return DatabaseErrorCode.PERMISSION_DENIED;
      }
      
      // Get the data
      let data;
      
      if (fileInfo.data) {
        // If data is cached, use it
        data = fileInfo.data;
      } else {
        // Otherwise, fetch from database
        data = await this.fetchData(fileInfo);
        
        // If in read-write mode, cache the data
        if (fileInfo.mode & OpenMode.WRITE) {
          fileInfo.data = data;
        }
      }
      
      if (!data) {
        return DatabaseErrorCode.NOT_FOUND;
      }
      
      // Copy data to buffer
      if (buffer && typeof buffer === 'object') {
        Object.assign(buffer, data);
      }
      
      return DatabaseErrorCode.SUCCESS;
    } catch (error) {
      console.error(`[SupabaseDatabaseDriver] Error reading fd ${fd}:`, error);
      return DatabaseErrorCode.DB_ERROR;
    }
  }
  
  /**
   * Write data to an opened database resource
   * @param fd File descriptor from open()
   * @param buffer Data to write
   * @returns Error code (0 for success)
   */
  async write<T>(fd: number, buffer: T): Promise<number> {
    try {
      // Get file descriptor info
      const fileInfo = this.openFiles.get(fd);
      if (!fileInfo) {
        return DatabaseErrorCode.INVALID_OPERATION;
      }
      
      // Check if write is allowed
      if (!(fileInfo.mode & OpenMode.WRITE)) {
        return DatabaseErrorCode.PERMISSION_DENIED;
      }
      
      // Prepare data for database
      const dbData = prepareForDatabase(fileInfo.schema, buffer);
      
      // If we already have data, this is an update
      if (fileInfo.data) {
        // Update in database
        const result = await this.updateData(fileInfo, dbData);
        if (result !== DatabaseErrorCode.SUCCESS) {
          return result;
        }
        
        // Update cached data
        fileInfo.data = {
          ...fileInfo.data,
          ...buffer
        };
      } else {
        // Otherwise, it's an insert
        const result = await this.insertData(fileInfo, dbData);
        if (result !== DatabaseErrorCode.SUCCESS) {
          return result;
        }
        
        // Cache the inserted data
        fileInfo.data = buffer;
      }
      
      return DatabaseErrorCode.SUCCESS;
    } catch (error) {
      console.error(`[SupabaseDatabaseDriver] Error writing fd ${fd}:`, error);
      return DatabaseErrorCode.DB_ERROR;
    }
  }
  
  /**
   * Close an opened database resource
   * @param fd File descriptor from open()
   * @returns Error code (0 for success)
   */
  async close(fd: number): Promise<number> {
    try {
      // Remove file descriptor info
      const fileInfo = this.openFiles.get(fd);
      if (!fileInfo) {
        return DatabaseErrorCode.INVALID_OPERATION;
      }
      
      this.openFiles.delete(fd);
      
      if (this.debug) {
        console.log(`[SupabaseDatabaseDriver] Closed fd ${fd} (${fileInfo.path})`);
      }
      
      return DatabaseErrorCode.SUCCESS;
    } catch (error) {
      console.error(`[SupabaseDatabaseDriver] Error closing fd ${fd}:`, error);
      return DatabaseErrorCode.DB_ERROR;
    }
  }
  
  /**
   * Perform a control operation on a database resource
   * @param fd File descriptor
   * @param request Request code
   * @param arg Arguments for the control operation
   * @returns Error code (0 for success)
   */
  async ioctl(fd: number, request: number, arg: any): Promise<number> {
    try {
      // Get file descriptor info
      const fileInfo = this.openFiles.get(fd);
      if (!fileInfo) {
        return DatabaseErrorCode.INVALID_OPERATION;
      }
      
      // Handle different operations
      switch (request) {
        case DatabaseOperation.QUERY:
          // Run a custom query
          if (!arg.query) {
            return DatabaseErrorCode.INVALID_OPERATION;
          }
          
          // Store the result in the file info
          const queryResult = await this.client
            .from(fileInfo.schema.tableName)
            .select(arg.query);
            
          if (queryResult.error) {
            console.error(`[SupabaseDatabaseDriver] Query error:`, queryResult.error);
            return DatabaseErrorCode.DB_ERROR;
          }
          
          fileInfo.data = normalizeFromDatabase(fileInfo.schema, queryResult.data);
          return DatabaseErrorCode.SUCCESS;
          
        default:
          return DatabaseErrorCode.INVALID_OPERATION;
      }
    } catch (error) {
      console.error(`[SupabaseDatabaseDriver] Error in ioctl fd ${fd}:`, error);
      return DatabaseErrorCode.DB_ERROR;
    }
  }
  
  /**
   * Check if a database resource exists using Unix file operations
   * @param path Resource path
   * @returns True if resource exists, false otherwise
   */
  async exists(path: string): Promise<boolean> {
    try {
      // If we have a kernel, use direct filesystem check
      if (this.kernel) {
        // Convert the database path to a Unix file path
        let unixPath: string;

        // Parse the path first to get its components
        try {
          const dbPath = this.parsePath(path);

          if (dbPath.subResource) {
            unixPath = `/proc/${dbPath.resource}/${dbPath.id}/${dbPath.subResource}`;
            if (dbPath.subId) {
              unixPath += `/${dbPath.subId}`;
            }
          } else {
            unixPath = `/proc/${dbPath.resource}/${dbPath.id}`;
          }

          // Use kernel.exists to check if the path exists
          return this.kernel.exists(unixPath);
        } catch (error) {
          // If parsing fails, try the direct path
          return this.kernel.exists(path);
        }
      }

      // Fallback to using Supabase client directly if no kernel is available
      const dbPath = this.parsePath(path);

      // Get the schema
      let schema: SchemaDescriptor | undefined;

      if (dbPath.subResource) {
        schema = this.getSchema(`${dbPath.resource}_${dbPath.subResource}`) ||
                this.getSchema(dbPath.subResource);
      } else {
        schema = this.getSchema(dbPath.resource);
      }

      if (!schema) {
        return false;
      }

      // Check if the resource exists
      const queryResult = await this.client
        .from(schema.tableName)
        .select(schema.primaryKey)
        .eq(schema.primaryKey, dbPath.id)
        .maybeSingle();

      return !!queryResult.data;
    } catch (error) {
      console.error(`[SupabaseDatabaseDriver] Error checking existence of ${path}:`, error);
      return false;
    }
  }
  
  /**
   * Fetch data from the database using Unix file operations
   * @param fileInfo File descriptor info
   * @returns Fetched data or null if not found
   */
  private async fetchData(fileInfo: FileDescriptorInfo): Promise<any> {
    const { dbPath, schema } = fileInfo;

    try {
      // Construct a Unix-style file path for this request
      let unixPath: string;

      if (dbPath.subResource && dbPath.resource !== 'db') {
        // This is a sub-resource (e.g. /proc/character/1/ability/2)
        unixPath = `/proc/${dbPath.resource}/${dbPath.id}/${dbPath.subResource}`;
        if (dbPath.subId) {
          unixPath += `/${dbPath.subId}`;
        } else {
          unixPath += '/list'; // List all sub-resources if no specific ID
        }
      } else {
        // This is a main resource (e.g. /proc/character/1)
        unixPath = `/proc/${dbPath.resource}/${dbPath.id}`;
      }

      // Use the kernel to open the file path
      const fd = await this._openKernelFile(unixPath, OpenMode.READ);
      if (fd < 0) {
        console.error(`[SupabaseDatabaseDriver] Failed to open ${unixPath}`);
        return null;
      }

      try {
        // Read the data
        const buffer: any = {};
        const result = await this._readKernelFile(fd, buffer);

        if (result !== 0) {
          console.error(`[SupabaseDatabaseDriver] Failed to read ${unixPath}: ${result}`);
          return null;
        }

        // For collection endpoints, normalize each item
        if (unixPath.endsWith('/list')) {
          // The data is in a property named after the sub-resource (e.g. buffer.abilities)
          const collectionKey = dbPath.subResource + 's'; // Simple pluralization
          const items = buffer[collectionKey] || [];

          // Normalize each item
          return items.map((item: any) => normalizeFromDatabase(schema, item));
        }

        // For single item endpoints, normalize it directly
        return normalizeFromDatabase(schema, buffer);
      } finally {
        // Always close the file descriptor
        await this._closeKernelFile(fd);
      }
    } catch (error) {
      console.error(`[SupabaseDatabaseDriver] Error fetching data:`, error);
      return null;
    }
  }

  /**
   * Helper method to open a file using the kernel
   * @param path File path
   * @param mode Open mode
   * @returns File descriptor or error code
   */
  private async _openKernelFile(path: string, mode: number): Promise<number> {
    if (!this.kernel) {
      // Fallback to using the Supabase client directly if no kernel is available
      // This keeps backward compatibility
      return -1;
    }

    return this.kernel.open(path, mode);
  }

  /**
   * Helper method to read from a file using the kernel
   * @param fd File descriptor
   * @param buffer Buffer to read into
   * @returns Error code
   */
  private async _readKernelFile(fd: number, buffer: any): Promise<number> {
    if (!this.kernel) {
      return -1;
    }

    const [result] = this.kernel.read(fd, buffer);
    return result;
  }

  /**
   * Helper method to close a file using the kernel
   * @param fd File descriptor
   * @returns Error code
   */
  private async _closeKernelFile(fd: number): Promise<number> {
    if (!this.kernel) {
      return -1;
    }

    return this.kernel.close(fd);
  }
  
  /**
   * Insert data into the database using Unix file operations
   * @param fileInfo File descriptor info
   * @param data Data to insert
   * @returns Error code
   */
  private async insertData(fileInfo: FileDescriptorInfo, data: any): Promise<number> {
    const { dbPath, schema } = fileInfo;

    try {
      // Construct a Unix-style file path for creating a new resource
      let createPath: string;

      if (dbPath.subResource && dbPath.resource !== 'db') {
        // This is a sub-resource (e.g. /proc/character/1/ability/create)
        createPath = `/proc/${dbPath.resource}/${dbPath.id}/${dbPath.subResource}/create`;
      } else {
        // This is a main resource (e.g. /proc/character/create)
        createPath = `/proc/${dbPath.resource}/create`;
      }

      // Use the kernel to open the creation path
      const fd = await this._openKernelFile(createPath, OpenMode.WRITE);
      if (fd < 0) {
        console.error(`[SupabaseDatabaseDriver] Failed to open creation path: ${createPath}`);
        return DatabaseErrorCode.DB_ERROR;
      }

      try {
        // Write the data
        const result = await this._writeKernelFile(fd, data);

        if (result !== 0) {
          console.error(`[SupabaseDatabaseDriver] Failed to write to ${createPath}: ${result}`);
          return DatabaseErrorCode.DB_ERROR;
        }

        return DatabaseErrorCode.SUCCESS;
      } finally {
        // Always close the file descriptor
        await this._closeKernelFile(fd);
      }
    } catch (error) {
      console.error(`[SupabaseDatabaseDriver] Error inserting data:`, error);
      return DatabaseErrorCode.DB_ERROR;
    }
  }

  /**
   * Update data in the database using Unix file operations
   * @param fileInfo File descriptor info
   * @param data Data to update
   * @returns Error code
   */
  private async updateData(fileInfo: FileDescriptorInfo, data: any): Promise<number> {
    const { dbPath, schema } = fileInfo;

    try {
      // Construct a Unix-style file path for updating a resource
      let updatePath: string;

      if (dbPath.subResource && dbPath.resource !== 'db') {
        // This is a sub-resource (e.g. /proc/character/1/ability/2)
        updatePath = `/proc/${dbPath.resource}/${dbPath.id}/${dbPath.subResource}/${dbPath.subId}`;
      } else {
        // This is a main resource (e.g. /proc/character/1)
        updatePath = `/proc/${dbPath.resource}/${dbPath.id}`;
      }

      // Use the kernel to open the update path
      const fd = await this._openKernelFile(updatePath, OpenMode.WRITE);
      if (fd < 0) {
        console.error(`[SupabaseDatabaseDriver] Failed to open update path: ${updatePath}`);
        return DatabaseErrorCode.DB_ERROR;
      }

      try {
        // Write the updated data
        const result = await this._writeKernelFile(fd, data);

        if (result !== 0) {
          console.error(`[SupabaseDatabaseDriver] Failed to write to ${updatePath}: ${result}`);
          return DatabaseErrorCode.DB_ERROR;
        }

        return DatabaseErrorCode.SUCCESS;
      } finally {
        // Always close the file descriptor
        await this._closeKernelFile(fd);
      }
    } catch (error) {
      console.error(`[SupabaseDatabaseDriver] Error updating data:`, error);
      return DatabaseErrorCode.DB_ERROR;
    }
  }

  /**
   * Helper method to write to a file using the kernel
   * @param fd File descriptor
   * @param data Data to write
   * @returns Error code
   */
  private async _writeKernelFile(fd: number, data: any): Promise<number> {
    if (!this.kernel) {
      return -1;
    }

    const result = this.kernel.write(fd, data);

    // If the kernel.write method returns a Promise, await it
    if (result instanceof Promise) {
      return await result;
    }

    return result;
  }
}