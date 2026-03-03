'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Terminal, Activity, Monitor, Cpu, MemoryStick, Network, Video, Clock, Gauge, AlertTriangle, CheckCircle, XCircle, Loader, Wifi, Database, HardDrive, TrendingUp, Zap, Globe, Shield, Eye, Download, Upload, Copy, Share, BarChart3, AlertCircle, Move, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { 
  exportDebugData, downloadDebugData, copyDebugDataToClipboard, 
  shareDebugData, formatDebugDataForConsole, analyzePerformanceIssues,
  generatePerformanceScore, type DebugExportData 
} from '@/lib/debugUtils';

interface DebugData {
  video: {
    currentTime: number;
    duration: number;
    buffered: TimeRanges | null;
    seekable: TimeRanges | null;
    readyState: number;
    networkState: number;
    videoWidth: number;
    videoHeight: number;
    playbackRate: number;
    volume: number;
    muted: boolean;
    paused: boolean;
    ended: boolean;
    error: MediaError | null;
    src: string;
    crossOrigin: string | null;
    preload: string;
    autoplay: boolean;
    loop: boolean;
    controls: boolean;
    // Enhanced video metrics
    decodedFrameCount?: number;
    droppedFrameCount?: number;
    corruptedVideoFrameCount?: number;
    creationTime?: number;
    totalVideoFrames?: number;
    webkitDecodedFrameCount?: number;
    webkitDroppedFrameCount?: number;
  };
  performance: {
    memory: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
      usagePercentage?: number;
      memoryGrowthRate?: number;
      averageUsage?: number;
      gcPressure?: number;
    };
    timing: PerformanceTiming;
    navigation: PerformanceNavigation;
    entries: PerformanceEntry[];
    frameRate?: {
      current: number;
      average: number;
      drops: number;
    };
    eventLoopLag?: number;
    renderingMetrics?: {
      fps: number;
      frameTime: number;
      jank: number;
    };
  };
  browser: {
    userAgent: string;
    platform: string;
    language: string;
    cookieEnabled: boolean;
    onLine: boolean;
    doNotTrack: string | null;
    hardwareConcurrency: number;
    maxTouchPoints: number;
    permissions: any;
    connection: any;
    // Enhanced browser capabilities
    webgl?: {
      version: string;
      vendor: string;
      renderer: string;
      maxTextureSize: number;
      extensions: string[];
    };
    storage?: {
      quota: number;
      usage: number;
      usagePercentage: number;
    };
    sensors?: {
      accelerometer: boolean;
      gyroscope: boolean;
      magnetometer: boolean;
      ambientLight: boolean;
    };
    features?: {
      webRTC: boolean;
      serviceWorker: boolean;
      indexedDB: boolean;
      webAssembly: boolean;
      sharedArrayBuffer: boolean;
      bigInt: boolean;
    };
  };
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
    orientation: string;
  };
  media: {
    codecSupport: {
      h264: boolean;
      h265: boolean;
      vp8: boolean;
      vp9: boolean;
      av1: boolean;
      aac: boolean;
      mp3: boolean;
      opus: boolean;
    };
    mediaCapabilities: any;
    mediaDevices: MediaDeviceInfo[];
  };
  network: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
  cast: {
    isConnected: boolean;
    deviceName: string | null;
    receiverAppId: string | null;
    sessionId: string | null;
    volume: number | null;
    isMuted: boolean | null;
  };
  events: Array<{
    timestamp: number;
    type: string;
    data: any;
    source: 'video' | 'cast' | 'network' | 'performance';
  }>;
}

interface DebugOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  videoElement: HTMLVideoElement | null;
  playerRef: any;
  castContext?: any;
  currentVideo?: any;
}

