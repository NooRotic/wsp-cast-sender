#!/usr/bin/env node
/**
 * File organization script for skills-jet projects
 * Automatically organizes files according to project standards
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const config = {
  // Files to move to js/build/
  buildFiles: [
    'fix-paths.js',
    'fix-paths.cjs',
    'build.js',
    'deploy.js'
  ],
  
  // Files to move to js/utils/
  utilFiles: [
    'image-loader.js',
    'path-utils.js',
    'helpers.js'
  ],
  
  // Files to move to js/testing/
  testFiles: [
    'test-*.js',
    '*-test.js',
    'debug-*.js'
  ],
  
  // Files to move to js/config/
  configFiles: [
    'config.js',
    'settings.js'
  ],
  
  // Directories to create
  directories: [
    'js/build',
    'js/utils', 
    'js/testing',
    'js/config'
  ]
};

async function ensureDirectories() {
  console.log('📁 Creating directories...');
  
  for (const dir of config.directories) {
    const dirPath = path.join(projectRoot, dir);
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`  ✅ Created: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`  ❌ Failed to create ${dir}:`, error.message);
      }
    }
  }
}

async function moveFiles(filePatterns, targetDir) {
  for (const pattern of filePatterns) {
    try {
      const files = await fs.readdir(projectRoot);
      
      for (const file of files) {
        const match = pattern.includes('*') 
          ? new RegExp(pattern.replace(/\*/g, '.*')).test(file)
          : file === pattern;
          
        if (match) {
          const sourcePath = path.join(projectRoot, file);
          const targetPath = path.join(projectRoot, targetDir, file);
          
          try {
            const stats = await fs.stat(sourcePath);
            if (stats.isFile()) {
              await fs.rename(sourcePath, targetPath);
              console.log(`  ✅ Moved: ${file} → ${targetDir}/`);
            }
          } catch (error) {
            if (error.code !== 'ENOENT') {
              console.error(`  ❌ Failed to move ${file}:`, error.message);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing pattern ${pattern}:`, error.message);
    }
  }
}

async function organizeFiles() {
  console.log('🎯 Starting file organization...\n');
  
  try {
    await ensureDirectories();
    console.log();
    
    console.log('📦 Moving build files...');
    await moveFiles(config.buildFiles, 'js/build');
    console.log();
    
    console.log('🔧 Moving utility files...');
    await moveFiles(config.utilFiles, 'js/utils');
    console.log();
    
    console.log('🧪 Moving test files...');
    await moveFiles(config.testFiles, 'js/testing');
    console.log();
    
    console.log('⚙️ Moving config files...');
    await moveFiles(config.configFiles, 'js/config');
    console.log();
    
    console.log('✅ File organization complete!');
    
  } catch (error) {
    console.error('❌ Organization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  organizeFiles();
}

export default organizeFiles;
