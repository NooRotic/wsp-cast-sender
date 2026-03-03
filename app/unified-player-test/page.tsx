"use client"
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
const UnifiedPlayer = dynamic(() => import('@/components/UnifiedPlayer'), { ssr: false });
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Monitor, Play, ExternalLink } from 'lucide-react';

export default function UnifiedPlayerTestPage() {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');

  // Test URLs for different platforms
  const testUrls = [
    {
      name: 'Twitch Clip',
      url: 'https://clips.twitch.tv/BreakableExcitedWormDoggo-abc123def456',
      description: 'Example Twitch clip URL',
    },
    {
      name: 'Twitch VOD',
      url: 'https://www.twitch.tv/videos/1234567890',
      description: 'Example Twitch VOD URL',
    },
    {
      name: 'Twitch Stream',
      url: 'https://www.twitch.tv/example_streamer',
      description: 'Example Twitch live stream URL',
    },
    {
      name: 'HLS Stream',
      url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
      description: 'Apple HLS test stream',
    },
    {
      name: 'DASH Stream',
      url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
      description: 'Big Buck Bunny DASH stream',
    },
    {
      name: 'MP4 Video',
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      description: 'Sample MP4 video file',
    },
  ];

  const handleLoadUrl = (url: string) => {
    setCurrentUrl(url);
    setInputUrl(url);
  };

  const handleCustomUrl = () => {
    if (inputUrl.trim()) {
      setCurrentUrl(inputUrl.trim());
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-active-green mb-4">
            Unified Player Test
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Smart URL detection with automatic player switching for Twitch, HLS, DASH, and MP4 content
          </p>
          <Badge variant="outline" className="px-3 py-1 bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30">
            <Monitor className="w-4 h-4 mr-2" />
            Auto-detects: Twitch • HLS • DASH • MP4
          </Badge>
        </div>

        {/* URL Input */}
        <div className="mb-8 p-6 bg-black/30 rounded-lg border border-[#39FF14]/20">
          <h2 className="text-xl font-semibold mb-4 text-[#39FF14]">Custom URL</h2>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Enter video URL (Twitch, HLS, DASH, MP4, etc.)"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
            <Button
              onClick={handleCustomUrl}
              className="bg-[#39FF14] text-black hover:bg-[#2ed60a] font-semibold"
            >
              <Play className="w-4 h-4 mr-2" />
              Load
            </Button>
          </div>
        </div>

        {/* Test URLs */}
        <div className="mb-8 p-6 bg-black/30 rounded-lg border border-[#39FF14]/20">
          <h2 className="text-xl font-semibold mb-4 text-[#39FF14]">Test URLs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testUrls.map((test, index) => (
              <div key={index} className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
                <h3 className="font-semibold text-white mb-2">{test.name}</h3>
                <p className="text-sm text-gray-400 mb-3">{test.description}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleLoadUrl(test.url)}
                    size="sm"
                    className="bg-[#39FF14] text-black hover:bg-[#2ed60a] font-semibold"
                  >
                    Test
                  </Button>
                  <Button
                    onClick={() => setInputUrl(test.url)}
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Copy to Input
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player Section */}
        {currentUrl && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#39FF14]">Unified Player</h2>
            <div className="bg-black/30 rounded-lg border border-[#39FF14]/20 p-6">
              <UnifiedPlayer
                url={currentUrl}
                width="100%"
                height="500px"
                autoPlay={false}
                controls={true}
                showDebugInfo={true}
                onReady={() => console.log('Player ready')}
                onPlay={() => console.log('Player playing')}
                onPause={() => console.log('Player paused')}
                onError={(error) => console.error('Player error:', error)}
              />
            </div>
          </div>
        )}

        {!currentUrl && (
          <div className="text-center py-12">
            <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-600">
              <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Video Selected</h3>
              <p className="text-gray-400">
                Choose a test URL above or enter a custom URL to see the unified player in action
              </p>
            </div>
          </div>
        )}

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-black/30 rounded-lg border border-[#39FF14]/20 p-6">
            <h3 className="text-lg font-semibold text-[#39FF14] mb-3">URL Detection</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• <strong>Twitch:</strong> Clips, VODs, and live streams</li>
              <li>• <strong>HLS:</strong> .m3u8 adaptive streams</li>
              <li>• <strong>DASH:</strong> .mpd adaptive streams</li>
              <li>• <strong>MP4:</strong> Direct video files</li>
            </ul>
          </div>
          
          <div className="bg-black/30 rounded-lg border border-[#39FF14]/20 p-6">
            <h3 className="text-lg font-semibold text-[#39FF14] mb-3">Player Selection</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• <strong>ReactPlayer:</strong> Twitch content</li>
              <li>• <strong>Dash.js:</strong> DASH streams</li>
              <li>• <strong>Video.js:</strong> HLS and MP4 files</li>
              <li>• <strong>Manual Override:</strong> Switch players manually</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
