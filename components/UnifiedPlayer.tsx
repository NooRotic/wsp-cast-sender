import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { detectURLType, getRecommendedPlayer, getURLTypeDisplayName, URLDetectionResult } from '@/lib/urlDetection';
import { Monitor, AlertCircle, Play, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Dynamic imports to prevent SSR issues
const VideoJSPlayer = dynamic(() => import('./VideoJSPlayer'), { ssr: false });
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });
const DashJSPlayer = dynamic(() => import('./DashJSPlayer'), { ssr: false });

// Simple wrapper for VideoJSPlayer to match unified interface
interface VideoJSPlayerWrapperProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  controls?: boolean;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: any) => void;
}

const VideoJSPlayerWrapper: React.FC<VideoJSPlayerWrapperProps> = ({
  src,
  poster,
  autoPlay = false,
  controls = true,
  onReady,
  onPlay,
  onPause,
  onError,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [settings, setSettings] = useState({
    controlPosition: 'inside' as const,
    autoHide: true,
    theme: 'dark' as const,
  });

  const handlePlayStateChange = (playing: boolean) => {
    setIsPlaying(playing);
    if (playing) {
      onPlay?.();
    } else {
      onPause?.();
    }
  };

  const handleSettingsChange = (newSettings: any) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  useEffect(() => {
    if (onReady) {
      // Simulate ready after a short delay
      const timer = setTimeout(() => onReady(), 100);
      return () => clearTimeout(timer);
    }
  }, [onReady]);

  return (
    <VideoJSPlayer
      src={src}
      poster={poster}
      title={src.split('/').pop() || 'Video'}
      isPlaying={isPlaying}
      onPlayStateChange={handlePlayStateChange}
      settings={settings}
      onSettingsChange={handleSettingsChange}
      muted={false}
    />
  );
};

export interface UnifiedPlayerProps {
  url: string;
  poster?: string;
  autoPlay?: boolean;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: any) => void;
  showDebugInfo?: boolean;
}

