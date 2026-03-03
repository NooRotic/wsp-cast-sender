'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCast } from '@/contexts/CastContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Play, 
  Video, 
  Monitor, 
  Settings, 
  Youtube, 
  Film,
  Radio,
  Tv,
  VideoIcon,
  PlayIcon
} from 'lucide-react';
import { gsap } from 'gsap';

import VideoControl from '@/components/VideoControl';
import MediaStatusDisplay from '@/components/MediaStatusDisplay';

interface MediaPanelProps {
  className?: string;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  component?: React.ReactNode;
}

export const MediaPanel: React.FC<MediaPanelProps> = ({ className }) => {
  const { isConnected } = useCast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('video-player');
  const panelRef = useRef<HTMLDivElement>(null);

  // Tab configuration with enable/disable functionality
  const [tabs, setTabs] = useState<TabConfig[]>([
    {
      id: 'video-player',
      label: 'Video Player',
      icon: <VideoIcon className="w-4 h-4" />,
      enabled: true,
      component: <VideoControl />
    },
    {
      id: 'basic-controls',
      label: 'Basic Controls',
      icon: <Play className="w-4 h-4" />,
      enabled: true,
      component: <BasicControls />
    },
    {
      id: 'advanced-controls',
      label: 'Advanced',
      icon: <Settings className="w-4 h-4" />,
      enabled: true,
      component: <AdvancedControls />
    },
    {
      id: 'platforms',
      label: 'Platforms',
      icon: <Tv className="w-4 h-4" />,
      enabled: true,
      component: <PlatformSamples />
    },
    {
      id: 'media-status',
      label: 'Media Status',
      icon: <Monitor className="w-4 h-4" />,
      enabled: true,
      component: <MediaStatusDisplay className="w-full" />
    }
  ]);

  const toggleTab = (tabId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, enabled: !tab.enabled }
        : tab
    ));
  };

  const handleVideoPlayerSelect = () => {
    if (!isExpanded) {
      // Animate to expand
      setIsExpanded(true);
      if (panelRef.current) {
        // First collapse to 0
        gsap.to(panelRef.current, {
          scale: 0.8,
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            // Then expand to full modal centered
            gsap.set(panelRef.current, {
              scale: 0.9,
              opacity: 0
            });
            gsap.to(panelRef.current, {
              scale: 1,
              opacity: 1,
              duration: 0.4,
              ease: 'power2.out'
            });
          }
        });
      }
    }
  };

  const handleClose = () => {
    if (panelRef.current) {
      gsap.to(panelRef.current, {
        scale: 0.9,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
        onComplete: () => {
          setIsExpanded(false);
          // Return to smaller floating state
          gsap.set(panelRef.current, {
            scale: 0.8,
            opacity: 0
          });
          gsap.to(panelRef.current, {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      });
    }
  };

  // Show panel only when cast is connected
  if (!isConnected) {
    return null;
  }

  const enabledTabs = tabs.filter(tab => tab.enabled);

  return (
    <>
      {/* Backdrop overlay for expanded modal */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9997]"
          onClick={handleClose}
        />
      )}
      
      {/* Small floating panel - only show when not expanded */}
      {!isExpanded && (
        <div className="fixed bottom-4 right-4 z-[9998]">
          <div 
            className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            style={{ width: '280px' }}
          >
            <Card className="border-0 bg-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <Video className="w-5 h-5 text-[#39FF14]" />
                    Media Control
                  </CardTitle>
                  <Badge variant="outline" className="text-xs border-[#39FF14]/30 text-[#39FF14]">
                    Connected
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Video Media Player Button */}
                <Button
                  onClick={handleVideoPlayerSelect}
                  className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-[#39FF14]/20 to-blue-600/20 hover:from-[#39FF14]/30 hover:to-blue-600/30 border border-[#39FF14]/30 hover:border-[#39FF14]/50 text-white backdrop-blur-sm transition-all duration-300"
                >
                  <PlayIcon className="w-6 h-6" />
                  <span className="text-sm font-medium">Video Media Player</span>
                </Button>

                {/* Platform Thumbnails */}
                <div className="grid grid-cols-2 gap-2">
                  <PlatformThumbnail
                    icon={<Youtube className="w-6 h-6 text-red-500" />}
                    label="YouTube"
                    onClick={() => {
                      setActiveTab('platforms');
                      handleVideoPlayerSelect();
                    }}
                  />
                  <PlatformThumbnail
                    icon={<Film className="w-6 h-6 text-blue-500" />}
                    label="Vimeo"
                    onClick={() => {
                      setActiveTab('platforms');
                      handleVideoPlayerSelect();
                    }}
                  />
                  <PlatformThumbnail
                    icon={<Radio className="w-6 h-6 text-green-500" />}
                    label="HLS"
                    onClick={() => {
                      setActiveTab('platforms');
                      handleVideoPlayerSelect();
                    }}
                  />
                  <PlatformThumbnail
                    icon={<VideoIcon className="w-6 h-6 text-orange-500" />}
                    label="Direct"
                    onClick={() => {
                      setActiveTab('platforms');
                      handleVideoPlayerSelect();
                    }}
                  />
                </div>

                {/* Tab Toggles */}
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-white/60 mb-2">Toggle Features:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {tabs.filter(tab => tab.id !== 'media-status').map(tab => (
                      <Button
                        key={tab.id}
                        variant={tab.enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleTab(tab.id)}
                        className={`text-xs h-8 ${
                          tab.enabled 
                            ? 'bg-[#39FF14]/20 border-[#39FF14]/30 text-white hover:bg-[#39FF14]/30' 
                            : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30 hover:text-white'
                        }`}
                      >
                        {tab.icon}
                        <span className="ml-1 truncate">{tab.label}</span>
                      </Button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-white/40 text-center">
                    📺 Receiver Media Status is always visible at the bottom
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Large centered modal - only show when expanded */}
      {isExpanded && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-2">
          <div 
            ref={panelRef}
            className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
            style={{ 
              width: '90vw',
              height: '90vh',
              maxWidth: '1400px',
              maxHeight: '900px'
            }}
          >
            {/* Expanded state - full media panel with tabs */}
            <div className="h-full flex flex-col">
              {/* Header with close button */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
                <h2 className="text-xl font-semibold flex items-center gap-3 text-white">
                  <Video className="w-6 h-6 text-[#39FF14]" />
                  Media Control Panel
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-10 w-10 p-0 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Tabs - Main Controls Area */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                  <TabsList className="grid w-full border-b border-white/10 rounded-none bg-transparent px-6 flex-shrink-0" 
                           style={{ gridTemplateColumns: `repeat(${enabledTabs.filter(tab => tab.id !== 'media-status').length}, 1fr)` }}>
                    {enabledTabs.filter(tab => tab.id !== 'media-status').map(tab => (
                      <TabsTrigger 
                        key={tab.id}
                        value={tab.id}
                        className="flex items-center gap-2 text-white/60 data-[state=active]:text-[#39FF14] data-[state=active]:bg-[#39FF14]/10 hover:text-white transition-all duration-200 py-3"
                      >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* Tab Content - Scrollable Area */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    {enabledTabs.filter(tab => tab.id !== 'media-status').map(tab => (
                      <TabsContent 
                        key={tab.id}
                        value={tab.id}
                        className="h-full p-6 m-0 text-white overflow-y-auto"
                        style={{ 
                          display: activeTab === tab.id ? 'block' : 'none',
                          height: '100%'
                        }}
                      >
                        <div className="max-w-full">
                          {tab.component}
                        </div>
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>

                {/* Receiver Media Status - Always Visible at Bottom */}
                <div className="flex-shrink-0 border-t border-white/10 bg-black/10 backdrop-blur-sm">
                  <div className="p-4">
                    <div className="bg-black/20 border border-white/10 rounded-lg p-4 max-h-80 overflow-y-auto">
                      <MediaStatusDisplay className="w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Platform Thumbnail Component
const PlatformThumbnail: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <Button
    variant="outline"
    className="h-12 flex flex-col items-center justify-center gap-1 bg-black/20 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-200"
    onClick={onClick}
  >
    {icon}
    <span className="text-xs">{label}</span>
  </Button>
);

// Basic Controls Component (from cast-debug)
const BasicControls: React.FC = () => {
  const { sendMessage, isConnected } = useCast();

  const sendBasicCommand = async (action: string) => {
    if (!isConnected) return;
    
    try {
      await sendMessage({
        type: 'BASIC_CONTROL',
        payload: {
          action,
          timestamp: Date.now()
        }
      });
    } catch (err) {
      console.error(`Failed to send ${action} command:`, err);
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-semibold text-white">Basic Controls</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Button 
          onClick={() => sendBasicCommand('play')}
          className="h-20 flex flex-col items-center justify-center gap-3 bg-[#39FF14]/20 border border-[#39FF14]/30 text-white hover:bg-[#39FF14]/30 hover:border-[#39FF14]/50 transition-all duration-200"
        >
          <Play className="w-8 h-8" />
          <span className="text-lg font-medium">Play</span>
        </Button>
        <Button 
          onClick={() => sendBasicCommand('pause')}
          className="h-20 flex flex-col items-center justify-center gap-3 bg-blue-500/20 border border-blue-500/30 text-white hover:bg-blue-500/30 hover:border-blue-500/50 transition-all duration-200"
        >
          <Play className="w-8 h-8" />
          <span className="text-lg font-medium">Pause</span>
        </Button>
        <Button 
          onClick={() => sendBasicCommand('stop')}
          className="h-20 flex flex-col items-center justify-center gap-3 bg-red-500/20 border border-red-500/30 text-white hover:bg-red-500/30 hover:border-red-500/50 transition-all duration-200"
        >
          <Play className="w-8 h-8" />
          <span className="text-lg font-medium">Stop</span>
        </Button>
        <Button 
          onClick={() => sendBasicCommand('volume_up')}
          className="h-20 flex flex-col items-center justify-center gap-3 bg-purple-500/20 border border-purple-500/30 text-white hover:bg-purple-500/30 hover:border-purple-500/50 transition-all duration-200"
        >
          <Play className="w-8 h-8" />
          <span className="text-lg font-medium">Volume +</span>
        </Button>
      </div>
    </div>
  );
};

// Advanced Controls Component (from cast-debug)
const AdvancedControls: React.FC = () => {
  const { sendMessage, isConnected } = useCast();

  const sendAdvancedCommand = async (action: string, payload?: any) => {
    if (!isConnected) return;
    
    try {
      await sendMessage({
        type: 'ADVANCED_CONTROL',
        payload: {
          action,
          ...payload,
          timestamp: Date.now()
        }
      });
    } catch (err) {
      console.error(`Failed to send ${action} command:`, err);
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-semibold text-white">Advanced Controls</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Button 
          onClick={() => sendAdvancedCommand('debug_window_toggle')}
          className="h-20 flex items-center justify-center gap-4 bg-[#39FF14]/20 border border-[#39FF14]/30 text-white hover:bg-[#39FF14]/30 hover:border-[#39FF14]/50 transition-all duration-200"
        >
          <Monitor className="w-8 h-8" />
          <span className="text-lg font-medium">Toggle Debug Window</span>
        </Button>
        <Button 
          onClick={() => sendAdvancedCommand('console_toggle')}
          className="h-20 flex items-center justify-center gap-4 bg-blue-500/20 border border-blue-500/30 text-white hover:bg-blue-500/30 hover:border-blue-500/50 transition-all duration-200"
        >
          <Settings className="w-8 h-8" />
          <span className="text-lg font-medium">Toggle Console</span>
        </Button>
        <Button 
          onClick={() => sendAdvancedCommand('reset_receiver')}
          className="h-20 flex items-center justify-center gap-4 bg-red-500/20 border border-red-500/30 text-white hover:bg-red-500/30 hover:border-red-500/50 transition-all duration-200 lg:col-span-2"
        >
          <X className="w-8 h-8" />
          <span className="text-lg font-medium">Reset Receiver</span>
        </Button>
      </div>
    </div>
  );
};

// Platform Samples Component
const PlatformSamples: React.FC = () => {
  const { sendMessage, isConnected } = useCast();

  const platformSamples = [
    {
      platform: 'YouTube',
      icon: <Youtube className="w-5 h-5 text-red-500" />,
      samples: [
        {
          title: 'Sample Video 1',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnail: '🎵'
        },
        {
          title: 'Tech Demo',
          url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
          thumbnail: '🔧'
        }
      ]
    },
    {
      platform: 'Vimeo',
      icon: <Film className="w-5 h-5 text-blue-500" />,
      samples: [
        {
          title: 'Creative Sample',
          url: 'https://vimeo.com/76979871',
          thumbnail: '🎨'
        }
      ]
    },
    {
      platform: 'HLS Streams',
      icon: <Radio className="w-5 h-5 text-green-500" />,
      samples: [
        {
          title: 'Apple Test Stream',
          url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
          thumbnail: '📡'
        }
      ]
    },
    {
      platform: 'Direct Video',
      icon: <VideoIcon className="w-5 h-5 text-orange-500" />,
      samples: [
        {
          title: 'Big Buck Bunny',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail: '🐰'
        },
        {
          title: 'Elephants Dream',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          thumbnail: '🐘'
        }
      ]
    }
  ];

  const loadSample = async (sample: any) => {
    if (!isConnected) return;

    try {
      await sendMessage({
        type: 'LOAD_VIDEO',
        payload: {
          videoUrl: sample.url,
          title: sample.title,
          autoPlay: true,
          timestamp: Date.now()
        }
      });
      
      // Trigger debug controls visibility
      window.dispatchEvent(new CustomEvent('videoLoadSent', { 
        detail: { videoUrl: sample.url, title: sample.title } 
      }));
    } catch (err) {
      console.error('Failed to load sample:', err);
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-semibold text-white">Platform Samples</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {platformSamples.map((platform, index) => (
          <div key={index} className="space-y-4">
            <div className="flex items-center gap-3 text-xl font-medium text-white pb-2 border-b border-white/10">
              {platform.icon}
              {platform.platform}
            </div>
            <div className="grid grid-cols-1 gap-3">
              {platform.samples.map((sample, sampleIndex) => (
                <Button
                  key={sampleIndex}
                  variant="outline"
                  onClick={() => loadSample(sample)}
                  className="justify-start h-auto py-4 bg-black/20 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                  disabled={!isConnected}
                >
                  <span className="text-3xl mr-4">{sample.thumbnail}</span>
                  <div className="text-left flex-1">
                    <div className="font-medium text-lg">{sample.title}</div>
                    <div className="text-sm text-white/60 truncate">
                      {sample.url}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaPanel;
