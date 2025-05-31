/**
 * TransactionalOperation
 * 
 * A Unix-inspired pattern for transactional operations.
 * In Unix, operations like filesystem operations often use transactional
 * approaches with prepare, commit, and rollback phases.
 */

import { 
  BaseIdempotentOperation, 
  type OperationResult, 
  type OperationOptions 
} from './IdempotentOperation';

/**
 * Transaction operation state
 */
export enum TransactionState {
  /** Not started */
  NONE = 'none',
  
  /** Transaction prepared but not committed */
  PREPARED = 'prepared',
  
  /** Transaction committed */
  COMMITTED = 'committed',
  
  /** Transaction rolled back */
  ROLLED_BACK = 'rolled_back',
  
  /** Transaction failed */
  FAILED = 'failed'
}

/**
 * Transaction logging level
 */
export enum LogLevel {
  /** No logging */
  NONE = 0,
  
  /** Error logging only */
  ERROR = 1,
  
  /** Warning and error logging */
  WARNING = 2,
  
  /** Info, warning, and error logging */
  INFO = 3,
  
  /** Debug, info, warning, and error logging */
  DEBUG = 4
}

/**
 * Transaction options
 */
export interface TransactionOptions extends OperationOptions {
  /** Whether to auto-commit after prepare */
  autoCommit?: boolean;
  
  /** Whether to auto-rollback on error */
  autoRollback?: boolean;
  
  /** Timeout for the entire transaction in milliseconds */
  transactionTimeout?: number;
  
  /** Logging level */
  logLevel?: LogLevel;
}

/**
 * Transaction result
 */
export interface TransactionResult<T> extends OperationResult<T> {
  /** Transaction state */
  state: TransactionState;
  
  /** Preparation time in milliseconds */
  preparationTimeMs?: number;
  
  /** Commit time in milliseconds */
  commitTimeMs?: number;
  
  /** Rollback time in milliseconds */
  rollbackTimeMs?: number;
  
  /** Total transaction time in milliseconds */
  transactionTimeMs: number;
}

/**
 * Transaction context passed to operation phases
 */
export interface TransactionContext {
  /** Transaction ID */
  transactionId: string;
  
  /** Transaction state */
  state: TransactionState;
  
  /** Transaction start time */
  startTime: number;
  
  /** Transaction data shared between phases */
  data: Record<string, any>;
  
  /** Log a message at specified level */
  log(message: string, level?: LogLevel): void;
}

/**
 * Transactional operation interface
 */
export abstract class TransactionalOperation<TInput, TOutput> extends BaseIdempotentOperation<TInput, TOutput> {
  protected readonly defaultOptions: Required<TransactionOptions>;
  
