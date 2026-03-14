#!/usr/bin/env node

/**
 * Enhanced Stream Validator & Playlist Cleaner
 *
 * Validates M3U playlist files by:
 * - Checking HTTP status and CORS headers
 * - Validating HLS/DASH manifest files
 * - Testing stream segment availability
 * - Creating filtered playlists with only valid streams
 *
 * Usage: node node-checker.js <input-m3u-file> [options]
 * 
 * Options:
 *   --output <file>       Output file for valid streams (default: input_valid.m3u)
 *   --check-cors          Check CORS headers
 *   --check-manifest      Validate manifest files (HLS/DASH)
 *   --check-segments      Test actual stream segments
 *   --verbose             Detailed logging
 *   --timeout <ms>        Request timeout in ms (default: 15000)
 *   --concurrency <n>     Concurrent requests (default: 3)
 *   --use-curl            Use curl for verification (if available)
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { spawn } = require('child_process');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    inputFile: null,
    outputFile: null,
    checkCors: false,
    checkManifest: false,
    checkSegments: false,
    verbose: false,
    timeout: 15000,
    concurrency: 3,
    useCurl: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--output':
        config.outputFile = args[++i];
        break;
      case '--check-cors':
        config.checkCors = true;
        break;
      case '--check-manifest':
        config.checkManifest = true;
        break;
      case '--check-segments':
        config.checkSegments = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--timeout':
        config.timeout = parseInt(args[++i]) || 15000;
        break;
      case '--concurrency':
        config.concurrency = parseInt(args[++i]) || 3;
        break;
      case '--use-curl':
        config.useCurl = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
      default:
        if (!config.inputFile && !arg.startsWith('--')) {
          config.inputFile = arg;
        }
    }
  }

  if (!config.inputFile) {
    showHelp();
    process.exit(1);
  }

  // Generate output filename if not provided
  if (!config.outputFile) {
    const ext = path.extname(config.inputFile);
    const base = path.basename(config.inputFile, ext);
    const dir = path.dirname(config.inputFile);
    config.outputFile = path.join(dir, `${base}_valid${ext}`);
  }

  return config;
}

function showHelp() {
  console.log(`
🎬 Enhanced Stream Validator & Playlist Cleaner

Usage: node node-checker.js <input-m3u-file> [options]

Options:
  --output <file>       Output file for valid streams (default: input_valid.m3u)
  --check-cors          Check CORS headers for web compatibility
  --check-manifest      Validate HLS/DASH manifest files
  --check-segments      Test actual stream segments (thorough but slower)
  --verbose             Show detailed logging
  --timeout <ms>        Request timeout in milliseconds (default: 15000)
  --concurrency <n>     Number of concurrent requests (default: 3)
  --use-curl            Use curl for verification when available

Examples:
  node node-checker.js playlist.m3u --check-cors --verbose
  node node-checker.js playlist.m3u --check-manifest --output clean.m3u
  node node-checker.js playlist.m3u --check-segments --concurrency 5
`);
}

const config = parseArgs();

// Check if input file exists
if (!fs.existsSync(config.inputFile)) {
  console.error('❌ Input file not found:', config.inputFile);
  process.exit(1);
}

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// Statistics tracking
const stats = {
  total: 0,
  valid: 0,
  invalid: 0,
  corsIssues: 0,
  manifestIssues: 0,
  segmentIssues: 0,
  networkErrors: 0,
  timeouts: 0
};

/**
 * Parse M3U file content
 */
