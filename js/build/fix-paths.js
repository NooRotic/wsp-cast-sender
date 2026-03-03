#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixPathsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  console.log(`Processing file: ${filePath}`);

  let fixedContent = content;

  // Determine if this is a subdirectory file that needs different path handling
  const isSubdirectory = filePath.includes(path.sep + 'out' + path.sep) &&
                        !filePath.endsWith(path.sep + 'out' + path.sep + 'index.html') &&
                        filePath.includes(path.sep) &&
                        filePath.split(path.sep + 'out' + path.sep)[1].includes(path.sep);

  // For subdirectory HTML files, we need to go back to root
  if (isSubdirectory && filePath.endsWith('.html')) {
    console.log(`  -> Detected subdirectory file, using root-relative paths`);

    // Replace absolute paths with root-relative paths for subdirectories
    fixedContent = content
      .replace(/href="\/_next\//g, 'href="../_next/')
      .replace(/src="\/_next\//g, 'src="../_next/')
      .replace(/href="\.\/_next\//g, 'href="../_next/')
      .replace(/src="\.\/_next\//g, 'src="../_next/')
      .replace(/href="\._next\//g, 'href="../_next/')
      .replace(/src="\._next\//g, 'src="../_next/');

    // Handle any remaining malformed paths
    fixedContent = fixedContent
      .replace(/"\.(_next\/[^"]*)/g, '"../$1');
  } else {
    // Root level files or non-HTML files
    if (!content.includes('//www.gstatic.com/') && !content.includes('//fonts.gstatic.com/')) {
      // Standard files without external URLs
      fixedContent = content
        .replace(/"\/_next\//g, '"./_next/')
        .replace(/'\/_next\//g, "'./_next/")
        .replace(/src="\/_next\//g, 'src="./_next/')
        .replace(/href="\/_next\//g, 'href="./_next/');
    } else {
      // Files with external URLs - be more careful with regex
      fixedContent = content
        .replace(/(?<!https?:\/\/[^\/\s"']*)"\/(?=_next\/)/g, '".')
        .replace(/(?<!https?:\/\/[^\/\s"']*)'\/(?=_next\/)/g, "'.")
        .replace(/(?<!https?:\/\/[^\/\s"']*\w+)src="\/(?=_next\/)/g, 'src="./')
        .replace(/(?<!https?:\/\/[^\/\s"']*\w+)href="\/(?=_next\/)/g, 'href="./');
    }

    // Fix any remaining ._next issues (missing slash) for root files
    fixedContent = fixedContent
      .replace(/href="\._next\//g, 'href="./_next/')
      .replace(/src="\._next\//g, 'src="./_next/')
      .replace(/"\.(_next\/[^"]*)/g, '"./$1');
  }

  // Additional fixes for HTML files
  if (filePath.endsWith('.html')) {
    // Fix Next.js runtime configuration JSON in HTML
    if (isSubdirectory) {
      // Fix webpack JSON configuration for subdirectories
      fixedContent = fixedContent
        .replace(/"href":"\/(_next\/[^"]*)/g, '"href":"../$1')
        .replace(/\\"href\\":\\"\/(_next\/[^"]*)/g, '\\"href\\":\\"../$1')
        .replace(/"assetPrefix":""/g, '"assetPrefix":".."')
        .replace(/\\"assetPrefix\\":\\"\\"/g, '\\"assetPrefix\\":\\"..\\"');

      // Subdirectory files need to go back to root for favicon, etc.
      fixedContent = fixedContent
        .replace(/"\/favicon\./g, '"../favicon.')
        .replace(/"\/robots\.txt"/g, '"../robots.txt"')
        .replace(/"\/sitemap\.xml"/g, '"../sitemap.xml"');
    } else {
      // Fix webpack JSON configuration for root
      fixedContent = fixedContent
        .replace(/"href":"\/(_next\/[^"]*)/g, '"href":"./$1')
        .replace(/\\"href\\":\\"\/(_next\/[^"]*)/g, '\\"href\\":\\"./$1')
        .replace(/"assetPrefix":""/g, '"assetPrefix":"."')
        .replace(/\\"assetPrefix\\":\\"\\"/g, '\\"assetPrefix\\":\\".\\""');

      // Root level files use current directory
      fixedContent = fixedContent
        .replace(/"\/favicon\./g, '"./favicon.')
        .replace(/"\/robots\.txt"/g, '"./robots.txt"')
        .replace(/"\/sitemap\.xml"/g, '"./sitemap.xml"');
    }
  }

  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent);
    console.log(`✅ Fixed paths in: ${filePath}${isSubdirectory ? ' (subdirectory - using ../)' : ''}${content.includes('gstatic') ? ' (external URLs protected)' : ''}`);
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
}

function fixPathsInDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      fixPathsInDirectory(itemPath);
    } else if (item.endsWith('.html') || item.endsWith('.js') || item.endsWith('.css')) {
      fixPathsInFile(itemPath);
    }
  }
}

const outDir = path.join(__dirname, '../../out');
if (fs.existsSync(outDir)) {
  console.log('Fixing paths in generated files...');
  fixPathsInDirectory(outDir);
  console.log('Path fixing complete!');
} else {
  console.log('No out directory found. Run build first.');
}
