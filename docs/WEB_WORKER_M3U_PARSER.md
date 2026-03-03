# M3U Parser Web Worker Implementation

## Overview

This implementation offloads M3U playlist parsing to a Web Worker, preventing UI blocking during the processing of large IPTV playlists (22,000+ channels).

## Architecture

### Components

1. **Web Worker** (`public/workers/m3uParserWorker.js`)
   - Runs M3U parsing in background thread
   - Supports chunked processing with progress updates
   - Handles both simple and chunked parsing modes

2. **Worker Manager** (`lib/m3uParserWorker.ts`)
   - TypeScript interface for web worker
   - Provides Promise-based API
   - Handles worker lifecycle and error management
   - Includes fallback detection for unsupported environments

3. **Performance Testing** (`lib/testWorkerPerformance.ts`)
   - Benchmarks web worker vs main thread performance
   - Generates test M3U content for validation
   - Provides detailed performance metrics

## Usage

### Basic Usage

```typescript
import { getM3UParserWorker } from '@/lib/m3uParserWorker';

const workerManager = getM3UParserWorker();

const result = await workerManager.parseM3UChunked(m3uContent, {
  chunkSize: 100,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.progress}%`);
  },
  onStart: () => {
    console.log('Parsing started...');
  }
});

console.log(`Parsed ${result.totalCount} videos in ${result.processingTime}ms`);
```

### With Fallback

```typescript
import { M3UParserWorkerManager } from '@/lib/m3uParserWorker';
import { parseM3UChunked, convertM3UToVideos } from '@/lib/m3uParser';

if (M3UParserWorkerManager.isWebWorkerSupported()) {
  // Use web worker
  const result = await workerManager.parseM3UChunked(content);
  setVideos(result.videos);
} else {
  // Fallback to main thread
  const parser = parseM3UChunked(content, 50);
  // ... process chunks manually
}
```

## Performance Benefits

### Large Dataset Handling
- **22,000+ IPTV channels**: No UI blocking
- **Progressive loading**: Real-time progress updates
- **Memory efficient**: Chunked processing prevents memory spikes

### User Experience
- **Responsive UI**: Main thread remains free for user interactions
- **Progress feedback**: Users see parsing progress in real-time
- **Graceful fallback**: Works in environments without Web Worker support

## Technical Details

### Message Types

- `PARSE_M3U_CHUNKED`: Parse with progress updates
- `PARSE_M3U_SIMPLE`: Simple one-shot parsing
- `PARSE_STARTED`: Worker started processing
- `PARSE_PROGRESS`: Progress update with percentage
- `PARSE_COMPLETE`: Parsing finished with results
- `ERROR`: Error occurred during parsing

### Data Flow

1. **Main Thread** → Worker: Send M3U content
2. **Worker**: Parse content in chunks
3. **Worker** → Main Thread: Progress updates
4. **Worker** → Main Thread: Final results
5. **Main Thread**: Update UI with parsed videos

### Error Handling

- **Worker initialization timeout**: 5-second timeout
- **Parsing errors**: Caught and returned as error messages
- **Unsupported environments**: Automatic fallback to main thread
- **Worker cleanup**: Automatic termination on component unmount

## Performance Comparison

Expected performance characteristics:

- **Large files (>1MB)**: Web Worker provides UI responsiveness
- **Small files (<100KB)**: Main thread may be faster due to overhead
- **Memory usage**: Lower peak usage due to chunked processing
- **CPU utilization**: Better distribution across threads

## Integration Points

### Media Demo Page

```typescript
// Integrated in app/media-demo/page.tsx
const result = await workerManager.parseM3UChunked(content, {
  chunkSize: 50,
  onProgress: (progress) => {
    setLoadingProgress(Math.round(progress.progress));
  }
});

allSources.push(...result.videos);
```

### Virtual Scrolling

Combined with `VirtualScroll` component for optimal performance:

```typescript
<VirtualScroll
  items={videos}
  itemHeight={150}
  containerHeight={400}
  renderItem={(video) => <VideoCard video={video} />}
/>
```

## Browser Support

- **Supported**: Modern browsers with Web Worker support
- **Fallback**: Automatic graceful degradation to main thread
- **Detection**: `M3UParserWorkerManager.isWebWorkerSupported()`

## Cleanup

```typescript
import { terminateM3UParserWorker } from '@/lib/m3uParserWorker';

// Clean up on component unmount
useEffect(() => {
  return () => terminateM3UParserWorker();
}, []);
```

## Testing

Run the performance test utility:

```typescript
import { testWebWorkerPerformance, generateTestM3U } from '@/lib/testWorkerPerformance';

const testContent = generateTestM3U(1000); // Generate 1000 test channels
const results = await testWebWorkerPerformance(testContent);
console.log('Performance results:', results);
```

This implementation ensures smooth user experience when handling large IPTV playlists while maintaining compatibility across different browser environments.