function parseM3U(content) {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const entries = [];
  let currentEntry = null;

  for (const line of lines) {
    if (line.startsWith('#EXTM3U')) {
      continue;
    } else if (line.startsWith('#EXTINF:')) {
      currentEntry = parseExtinf(line);
    } else if (line.startsWith('#')) {
      // Other metadata - could be extended later
      if (currentEntry) {
        currentEntry.metadata = currentEntry.metadata || [];
        currentEntry.metadata.push(line);
      }
    } else if (line.match(/^https?:\/\//)) {
      if (currentEntry) {
        currentEntry.url = line;
        entries.push(currentEntry);
        currentEntry = null;
      } else {
        // URL without EXTINF
        entries.push({
          duration: -1,
          title: extractTitleFromUrl(line),
          url: line,
          attributes: {},
          metadata: []
        });
      }
    }
  }

  return entries;
}

/**
 * Parse EXTINF line
 */
function parseExtinf(line) {
  const entry = {
    duration: -1,
    title: 'Unknown',
    attributes: {},
    url: '',
    metadata: []
  };

  // Extract duration
  const durationMatch = line.match(/#EXTINF:(-?\d+(?:\.\d+)?)/);
  if (durationMatch) {
    entry.duration = parseFloat(durationMatch[1]);
  }

  // Extract attributes
  const attributeRegex = /(\w+(?:-\w+)*)=(?:"([^"]*)"|([^\s,]+))/g;
  let match;
  while ((match = attributeRegex.exec(line)) !== null) {
    const key = match[1];
    const value = match[2] || match[3];
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
 * Extract title from URL
 */
function extractTitleFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    return filename || urlObj.hostname;
  } catch {
    return 'Unknown Stream';
  }
}

/**
 * Check if curl is available
 */
async function isCurlAvailable() {
  if (!config.useCurl) return false;
  return new Promise((resolve) => {
    const curl = spawn('curl', ['--version']);
    curl.on('close', (code) => resolve(code === 0));
    curl.on('error', () => resolve(false));
  });
}

/**
 * Test URL with curl
 */
function testUrlWithCurl(url) {
  return new Promise((resolve) => {
    const args = [
      '--silent',
      '--head',
      '--max-time', Math.floor(config.timeout / 1000).toString(),
      '--user-agent', 'Mozilla/5.0 (compatible; StreamValidator/1.0)',
      '--location', // Follow redirects
    ];

    if (config.checkCors) {
      args.push('--header', 'Origin: https://example.com');
    }

    args.push(url);

    const curl = spawn('curl', args);
    let output = '';
    let error = '';

    curl.stdout.on('data', (data) => {
      output += data.toString();
    });

    curl.stderr.on('data', (data) => {
      error += data.toString();
    });

    curl.on('close', (code) => {
      if (code === 0) {
        const result = parseCurlOutput(output, url);
        resolve(result);
      } else {
        resolve({
          url,
          valid: false,
          status: 0,
          reason: `Curl error: ${error.trim() || 'Unknown error'}`,
          cors: null,
          contentType: null
        });
      }
    });

    curl.on('error', (err) => {
      resolve({
        url,
        valid: false,
        status: 0,
        reason: `Curl spawn error: ${err.message}`,
        cors: null,
        contentType: null
      });
    });
  });
}

/**
 * Parse curl output
 */
function parseCurlOutput(output, url) {
  const lines = output.split('\n');
  let status = 0;
  let contentType = '';
  let cors = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('HTTP/')) {
      const statusMatch = trimmed.match(/HTTP\/[\d.]+\s+(\d+)/);
      if (statusMatch) {
        status = parseInt(statusMatch[1]);
      }
    } else if (trimmed.toLowerCase().startsWith('content-type:')) {
      contentType = trimmed.substring('content-type:'.length).trim();
    } else if (trimmed.toLowerCase().startsWith('access-control-allow-origin:')) {
      cors = trimmed.substring('access-control-allow-origin:'.length).trim();
    }
  }

  const corsOk = !config.checkCors || (cors && (cors === '*' || cors.includes('http')));
  const isStreamable = isStreamableContent(contentType, url);

  return {
    url,
    status,
    contentType,
    cors,
    valid: status === 200 && corsOk && isStreamable,
    reason: status !== 200 ? `HTTP ${status}` : 
            !corsOk ? 'CORS issue' : 
            !isStreamable ? 'Non-streamable content' : 'OK'
  };
}

