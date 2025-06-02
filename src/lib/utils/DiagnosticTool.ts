/**
 * Diagnostic tool for analyzing character loading issues
 */

import { logger, type LogEntry } from './Logger';

export class DiagnosticTool {
	/**
	 * Export current logs to browser console in a readable format
	 */
	static exportLogs(): void {
		const report = logger.generateReport();
		console.group('🔍 VARDON DIAGNOSTIC REPORT');
		console.log(report);
		console.groupEnd();
	}

	/**
	 * Export logs as downloadable JSON file
	 */
	static downloadLogs(): void {
		// Only run in browser environment
		if (typeof window === 'undefined' || typeof document === 'undefined') {
			console.warn('Download logs is only available in browser environment');
			return;
		}
		
		const logs = logger.exportLogs();
		const blob = new Blob([logs], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `vardon-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	/**
	 * Analyze character loading issues and provide recommendations
	 */
	static analyzeCharacterLoadingIssues(): string[] {
		const issues = logger.getCharacterLoadingIssues();
		const recommendations: string[] = [];

		// Check for file creation failures
		const fileCreationErrors = issues.filter(log => 
			log.operation === 'createCharacterFile' && log.message.includes('Failed to create')
		);
		if (fileCreationErrors.length > 0) {
			recommendations.push('❌ File Creation Issues: Character files are failing to be created. Check filesystem permissions and kernel async/await handling.');
		}

		// Check for database connection issues
		const dbConnectionErrors = issues.filter(log => 
			log.message.includes('Database connection') || log.message.includes('Supabase client')
		);
		if (dbConnectionErrors.length > 0) {
			recommendations.push('❌ Database Connection Issues: Database client is not available or failing to connect.');
		}

		// Check for schema relationship errors
		const schemaErrors = issues.filter(log => 
			log.message.includes('relationship') || log.message.includes('schema cache')
		);
		if (schemaErrors.length > 0) {
			recommendations.push('❌ Schema Relationship Issues: Foreign key relationships are not properly configured in the schema cache.');
		}

		// Check for empty file issues
		const emptyFileErrors = issues.filter(log => 
			log.message.includes('empty or invalid')
		);
		if (emptyFileErrors.length > 0) {
			recommendations.push('❌ Empty File Issues: Character files are being created but contain no data. Check async file creation.');
		}

		if (recommendations.length === 0) {
			recommendations.push('✅ No obvious character loading issues detected in recent logs.');
		}

		return recommendations;
	}

	/**
	 * Analyze database issues and provide recommendations
	 */
	static analyzeDatabaseIssues(): string[] {
		const issues = logger.getDatabaseIssues();
		const recommendations: string[] = [];

		// Check for foreign key errors
		const foreignKeyErrors = issues.filter(log => 
			log.message.includes('foreign key relationship') || log.errorMessage?.includes('foreign key')
		);
		if (foreignKeyErrors.length > 0) {
			recommendations.push('❌ Foreign Key Issues: Database schema relationships are not properly defined. Check SchemaRegistry and relationship definitions.');
		}

		// Check for query failures
		const queryErrors = issues.filter(log => 
			log.operation === 'getCharacterById' && log.level >= 2 // WARN or ERROR
		);
		if (queryErrors.length > 0) {
			recommendations.push('❌ Query Issues: Database queries are failing. Check Supabase connection and query syntax.');
		}

		// Check for schema registration issues
		const schemaRegErrors = issues.filter(log => 
			log.component === 'SchemaRegistry' && log.level >= 2
		);
		if (schemaRegErrors.length > 0) {
			recommendations.push('❌ Schema Registration Issues: Database schemas are not being registered properly.');
		}

		if (recommendations.length === 0) {
			recommendations.push('✅ No obvious database issues detected in recent logs.');
		}

		return recommendations;
	}

	/**
	 * Analyze file system issues and provide recommendations
	 */
	static analyzeFileSystemIssues(): string[] {
		const issues = logger.getFileSystemIssues();
		const recommendations: string[] = [];

		// Check for async/await issues
		const asyncErrors = issues.filter(log => 
			log.message.includes('Promise') || log.message.includes('async')
		);
		if (asyncErrors.length > 0) {
			recommendations.push('❌ Async/Await Issues: File operations may not be properly awaited.');
		}

		// Check for file descriptor leaks
		const fdErrors = issues.filter(log => 
			log.message.includes('file descriptor') || log.message.includes('fd')
		);
		if (fdErrors.length > 0) {
			recommendations.push('❌ File Descriptor Issues: File descriptors may not be properly closed.');
		}

		// Check for permission issues
		const permErrors = issues.filter(log => 
			log.message.includes('permission') || log.message.includes('EACCES')
		);
		if (permErrors.length > 0) {
			recommendations.push('❌ Permission Issues: File system operations are being denied access.');
		}

		if (recommendations.length === 0) {
			recommendations.push('✅ No obvious file system issues detected in recent logs.');
		}

		return recommendations;
	}

	/**
	 * Generate a comprehensive diagnostic report
	 */
	static generateDiagnosticReport(): string {
		const charIssues = this.analyzeCharacterLoadingIssues();
		const dbIssues = this.analyzeDatabaseIssues();
		const fsIssues = this.analyzeFileSystemIssues();

		const report = [
			'🔍 VARDON DIAGNOSTIC ANALYSIS',
			'=' * 50,
			'',
			'📊 CHARACTER LOADING ANALYSIS:',
			...charIssues.map(issue => `  ${issue}`),
			'',
			'💾 DATABASE ANALYSIS:',
			...dbIssues.map(issue => `  ${issue}`),
			'',
			'📁 FILE SYSTEM ANALYSIS:',
			...fsIssues.map(issue => `  ${issue}`),
			'',
			'💡 RECOMMENDATIONS:',
			'  1. Check browser console for detailed error logs',
			'  2. Use DiagnosticTool.downloadLogs() to get full log file',
			'  3. Focus on fixing issues in order: Database → File System → Character Loading',
			'',
			`Generated: ${new Date().toISOString()}`
		];

		return report.join('\n');
	}

	/**
	 * Run all diagnostics and display results
	 */
	static runFullDiagnostics(): void {
		console.group('🔍 VARDON FULL DIAGNOSTIC ANALYSIS');
		console.log(this.generateDiagnosticReport());
		console.groupEnd();

		// Also show recent critical errors
		const criticalLogs = logger.getLogs({ level: 3 }); // ERROR level
		if (criticalLogs.length > 0) {
			console.group('🚨 RECENT CRITICAL ERRORS');
			criticalLogs.slice(-10).forEach(log => {
				console.error(`[${log.timestamp}] [${log.component}:${log.operation}] ${log.message}`, log.data || '');
			});
			console.groupEnd();
		}
	}

	/**
	 * Set up automatic diagnostic reporting
	 */
	static setupAutoDiagnostics(): void {
		// Only run in browser environment
		if (typeof window === 'undefined') {
			console.warn('Auto diagnostics is only available in browser environment');
			return;
		}
		
		// Log diagnostic summary every minute
		setInterval(() => {
			const recentErrors = logger.getLogs({ 
				level: 2, // WARN and above
				since: new Date(Date.now() - 60000) // Last minute
			});

			if (recentErrors.length > 0) {
				console.group('⚠️ VARDON AUTO-DIAGNOSTIC (1 min)');
				console.log(`${recentErrors.length} warnings/errors in the last minute`);
				recentErrors.forEach(log => {
					console.log(`[${log.component}] ${log.message}`);
				});
				console.groupEnd();
			}
		}, 60000); // Every minute
	}
}

// Global diagnostic functions for easy access in browser console
// Only set these up in browser environment, not during SSR
if (typeof window !== 'undefined') {
	(window as any).vardonDiagnostics = {
		exportLogs: () => DiagnosticTool.exportLogs(),
		downloadLogs: () => DiagnosticTool.downloadLogs(),
		analyze: () => DiagnosticTool.runFullDiagnostics(),
		autoAnalyze: () => DiagnosticTool.setupAutoDiagnostics()
	};
}

export default DiagnosticTool;