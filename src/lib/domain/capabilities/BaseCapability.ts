/**
 * Base Capability
 * 
 * This module provides a base class for capability implementations.
 * 
 * In Unix terms, a capability is like a device driver that gets mounted
 * in the /dev directory and provides system functionality through
 * standard file operations (read, write, ioctl).
 */

import type { Capability, Entity, ErrorCode } from '../kernel/types';
 
/**
 * Base capability options
 */
export interface BaseCapabilityOptions {
  /** Whether to enable debug logging */
  debug?: boolean;
  
  /** Version of this capability implementation */
  version?: string;
}

/**
 * Alias for BaseCapabilityOptions for backward compatibility
 */
export type CapabilityOptions = BaseCapabilityOptions;

/**
 * Base implementation for capability device drivers
 */
export abstract class BaseCapability implements Capability {
  /** Unique identifier for this capability */
  public abstract readonly id: string;
  
  /** Semantic version of this capability */
  public readonly version: string = '1.0.0';
  
  /** Whether to enable debug logging */
  protected readonly debug: boolean;
  
  /** Reference to the kernel (set when mounted) */
  protected kernel: any;
  
  /** Device-specific data storage */
  protected readonly storage: Map<string, any> = new Map();
  
  /** Open file descriptors for this device */
  protected readonly openFiles: Map<number, { path: string, buffer: any }> = new Map();
  
  constructor(options: BaseCapabilityOptions = {}) {
    this.debug = options.debug || false;
    this.version = options.version || '1.0.0';
  }
  
  /**
   * Called when the device is mounted
   * Initialization happens here (once, at mount time)
   * 
   * @param kernel Reference to the kernel
   */
  onMount(kernel: any): void {
    this.kernel = kernel;
    this.log('Device mounted');
  }
  
  /**
   * Read from the device (implements read() system call)
   * 
   * @param fd File descriptor
   * @param buffer Buffer to read into
   * @returns 0 on success, error code on failure
   */
  read(fd: number, buffer: any): number {
    this.log(`Read from fd ${fd}`);
    return ErrorCode.EINVAL; // Subclasses should override
  }
  
  /**
   * Write to the device (implements write() system call)
   * 
   * @param fd File descriptor
   * @param buffer Data to write
   * @returns 0 on success, error code on failure
   */
  write(fd: number, buffer: any): number {
    this.log(`Write to fd ${fd}`);
    return ErrorCode.EINVAL; // Subclasses should override
  }
  
  /**
   * Device control (implements ioctl() system call)
   * 
   * @param fd File descriptor
   * @param request Control code
   * @param arg Control argument
   * @returns 0 on success, error code on failure
   */
  ioctl(fd: number, request: number, arg: any): number {
    this.log(`IOCTL on fd ${fd}, request ${request}`);
    return ErrorCode.EINVAL; // Subclasses should override
  }
  
  /**
   * Clean up resources when device is unmounted
   */
  async shutdown(): Promise<void> {
    this.log('Device unmounted');
    this.storage.clear();
    this.openFiles.clear();
  }
  
  /**
   * Log a debug message
   * @param message Message to log
   * @param data Optional data to log
   */
  protected log(message: string, data?: any): void {
    if (this.debug) {
      if (data !== undefined) {
        console.log(`[${this.id}] ${message}`, data);
      } else {
        console.log(`[${this.id}] ${message}`);
      }
    }
  }
  
  /**
   * Log an error message
   * @param message Error message
   * @param error Optional error object
   */
  protected error(message: string, error?: any): void {
    if (error !== undefined) {
      console.error(`[${this.id}] ${message}`, error);
    } else {
      console.error(`[${this.id}] ${message}`);
    }
  }
}