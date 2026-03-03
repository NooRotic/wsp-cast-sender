// System Monitor WebWorker for Real-time Debug Data Collection
// This worker runs in the background to continuously collect system metrics

let isCollecting = false;
let collectionInterval = 1000;
let intervalId = null;

// Performance observer for monitoring
let performanceObserver = null;

// Store historical data for trending
const historyBuffer = {
  memory: [],
  performance: [],
  network: [],
  maxSize: 100 // Keep last 100 samples
};

// Helper function to add data to history buffer
function addToHistory(type, data) {
  if (!historyBuffer[type]) return;
  
  historyBuffer[type].unshift({
    timestamp: Date.now(),
    data: data
  });
  
  // Keep only the latest samples
  if (historyBuffer[type].length > historyBuffer.maxSize) {
    historyBuffer[type] = historyBuffer[type].slice(0, historyBuffer.maxSize);
  }
}

// Advanced memory analysis
function getAdvancedMemoryInfo() {
  const memoryInfo = {
    basic: performance.memory ? {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
    } : null,
    gc: {
      // Estimate garbage collection pressure
      lastGCTime: null,
      gcPressure: 0
    },
    trends: {
      memoryGrowthRate: 0,
      averageUsage: 0
    }
  };

  // Calculate trends from history
  if (historyBuffer.memory.length > 1) {
    const recent = historyBuffer.memory[0]?.data?.basic?.usedJSHeapSize || 0;
    const older = historyBuffer.memory[Math.min(10, historyBuffer.memory.length - 1)]?.data?.basic?.usedJSHeapSize || 0;
    const timeDiff = historyBuffer.memory[0]?.timestamp - historyBuffer.memory[Math.min(10, historyBuffer.memory.length - 1)]?.timestamp;
    
    if (timeDiff > 0) {
      memoryInfo.trends.memoryGrowthRate = (recent - older) / timeDiff * 1000; // bytes per second
    }

    // Calculate average usage
    const validSamples = historyBuffer.memory.filter(sample => sample.data?.basic?.usedJSHeapSize).slice(0, 20);
    if (validSamples.length > 0) {
      const sum = validSamples.reduce((acc, sample) => acc + sample.data.basic.usedJSHeapSize, 0);
      memoryInfo.trends.averageUsage = sum / validSamples.length;
    }
  }

  return memoryInfo;
}

// Advanced performance metrics
function getAdvancedPerformanceInfo() {
  const perfInfo = {
    timing: performance.timing,
    navigation: performance.navigation,
    entries: performance.getEntries().slice(-10), // Last 10 entries
    marks: performance.getEntriesByType('mark').slice(-5),
    measures: performance.getEntriesByType('measure').slice(-5),
    resources: performance.getEntriesByType('resource').slice(-10),
    frameRate: {
      estimated: 60, // Will be calculated if available
      drops: 0
    },
    eventLoopLag: 0 // Estimated event loop delay
  };

  // Estimate frame rate using animation frame timing
  if (self.requestAnimationFrame) {
    let frameCount = 0;
    let lastTime = performance.now();
    
    function countFrames() {
      frameCount++;
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= 1000) { // Update every second
        perfInfo.frameRate.estimated = Math.round((frameCount * 1000) / deltaTime);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      if (isCollecting) {
        requestAnimationFrame(countFrames);
      }
    }
    
    if (isCollecting) {
      requestAnimationFrame(countFrames);
    }
  }

  // Estimate event loop lag
  const start = performance.now();
  setTimeout(() => {
    const lag = performance.now() - start;
    perfInfo.eventLoopLag = Math.max(0, lag - 1); // Subtract expected 1ms minimum
  }, 0);

  return perfInfo;
}

// Advanced network information
function getAdvancedNetworkInfo() {
  const networkInfo = {
    connection: null,
    requests: {
      active: 0,
      failed: 0,
      total: 0,
      averageLatency: 0
    },
    bandwidth: {
      estimated: 0,
      trend: 'stable'
    }
  };

  // Get network connection info
  if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    networkInfo.connection = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      downlinkMax: connection.downlinkMax,
      rtt: connection.rtt,
      saveData: connection.saveData,
      type: connection.type
    };
  }

  // Analyze resource timing for network performance
  const resourceEntries = performance.getEntriesByType('resource');
  if (resourceEntries.length > 0) {
    const recentEntries = resourceEntries.slice(-20); // Last 20 requests
    networkInfo.requests.total = resourceEntries.length;
    
    // Calculate average latency
    const validLatencies = recentEntries
      .filter(entry => entry.responseEnd > entry.requestStart)
      .map(entry => entry.responseEnd - entry.requestStart);
    
    if (validLatencies.length > 0) {
      networkInfo.requests.averageLatency = validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length;
    }

    // Count failed requests (status codes would need to be tracked separately)
    const failedEntries = recentEntries.filter(entry => 
      entry.transferSize === 0 && entry.decodedBodySize === 0
    );
    networkInfo.requests.failed = failedEntries.length;
  }

  return networkInfo;
}

