
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ResumeModal from '../../components/ResumeModal';
import CategoryButtons from '../../components/CategoryButtons';
import { useRouter } from 'next/navigation';
import { Video, Monitor, Cast, List, Tv, Globe, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';
import UnifiedPlayer from '@/components/UnifiedPlayer';
import VideoLibrary from '@/components/VideoLibrary';
const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), { ssr: false, loading: () => null });
import Navigation from '@/components/Navigation';
import { useCast } from '@/contexts/CastContext';
import { parseM3UChunked, convertM3UToVideos } from '@/lib/m3uParser';
import { getM3UParserWorker, terminateM3UParserWorker, M3UParserWorkerManager } from '@/lib/m3uParserWorker';
// Debug imports removed from production to avoid unnecessary HTTP requests
// import testM3UParser from '@/tests/lib/testM3UParser';
// import { directTest } from '@/lib/directTest';
// import { visualM3UTest } from '@/lib/visualDebug';
import { addDebugLog, addVideoDebugLog, logVideoConnectionStart, logVideoConnectionError, logVideoAuthError, logDashParsingStart, logDashParsingSuccess, logDashParsingError, logDashManifestInfo } from '@/lib/visualDebug';
import { testDashParsing } from '@/lib/dashParser';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import SplitType from 'split-type';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(TextPlugin);
}

// Video interface to match VideoLibrary component (enhanced for sample sources)
interface Video {
  id: number;
  title: string;
  src: string;
  poster?: string;
  duration: string;
  mimetype?: string;
  name?: string;  // For sample sources data
  uri?: string;   // For sample sources data
  features?: string[]; // For sample sources features like ['live', 'low-latency']
  keySystems?: any; // For DRM content
  // M3U specific data
  m3uData?: {
    tvgId?: string;
    group?: string;
    logo?: string;
    userAgent?: string;
    referrer?: string;
    metadata?: Record<string, string>;
  };
}

// List of media source files to load
const mediaSourceFiles = [
  { type: 'json', path: '/data/sample_sources.json' },
  // { type: 'json', path: '/data/LL_HLS_test_bitmovin.mpd'}
  { type: 'm3u', path: '/data/HLS_valid.m3u' },
  // Add more source files here as needed
];

export type SourceFilter = 'all' | 'json' | 'm3u' | 'live' | 'vod';

// Helper to count group frequencies for all sources (not just M3U)
function getTopGroups(videos: any[], count = 10) {
  const freq: Record<string, number> = {};
  videos.forEach(v => {
    // Prefer m3uData.group, fallback to v.group, v.category, or v.features[0]
    let group = v.m3uData?.group || v.group || v.category || (Array.isArray(v.features) && v.features[0]);
    if (group) {
      group.split(';').forEach((g: string) => {
        const trimmed = g.trim();
        if (trimmed) freq[trimmed] = (freq[trimmed] || 0) + 1;
      });
    }
  });
  return Object.entries(freq)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, count)
    .map(([g]) => g);
}

