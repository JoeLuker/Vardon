// Automated diagnostic runner using Playwright
// This will open a browser, navigate to the character page, and run diagnostics

const { chromium } = require('@playwright/test');

(async () => {
    console.log('🚀 Starting automated diagnostic test...\n');
    
    // Launch browser
    const browser = await chromium.launch({ 
        headless: false,  // Set to true for headless mode
        devtools: true    // Open devtools automatically
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Listen for console messages from the page
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        
        // Format console output
        if (type === 'error') {
            console.error(`[PAGE ERROR] ${text}`);
        } else if (type === 'warn') {
            console.warn(`[PAGE WARN] ${text}`);
        } else {
            console.log(`[PAGE LOG] ${text}`);
        }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
        console.error(`[PAGE CRASH] ${error.message}`);
    });
    
    try {
        console.log('📍 Navigating to character page...');
        await page.goto('http://localhost:5173/characters/1', {
            waitUntil: 'networkidle'
        });
        
        console.log('✅ Page loaded, waiting for diagnostics to initialize...\n');
        
        // Wait a bit for everything to initialize
        await page.waitForTimeout(2000);
        
        // Run diagnostics in the page context
        const diagnosticResults = await page.evaluate(async () => {
            // Check if diagnostics are available
            if (typeof window.vardonDiagnostics === 'undefined') {
                return {
                    available: false,
                    error: 'Diagnostic tools not available'
                };
            }
            
            // Capture diagnostic output
            const results = {
                available: true,
                logs: [],
                characterIssues: [],
                databaseIssues: [],
                fileSystemIssues: []
            };
            
            // Override console.log temporarily to capture output
            const originalLog = console.log;
            const originalGroup = console.group;
            const originalGroupEnd = console.groupEnd;
            
            console.log = (...args) => {
                results.logs.push(args.join(' '));
                originalLog(...args);
            };
            
            console.group = (label) => {
                results.logs.push(`\n=== ${label} ===`);
                originalGroup(label);
            };
            
            console.groupEnd = () => {
                results.logs.push('===\n');
                originalGroupEnd();
            };
            
            // Run diagnostic functions
            try {
                // Get analysis results
                results.characterIssues = window.vardonDiagnostics.constructor.analyzeCharacterLoadingIssues();
                results.databaseIssues = window.vardonDiagnostics.constructor.analyzeDatabaseIssues();
                results.fileSystemIssues = window.vardonDiagnostics.constructor.analyzeFileSystemIssues();
                
                // Run full diagnostics
                window.vardonDiagnostics.analyze();
                
            } catch (error) {
                results.error = error.message;
            }
            
            // Restore console
            console.log = originalLog;
            console.group = originalGroup;
            console.groupEnd = originalGroupEnd;
            
            return results;
        });
        
        // Display results
        console.log('\n📊 DIAGNOSTIC RESULTS:\n');
        
        if (!diagnosticResults.available) {
            console.error('❌ ' + diagnosticResults.error);
        } else {
            console.log('✅ Diagnostic tools loaded successfully\n');
            
            console.log('📋 CHARACTER LOADING ISSUES:');
            diagnosticResults.characterIssues.forEach(issue => console.log(`  ${issue}`));
            
            console.log('\n💾 DATABASE ISSUES:');
            diagnosticResults.databaseIssues.forEach(issue => console.log(`  ${issue}`));
            
            console.log('\n📁 FILE SYSTEM ISSUES:');
            diagnosticResults.fileSystemIssues.forEach(issue => console.log(`  ${issue}`));
            
            console.log('\n📜 FULL DIAGNOSTIC OUTPUT:');
            diagnosticResults.logs.forEach(log => console.log(log));
        }
        
        // Try to download logs
        console.log('\n💾 Attempting to download logs...');
        await page.evaluate(() => {
            if (window.vardonDiagnostics && window.vardonDiagnostics.downloadLogs) {
                window.vardonDiagnostics.downloadLogs();
            }
        });
        
        // Wait a bit to see results
        console.log('\n⏳ Keeping browser open for 10 seconds to review results...');
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
})();