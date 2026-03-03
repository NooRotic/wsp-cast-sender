// Debug data export utilities
export interface DebugExportData {
  timestamp: number;
  session: {
    duration: number;
    url: string;
    userAgent: string;
  };
  video: any;
  performance: any;
  browser: any;
  network: any;
  events: any[];
  systemData: any;
}

export function exportDebugData(debugData: any, systemData: any, events: any[]): DebugExportData {
  return {
    timestamp: Date.now(),
    session: {
      duration: performance.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    },
    video: debugData?.video,
    performance: debugData?.performance,
    browser: debugData?.browser,
    network: debugData?.network,
    events: events,
    systemData: systemData,
  };
}

export function downloadDebugData(data: DebugExportData, filename?: string) {
  const jsonData = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `debug-data-${new Date().toISOString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function formatDebugDataForConsole(data: DebugExportData): string {
  const sections = [
    '=== VIDEO DEBUG REPORT ===',
    `Timestamp: ${new Date(data.timestamp).toISOString()}`,
    `Session Duration: ${(data.session.duration / 1000).toFixed(2)}s`,
    `URL: ${data.session.url}`,
    '',
    '--- Video Information ---',
    `Resolution: ${data.video?.videoWidth}x${data.video?.videoHeight}`,
    `Duration: ${data.video?.duration?.toFixed(2)}s`,
    `Current Time: ${data.video?.currentTime?.toFixed(2)}s`,
    `Ready State: ${data.video?.readyState}`,
    `Network State: ${data.video?.networkState}`,
    `Frames Decoded: ${data.video?.decodedFrameCount || 'N/A'}`,
    `Frames Dropped: ${data.video?.droppedFrameCount || 'N/A'}`,
    '',
    '--- Performance ---',
    `Memory Usage: ${data.performance?.memory?.usagePercentage?.toFixed(2)}%`,
    `Used Heap: ${data.performance?.memory?.usedJSHeapSize ? (data.performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A'}MB`,
    `Frame Rate: ${data.performance?.frameRate?.current || 'N/A'} FPS`,
    `Event Loop Lag: ${data.performance?.eventLoopLag?.toFixed(2) || 'N/A'}ms`,
    '',
    '--- Network ---',
    `Connection Type: ${data.network?.effectiveType || 'Unknown'}`,
    `Downlink: ${data.network?.downlink || 'N/A'} Mbps`,
    `RTT: ${data.network?.rtt || 'N/A'}ms`,
    `Data Saver: ${data.network?.saveData ? 'ON' : 'OFF'}`,
    '',
    '--- Browser Capabilities ---',
    `WebRTC: ${data.browser?.features?.webRTC ? 'Supported' : 'Not Supported'}`,
    `WebAssembly: ${data.browser?.features?.webAssembly ? 'Supported' : 'Not Supported'}`,
    `Service Worker: ${data.browser?.features?.serviceWorker ? 'Supported' : 'Not Supported'}`,
    `Hardware Concurrency: ${data.browser?.hardwareConcurrency || 'Unknown'}`,
    '',
    '--- Recent Events ---',
    ...data.events.slice(0, 10).map(event => 
      `[${new Date(event.timestamp).toLocaleTimeString()}] ${event.source.toUpperCase()}: ${event.type}`
    ),
    '',
    '=== END REPORT ==='
  ];
  
  return sections.join('\n');
}

export function shareDebugData(data: DebugExportData): Promise<boolean> {
  if ('share' in navigator) {
    const reportText = formatDebugDataForConsole(data);
    return navigator.share({
      title: 'Video Debug Report',
      text: reportText,
    }).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}

export function copyDebugDataToClipboard(data: DebugExportData): Promise<boolean> {
  const reportText = formatDebugDataForConsole(data);
  
  if ('clipboard' in navigator) {
    return navigator.clipboard.writeText(reportText)
      .then(() => true)
      .catch(() => false);
  }
  
  // Fallback for older browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = reportText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.resolve(false);
  }
}

// Advanced analytics functions
export function analyzePerformanceIssues(data: DebugExportData): string[] {
  const issues: string[] = [];
  
  // Memory issues
  if (data.performance?.memory?.usagePercentage > 80) {
    issues.push('High memory usage detected (>80%)');
  }
  
  // Frame rate issues
  if (data.performance?.frameRate?.current < 30) {
    issues.push('Low frame rate detected (<30 FPS)');
  }
  
  // Event loop lag
  if (data.performance?.eventLoopLag > 16) {
    issues.push('High event loop lag detected (>16ms)');
  }
  
  // Video frame drops
  if (data.video?.droppedFrameCount && data.video?.totalVideoFrames) {
    const dropRate = (data.video.droppedFrameCount / data.video.totalVideoFrames) * 100;
    if (dropRate > 1) {
      issues.push(`High video frame drop rate (${dropRate.toFixed(2)}%)`);
    }
  }
  
  // Network issues
  if (data.network?.rtt > 100) {
    issues.push('High network latency detected (>100ms)');
  }
  
  if (data.network?.effectiveType === 'slow-2g' || data.network?.effectiveType === '2g') {
    issues.push('Slow network connection detected');
  }
  
  // Browser compatibility issues
  if (!data.browser?.features?.webAssembly) {
    issues.push('WebAssembly not supported - performance may be limited');
  }
  
  if (!data.browser?.features?.serviceWorker) {
    issues.push('Service Workers not supported - offline functionality limited');
  }
  
  return issues;
}

export function generatePerformanceScore(data: DebugExportData): number {
  let score = 100;
  
  // Memory usage penalty
  const memUsage = data.performance?.memory?.usagePercentage || 0;
  if (memUsage > 90) score -= 30;
  else if (memUsage > 70) score -= 20;
  else if (memUsage > 50) score -= 10;
  
  // Frame rate penalty
  const fps = data.performance?.frameRate?.current || 60;
  if (fps < 30) score -= 25;
  else if (fps < 45) score -= 15;
  else if (fps < 55) score -= 5;
  
  // Network penalty
  const rtt = data.network?.rtt || 0;
  if (rtt > 200) score -= 20;
  else if (rtt > 100) score -= 10;
  else if (rtt > 50) score -= 5;
  
  // Video quality penalty
  if (data.video?.droppedFrameCount && data.video?.totalVideoFrames) {
    const dropRate = (data.video.droppedFrameCount / data.video.totalVideoFrames) * 100;
    if (dropRate > 5) score -= 20;
    else if (dropRate > 2) score -= 10;
    else if (dropRate > 1) score -= 5;
  }
  
  return Math.max(0, Math.min(100, score));
}
