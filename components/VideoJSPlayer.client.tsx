"use client";

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// Proper Video.js implementation with HLS support built-in
export default function VideoJSPlayer(props: any) {
  const { src, poster, muted, onPlayStateChange, onPlayerStateChange, isPlaying } = props || {};
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Only initialize if we have a container and src
    if (!videoRef.current || !src) return;

    // Initialize Video.js player
    const videoElement = document.createElement('video-js');
    videoElement.className = 'vjs-default-skin';
    videoElement.setAttribute('data-setup', '{}');
    
    videoRef.current.appendChild(videoElement);

    const player = videojs(videoElement, {
      controls: true,
      responsive: true,
      fluid: true,
      autoplay: true,
      muted: !!muted,
      poster: poster || '',
      html5: {
        hls: {
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
          overrideNative: true
        }
      },
      techOrder: ['html5'],
      sources: [{
        src: src,
        type: getVideoType(src)
      }]
    });

    playerRef.current = player;

    // Event handlers
    player.on('loadstart', () => {
      console.log('🎬 VideoJSPlayer: Load started');
      onPlayerStateChange?.('loading');
    });

    player.on('canplay', () => {
      console.log('🎬 VideoJSPlayer: Can play - ready to start');
      onPlayerStateChange?.('ready');
    });

    player.on('play', () => {
      console.log('🎬 VideoJSPlayer: Playing');
      onPlayerStateChange?.('playing');
      onPlayStateChange?.(true);
    });

    player.on('pause', () => {
      console.log('🎬 VideoJSPlayer: Paused');
      onPlayerStateChange?.('paused');
      onPlayStateChange?.(false);
    });

    player.on('error', (e: any) => {
      console.error('🎬 VideoJSPlayer: Error', e);
      onPlayerStateChange?.('error');
    });

    // Cleanup function
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, muted, poster]); // eslint-disable-line react-hooks/exhaustive-deps


  // Helper function to determine video type
  function getVideoType(url: string): string {
    if (url.includes('.m3u8')) {
      return 'application/x-mpegURL'; // HLS
    } else if (url.includes('.mpd')) {
      return 'application/dash+xml'; // DASH
    } else if (url.includes('.mp4')) {
      return 'video/mp4';
    } else if (url.includes('.webm')) {
      return 'video/webm';
    } else {
      return 'video/mp4'; // Default fallback
    }
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div ref={videoRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
