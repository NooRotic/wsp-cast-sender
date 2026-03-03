'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Play, Clock, Video as VideoIcon } from 'lucide-react';
import LazyVideoCard from './LazyVideoCard';

interface Video {
  id: number;
  title: string;
  src: string;
  poster?: string;
  duration: string;
  mimetype?: string;
  name?: string;
  uri?: string;
  features?: string[];
  keySystems?: any;
  m3uData?: {
    tvgId?: string;
    group?: string;
    logo?: string;
    userAgent?: string;
    referrer?: string;
    metadata?: Record<string, string>;
  };
}

interface MediaCategory {
  type: 'HLS' | 'DASH' | 'MP4' | 'AUDIO_ONLY' | 'VIDEO_ONLY' | 'LIVE' | 'VOD' | 'DRM';
  subType?: 'LL_HLS' | 'ENCRYPTED' | 'MULTI_PERIOD' | '4K' | 'HEVC' | 'WIDEVINE' | 'PLAYREADY' | 'DATA_URI';
  contentType: 'video' | 'audio' | 'mixed';
  streamType: 'live' | 'vod';
  hasEncryption: boolean;
  quality?: 'SD' | 'HD' | '4K' | '8K';
  features: string[];
}

interface VideoLibraryProps {
  videos: Video[];
  currentVideo: Video | null;
  onVideoSelect: (video: Video) => void;
  layout?: 'horizontal' | 'vertical' | 'grid';
}

const VideoLibrary: React.FC<VideoLibraryProps> = ({
  videos,
  currentVideo,
  onVideoSelect,
  layout = 'horizontal'
}) => {
  const isVertical = layout === 'vertical';
  const isGrid = layout === 'grid';
  
  const [displayCount, setDisplayCount] = useState(() => {
    if (isGrid && videos.length > 100) {
      return 50;
    }
    return videos.length;
  });
  
  useEffect(() => {
    if (isGrid && videos.length > displayCount) {
      const timer = setTimeout(() => {
        setDisplayCount(prev => Math.min(prev + 50, videos.length));
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [displayCount, videos.length, isGrid]);
  
  useEffect(() => {
    if (isGrid && videos.length > 100) {
      setDisplayCount(50);
    } else {
      setDisplayCount(videos.length);
    }
  }, [layout, videos.length, isGrid]);
  
  const displayedVideos = useMemo(() => {
    return videos.slice(0, displayCount);
  }, [videos, displayCount]);

  return (
    <div className="glass-morphism-large neon-glow-enhanced p-6 flex flex-col h-full">
      <h3 className="text-xl font-semibold text-gradient-active-green mb-4 flex items-center gap-2 flex-shrink-0">
        <Play size={20} className="text-[#39FF14]" />
        Video Library
      </h3>
      
      <div className={`
        ${isGrid 
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600/80 hover:scrollbar-thumb-gray-500'
          : 'flex gap-4 overflow-x-auto pb-4'
        } 
      `}>
        {(isGrid ? displayedVideos : videos).map((video, index) => {
          if (isGrid) {
            return (
              <LazyVideoCard
                key={video.id}
                video={video}
                currentVideo={currentVideo}
                onVideoSelect={onVideoSelect}
                isGrid={isGrid}
                colors={{ border: 'border-blue-500/40', textColor: 'text-blue-300', bg: 'bg-blue-500/10', indicator: 'bg-blue-500' }}
                categorizeMedia={() => ({ type: 'HLS' as const, contentType: 'mixed' as const, streamType: 'vod' as const, hasEncryption: false, features: [] })}
                getProtocolType={() => 'HLS'}
              />
            );
          } else {
            return (
              <div
                key={video.id}
                onClick={() => onVideoSelect(video)}
                className={`
                  relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 group 
                  flex-shrink-0 w-48
                  border-2 border-blue-500/40
                  ${currentVideo && currentVideo.id === video.id 
                    ? 'ring-2 ring-[#39FF14] shadow-lg shadow-[#39FF14]/30' 
                    : 'hover:ring-2 hover:border-blue-400/60 hover:shadow-xl hover:scale-[1.02]'
                  }
                  backdrop-blur-sm bg-gradient-to-br from-blue-500/25 to-blue-600/15
                `}
              >
                <div className="absolute top-0 left-0 right-0 h-1 z-20 rounded-t-lg overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-90"></div>
                </div>
                <div className="relative rounded-t-lg overflow-hidden transition-all duration-300 aspect-video bg-gradient-to-br from-blue-500/25 to-blue-600/15">
                  {video.poster ? (
                    <>
                      <Image
                        src={video.poster}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/80 text-white px-1.5 py-0.5 rounded flex items-center gap-1 text-xs">
                        <Clock size={12} />
                        {video.duration}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/25 to-blue-600/15 flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#181c1f] to-[#23272b] opacity-80"></div>
                      <Play size={28} className="text-blue-300 fill-current drop-shadow-lg z-10 relative" />
                    </div>
                  )}
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500/25 to-blue-600/15 relative z-10">
                  <h3 className="font-semibold text-white mb-1 leading-tight text-sm line-clamp-2 drop-shadow-sm">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-gray-400 text-xs mt-2">
                    <span className="font-bold text-blue-300 drop-shadow-sm px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/40 backdrop-blur-sm text-xs">
                      HLS
                    </span>
                    <span className={`px-2 py-1 rounded-md transition-colors duration-200 font-medium border backdrop-blur-sm text-xs ${
                      currentVideo && currentVideo.id === video.id 
                        ? 'bg-[#39FF14]/30 text-[#39FF14] border-[#39FF14]/50 shadow-lg' 
                        : 'bg-gray-700/50 text-gray-400 border-gray-600/50'
                    }`}>
                      #{video.id}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
      
      {isGrid && displayCount < videos.length && (
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-400 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-600/50 border-t-[#39FF14] rounded-full animate-spin"></div>
            Loading {displayCount} of {videos.length} videos...
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-[#39FF14]/20 flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span className="flex items-center gap-2">
            <VideoIcon size={14} className="text-[#39FF14]" />
            {isGrid && displayCount < videos.length 
              ? `${displayCount} of ${videos.length} videos` 
              : `${videos.length} videos available`
            }
          </span>
          <span className="flex items-center gap-1 text-[#39FF14]">
            <Play size={14} />
            Video.js Ready
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoLibrary;
