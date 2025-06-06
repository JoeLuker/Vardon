// Test script to check if character loading is working
// This will help us understand what's happening

const http = require('http');

console.log('Testing character page loading...\n');

const options = {
    hostname: 'localhost',
    port: 5174,
    path: '/characters/1',
    method: 'GET',
    headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (diagnostic test)'
    }
};

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        // Check for error indicators in the response
        const errorPatterns = [
            /error/gi,
            /failed/gi,
            /exception/gi,
            /Character.*not.*found/gi,
            /Database.*not.*available/gi
        ];
        
        console.log('\nChecking for errors in response...');
        
        let errorsFound = false;
        errorPatterns.forEach(pattern => {
            const matches = data.match(pattern);
            if (matches && matches.length > 0) {
                console.log(`Found ${matches.length} occurrences of: ${pattern.source}`);
                errorsFound = true;
            }
        });
        
        if (!errorsFound) {
            console.log('✅ No obvious errors found in response');
        }
        
        // Check response length
        console.log(`\nResponse length: ${data.length} bytes`);
        
        // Look for diagnostic script availability
        if (data.includes('vardonDiagnostics')) {
            console.log('✅ Diagnostic tools are included in the page');
        } else {
            console.log('❌ Diagnostic tools may not be properly loaded');
        }
        
        // Save response for inspection
        require('fs').writeFileSync('/tmp/character_page_response.html', data);
        console.log('\nFull response saved to: /tmp/character_page_response.html');
    });
});

req.on('error', (error) => {
    console.error('Request error:', error);
});

req.end();