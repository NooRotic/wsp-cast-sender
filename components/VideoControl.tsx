import React, { useState } from 'react';
import { useCast } from '@/contexts/CastContext';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { VideoIcon, PlayIcon, Link2Icon } from 'lucide-react';

interface VideoControlProps {
  // Remove onSendVideo and isConnected since we'll get them from Cast context
}

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

export const VideoControl: React.FC<VideoControlProps> = () => {
  // Get Cast context
  const { isConnected, sendMessage } = useCast();
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [poster, setPoster] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);
  const [subtitlesText, setSubtitlesText] = useState('');
  const [loadedFromPrevious, setLoadedFromPrevious] = useState(false);

  // Load previous video source on component mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Check for last played video
        const lastPlayed = localStorage.getItem('lastPlayedVideo');
        if (lastPlayed) {
          const video = JSON.parse(lastPlayed);
          if (video.src) {
            setVideoUrl(video.src);
            setTitle(video.title || '');
            setPoster(video.poster || video.m3uData?.logo || '');
            setLoadedFromPrevious(true);
          }
        }
      } catch (error) {
        console.warn('Failed to load previous video source:', error);
      }
    }
  }, []);

  // Parse subtitles from text format
  const parseSubtitles = (text: string) => {
    if (!text.trim()) return [];

    try {
      // Try to parse as JSON first
      return JSON.parse(text);
    } catch {
      // Fall back to simple line-by-line format
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

  const handleSendVideo = async () => {
    if (!videoUrl.trim()) return;

    const videoData: VideoData = {
      videoUrl: videoUrl.trim(),
      title: title.trim() || 'Video Player',
      poster: poster.trim() || undefined,
      authToken: authToken.trim() || undefined,
      autoPlay,
      subtitles: parseSubtitles(subtitlesText)
    };

    // Create Cast message
    const castMessage = {
      type: 'LOAD_VIDEO',
      payload: {
        ...videoData,
        timestamp: Date.now()
      }
    };

    console.log('📹 Sending video message:', castMessage);

    try {
      await sendMessage(castMessage);
      console.log('✅ Video message sent successfully');

      // Clear form after successful send
      handleClearForm();
      
      // Immediately trigger debug controls visibility
      window.dispatchEvent(new CustomEvent('videoLoadSent', { 
        detail: { videoUrl: videoData.videoUrl, title: videoData.title } 
      }));
    } catch (err) {
      console.error('❌ Failed to send video message:', err);
    }
  };

  const handleClearForm = () => {
    setVideoUrl('');
    setTitle('');
    setPoster('');
    setAuthToken('');
    setAutoPlay(false);
    setSubtitlesText('');
    setLoadedFromPrevious(false);
  };

  // Sample URLs for quick testing
  const sampleUrls = [
    {
      label: 'YouTube Sample',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'YouTube Video'
    },
    {
      label: 'HLS Stream',
      url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
      title: 'HLS Test Stream'
    },
    {
      label: 'MP4 Sample',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: 'Big Buck Bunny'
    }
  ];

  const loadSample = (sample: typeof sampleUrls[0]) => {
    setVideoUrl(sample.url);
    setTitle(sample.title);
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

  return (
    <div className="w-full h-full flex flex-col text-white">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <VideoIcon className="h-6 w-6 text-[#39FF14]" />
          <h3 className="text-2xl font-semibold text-white">Video Player Control</h3>
        </div>
        <p className="text-white/60 text-sm">
          Send video content to the Cast receiver with support for YouTube, Vimeo, HLS, DASH, and direct video files.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="basic" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-black/20 border border-white/10 mb-6">
            <TabsTrigger 
              value="basic"
              className="text-white/60 data-[state=active]:text-[#39FF14] data-[state=active]:bg-[#39FF14]/10 hover:text-white transition-all duration-200"
            >
              Basic
            </TabsTrigger>
            <TabsTrigger 
              value="advanced"
              className="text-white/60 data-[state=active]:text-[#39FF14] data-[state=active]:bg-[#39FF14]/10 hover:text-white transition-all duration-200"
            >
              Advanced
            </TabsTrigger>
            <TabsTrigger 
              value="samples"
              className="text-white/60 data-[state=active]:text-[#39FF14] data-[state=active]:bg-[#39FF14]/10 hover:text-white transition-all duration-200"
            >
              Samples
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="basic" className="space-y-6 m-0">
              {/* Video URL - Full Width */}
              <div className="space-y-2">
                <Label htmlFor="videoUrl" className="text-white font-medium">Video URL *</Label>
                <div className="relative">
                  <Input
                    id="videoUrl"
                    type="url"
                    placeholder="https://... (YouTube, Vimeo, HLS, MP4, etc.)"
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      if (loadedFromPrevious) setLoadedFromPrevious(false);
                    }}
                    className="pr-10 bg-black/20 border-white/10 text-white placeholder-white/40 focus:border-[#39FF14]/50 focus:outline-none"
                  />
                  <Link2Icon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                </div>
                {loadedFromPrevious && (
                  <div className="text-sm flex items-center gap-2 text-blue-400">
                    <span>🔄</span>
                    <span>Loaded from previous session</span>
                  </div>
                )}
                {videoInfo && (
                  <div className={`text-sm flex items-center gap-2 ${videoInfo.color}`}>
                    <span>{videoInfo.icon}</span>
                    <span>Detected: {videoInfo.type}</span>
                  </div>
                )}
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white font-medium">Title</Label>
                  <Input
                    id="title"
                    placeholder="Video title (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-black/20 border-white/10 text-white placeholder-white/40 focus:border-[#39FF14]/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poster" className="text-white font-medium">Poster Image URL</Label>
                  <Input
                    id="poster"
                    type="url"
                    placeholder="https://... (thumbnail/poster image)"
                    value={poster}
                    onChange={(e) => setPoster(e.target.value)}
                    className="bg-black/20 border-white/10 text-white placeholder-white/40 focus:border-[#39FF14]/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoPlay"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="rounded accent-[#39FF14]"
                  aria-label="Auto-play video when loaded"
                />
                <Label htmlFor="autoPlay" className="text-white">Auto-play video when loaded</Label>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 m-0">
              <div className="space-y-2">
                <Label htmlFor="authToken" className="text-white font-medium">Authorization Token</Label>
                <Input
                  id="authToken"
                  type="password"
                  placeholder="Bearer token for authenticated requests (optional)"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="bg-black/20 border-white/10 text-white placeholder-white/40 focus:border-[#39FF14]/50 focus:outline-none"
                />
                <p className="text-xs text-white/60">
                  For private videos requiring authentication
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitles" className="text-white font-medium">Subtitles</Label>
                <Textarea
                  id="subtitles"
                  placeholder="JSON array or CSV format:
[{&quot;src&quot;: &quot;https://...&quot;, &quot;label&quot;: &quot;English&quot;, &quot;language&quot;: &quot;en&quot;}]

Or line-by-line:
https://example.com/en.vtt, English, en
https://example.com/es.vtt, Spanish, es"
                  value={subtitlesText}
                  onChange={(e) => setSubtitlesText(e.target.value)}
                  rows={6}
                  className="bg-black/20 border-white/10 text-white placeholder-white/40 focus:border-[#39FF14]/50 focus:outline-none resize-none"
                />
                <p className="text-xs text-white/60">
                  Support for WebVTT subtitle files
                </p>
              </div>
            </TabsContent>

            <TabsContent value="samples" className="space-y-4 m-0">
              <div className="space-y-4">
                <p className="text-sm text-white/60">
                  Quick test samples for different video types:
                </p>

                {sampleUrls.map((sample, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/30 transition-all duration-200">
                    <div>
                      <div className="font-medium text-white">{sample.label}</div>
                      <div className="text-xs text-white/60 truncate max-w-xs">
                        {sample.url}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSample(sample)}
                      className="bg-[#39FF14]/20 border-[#39FF14]/30 text-[#39FF14] hover:bg-[#39FF14]/30 hover:border-[#39FF14]/50"
                    >
                      Load
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions - Fixed at Bottom */}
        <div className="flex-shrink-0 pt-6 mt-6 border-t border-white/10">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleClearForm}
              className="bg-black/20 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
            >
              Clear
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={handleSendVideo}
                disabled={!videoUrl.trim() || !isConnected}
                className="flex items-center gap-2 bg-[#39FF14]/20 border-[#39FF14]/30 text-[#39FF14] hover:bg-[#39FF14]/30 hover:border-[#39FF14]/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayIcon className="h-4 w-4" />
                Send Video
              </Button>
              
              <Button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('videoLoadSent', { 
                    detail: { manual: true } 
                  }));
                }}
                disabled={!isConnected}
                variant="outline"
                className="flex items-center gap-2 bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30 hover:border-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🎮 Debug Controls
              </Button>
            </div>
          </div>

          {!isConnected && (
            <div className="mt-4">
              <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                ⚠️ Not connected to Cast receiver. Connect first to send video.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoControl;