/**
 * Test URL with Node.js HTTP modules
 */
function testUrlWithNode(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StreamValidator/1.0)',
          'Accept': 'application/vnd.apple.mpegurl,application/x-mpegurl,video/mp4,*/*'
        },
        timeout: config.timeout
      };

      if (config.checkCors) {
        options.headers['Origin'] = 'https://example.com';
      }

      const req = httpModule.request(options, (res) => {
        const status = res.statusCode;
        const contentType = res.headers['content-type'] || '';
        const cors = res.headers['access-control-allow-origin'] || '';
        
        const corsOk = !config.checkCors || (cors && (cors === '*' || cors.includes('http')));
        const isStreamable = isStreamableContent(contentType, url);

        resolve({
          url,
          status,
          contentType,
          cors,
          valid: status === 200 && corsOk && isStreamable,
          reason: status !== 200 ? `HTTP ${status}` : 
                  !corsOk ? 'CORS issue' : 
                  !isStreamable ? 'Non-streamable content' : 'OK'
        });
      });

      req.on('timeout', () => {
        req.destroy();
        stats.timeouts++;
        resolve({
          url,
          valid: false,
          status: 0,
          reason: 'Timeout',
          cors: null,
          contentType: null
        });
      });

      req.on('error', (err) => {
        stats.networkErrors++;
        resolve({
          url,
          valid: false,
          status: 0,
          reason: `Network error: ${err.message}`,
          cors: null,
          contentType: null
        });
      });

      req.end();
    } catch (err) {
      resolve({
        url,
        valid: false,
        status: 0,
        reason: `Parse error: ${err.message}`,
        cors: null,
        contentType: null
      });
    }
  });
}

/**
 * Check if content type is streamable
 */
function isStreamableContent(contentType, url) {
  const streamableTypes = [
    'application/vnd.apple.mpegurl',
    'application/x-mpegurl',
    'application/dash+xml',
    'video/mp4',
    'video/mp2t',
    'video/webm',
    'video/x-msvideo',
    'video/quicktime',
    'application/octet-stream'
  ];

  const lowerContentType = contentType.toLowerCase();
  const hasStreamableType = streamableTypes.some(type => lowerContentType.includes(type));
  const hasStreamExtension = /\.(m3u8|mpd|ts|mp4|webm|avi|mkv|mov)(\?.*)?$/i.test(url);

  return hasStreamableType || hasStreamExtension;
}

/**
 * Test manifest file (HLS/DASH)
 */
async function testManifest(url) {
  if (!config.checkManifest) {
    return { valid: true, reason: 'Skipped' };
  }

  // Only test manifest files
  if (!/\.(m3u8|mpd)(\?.*)?$/i.test(url)) {
    return { valid: true, reason: 'Not a manifest file' };
  }

  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StreamValidator/1.0)',
          'Accept': 'application/vnd.apple.mpegurl,application/dash+xml,*/*'
        },
        timeout: config.timeout
      };

      const req = httpModule.request(options, (res) => {
        let data = '';
        let resolved = false;

        const finish = () => {
          if (resolved) return;
          resolved = true;
          if (res.statusCode !== 200) {
            resolve({ valid: false, reason: `HTTP ${res.statusCode}` });
            return;
          }
          resolve(validateManifestContent(data, url));
        };

        res.on('data', chunk => {
          data += chunk;
          // Limit data to prevent memory issues; validate what we have so far
          if (data.length > 50000) {
            res.destroy();
          }
        });

        res.on('end', finish);
        res.on('close', finish); // fires after destroy()
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ valid: false, reason: 'Manifest timeout' });
      });

      req.on('error', (err) => {
        resolve({ valid: false, reason: `Manifest error: ${err.message}` });
      });

      req.end();
    } catch (err) {
      resolve({ valid: false, reason: `Manifest parse error: ${err.message}` });
    }
  });
}

/**
 * Validate manifest content
 */
