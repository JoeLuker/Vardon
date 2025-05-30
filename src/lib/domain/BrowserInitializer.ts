/**
 * BrowserInitializer.ts - Client-Side Initialization for Vardon
 * 
 * This module manages the initialization of the Unix-like virtual filesystem
 * during web page load, with status tracking and error handling.
 */

import { initializeApplication } from './application';
import type { Application } from './application';
import type { BrowserApplication } from './application-browser';
import { WebKernel, BootStatus } from './kernel/WebKernel';

/**
 * Boot status update callback
 */
export type BootStatusCallback = (status: BootStatus, progress: number) => void;

/**
 * Options for initializing the browser filesystem
 */
export interface BrowserInitOptions {
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
  
  /**
   * Whether to auto-start the boot process
   */
  autoStart?: boolean;
  
  /**
   * Callback for boot status updates
   */
  onBootStatusChange?: BootStatusCallback;
  
  /**
   * Display initialization UI
   */
  showUI?: boolean;
  
  /**
   * Timeout in milliseconds for boot process
   */
  bootTimeout?: number;
}

/**
 * Status of the browser initialization
 */
export const enum BrowserInitStatus {
  NOT_STARTED = 'NOT_STARTED',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  FAILED = 'FAILED'
}

// Singleton application instance
let _application: Application | null = null;
let _initStatus: BrowserInitStatus = BrowserInitStatus.NOT_STARTED;
let _initError: Error | null = null;
let _bootStatusListener: BootStatusCallback | null = null;

/**
 * Create a status update UI element
 * @param containerId Element ID to place the status UI in
 * @returns The created status element
 */
function createStatusUI(containerId: string = 'filesystem-status'): HTMLElement {
  // Check if container exists
  let container = document.getElementById(containerId);
  
  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    container.style.color = 'white';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';
    container.style.fontFamily = 'monospace';
    container.style.fontSize = '12px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  // Create status element
  const statusElement = document.createElement('div');
  statusElement.textContent = 'Filesystem: Not initialized';
  
  // Create progress bar
  const progressContainer = document.createElement('div');
  progressContainer.style.width = '100%';
  progressContainer.style.backgroundColor = '#333';
  progressContainer.style.marginTop = '5px';
  progressContainer.style.borderRadius = '3px';
  progressContainer.style.overflow = 'hidden';
  
  const progressBar = document.createElement('div');
  progressBar.style.width = '0%';
  progressBar.style.height = '5px';
  progressBar.style.backgroundColor = '#4CAF50';
  progressBar.style.transition = 'width 0.3s ease';
  
  progressContainer.appendChild(progressBar);
  
  // Add to container
  container.innerHTML = '';
  container.appendChild(statusElement);
  container.appendChild(progressContainer);
  
  return statusElement;
}

/**
 * Update the status UI
 * @param status Boot status
 * @param progress Boot progress (0-100)
 * @param statusElement Status element to update
 */
function updateStatusUI(status: BootStatus, progress: number, statusElement: HTMLElement): void {
  // Update status text
  statusElement.textContent = `Filesystem: ${status} (${Math.round(progress)}%)`;
  
  // Find progress bar and update
  const progressBar = statusElement.parentElement?.querySelector('div > div') as HTMLElement;
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
    
    // Change color based on status
    if (status === BootStatus.FAILED) {
      progressBar.style.backgroundColor = '#F44336'; // Red
    } else if (status === BootStatus.READY) {
      progressBar.style.backgroundColor = '#4CAF50'; // Green
    } else {
      progressBar.style.backgroundColor = '#2196F3'; // Blue
    }
  }
  
  // Hide UI when ready (after a delay)
  if (status === BootStatus.READY) {
    setTimeout(() => {
      const container = statusElement.parentElement;
      if (container) {
        container.style.opacity = '0';
        container.style.transition = 'opacity 1s ease';
        setTimeout(() => {
          if (container.parentElement) {
            container.parentElement.removeChild(container);
          }
        }, 1000);
      }
    }, 2000);
  }
}

// Global initialization flag
const INITIALIZATION_KEY = 'vardon_fs_initializing';

/**
 * Check if another tab/window is initializing the filesystem
 * @returns Whether another context is initializing
 */
function isInitializingInOtherContext(): boolean {
  try {
    const timestamp = localStorage.getItem(INITIALIZATION_KEY);
    if (!timestamp) return false;
    
    // Check if timestamp is recent (within last 10 seconds)
    const initTime = parseInt(timestamp, 10);
    const now = Date.now();
    const isRecent = (now - initTime) < 10000;
    
    // If timestamp is too old, clear it
    if (!isRecent) {
      localStorage.removeItem(INITIALIZATION_KEY);
      return false;
    }
    
    return true;
  } catch (e) {
    // localStorage might be unavailable
    return false;
  }
}

/**
 * Set the initialization flag to prevent duplicate initializations
 */
