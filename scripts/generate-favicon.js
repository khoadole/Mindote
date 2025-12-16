// Script to generate favicon.ico from icon.png using sharp
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateFavicon() {
    const publicDir = path.join(__dirname, '..', 'public');
    const iconPath = path.join(publicDir, 'icon.png');
    const faviconPath = path.join(publicDir, 'favicon.ico');

    console.log('Generating favicon.ico from icon.png...');

    try {
        // Generate 48x48 ICO file (most common size for favicons)
        await sharp(iconPath)
            .resize(48, 48, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .toFile(faviconPath);

        console.log('✓ favicon.ico created successfully!');
        console.log(`Location: ${faviconPath}`);
    } catch (error) {
        console.error('❌ Error generating favicon:', error.message);
        console.log('\nAlternative: Use an online converter');
        console.log('1. Go to https://favicon.io/favicon-converter/');
        console.log('2. Upload public/icon.png');
        console.log('3. Download and extract favicon.ico to public/ directory');
        process.exit(1);
    }
}

generateFavicon();
