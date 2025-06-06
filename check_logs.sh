#!/bin/bash
# Simple script to test the diagnostic system

echo "🔍 Checking Vardon diagnostic system..."
echo ""

# First, let's see if we can get a simple response
echo "1. Testing basic server connectivity..."
curl -s -o /dev/null -w "Server response: %{http_code}\n" http://localhost:5173/

echo ""
echo "2. Testing character page..."
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:5173/characters/1)
http_code=$(echo "$response" | grep HTTP_CODE | cut -d: -f2)
echo "Character page response: $http_code"

if [ "$http_code" = "500" ]; then
    echo ""
    echo "❌ Server is returning 500 error. This suggests a server-side issue."
    echo "   The diagnostic tools are working, but there's an error loading character data."
    echo ""
    echo "💡 To diagnose:"
    echo "   1. Check the terminal where 'npm run dev' is running for error messages"
    echo "   2. The logging system will capture these errors"
    echo "   3. Open http://localhost:5173/characters/1 in a browser"
    echo "   4. Open browser console (F12)"
    echo "   5. Run: vardonDiagnostics.analyze()"
    echo "   6. Run: vardonDiagnostics.downloadLogs()"
elif [ "$http_code" = "200" ]; then
    echo ""
    echo "✅ Character page loaded successfully!"
    echo ""
    echo "📊 To run diagnostics:"
    echo "   1. Open http://localhost:5173/characters/1 in a browser"
    echo "   2. Open browser console (F12)"
    echo "   3. Run: vardonDiagnostics.analyze()"
    echo "   4. Run: vardonDiagnostics.downloadLogs()"
else
    echo ""
    echo "⚠️  Unexpected response code: $http_code"
fi

echo ""
echo "📋 Available diagnostic commands in browser console:"
echo "   - vardonDiagnostics.analyze()     // Run full analysis"
echo "   - vardonDiagnostics.exportLogs()  // Show logs in console"
echo "   - vardonDiagnostics.downloadLogs() // Download logs as JSON"
echo ""