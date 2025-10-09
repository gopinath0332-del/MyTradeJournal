#!/bin/bash

# Test script for GitHub Pages SPA routing
# This script helps test if the SPA routing fix works correctly

echo "🚀 Testing GitHub Pages SPA routing fix..."
echo ""

# Build the project
echo "📦 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    
    # Check if 404.html exists in dist
    if [ -f "dist/404.html" ]; then
        echo "✅ 404.html found in dist folder"
    else
        echo "❌ 404.html not found in dist folder"
        exit 1
    fi
    
    # Check if index.html contains redirect script
    if grep -q "pathSegmentsToKeep" dist/index.html; then
        echo "✅ Redirect script found in index.html"
    else
        echo "❌ Redirect script not found in index.html"
        exit 1
    fi
    
    echo ""
    echo "🎉 All checks passed!"
    echo ""
    echo "Next steps:"
    echo "1. The changes have been pushed to GitHub"
    echo "2. GitHub Actions will automatically deploy the changes"
    echo "3. Wait a few minutes for deployment to complete"
    echo "4. Test the following URLs:"
    echo "   - https://gopinath0332-del.github.io/MyTradeJournal/"
    echo "   - https://gopinath0332-del.github.io/MyTradeJournal/history"
    echo "   - https://gopinath0332-del.github.io/MyTradeJournal/statistics"
    echo ""
    echo "💡 The 404 error on refresh should now be fixed!"
    
else
    echo "❌ Build failed!"
    exit 1
fi