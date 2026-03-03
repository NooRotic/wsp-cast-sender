import React, { useState, useEffect, useRef } from 'react';
import { useCast } from '@/contexts/CastContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { 
  VideoIcon, 
  PlayIcon, 
  PauseIcon, 
  SquareIcon, 
  VolumeIcon, 
  Volume2Icon, 
  VolumeXIcon,
  SkipBackIcon,
  SkipForwardIcon,
  MaximizeIcon,
  SettingsIcon,
  Link2Icon,
  MonitorIcon,
  CastIcon
} from 'lucide-react';

interface VideoData {
  videoUrl: string;
  title?: string;
  poster?: string;
  authToken?: string;
  autoPlay?: boolean;
  subtitles?: Array<{
    src: string;
    label: string;
    language: string;
    kind?: 'subtitles' | 'captions';
  }>;
}

interface MediaState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  loadingProgress: number;
  isBuffering: boolean;
  videoInfo?: {
    width: number;
    height: number;
    bitrate: number;
  };
}

interface VideoMediaCardProps {
  onLaunchVideo: (videoData: VideoData) => void;
  className?: string;
}

export const VideoMediaCard: React.FC<VideoMediaCardProps> = ({ 
  onLaunchVideo,
  className = '' 
}) => {
  const { isConnected, sendMessage, mediaStatus, addMessageListener } = useCast();
  
  // Form state
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [poster, setPoster] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);
  const [subtitlesText, setSubtitlesText] = useState('');
  
  // Media control state
  const [mediaState, setMediaState] = useState<MediaState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    loadingProgress: 0,
    isBuffering: false
  });
  
  const [isVideoLaunched, setIsVideoLaunched] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const timeUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // Media status listener
  useEffect(() => {
    const unsubscribe = addMessageListener((message) => {
      if (message.type === 'MEDIA_STATUS_UPDATE') {
        setMediaState(prev => ({
          ...prev,
          ...message.payload
        }));
      } else if (message.type === 'VIDEO_LAUNCHED') {
        setIsVideoLaunched(true);
        setIsExpanded(true);
      } else if (message.type === 'VIDEO_ENDED' || message.type === 'VIDEO_STOPPED') {
        setIsVideoLaunched(false);
        setIsExpanded(false);
      }
    });

    return unsubscribe;
  }, [addMessageListener]);

  // Parse subtitles from text format
  const parseSubtitles = (text: string) => {
    if (!text.trim()) return [];

    try {
      return JSON.parse(text);
    } catch {
      const lines = text.trim().split('\n');
      return lines.map((line, index) => {
        const [src, label, language] = line.split(',').map(s => s.trim());
        return {
          src: src || '',
          label: label || `Subtitle ${index + 1}`,
          language: language || 'en',
          kind: 'subtitles' as const
        };
      }).filter(sub => sub.src);
    }
  };

  const handleLaunchVideo = async () => {
    if (!videoUrl.trim()) return;

    const videoData: VideoData = {
      videoUrl: videoUrl.trim(),
      title: title.trim() || 'Video Player',
      poster: poster.trim() || undefined,
      authToken: authToken.trim() || undefined,
      autoPlay,
      subtitles: parseSubtitles(subtitlesText)
    };

    try {
      // Send to receiver
      const castMessage = {
        type: 'LOAD_VIDEO',
        payload: {
          pageType: 'video',
          ...videoData,
          timestamp: Date.now()
        }
      };

      console.log('📹 Launching video on receiver:', castMessage);
      await sendMessage(castMessage);

      // Trigger callback for page navigation
      onLaunchVideo(videoData);
      
      setIsVideoLaunched(true);
      setIsExpanded(true);
      
      console.log('✅ Video launched successfully');
    } catch (err) {
      console.error('❌ Failed to launch video:', err);
    }
  };

  // Media control functions
  const handlePlayPause = async () => {
    const action = mediaState.isPlaying ? 'pause' : 'play';
    await sendMessage({
      type: 'MEDIA_CONTROL',
      payload: { action, timestamp: Date.now() }
    });
  };

  const handleStop = async () => {
    await sendMessage({
      type: 'MEDIA_CONTROL',
      payload: { action: 'stop', timestamp: Date.now() }
    });
  };

  const handleSeek = async (time: number) => {
    await sendMessage({
      type: 'MEDIA_CONTROL',
      payload: { action: 'seek', time, timestamp: Date.now() }
    });
  };

  const handleVolumeChange = async (volume: number) => {
    await sendMessage({
      type: 'MEDIA_CONTROL',
      payload: { action: 'volume', volume, timestamp: Date.now() }
    });
  };

  const handleMuteToggle = async () => {
    await sendMessage({
      type: 'MEDIA_CONTROL',
      payload: { action: 'mute', muted: !mediaState.isMuted, timestamp: Date.now() }
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getVideoTypeInfo = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return { type: 'YouTube', icon: '📺', color: 'text-red-500' };
    }
    if (lowerUrl.includes('vimeo.com')) {
      return { type: 'Vimeo', icon: '🎬', color: 'text-blue-500' };
    }
    if (lowerUrl.includes('.m3u8')) {
      return { type: 'HLS Stream', icon: '📡', color: 'text-purple-500' };
    }
    if (lowerUrl.includes('.mpd')) {
      return { type: 'DASH Stream', icon: '📡', color: 'text-green-500' };
    }
    if (lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.ogg')) {
      return { type: 'Video File', icon: '🎥', color: 'text-orange-500' };
    }
    return { type: 'Unknown', icon: '❓', color: 'text-gray-500' };
  };

  const videoInfo = videoUrl ? getVideoTypeInfo(videoUrl) : null;

  // Sample URLs for quick testing
  const sampleUrls = [
    {
      label: 'Big Buck Bunny (MP4)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: 'Big Buck Bunny',
      poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
    },
    {
      label: 'Sintel (MP4)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      title: 'Sintel',
      poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg'
    },
    {
      label: 'HLS Test Stream',
      url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
      title: 'HLS Test Stream'
    }
  ];

  const loadSample = (sample: typeof sampleUrls[0]) => {
    setVideoUrl(sample.url);
    setTitle(sample.title);
    if (sample.poster) setPoster(sample.poster);
  };

  return (
    <Card className={`w-full transition-all duration-300 ${isExpanded ? 'h-auto' : ''} ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VideoIcon className="h-5 w-5" />
            Video Media Player
            {isVideoLaunched && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <MonitorIcon className="h-3 w-3 mr-1" />
                Live on Cast
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1"
          >
            <SettingsIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Launch video content on Cast receiver with full media control integration
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Media Controls Panel - Shows when video is launched */}
        {isVideoLaunched && (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <CastIcon className="h-4 w-4 text-blue-500" />
                Live Media Controls
              </h3>
              <Badge variant={mediaState.isPlaying ? "default" : "secondary"}>
                {mediaState.isPlaying ? 'Playing' : 'Paused'}
              </Badge>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSeek(Math.max(0, mediaState.currentTime - 30))}
                disabled={!isConnected}
              >
                <SkipBackIcon className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={handlePlayPause}
                disabled={!isConnected}
                className="h-10 w-10 rounded-full"
              >
                {mediaState.isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSeek(Math.min(mediaState.duration, mediaState.currentTime + 30))}
                disabled={!isConnected}
              >
                <SkipForwardIcon className="h-4 w-4" />
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStop}
                disabled={!isConnected}
              >
                <SquareIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>{formatTime(mediaState.currentTime)}</span>
                <span>{formatTime(mediaState.duration)}</span>
              </div>
              <Slider
                value={[mediaState.currentTime]}
                max={mediaState.duration || 100}
                step={1}
                onValueChange={([value]) => handleSeek(value)}
                className="w-full"
                disabled={!isConnected}
              />
            </div>

            {/* Volume Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMuteToggle}
                className="p-2"
              >
                {mediaState.isMuted ? (
                  <VolumeXIcon className="h-4 w-4" />
                ) : mediaState.volume > 0.5 ? (
                  <Volume2Icon className="h-4 w-4" />
                ) : (
                  <VolumeIcon className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[mediaState.volume * 100]}
                max={100}
                step={1}
                onValueChange={([value]) => handleVolumeChange(value / 100)}
                className="flex-1 max-w-24"
                disabled={!isConnected}
              />
              <span className="text-sm text-gray-500 w-8">{Math.round(mediaState.volume * 100)}</span>
            </div>

            {/* Media Information */}
            {mediaState.videoInfo && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>Resolution: {mediaState.videoInfo.width}x{mediaState.videoInfo.height}</div>
                <div>Bitrate: {Math.round(mediaState.videoInfo.bitrate / 1000)}kbps</div>
              </div>
            )}
          </div>
        )}

        {/* Video Launch Configuration */}
        {isExpanded && (
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="samples">Samples</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL *</Label>
                <div className="relative">
                  <Input
                    id="videoUrl"
                    type="url"
                    placeholder="https://... (YouTube, Vimeo, HLS, MP4, etc.)"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="pr-10"
                  />
                  <Link2Icon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {videoInfo && (
                  <div className={`text-sm flex items-center gap-2 ${videoInfo.color}`}>
                    <span>{videoInfo.icon}</span>
                    <span>Detected: {videoInfo.type}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Video title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poster">Poster Image</Label>
                  <Input
                    id="poster"
                    type="url"
                    placeholder="Thumbnail URL"
                    value={poster}
                    onChange={(e) => setPoster(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoPlay"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="autoPlay">Auto-play when launched</Label>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="authToken">Authorization Token</Label>
                <Input
                  id="authToken"
                  type="password"
                  placeholder="Bearer token for authenticated requests"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitles">Subtitles</Label>
                <Textarea
                  id="subtitles"
                  placeholder='JSON array or CSV format:
[{"src": "https://...", "label": "English", "language": "en"}]

Or line-by-line:
https://example.com/en.vtt, English, en'
                  value={subtitlesText}
                  onChange={(e) => setSubtitlesText(e.target.value)}
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="samples" className="space-y-3">
              <p className="text-sm text-gray-600">Quick test samples:</p>
              {sampleUrls.map((sample, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{sample.label}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {sample.url}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadSample(sample)}
                  >
                    Load
                  </Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}

        {/* Launch Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleLaunchVideo}
            disabled={!videoUrl.trim() || !isConnected}
            className="flex items-center gap-2"
            size="lg"
          >
            <PlayIcon className="h-5 w-5" />
            {isVideoLaunched ? 'Update Video' : 'Launch Video on Cast'}
          </Button>
        </div>

        {!isConnected && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg text-center">
            ⚠️ Connect to Cast receiver to launch video
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoMediaCard;
