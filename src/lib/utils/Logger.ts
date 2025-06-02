/**
 * Structured logging system for diagnosing character loading and system issues
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
	FATAL = 4
}

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	component: string;
	operation: string;
	message: string;
	data?: any;
	error?: string;
	context?: Record<string, any>;
}

export class Logger {
	private static instance: Logger;
	private logs: LogEntry[] = [];
	private logLevel: LogLevel = LogLevel.DEBUG;
	private maxLogs: number = 1000;

	private constructor() {}

	static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}

	setLevel(level: LogLevel): void {
		this.logLevel = level;
	}

	setMaxLogs(max: number): void {
		this.maxLogs = max;
	}

	private log(level: LogLevel, component: string, operation: string, message: string, data?: any, error?: Error): void {
		if (level < this.logLevel) return;

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			component,
			operation,
			message,
			data: data ? (typeof data === 'object' ? JSON.stringify(data, null, 2) : data) : undefined,
			error: error?.message,
			context: error ? {
				stack: error.stack,
				name: error.name
			} : undefined
		};

		this.logs.push(entry);

		// Keep only the most recent logs
		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(-this.maxLogs);
		}

		// Also log to console for immediate visibility
		const levelStr = LogLevel[level];
		const prefix = `[${entry.timestamp}] [${levelStr}] [${component}:${operation}]`;
		
		switch (level) {
			case LogLevel.DEBUG:
				console.debug(prefix, message, data || '');
				break;
			case LogLevel.INFO:
				console.info(prefix, message, data || '');
				break;
			case LogLevel.WARN:
				console.warn(prefix, message, data || '');
				break;
			case LogLevel.ERROR:
			case LogLevel.FATAL:
				console.error(prefix, message, data || '', error || '');
				break;
		}
	}

	debug(component: string, operation: string, message: string, data?: any): void {
		this.log(LogLevel.DEBUG, component, operation, message, data);
	}

	info(component: string, operation: string, message: string, data?: any): void {
		this.log(LogLevel.INFO, component, operation, message, data);
	}

	warn(component: string, operation: string, message: string, data?: any): void {
		this.log(LogLevel.WARN, component, operation, message, data);
	}

	error(component: string, operation: string, message: string, data?: any, error?: Error): void {
		this.log(LogLevel.ERROR, component, operation, message, data, error);
	}

	fatal(component: string, operation: string, message: string, data?: any, error?: Error): void {
		this.log(LogLevel.FATAL, component, operation, message, data, error);
	}

	// Get logs filtered by component or operation
	getLogs(filter?: {
		component?: string;
		operation?: string;
		level?: LogLevel;
		since?: Date;
	}): LogEntry[] {
		let filtered = this.logs;

		if (filter) {
			filtered = filtered.filter(log => {
				if (filter.component && log.component !== filter.component) return false;
				if (filter.operation && log.operation !== filter.operation) return false;
				if (filter.level !== undefined && log.level < filter.level) return false;
				if (filter.since && new Date(log.timestamp) < filter.since) return false;
				return true;
			});
		}

		return filtered;
	}

	// Get recent character loading issues
	getCharacterLoadingIssues(): LogEntry[] {
		return this.getLogs({
			component: 'CharacterLoader',
			level: LogLevel.WARN
		}).concat(this.getLogs({
			component: 'GameRulesAPI',
			level: LogLevel.WARN
		})).concat(this.getLogs({
			component: 'CharacterCapability',
			level: LogLevel.WARN
		})).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
	}

	// Get database-related issues
	getDatabaseIssues(): LogEntry[] {
		return this.getLogs({
			component: 'SupabaseDatabaseDriver',
			level: LogLevel.WARN
		}).concat(this.getLogs({
			component: 'DatabaseCapability',
			level: LogLevel.WARN
		})).concat(this.getLogs({
			operation: 'schema',
			level: LogLevel.WARN
		})).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
	}

	// Get file system operation issues
	getFileSystemIssues(): LogEntry[] {
		return this.getLogs({
			component: 'GameKernel',
			level: LogLevel.WARN
		}).concat(this.getLogs({
			component: 'FileSystem',
			level: LogLevel.WARN
		})).concat(this.getLogs({
			operation: 'create',
			level: LogLevel.WARN
		})).concat(this.getLogs({
			operation: 'read',
			level: LogLevel.WARN
		})).concat(this.getLogs({
			operation: 'write',
			level: LogLevel.WARN
		})).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
	}

	// Export logs as JSON for analysis
	exportLogs(): string {
		return JSON.stringify(this.logs, null, 2);
	}

	// Generate a summary report
	generateReport(): string {
		const now = new Date();
		const oneMinuteAgo = new Date(now.getTime() - 60000);
		const fiveMinutesAgo = new Date(now.getTime() - 300000);

		const recentLogs = this.getLogs({ since: fiveMinutesAgo });
		const criticalLogs = this.getLogs({ level: LogLevel.ERROR, since: fiveMinutesAgo });
		const warningLogs = this.getLogs({ level: LogLevel.WARN, since: fiveMinutesAgo });

		const report = [
			'=== VARDON DIAGNOSTIC REPORT ===',
			`Generated: ${now.toISOString()}`,
			'',
			'=== SUMMARY ===',
			`Total logs (last 5 min): ${recentLogs.length}`,
			`Critical errors: ${criticalLogs.length}`,
			`Warnings: ${warningLogs.length}`,
			'',
			'=== RECENT CHARACTER LOADING ISSUES ===',
			...this.getCharacterLoadingIssues().slice(0, 5).map(log => 
				`[${log.timestamp}] ${log.message}${log.data ? ` | Data: ${log.data}` : ''}${log.error ? ` | Error: ${log.error}` : ''}`
			),
			'',
			'=== RECENT DATABASE ISSUES ===',
			...this.getDatabaseIssues().slice(0, 5).map(log => 
				`[${log.timestamp}] ${log.message}${log.data ? ` | Data: ${log.data}` : ''}${log.error ? ` | Error: ${log.error}` : ''}`
			),
			'',
			'=== RECENT FILE SYSTEM ISSUES ===',
			...this.getFileSystemIssues().slice(0, 5).map(log => 
				`[${log.timestamp}] ${log.message}${log.data ? ` | Data: ${log.data}` : ''}${log.error ? ` | Error: ${log.error}` : ''}`
			),
			'',
			'=== RECENT CRITICAL ERRORS ===',
			...criticalLogs.slice(0, 10).map(log => 
				`[${log.timestamp}] [${log.component}:${log.operation}] ${log.message}${log.error ? ` | ${log.error}` : ''}`
			)
		];

		return report.join('\n');
	}

	// Clear all logs
	clear(): void {
		this.logs = [];
	}
}

// Global logger instance
export const logger = Logger.getInstance();

// Helper functions for quick logging
export const logDebug = (component: string, operation: string, message: string, data?: any) => 
	logger.debug(component, operation, message, data);

export const logInfo = (component: string, operation: string, message: string, data?: any) => 
	logger.info(component, operation, message, data);

export const logWarn = (component: string, operation: string, message: string, data?: any) => 
	logger.warn(component, operation, message, data);

export const logError = (component: string, operation: string, message: string, data?: any, error?: Error) => 
	logger.error(component, operation, message, data, error);

export const logFatal = (component: string, operation: string, message: string, data?: any, error?: Error) => 
	logger.fatal(component, operation, message, data, error);