function validateManifestContent(content, url) {
  try {
    if (url.includes('.m3u8')) {
      return validateHLSManifest(content);
    } else if (url.includes('.mpd')) {
      return validateDASHManifest(content);
    }
    return { valid: false, reason: 'Unknown manifest type' };
  } catch (err) {
    return { valid: false, reason: `Manifest validation error: ${err.message}` };
  }
}

/**
 * Validate HLS manifest
 */
function validateHLSManifest(content) {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  
  if (!lines[0].startsWith('#EXTM3U')) {
    return { valid: false, reason: 'Invalid HLS manifest header' };
  }

  let hasSegments = false;
  let hasPlaylist = false;

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      hasSegments = true;
    } else if (line.startsWith('#EXT-X-STREAM-INF:')) {
      hasPlaylist = true;
    } else if (line.match(/^https?:\/\//) || line.endsWith('.ts') || line.endsWith('.m4s')) {
      hasSegments = true;
    }
  }

  if (!hasSegments && !hasPlaylist) {
    return { valid: false, reason: 'No valid segments or playlists found' };
  }

  return { valid: true, reason: 'Valid HLS manifest' };
}

/**
 * Validate DASH manifest
 */
function validateDASHManifest(content) {
  if (!content.includes('<MPD') || !content.includes('</MPD>')) {
    return { valid: false, reason: 'Invalid DASH manifest structure' };
  }

  if (!content.includes('<Period') || !content.includes('<AdaptationSet')) {
    return { valid: false, reason: 'Missing required DASH elements' };
  }

  return { valid: true, reason: 'Valid DASH manifest' };
}

/**
 * Test stream segments
 */
async function testSegments(url) {
  if (!config.checkSegments) {
    return { valid: true, reason: 'Skipped' };
  }

  // Only test HLS manifests for now
  if (!/\.m3u8(\?.*)?$/i.test(url)) {
    return { valid: true, reason: 'Not an HLS manifest' };
  }

  try {
    const manifestResult = await testManifest(url);
    if (!manifestResult.valid) {
      return manifestResult;
    }

    // Get manifest content and test first segment
    const manifestContent = await getUrlContent(url);
    if (!manifestContent) {
      return { valid: false, reason: 'Could not fetch manifest for segment testing' };
    }

    const segmentUrl = extractFirstSegment(manifestContent, url);
    if (!segmentUrl) {
      return { valid: false, reason: 'No segments found in manifest' };
    }

    const segmentResult = await testUrlWithNode(segmentUrl);
    return {
      valid: segmentResult.valid,
      reason: segmentResult.valid ? 'Segment accessible' : `Segment issue: ${segmentResult.reason}`
    };
  } catch (err) {
    return { valid: false, reason: `Segment test error: ${err.message}` };
  }
}

/**
 * Get URL content
 */
function getUrlContent(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StreamValidator/1.0)'
        },
        timeout: config.timeout
      };

      const req = httpModule.request(options, (res) => {
        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }

        let data = '';
        let resolved = false;

        const finish = () => {
          if (!resolved) { resolved = true; resolve(data); }
        };

        res.on('data', chunk => {
          data += chunk;
          if (data.length > 50000) {
            res.destroy();
          }
        });

        res.on('end', finish);
        res.on('close', finish);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      req.on('error', () => resolve(null));
      req.end();
    } catch {
      resolve(null);
    }
  });
}

/**
 * Extract first segment URL from HLS manifest
 */
