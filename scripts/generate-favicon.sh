#!/bin/bash
# Script to generate favicon.ico from icon.png

echo "Generating favicon.ico from icon.png..."

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "Using ImageMagick..."
    cd "$(dirname "$0")/../public" || exit 1
    convert icon.png -define icon:auto-resize=16,32,48 favicon.ico
    echo "✓ favicon.ico created successfully!"
elif command -v magick &> /dev/null; then
    echo "Using ImageMagick (magick command)..."
    cd "$(dirname "$0")/../public" || exit 1
    magick icon.png -define icon:auto-resize=16,32,48 favicon.ico
    echo "✓ favicon.ico created successfully!"
else
    echo "❌ ImageMagick is not installed."
    echo ""
    echo "Please choose one of these options:"
    echo ""
    echo "Option 1: Install ImageMagick (recommended)"
    echo "  sudo apt install imagemagick"
    echo ""
    echo "Option 2: Use online converter"
    echo "  1. Go to https://favicon.io/favicon-converter/"
    echo "  2. Upload public/icon.png"
    echo "  3. Download the generated favicon.ico"
    echo "  4. Place it in the public/ directory"
    echo ""
    echo "Option 3: Use Node.js (if you have sharp installed)"
    echo "  npm install sharp"
    echo "  Then run: node scripts/generate-favicon.js"
    exit 1
fi
