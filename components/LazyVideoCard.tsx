'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Play, Clock } from 'lucide-react';

export interface VideoCardColors {
  border: string;      // e.g. 'border-blue-500/40'
  textColor: string;   // e.g. 'text-blue-300'
  bg: string;          // e.g. 'bg-blue-500/10'
  indicator: string;   // e.g. 'bg-blue-500'
}

interface LazyVideoCardProps {
  video: any;
  currentVideo: any;
  onVideoSelect: (video: any) => void;
  isGrid: boolean;
  colors: VideoCardColors;
  categorizeMedia: (video: any) => any;
  getProtocolType: (video: any) => string;
}

const LazyVideoCard: React.FC<LazyVideoCardProps> = ({
  video,
  currentVideo,
  onVideoSelect,
  isGrid,
  colors,
  categorizeMedia,
  getProtocolType,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  React.useEffect(() => {
    if (!cardRef.current) return;

    const currentRef = cardRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);

  const handleVideoSelect = useCallback(() => {
    onVideoSelect(video);
  }, [video, onVideoSelect]);

  const posterUrl = video.poster || video.m3uData?.logo;
  const isSelected = !!(currentVideo && currentVideo.id === video.id);

  // Placeholder skeleton until the card scrolls into view
  if (!isVisible) {
    return (
      <div
        ref={cardRef}
        className={`
          relative group cursor-pointer transition-all duration-300 rounded-lg overflow-hidden
          border border-gray-600/50 bg-gray-800/30
          ${isGrid ? 'h-[180px]' : 'h-[160px]'}
        `}
      >
        <div className="w-full h-full bg-gray-800/50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-600/50 border-t-gray-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onClick={handleVideoSelect}
      className={`
        relative group cursor-pointer transition-all duration-300 rounded-lg overflow-hidden
        border-2
        ${isSelected
          ? 'ring-2 ring-[#39FF14] shadow-lg shadow-[#39FF14]/30'
          : `hover:ring-2 ${colors.border} hover:shadow-xl hover:scale-[1.02]`
        }
        backdrop-blur-sm
      `}
    >
      {/* Media type colour strip along the top */}
      <div className="absolute top-0 left-0 right-0 h-1 z-20 rounded-t-lg overflow-hidden">
        <div className={`w-full h-full ${colors.indicator} opacity-90`} />
      </div>

      {/* Thumbnail — explicit height so next/image fill has a guaranteed container size */}
      <div className={`
        relative rounded-t-lg overflow-hidden
        ${isGrid ? 'h-[120px]' : 'h-[110px]'}
        ${colors.bg}
      `}>
        {posterUrl ? (
          <>
            {!imageLoaded && (
              <div className="w-full h-full bg-gray-800/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-500/50 border-t-gray-300 rounded-full animate-spin" />
              </div>
            )}
            <Image
              src={posterUrl}
              alt={video.title}
              fill
              className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
            <div className={`absolute bottom-1 right-1 bg-black/80 text-white px-1.5 py-0.5 rounded flex items-center gap-1 ${isGrid ? 'text-[10px]' : 'text-xs'}`}>
              <Clock size={isGrid ? 10 : 12} />
              {video.duration}
            </div>
          </>
        ) : (
          <div className={`w-full h-full ${colors.bg} flex items-center justify-center relative`}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#181c1f] to-[#23272b] opacity-80" />
            <Play
              size={isGrid ? 16 : 28}
              className={`${colors.textColor} fill-current drop-shadow-lg z-10 relative`}
            />
            {categorizeMedia(video).type === 'DASH' && (
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,rgba(239,68,68,0.1)_8px,rgba(239,68,68,0.1)_16px)]" />
              </div>
            )}
            {categorizeMedia(video).type === 'HLS' && (
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_12px,rgba(59,130,246,0.1)_12px,rgba(59,130,246,0.1)_24px)]" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card footer: title + badges */}
      <div className={`p-3 ${colors.bg} relative z-10`}>
        <h3 className={`
          font-semibold text-white mb-1 leading-tight drop-shadow-sm
          ${isGrid ? 'text-xs line-clamp-3' : 'text-sm line-clamp-2'}
        `}>
          {video.title}
        </h3>

        <div className={`
          flex items-center justify-between text-gray-400
          ${isGrid ? 'text-[10px] mt-1' : 'text-xs mt-2'}
        `}>
          {/* Protocol badge */}
          <span className={`
            font-bold ${colors.textColor} drop-shadow-sm px-2 py-1 rounded-md
            ${colors.bg} border ${colors.border} backdrop-blur-sm
            ${isGrid ? 'text-[10px]' : 'text-xs'}
          `}>
            {getProtocolType(video)}
          </span>

          {/* ID badge */}
          <span className={`
            px-2 py-1 rounded-md transition-colors duration-200 font-medium border backdrop-blur-sm
            ${isGrid ? 'text-[10px]' : 'text-xs'}
            ${isSelected
              ? 'bg-[#39FF14]/30 text-[#39FF14] border-[#39FF14]/50 shadow-lg'
              : 'bg-gray-700/50 text-gray-400 border-gray-600/50'
            }
          `}>
            #{video.id}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LazyVideoCard;