  /**
   * Create a new transactional operation
   * @param id Operation ID
   * @param options Transaction options
   * @param debug Debug logging
   */
  constructor(
    id: string,
    options: Partial<TransactionOptions> = {},
    debug: boolean = false
  ) {
    super(id, debug);
    
    this.defaultOptions = {
      operationId: '',
      checkPriorExecution: true,
      recordExecution: true,
      timeout: 30000,
      debug,
      autoCommit: true,
      autoRollback: true,
      transactionTimeout: 60000,
      logLevel: debug ? LogLevel.DEBUG : LogLevel.ERROR
    };
    
    // Apply user options
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) {
        (this.defaultOptions as any)[key] = value;
      }
    }
  }
  
  /**
   * Create a transaction context
   * @param input Operation input
   * @returns Transaction context
   */
  protected createContext(input: TInput): TransactionContext {
    const transactionId = this.getExecutionId(input);
    const startTime = Date.now();
    
    return {
      transactionId,
      state: TransactionState.NONE,
      startTime,
      data: {},
      log: (message: string, level: LogLevel = LogLevel.INFO) => {
        if (level <= this.defaultOptions.logLevel) {
          const levelStr = LogLevel[level] || 'INFO';
          console.log(`[${this.id}:${levelStr}] ${message}`);
        }
      }
    };
  }
  
  /**
   * Execute the operation with transactional semantics
   * @param input Operation input
   * @returns Operation result
   */
  protected async doExecute(input: TInput): Promise<TransactionResult<TOutput>> {
    // Create transaction context
    const context = this.createContext(input);
    
    let preparationStartTime: number | undefined;
    let preparationEndTime: number | undefined;
    let commitStartTime: number | undefined;
    let commitEndTime: number | undefined;
    let rollbackStartTime: number | undefined;
    let rollbackEndTime: number | undefined;
    
    try {
      // Set timeout for the entire transaction
      const transactionPromise = this.executeTransaction(
        input, 
        context, 
        preparationStartTime, 
        preparationEndTime,
        commitStartTime,
        commitEndTime,
        rollbackStartTime,
        rollbackEndTime
      );
      
      if (this.defaultOptions.transactionTimeout > 0) {
        return await this.withTimeout(
          transactionPromise, 
          this.defaultOptions.transactionTimeout
        );
      } else {
        return await transactionPromise;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      context.log(`Transaction failed: ${errorMessage}`, LogLevel.ERROR);
      
      return {
        success: false,
        error: errorMessage,
        state: TransactionState.FAILED,
        transactionTimeMs: Date.now() - context.startTime,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Execute the transaction
   * @param input Operation input
   * @param context Transaction context
   * @param preparationStartTime Preparation start time reference
   * @param preparationEndTime Preparation end time reference
   * @param commitStartTime Commit start time reference
   * @param commitEndTime Commit end time reference
   * @param rollbackStartTime Rollback start time reference
   * @param rollbackEndTime Rollback end time reference
   * @returns Transaction result
   */
  private async executeTransaction(
    input: TInput,
    context: TransactionContext,
    preparationStartTime: number | undefined,
    preparationEndTime: number | undefined,
    commitStartTime: number | undefined,
    commitEndTime: number | undefined,
    rollbackStartTime: number | undefined,
    rollbackEndTime: number | undefined
  ): Promise<TransactionResult<TOutput>> {
    try {
      // Prepare phase
      context.log(`Starting transaction ${context.transactionId}`, LogLevel.INFO);
      
      preparationStartTime = Date.now();
      const prepared = await this.prepare(input, context);
      preparationEndTime = Date.now();
      
      if (!prepared) {
        context.state = TransactionState.FAILED;
        return {
          success: false,
          error: 'Preparation phase failed',
          state: context.state,
          preparationTimeMs: preparationEndTime - preparationStartTime,
          transactionTimeMs: Date.now() - context.startTime,
          timestamp: Date.now()
        };
      }
      
      context.state = TransactionState.PREPARED;
      context.log('Preparation phase succeeded', LogLevel.INFO);
      
      // Auto-commit if enabled
      if (this.defaultOptions.autoCommit) {
        commitStartTime = Date.now();
        const committed = await this.commit(input, context);
        commitEndTime = Date.now();
        
        if (!committed) {
          context.state = TransactionState.FAILED;
          
          // Auto-rollback if enabled
          if (this.defaultOptions.autoRollback) {
            rollbackStartTime = Date.now();
            await this.rollback(input, context);
            rollbackEndTime = Date.now();
            context.state = TransactionState.ROLLED_BACK;
          }
          
          return {
            success: false,
            error: 'Commit phase failed',
            state: context.state,
            preparationTimeMs: preparationEndTime - preparationStartTime,
            commitTimeMs: commitEndTime - commitStartTime,
            rollbackTimeMs: rollbackEndTime && rollbackStartTime ? 
              rollbackEndTime - rollbackStartTime : undefined,
            transactionTimeMs: Date.now() - context.startTime,
            timestamp: Date.now()
          };
        }
        
        context.state = TransactionState.COMMITTED;
        context.log('Commit phase succeeded', LogLevel.INFO);
      }
      
      // Get the final output from the context
      const output = this.getOutput(context);
      
      return {
        success: true,
        data: output,
        state: context.state,
        preparationTimeMs: preparationEndTime - preparationStartTime,
        commitTimeMs: commitEndTime && commitStartTime ? 
          commitEndTime - commitStartTime : undefined,
        transactionTimeMs: Date.now() - context.startTime,
        timestamp: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      context.log(`Transaction error: ${errorMessage}`, LogLevel.ERROR);
      
      // Auto-rollback if enabled and prepared
      if (
        this.defaultOptions.autoRollback && 
        context.state === TransactionState.PREPARED
      ) {
        try {
          rollbackStartTime = Date.now();
          await this.rollback(input, context);
          rollbackEndTime = Date.now();
          context.state = TransactionState.ROLLED_BACK;
          context.log('Rollback succeeded', LogLevel.INFO);
        } catch (rollbackError) {
          const rollbackErrorMessage = rollbackError instanceof Error ? 
            rollbackError.message : String(rollbackError);
          context.log(`Rollback failed: ${rollbackErrorMessage}`, LogLevel.ERROR);
          context.state = TransactionState.FAILED;
        }
      } else {
        context.state = TransactionState.FAILED;
      }
      
      return {
        success: false,
        error: errorMessage,
        state: context.state,
        preparationTimeMs: preparationEndTime && preparationStartTime ? 
          preparationEndTime - preparationStartTime : undefined,
        commitTimeMs: commitEndTime && commitStartTime ? 
          commitEndTime - commitStartTime : undefined,
        rollbackTimeMs: rollbackEndTime && rollbackStartTime ? 
          rollbackEndTime - rollbackStartTime : undefined,
        transactionTimeMs: Date.now() - context.startTime,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Manually commit a prepared transaction
   * @param input Operation input
   * @param operationId Operation ID
   * @returns Whether the commit was successful
   */
  async commitTransaction(input: TInput, operationId?: string): Promise<boolean> {
    // Get execution ID
    const execId = operationId || this.getExecutionId(input);
    
    // Check if we've prepared this transaction
    const result = this.executionLog.get(execId);
    if (!result || result.state !== TransactionState.PREPARED) {
      if (this.debug) {
        console.error(`[${this.id}] Cannot commit transaction ${execId}: not prepared`);
      }
      return false;
    }
    
    try {
      // Create context from stored transaction
      const context: TransactionContext = {
        transactionId: execId,
        state: TransactionState.PREPARED,
        startTime: result.timestamp,
        data: (result as any).context?.data || {},
        log: (message: string, level: LogLevel = LogLevel.INFO) => {
          if (level <= this.defaultOptions.logLevel) {
            const levelStr = LogLevel[level] || 'INFO';
            console.log(`[${this.id}:${levelStr}] ${message}`);
          }
        }
      };
      
      // Commit the transaction
      const commitStartTime = Date.now();
      const committed = await this.commit(input, context);
      const commitEndTime = Date.now();
      
      if (!committed) {
        context.state = TransactionState.FAILED;
        
        // Update stored result
        this.executionLog.set(execId, {
          ...result,
          state: context.state,
          success: false,
          error: 'Commit phase failed',
          commitTimeMs: commitEndTime - commitStartTime,
          transactionTimeMs: Date.now() - context.startTime
        });
        
        return false;
      }
      
      context.state = TransactionState.COMMITTED;
      
      // Get the final output from the context
      const output = this.getOutput(context);
      
      // Update stored result
      this.executionLog.set(execId, {
        ...result,
        state: context.state,
        success: true,
        data: output,
        commitTimeMs: commitEndTime - commitStartTime,
        transactionTimeMs: Date.now() - context.startTime
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (this.debug) {
        console.error(`[${this.id}] Error committing transaction ${execId}: ${errorMessage}`);
      }
      
      // Update stored result
      this.executionLog.set(execId, {
        ...result,
        state: TransactionState.FAILED,
        success: false,
        error: errorMessage,
        transactionTimeMs: Date.now() - result.timestamp
      });
      
      return false;
    }
  }
  
  /**
   * Manually rollback a prepared transaction
   * @param input Operation input
   * @param operationId Operation ID
   * @returns Whether the rollback was successful
   */
  async rollbackTransaction(input: TInput, operationId?: string): Promise<boolean> {
    // Get execution ID
    const execId = operationId || this.getExecutionId(input);
    
    // Check if we've prepared this transaction
    const result = this.executionLog.get(execId);
    if (!result || result.state !== TransactionState.PREPARED) {
      if (this.debug) {
        console.error(`[${this.id}] Cannot rollback transaction ${execId}: not prepared`);
      }
      return false;
    }
    
    try {
      // Create context from stored transaction
      const context: TransactionContext = {
        transactionId: execId,
        state: TransactionState.PREPARED,
        startTime: result.timestamp,
        data: (result as any).context?.data || {},
        log: (message: string, level: LogLevel = LogLevel.INFO) => {
          if (level <= this.defaultOptions.logLevel) {
            const levelStr = LogLevel[level] || 'INFO';
            console.log(`[${this.id}:${levelStr}] ${message}`);
          }
        }
      };
      
      // Rollback the transaction
      const rollbackStartTime = Date.now();
      await this.rollback(input, context);
      const rollbackEndTime = Date.now();
      
      context.state = TransactionState.ROLLED_BACK;
      
      // Update stored result
      this.executionLog.set(execId, {
        ...result,
        state: context.state,
        success: false,
        error: 'Transaction rolled back',
        rollbackTimeMs: rollbackEndTime - rollbackStartTime,
        transactionTimeMs: Date.now() - context.startTime
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (this.debug) {
        console.error(`[${this.id}] Error rolling back transaction ${execId}: ${errorMessage}`);
      }
      
      // Update stored result
      this.executionLog.set(execId, {
        ...result,
        state: TransactionState.FAILED,
        success: false,
        error: errorMessage,
        transactionTimeMs: Date.now() - result.timestamp
      });
      
      return false;
    }
  }
  
  /**
   * Get the current transaction state
   * @param input Operation input
   * @param operationId Operation ID
   * @returns Transaction state
   */
  getTransactionState(input: TInput, operationId?: string): TransactionState {
    // Get execution ID
    const execId = operationId || this.getExecutionId(input);
    
    // Check if we've stored this transaction
    const result = this.executionLog.get(execId);
    if (!result) {
      return TransactionState.NONE;
    }
    
    return (result as TransactionResult<TOutput>).state || TransactionState.NONE;
  }
  
  /**
   * Prepare phase of the transaction
   * @param input Operation input
   * @param context Transaction context
   * @returns Whether preparation was successful
   */
  protected abstract prepare(input: TInput, context: TransactionContext): Promise<boolean>;
  
  /**
   * Commit phase of the transaction
   * @param input Operation input
   * @param context Transaction context
   * @returns Whether commit was successful
   */
  protected abstract commit(input: TInput, context: TransactionContext): Promise<boolean>;
  
  /**
   * Rollback phase of the transaction
   * @param input Operation input
   * @param context Transaction context
   */
  protected abstract rollback(input: TInput, context: TransactionContext): Promise<void>;
  
  /**
   * Get the output from the transaction context
   * @param context Transaction context
   * @returns Output data
   */
  protected abstract getOutput(context: TransactionContext): TOutput;
}

/**
 * Create a transactional function
 * @param prepareFn Function to prepare the transaction
 * @param commitFn Function to commit the transaction
 * @param rollbackFn Function to rollback the transaction
 * @param options Transaction options
 * @returns Transactional function
 */
export function withTransaction<TInput, TOutput>(
  prepareFn: (input: TInput, context: any) => Promise<boolean>,
  commitFn: (input: TInput, context: any) => Promise<boolean>,
  rollbackFn: (input: TInput, context: any) => Promise<void>,
  getOutputFn: (context: any) => TOutput,
  options: Partial<TransactionOptions> = {}
): (input: TInput) => Promise<TransactionResult<TOutput>> {
  // Default options
  const defaultOptions = {
    autoCommit: true,
    autoRollback: true,
    transactionTimeout: 60000,
    logLevel: LogLevel.ERROR
  };
  
  // Apply user options
  const opts = { ...defaultOptions, ...options };
  
  return async (input: TInput): Promise<TransactionResult<TOutput>> => {
    // Create transaction context
    const context = {
      transactionId: JSON.stringify(input).slice(0, 50), // Simple ID based on input
      state: TransactionState.NONE,
      startTime: Date.now(),
      data: {},
      log: (message: string, level: LogLevel = LogLevel.INFO) => {
        if (level <= opts.logLevel) {
          const levelStr = LogLevel[level] || 'INFO';
          console.log(`[Transaction:${levelStr}] ${message}`);
        }
      }
    };
    
    let preparationStartTime: number | undefined;
    let preparationEndTime: number | undefined;
    let commitStartTime: number | undefined;
    let commitEndTime: number | undefined;
    let rollbackStartTime: number | undefined;
    let rollbackEndTime: number | undefined;
    
    try {
      // Prepare phase
      preparationStartTime = Date.now();
      const prepared = await prepareFn(input, context);
      preparationEndTime = Date.now();
      
      if (!prepared) {
        context.state = TransactionState.FAILED;
        return {
          success: false,
          error: 'Preparation phase failed',
          state: context.state,
          preparationTimeMs: preparationEndTime - preparationStartTime,
          transactionTimeMs: Date.now() - context.startTime,
          timestamp: Date.now()
        };
      }
      
      context.state = TransactionState.PREPARED;
      
      // Auto-commit if enabled
      if (opts.autoCommit) {
        commitStartTime = Date.now();
        const committed = await commitFn(input, context);
        commitEndTime = Date.now();
        
        if (!committed) {
          context.state = TransactionState.FAILED;
          
          // Auto-rollback if enabled
          if (opts.autoRollback) {
            rollbackStartTime = Date.now();
            await rollbackFn(input, context);
            rollbackEndTime = Date.now();
            context.state = TransactionState.ROLLED_BACK;
          }
          
          return {
            success: false,
            error: 'Commit phase failed',
            state: context.state,
            preparationTimeMs: preparationEndTime - preparationStartTime,
            commitTimeMs: commitEndTime - commitStartTime,
            rollbackTimeMs: rollbackEndTime && rollbackStartTime ? 
              rollbackEndTime - rollbackStartTime : undefined,
            transactionTimeMs: Date.now() - context.startTime,
            timestamp: Date.now()
          };
        }
        
        context.state = TransactionState.COMMITTED;
      }
      
      // Get the final output from the context
      const output = getOutputFn(context);
      
      return {
        success: true,
        data: output,
        state: context.state,
        preparationTimeMs: preparationEndTime - preparationStartTime,
        commitTimeMs: commitEndTime && commitStartTime ? 
          commitEndTime - commitStartTime : undefined,
        transactionTimeMs: Date.now() - context.startTime,
        timestamp: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Auto-rollback if enabled and prepared
      if (
        opts.autoRollback && 
        context.state === TransactionState.PREPARED
      ) {
        try {
          rollbackStartTime = Date.now();
          await rollbackFn(input, context);
          rollbackEndTime = Date.now();
          context.state = TransactionState.ROLLED_BACK;
        } catch (rollbackError) {
          context.state = TransactionState.FAILED;
        }
      } else {
        context.state = TransactionState.FAILED;
      }
      
      return {
        success: false,
        error: errorMessage,
        state: context.state,
        preparationTimeMs: preparationEndTime && preparationStartTime ? 
          preparationEndTime - preparationStartTime : undefined,
        commitTimeMs: commitEndTime && commitStartTime ? 
          commitEndTime - commitStartTime : undefined,
        rollbackTimeMs: rollbackEndTime && rollbackStartTime ? 
          rollbackEndTime - rollbackStartTime : undefined,
        transactionTimeMs: Date.now() - context.startTime,
        timestamp: Date.now()
      };
    }
  };
}