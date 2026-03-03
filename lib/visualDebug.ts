// Visible debug output for video player and media testing
let debugOutput: string[] = [];

export function addDebugLog(message: string) {
  debugOutput.push(`${new Date().toLocaleTimeString()}: ${message}`);
  
  // Update debug panel if it exists
  const debugPanel = document.getElementById('debug-panel');
  if (debugPanel) {
    // Check if user is at the bottom before updating
    const wasAtBottom = debugPanel.scrollTop + debugPanel.clientHeight >= debugPanel.scrollHeight - 5; // 5px tolerance
    
    debugPanel.innerHTML = debugOutput.slice(-20).map(log => `<div>${log}</div>`).join('');
    
    // Only auto-scroll if user was at the bottom
    if (wasAtBottom) {
      debugPanel.scrollTop = debugPanel.scrollHeight;
    }
  }
}

export function clearDebugLog() {
  debugOutput = [];
  const debugPanel = document.getElementById('debug-panel');
  if (debugPanel) {
    debugPanel.innerHTML = '';
  }
}

export function getDebugLogs() {
  return debugOutput;
}

// Visual test that shows results on screen
export function visualM3UTest() {
  addDebugLog('🔥 Starting visual M3U test...');
  
  fetch('/data/HLS_iptv_index.m3u')
    .then(response => {
      addDebugLog(`📡 Response: ${response.status}`);
      return response.text();
    })
    .then(content => {
      addDebugLog(`📄 Loaded ${content.length} chars, ${content.split('\n').length} lines`);
      
      // Sample first few lines
      const lines = content.split('\n');
      addDebugLog(`📄 First line: ${lines[0]}`);
      addDebugLog(`📄 Second line: ${lines[1]}`);
      addDebugLog(`📄 Third line: ${lines[2]}`);
      
      // Find EXTINF entries
      const extinfCount = (content.match(/#EXTINF:/g) || []).length;
      addDebugLog(`🎯 EXTINF entries found: ${extinfCount}`);
      
      // Test regex
      const EXTINF_REGEX = /#EXTINF:\s*([^,]*),\s*(.*)$/gm;
      const matches = content.match(EXTINF_REGEX);
      addDebugLog(`🔍 Regex matches: ${matches ? matches.length : 0}`);
      
      if (matches && matches.length > 0) {
        addDebugLog(`🔍 First match: ${matches[0]}`);
      }
    })
    .catch(error => {
      addDebugLog(`❌ Error: ${error.message}`);
    });
}

// Video status logging functions
export function addVideoDebugLog(message: string, videoTitle?: string) {
  const videoInfo = videoTitle ? ` [${videoTitle}]` : '';
  addDebugLog(`📺${videoInfo} ${message}`);
}

export function logVideoConnectionStart(videoSrc: string, videoTitle?: string) {
  addVideoDebugLog(`🔗 Connecting to new source: ${videoSrc}`, videoTitle);
}

export function logVideoConnectionSuccess(videoTitle?: string) {
  addVideoDebugLog(`✅ Video connection successful`, videoTitle);
}

export function logVideoConnectionError(error: any, videoTitle?: string) {
  const errorMsg = error?.message || error?.code || error || 'Unknown error';
  addVideoDebugLog(`❌ Video connection failed: ${errorMsg}`, videoTitle);
}

export function logVideoAuthError(videoTitle?: string) {
  addVideoDebugLog(`🔐 Authentication/authorization failed`, videoTitle);
}

export function logVideoLoadStart(videoTitle?: string) {
  addVideoDebugLog(`⏳ Video load started`, videoTitle);
}

export function logVideoCanPlay(videoTitle?: string) {
  addVideoDebugLog(`▶️ Video ready to play`, videoTitle);
}

export function logVideoPlay(videoTitle?: string) {
  addVideoDebugLog(`🎬 Video playback started`, videoTitle);
}

export function logVideoPause(videoTitle?: string) {
  addVideoDebugLog(`⏸️ Video paused`, videoTitle);
}

export function logVideoEnd(videoTitle?: string) {
  addVideoDebugLog(`🏁 Video playback ended`, videoTitle);
}

export function logVideoBuffering(videoTitle?: string) {
  addVideoDebugLog(`⏳ Video buffering...`, videoTitle);
}

export function logVideoQualityChange(quality: string, videoTitle?: string) {
  addVideoDebugLog(`📊 Quality changed to: ${quality}`, videoTitle);
}

// DASH parsing debug functions
export function logDashParsingStart(manifestUrl: string) {
  addDebugLog(`🎬 Starting DASH manifest parsing for: ${manifestUrl}`);
}

export function logDashParsingSuccess(info: any) {
  addDebugLog(`✅ DASH parsing successful: ${info.videoQualities?.length || 0} video qualities, ${info.audioTracks?.length || 0} audio tracks`);
}

export function logDashParsingError(error: string, manifestUrl: string) {
  addDebugLog(`❌ DASH parsing failed for ${manifestUrl}: ${error}`);
}

export function logDashManifestInfo(info: any) {
  const duration = info.totalDuration ? `${Math.round(info.totalDuration)}s` : (info.isLive ? 'LIVE' : 'Unknown');
  addDebugLog(`📄 DASH Info: ${duration}, ${info.videoQualities?.length || 0} qualities, ${info.isLive ? 'Live' : 'VOD'}`);
  
  // Log video qualities
  if (info.videoQualities && info.videoQualities.length > 0) {
    info.videoQualities.forEach((q: any, i: number) => {
      if (i < 3) { // Only log first 3 to avoid spam
        addDebugLog(`📺 Quality ${i + 1}: ${q.width}x${q.height} @ ${Math.round(q.bitrate / 1000)}kbps (${q.codecs})`);
      }
    });
  }
  
  // Log audio tracks
  if (info.audioTracks && info.audioTracks.length > 0) {
    info.audioTracks.forEach((a: any, i: number) => {
      if (i < 2) { // Only log first 2 to avoid spam
        addDebugLog(`🔊 Audio ${i + 1}: ${a.language} @ ${Math.round(a.bitrate / 1000)}kbps (${a.codecs})`);
      }
    });
  }
}
