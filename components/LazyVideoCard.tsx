'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Play, Clock } from 'lucide-react';

export interface VideoCardColors {
  border: string;      // CSS color value e.g. 'rgba(59,130,246,0.4)'
  textColor: string;   // CSS color value e.g. '#93c5fd'
  bg: string;          // CSS color value e.g. 'rgba(59,130,246,0.1)'
  indicator: string;   // CSS color value e.g. '#3b82f6'
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
  getProtocolType,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const rawPoster = video.poster || video.m3uData?.logo;
  const posterUrl = rawPoster && rawPoster !== 'undefined' ? rawPoster : null;
  const isSelected = !!(currentVideo && currentVideo.id === video.id);

  const thumbH = isGrid ? 110 : 100;
  // minHeight forces CSS Grid track sizing — grid items with overflow:hidden have
  // automatic min-size of 0 which collapses the track; minHeight fixes that.
  const cardMinH = isGrid ? 178 : 158;

  if (!isVisible) {
    return (
      <div
        ref={cardRef}
        className="rounded-lg cursor-pointer"
        style={{
          minHeight: cardMinH,
          border: '1px solid rgba(75,85,99,0.5)',
          background: 'rgba(31,41,55,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="w-8 h-8 border-2 border-gray-600/50 border-t-gray-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onClick={handleVideoSelect}
      className={`group rounded-lg cursor-pointer hover:scale-[1.02] ${isSelected ? 'ring-2 ring-[#39FF14] shadow-lg shadow-[#39FF14]/30' : 'hover:shadow-xl'}`}
      style={{
        border: `2px solid ${isSelected ? '#39FF14' : colors.border}`,
        overflow: 'hidden',
        minHeight: cardMinH,
      }}
    >
      {/* Color indicator strip */}
      <div style={{ height: 3, background: colors.indicator }} />

      {/* Thumbnail */}
      <div style={{ height: thumbH, position: 'relative', overflow: 'hidden', background: colors.bg }}>
        {posterUrl && !imageError ? (
          <>
            {!imageLoaded && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(31,41,55,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="w-6 h-6 border-2 border-gray-500/50 border-t-gray-300 rounded-full animate-spin" />
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterUrl}
              alt={video.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: isGrid ? 10 : 12 }}>
              <Clock size={isGrid ? 10 : 12} />
              {video.duration}
            </div>
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #181c1f 0%, #23272b 100%)' }}>
            <Play size={isGrid ? 18 : 28} style={{ color: colors.textColor, fill: colors.textColor }} />
          </div>
        )}

        {/* Hover overlay — shows title + protocol over the thumbnail */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.72)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '8px' }}
        >
          <p style={{ color: 'white', fontSize: 11, fontWeight: 600, lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>
            {video.title}
          </p>
          <span style={{ color: colors.textColor, fontSize: 10, fontWeight: 700 }}>
            {getProtocolType(video)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: isGrid ? '8px 10px' : '10px 12px', background: colors.bg }}>
        <h3 style={{
          fontWeight: 600,
          color: 'white',
          fontSize: isGrid ? 11 : 13,
          lineHeight: 1.3,
          marginBottom: isGrid ? 4 : 6,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: isGrid ? 2 : 2,
          WebkitBoxOrient: 'vertical' as const,
        }}>
          {video.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontWeight: 700,
            color: colors.textColor,
            padding: '2px 6px',
            borderRadius: 4,
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            fontSize: isGrid ? 10 : 11,
          }}>
            {getProtocolType(video)}
          </span>
          <span style={{
            padding: '2px 6px',
            borderRadius: 4,
            border: isSelected ? '1px solid rgba(57,255,20,0.5)' : '1px solid rgba(75,85,99,0.5)',
            background: isSelected ? 'rgba(57,255,20,0.3)' : 'rgba(55,65,81,0.5)',
            color: isSelected ? '#39FF14' : '#9ca3af',
            fontWeight: 500,
            fontSize: isGrid ? 10 : 11,
          }}>
            #{video.id}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LazyVideoCard;
