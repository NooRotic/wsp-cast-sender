'use client';

import { useEffect, useState, useRef } from 'react';

const VIDEO_BACKGROUNDS = [
  '/video/maxHeads.mp4',
  '/video/blackGridLoop.mp4',
  '/video/RAID.mp4',
  '/video/RainCode_sm.mp4',
  '/video/newMan_hallway.mp4'

  // Add more video files here as you create them
  // '/gifs/video2.mp4',
  // '/gifs/video3.mp4',
];

export default function ParticleBackground() {
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      const randomIndex = Math.floor(Math.random() * VIDEO_BACKGROUNDS.length);
      setSelectedVideo(VIDEO_BACKGROUNDS[randomIndex]);
    }
  }, [hasMounted]);

  const handleVideoLoad = () => {
    setIsLoaded(true);
  };

  const handleVideoError = () => {
    console.error('Failed to load video background');
    // Fallback to first video if random selection fails
    if (selectedVideo !== VIDEO_BACKGROUNDS[0]) {
      setSelectedVideo(VIDEO_BACKGROUNDS[0]);
    }
  };

  if (!hasMounted || !selectedVideo) {
    return null; // Don't render until client-side and video is selected
  }

  return (
    <div className="fixed inset-0 w-full h-full -z-10">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={handleVideoLoad}
        onError={handleVideoError}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-2000 ease-in-out ${isLoaded ? 'opacity-30' : 'opacity-0'} -z-10`}
        style={{ filter: 'blur(1px)' }}
      >
        <source src={selectedVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}