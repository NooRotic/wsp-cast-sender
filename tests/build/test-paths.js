#!/usr/bin/env node

/**
 * Test script to validate path fixing for different directory structures
 */

const fs = require('fs');
const path = require('path');

function testPathFixes() {
  const outDir = path.join(__dirname, '../../out');

  console.log('🧪 Testing path fixes across directory structures...\n');

  // Test cases
  const testCases = [
    {
      file: path.join(outDir, 'index.html'),
      expectedPattern: /href="\.\/_next\//,
      description: 'Root level files should use ./_next/'
    },
    {
      file: path.join(outDir, 'cast-debug', 'index.html'),
      expectedPattern: /href="\.\.\/\_next\//,
      description: 'Subdirectory files should use ../_next/'
    },
    {
      file: path.join(outDir, '404', 'index.html'),
      expectedPattern: /href="\.\.\/\_next\//,
      description: '404 subdirectory should use ../_next/'
    }
  ];

  let allPassed = true;

  testCases.forEach((testCase, index) => {
    if (fs.existsSync(testCase.file)) {
      const content = fs.readFileSync(testCase.file, 'utf8');
      const passes = testCase.expectedPattern.test(content);

      console.log(`${index + 1}. ${testCase.description}`);
      console.log(`   File: ${path.relative(process.cwd(), testCase.file)}`);
      console.log(`   Result: ${passes ? '✅ PASS' : '❌ FAIL'}`);

      if (!passes) {
        allPassed = false;
        // Show actual pattern found
        const nextMatch = content.match(/href="[^"]*_next[^"]*"/);
        if (nextMatch) {
          console.log(`   Found: ${nextMatch[0]}`);
        }
      }
      console.log('');
    } else {
      console.log(`${index + 1}. ${testCase.description}`);
      console.log(`   File: ${path.relative(process.cwd(), testCase.file)}`);
      console.log(`   Result: ⚠️  SKIP (file not found)`);
      console.log('');
    }
  });

  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (allPassed) {
    console.log('\n🚀 Path fixing is working correctly for all directory structures!');
    console.log('   - Root files use ./_next/ (relative to current directory)');
    console.log('   - Subdirectory files use ../_next/ (relative to parent directory)');
    console.log('   - This ensures all paths resolve to the correct /_next/ location');
  }

  return allPassed;
}

// Run the test
if (require.main === module) {
  testPathFixes();
}

module.exports = { testPathFixes };