function setInitializingFlag(): void {
  try {
    localStorage.setItem(INITIALIZATION_KEY, Date.now().toString());
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Clear the initialization flag
 */
function clearInitializingFlag(): void {
  try {
    localStorage.removeItem(INITIALIZATION_KEY);
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Initialize the browser filesystem
 * @param options Initialization options
 * @returns Promise that resolves with the application instance
 */
export async function initializeBrowserFilesystem(options: BrowserInitOptions = {}): Promise<Application> {
  // Don't initialize more than once in this tab
  if (_initStatus !== BrowserInitStatus.NOT_STARTED && _initStatus !== BrowserInitStatus.FAILED) {
    if (_application) {
      console.log('[BrowserInitializer] Already initialized in this tab');
      return _application;
    }
    throw new Error('Filesystem initialization in progress');
  }
  
  // Don't initialize if another tab is already initializing
  if (isInitializingInOtherContext()) {
    console.log('[BrowserInitializer] Another tab/window is initializing, waiting');
    // Wait for initialization to complete
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        // If another tab is no longer initializing
        if (!isInitializingInOtherContext()) {
          clearInterval(checkInterval);
          
          // If we have application, return it
          if (_application) {
            resolve(_application);
          } else {
            // Otherwise try initializing ourselves
            initializeBrowserFilesystem(options).then(resolve).catch(reject);
          }
        }
        
        // If we've waited too long, initialize ourselves
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          clearInitializingFlag(); // Force clear the flag
          initializeBrowserFilesystem(options).then(resolve).catch(reject);
        }
      }, 100);
    });
  }
  
  // Set initializing flag to prevent other tabs from initializing
  setInitializingFlag();
  _initStatus = BrowserInitStatus.INITIALIZING;
  let statusElement: HTMLElement | null = null;
  
  // Create status UI if requested
  if (options.showUI) {
    statusElement = createStatusUI();
  }
  
  try {
    // Initialize application with browser-specific implementation
    const bootCallback: BootStatusCallback = (status, progress) => {
      // Update UI if it exists
      if (statusElement) {
        updateStatusUI(status, progress, statusElement);
      }
      
      // Call user-provided callback
      if (options.onBootStatusChange) {
        options.onBootStatusChange(status, progress);
      }
      
      // Call global listener if set
      if (_bootStatusListener) {
        _bootStatusListener(status, progress);
      }
      
      // Update global init status
      if (status === BootStatus.READY) {
        _initStatus = BrowserInitStatus.READY;
      } else if (status === BootStatus.FAILED) {
        _initStatus = BrowserInitStatus.FAILED;
      }
    };
    
    // Set timeout if requested
    const initPromise = initializeApplication({
      debug: options.debug,
      autoStart: options.autoStart,
      onBootStatusChange: bootCallback
    });
    
    if (options.bootTimeout) {
      // Create a timeout promise
      const timeoutPromise = new Promise<Application>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Filesystem initialization timed out after ${options.bootTimeout}ms`));
        }, options.bootTimeout);
      });
      
      // Race the initialization against the timeout
      _application = await Promise.race([initPromise, timeoutPromise]);
    } else {
      // No timeout, just wait for initialization
      _application = await initPromise;
    }
    
    // If using browser implementation, wait for boot to complete
    if ('waitForBoot' in _application) {
      await (_application as BrowserApplication).waitForBoot();
    }
    
    _initStatus = BrowserInitStatus.READY;
    // Clear initialization flag
    clearInitializingFlag();
    return _application;
  } catch (error) {
    _initStatus = BrowserInitStatus.FAILED;
    _initError = error instanceof Error ? error : new Error(String(error));
    
    // Update UI if it exists
    if (statusElement) {
      updateStatusUI(BootStatus.FAILED, 0, statusElement);
      statusElement.textContent += ` - ${_initError.message}`;
    }
    
    console.error('Filesystem initialization failed:', _initError);
    // Clear initialization flag even on failure
    clearInitializingFlag();
    throw _initError;
  }
}

/**
 * Get the current application instance
 * @returns The current application instance or null if not initialized
 */
export function getApplication(): Application | null {
  return _application;
}

/**
 * Get the current initialization status
 * @returns The current initialization status
 */
export function getInitStatus(): BrowserInitStatus {
  return _initStatus;
}

/**
 * Get the initialization error if any
 * @returns The initialization error or null if none
 */
export function getInitError(): Error | null {
  return _initError;
}

/**
 * Set a global boot status listener
 * This is useful for monitoring boot status from multiple components
 * @param listener Boot status listener
 */
export function setBootStatusListener(listener: BootStatusCallback | null): void {
  _bootStatusListener = listener;
  
  // If application is already initialized and has boot status info,
  // immediately call listener with current status
  if (_application && 'getBootStatus' in _application && 'getBootProgress' in _application) {
    const app = _application as BrowserApplication;
    if (_bootStatusListener) {
      _bootStatusListener(app.getBootStatus(), app.getBootProgress());
    }
  }
}

/**
 * Check if the browser supports the virtual filesystem
 * @returns Whether the browser supports the virtual filesystem
 */
export function isFilesystemSupported(): boolean {
  return WebKernel.isBrowserEnvironment() && WebKernel.isStorageAvailable();
}

/**
 * Automatically initialize the filesystem when the DOM is loaded
 * Call this function to register an auto-initializer
 * @param options Initialization options
 */
export function autoInitialize(options: BrowserInitOptions = {}): void {
  // Check if we're in a browser
  if (!WebKernel.isBrowserEnvironment()) return;
  
  // Check if storage is available
  if (!WebKernel.isStorageAvailable()) {
    console.warn('Browser storage is not available, virtual filesystem cannot be initialized');
    return;
  }
  
  // Function to run when DOM is loaded
  const onDomReady = () => {
    initializeBrowserFilesystem({
      showUI: true,
      autoStart: true,
      bootTimeout: 20000, // 20 seconds
      ...options
    }).catch(error => {
      console.error('Auto-initialization failed:', error);
    });
  };
  
  // Check if DOM is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(onDomReady, 1);
  } else {
    // Register for DOMContentLoaded event
    document.addEventListener('DOMContentLoaded', onDomReady);
  }
}