// Diagnostic script to analyze character loading issues
// Run this in the browser console after navigating to a character page

console.log('=== VARDON DIAGNOSTIC RUNNER ===');
console.log('Starting diagnostic analysis...\n');

// Check if diagnostics are available
if (typeof window.vardonDiagnostics === 'undefined') {
	console.error('❌ Diagnostic tools not available! Make sure you are on a character page.');
} else {
	console.log('✅ Diagnostic tools loaded successfully\n');

	// Run full analysis
	console.log('📊 Running full diagnostic analysis...');
	vardonDiagnostics.analyze();

	// Export current logs
	setTimeout(() => {
		console.log('\n📋 Exporting current logs...');
		vardonDiagnostics.exportLogs();

		// Offer to download logs
		console.log('\n💾 To download logs as JSON file, run: vardonDiagnostics.downloadLogs()');
	}, 1000);
}

console.log('\n=== END DIAGNOSTIC RUNNER ===');
