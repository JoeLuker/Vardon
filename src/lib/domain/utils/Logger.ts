/**
 * Simple logger utility to replace duplicated console.log patterns
 * Follows Unix philosophy - does ONE thing: structured logging
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
	FATAL = 4
}

class SimpleLogger {
	private level: LogLevel = LogLevel.INFO;
	private enableTimestamps = true;

	setLevel(level: LogLevel): void {
		this.level = level;
	}

	private shouldLog(level: LogLevel): boolean {
		return level >= this.level;
	}

	private getTimestamp(): string {
		return new Date().toISOString();
	}

	private formatMessage(level: string, component: string, operation: string, message: string): string {
		const timestamp = this.enableTimestamps ? `[${this.getTimestamp()}] ` : '';
		return `${timestamp}[${level}] [${component}:${operation}] ${message}`;
	}

	debug(component: string, operation: string, message: string, data?: any): void {
		if (this.shouldLog(LogLevel.DEBUG)) {
			console.log(this.formatMessage('DEBUG', component, operation, message), data || '');
		}
	}

	info(component: string, operation: string, message: string, data?: any): void {
		if (this.shouldLog(LogLevel.INFO)) {
			console.log(this.formatMessage('INFO', component, operation, message), data || '');
		}
	}

	warn(component: string, operation: string, message: string, data?: any): void {
		if (this.shouldLog(LogLevel.WARN)) {
			console.warn(this.formatMessage('WARN', component, operation, message), data || '');
		}
	}

	error(component: string, operation: string, message: string, data?: any): void {
		if (this.shouldLog(LogLevel.ERROR)) {
			console.error(this.formatMessage('ERROR', component, operation, message), data || '');
		}
	}

	fatal(component: string, operation: string, message: string, data?: any): void {
		if (this.shouldLog(LogLevel.FATAL)) {
			console.error(this.formatMessage('FATAL', component, operation, message), data || '');
		}
	}
}

// Export singleton instance
export const logger = new SimpleLogger();

// Export for testing or multiple instances
export { SimpleLogger };

// Also export LogLevel and logger types for TypeScript
export type { SimpleLogger as LoggerType };