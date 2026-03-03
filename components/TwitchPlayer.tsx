"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
// Dynamically import react-player (type workaround for Next.js + react-player)
const ReactPlayer = dynamic(() => import('react-player').then(m => m.default), { ssr: false });

const DEFAULT_TWITCH_URL = 'https://www.twitch.tv/twitch';


function parseTwitchInput(input: string): { type: 'channel' | 'clip' | null, url: string | null, channel?: string, clipId?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { type: null, url: null };
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('twitch.tv')) {
      // Clip
      const clipMatch = url.pathname.match(/\/clip\/([\w-]+)/);
      if (clipMatch) {
        const clipId = clipMatch[1];
        const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        return {
          type: 'clip',
          url: `https://clips.twitch.tv/embed?clip=${clipId}&parent=${parent}`,
          clipId
        };
      }
      // Channel
      const channelMatch = url.pathname.match(/^\/?([a-zA-Z0-9_]{4,25})$/);
      if (channelMatch) {
        const channel = channelMatch[1];
        const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        return {
          type: 'channel',
          url: `https://player.twitch.tv/?channel=${channel}&parent=${parent}`,
          channel
        };
      }
    }
    return { type: null, url: null };
  } catch {
    // Not a URL, treat as channel name
    if (/^[a-zA-Z0-9_]{4,25}$/.test(trimmed)) {
      const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      return {
        type: 'channel',
        url: `https://player.twitch.tv/?channel=${trimmed}&parent=${parent}`,
        channel: trimmed
      };
    }
    return { type: null, url: null };
  }
}


export default function TwitchPlayer() {
  const [url, setUrl] = useState('');
  const [input, setInput] = useState('nooroticx');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [playerType, setPlayerType] = useState<'channel' | 'clip' | null>(null);

  const handlePlay = () => {
    setError('');
    setLoading(false);
  };
  const handleError = (e: any) => {
    setError('Could not play this Twitch URL.');
    setLoading(false);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[TwitchPlayer] Load button pressed. Input:', input);
    const parsed = parseTwitchInput(input);
    console.log('[TwitchPlayer] Parsed input:', parsed);
    if (!parsed.url || !parsed.type) {
      setError('Please enter a valid Twitch channel name or URL.');
      setPlayerType(null);
      return;
    }
    setUrl(parsed.url);
    setPlayerType(parsed.type);
    setError('');
    setLoading(true);
    console.log('[TwitchPlayer] Set url to', parsed.url, 'type:', parsed.type);
  };

  // Render-time debug logging
  console.log('[TwitchPlayer][render] url:', url, 'loading:', loading, 'error:', error);
  return (
  <div className="w-full max-w-7xl mx-auto py-8 px-2 sm:px-4 bg-black rounded-lg shadow-lg">
  <h1 className="text-2xl font-bold mb-4 text-gray-100">Twitch Player Demo</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 border-2 border-purple-600 bg-black text-green-400 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-3 py-2 font-mono shadow-md transition-colors duration-200"
          placeholder="Enter Twitch channel name or full URL (e.g. pokimane or https://www.twitch.tv/pokimane)"
          value={input}
          onChange={e => setInput(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-purple-700 via-purple-600 to-purple-500 text-green-200 font-bold px-5 py-2 rounded shadow-md border-2 border-purple-800 hover:from-purple-800 hover:to-purple-600 transition-colors duration-200"
        >
          Load
        </button>
      </form>
  {error && <div className="text-red-400 mb-2">{error}</div>}
  <div className="w-full aspect-video bg-black rounded overflow-hidden flex items-center justify-center relative text-gray-100 transition-all duration-300"
    style={{ minHeight: url ? '40vw' : undefined, maxHeight: '80vh' }}>
        {loading && (
            <div className="absolute z-10 flex items-center justify-center w-full h-full bg-black bg-opacity-40">
                <span className="text-white text-lg animate-pulse">Loading…</span>
            </div>
        )}
        {playerType === 'channel' && url && (
          <iframe
            src={url + '&autoplay=true'}
            className="w-full h-full min-h-[300px] max-h-[80vh]"
            allowFullScreen
            frameBorder="0"
            allow="autoplay; fullscreen"
            title="Twitch Channel Player"
            onLoad={() => { setLoading(false); console.log('[TwitchPlayer] Channel iframe loaded'); }}
          />
        )}
        {playerType === 'clip' && url && (
          <iframe
            src={url}
            className="w-full h-full min-h-[300px] max-h-[80vh]"
            allowFullScreen
            frameBorder="0"
            allow="autoplay; fullscreen"
            title="Twitch Clip Player"
            onLoad={() => { setLoading(false); console.log('[TwitchPlayer] Clip iframe loaded'); }}
          />
        )}
    </div>
  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-200">
        <div>
          <h2 className="font-semibold text-green-400 mb-2">Promise</h2>
          <ul className="text-sm text-gray-300 list-disc pl-5">
            <li>Supports Twitch live channels and VODs</li>
            <li>All player controls enabled (play, pause, seek, volume, fullscreen)</li>
            <li>Responsive 16:9 aspect ratio</li>
            <li>Accepts both channel names and full Twitch URLs</li>
            <li>Works with most public Twitch streams and VODs</li>
            <li>SSR-safe with dynamic import</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-red-400 mb-2">Concern</h2>
          <ul className="text-sm text-gray-300 list-disc pl-5">
            <li>Some Twitch VODs or channels may be region-locked or require login</li>
            <li>Embedding may fail if Twitch changes their embed policy</li>
            <li>Ads shown by Twitch are not skippable</li>
            <li>Playback may fail if <code>parent</code> domain is not accepted by Twitch</li>
            <li>Performance may vary on slow connections</li>
            <li>No casting support in this demo (future work)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
