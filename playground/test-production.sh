#!/bin/bash

# Production Deployment Test Script
# Tests the playground using the published npm package

set -e

echo "🚀 Testing Production Deployment with npm package"
echo "================================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not available"
    exit 1
fi

echo "✅ Docker is available"

# Build and test the playground with production package
# Already in playground directory

echo "📦 Building Docker image with production dependencies..."
docker build -t citty-playground-prod .

echo "🧪 Testing playground commands..."

# Test help command
echo "  Testing --show-help..."
docker run --rm citty-playground-prod node src/cli.mjs --show-help | grep -q "Playground CLI" && echo "    ✅ Help command works"

# Test greet command  
echo "  Testing greet command..."
docker run --rm citty-playground-prod node src/cli.mjs greet "Production" | grep -q "Hello, Production!" && echo "    ✅ Greet command works"

# Test math command
echo "  Testing math command..."
docker run --rm citty-playground-prod node src/cli.mjs math add 5 3 | grep -q "8" && echo "    ✅ Math command works"

# Test JSON output
echo "  Testing JSON output..."
docker run --rm citty-playground-prod node src/cli.mjs --json | grep -q '"version":"1.0.0"' && echo "    ✅ JSON output works"

# Cleanup
docker rmi citty-playground-prod

echo "🎉 Production deployment test completed successfully!"
echo "The playground works correctly with the published npm package"
