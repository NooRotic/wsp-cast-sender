/**
 * M3U Playlist Parser with Chunked Processing Support
 * Parses M3U/M3U8 playlist files and extracts channel/video information
 */

export interface M3UEntry {
  id: string;
  title: string;
  url: string;
  logo?: string;
  group?: string;
  tvgId?: string;
  duration?: number;
  userAgent?: string;
  referrer?: string;
  metadata: Record<string, string>;
}

export interface ParsedM3U {
  entries: M3UEntry[];
  totalCount: number;
  groups: string[];
}

export interface ChunkedParseResult {
  entries: M3UEntry[];
  groups: Set<string>;
  hasMore: boolean;
  processed: number;
  total: number;
}

/**
 * Parse M3U playlist content in chunks for better performance
 */
export function* parseM3UChunked(content: string, chunkSize: number = 100): Generator<ChunkedParseResult> {
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  const groups = new Set<string>();
  let currentEntry: Partial<M3UEntry> = {};
  let entryId = 1;
  let processedLines = 0;
  let chunk: M3UEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    processedLines++;

    if (line.startsWith('#EXTM3U')) {
      // Playlist header - skip
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      // Parse EXTINF line
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
        const entry = currentEntry as M3UEntry;
        chunk.push(entry);
        
        if (entry.group) {
          groups.add(entry.group);
        }

        // Yield chunk when it reaches the specified size
        if (chunk.length >= chunkSize) {
          yield {
            entries: [...chunk],
            groups: new Set(groups),
            hasMore: i < lines.length - 1,
            processed: processedLines,
            total: lines.length
          };
          chunk = [];
        }
      }
      
      currentEntry = {};
    }
  }

  // Yield remaining entries
  if (chunk.length > 0) {
    yield {
      entries: chunk,
      groups,
      hasMore: false,
      processed: processedLines,
      total: lines.length
    };
  }
}

/**
 * Parse M3U playlist content (legacy method for backward compatibility)
 */
export function parseM3U(content: string): ParsedM3U {
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  const entries: M3UEntry[] = [];
  const groups = new Set<string>();
  let currentEntry: Partial<M3UEntry> = {};
  let entryId = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTM3U')) {
      // Playlist header - skip
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      // Parse EXTINF line
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
        const entry = currentEntry as M3UEntry;
        entries.push(entry);
        
        if (entry.group) {
          groups.add(entry.group);
        }
      }
      
      currentEntry = {};
    }
  }

  return {
    entries,
    totalCount: entries.length,
    groups: Array.from(groups).sort()
  };
}

/**
 * Parse EXTINF line to extract metadata
 */
function parseExtinf(line: string): Partial<M3UEntry> {
  const entry: Partial<M3UEntry> = {
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

/**
 * Parse VLC option line
 */
function parseVlcOption(line: string): { key: string; value: string } {
  const match = line.match(/#EXTVLCOPT:(.+?)=(.+)/);
  if (match) {
    return {
      key: match[1].trim(),
      value: match[2].trim()
    };
  }
  return { key: '', value: '' };
}

/**
 * Extract attributes from EXTINF line
 */
function extractAttributes(line: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  
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

/**
 * Convert M3U entries to Video interface format
 */
export function convertM3UToVideos(entries: M3UEntry[]): any[] {
  return entries.map((entry, index) => ({
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
}

/**
 * Filter M3U entries by group
 */
export function filterByGroup(entries: M3UEntry[], group: string): M3UEntry[] {
  return entries.filter(entry => entry.group === group);
}

/**
 * Search M3U entries by title
 */
export function searchEntries(entries: M3UEntry[], query: string): M3UEntry[] {
  const searchTerm = query.toLowerCase();
  return entries.filter(entry => 
    entry.title.toLowerCase().includes(searchTerm) ||
    (entry.group && entry.group.toLowerCase().includes(searchTerm)) ||
    (entry.tvgId && entry.tvgId.toLowerCase().includes(searchTerm))
  );
}
