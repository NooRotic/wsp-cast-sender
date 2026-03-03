#!/usr/bin/env node

/**
 * M3U Stream Validator
 * 
 * This utility tests each stream URL in an M3U playlist file and creates
 * a new file containing only the streams that are accessible and playable.
 * 
 * Usage: node stream-validator.js <input-m3u-file> [output-file] [options]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const CONFIG = {
  timeout: 10000,          // 10 second timeout per request
  maxRetries: 2,           // Retry failed requests
  concurrency: 5,          // Number of concurrent requests
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  verbose: false,          // Verbose logging
  checkContent: true,      // Actually check if content is streamable
  outputStats: true,       // Output validation statistics
  checkCors: false         // Check CORS headers (Access-Control-Allow-Origin)
};

class StreamValidator {
  constructor(options = {}) {
    this.config = { ...CONFIG, ...options };
    this.stats = {
      total: 0,
      valid: 0,
      invalid: 0,
      authRequired: 0,
      timeout: 0,
      networkError: 0
    };
  }

  /**
   * Parse M3U file content into structured data
   */
  parseM3U(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const entries = [];
    let currentEntry = null;

    for (const line of lines) {
      if (line.startsWith('#EXTM3U')) {
        continue; // Header line
      } else if (line.startsWith('#EXTINF:')) {
        // Extract metadata from EXTINF line
        currentEntry = this.parseExtinf(line);
      } else if (line.startsWith('#')) {
        // Other metadata lines - ignore for now
        continue;
      } else if (line.match(/^https?:\/\//)) {
        // Stream URL
        if (currentEntry) {
          currentEntry.url = line;
          entries.push(currentEntry);
          currentEntry = null;
        } else {
          // URL without EXTINF - create basic entry
          entries.push({
            duration: -1,
            title: 'Unknown Stream',
            url: line,
            attributes: {}
          });
        }
      }
    }

    return entries;
  }

  /**
   * Parse EXTINF line to extract metadata
   */
  parseExtinf(line) {
    const entry = {
      duration: -1,
      title: 'Unknown',
      attributes: {},
      url: ''
    };

    // Extract duration
    const durationMatch = line.match(/#EXTINF:(-?\d+(?:\.\d+)?)/);
    if (durationMatch) {
      entry.duration = parseFloat(durationMatch[1]);
    }

    // Extract attributes (tvg-id, tvg-logo, group-title, etc.)
    const attributeRegex = /(\w+(?:-\w+)*)=(?:"([^"]*)"|([^\s,]+))/g;
    let match;
    while ((match = attributeRegex.exec(line)) !== null) {
      const key = match[1];
      const value = match[2] || match[3] || '';
      entry.attributes[key] = value;
    }

    // Extract title (everything after the last comma)
    const titleMatch = line.match(/,([^,]+)$/);
    if (titleMatch) {
      entry.title = titleMatch[1].trim();
    }

    return entry;
  }

  /**
   * Test a single stream URL for accessibility
   */
  async testStreamUrl(url, retryCount = 0) {
    return new Promise((resolve) => {
      try {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const httpModule = isHttps ? https : http;
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: 'HEAD', // Use HEAD to minimize data transfer
          headers: {
            'User-Agent': this.config.userAgent,
            'Accept': 'application/vnd.apple.mpegurl,application/x-mpegurl,video/mp4,*/*'
          },
          timeout: this.config.timeout
        };
        const req = httpModule.request(options, (res) => {
          const status = res.statusCode;
          const contentType = res.headers['content-type'] || '';
          let corsHeader = res.headers['access-control-allow-origin'] || '';
          if (this.config.verbose) {
            console.log(`  Status: ${status}, Content-Type: ${contentType}, CORS: ${corsHeader}`);
          }
          // Check response status
          if (status === 200) {
            // Success - check if content type suggests it's streamable
            let corsOk = true;
            if (this.config.checkCors) {
              corsOk = !!corsHeader && (corsHeader === '*' || corsHeader.includes('http'));
            }
            if (this.config.checkContent) {
              const isStreamable = this.isStreamableContent(contentType, url);
              resolve({
                valid: isStreamable && corsOk,
                status,
                reason: isStreamable ? (corsOk ? 'OK' : `Missing/invalid CORS: ${corsHeader}`) : `Non-streamable content type: ${contentType}`,
                cors: corsHeader
              });
            } else {
              resolve({ valid: corsOk, status, reason: corsOk ? 'OK' : `Missing/invalid CORS: ${corsHeader}`, cors: corsHeader });
            }
          } else if (status === 302 || status === 301) {
            // Redirect - could be valid
            resolve({ valid: true, status, reason: 'Redirect', cors: corsHeader });
          } else if (status === 401 || status === 403) {
            // Authentication required
            this.stats.authRequired++;
            resolve({ valid: false, status, reason: 'Authentication required', cors: corsHeader });
          } else if (status === 404) {
            resolve({ valid: false, status, reason: 'Not found', cors: corsHeader });
          } else if (status >= 500) {
            resolve({ valid: false, status, reason: 'Server error', cors: corsHeader });
          } else {
            resolve({ valid: false, status, reason: `HTTP ${status}`, cors: corsHeader });
          }
        });
        req.on('timeout', () => {
          req.destroy();
          this.stats.timeout++;
          if (retryCount < this.config.maxRetries) {
            setTimeout(() => {
              this.testStreamUrl(url, retryCount + 1).then(resolve);
            }, 1000);
          } else {
            resolve({ valid: false, status: 0, reason: 'Timeout' });
          }
        });
        req.on('error', (err) => {
          this.stats.networkError++;
          if (retryCount < this.config.maxRetries) {
            setTimeout(() => {
              this.testStreamUrl(url, retryCount + 1).then(resolve);
            }, 1000);
          } else {
            resolve({ valid: false, status: 0, reason: `Network error: ${err.message}` });
          }
        });
        req.end();
      } catch (err) {
        resolve({ valid: false, status: 0, reason: `Parse error: ${err.message}` });
      }
    });
  }

  /**
   * Check if content type suggests streamable media
   */
  isStreamableContent(contentType, url) {
    const streamableTypes = [
      'application/vnd.apple.mpegurl',
      'application/x-mpegurl',
      'video/mp4',
      'video/mp2t',
      'video/x-msvideo',
      'video/quicktime',
      'application/octet-stream' // Many streams use this generic type
    ];

    // Check content type
    const isStreamableType = streamableTypes.some(type => 
      contentType.toLowerCase().includes(type)
    );

    // Also check URL extension as fallback
    const hasStreamExtension = /\.(m3u8|ts|mp4|avi|mkv|mov)$/i.test(url);

    return isStreamableType || hasStreamExtension;
  }

  /**
   * Process streams with concurrency control
   */
  async processStreams(entries) {
    const validEntries = [];
    const results = [];
    console.log(`🔍 Testing ${entries.length} streams with concurrency: ${this.config.concurrency}`);
    for (let i = 0; i < entries.length; i += this.config.concurrency) {
      const batch = entries.slice(i, i + this.config.concurrency);
      const batchPromises = batch.map(async (entry, batchIndex) => {
        const globalIndex = i + batchIndex;
        console.log(`[${globalIndex + 1}/${entries.length}] Testing: ${entry.title}`);
        if (this.config.verbose) {
          console.log(`  URL: ${entry.url}`);
        }
        const result = await this.testStreamUrl(entry.url);
        if (this.config.checkCors) {
          if (result.cors) {
            console.log(`    CORS: ${result.cors}`);
          } else {
            console.log(`    CORS: (none)`);
          }
        }
        if (result.valid) {
          validEntries.push(entry);
          this.stats.valid++;
          console.log(`  ✅ Valid: ${result.reason}`);
        } else {
          this.stats.invalid++;
          console.log(`  ❌ Invalid: ${result.reason}`);
        }
        return { entry, result };
      });
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      if (i + this.config.concurrency < entries.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    return { validEntries, results };
  }

  /**
   * Generate M3U content from entries
   */
  generateM3U(entries) {
    let content = '#EXTM3U\n';
    
    for (const entry of entries) {
      // Build EXTINF line
      let extinf = `#EXTINF:${entry.duration}`;
      
      // Add attributes
      for (const [key, value] of Object.entries(entry.attributes)) {
        extinf += ` ${key}="${value}"`;
      }
      
      extinf += `,${entry.title}\n`;
      content += extinf;
      content += entry.url + '\n';
    }
    
    return content;
  }

  /**
   * Print validation statistics
   */
  printStats() {
    if (!this.config.outputStats) return;
    
    console.log('\n📊 Validation Statistics:');
    console.log('─'.repeat(50));
    console.log(`Total streams tested: ${this.stats.total}`);
    console.log(`✅ Valid streams: ${this.stats.valid} (${((this.stats.valid / this.stats.total) * 100).toFixed(1)}%)`);
    console.log(`❌ Invalid streams: ${this.stats.invalid} (${((this.stats.invalid / this.stats.total) * 100).toFixed(1)}%)`);
    console.log(`🔒 Authentication required: ${this.stats.authRequired}`);
    console.log(`⏰ Timeouts: ${this.stats.timeout}`);
    console.log(`🌐 Network errors: ${this.stats.networkError}`);
  }

  /**
   * Main validation process
   */
  async validateM3U(inputFile, outputFile = null) {
    try {
      console.log(`🎬 M3U Stream Validator`);
      console.log(`📁 Input file: ${inputFile}`);
      
      // Read input file
      if (!fs.existsSync(inputFile)) {
        throw new Error(`Input file not found: ${inputFile}`);
      }
      
      const content = fs.readFileSync(inputFile, 'utf8');
      const entries = this.parseM3U(content);
      this.stats.total = entries.length;
      
      console.log(`📋 Found ${entries.length} streams to validate`);
      
      // Process streams
      const { validEntries } = await this.processStreams(entries);
      
      // Generate output
      if (outputFile) {
        const outputContent = this.generateM3U(validEntries);
        fs.writeFileSync(outputFile, outputContent);
        console.log(`\n💾 Filtered M3U saved to: ${outputFile}`);
      }
      
      // Print statistics
      this.printStats();
      
      return validEntries;
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🎬 M3U Stream Validator

Usage: node stream-validator.js <input-file> [output-file] [options]

Arguments:
  input-file    Path to the M3U playlist file to validate
  output-file   Path for the filtered output file (optional)

Options:
  --timeout=N      Request timeout in milliseconds (default: 10000)
  --concurrency=N  Number of concurrent requests (default: 5)
  --retries=N      Number of retries for failed requests (default: 2)
  --verbose        Enable verbose logging
  --no-content     Skip content type checking
  --no-stats       Don't output statistics
  --check-cors     Check Access-Control-Allow-Origin header

Example:
  node stream-validator.js playlist.m3u filtered.m3u
  node stream-validator.js playlist.m3u --verbose --timeout=5000
  node stream-validator.js playlist.m3u --check-cors
`);
    process.exit(0);
  }
  
  const inputFile = args[0];
  const outputFile = args[1] && !args[1].startsWith('--') ? args[1] : null;
  
  // Parse options
  const options = {};
  for (const arg of args) {
    if (arg.startsWith('--timeout=')) {
      options.timeout = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--concurrency=')) {
      options.concurrency = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--retries=')) {
      options.maxRetries = parseInt(arg.split('=')[1]);
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--no-content') {
      options.checkContent = false;
    } else if (arg === '--no-stats') {
      options.outputStats = false;
    } else if (arg === '--check-cors') {
      options.checkCors = true;
    }
  }
  
  // Generate output filename if not provided
  const finalOutputFile = outputFile || inputFile.replace(/\.m3u$/i, '_filtered.m3u');
  
  // Run validator
  const validator = new StreamValidator(options);
  validator.validateM3U(inputFile, finalOutputFile);
}

module.exports = StreamValidator;
