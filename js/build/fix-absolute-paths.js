#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixAbsolutePaths() {
  const outDir = path.join(__dirname, '../../out');

  if (!fs.existsSync(outDir)) {
    console.error('❌ Build output directory not found. Run build first.');
    process.exit(1);
  }

  console.log('🔧 Fixing absolute _next paths in HTML files...');

  function processHtmlFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(outDir, filePath);

    // Determine directory depth to calculate relative path to _next
    const isRoot = relativePath === 'index.html' || relativePath === '404.html';
    const prefix = isRoot ? './' : '../';

    console.log(`Processing: ${relativePath} (using prefix: ${prefix})`);

    // Replace absolute /_next/ paths with relative ones in all contexts
    const fixedContent = content
      .replace(/href="\/_next\//g, `href="${prefix}_next/`)
      .replace(/src="\/_next\//g, `src="${prefix}_next/`)
      // Fix script and link tags
      .replace(/"\/_next\//g, `"${prefix}_next/`)
      .replace(/'\/_next\//g, `'${prefix}_next/`);

    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`✅ Fixed paths in: ${relativePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${relativePath}`);
    }
  }

  function walkDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory() && item !== '_next') {
        // Recursively process subdirectories but skip _next
        walkDirectory(itemPath);
      } else if (item.endsWith('.html')) {
        processHtmlFile(itemPath);
      }
    }
  }

  walkDirectory(outDir);
  console.log('✅ Path fixing complete!');
}

// Run the fix
fixAbsolutePaths();