export default function UnifiedPlayer({
  url,
  poster,
  autoPlay = false,
  controls = true,
  width = '100%',
  height,
  className = '',
  onReady,
  onPlay,
  onPause,
  onError,
  showDebugInfo = true,
}: UnifiedPlayerProps) {
  const [urlResult, setUrlResult] = useState<URLDetectionResult | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<'videojs' | 'reactplayer' | 'dashjs' | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [reactPlayerMounted, setReactPlayerMounted] = useState(false);
  const [delayedUrl, setDelayedUrl] = useState<string>('');
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Detect URL type and recommended player
  useEffect(() => {
    if (!url) {
      setUrlResult(null);
      setSelectedPlayer(null);
      setPlayerError(null);
      return;
    }

    console.log('[UnifiedPlayer] Analyzing URL:', url);
    
    const result = detectURLType(url);
    const recommendedPlayer = getRecommendedPlayer(result);
    
    console.log('[UnifiedPlayer] Detection result:', {
      type: result.type,
      platform: result.platform,
      recommendedPlayer,
      metadata: result.metadata,
    });

    setUrlResult(result);
    setSelectedPlayer(recommendedPlayer);
    setPlayerError(null);
    setIsPlayerReady(false);
    
    // Reset ReactPlayer state when URL changes
    if (recommendedPlayer === 'reactplayer') {
      setReactPlayerMounted(false);
      setDelayedUrl('');
    }
  }, [url]);

  // Handle delayed ReactPlayer URL loading
  useEffect(() => {
    if (selectedPlayer === 'reactplayer' && url && reactPlayerMounted) {
      console.log('[UnifiedPlayer] Setting up delayed ReactPlayer URL loading...');
      const timeoutId = setTimeout(() => {
        console.log('[UnifiedPlayer] Loading ReactPlayer URL after delay:', url);
        setDelayedUrl(url);
      }, 2000); // 2 second delay

      return () => {
        clearTimeout(timeoutId);
      };
    } else if (selectedPlayer !== 'reactplayer') {
      // Reset ReactPlayer state when switching away
      setDelayedUrl('');
      setReactPlayerMounted(false);
    }
  }, [selectedPlayer, url, reactPlayerMounted]);

  // Handle player ready callback
  const handlePlayerReady = useCallback(() => {
    setIsPlayerReady(true);
    onReady?.();
  }, [onReady]);

  // Handle player error
  const handlePlayerError = useCallback((error: any) => {
    console.error('[UnifiedPlayer] Player error:', error);
    setPlayerError(error?.message || 'Player error occurred');
    onError?.(error);
  }, [onError]);

  // Manual player override functions
  const switchToVideoJS = () => setSelectedPlayer('videojs');
  const switchToReactPlayer = () => setSelectedPlayer('reactplayer');
  const switchToDashJS = () => setSelectedPlayer('dashjs');

  // Render appropriate player based on selection
  const renderPlayer = () => {
    if (!url || !selectedPlayer) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>No media source provided</p>
          </div>
        </div>
      );
    }

    const playerStyle = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: height ? (typeof height === 'number' ? `${height}px` : height) : '100%',
    };

    try {
      switch (selectedPlayer) {
        case 'reactplayer':
          const ReactPlayerComponent = ReactPlayer as any;
          return (
            <ReactPlayerComponent
              key={`reactplayer-${url}`}
              url={delayedUrl || ''} // Use delayed URL
              controls={controls}
              playing={autoPlay}
              width={playerStyle.width}
              height={playerStyle.height}
              ref={(ref: any) => {
                if (ref && !reactPlayerMounted) {
                  console.log('[UnifiedPlayer] ReactPlayer mounted');
                  setReactPlayerMounted(true);
                }
              }}
              config={(() => {
                if (typeof window === 'undefined') return {};
                const parent = window.location.hostname;
                return {
                  twitch: {
                    options: {
                      parent: [parent],
                    },
                  },
                };
              })()}
              onStart={() => {
                console.log('[UnifiedPlayer] ReactPlayer started');
                setIsPlayerReady(true);
                onReady?.();
              }}
              onPlay={() => {
                console.log('[UnifiedPlayer] ReactPlayer playing');
                onPlay?.();
              }}
              onPause={() => {
                console.log('[UnifiedPlayer] ReactPlayer paused');
                onPause?.();
              }}
              onError={(error: any) => {
                console.error('[UnifiedPlayer] ReactPlayer error:', error);
                handlePlayerError(error);
              }}
            />
          );

        case 'dashjs':
          return (
            <DashJSPlayer
              key={`dashjs-${url}`}
              url={urlResult?.playableUrl || url}
              poster={poster}
              autoPlay={autoPlay}
              width={playerStyle.width}
              height={playerStyle.height}
              controls={controls}
              onEnded={() => {}} // DashJS only has onEnded
            />
          );

        case 'videojs':
        default:
          // VideoJSPlayer has a different interface, need a wrapper
          return (
            <VideoJSPlayerWrapper
              key={`videojs-${url}`}
              src={urlResult?.playableUrl || url}
              poster={poster}
              autoPlay={autoPlay}
              controls={controls}
              onReady={handlePlayerReady}
              onPlay={onPlay}
              onPause={onPause}
              onError={handlePlayerError}
            />
          );
      }
    } catch (error) {
      console.error('[UnifiedPlayer] Render error:', error);
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 text-red-400">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Failed to load player</p>
            <p className="text-xs mt-1">{String(error)}</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`unified-player ${className}`} ref={playerContainerRef}>
      {/* Debug Info Header */}
      {showDebugInfo && urlResult && (
        <div className="mb-3 p-3 bg-black/30 rounded-lg border border-[#39FF14]/20">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className={`px-2 py-1 text-xs ${
                urlResult.type === 'twitch'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : urlResult.type === 'hls'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : urlResult.type === 'dash'
                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                  : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
              }`}
            >
              {getURLTypeDisplayName(urlResult)}
            </Badge>
            
            <Badge
              variant="outline"
              className="px-2 py-1 text-xs bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30"
            >
              Using: {selectedPlayer?.toUpperCase()}
            </Badge>

            {urlResult.metadata?.clipId && (
              <Badge variant="outline" className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                Clip: {urlResult.metadata.clipId}
              </Badge>
            )}

            {urlResult.metadata?.channelName && (
              <Badge variant="outline" className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                Channel: {urlResult.metadata.channelName}
              </Badge>
            )}
          </div>

          {/* Player Switch Controls */}
          <div className="flex gap-1">
            <button
              onClick={switchToVideoJS}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedPlayer === 'videojs'
                  ? 'bg-[#39FF14] text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Video.js
            </button>
            <button
              onClick={switchToReactPlayer}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedPlayer === 'reactplayer'
                  ? 'bg-[#39FF14] text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              ReactPlayer
            </button>
            <button
              onClick={switchToDashJS}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedPlayer === 'dashjs'
                  ? 'bg-[#39FF14] text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Dash.js
            </button>
            {urlResult.type === 'twitch' && (
              <a
                href={urlResult.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 text-xs rounded bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Open on Twitch
              </a>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {playerError && (
        <div className="mb-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Player Error: {playerError}</span>
          </div>
        </div>
      )}

      {/* Player Container — aspect-video (16:9) unless an explicit height is passed */}
      <div
        className={`relative bg-black rounded-lg overflow-hidden ${!height ? 'aspect-video' : ''}`}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          ...(height ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
        }}
      >
        {renderPlayer()}
        
        {/* Loading Indicator */}
        {!isPlayerReady && url && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex items-center gap-2 text-[#39FF14]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#39FF14]"></div>
              <span className="text-sm">Loading {selectedPlayer?.toUpperCase()}...</span>
            </div>
          </div>
        )}
      </div>

      {/* URL Display */}
      {showDebugInfo && url && (
        <div className="mt-2 p-2 bg-black/20 rounded text-xs text-gray-400 font-mono">
          <strong>Source:</strong> {url.length > 80 ? `${url.substring(0, 80)}...` : url}
        </div>
      )}
    </div>
  );
}
