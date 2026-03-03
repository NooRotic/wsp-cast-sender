#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function validateBuildOutput() {
  const outDir = path.join(__dirname, '../../out');

  if (!fs.existsSync(outDir)) {
    console.error('❌ Build output directory not found. Run build first.');
    process.exit(1);
  }

  console.log('🔍 Validating build output...');

  // Test cases for different file types and locations
  const testCases = [
    {
      file: path.join(outDir, 'index.html'),
      description: 'Root index.html should exist',
      shouldExist: true
    },
    {
      file: path.join(outDir, 'cast-debug', 'index.html'),
      description: 'Cast debug page should exist',
      shouldExist: true
    },
    {
      file: path.join(outDir, '_next'),
      description: '_next directory should exist',
      shouldExist: true
    }
  ];

  let allTestsPassed = true;

  // Check file existence
  testCases.forEach((testCase, index) => {
    const exists = fs.existsSync(testCase.file);
    if (exists === testCase.shouldExist) {
      console.log(`✅ Test ${index + 1}: ${testCase.description}`);
    } else {
      console.log(`❌ Test ${index + 1}: ${testCase.description}`);
      allTestsPassed = false;
    }
  });

  // Check HTML files for proper asset references
  const htmlFiles = [
    path.join(outDir, 'index.html'),
    path.join(outDir, 'cast-debug', 'index.html')
  ];

  htmlFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.relative(outDir, filePath);

      console.log(`\n📄 Checking ${fileName}:`);

      // Check for asset references
      const assetPattern = /_next\/static/g;
      const matches = content.match(assetPattern);

      if (matches) {
        console.log(`   Found ${matches.length} _next/static references`);

        // Sample some actual references
        const hrefMatches = content.match(/href="[^"]*_next\/static[^"]*"/g);
        const srcMatches = content.match(/src="[^"]*_next\/static[^"]*"/g);

        if (hrefMatches) {
          console.log(`   CSS references: ${hrefMatches.slice(0, 2).join(', ')}${hrefMatches.length > 2 ? '...' : ''}`);
        }
        if (srcMatches) {
          console.log(`   JS references: ${srcMatches.slice(0, 2).join(', ')}${srcMatches.length > 2 ? '...' : ''}`);
        }
      } else {
        console.log(`   ⚠️  No _next/static references found`);
      }

      // Check for problematic absolute paths
      const absoluteNextRefs = content.match(/"\/\_next\//g);
      if (absoluteNextRefs) {
        console.log(`   ⚠️  Found ${absoluteNextRefs.length} absolute /_next/ references (may cause issues)`);
        allTestsPassed = false;
      }
    }
  });

  console.log('\n📊 Build Validation Summary:');
  if (allTestsPassed) {
    console.log('✅ All tests passed! Build output looks good.');
    console.log('\n🚀 Ready for deployment to production.');
  } else {
    console.log('❌ Some tests failed. Please review the build configuration.');
    process.exit(1);
  }
}

// Run validation
validateBuildOutput();