// Browser/Environment advanced info
function getAdvancedBrowserInfo() {
  const browserInfo = {
    webgl: null,
    webRTC: false,
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in self,
    webAssembly: 'WebAssembly' in self,
    sharedArrayBuffer: 'SharedArrayBuffer' in self,
    bigInt: typeof BigInt !== 'undefined',
    proximity: 'DeviceProximityEvent' in self,
    deviceMemory: navigator.deviceMemory || 'unknown',
    storage: {},
    permissions: {},
    sensors: {
      accelerometer: 'Accelerometer' in self,
      gyroscope: 'Gyroscope' in self,
      magnetometer: 'Magnetometer' in self,
      ambientLight: 'AmbientLightSensor' in self
    }
  };

  // WebGL capabilities
  try {
    const canvas = new OffscreenCanvas(1, 1);
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      browserInfo.webgl = {
        version: gl.getParameter(gl.VERSION),
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        extensions: gl.getSupportedExtensions()
      };
    }
  } catch (e) {
    browserInfo.webgl = { error: e.message };
  }

  // WebRTC support
  browserInfo.webRTC = !!(
    self.RTCPeerConnection ||
    self.mozRTCPeerConnection ||
    self.webkitRTCPeerConnection
  );

  // Storage estimation (if available)
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then(estimate => {
      browserInfo.storage = {
        quota: estimate.quota,
        usage: estimate.usage,
        usagePercentage: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
      };
    }).catch(e => {
      browserInfo.storage = { error: e.message };
    });
  }

  return browserInfo;
}

// Main collection function
function collectSystemData() {
  if (!isCollecting) return;

  const systemData = {
    timestamp: Date.now(),
    memory: getAdvancedMemoryInfo(),
    performance: getAdvancedPerformanceInfo(),
    network: getAdvancedNetworkInfo(),
    browser: getAdvancedBrowserInfo(),
    system: {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints
    }
  };

  // Add to history buffers
  addToHistory('memory', systemData.memory);
  addToHistory('performance', systemData.performance);
  addToHistory('network', systemData.network);

  // Send data back to main thread
  self.postMessage({
    type: 'SYSTEM_DATA',
    data: systemData,
    history: {
      memory: historyBuffer.memory.slice(0, 20), // Send recent history
      performance: historyBuffer.performance.slice(0, 20),
      network: historyBuffer.network.slice(0, 20)
    }
  });
}

// Set up performance observer
function setupPerformanceObserver() {
  if ('PerformanceObserver' in self && !performanceObserver) {
    try {
      performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        self.postMessage({
          type: 'PERFORMANCE_ENTRIES',
          data: entries
        });
      });

      // Observe different types of performance entries
      const supportedTypes = ['measure', 'mark', 'resource', 'navigation'];
      supportedTypes.forEach(type => {
        try {
          performanceObserver.observe({ entryTypes: [type] });
        } catch (e) {
          // Type not supported, ignore
        }
      });
    } catch (e) {
      console.warn('Failed to set up PerformanceObserver:', e);
    }
  }
}

// Message handler
self.addEventListener('message', function(e) {
  const { type, payload } = e.data;

  switch (type) {
    case 'START_COLLECTION':
      isCollecting = true;
      collectionInterval = payload?.interval || 1000;
      
      // Clear existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      // Start collection
      intervalId = setInterval(collectSystemData, collectionInterval);
      setupPerformanceObserver();
      
      // Send immediate data
      collectSystemData();
      
      self.postMessage({
        type: 'COLLECTION_STARTED',
        data: { interval: collectionInterval }
      });
      break;

    case 'STOP_COLLECTION':
      isCollecting = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (performanceObserver) {
        performanceObserver.disconnect();
        performanceObserver = null;
      }
      
      self.postMessage({
        type: 'COLLECTION_STOPPED'
      });
      break;

    case 'UPDATE_INTERVAL':
      collectionInterval = payload?.interval || 1000;
      if (isCollecting && intervalId) {
        clearInterval(intervalId);
        intervalId = setInterval(collectSystemData, collectionInterval);
      }
      break;

    case 'GET_HISTORY':
      self.postMessage({
        type: 'HISTORY_DATA',
        data: historyBuffer
      });
      break;

    case 'CLEAR_HISTORY':
      historyBuffer.memory = [];
      historyBuffer.performance = [];
      historyBuffer.network = [];
      break;

    default:
      console.warn('Unknown message type:', type);
  }
});

// Initialize
self.postMessage({
  type: 'WORKER_READY'
});
