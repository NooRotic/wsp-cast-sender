#!/bin/bash
# Project cleanup script for skills-jet-sender

echo "🧹 Cleaning up skills-jet-sender project..."

# Navigate to project directory
cd "$(dirname "$0")/../.."

# Remove build artifacts
echo "Removing build artifacts..."
rm -rf .next/
rm -rf out/
rm -rf dist/
rm -rf node_modules/.cache/

# Remove development files
echo "Removing development files..."
rm -rf coverage/
rm -rf .nyc_output/

# Remove OS-specific files
echo "Removing OS-specific files..."
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete
find . -name "*.log" -type f -delete

# Remove editor-specific files
echo "Removing editor-specific files..."
find . -name ".vscode" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.swp" -type f -delete
find . -name "*.swo" -type f -delete

echo "✅ Cleanup complete!"
