/**
 * Process ID type
 */
export type ProcId = string & { __brand: 'ProcId' };

/**
 * Plugin descriptor
 */
export interface Plugin {
  id: string;
  name: string;
  description?: string;
  version?: string;
  author?: string;
  
  // Required capabilities
  requiredCapabilities?: string[];
  
  // Plugin initialization
  init?: (kernel: any) => void;
  
  // Plugin execution
  execute?: (args: any[], capabilities: Record<string, any>) => any;
  
  // Plugin cleanup
  cleanup?: () => void;
}

/**
 * Standard Unix-inspired events
 */
export const SIGNALS = {
  SIGINT: 'proc:interrupt',   // Interrupt process
  SIGTERM: 'proc:terminate',  // Terminate process
  SIGHUP: 'proc:hangup',      // Terminal closed
  SIGKILL: 'proc:kill',       // Force kill
  SIGUSR1: 'proc:user1',      // User-defined signal 1
  SIGUSR2: 'proc:user2',      // User-defined signal 2
  SIGCHLD: 'proc:child:exit', // Child process exited
}; 