function extractFirstSegment(manifestContent, baseUrl) {
  const lines = manifestContent.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (const line of lines) {
    if (line.match(/^https?:\/\//)) {
      return line;
    } else if (line.endsWith('.ts') || line.endsWith('.m4s') || line.endsWith('.fmp4')) {
      // Relative URL - construct absolute URL
      try {
        const base = new URL(baseUrl);
        return new URL(line, base.href).href;
      } catch {
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Main validation function
 */
async function validateUrl(entry, usesCurl) {
  const url = entry.url;
  
  // Basic URL test
  const basicResult = usesCurl ? 
    await testUrlWithCurl(url) : 
    await testUrlWithNode(url);

  if (!basicResult.valid) {
    return {
      ...basicResult,
      entry,
      manifestResult: { valid: false, reason: 'Skipped due to basic test failure' },
      segmentResult: { valid: false, reason: 'Skipped due to basic test failure' }
    };
  }

  // Manifest test
  const manifestResult = await testManifest(url);
  if (config.checkManifest && !manifestResult.valid) {
    stats.manifestIssues++;
  }

  // Segment test
  const segmentResult = await testSegments(url);
  if (config.checkSegments && !segmentResult.valid) {
    stats.segmentIssues++;
  }

  // Determine overall validity
  const overallValid = basicResult.valid && 
    (!config.checkManifest || manifestResult.valid) &&
    (!config.checkSegments || segmentResult.valid);

  return {
    ...basicResult,
    entry,
    manifestResult,
    segmentResult,
    valid: overallValid
  };
}

/**
 * Process entries with concurrency control
 */
async function processEntries(entries, usesCurl) {
  const validEntries = [];
  const results = [];
  
  console.log(`🔍 Testing ${entries.length} streams with concurrency: ${config.concurrency}`);
  console.log(`📊 Options: CORS=${config.checkCors}, Manifest=${config.checkManifest}, Segments=${config.checkSegments}`);
  console.log(`⚙️  Using: ${usesCurl ? 'curl' : 'Node.js HTTP'}\n`);

  for (let i = 0; i < entries.length; i += config.concurrency) {
    const batch = entries.slice(i, i + config.concurrency);
    const batchPromises = batch.map(async (entry, batchIndex) => {
      const globalIndex = i + batchIndex;
      const result = await validateUrl(entry, usesCurl);
      
      // Update statistics
      stats.total++;
      if (result.valid) {
        stats.valid++;
        validEntries.push(entry);
      } else {
        stats.invalid++;
        if (config.checkCors && result.reason.includes('CORS')) {
          stats.corsIssues++;
        }
      }

      // Display result with live counters
      const progress = `[${globalIndex + 1}/${entries.length}]`;
      const counters = `[${GREEN}${stats.valid}✅${RESET}][${RED}${stats.invalid}❌${RESET}][${CYAN}${stats.total}📊${RESET}]`;
      const percentage = ((stats.total / entries.length) * 100).toFixed(1);
      const title = entry.title.substring(0, 40) + (entry.title.length > 40 ? '...' : '');
      
      if (result.valid) {
        console.log(`${progress} ${counters} ${percentage}% ${GREEN}✅${RESET} ${title}`);
        if (config.verbose) {
          console.log(`    ${CYAN}URL:${RESET} ${result.url}`);
          console.log(`    ${BLUE}Status:${RESET} ${result.status} | ${BLUE}Content:${RESET} ${result.contentType}`);
          if (config.checkCors) console.log(`    ${BLUE}CORS:${RESET} ${result.cors || 'none'}`);
          if (config.checkManifest) console.log(`    ${BLUE}Manifest:${RESET} ${result.manifestResult.reason}`);
          if (config.checkSegments) console.log(`    ${BLUE}Segments:${RESET} ${result.segmentResult.reason}`);
        }
      } else {
        console.log(`${progress} ${counters} ${percentage}% ${RED}❌${RESET} ${title}`);
        console.log(`    ${YELLOW}Reason:${RESET} ${result.reason}`);
        if (config.verbose && result.manifestResult) {
          console.log(`    ${YELLOW}Manifest:${RESET} ${result.manifestResult.reason}`);
          if (result.segmentResult) console.log(`    ${YELLOW}Segments:${RESET} ${result.segmentResult.reason}`);
        }
      }

      return result;
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Show batch summary
    const completedCount = i + batch.length;
    const remainingCount = entries.length - completedCount;
    const batchSummary = `${CYAN}Batch Complete:${RESET} ${GREEN}${stats.valid} valid${RESET} | ${RED}${stats.invalid} invalid${RESET} | ${BLUE}${remainingCount} remaining${RESET}`;
    console.log(`${'─'.repeat(80)}`);
    console.log(`${batchSummary}`);
    console.log(`${'─'.repeat(80)}\n`);
  }

  return { validEntries, results };
}

/**
 * Create output M3U file
 */
function createOutputFile(validEntries, outputPath) {
  let content = '#EXTM3U\n';
  
  for (const entry of validEntries) {
    // Reconstruct EXTINF line
    let extinfLine = `#EXTINF:${entry.duration}`;
    
    // Add attributes
    const attrs = Object.entries(entry.attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    if (attrs) {
      extinfLine += ` ${attrs}`;
    }
    
    extinfLine += `,${entry.title}\n`;
    content += extinfLine;
    
    // Add any metadata lines
    if (entry.metadata && entry.metadata.length > 0) {
      content += entry.metadata.join('\n') + '\n';
    }
    
    content += entry.url + '\n';
  }

  fs.writeFileSync(outputPath, content, 'utf8');
}

/**
 * Display final statistics
 */
function displayStats() {
  console.log(`\n📊 ${CYAN}Validation Summary${RESET}`);
  console.log(`${'='.repeat(50)}`);
  console.log(`${GREEN}✅ Valid streams:${RESET} ${stats.valid}`);
  console.log(`${RED}❌ Invalid streams:${RESET} ${stats.invalid}`);
  console.log(`${BLUE}📡 Total tested:${RESET} ${stats.total}`);
  console.log(`${YELLOW}⚠️  CORS issues:${RESET} ${stats.corsIssues}`);
  console.log(`${YELLOW}📄 Manifest issues:${RESET} ${stats.manifestIssues}`);
  console.log(`${YELLOW}🎬 Segment issues:${RESET} ${stats.segmentIssues}`);
  console.log(`${RED}🌐 Network errors:${RESET} ${stats.networkErrors}`);
  console.log(`${RED}⏰ Timeouts:${RESET} ${stats.timeouts}`);
  
  const successRate = stats.total > 0 ? ((stats.valid / stats.total) * 100).toFixed(1) : 0;
  console.log(`${CYAN}📈 Success rate:${RESET} ${successRate}%`);
}

// Main execution
(async () => {
  try {
    console.log(`🎬 ${CYAN}Enhanced Stream Validator${RESET}`);
    console.log(`${'='.repeat(50)}`);
    console.log(`📁 Input: ${config.inputFile}`);
    console.log(`📁 Output: ${config.outputFile}`);
    console.log(`⏱️  Timeout: ${config.timeout}ms`);
    console.log(`🔀 Concurrency: ${config.concurrency}\n`);

    // Read and parse input file
    const content = fs.readFileSync(config.inputFile, 'utf8');
    const entries = parseM3U(content);
    
    if (entries.length === 0) {
      console.error('❌ No valid entries found in M3U file');
      process.exit(1);
    }

    // Check if curl is available
    const usesCurl = await isCurlAvailable();
    if (config.useCurl && !usesCurl) {
      console.log(`${YELLOW}⚠️  Curl not available, falling back to Node.js HTTP${RESET}\n`);
    }

    // Process all entries
    const { validEntries } = await processEntries(entries, usesCurl);

    // Create output file
    createOutputFile(validEntries, config.outputFile);
    
    // Display results
    displayStats();
    console.log(`\n${GREEN}✅ Valid streams saved to: ${config.outputFile}${RESET}`);
    
    if (stats.valid === 0) {
      console.log(`${RED}⚠️  No valid streams found!${RESET}`);
      process.exit(1);
    }

  } catch (error) {
    console.error(`${RED}❌ Error: ${error.message}${RESET}`);
    process.exit(1);
  }
})();