export default function MediaDemoPage() {
  // Core state (must be declared first for hooks below)
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  // Resume modal state
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeVideoId, setResumeVideoId] = useState<number|null>(null);
  const [resumeVideoTitle, setResumeVideoTitle] = useState<string>('');
  // On mount, check for resume info in localStorage and show modal if found
  useEffect(() => {
    let resumeData: { videoId: number, videoTitle: string } | null = null;
    try {
      const stored = localStorage.getItem('resume_media_demo');
      if (stored) {
        resumeData = JSON.parse(stored);
      }
    } catch {}
    if (resumeData && videos.some(v => v.id === resumeData!.videoId)) {
      setResumeVideoId(resumeData.videoId);
      setResumeVideoTitle(resumeData.videoTitle);
      setShowResumeModal(true);
    } else if (videos.length > 0 && !currentVideo) {
      setCurrentVideo(videos[0]);
    }
  }, [videos, currentVideo]);
  // Save resume info to localStorage on playback
  useEffect(() => {
    if (currentVideo) {
      try {
        localStorage.setItem('resume_media_demo', JSON.stringify({ videoId: currentVideo.id, videoTitle: currentVideo.title }));
      } catch {}
    }
  }, [currentVideo]);
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMediaSelected, setIsMediaSelected] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const [showCastOverlay, setShowCastOverlay] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false); // Toggle for debug console sidebar
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [m3uGroups, setM3uGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [topGroups, setTopGroups] = useState<string[]>([]);
  const [showResumeOverlay, setShowResumeOverlay] = useState(false);
  const [sourcesLoaded, setSourcesLoaded] = useState(false); // Track when all sources are fully loaded
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  // Track if user intends to resume content
  const resumeIntentRef = useRef(false);

  // State for remote timeline/progress (for Cast)
  const [currentTimeRemote, setCurrentTimeRemote] = useState<number | null>(null);
  const [durationRemote, setDurationRemote] = useState<number | null>(null);

  // Ref for video player section to enable smooth scrolling
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  // Ref for video library section to enable smooth scrolling
  const videoLibraryRef = useRef<HTMLDivElement>(null);

  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const castContext = useCast();

  // Listen for confirmation from receiver to pause local playback
  useEffect(() => {
    if (!castContext) return;
    const removeListener = castContext.addMessageListener((msg) => {
      if (msg?.type === 'VIDEO_LOADED_CONFIRMATION') {
        setShowCastOverlay(false);
        setIsCasting(true);
        setIsPlaying(false); // Pause local player
      }
      // Listen for MEDIA_STATUS_UPDATE from receiver to update timeline
      if (msg?.type === 'MEDIA_STATUS_UPDATE' && isCasting) {
        // Expect payload: { currentTime, duration, isPlaying, isLive }
        const { currentTime, duration, isPlaying: remotePlaying } = msg.payload || {};
        if (typeof currentTime === 'number') setCurrentTimeRemote(currentTime);
        if (typeof duration === 'number') setDurationRemote(duration);
        if (typeof remotePlaying === 'boolean') setIsPlaying(remotePlaying);
      }
    });
    return removeListener;
  }, [castContext, isCasting]);

  // Flag to track if we've already auto-loaded a video for this cast session
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);

  // Reset auto-load flag when cast disconnects
  useEffect(() => {
    if (!castContext?.isConnected) {
      setHasAutoLoaded(false);
    }
  }, [castContext?.isConnected]);

  // Pause local player when casting is connected
  useEffect(() => {
    if (castContext?.isConnected) {
      // Pause local player immediately when cast connection is established
      setIsPlaying(false);
      
      // Try to pause the actual video element if available
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach(video => {
        try { video.pause(); } catch {}
      });

      // Auto-load current video to receiver after cast connection with delay (only once per session)
      if (currentVideo && castContext.sendMessage && !hasAutoLoaded) {
        setHasAutoLoaded(true); // Set flag immediately to prevent multiple calls

        // Wait 3 seconds after connection confirmation to ensure receiver is ready
        setTimeout(() => {
          if (castContext.isConnected && currentVideo) {
            castContext.sendMessage({
              type: 'LOAD_MEDIA',
              payload: {
                mediaUrl: currentVideo.src,
                title: currentVideo.title,
                poster: currentVideo.poster,
                contentType: currentVideo.mimetype || 'video/mp4',
                currentTime: 0,
                autoPlay: true, // Auto-play when cast session starts
                metadata: {
                  title: currentVideo.title,
                  images: currentVideo.poster ? [{ url: currentVideo.poster }] : []
                }
              }
            }).then(() => {
              setShowCastOverlay(true);
            }).catch(() => {});
          }
        }, 3000); // 3 second delay
      }
      
    }
  }, [castContext?.isConnected, castContext, currentVideo, hasAutoLoaded]);

  // Resume overlay: check localStorage for last played video
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const last = localStorage.getItem('lastPlayedVideo');
    if (last) setShowResumeOverlay(true);
  }, []);

  // Save last played video to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentVideo && isPlaying) {
      localStorage.setItem('lastPlayedVideo', JSON.stringify(currentVideo));
    }
  }, [currentVideo, isPlaying]);

  // Resume last played video
  const handleResume = () => {
    resumeIntentRef.current = true;
    const last = localStorage.getItem('lastPlayedVideo');
    if (last) {
      try {
        const video = JSON.parse(last);
        setCurrentVideo(video);
        setIsMediaSelected(true);
        setShowResumeOverlay(false);
      } catch {}
    }
  };

  const handleDismissResume = () => setShowResumeOverlay(false);

  // Initialize web worker early for better performance
  useEffect(() => {
    // Skip worker initialization only during Jest testing
    if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID)) {
      return;
    }
    
    // Pre-initialize the web worker to be ready when needed
    if (M3UParserWorkerManager.isWebWorkerSupported()) {
      addDebugLog('🚀 Pre-initializing web worker for M3U parsing');
      try {
        getM3UParserWorker();
        addDebugLog('✅ Web worker ready for M3U parsing');
      } catch (error) {
        addDebugLog('⚠️ Web worker pre-init failed, will use main thread');
      }
    } else {
      addDebugLog('❌ Web Workers not supported');
    }
  }, []); // Run once on mount

  // Load all media sources with chunked processing for large files
  useEffect(() => {
    // Fallback function for main thread M3U parsing
    const fallbackM3UParsing = async (content: string, allSources: Video[]) => {
      addDebugLog('🔄 Starting fallback parsing...');
      const groupsSet = new Set<string>();
      
      // Process M3U file in chunks to avoid blocking UI
      const chunkedParser = parseM3UChunked(content, 250);
      let chunk = chunkedParser.next();
      let totalParsed = 0;
      
      while (!chunk.done) {
        const chunkData = chunk.value;
        addDebugLog(`📦 Chunk: ${chunkData.entries.length} entries`);
        
        const chunkVideos = convertM3UToVideos(chunkData.entries);
        allSources.push(...chunkVideos);
        totalParsed += chunkVideos.length;
        
        // Update groups
        Array.from(chunkData.groups).forEach((group: string) => groupsSet.add(group));
        
        // Update progress
        setLoadingProgress(Math.round((chunkData.processed / chunkData.total) * 100));
        
        // Update UI periodically to show progress
        if (allSources.length % 100 === 0) {
          setVideos([...allSources]);
          addDebugLog(`📺 Updated UI with ${allSources.length} videos`);
        }
        
        // Yield to main thread to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 0));
        
        chunk = chunkedParser.next();
      }

      console.log(`✅ Fallback parsing completed: ${totalParsed} videos, ${groupsSet.size} groups`);
      addDebugLog(`✅ Fallback complete: ${totalParsed} videos, ${groupsSet.size} groups`);

      // Store M3U groups for filtering
      if (groupsSet.size > 0) {
        console.log('🔧 Fallback: Setting M3U groups:', Array.from(groupsSet));
        setM3uGroups(prev => {
          const combined = [...prev, ...Array.from(groupsSet)];
          const final = Array.from(new Set(combined)).sort();
          console.log('🎯 Fallback: Final M3U groups:', final);
          return final;
        });
      }
    };

  async function loadAllSources() {
      // Initialize video debug console
    // Only show loading spinner if not casting
    if (!castContext?.isConnected) {
      setIsLoading(true);
    }
    addDebugLog('🎬 Video Debug Console initialized');
      addDebugLog('📺 Ready to track video connections, errors, and status updates');
      
      // Quick M3U parser test for debugging (only in development)
      if (typeof window !== 'undefined' && !(process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID)) {
        console.log('🧪 Running M3U parser test...');
        addDebugLog('🧪 Starting M3U parser debugging...');
        addDebugLog('🔧 Testing web worker...');
        console.log('🔧 Testing web worker instantiation...');

        // Test actual parser with small sample
        const testSample = `#EXTM3U\n#EXTINF:-1 tvg-id="123tv.de" tvg-logo="https://i.imgur.com/slSUDNX.png" group-title="Shop",1-2-3 TV (270p)\nhttps://123tv-mx1.flex-cdn.net/index.m3u8`;
        console.log('🧪 Testing actual parseM3UChunked with sample...');
        const actualParser = parseM3UChunked(testSample, 10);
        const actualResult = actualParser.next();
        console.log('🧪 Actual parser result:', actualResult);
        addDebugLog(`🧪 Actual parser found ${actualResult.value?.entries?.length || 0} entries`);
      } else {
        console.log('🧪 Skipping debug tests in test environment');
      }
      
      // Debug functions removed from production - they were causing unnecessary HTTP requests
      // testM3UParser();
      // directTest(); 
      // visualM3UTest();
      
      setLoadingProgress(0);

      try {
        const allSources: Video[] = [];
        for (let idx = 0; idx < mediaSourceFiles.length; idx++) {
          const sourceFile = mediaSourceFiles[idx];
          try {
            const res = await fetch(sourceFile.path);
            if (!res.ok) continue;
            if (sourceFile.type === 'json') {
              const data = await res.json();
              const jsonVideos = data.map((item: any, i: number) => ({
                id: 1000 * (idx + 1) + i,
                title: item.name || `Source ${i + 1}`,
                src: item.uri,
                poster: undefined,
                duration: item.features?.includes('live') ? 'LIVE' : 'VOD',
                mimetype: item.mimetype || 'video/mp4',
                name: item.name,
                uri: item.uri,
                features: item.features || [],
                keySystems: item.keySystems
              }));
              allSources.push(...jsonVideos);
            } else if (sourceFile.type === 'm3u') {
              const content = await res.text();
              console.log('📄 M3U content loaded, length:', content.length, 'bytes');
              console.log('📄 First 500 chars:', content.substring(0, 500));
              addDebugLog('🔧 Using pre-initialized web worker...');
              console.log('🔧 Using pre-initialized web worker for M3U parsing...');
              if (M3UParserWorkerManager.isWebWorkerSupported()) {
                console.log('⚡ Using pre-initialized web worker for faster parsing...');
                addDebugLog('⚡ Pre-initialized worker ready, starting parsing...');
                try {
                  // Use the already pre-initialized worker
                  const workerManager = getM3UParserWorker();
                  console.log('⚡ Worker manager obtained, starting chunked parsing...');
                  addDebugLog('⚡ Worker manager obtained, starting parsing...');
                  const result = await workerManager.parseM3UChunked(content, {
                    chunkSize: 50,
                    onProgress: (progress) => {
                      setLoadingProgress(Math.round(progress.progress));
                      console.log(`📊 Worker progress: ${progress.progress.toFixed(1)}%, processed: ${progress.totalProcessed}`);
                      addDebugLog(`📊 Worker: ${progress.progress.toFixed(1)}%, processed: ${progress.totalProcessed}`);
                    }
                  });
                  console.log(`✅ Web worker parsed ${result.totalCount} M3U entries in ${result.processingTime.toFixed(2)}ms`);
                  addDebugLog(`✅ Worker parsed ${result.totalCount} entries in ${result.processingTime.toFixed(2)}ms`);
                  allSources.push(...result.videos);
                  addDebugLog(`📊 Total sources now: ${allSources.length}`);
                  
                  // Log sample of video data for debugging
                  if (result.videos.length > 0) {
                    console.log('🎬 Sample video with M3U data:', result.videos[0]);
                    console.log('🎬 Sample m3uData.group:', result.videos[0].m3uData?.group);
                  }
                  
                  const groupsSet = new Set<string>();
                  result.videos.forEach((video, index) => {
                    if (index < 5) { // Log first 5 videos
                      console.log(`🔍 Video ${index} m3uData:`, video.m3uData);
                    }
                    if (video.m3uData?.group) {
                   //   console.log('✅ Found group:', video.m3uData.group);
                      groupsSet.add(video.m3uData.group);
                    }
                  });
                  console.log(`🏷️ Extracted ${groupsSet.size} groups from M3U data:`, Array.from(groupsSet));
                  addDebugLog(`🏷️ Extracted ${groupsSet.size} groups`);
                  if (groupsSet.size > 0) {
                    console.log('🔧 Setting M3U groups:', Array.from(groupsSet));
                    setM3uGroups(prev => {
                      const combined = [...prev, ...Array.from(groupsSet)];
                      const final = Array.from(new Set(combined)).sort();
                      console.log('🎯 Final M3U groups:', final);
                      return final;
                    });
                  }
                } catch (workerError) {
                  console.warn('❌ Web worker failed for M3U parsing, falling back to main thread:', workerError);
                  addDebugLog(`❌ Worker failed: ${workerError instanceof Error ? workerError.message : String(workerError)}`);
                  addDebugLog('🔄 Falling back to main thread parsing...');
                  await fallbackM3UParsing(content, allSources);
                }
              } else {
                console.warn('⚠️ Web Workers not supported, using main thread for M3U parsing');
                addDebugLog('❌ Web Workers not supported, using fallback');
                await fallbackM3UParsing(content, allSources);
              }
            }
          } catch (error) {
            console.warn(`Failed to load ${sourceFile.path}:`, error);
          }
        }
        setVideos(allSources);
  setTopGroups(getTopGroups(allSources, 15));
        console.log(`🎯 FINAL: Set ${allSources.length} videos to state`);
        console.log('🎯 Sample of final videos:', allSources.slice(0, 3));
        addDebugLog(`🎯 FINAL: Set ${allSources.length} videos to state`);
        // Only auto-load first video if not resuming
        if (allSources.length > 0) {
          if (!resumeIntentRef.current) {
            setCurrentVideo(allSources[0]);
            console.log('🎬 VideoJSPlayer: Autoplaying first video');
          }
        } else {
          setCurrentVideo(null);
        }
      } catch (e) {
        console.error('Failed to load media sources:', e);
        setVideos([]);
        setCurrentVideo(null);
      } finally {
    // Only hide loading spinner if not casting
    if (!castContext?.isConnected) {
      setIsLoading(false);
    }
        console.log('📊 Sources fully loaded, setting sourcesLoaded to true');
        setSourcesLoaded(true); // Mark sources as fully loaded
        console.log('🎉 All media sources loading completed');
        addDebugLog('🎉 Media source loading completed - ready for category filtering');
      }
    }
    loadAllSources();
  }, [castContext?.isConnected]);

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Scroll to video player with 'V' key (but only if not casting)
      if (event.key.toLowerCase() === 'v' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const activeElement = document.activeElement;
        // Only if not typing in an input field
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          event.preventDefault();
          
          if (videoPlayerRef.current && !castContext?.isConnected) {
            const headerOffset = window.innerWidth < 768 ? 60 : 80;
            const videoPlayerTop = videoPlayerRef.current.offsetTop - headerOffset;
            
            window.scrollTo({
              top: videoPlayerTop,
              behavior: 'smooth'
            });
            
            console.log('⌨️ Scrolled to video player via keyboard shortcut');
          } else if (castContext?.isConnected) {
            console.log('📱 Skipping keyboard scroll - casting is active');
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [castContext?.isConnected]);

  // Cleanup web worker on component unmount
  useEffect(() => {
    return () => {
      try {
        terminateM3UParserWorker();
      } catch (error) {
        console.warn('Error terminating M3U parser worker:', error);
      }
    };
  }, []);

  // GSAP Title Animation Effect (similar to cast-demo)
  useEffect(() => {
    // --- Title Rain Animation ---
    if (titleRef.current) {
      // Add gsap-loaded class to make title container visible first
      titleRef.current.classList.add("gsap-loaded");

      // Split title into characters first
      const split = new SplitType(titleRef.current, { types: "chars" });
      const chars = titleRef.current.querySelectorAll(".char");

      // Set initial state for characters - use random opacity like the original working version
      gsap.set(chars, {
        opacity: 0,
        y: () => gsap.utils.random(-68, -23),
      });

      // Animate characters in
      gsap.to(chars, {
        opacity: 1,
        y: 0,
        stagger: {
          each: 0.09, // slower stagger
          from: "random",
        },
        duration: 1.2, // slower duration
        ease: "back.out(2)",
        delay: 0.3,
      });
    }

    // --- Subtitle Word Zoom Animation ---
    if (subtitleRef.current) {
      // Remove the hiding class and split subtitle into words
      subtitleRef.current.classList.remove("hero-subtitle-hidden");
      const split = new SplitType(subtitleRef.current, { types: "words" });
      const words = subtitleRef.current.querySelectorAll(".word");
      gsap.set(words, {
        opacity: 0,
        scale: 0.3,
        transformOrigin: "center center",
      });
      gsap.to(words, {
        opacity: 1,
        scale: 1,
        stagger: {
          each: 0.3, // slower stagger
          from: "start",
        },
        duration: 1.1, // slower duration
        ease: "back.out(2)",
        delay: 2.0, // shorter delay than cast-demo for quicker appearance
      });
    }
  }, []);

  // Initialize debug panel scroll behavior
  useEffect(() => {
    if (showDebugConsole) {
      const debugPanel = document.getElementById('debug-panel');
      if (debugPanel) {
        // Scroll to bottom initially to show latest messages
        setTimeout(() => {
          debugPanel.scrollTop = debugPanel.scrollHeight;
        }, 50);
      }
    }
  }, [showDebugConsole]);

  const sendCastLoadVideo = async (video: Video) => {
    if (!castContext?.isConnected) return;
    const message = {
      type: 'LOAD_VIDEO',
      payload: {
        src: video.src,
        title: video.title,
        poster: video.poster || video.m3uData?.logo,
        mimetype: video.mimetype,
        features: video.features,
        keySystems: video.keySystems,
        m3uData: video.m3uData,
      },
      metadata: {
        expectedAcknowledgment: true,
      },
    };
    try {
      await castContext.sendMessage(message);
      setShowCastOverlay(true);
    } catch (err) {
      console.error('Failed to send LOAD_VIDEO message:', err);
    }
  };

  const handleVideoSelect = (video: Video) => {
    // Log video selection to debug panel
    logVideoConnectionStart(video.src, video.title);
    
    // If it's a DASH stream, also parse the manifest for debug info
    if (video.src.includes('.mpd') || video.mimetype?.includes('dash')) {
      setTimeout(async () => {
        try {
          logDashParsingStart(video.src);
          const dashInfo = await testDashParsing(video.src);
          
          if (dashInfo.isValid) {
            logDashParsingSuccess(dashInfo);
            logDashManifestInfo(dashInfo);
          } else {
            logDashParsingError(dashInfo.error || 'Unknown error', video.src);
          }
        } catch (error) {
          logDashParsingError(error instanceof Error ? error.message : 'Parse error', video.src);
        }
      }, 500); // Small delay to not interfere with video loading
    }
    
    // Reset play state immediately when switching videos
    setIsPlaying(false);
    setCurrentVideo(video);

    // If casting, send LOAD_VIDEO message to receiver
    if (castContext?.isConnected) {
      sendCastLoadVideo(video);
    } else {
      // If not casting, enable autoplay for local player
      setTimeout(() => {
        setIsPlaying(true);
      }, 100); // Small delay to ensure video element is ready
    }
    
    setIsMediaSelected(true);
    setTimeout(() => {
      setIsMediaSelected(false);
    }, 3000);

    // Scroll to video player when video is selected (but only if not casting)
    if (videoPlayerRef.current && !castContext?.isConnected) {
      // Calculate optimal scroll position based on viewport
      const headerOffset = window.innerWidth < 768 ? 60 : 80; // Smaller offset for mobile
      const viewportHeight = window.innerHeight;
      const videoPlayerTop = videoPlayerRef.current.offsetTop;
      const videoPlayerHeight = videoPlayerRef.current.offsetHeight;
      
      // Ensure the video player is centered in viewport when possible
      let targetScrollTop = videoPlayerTop - headerOffset;
      
      // Adjust for mobile - ensure we don't scroll too high
      if (window.innerWidth < 768) {
        const centerPosition = videoPlayerTop - (viewportHeight - videoPlayerHeight) / 2;
        targetScrollTop = Math.max(centerPosition, videoPlayerTop - headerOffset);
      }
      
      // Smooth scroll to video player
      window.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
      
      // Add enhanced highlight effect to the video player container
      const videoContainer = videoPlayerRef.current.querySelector('.glass-morphism-large');
      if (videoContainer instanceof HTMLElement) {
        videoContainer.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        videoContainer.style.boxShadow = '0 0 40px rgba(57, 255, 20, 0.4), 0 0 80px rgba(57, 255, 20, 0.2)';
        videoContainer.style.transform = 'scale(1.02)';
        videoContainer.style.borderColor = 'rgba(57, 255, 20, 0.8)';
        
        // Remove highlight after animation
        setTimeout(() => {
          if (videoContainer) {
            videoContainer.style.boxShadow = '';
            videoContainer.style.transform = 'scale(1)';
            videoContainer.style.borderColor = '';
          }
        }, 2500);
      }
      
      // Provide haptic feedback on supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
    }
  };

  // Memoized callback for scrolling to library - prevents CategoryButtons re-render
  const handleScrollToLibrary = useCallback(() => {
    const libraryElement = document.querySelector('.video-library-section');
    libraryElement?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Resume functionality handlers
  const handleResumePlay = () => {
    if (resumeVideoId && videos.length > 0) {
      const videoToResume = videos.find(v => v.id === resumeVideoId);
      if (videoToResume) {
        handleVideoSelect(videoToResume);
      }
    }
    setShowResumeModal(false);
  };

  const handleResumeDiscard = () => {
    try {
      localStorage.removeItem('resume_media_demo');
    } catch {}
    setShowResumeModal(false);
    setResumeVideoId(null);
    setResumeVideoTitle('');
  };

  // Cast functionality handlers
  const handleCastButtonClick = async () => {
    if (!castContext) {
      console.warn('Cast context not available');
      return;
    }

    try {
      if (castContext.isConnected) {
        castContext.endSession();
      } else {
        await castContext.requestSession();
      }
    } catch {}
  };

  // Filter videos based on current filters
  const filteredVideos = React.useMemo(() => {
    let filtered = videos;

    // Filter by source type
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(video => {
        if (sourceFilter === 'json') return !video.m3uData;
        if (sourceFilter === 'm3u') return !!video.m3uData;
        if (sourceFilter === 'live') return video.features?.includes('live');
        if (sourceFilter === 'vod') return !video.features?.includes('live');
        return true;
      });
    }

    // Filter by M3U group
    if (selectedGroup !== 'all' && selectedGroup) {
      filtered = filtered.filter(video => 
        video.m3uData?.group === selectedGroup
      );
    }

    return filtered;
  }, [videos, sourceFilter, selectedGroup]);

  return (
    <main className="relative z-10 pt-20 pb-12">
  {/* Top group category links moved into Media Filter Controls */}
  <div className="min-h-screen relative">
        <ParticleBackground />
        <Navigation />

        <div className="max-w-7xl mx-auto px-4">
          {/* Header Section */}
          <section ref={heroRef} className="text-center mb-12">
            <h1
              ref={titleRef}
              className="text-2xl md:text-4xl font-bold text-gradient-active-green mb-3 leading-relaxed pb-1"
            >
              Adaptive Media Player
            </h1>
            <p
              ref={subtitleRef}
              className="text-base md:text-lg text-gray-300 mb-4 max-w-3xl mx-auto hero-subtitle-hidden"
            >
              HLS, MPEG-DASH, and live IPTV streams — powered by Video.js and Dash.js with
              Chromecast support, multi-source playlists, and real-time debug tooling.
            </p>
            
            {/* Accessibility shortcuts hint */}
            <p className="text-xs text-gray-500 -mb-2">
              💡 Press &apos;V&apos; to scroll to video player • Grid mode auto-scrolls on video selection
            </p>

            {/* Cast Status */}
            {castContext?.isConnected && (
              <div className="mt-4 inline-block">
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-sm bg-green-500/20 text-green-400 border-green-500/30"
                >
                  <Cast className="w-4 h-4 mr-2" />
                  Cast connected to: {castContext.currentDevice}
                </Badge>
                {/* Cast button */}
                {currentVideo && !isCasting && (
                  <button
                    className="ml-4 px-4 py-2 rounded bg-[#39FF14] text-black font-semibold shadow hover:bg-[#2ed60a] transition"
                    onClick={() => sendCastLoadVideo(currentVideo)}
                  >
                    <Cast className="w-4 h-4 mr-2 inline" />
                    Cast this video
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Media Filter Controls */}
          <section className="glass-morphism-large neon-glow-enhanced p-6 mb-8">
            {/* Main controls row - responsive layout */}
            <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
              {/* Only render the mobile/desktop source & debug controls if not loading */}
              {!isLoading && (
                <>
                  <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
                    {/* Source Type Filter - far right on mobile, will move below on large screens */}
                    <div className="flex items-center gap-2 flex-shrink-0 lg:hidden">
                      <label className="text-sm text-gray-300">Source:</label>
                      <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                        className="px-3 py-1 bg-[#23272b] text-white rounded border border-[#39FF14]/30 focus:border-[#39FF14] focus:outline-none text-sm"
                      >
                        <option value="all">All Sources</option>
                        <option value="json">Sample Videos</option>
                        <option value="m3u">IPTV Channels</option>
                        <option value="live">Live Streams</option>
                        <option value="vod">VOD Content</option>
                      </select>
                    </div>
                  </div>
                  {/* Debug Console Toggle - now below Source dropdown on mobile */}
                  <div className="flex items-center gap-2 flex-shrink-0 lg:hidden">
                    <label className="text-sm text-gray-300">Debug:</label>
                    <button
                      onClick={() => setShowDebugConsole(!showDebugConsole)}
                      className={`px-3 py-1 text-sm rounded border transition-colors ${
                        showDebugConsole
                          ? 'bg-[#39FF14] text-black border-[#39FF14]'
                          : 'bg-[#23272b] text-white border-[#39FF14]/30 hover:bg-[#39FF14]/20'
                      }`}
                    >
                      <Monitor size={16} className="inline mr-1" />
                      Console {showDebugConsole ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </>
              )}


              {/* Matrix-style Top Group Category Tabs */}
            {/* Show loading progress bar in place of categories while loading, then show categories */}
            {isLoading ? (
                <div className="flex items-center w-full gap-4 justify-center lg:justify-between min-h-[56px]">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Loader2 className="w-6 h-6 animate-spin text-[#39FF14] flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-300">Loading Categories...</span>
                        <span className="text-sm text-[#39FF14]">{loadingProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#39FF14] to-[#2ed60a] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${loadingProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {videos.length} sources loaded
                      </div>
                    </div>
                  </div>
                  {/* Right-aligned controls (only show during loading) */}
                  <div className="flex flex-col gap-2 flex-shrink-0 items-end min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-300">Source:</label>
                      <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                        className="px-3 py-1 bg-[#23272b] text-white rounded border border-[#39FF14]/30 focus:border-[#39FF14] focus:outline-none text-sm"
                      >
                        <option value="all">All Sources</option>
                        <option value="json">Sample Videos</option>
                        <option value="m3u">IPTV Channels</option>
                        <option value="live">Live Streams</option>
                        <option value="vod">VOD Content</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <label className="text-sm text-gray-300">Debug:</label>
                      <button
                        onClick={() => setShowDebugConsole(!showDebugConsole)}
                        className={`px-3 py-1 text-sm rounded border transition-colors ${
                          showDebugConsole
                            ? 'bg-[#39FF14] text-black border-[#39FF14]'
                            : 'bg-[#23272b] text-white border-[#39FF14]/30 hover:bg-[#39FF14]/20'
                        }`}
                      >
                        <Monitor size={16} className="inline mr-1" />
                        Console {showDebugConsole ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </div>
            ) : (
              topGroups.length > 0 && (
                <div className="w-full flex flex-wrap justify-center gap-3 mb-2 mt-3">
                  {topGroups.map(groupRaw => {
                    const isUndefined = !groupRaw || String(groupRaw).toLowerCase() === 'undefined';
                    const group = isUndefined ? 'Random' : groupRaw;
                    return (
                      <button
                        key={isUndefined ? 'random' : groupRaw}
                        className={`matrix-glass-tab px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 shadow-md backdrop-blur-md
                          ${selectedGroup === groupRaw
                            ? 'bg-[#39FF14]/80 border-[#39FF14] text-black shadow-[0_0_16px_#39FF14cc]'
                            : 'bg-[#181c1f]/60 border-[#39FF14]/30 text-[#39FF14] hover:bg-[#23272b]/80 hover:border-[#39FF14]/60'}
                        `}
                        style={{letterSpacing: '0.01em'}}
                        onClick={() => {
                          setSelectedGroup(groupRaw);
                          setTimeout(() => {
                            if (videoLibraryRef.current) {
                              // Scroll so the video library is well below the sticky nav and header
                              const rect = videoLibraryRef.current.getBoundingClientRect();
                              const scrollTop = window.scrollY + rect.top - 100; // 100px offset for header/nav
                              window.scrollTo({ top: scrollTop, behavior: 'smooth' });
                            }
                          }, 10);
                        }}
                      >
                        <span className="drop-shadow-[0_1px_2px_#39FF1480]">{group}</span>
                      </button>
                    );
                  })}
                </div>
              )
            )}

              {/* Source Type Filter - far right on desktop */}
              {!isLoading && (
                <div className="hidden lg:flex flex-col gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-300">Source:</label>
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                      className="px-3 py-1 bg-[#23272b] text-white rounded border border-[#39FF14]/30 focus:border-[#39FF14] focus:outline-none text-sm"
                    >
                      <option value="all">All Sources</option>
                      <option value="json">Sample Videos</option>
                      <option value="m3u">IPTV Channels</option>
                      <option value="live">Live Streams</option>
                      <option value="vod">VOD Content</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-sm text-gray-300">Debug:</label>
                    <button
                      onClick={() => setShowDebugConsole(!showDebugConsole)}
                      className={`px-3 py-1 text-sm rounded border transition-colors ${
                        showDebugConsole
                          ? 'bg-[#39FF14] text-black border-[#39FF14]'
                          : 'bg-[#23272b] text-white border-[#39FF14]/30 hover:bg-[#39FF14]/20'
                      }`}
                    >
                      <Monitor size={16} className="inline mr-1" />
                      Console {showDebugConsole ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </section>

          {/* Main Video Player Section */}
          {/* Centered layout with library below and debug console on left */}
          <div className="flex justify-center mb-8" ref={videoPlayerRef}>
            <div
              className={`w-full max-w-5xl transition-all duration-500 ${
                isMediaSelected
                  ? "relative z-50 transform scale-102 shadow-2xl shadow-[#39FF14]/20"
                  : "relative z-10"
              }`}
            >
              <div className={`flex ${showDebugConsole ? 'gap-4' : ''}`}>
                {/* Debug Console Sidebar - Always left of video player when toggled */}
                {showDebugConsole && (
                  <div className="w-80 min-w-0 h-[410px]">
                    <div className="glass-morphism-large neon-glow-enhanced p-4 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-[#39FF14]">🔧 Debug Console</h3>
                        <div className="flex gap-1">
                          <button 
                            onClick={async () => {
                              addDebugLog('🔄 Manual M3U test started...');
                              const testContent = `#EXTM3U
#EXTINF:-1 tvg-id="test" tvg-logo="" group-title="Test",Test Channel
https://test.example.com/stream.m3u8`;
                              const parser = parseM3UChunked(testContent, 10);
                              const result = parser.next();
                              addDebugLog(`✅ Manual test: ${result.value?.entries?.length || 0} entries`);
                              if (result.value?.entries) {
                                const testVideos = convertM3UToVideos(result.value.entries);
                                addDebugLog(`✅ Converted to ${testVideos.length} videos`);
                                console.log('Manual test videos:', testVideos);
                              }
                            }}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                          >
                            M3U
                          </button>
                          <button 
                            onClick={async () => {
                              const testDashUrl = 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd';
                              logDashParsingStart(testDashUrl);
                              
                              try {
                                const result = await testDashParsing(testDashUrl);
                                
                                if (result.isValid) {
                                  logDashParsingSuccess(result);
                                  logDashManifestInfo(result);
                                } else {
                                  logDashParsingError(result.error || 'Unknown error', testDashUrl);
                                }
                              } catch (error) {
                                logDashParsingError(error instanceof Error ? error.message : 'Unknown error', testDashUrl);
                              }
                            }}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                          >
                            DASH
                          </button>
                          <button 
                            onClick={() => {
                              if (currentVideo) {
                                addVideoDebugLog(`🔄 Manual video connection test started for: ${currentVideo.src}`, currentVideo.title);
                                const videoEl = document.querySelector('video');
                                if (videoEl) {
                                  videoEl.load();
                                }
                              } else {
                                addDebugLog('❌ No video selected for testing');
                              }
                            }}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                          >
                            Video
                          </button>
                          <button 
                            onClick={() => {
                              const panel = document.getElementById('debug-panel');
                              if (panel) {
                                panel.innerHTML = '';
                                // Reset scroll position to bottom after clearing
                                setTimeout(() => {
                                  panel.scrollTop = panel.scrollHeight;
                                }, 10);
                              }
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-300 mb-2">
                        Videos: {videos.length} | Loading: {isLoading ? 'Yes' : 'No'} | Current: {currentVideo?.title?.substring(0, 20) || 'None'}...
                      </div>
                      <div 
                        id="debug-panel" 
                        className="bg-black bg-opacity-50 p-3 rounded-lg font-mono text-xs text-green-400 flex-1 overflow-y-auto matrix-debug-scrollbar"
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        Video debug output will appear here...
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Player */}
                <div className={`${showDebugConsole ? 'flex-1' : 'w-full'}`}>
                  <div className="glass-morphism-large neon-glow-enhanced p-6 relative">
                    {/* Cast Button Overlay - Top Right Corner */}
                    {castContext?.isAvailable && (
                      <button
                        onClick={handleCastButtonClick}
                        className={`absolute top-4 right-4 z-50 group p-3 rounded-full border-2 transition-all duration-300 transform hover:scale-110 ${
                          castContext.isConnected 
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 border-yellow-500 text-black shadow-lg shadow-yellow-500/40 hover:shadow-yellow-500/60' 
                            : 'bg-gradient-to-r from-yellow-500 to-amber-500 border-yellow-400 text-black shadow-lg shadow-yellow-400/40 hover:shadow-yellow-400/60 hover:from-yellow-400 hover:to-amber-400'
                        }`}
                        title={castContext.isConnected ? `Disconnect from ${castContext.currentDevice}` : 'Cast video to Chromecast device'}
                      >
                        <Cast className={`w-5 h-5 transition-transform duration-300 ${castContext.isConnected ? 'animate-pulse' : 'group-hover:rotate-12'}`} />
                        
                        {/* Golden glow effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/30 to-amber-500/30 blur-lg scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Connected indicator dot */}
                        {castContext.isConnected && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
                        )}
                      </button>
                    )}

                    {/* Unified player: supports Twitch, HLS, MP4, etc. */}
                    <div className="w-full max-w-[960px] mx-auto">
                      <UnifiedPlayer
                        url={currentVideo?.src || ''}
                        poster={currentVideo?.poster || currentVideo?.m3uData?.logo}
                        autoPlay={!!currentVideo && isPlaying}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        width="100%"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Library Below */}
          <div className="flex justify-center mb-8 video-library-section" ref={videoLibraryRef}>
            <div className="w-full max-w-5xl">
              <VideoLibrary
                videos={filteredVideos}
                currentVideo={currentVideo}
                onVideoSelect={handleVideoSelect}
                layout="grid"
              />
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16 glass-morphism-large neon-glow-enhanced p-8">
            <h2 className="text-xl font-bold text-center text-gradient-active mb-8">
              Under the Hood
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Video,
                  title: "HLS & MPEG-DASH Adaptive",
                  description: "Video.js + Dash.js handle adaptive bitrate streams — live and on-demand — with quality-level switching and buffer metrics.",
                },
                {
                  icon: List,
                  title: "Multi-Source M3U Playlists",
                  description: "Chunked M3U parser with optional Web Worker offloading keeps the UI responsive while loading thousands of IPTV channels.",
                },
                {
                  icon: Cast,
                  title: "Chromecast Integration",
                  description: "Cast SDK sends the active stream to any Google Cast device. Remote playback state, timeline sync, and auto-load on connect.",
                },
              ].map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-[#181c1f] to-[#23272b] border border-[#39FF14]/20 rounded-xl p-6 text-center hover:border-[#39FF14]/40 transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-[#39FF14]/15 to-[#2ed60a]/15 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-[#39FF14]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gradient-active mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#0f1419]/80 to-[#1a1f24]/80 border border-[#39FF14]/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#39FF14] mb-4 flex items-center">
                <Monitor className="w-5 h-5 mr-2" />
                Player Capabilities
              </h3>
              <div className="mb-4 text-xs text-gray-400">
                IPTV channel data powered by <a href="https://github.com/iptv-org/iptv" target="_blank" rel="noopener noreferrer" className="underline text-[#39FF14]">iptv-org/iptv</a>.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div>
                  <h4 className="font-medium text-white mb-2">Key Features:</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Live & VOD:</strong> Supports live linear streams and on-demand content</li>
                    <li>• <strong>Resume Playback:</strong> Resume last-watched content with overlay prompt</li>
                    <li>• <strong>Popular Categories:</strong> Top group/category quick links for fast navigation</li>
                    <li>• <strong>Matrix Glass UI:</strong> Modern glassmorphism and neon effects</li>
                    <li>• <strong>Debug Console:</strong> Real-time video/network debug output</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Player & Controls:</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Flexible Controls:</strong> Inside, outside, overlay, and side-mounted layouts</li>
                    <li>• <strong>Live Timeline:</strong> Seek to live, auto-detect buffer, disables scrubbing if not allowed</li>
                    <li>• <strong>Volume & Quality:</strong> Visual volume slider, mute toggle, HLS quality/bandwidth switcher</li>
                    <li>• <strong>Casting Support:</strong> Cast to Chromecast/Google Cast devices with remote timeline sync</li>
                    <li>• <strong>Settings:</strong> Control positioning, auto-hide, and theme options</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

      <footer className="pt-10 text-center text-gray-400 relative z-10">
        <div className="max-w-4xl mx-auto px-4">
          <p>&copy; 2026 WSP - Senior Software Engineer. All rights reserved.</p>
          <p className="m-2 text-sm">
            Built with Next.js, TypeScript, GSAP, and Tailwind CSS
          </p>
        </div>
      </footer>


      {/* Resume Modal */}
      {/* <ResumeModal
        isOpen={showResumeModal}
        onResume={handleResumePlay}
        onDismiss={handleResumeDiscard}
        videoTitle={resumeVideoTitle}
      /> */}
      {/* Close min-h-screen container */}
      </div>
    </main>
  );
}
