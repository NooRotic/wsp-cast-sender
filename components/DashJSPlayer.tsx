"use client";
import React, { useEffect, useRef } from "react";

// Dash.js is only loaded on the client
// dashjs will be loaded on the client inside useEffect to avoid server-side bundling
let dashjs: any = null;

interface DashJSPlayerProps {
  url: string;
  poster?: string;
  autoPlay?: boolean;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
  onEnded?: () => void;
}

const DashJSPlayer = React.forwardRef<HTMLVideoElement, DashJSPlayerProps>(
  ({ url, poster, autoPlay = true, controls = true, width = "100%", height = 360, onEnded }, ref) => {
    const localRef = useRef<HTMLVideoElement>(null);
    const videoRef = (ref as React.RefObject<HTMLVideoElement>) || localRef;
    useEffect(() => {
        let player: any = null;
        if (!videoRef.current) return;
        // Load dashjs dynamically on the client
        if (typeof window !== 'undefined') {
          try {
            dashjs = require('dashjs');
          } catch (e) {
            console.warn('Failed to load dashjs dynamically:', e);
            return;
          }
        }
        if (!dashjs) return;
        player = dashjs.MediaPlayer().create();
        player.initialize(videoRef.current, url, autoPlay);
      if (onEnded) {
        videoRef.current.onended = onEnded;
      }
      return () => {
          try { player?.reset(); } catch { }
      };
  }, [url, autoPlay, onEnded, videoRef]);
    return (
      <video
        ref={videoRef}
        poster={poster}
        controls={controls}
        width={width}
        height={height}
        style={{ width, height }}
        className="rounded shadow-lg"
      />
    );
  }
);
DashJSPlayer.displayName = 'DashJSPlayer';
export default DashJSPlayer;