const DebugOverlay: React.FC<DebugOverlayProps> = ({
  isOpen,
  onClose,
  videoElement,
  playerRef,
  castContext,
  currentVideo
}) => {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [systemData, setSystemData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'performance' | 'browser' | 'media' | 'network' | 'cast' | 'events' | 'system'>('video');
  const [isCollecting, setIsCollecting] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(1000);
  const [eventFilter, setEventFilter] = useState<'all' | 'video' | 'cast' | 'network' | 'performance'>('all');
  const [workerSupported, setWorkerSupported] = useState(false);
  const [workerStatus, setWorkerStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'copied' | 'shared'>('idle');
  const [performanceScore, setPerformanceScore] = useState<number>(100);
  const [performanceIssues, setPerformanceIssues] = useState<string[]>([]);
  
  // Drag and resize state
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 900, height: 600 });
  const [isCompact, setIsCompact] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  
  const eventsRef = useRef<Array<any>>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const frameStatsRef = useRef<{ frames: number; startTime: number; fps: number }>({
    frames: 0,
    startTime: performance.now(),
    fps: 0
  });

  const addEvent = useCallback((type: string, data: any, source: DebugData['events'][0]['source']) => {
    const event = {
      timestamp: Date.now(),
      type,
      data,
      source
    };
    eventsRef.current.unshift(event);
    // Keep only last 100 events for performance
    if (eventsRef.current.length > 100) {
      eventsRef.current = eventsRef.current.slice(0, 100);
    }
  }, []);

  // Initialize WebWorker for advanced system monitoring
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      setWorkerSupported(true);
      try {
        workerRef.current = new Worker('/debug-worker.js');
        
        workerRef.current.onmessage = (e) => {
          const { type, data } = e.data;
          
          switch (type) {
            case 'WORKER_READY':
              setWorkerStatus('ready');
              addEvent('worker_ready', { message: 'System monitor worker initialized' }, 'performance');
              break;
              
            case 'SYSTEM_DATA':
              setSystemData(data);
              addEvent('system_data_update', { 
                memoryUsage: data.memory?.basic?.usedJSHeapSize,
                networkType: data.network?.connection?.effectiveType,
                fps: data.performance?.frameRate?.estimated
              }, 'performance');
              break;
              
            case 'PERFORMANCE_ENTRIES':
              addEvent('performance_entries', { entries: data }, 'performance');
              break;
              
            case 'COLLECTION_STARTED':
              addEvent('collection_started', data, 'performance');
              break;
              
            case 'COLLECTION_STOPPED':
              addEvent('collection_stopped', {}, 'performance');
              break;
          }
        };
        
        workerRef.current.onerror = (error) => {
          console.error('Debug worker error:', error);
          setWorkerStatus('error');
          addEvent('worker_error', { error: error.message }, 'performance');
        };
        
      } catch (error) {
        console.warn('Failed to initialize debug worker:', error);
        setWorkerStatus('error');
        setWorkerSupported(false);
      }
    } else {
      setWorkerSupported(false);
      setWorkerStatus('error');
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'STOP_COLLECTION' });
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [addEvent]);

  // Frame rate monitoring
  useEffect(() => {
    if (!isCollecting) return;

    let animationId: number;
    
    const measureFrameRate = () => {
      frameStatsRef.current.frames++;
      const now = performance.now();
      const elapsed = now - frameStatsRef.current.startTime;
      
      if (elapsed >= 1000) { // Update every second
        frameStatsRef.current.fps = Math.round((frameStatsRef.current.frames * 1000) / elapsed);
        frameStatsRef.current.frames = 0;
        frameStatsRef.current.startTime = now;
      }
      
      if (isCollecting) {
        animationId = requestAnimationFrame(measureFrameRate);
      }
    };
    
    animationId = requestAnimationFrame(measureFrameRate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isCollecting]);

  const collectDebugData = useCallback(async (): Promise<DebugData> => {
    const data: DebugData = {
      video: {
        currentTime: 0,
        duration: 0,
        buffered: null,
        seekable: null,
        readyState: 0,
        networkState: 0,
        videoWidth: 0,
        videoHeight: 0,
        playbackRate: 1,
        volume: 1,
        muted: false,
        paused: true,
        ended: false,
        error: null,
        src: '',
        crossOrigin: null,
        preload: 'metadata',
        autoplay: false,
        loop: false,
        controls: false,
      },
      performance: {
        memory: {
          usedJSHeapSize: 0,
          totalJSHeapSize: 0,
          jsHeapSizeLimit: 0,
        },
        timing: performance.timing,
        navigation: performance.navigation,
        entries: performance.getEntries().slice(-20), // Last 20 entries
      },
      browser: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        doNotTrack: navigator.doNotTrack,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        permissions: null,
        connection: null,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        orientation: screen.orientation?.type || 'unknown',
      },
      media: {
        codecSupport: {
          h264: false,
          h265: false,
          vp8: false,
          vp9: false,
          av1: false,
          aac: false,
          mp3: false,
          opus: false,
        },
        mediaCapabilities: null,
        mediaDevices: [],
      },
      network: {
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
      },
      cast: {
        isConnected: false,
        deviceName: null,
        receiverAppId: null,
        sessionId: null,
        volume: null,
        isMuted: null,
      },
      events: eventsRef.current,
    };

    // Collect video data
    if (videoElement) {
      try {
        // Basic video properties
        data.video = {
          currentTime: videoElement.currentTime,
          duration: videoElement.duration,
          buffered: videoElement.buffered,
          seekable: videoElement.seekable,
          readyState: videoElement.readyState,
          networkState: videoElement.networkState,
          videoWidth: videoElement.videoWidth,
          videoHeight: videoElement.videoHeight,
          playbackRate: videoElement.playbackRate,
          volume: videoElement.volume,
          muted: videoElement.muted,
          paused: videoElement.paused,
          ended: videoElement.ended,
          error: videoElement.error,
          src: videoElement.src || videoElement.currentSrc,
          crossOrigin: videoElement.crossOrigin,
          preload: videoElement.preload,
          autoplay: videoElement.autoplay,
          loop: videoElement.loop,
          controls: videoElement.controls,
        };

        // Enhanced video metrics (if available)
        if ('getVideoPlaybackQuality' in videoElement) {
          const quality = (videoElement as any).getVideoPlaybackQuality();
          data.video.decodedFrameCount = quality.totalVideoFrames;
          data.video.droppedFrameCount = quality.droppedVideoFrames;
          data.video.corruptedVideoFrameCount = quality.corruptedVideoFrames;
          data.video.creationTime = quality.creationTime;
          data.video.totalVideoFrames = quality.totalVideoFrames;
        }

        // WebKit specific metrics
        if ('webkitDecodedFrameCount' in videoElement) {
          data.video.webkitDecodedFrameCount = (videoElement as any).webkitDecodedFrameCount;
          data.video.webkitDroppedFrameCount = (videoElement as any).webkitDroppedFrameCount;
        }
      } catch (e) {
        console.warn('Error collecting video data:', e);
      }
    }

    // Collect performance data
    try {
      data.performance = {
        memory: {
          usedJSHeapSize: 0,
          totalJSHeapSize: 0,
          jsHeapSizeLimit: 0,
        },
        timing: performance.timing,
        navigation: performance.navigation,
        entries: performance.getEntries().slice(-20), // Last 20 entries
        frameRate: {
          current: frameStatsRef.current.fps,
          average: frameStatsRef.current.fps, // Could be calculated over time
          drops: 0 // Could be tracked
        },
        eventLoopLag: 0,
        renderingMetrics: {
          fps: frameStatsRef.current.fps,
          frameTime: frameStatsRef.current.fps > 0 ? 1000 / frameStatsRef.current.fps : 0,
          jank: frameStatsRef.current.fps < 55 ? 1 : 0 // Simple jank detection
        }
      };

      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        data.performance.memory = {
          usedJSHeapSize: memInfo.usedJSHeapSize,
          totalJSHeapSize: memInfo.totalJSHeapSize,
          jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
          usagePercentage: (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100,
        };
      }

      // Measure event loop lag
      const start = performance.now();
      setTimeout(() => {
        data.performance.eventLoopLag = Math.max(0, performance.now() - start - 1);
      }, 0);
    } catch (e) {
      console.warn('Error collecting performance memory:', e);
    }

    // Enhanced browser capabilities detection
    try {
      // Basic browser info with enhanced capabilities
      data.browser = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        doNotTrack: navigator.doNotTrack,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        permissions: null,
        connection: null,
        
        // Enhanced browser capabilities
        features: {
          webRTC: !!(window.RTCPeerConnection || (window as any).mozRTCPeerConnection || (window as any).webkitRTCPeerConnection),
          serviceWorker: 'serviceWorker' in navigator,
          indexedDB: 'indexedDB' in window,
          webAssembly: 'WebAssembly' in window,
          sharedArrayBuffer: 'SharedArrayBuffer' in window,
          bigInt: typeof BigInt !== 'undefined',
        },
        
        sensors: {
          accelerometer: 'Accelerometer' in window,
          gyroscope: 'Gyroscope' in window,
          magnetometer: 'Magnetometer' in window,
          ambientLight: 'AmbientLightSensor' in window,
        }
      };

      // WebGL capabilities detection
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
        if (gl && 'getParameter' in gl) {
          data.browser.webgl = {
            version: gl.getParameter(gl.VERSION) as string,
            vendor: gl.getParameter(gl.VENDOR) as string,
            renderer: gl.getParameter(gl.RENDERER) as string,
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
            extensions: gl.getSupportedExtensions() || [],
          };
        }
      } catch (e) {
        // WebGL not supported or error occurred
      }

      // Storage quota estimation
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          data.browser.storage = {
            quota: estimate.quota || 0,
            usage: estimate.usage || 0,
            usagePercentage: estimate.quota ? (estimate.usage || 0) / estimate.quota * 100 : 0,
          };
        } catch (e) {
          // Storage estimation not available
        }
      }

      // Network connection info
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        data.browser.connection = conn;
        data.network = {
          effectiveType: conn?.effectiveType || 'unknown',
          downlink: conn?.downlink || 0,
          rtt: conn?.rtt || 0,
          saveData: conn?.saveData || false,
        };
      }
    } catch (e) {
      console.warn('Error collecting browser data:', e);
    }

    // Collect media capabilities
    try {
      if ('mediaCapabilities' in navigator) {
        data.media.mediaCapabilities = navigator.mediaCapabilities;
      }

      // Test codec support
      if (videoElement) {
        data.media.codecSupport = {
          h264: videoElement.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '',
          h265: videoElement.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"') !== '',
          vp8: videoElement.canPlayType('video/webm; codecs="vp8"') !== '',
          vp9: videoElement.canPlayType('video/webm; codecs="vp9"') !== '',
          av1: videoElement.canPlayType('video/mp4; codecs="av01.0.08M.08"') !== '',
          aac: videoElement.canPlayType('audio/mp4; codecs="mp4a.40.2"') !== '',
          mp3: videoElement.canPlayType('audio/mpeg') !== '',
          opus: videoElement.canPlayType('audio/ogg; codecs="opus"') !== '',
        };
      }

      // Get media devices
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        data.media.mediaDevices = await navigator.mediaDevices.enumerateDevices();
      }
    } catch (e) {
      console.warn('Error collecting media capabilities:', e);
    }

    // Collect cast data
    if (castContext) {
      try {
        data.cast = {
          isConnected: castContext.isConnected || false,
          deviceName: castContext.deviceName || null,
          receiverAppId: castContext.receiverAppId || null,
          sessionId: castContext.sessionId || null,
          volume: castContext.volume || null,
          isMuted: castContext.isMuted || null,
        };
      } catch (e) {
        console.warn('Error collecting cast data:', e);
      }
    }

    return data;
  }, [videoElement, castContext]);

  // Start/stop data collection
  useEffect(() => {
    if (isOpen && isCollecting) {
      // Start WebWorker collection if available
      if (workerRef.current && workerStatus === 'ready') {
        workerRef.current.postMessage({
          type: 'START_COLLECTION',
          payload: { interval: updateInterval }
        });
      }

      const collect = async () => {
        try {
          const data = await collectDebugData();
          setDebugData(data);
        } catch (e) {
          console.error('Error collecting debug data:', e);
        }
      };

      collect(); // Initial collection
      intervalRef.current = setInterval(collect, updateInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Stop WebWorker collection
        if (workerRef.current) {
          workerRef.current.postMessage({ type: 'STOP_COLLECTION' });
        }
      };
    } else {
      // Stop collection
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'STOP_COLLECTION' });
      }
    }
  }, [isOpen, isCollecting, updateInterval, collectDebugData, workerStatus]);

  // Update WebWorker interval when changed
  useEffect(() => {
    if (workerRef.current && isCollecting) {
      workerRef.current.postMessage({
        type: 'UPDATE_INTERVAL',
        payload: { interval: updateInterval }
      });
    }
  }, [updateInterval, isCollecting]);

  // Set up event listeners for video events
  useEffect(() => {
    if (!videoElement || !isOpen) return;

    const videoEvents = [
      'loadstart', 'durationchange', 'loadedmetadata', 'loadeddata', 'progress',
      'canplay', 'canplaythrough', 'play', 'pause', 'seeking', 'seeked',
      'timeupdate', 'ended', 'ratechange', 'resize', 'volumechange',
      'stalled', 'suspend', 'abort', 'error', 'emptied', 'waiting'
    ];

    const handleVideoEvent = (event: Event) => {
      addEvent(event.type, {
        currentTime: videoElement.currentTime,
        readyState: videoElement.readyState,
        networkState: videoElement.networkState,
        bufferedLength: videoElement.buffered.length,
        seekableLength: videoElement.seekable.length,
      }, 'video');
    };

    videoEvents.forEach(eventType => {
      videoElement.addEventListener(eventType, handleVideoEvent);
    });

    return () => {
      videoEvents.forEach(eventType => {
        videoElement.removeEventListener(eventType, handleVideoEvent);
      });
    };
  }, [videoElement, isOpen, addEvent]);

  // Auto-start collection when overlay opens
  useEffect(() => {
    if (isOpen) {
      setIsCollecting(true);
    } else {
      setIsCollecting(false);
    }
  }, [isOpen]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeRanges = (ranges: TimeRanges | null): string => {
    if (!ranges || ranges.length === 0) return 'None';
    const result = [];
    for (let i = 0; i < ranges.length; i++) {
      result.push(`${ranges.start(i).toFixed(2)}-${ranges.end(i).toFixed(2)}`);
    }
    return result.join(', ');
  };

  const getReadyStateText = (state: number): string => {
    const states = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'];
    return states[state] || `Unknown (${state})`;
  };

  const getNetworkStateText = (state: number): string => {
    const states = ['NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_NO_SOURCE'];
    return states[state] || `Unknown (${state})`;
  };

  const filteredEvents = debugData?.events.filter(event => 
    eventFilter === 'all' || event.source === eventFilter
  ) || [];

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (isResizing) {
      const newWidth = Math.max(400, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(300, resizeStart.height + (e.clientY - resizeStart.y));
      setSize({ width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  }, [size]);

  const toggleCompact = useCallback(() => {
    setIsCompact(!isCompact);
    if (!isCompact) {
      setSize({ width: 400, height: 200 });
    } else {
      setSize({ width: 900, height: 600 });
    }
  }, [isCompact]);

  const resetPosition = useCallback(() => {
    setPosition({ x: 50, y: 50 });
    setSize({ width: 900, height: 600 });
    setIsCompact(false);
  }, []);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Export functions
  const handleExportData = useCallback(async () => {
    setExportStatus('exporting');
    try {
      const exportData = exportDebugData(debugData, systemData, eventsRef.current);
      downloadDebugData(exportData);
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('idle');
    }
  }, [debugData, systemData]);

  const handleCopyData = useCallback(async () => {
    setExportStatus('exporting');
    try {
      const exportData = exportDebugData(debugData, systemData, eventsRef.current);
      const success = await copyDebugDataToClipboard(exportData);
      setExportStatus(success ? 'copied' : 'idle');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      setExportStatus('idle');
    }
  }, [debugData, systemData]);

  const handleShareData = useCallback(async () => {
    setExportStatus('exporting');
    try {
      const exportData = exportDebugData(debugData, systemData, eventsRef.current);
      const success = await shareDebugData(exportData);
      setExportStatus(success ? 'shared' : 'idle');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (error) {
      console.error('Share failed:', error);
      setExportStatus('idle');
    }
  }, [debugData, systemData]);

  // Performance analysis
  useEffect(() => {
    if (debugData && systemData) {
      const exportData = exportDebugData(debugData, systemData, eventsRef.current);
      const score = generatePerformanceScore(exportData);
      const issues = analyzePerformanceIssues(exportData);
      setPerformanceScore(score);
      setPerformanceIssues(issues);
    }
  }, [debugData, systemData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div 
        ref={dragRef}
        className="absolute bg-gradient-to-br from-gray-900 to-black border border-[#39FF14]/30 rounded-lg shadow-2xl flex flex-col pointer-events-auto"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          minWidth: '400px',
          minHeight: '300px',
          maxWidth: '95vw',
          maxHeight: '95vh'
        }}
      >
        {/* Draggable Title Bar */}
        <div 
          className="flex items-center justify-between p-3 border-b border-[#39FF14]/20 bg-gradient-to-r from-gray-800/90 to-gray-900/90 rounded-t-lg cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Move size={16} className="text-gray-400" />
              <Terminal size={20} className="text-[#39FF14]" />
              <span className="text-[#39FF14] font-bold">Video Player Debugger</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse"></div>
              <span>Live</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Compact/Standard Toggle */}
            <button
              onClick={toggleCompact}
              className="p-1 text-gray-400 hover:text-[#39FF14] transition-colors"
              title={isCompact ? 'Expand to standard size' : 'Compact view'}
            >
              {isCompact ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>

            {/* Reset Position */}
            <button
              onClick={resetPosition}
              className="p-1 text-gray-400 hover:text-[#39FF14] transition-colors"
              title="Reset position and size"
            >
              <RotateCcw size={16} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
              title="Close video player debugger"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Controls Bar - Hidden in compact mode */}
        {!isCompact && (
          <div className="flex items-center justify-between p-3 border-b border-[#39FF14]/20 bg-gray-900/50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCollecting(!isCollecting)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  isCollecting 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-[#39FF14]/20 text-[#39FF14] hover:bg-[#39FF14]/30'
                }`}
              >
                {isCollecting ? 'Pause' : 'Start'}
              </button>
              <select
                value={updateInterval}
                onChange={(e) => setUpdateInterval(Number(e.target.value))}
                className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value={500}>500ms</option>
                <option value={1000}>1s</option>
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* Performance Score */}
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-gray-800/50 border border-gray-600/50">
                <BarChart3 size={16} className={
                  performanceScore >= 80 ? 'text-green-400' :
                  performanceScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                } />
                <span className={`text-sm font-medium ${
                  performanceScore >= 80 ? 'text-green-400' :
                  performanceScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {performanceScore}%
                </span>
                {performanceIssues.length > 0 && (
                  <div title={`${performanceIssues.length} issues detected`}>
                    <AlertCircle size={14} className="text-orange-400" />
                  </div>
                )}
              </div>

              {/* Export Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExportData}
                  disabled={exportStatus === 'exporting'}
                  className="p-2 text-gray-400 hover:text-[#39FF14] transition-colors disabled:opacity-50"
                  title="Export debug data"
                >
                  {exportStatus === 'exporting' ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                </button>
                <button
                  onClick={handleCopyData}
                  disabled={exportStatus === 'exporting'}
                  className={`p-2 transition-colors disabled:opacity-50 ${
                    exportStatus === 'copied' ? 'text-green-400' : 'text-gray-400 hover:text-[#39FF14]'
                  }`}
                  title="Copy debug data to clipboard"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={handleShareData}
                  disabled={exportStatus === 'exporting'}
                  className={`p-2 transition-colors disabled:opacity-50 ${
                    exportStatus === 'shared' ? 'text-green-400' : 'text-gray-400 hover:text-[#39FF14]'
                  }`}
                  title="Share debug data"
                >
                  <Share size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isCompact ? (
            /* Compact Mode - Key Metrics Only */
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-800/50 rounded p-2">
                  <div className="text-[#39FF14] font-medium">FPS</div>
                  <div className="text-white text-lg">{frameStatsRef.current.fps}</div>
                </div>
                <div className="bg-gray-800/50 rounded p-2">
                  <div className="text-[#39FF14] font-medium">Memory</div>
                  <div className="text-white text-lg">{debugData?.performance?.memory?.usagePercentage?.toFixed(1) || 0}%</div>
                </div>
                <div className="bg-gray-800/50 rounded p-2">
                  <div className="text-[#39FF14] font-medium">Score</div>
                  <div className={`text-lg font-bold ${
                    performanceScore >= 80 ? 'text-green-400' :
                    performanceScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{performanceScore}%</div>
                </div>
                <div className="bg-gray-800/50 rounded p-2">
                  <div className="text-[#39FF14] font-medium">Network</div>
                  <div className="text-white text-lg">{debugData?.network?.effectiveType || 'Unknown'}</div>
                </div>
              </div>
              {debugData?.video && (
                <div className="bg-gray-800/50 rounded p-2 text-xs">
                  <div className="text-[#39FF14] font-medium mb-1">Video Status</div>
                  <div className="text-gray-300">
                    {Math.floor(debugData.video.currentTime / 60)}:{Math.floor(debugData.video.currentTime % 60).toString().padStart(2, '0')} / 
                    {Math.floor(debugData.video.duration / 60)}:{Math.floor(debugData.video.duration % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-gray-300">{debugData.video.videoWidth}x{debugData.video.videoHeight}</div>
                </div>
              )}
            </div>
          ) : (
            /* Standard Mode - Full Interface */
            <div>
              {/* Tab Navigation */}
              <div className="flex border-b border-[#39FF14]/20 bg-gray-900/50 overflow-x-auto">
                {[
                  { id: 'video', label: 'Video', icon: Video },
                  { id: 'performance', label: 'Performance', icon: Cpu },
                  { id: 'browser', label: 'Browser', icon: Monitor },
                  { id: 'media', label: 'Media', icon: Gauge },
                  { id: 'network', label: 'Network', icon: Wifi },
                  { id: 'cast', label: 'Cast', icon: Activity },
                  { id: 'events', label: 'Events', icon: Terminal },
                  { id: 'system', label: 'System', icon: HardDrive },
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-b-2 border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="p-4">
          {debugData ? (
            <>
              {activeTab === 'video' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Clock size={16} />
                        Timing
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>Current: {debugData.video.currentTime.toFixed(2)}s</div>
                        <div>Duration: {isFinite(debugData.video.duration) ? debugData.video.duration.toFixed(2) + 's' : 'Live/Unknown'}</div>
                        <div>Rate: {debugData.video.playbackRate}x</div>
                        <div>Progress: {isFinite(debugData.video.duration) ? ((debugData.video.currentTime / debugData.video.duration) * 100).toFixed(1) + '%' : 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Activity size={16} />
                        State
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          {debugData.video.paused ? 
                            <XCircle size={12} className="text-red-400" /> : 
                            <CheckCircle size={12} className="text-[#39FF14]" />
                          }
                          {debugData.video.paused ? 'Paused' : 'Playing'}
                        </div>
                        <div>Ready: {getReadyStateText(debugData.video.readyState)}</div>
                        <div>Network: {getNetworkStateText(debugData.video.networkState)}</div>
                        <div>Ended: {debugData.video.ended ? 'Yes' : 'No'}</div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Monitor size={16} />
                        Video Properties
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>Resolution: {debugData.video.videoWidth}x{debugData.video.videoHeight}</div>
                        <div>Volume: {Math.round(debugData.video.volume * 100)}%</div>
                        <div>Muted: {debugData.video.muted ? 'Yes' : 'No'}</div>
                        <div>Autoplay: {debugData.video.autoplay ? 'Yes' : 'No'}</div>
                      </div>
                    </div>

                    {/* Enhanced Frame Metrics */}
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp size={16} />
                        Frame Stats
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>Decoded: {debugData.video.decodedFrameCount || 'N/A'}</div>
                        <div>Dropped: {debugData.video.droppedFrameCount || 'N/A'}</div>
                        <div>Corrupted: {debugData.video.corruptedVideoFrameCount || 'N/A'}</div>
                        <div>Total Frames: {debugData.video.totalVideoFrames || 'N/A'}</div>
                        {debugData.video.droppedFrameCount && debugData.video.totalVideoFrames && (
                          <div className={`${
                            (debugData.video.droppedFrameCount / debugData.video.totalVideoFrames) > 0.01 
                              ? 'text-red-400' 
                              : 'text-[#39FF14]'
                          }`}>
                            Drop Rate: {((debugData.video.droppedFrameCount / debugData.video.totalVideoFrames) * 100).toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4 md:col-span-2">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Database size={16} />
                        Buffering
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>Buffered: {formatTimeRanges(debugData.video.buffered)}</div>
                        <div>Seekable: {formatTimeRanges(debugData.video.seekable)}</div>
                        <div>Preload: {debugData.video.preload}</div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Error State
                      </h3>
                      <div className="text-sm">
                        {debugData.video.error ? (
                          <div className="text-red-400">
                            <div>Code: {debugData.video.error.code}</div>
                            <div>Message: {debugData.video.error.message}</div>
                          </div>
                        ) : (
                          <div className="text-[#39FF14]">No errors</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-[#39FF14] font-semibold mb-2">Source Information</h3>
                    <div className="text-sm break-all text-gray-300">
                      {debugData.video.src || 'No source'}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <MemoryStick size={16} />
                        Memory Usage
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>Used: {formatBytes(debugData.performance.memory.usedJSHeapSize)}</div>
                        <div>Total: {formatBytes(debugData.performance.memory.totalJSHeapSize)}</div>
                        <div>Limit: {formatBytes(debugData.performance.memory.jsHeapSizeLimit)}</div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-[#39FF14] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(debugData.performance.memory.usedJSHeapSize / debugData.performance.memory.jsHeapSizeLimit) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Clock size={16} />
                        Navigation Timing
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>DNS: {debugData.performance.timing.domainLookupEnd - debugData.performance.timing.domainLookupStart}ms</div>
                        <div>Connect: {debugData.performance.timing.connectEnd - debugData.performance.timing.connectStart}ms</div>
                        <div>Request: {debugData.performance.timing.responseEnd - debugData.performance.timing.requestStart}ms</div>
                        <div>DOM Load: {debugData.performance.timing.domContentLoadedEventEnd - debugData.performance.timing.navigationStart}ms</div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp size={16} />
                        Performance Entries
                      </h3>
                      <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                        {debugData.performance.entries.slice(0, 5).map((entry, i) => (
                          <div key={i} className="border-b border-gray-700 pb-1">
                            <div className="text-[#39FF14]">{entry.name.split('/').pop()}</div>
                            <div>{entry.duration?.toFixed(2)}ms</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Performance Analysis */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-[#39FF14] font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 size={16} />
                      Performance Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-300">Overall Score</h4>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="w-full bg-gray-700 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-500 ${
                                  performanceScore >= 80 ? 'bg-green-500' :
                                  performanceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${performanceScore}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className={`text-lg font-bold ${
                            performanceScore >= 80 ? 'text-green-400' :
                            performanceScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {performanceScore}%
                          </span>
                        </div>
                        <div className={`text-xs ${
                          performanceScore >= 80 ? 'text-green-400' :
                          performanceScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {performanceScore >= 80 ? 'Excellent' :
                           performanceScore >= 60 ? 'Good' : 'Needs Improvement'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-300">Issues Detected</h4>
                        {performanceIssues.length > 0 ? (
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {performanceIssues.map((issue, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <AlertTriangle size={12} className="text-orange-400 flex-shrink-0" />
                                <span className="text-gray-300">{issue}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-green-400">
                            <CheckCircle size={12} />
                            <span>No performance issues detected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'browser' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Monitor size={16} />
                        Browser Info
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>Platform: {debugData.browser.platform}</div>
                        <div>Language: {debugData.browser.language}</div>
                        <div>Cookies: {debugData.browser.cookieEnabled ? 'Enabled' : 'Disabled'}</div>
                        <div>Online: {debugData.browser.onLine ? 'Yes' : 'No'}</div>
                        <div>Do Not Track: {debugData.browser.doNotTrack || 'Not set'}</div>
                        <div>CPU Cores: {debugData.browser.hardwareConcurrency}</div>
                        <div>Touch Points: {debugData.browser.maxTouchPoints}</div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Monitor size={16} />
                        Viewport
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>Size: {debugData.viewport.width}x{debugData.viewport.height}</div>
                        <div>DPR: {debugData.viewport.devicePixelRatio}</div>
                        <div>Orientation: {debugData.viewport.orientation}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-[#39FF14] font-semibold mb-2">User Agent</h3>
                    <div className="text-sm text-gray-300 break-all">
                      {debugData.browser.userAgent}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Video size={16} />
                        Video Codec Support
                      </h3>
                      <div className="space-y-1 text-sm">
                        {Object.entries(debugData.media.codecSupport).map(([codec, supported]) => (
                          <div key={codec} className="flex items-center gap-2">
                            {supported ? 
                              <CheckCircle size={12} className="text-[#39FF14]" /> : 
                              <XCircle size={12} className="text-red-400" />
                            }
                            <span className="uppercase">{codec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <HardDrive size={16} />
                        Media Devices
                      </h3>
                      <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                        {debugData.media.mediaDevices.map((device, i) => (
                          <div key={i} className="border-b border-gray-700 pb-1">
                            <div className="text-[#39FF14]">{device.kind}</div>
                            <div className="text-xs text-gray-400">{device.label || 'Unnamed device'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'network' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Network size={16} />
                        Connection Type
                      </h3>
                      <div className="text-lg font-mono">{debugData.network.effectiveType}</div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp size={16} />
                        Downlink
                      </h3>
                      <div className="text-lg font-mono">{debugData.network.downlink} Mbps</div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Clock size={16} />
                        RTT
                      </h3>
                      <div className="text-lg font-mono">{debugData.network.rtt}ms</div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Database size={16} />
                        Data Saver
                      </h3>
                      <div className="text-lg font-mono">{debugData.network.saveData ? 'ON' : 'OFF'}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'cast' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Activity size={16} />
                        Cast Status
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          {debugData.cast.isConnected ? 
                            <CheckCircle size={12} className="text-[#39FF14]" /> : 
                            <XCircle size={12} className="text-red-400" />
                          }
                          {debugData.cast.isConnected ? 'Connected' : 'Disconnected'}
                        </div>
                        <div>Device: {debugData.cast.deviceName || 'None'}</div>
                        <div>App ID: {debugData.cast.receiverAppId || 'None'}</div>
                        <div>Session: {debugData.cast.sessionId ? debugData.cast.sessionId.substring(0, 8) + '...' : 'None'}</div>
                        {debugData.cast.volume !== null && (
                          <div>Volume: {Math.round(debugData.cast.volume * 100)}%</div>
                        )}
                        {debugData.cast.isMuted !== null && (
                          <div>Muted: {debugData.cast.isMuted ? 'Yes' : 'No'}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* WebWorker Status */}
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Zap size={16} />
                        System Monitor
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          {workerStatus === 'ready' ? 
                            <CheckCircle size={12} className="text-[#39FF14]" /> : 
                            workerStatus === 'error' ?
                            <XCircle size={12} className="text-red-400" /> :
                            <Loader size={12} className="text-yellow-400 animate-spin" />
                          }
                          Worker: {workerStatus}
                        </div>
                        <div>Supported: {workerSupported ? 'Yes' : 'No'}</div>
                        <div>Update Rate: {updateInterval}ms</div>
                        <div>Frame Rate: {frameStatsRef.current.fps} FPS</div>
                      </div>
                    </div>

                    {/* Advanced Memory Metrics */}
                    {systemData?.memory && (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                          <MemoryStick size={16} />
                          Advanced Memory
                        </h3>
                        <div className="space-y-1 text-sm">
                          <div>Growth Rate: {systemData.memory.trends?.memoryGrowthRate?.toFixed(2) || 0} B/s</div>
                          <div>GC Pressure: {systemData.memory.gc?.gcPressure || 0}</div>
                          <div>Average Usage: {formatBytes(systemData.memory.trends?.averageUsage || 0)}</div>
                          <div className="mt-2">
                            <div className="text-xs text-gray-400 mb-1">Memory Trend</div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  (systemData.memory.trends?.memoryGrowthRate || 0) > 0 ? 'bg-red-500' : 'bg-[#39FF14]'
                                }`}
                                style={{ width: `${Math.min(100, Math.abs(systemData.memory.trends?.memoryGrowthRate || 0) / 1000)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* System Performance */}
                    {systemData?.performance && (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp size={16} />
                          System Performance
                        </h3>
                        <div className="space-y-1 text-sm">
                          <div>Estimated FPS: {systemData.performance.frameRate?.estimated || 'N/A'}</div>
                          <div>Event Loop Lag: {systemData.performance.eventLoopLag?.toFixed(2) || 0}ms</div>
                          <div>Frame Drops: {systemData.performance.frameRate?.drops || 0}</div>
                          <div className="mt-2">
                            <div className="text-xs text-gray-400 mb-1">Performance Health</div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  (systemData.performance.frameRate?.estimated || 0) >= 55 ? 'bg-[#39FF14]' : 
                                  (systemData.performance.frameRate?.estimated || 0) >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, (systemData.performance.frameRate?.estimated || 0) / 60 * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Network Advanced */}
                    {systemData?.network && (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                          <Globe size={16} />
                          Advanced Network
                        </h3>
                        <div className="space-y-1 text-sm">
                          <div>Active Requests: {systemData.network.requests?.active || 0}</div>
                          <div>Failed Requests: {systemData.network.requests?.failed || 0}</div>
                          <div>Avg Latency: {systemData.network.requests?.averageLatency?.toFixed(2) || 0}ms</div>
                          <div>Bandwidth Trend: {systemData.network.bandwidth?.trend || 'stable'}</div>
                        </div>
                      </div>
                    )}

                    {/* Browser Advanced Features */}
                    {systemData?.browser && (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                          <Shield size={16} />
                          Advanced Features
                        </h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            {systemData.browser.webRTC ? 
                              <CheckCircle size={10} className="text-[#39FF14]" /> : 
                              <XCircle size={10} className="text-red-400" />
                            }
                            WebRTC
                          </div>
                          <div className="flex items-center gap-2">
                            {systemData.browser.serviceWorker ? 
                              <CheckCircle size={10} className="text-[#39FF14]" /> : 
                              <XCircle size={10} className="text-red-400" />
                            }
                            Service Worker
                          </div>
                          <div className="flex items-center gap-2">
                            {systemData.browser.webAssembly ? 
                              <CheckCircle size={10} className="text-[#39FF14]" /> : 
                              <XCircle size={10} className="text-red-400" />
                            }
                            WebAssembly
                          </div>
                          <div className="flex items-center gap-2">
                            {systemData.browser.sharedArrayBuffer ? 
                              <CheckCircle size={10} className="text-[#39FF14]" /> : 
                              <XCircle size={10} className="text-red-400" />
                            }
                            SharedArrayBuffer
                          </div>
                        </div>
                      </div>
                    )}

                    {/* System Resource Usage */}
                    <div className="bg-gray-800/50 rounded-lg p-4 md:col-span-2">
                      <h3 className="text-[#39FF14] font-semibold mb-2 flex items-center gap-2">
                        <Eye size={16} />
                        Real-time Monitoring
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-mono text-[#39FF14]">
                            {debugData?.performance?.memory?.usagePercentage?.toFixed(1) || 0}%
                          </div>
                          <div className="text-xs text-gray-400">Memory Usage</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-mono text-[#39FF14]">
                            {debugData?.performance?.frameRate?.current || frameStatsRef.current.fps}
                          </div>
                          <div className="text-xs text-gray-400">Current FPS</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-mono text-[#39FF14]">
                            {debugData?.network?.rtt || 0}
                          </div>
                          <div className="text-xs text-gray-400">Network RTT</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-mono text-[#39FF14]">
                            {debugData?.performance?.eventLoopLag?.toFixed(1) || 0}
                          </div>
                          <div className="text-xs text-gray-400">Event Loop Lag</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <select
                      value={eventFilter}
                      onChange={(e) => setEventFilter(e.target.value as any)}
                      className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1"
                    >
                      <option value="all">All Events</option>
                      <option value="video">Video Events</option>
                      <option value="cast">Cast Events</option>
                      <option value="network">Network Events</option>
                      <option value="performance">Performance Events</option>
                    </select>
                    <div className="text-sm text-gray-400">
                      {filteredEvents.length} events
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {filteredEvents.map((event, i) => (
                        <div key={i} className="border-b border-gray-700 pb-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-[#39FF14] font-mono">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              event.source === 'video' ? 'bg-blue-500/20 text-blue-400' :
                              event.source === 'cast' ? 'bg-purple-500/20 text-purple-400' :
                              event.source === 'network' ? 'bg-green-500/20 text-green-400' :
                              'bg-orange-500/20 text-orange-400'
                            }`}>
                              {event.source}
                            </span>
                            <span className="text-white font-medium">{event.type}</span>
                          </div>
                          <pre className="text-xs text-gray-400 mt-1 overflow-x-auto">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader className="animate-spin text-[#39FF14] mx-auto mb-4" size={48} />
                <div className="text-white">Collecting debug data...</div>
              </div>
            </div>
          )}
              </div>
            </div>
          )}
        </div>

        {/* Resize Handle */}
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        >
          <div className="absolute bottom-1 right-1 w-0 h-0 border-l-[8px] border-b-[8px] border-l-transparent border-b-[#39FF14]/60"></div>
          <div className="absolute bottom-0.5 right-0.5 w-0 h-0 border-l-[6px] border-b-[6px] border-l-transparent border-b-[#39FF14]/80"></div>
        </div>
      </div>
    </div>
  );
};

export default DebugOverlay;
