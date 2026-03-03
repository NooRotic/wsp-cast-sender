// M3U Parser Web Worker
// This worker handles M3U playlist parsing in a background thread

// Parse EXTINF line function
function parseExtinf(line) {
  const entry = {
    metadata: {}
  };

  // Extract duration (first number after EXTINF:)
  const durationMatch = line.match(/#EXTINF:(-?\d+(?:\.\d+)?)/);
  if (durationMatch) {
    const duration = parseFloat(durationMatch[1]);
    if (duration > 0) {
      entry.duration = duration;
    }
  }

  // Extract attributes
  const attributes = extractAttributes(line);
  entry.tvgId = attributes['tvg-id'] || undefined;
  entry.logo = attributes['tvg-logo'] || undefined;
  entry.group = attributes['group-title'] || 'General';

  // Store all attributes in metadata
  entry.metadata = attributes;

  // Extract title (everything after the last comma)
  const titleMatch = line.match(/,([^,]+)$/);
  if (titleMatch) {
    entry.title = titleMatch[1].trim();
  }

  return entry;
}

// Parse VLC option line
function parseVlcOption(line) {
  const match = line.match(/#EXTVLCOPT:(.+?)=(.+)/);
  if (match) {
    return {
      key: match[1].trim(),
      value: match[2].trim()
    };
  }
  return { key: '', value: '' };
}

// Extract attributes from EXTINF line
function extractAttributes(line) {
  const attributes = {};
  
  // Match attribute="value" or attribute=value patterns
  const attributeRegex = /(\w+(?:-\w+)*)=(?:"([^"]*)"|([^\s]+))/g;
  let match;
  
  while ((match = attributeRegex.exec(line)) !== null) {
    const key = match[1];
    const value = match[2] || match[3] || '';
    attributes[key] = value;
  }
  
  return attributes;
}

// Import the parsing logic (we'll need to adapt it for the worker context)
const parseM3UChunked = function* (content, chunkSize = 100) {
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  const entries = [];
  let currentEntry = {};
  let entryId = 1;
  let processed = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    processed++;
    
    if (line.startsWith('#EXTM3U')) {
      // Playlist header - skip
      continue;
    }
    
    if (line.startsWith('#EXTINF:')) {
      // Parse EXTINF line using the same logic as main thread
      currentEntry = parseExtinf(line);
      currentEntry.id = `m3u-${entryId++}`;
    } else if (line.startsWith('#EXTVLCOPT:')) {
      // Parse VLC options
      const option = parseVlcOption(line);
      if (option.key === 'http-user-agent') {
        currentEntry.userAgent = option.value;
      } else if (option.key === 'http-referrer') {
        currentEntry.referrer = option.value;
      }
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      // Stream URL - complete the entry
      currentEntry.url = line;
      
      if (currentEntry.title && currentEntry.url) {
        entries.push({...currentEntry});
      }
      
      currentEntry = {};
      
      // Yield progress in chunks
      if (entries.length % chunkSize === 0) {
        yield {
          entries: entries.slice(),
          progress: Math.min((i / lines.length) * 100, 100),
          isComplete: false,
          totalProcessed: processed
        };
      }
    }
  }
  
  // Final yield with complete results
  yield {
    entries: entries,
    progress: 100,
    isComplete: true,
    totalProcessed: processed
  };
};

const convertM3UToVideos = (m3uEntries) => {
  return m3uEntries.map((entry, index) => ({
    id: 1000000 + index, // High ID range to avoid conflicts
    title: entry.title,
    src: entry.url,
    poster: entry.logo,
    duration: entry.duration ? `${Math.floor(entry.duration / 60)}:${(entry.duration % 60).toString().padStart(2, '0')}` : 'LIVE',
    mimetype: entry.url.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
    // Enhanced metadata for categorization
    name: entry.title,
    uri: entry.url,
    features: ['live'], // Most M3U entries are live streams
    // M3U specific data
    m3uData: {
      tvgId: entry.tvgId,
      group: entry.group,
      logo: entry.logo,
      userAgent: entry.userAgent,
      referrer: entry.referrer,
      metadata: entry.metadata
    }
  }));
};

// Message handler for the worker
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  try {
    switch (type) {
      case 'PARSE_M3U_CHUNKED':
        const { content, chunkSize = 100 } = data;
        
        // Start parsing
        self.postMessage({
          type: 'PARSE_STARTED',
          message: 'Starting M3U parsing...'
        });
        
        const parser = parseM3UChunked(content, chunkSize);
        let result = parser.next();
        
        // Process chunks
        const processChunk = () => {
          if (!result.done) {
            const chunkData = result.value;
            
            // Send progress update
            self.postMessage({
              type: 'PARSE_PROGRESS',
              data: {
                progress: chunkData.progress,
                totalProcessed: chunkData.totalProcessed,
                isComplete: chunkData.isComplete
              }
            });
            
            // If parsing is complete, convert and send final result
            if (chunkData.isComplete) {
              const videos = convertM3UToVideos(chunkData.entries);
              
              self.postMessage({
                type: 'PARSE_COMPLETE',
                data: {
                  videos: videos,
                  totalCount: videos.length,
                  processingTime: performance.now() - startTime
                }
              });
            } else {
              // Continue with next chunk
              result = parser.next();
              // Use setTimeout to yield control back to the event loop
              setTimeout(processChunk, 0);
            }
          }
        };
        
        const startTime = performance.now();
        processChunk();
        break;
        
      case 'PARSE_M3U_SIMPLE':
        // Simple non-chunked parsing for smaller files
        const simpleContent = data.content;
        const lines = simpleContent.split('\n');
        const entries = [];
        let currentEntry = null;
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine.startsWith('#EXTINF:')) {
            const match = trimmedLine.match(/#EXTINF:(-?\d+(?:\.\d+)?),(.*)$/);
            if (match) {
              const duration = parseFloat(match[1]);
              const titlePart = match[2];
              
              let group = null;
              let title = titlePart;
              
              const groupMatch = titlePart.match(/group-title="([^"]*)"(.*)/);
              if (groupMatch) {
                group = groupMatch[1];
                title = groupMatch[2].replace(/^,?\s*/, '');
              }
              
              currentEntry = {
                duration: duration > 0 ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : null,
                title: title || 'Untitled',
                group: group || 'Uncategorized'
              };
            }
          } else if (trimmedLine && !trimmedLine.startsWith('#') && currentEntry) {
            entries.push({
              ...currentEntry,
              url: trimmedLine,
              logo: null
            });
            currentEntry = null;
          }
        }
        
        const videos = convertM3UToVideos(entries);
        
        self.postMessage({
          type: 'PARSE_COMPLETE',
          data: {
            videos: videos,
            totalCount: videos.length,
            processingTime: performance.now() - data.startTime
          }
        });
        break;
        
      default:
        self.postMessage({
          type: 'ERROR',
          message: `Unknown message type: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      message: error.message,
      stack: error.stack
    });
  }
};

// Send ready message
self.postMessage({
  type: 'WORKER_READY',
  message: 'M3U Parser Worker is ready'
});
