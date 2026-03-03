'use client';

import React, { useEffect, useState } from 'react';
import { useCast } from '@/contexts/CastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX,
  Loader2,
  AlertCircle,
  Monitor,
  Clock,
  SkipBack,
  SkipForward,
  Maximize,
  RotateCcw
} from 'lucide-react';

interface MediaStatusDisplayProps {
  className?: string;
}

interface MediaStatus {
  currentTime: number;
  duration: number;
  playbackRate: number;
  playerState: 'IDLE' | 'PLAYING' | 'PAUSED' | 'BUFFERING';
  volume: {
    level: number;
    muted: boolean;
  };
}

interface MediaEvent {
  eventType: string;
  currentTime: number;
  duration: number;
  error?: string;
  seekTime?: number;
  volume?: number;
  playbackRate?: number;
}

export const MediaStatusDisplay: React.FC<MediaStatusDisplayProps> = ({ className }) => {
  const { mediaStatus, addMessageListener, isConnected, sendMessage } = useCast();
  const [lastEvent, setLastEvent] = useState<MediaEvent | null>(null);
  const [statusHistory, setStatusHistory] = useState<(MediaStatus | MediaEvent)[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [forceControlsVisible, setForceControlsVisible] = useState(false);

  // Listen for media messages from receiver
  useEffect(() => {
    const unsubscribe = addMessageListener((message: any) => {
      if (message.type === 'MEDIA_STATUS') {
        console.log('📺 Media Status Update:', message.payload);
        setIsVisible(true);
        setShowControls(true);
        
        // Add to history
        setStatusHistory(prev => [...prev.slice(-9), message.payload]);
      } else if (message.type === 'MEDIA_EVENT') {
        console.log('📺 Media Event:', message.payload);
        setLastEvent(message.payload);
        setIsVisible(true);
        setShowControls(true);
        
        // Add to history
        setStatusHistory(prev => [...prev.slice(-9), message.payload]);
      } else if (message.type === 'LOAD_VIDEO') {
        // When video loads, show debug controls immediately
        console.log('📺 Video Load Detected - Enabling Debug Controls');
        setIsVisible(true);
        setForceControlsVisible(true);
        setDebugMode(true);
      }
    });

    return unsubscribe;
  }, [addMessageListener]);

  // Listen for video load events from VideoControl
  useEffect(() => {
    const handleVideoLoadSent = () => {
      console.log('📺 Video load sent - enabling debug controls');
      setIsVisible(true);
      setForceControlsVisible(true);
      setDebugMode(true);
    };

    window.addEventListener('videoLoadSent', handleVideoLoadSent);
    return () => window.removeEventListener('videoLoadSent', handleVideoLoadSent);
  }, []);

  // Auto-hide after inactivity (but not if debug mode is active)
  useEffect(() => {
    if (isVisible && !debugMode && !forceControlsVisible && (!mediaStatus || mediaStatus.playerState === 'IDLE')) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000); // Hide after 10 seconds of inactivity
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, mediaStatus, debugMode, forceControlsVisible]);

  // Media control functions
  const handlePlayPause = async () => {
    if (!mediaStatus) return;
    
    const action = mediaStatus.playerState === 'PLAYING' ? 'pause' : 'play';
    try {
      await sendMessage({
        type: 'MEDIA_CONTROL',
        payload: {
          action,
          timestamp: Date.now()
        }
      });
    } catch (err) {
      console.error('Failed to send media control:', err);
    }
  };

  const handleStop = async () => {
    try {
      await sendMessage({
        type: 'MEDIA_CONTROL',
        payload: {
          action: 'stop',
          timestamp: Date.now()
        }
      });
    } catch (err) {
      console.error('Failed to stop media:', err);
    }
  };

  const handleSeek = async (time: number) => {
    try {
      await sendMessage({
        type: 'MEDIA_CONTROL',
        payload: {
          action: 'seek',
          seekTime: time,
          timestamp: Date.now()
        }
      });
    } catch (err) {
      console.error('Failed to seek media:', err);
    }
  };

  const handleVolumeChange = async (volume: number) => {
    try {
      await sendMessage({
        type: 'MEDIA_CONTROL',
        payload: {
          action: 'volume',
          volume: volume / 100,
          timestamp: Date.now()
        }
      });
    } catch (err) {
      console.error('Failed to change volume:', err);
    }
  };

  const handleMuteToggle = async () => {
    if (!mediaStatus?.volume) return;
    
    try {
      await sendMessage({
        type: 'MEDIA_CONTROL',
        payload: {
          action: mediaStatus.volume.muted ? 'unmute' : 'mute',
          timestamp: Date.now()
        }
      });
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  };

  // Debug control functions - these force events regardless of current state
  const forcePlay = async () => {
    try {
      await sendMessage({
        type: 'MEDIA_CONTROL',
        payload: {
          action: 'play',
          force: true,
          debug: true,
          timestamp: Date.now()
        }
      });
      console.log('🎮 DEBUG: Forced PLAY command sent');
    } catch (err) {
      console.error('Failed to force play:', err);
    }
  };

  const forcePause = async () => {
    try {
      await sendMessage({
        type: 'MEDIA_CONTROL',
        payload: {
          action: 'pause',
          force: true,
          debug: true,
          timestamp: Date.now()
        }
      });
      console.log('🎮 DEBUG: Forced PAUSE command sent');
    } catch (err) {
      console.error('Failed to force pause:', err);
    }
  };

  const forceSeekTo = async (seconds: number) => {
    try {
      await sendMessage({
        type: 'MEDIA_CONTROL',
        payload: {
          action: 'seek',
          seekTime: seconds,
          force: true,
          debug: true,
          timestamp: Date.now()
        }
      });
      console.log(`🎮 DEBUG: Forced SEEK to ${seconds}s command sent`);
    } catch (err) {
      console.error('Failed to force seek:', err);
    }
  };

  const forceVolumeSet = async (volume: number) => {
    try {
      await sendMessage({
        type: 'MEDIA_CONTROL',
        payload: {
          action: 'volume',
          volume: volume / 100,
          force: true,
          debug: true,
          timestamp: Date.now()
        }
      });
      console.log(`🎮 DEBUG: Forced VOLUME to ${volume}% command sent`);
    } catch (err) {
      console.error('Failed to force volume:', err);
    }
  };

  const forceRestart = async () => {
    try {
      await sendMessage({
        type: 'MEDIA_CONTROL',
        payload: {
          action: 'seek',
          seekTime: 0,
          force: true,
          debug: true,
          timestamp: Date.now()
        }
      });
      await forcePlay();
      console.log('🎮 DEBUG: Forced RESTART (seek to 0 + play) commands sent');
    } catch (err) {
      console.error('Failed to force restart:', err);
    }
  };

  const sendCustomMediaCommand = async (command: string) => {
    try {
      await sendMessage({
        type: 'MEDIA_CONTROL',
        payload: {
          action: command,
          force: true,
          debug: true,
          timestamp: Date.now()
        }
      });
      console.log(`🎮 DEBUG: Custom command "${command}" sent`);
    } catch (err) {
      console.error(`Failed to send custom command "${command}":`, err);
    }
  };

  if (!isConnected) {
    return null;
  }

  const formatTime = (seconds: number) => {
    if (!seconds || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlayerStateIcon = (state: string) => {
    switch (state) {
      case 'PLAYING':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'PAUSED':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'BUFFERING':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'IDLE':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getPlayerStateColor = (state: string) => {
    switch (state) {
      case 'PLAYING':
        return 'default';
      case 'PAUSED':
        return 'secondary';
      case 'BUFFERING':
        return 'outline';
      case 'IDLE':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const progress = mediaStatus?.duration > 0 
    ? Math.min(100, Math.max(0, (mediaStatus.currentTime / mediaStatus.duration) * 100))
    : 0;

  return (
    <div className="h-full flex flex-col text-white">
      {/* Compact Header for Bottom Panel */}
      <div className="flex-shrink-0 mb-1">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-white flex items-center gap-2">
            <Monitor className="h-4 w-4 text-[#39FF14]" />
            Receiver Media Status
          </span>
          {(debugMode || forceControlsVisible) && (
            <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10 text-xs">
              🎮 DEBUG
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content Area - Scrollable but more compact */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Current Media Status */}
        {mediaStatus && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getPlayerStateIcon(mediaStatus.playerState)}
                <Badge 
                  variant={getPlayerStateColor(mediaStatus.playerState)}
                  className="bg-black/20 border-white/20 text-white text-xs"
                >
                  {mediaStatus.playerState}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                {mediaStatus.volume?.muted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                <span>{Math.round((mediaStatus.volume?.level || 0) * 100)}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            {mediaStatus.duration > 0 && (
              <div className="space-y-1">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div 
                    className="h-full bg-[#39FF14] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/60">
                  <span>{formatTime(mediaStatus.currentTime)}</span>
                  <span>{formatTime(mediaStatus.duration)}</span>
                </div>
              </div>
            )}

            {/* Playback Rate */}
            {mediaStatus.playbackRate !== 1 && (
              <div className="flex items-center gap-2 text-sm text-white">
                <Clock className="h-4 w-4" />
                <span>Speed: {mediaStatus.playbackRate}x</span>
              </div>
            )}

            {/* Standard Media Controls - Compact Version */}
            {showControls && mediaStatus && (
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSeek(Math.max(0, mediaStatus.currentTime - 10))}
                    disabled={!mediaStatus.duration}
                    className="bg-black/20 border-white/10 text-white hover:bg-white/10 hover:border-white/20 h-8 w-8 p-0"
                  >
                    <SkipBack className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handlePlayPause}
                    disabled={mediaStatus.playerState === 'BUFFERING'}
                    className="bg-[#39FF14]/20 border-[#39FF14]/30 text-[#39FF14] hover:bg-[#39FF14]/30 hover:border-[#39FF14]/50 h-8 w-8 p-0"
                  >
                    {mediaStatus.playerState === 'PLAYING' ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSeek(Math.min(mediaStatus.duration, mediaStatus.currentTime + 10))}
                    disabled={!mediaStatus.duration}
                    className="bg-black/20 border-white/10 text-white hover:bg-white/10 hover:border-white/20 h-8 w-8 p-0"
                  >
                    <SkipForward className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStop}
                    className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 hover:border-red-500/50 h-8 w-8 p-0"
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                </div>

                {/* Volume Control - Compact */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleMuteToggle}
                    className="p-1 text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
                  >
                    {mediaStatus.volume?.muted ? (
                      <VolumeX className="h-3 w-3" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                  </Button>
                  <Slider
                    value={[mediaStatus.volume?.muted ? 0 : (mediaStatus.volume?.level || 0) * 100]}
                    max={100}
                    step={1}
                    onValueChange={(value) => handleVolumeChange(value[0])}
                    className="flex-1"
                  />
                  <span className="text-xs text-white/60 w-10 text-right">
                    {Math.round((mediaStatus.volume?.level || 0) * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Debug Media Control Panel - Collapsible */}
            {(debugMode || forceControlsVisible) && (
              <div className="space-y-4 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10 text-xs">
                      🎮 DEBUG MODE
                    </Badge>
                    <span className="text-xs text-white/60">
                      Force controls
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDebugMode(!debugMode);
                      setForceControlsVisible(!forceControlsVisible);
                    }}
                    className="text-white/60 hover:text-white hover:bg-white/10 h-7 text-xs"
                  >
                    {debugMode ? 'Hide' : 'Show'}
                  </Button>
                </div>

                {/* Compact Force Control Buttons */}
                <div className="grid grid-cols-4 gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={forcePlay}
                    className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 hover:border-green-500/50 h-8 text-xs p-1"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={forcePause}
                    className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 hover:border-yellow-500/50 h-8 text-xs p-1"
                  >
                    <Pause className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={forceRestart}
                    className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30 hover:border-blue-500/50 h-8 text-xs p-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => forceSeekTo(30)}
                    className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30 hover:border-purple-500/50 h-8 text-xs p-1"
                  >
                    <SkipForward className="h-3 w-3" />
                  </Button>
                </div>

                {/* Quick Seek - Compact */}
                <div className="grid grid-cols-8 gap-1">
                  {[0, 10, 30, 60, 120, 300, 600, 900].map((seconds) => (
                    <Button
                      key={seconds}
                      size="sm"
                      variant="ghost"
                      onClick={() => forceSeekTo(seconds)}
                      className="text-xs h-6 bg-black/20 text-white/80 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20 p-0"
                    >
                      {seconds === 0 ? '0' : `${seconds}s`}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Last Event - Compact */}
        {lastEvent && (
          <div className="pt-3 border-t border-white/10">
            <div className="text-sm">
              <div className="font-medium text-white text-sm">
                Last: {lastEvent.eventType}
              </div>
              {lastEvent.error && (
                <div className="flex items-center gap-1 mt-1 text-red-400 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>{lastEvent.error}</span>
                </div>
              )}
              {lastEvent.seekTime !== undefined && (
                <div className="text-xs text-white/60 mt-1">
                  Seek: {formatTime(lastEvent.seekTime)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status History - Compact */}
        {statusHistory.length > 0 && (
          <div className="pt-3 border-t border-white/10">
            <div className="text-xs font-medium text-white mb-2">
              Recent ({statusHistory.length})
            </div>
            <div className="space-y-1 max-h-16 overflow-y-auto">
              {statusHistory.slice(-2).reverse().map((item, index) => (
                <div key={index} className="text-xs text-white/60">
                  {'eventType' in item ? (
                    <span>📝 {item.eventType}</span>
                  ) : (
                    <span>📊 {item.playerState} - {formatTime(item.currentTime)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enable Debug Section - Fixed at Bottom - Compact */}
      {(!isVisible && !forceControlsVisible) && (
        <div className="flex-shrink-0 mt-4 pt-3 border-t border-white/10">
          <div className="bg-black/20 border border-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Monitor className="h-4 w-4" />
                <span>Waiting for media status...</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsVisible(true);
                  setForceControlsVisible(true);
                  setDebugMode(true);
                }}
                disabled={!isConnected}
                className="bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30 hover:border-orange-500/50 transition-all duration-200 h-8 text-xs"
              >
                🎮 Enable Debug
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaStatusDisplay;
