#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Compute the relative prefix that points from an exported HTML file back to
 * the `_next/` asset directory at the root of `out/`.
 *
 * `relativePath` is the file's path relative to `out/` (e.g. "index.html",
 * "blog/index.html", "blog/some-slug/index.html"). The prefix must climb one
 * "../" per directory the file is nested under, otherwise assets 404.
 *
 *   index.html                    -> ./       (depth 0, at root)
 *   blog/index.html               -> ../      (depth 1)
 *   blog/some-slug/index.html     -> ../../   (depth 2)
 */
function computePrefix(relativePath) {
  const dir = path.dirname(relativePath);
  // dirname of a root-level file is '.'; otherwise count the directory segments.
  const depth = dir === '.' ? 0 : dir.split(/[\\/]/).length;
  return depth === 0 ? './' : '../'.repeat(depth);
}

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

    // Climb one "../" per nested directory so assets resolve at every depth
    // (root, /blog/, and /blog/<slug>/ alike). See computePrefix().
    const prefix = computePrefix(relativePath);

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

// Run the fix when invoked directly (skip when required by tests)
if (require.main === module) {
  fixAbsolutePaths();
}

module.exports = { computePrefix, fixAbsolutePaths };
