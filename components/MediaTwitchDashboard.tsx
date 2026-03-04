"use client";
// Custom image component to fetch Twitch thumbnails with Authorization header
type AuthImageProps = React.ComponentProps<typeof Image>;
function AuthImage({ src, alt, ...props }: AuthImageProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);
  const [fallbackTried, setFallbackTried] = useState(false);
  useEffect(() => {
    let revoked = false;
    setErrored(false);
    setFallbackTried(false);
    async function fetchImage() {
      if (typeof src !== "string") return;
      const token = localStorage.getItem("twitch_access_token");
      if (!token) {
        setImgUrl(src);
        return;
      }
      try {
        const res = await fetch(src, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch image");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (!revoked) setImgUrl(url);
      } catch {
        if (typeof src === 'string') {
          setImgUrl(src); // fallback to original src if fetch fails
        } else {
          setErrored(true);
        }
        setFallbackTried(true);
      }
    }
    fetchImage();
    return () => { revoked = true; };
  }, [src]);
  if (errored) return <div className="w-full h-[56px] bg-gray-800 animate-pulse rounded" />;
  if (!imgUrl) return <div className="w-full h-[96px] bg-gray-800 animate-pulse rounded" />;
  return <Image src={imgUrl} alt={alt} onError={() => {
    // If we already tried fallback, show short placeholder; else, try fallback src
    if (fallbackTried) setErrored(true);
    else {
      if (typeof src === 'string') {
        setImgUrl(src);
      } else {
        setErrored(true);
      }
      setFallbackTried(true);
    }
  }} {...props} />;
}


import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";

// Custom image component to fetch Twitch thumbnails with Authorization header
import gsap from "gsap";
import { getUserInfo, getVideos, getClips } from "../lib/twitchApi";



const colorMap = [
  "bg-purple-700", // Clips
  "bg-green-700",  // Featured Clips
  "bg-blue-700",   // Videos
];

export default function MediaTwitchDashboard() {
  // On mount, set input to last entered value from history if available
  const getLastHistory = () => {
    const prev = localStorage.getItem('twitch_channel_history');
    if (prev) {
      const arr = JSON.parse(prev);
      if (arr.length > 0) return arr[0];
    }
    return "";
  };
  const [input, setInput] = useState<string>(typeof window !== 'undefined' ? getLastHistory() : "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<any>(null);
  const [channel, setChannel] = useState<any>(null);
  const [stream, setStream] = useState<any>(null);
  const [clips, setClips] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [game, setGame] = useState<any>(null);
  const [showRaw, setShowRaw] = useState<{[key:string]:boolean}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const { handleTwitchRedirect } = require("../lib/twitchAuthClient");
    const token = handleTwitchRedirect() || localStorage.getItem('twitch_access_token');
    setAuthed(!!token);
  }, []);

  function login() {
    const { loginWithTwitch } = require("../lib/twitchAuthClient");
    loginWithTwitch();
  }

  function logout() {
    localStorage.removeItem('twitch_access_token');
    setAuthed(false);
    setProfile(null);
    setClips([]);
    setVideos([]);
  }

  function handleExpiredToken() {
    localStorage.removeItem('twitch_access_token');
    setAuthed(false);
    setError("Session expired — please log in again.");
  }

  function assertNotUnauthed(res: Response) {
    if (res.status === 401) {
      handleExpiredToken();
      throw new Error("Session expired — please log in again.");
    }
    return res;
  }

  async function fetchAll(channelName: string) {
    setLoading(true);
    setError("");
    setProfile(null);
    setChannel(null);
    setStream(null);
    setClips([]);
    setVideos([]);
    setFollowers([]);
    setGame(null);
    try {
      // 1. User info
      const user = await getUserInfo(channelName);
      setProfile(user);
      const userId = user.id;
      // 2. Channel info
      const channelRes = assertNotUnauthed(await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${userId}`, {
        headers: {
          "Client-ID": process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
          "Authorization": `Bearer ${localStorage.getItem('twitch_access_token')}`,
        },
      }));
      const channelData = await channelRes.json();
      setChannel(channelData.data?.[0] || null);
      // 3. Stream info (live data)
      const streamRes = assertNotUnauthed(await fetch(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
        headers: {
          "Client-ID": process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
          "Authorization": `Bearer ${localStorage.getItem('twitch_access_token')}`,
        },
      }));
      const streamData = await streamRes.json();
      setStream(streamData.data?.[0] || null);
      // 4. Clips
  const clipsRes = await getClips(userId, 50);
      if (typeof window !== 'undefined') {
        // Debug log all raw fields for clips
        // eslint-disable-next-line no-console
        console.log('[TWITCH DEBUG] Raw clips data:', clipsRes.data);
      }
  setClips((clipsRes.data || []).slice(0, 50));
      // 5. Videos
  const videosRes = await getVideos(userId, 50);
      if (typeof window !== 'undefined') {
        // Debug log all raw fields for videos
        // eslint-disable-next-line no-console
        console.log('[TWITCH DEBUG] Raw videos data:', videosRes.data);
      }
  setVideos((videosRes.data || []).slice(0, 50));
      // 6. Followers
      const followersRes = assertNotUnauthed(await fetch(`https://api.twitch.tv/helix/users/follows?to_id=${userId}&first=10`, {
        headers: {
          "Client-ID": process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
          "Authorization": `Bearer ${localStorage.getItem('twitch_access_token')}`,
        },
      }));
      const followersData = await followersRes.json();
      setFollowers(followersData.data || []);
      // 7. Game info (if available)
      let gameId = channelData.data?.[0]?.game_id || streamData.data?.[0]?.game_id;
      if (gameId) {
        const gameRes = await fetch(`https://api.twitch.tv/helix/games?id=${gameId}`, {
          headers: {
            "Client-ID": process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
            "Authorization": `Bearer ${localStorage.getItem('twitch_access_token')}`,
          },
        });
        const gameData = await gameRes.json();
        setGame(gameData.data?.[0] || null);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load channel data");
    } finally {
      setLoading(false);
    }
  }

  // Store and suggest previous entries
  useEffect(() => {
    // On mount, set suggestions to history, and input to last entered if not already set
    const prev = localStorage.getItem('twitch_channel_history');
    if (prev) {
      setSuggestions(JSON.parse(prev));
      if (!input) {
        const arr = JSON.parse(prev);
        if (arr.length > 0) setInput(arr[0]);
      }
    }
  }, [input]);

  function saveToHistory(channel: string) {
    let prev = localStorage.getItem('twitch_channel_history');
    let arr = prev ? JSON.parse(prev) : [];
    if (!arr.includes(channel)) {
      arr.unshift(channel);
      if (arr.length > 10) arr = arr.slice(0, 10);
      localStorage.setItem('twitch_channel_history', JSON.stringify(arr));
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInput(val);
    const prev = localStorage.getItem('twitch_channel_history');
    if (prev) {
      const arr = JSON.parse(prev);
      setSuggestions(arr.filter((c: string) => c.toLowerCase().includes(val.toLowerCase()) && c !== val));
      setShowSuggestions(val.length > 0 && arr.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  function handleSuggestionClick(s: string) {
    setInput(s);
    setShowSuggestions(false);
    if (inputRef.current) inputRef.current.blur();
    fetchAll(s);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    saveToHistory(input.trim());
    fetchAll(input.trim());
    setShowSuggestions(false);
  }

  // --- Advanced Clip Stats ---
  const clipStats = useMemo(() => {
    if (!clips || clips.length === 0) return null;
    // Top 10 chatters by clips made
    const byUser: Record<string, number> = {};
    const byUserTime: Record<string, number> = {};
    const byUserViews: Record<string, number> = {};
    const byUserFeatured: Record<string, number> = {};
    let oldestClip: typeof clips[0] | null = null;
    let oldestClipper: string | null = null;
    let latestClip: typeof clips[0] | null = null;
    let latestClipper: string | null = null;
    clips.forEach((clip: any) => {
      const user: string = clip.creator_name;
      // Count clips
      byUser[user] = (byUser[user] || 0) + 1;
      // Total time clipped
      if (clip.duration) byUserTime[user] = (byUserTime[user] || 0) + clip.duration;
      // Total view_count
      if (clip.view_count) byUserViews[user] = (byUserViews[user] || 0) + clip.view_count;
      // Featured clips
      if (clip.is_featured) byUserFeatured[user] = (byUserFeatured[user] || 0) + 1;
      // Oldest/Latest clip by chatter
      if (!oldestClip || new Date(clip.created_at) < new Date(oldestClip.created_at)) {
        oldestClip = clip;
        oldestClipper = user;
      }
      if (!latestClip || new Date(clip.created_at) > new Date(latestClip.created_at)) {
        latestClip = clip;
        latestClipper = user;
      }
    });
    // Top 10 by clips made
    const topChatters: [string, number][] = Object.entries(byUser)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 10);
    // Top by featured clips
    const topFeatured: [string, number][] = Object.entries(byUserFeatured)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 10);
    // Bar chart data for total time clipped per user
    const timeBar: [string, number][] = Object.entries(byUserTime)
      .sort((a, b) => (b[1] as number) - (a[1] as number));
    // Bar chart data for total view_count per creator
    const viewBar: [string, number][] = Object.entries(byUserViews)
      .sort((a, b) => (b[1] as number) - (a[1] as number));
    return {
      topChatters,
      byUserTime,
      timeBar,
      byUserViews,
      viewBar,
      topFeatured,
      oldestClip,
      oldestClipper,
      latestClip,
      latestClipper,
    };
  }, [clips]);

  return (
  <div className="bg-black text-gray-100 flex flex-col items-center py-10 px-4 relative">
      {/* Broadcaster profile image, absolute, large, circle mask */}
      {profile && profile.profile_image_url && (
        <>
          {/* Right profile image */}
          <div style={{position:'fixed',top:'24px',right:'24px',zIndex:50,transform:'rotate(12deg)'}}>
            <Image src={profile.profile_image_url} alt={profile.display_name} width={160} height={160} className="rounded-full border-4 border-purple-700 shadow-2xl" style={{objectFit:'cover',boxShadow:'0 0 40px #a855f7'}} />
          </div>
          {/* Left profile image, mirrored */}
          <div style={{position:'fixed',top:'24px',left:'24px',zIndex:50,transform:'scaleX(-1) rotate(12deg)'}}>
            <Image src={profile.profile_image_url} alt={profile.display_name} width={160} height={160} className="rounded-full border-4 border-purple-700 shadow-2xl" style={{objectFit:'cover',boxShadow:'0 0 40px #a855f7'}} />
          </div>
        </>
      )}
      <div className="flex flex-col gap-4 mb-8 w-full max-w-xl justify-end">
        {!authed && (
          <div className="bg-black border-2 border-purple-700 rounded-lg p-4 mb-2 text-green-200 font-mono text-sm shadow-lg">
            <span className="text-purple-400">Note:</span> To unlock the full Twitch dashboard experience—including channel info, live stream data, clips, videos, followers, and more—please <span className="text-purple-300 font-bold">log in with your Twitch account</span> above.<br/>
            <span className="text-gray-400">Without logging in, only the public channel player is available. No API data can be shown due to Twitch&apos;s authentication requirements.</span>
          </div>
        )}
        {!authed ? (
          <button
            onClick={login}
            className="bg-gradient-to-r from-purple-700 via-purple-600 to-purple-500 text-green-200 font-bold px-6 py-2 rounded shadow-md border-2 border-purple-800 hover:from-purple-800 hover:to-purple-600 transition-colors duration-200 tracking-widest uppercase"
          >
            Login with Twitch
          </button>
        ) : (
          <button
            onClick={logout}
            className="fixed bottom-4 right-4 z-50 px-3 py-1 rounded bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow border border-white opacity-90"
            style={{minWidth:'60px'}}
          >
            Log out
          </button>
        )}
      </div>
      {profile && (
        <div className="w-full flex justify-center items-center mt-2 mb-4">
          <div className="text-2xl font-bold text-purple-300 text-center drop-shadow-lg">{profile.display_name || profile.login}</div>
        </div>
      )}
      {authed && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4 w-full max-w-xl relative">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              className="w-full border-2 border-purple-600 bg-black text-green-400 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-3 py-2 font-mono shadow-md transition-colors duration-200"
              placeholder="Enter Twitch channel name, clip URL, etc."
              value={input}
              onChange={handleInputChange}
              autoFocus
              onFocus={() => setShowSuggestions(suggestions.length > 0 && input.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-20 bg-black border border-purple-700 rounded shadow-lg mt-1 max-h-48 overflow-y-auto">
                {suggestions.map(s => (
                  <li
                    key={s}
                    className="px-3 py-2 cursor-pointer hover:bg-purple-800 text-green-300"
                    onMouseDown={() => handleSuggestionClick(s)}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-700 via-purple-600 to-purple-500 text-green-200 font-bold px-5 py-2 rounded shadow-md border-2 border-purple-800 hover:from-purple-800 hover:to-purple-600 transition-colors duration-200"
          >
            Load
          </button>
        </form>
      )}
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {loading && <div className="text-lg animate-pulse mb-4">Loading…</div>}
      {/* Terminal-style output for all API data */}
      {authed && (
        <>
          {/* Main grid: left column = clips, right column = videos, top center = stats */}
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Clips column */}
            {profile && (
              <div className="flex flex-col gap-3">
                <div className="font-bold text-purple-400 text-center mb-2">Clips</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Top Views */}
                  <div>
                    <div className="font-semibold text-xs text-purple-300 mb-1 text-center">Top Views</div>
                    {[...clips].sort((a, b) => b.view_count - a.view_count).slice(0, 10).map((clip, i) => (
                      <div key={clip.id} className={`media-card ${colorMap[0]} rounded-lg shadow-lg flex flex-row items-center transition-transform duration-300 p-3 m-2`}>
                        <a href={clip.url} target="_blank" rel="noopener noreferrer" className="w-full">
                          <div className="relative w-full h-[96px] rounded overflow-hidden">
                            <AuthImage src={clip.thumbnail_url} alt={clip.title} fill className="object-cover w-full h-full" />
                            <div className="absolute top-0 left-0 w-full px-2 pt-1" style={{background: 'rgba(0,0,0,0.10)'}}>
                              <div className="font-bold text-xs text-white truncate" title={clip.title}>{clip.title}</div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full px-2 pb-1" style={{background: 'rgba(0,0,0,0.10)'}}>
                              <div className="text-xs text-gray-200 text-left truncate" title={clip.creator_name}>
                                by {clip.creator_name} ({clip.created_at.slice(0,10)}) - Views: {clip.view_count}
                              </div>
                            </div>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                  {/* Latest Clips */}
                  <div>
                    <div className="font-semibold text-xs text-purple-300 mb-1 text-center">Latest</div>
                    {[...clips].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10).map((clip, i) => (
                      <div key={clip.id} className={`media-card ${colorMap[0]} rounded-lg shadow-lg flex flex-row items-center transition-transform duration-300 p-3 m-2`}>
                        <a href={clip.url} target="_blank" rel="noopener noreferrer" className="w-full">
                          <div className="relative w-full h-[96px] rounded overflow-hidden">
                            <AuthImage src={clip.thumbnail_url} alt={clip.title} fill className="object-cover w-full h-full" />
                            <div className="absolute top-0 left-0 w-full px-2 pt-1" style={{background: 'rgba(0,0,0,0.10)'}}>
                              <div className="font-bold text-xs text-white truncate" title={clip.title}>{clip.title}</div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full px-2 pb-1" style={{background: 'rgba(0,0,0,0.10)'}}>
                              <div className="text-xs text-gray-200 text-left truncate" title={clip.creator_name}>
                                by {clip.creator_name} ({clip.created_at.slice(0,10)}) - Views: {clip.view_count}
                              </div>
                            </div>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Stats column (center) */}
            <div className="flex flex-col items-center">
              {clipStats && (
                <div className="w-full bg-black border-2 border-purple-700 rounded-lg shadow-lg p-4 font-mono text-green-300 mb-8">
                  <h2 className="text-lg text-purple-400 mb-2 font-bold text-center">Clipper & Clip Stats</h2>
                  {/* Top 10 chatters by clips made */}
                  <div className="mb-4">
                    <div className="font-bold text-purple-300 mb-1 text-center">Top 10 Chatters by Clips Made</div>
                    <ol className="list-decimal pl-6">
                      {clipStats.topChatters.map(([user, count]) => (
                        <li key={user}>{user} <span className="text-gray-400">({count} clips)</span></li>
                      ))}
                    </ol>
                  </div>
                  {/* Total time clipped per user */}
                  <div className="mb-4">
                    <div className="font-bold text-purple-300 mb-1 text-center">Total Time Clipped by User (seconds)</div>
                    <ol className="list-decimal pl-6">
                      {clipStats.timeBar.slice(0, 10).map(([user, time]) => (
                        <li key={user}>{user} <span className="text-gray-400">({Math.round(time)}s)</span></li>
                      ))}
                    </ol>
                  </div>
                  {/* Total view_count per creator (bar chart) */}
                  <div className="mb-4">
                    <div className="font-bold text-purple-300 mb-1 text-center">Total View Count by Clipper</div>
                    <div className="flex flex-col gap-1">
                      {(() => {
                        const maxViews = Math.max(...clipStats.viewBar.map(([, views]) => views));
                        return clipStats.viewBar.slice(0,10).map(([user, views]) => {
                          const percent = maxViews ? Math.round((views / maxViews) * 100) : 0;
                          return (
                            <div key={user} className="flex items-center gap-2 w-full">
                              <span className="w-32 truncate text-left flex-shrink-0">{user}</span>
                              <div className="flex-1 flex items-center">
                                <div className="bg-purple-700 h-3 rounded" style={{width: `${percent}%`, minWidth: 10, maxWidth: '100%'}}></div>
                              </div>
                              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{views} views</span>
                              <span className="text-xs text-purple-300 flex-shrink-0">{percent}%</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                  {/* Most featured clips by chatter */}
                  <div className="mb-4">
                    <div className="font-bold text-purple-300 mb-1 text-center">Most Featured Clips (Top 10)</div>
                    <ol className="list-decimal pl-6">
                      {clipStats.topFeatured.slice(0, 10).map(([user, count]) => (
                        <li key={user}>{user} <span className="text-gray-400">({count} featured)</span></li>
                      ))}
                    </ol>
                  </div>
                  {/* Oldest and latest clip by chatter */}
                  <div className="mb-4">
                    <div className="font-bold text-purple-300 mb-1 text-center">Oldest and Latest Clipper</div>
                    {clipStats.oldestClip && (
                      <div className="text-xs mb-1 text-center">Oldest: <span className="text-green-400">{clipStats.oldestClipper}</span> <span className="text-gray-400">({clipStats.oldestClip.created_at})</span></div>
                    )}
                    {clipStats.latestClip && (
                      <div className="text-xs text-center">Latest: <span className="text-green-400">{clipStats.latestClipper}</span> <span className="text-gray-400">({clipStats.latestClip.created_at})</span></div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Videos column */}
            {profile && (
              <div className="flex flex-col gap-3">
                <div className="font-bold text-purple-400 text-center mb-2">Videos</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Top Views */}
                  <div>
                    <div className="font-semibold text-xs text-purple-300 mb-1 text-center">Top Views</div>
                    {[...videos].sort((a, b) => b.view_count - a.view_count).slice(0, 10).map((video, i) => (
                      <div key={video.id} className={`media-card ${colorMap[2]} rounded-lg shadow-lg flex flex-row items-center transition-transform duration-300 p-3 m-2`}>
                        <a href={video.url} target="_blank" rel="noopener noreferrer" className="w-full">
                          <div className="relative w-full h-[96px] rounded overflow-hidden">
                            <AuthImage src={video.thumbnail_url} alt={video.title} fill className="object-cover w-full h-full" />
                            <div className="absolute top-0 left-0 w-full px-2 pt-1" style={{background: 'rgba(0,0,0,0.10)'}}>
                              <div className="font-bold text-xs text-white break-words whitespace-normal" style={{wordBreak:'break-word'}} title={video.title}>{video.title}</div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full px-2 pb-1" style={{background: 'rgba(0,0,0,0.10)'}}>
                              <div className="text-xs text-gray-200 text-left whitespace-nowrap overflow-hidden text-ellipsis" title={video.created_at}>
                                {video.created_at.slice(0,10)} &bull; {video.view_count} views
                              </div>
                            </div>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                  {/* Latest Videos */}
                  <div>
                    <div className="font-semibold text-xs text-purple-300 mb-1 text-center">Latest</div>
                    {[...videos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10).map((video, i) => (
                      <div key={video.id} className={`media-card ${colorMap[2]} rounded-lg shadow-lg flex flex-row items-center transition-transform duration-300 p-3 m-2`}>
                        <a href={video.url} target="_blank" rel="noopener noreferrer" className="w-full">
                          <div className="relative w-full h-[96px] rounded overflow-hidden">
                            <AuthImage src={video.thumbnail_url} alt={video.title} fill className="object-cover w-full h-full" />
                            <div className="absolute top-0 left-0 w-full px-2 pt-1" style={{background: 'rgba(0,0,0,0.10)'}}>
                              <div className="font-bold text-xs text-white break-words whitespace-normal" style={{wordBreak:'break-word'}} title={video.title}>{video.title}</div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full px-2 pb-1" style={{background: 'rgba(0,0,0,0.10)'}}>
                              <div className="text-xs text-gray-200 text-left whitespace-nowrap overflow-hidden text-ellipsis" title={video.created_at}>
                                {video.created_at.slice(0,10)} &bull; {video.view_count} views
                              </div>
                            </div>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Terminal-style output for all API data (user, channel, etc.) */}
          <div className="w-full max-w-4xl bg-black border-2 border-purple-700 rounded-lg shadow-lg p-4 font-mono text-green-300 mb-8">
            {/* ...existing code for user, channel, stream, game, followers... */}
            {/* Text links for clips and videos at the bottom */}
            {clips.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-purple-400">$</span>
                  <span className="text-green-400">twitch get-clips</span>
                  <button className="ml-auto text-xs text-purple-300 underline" onClick={() => setShowRaw(s => ({...s, clips: !s.clips}))}>{showRaw.clips ? 'Hide' : 'Show'} raw</button>
                </div>
                <ul className="pl-4">
                  {clips.map(clip => (
                    <li key={clip.id} className="mb-2">
                      <a href={clip.url} className="underline text-purple-400" target="_blank">{clip.title}</a> <span className="text-gray-400">by {clip.creator_name}</span> <span className="text-gray-500">({clip.created_at.slice(0,10)})</span>
                    </li>
                  ))}
                </ul>
                {showRaw.clips && <pre className="bg-black border border-purple-800 rounded p-2 text-xs text-purple-200 overflow-x-auto">{JSON.stringify(clips, null, 2)}</pre>}
              </section>
            )}
            {videos.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-purple-400">$</span>
                  <span className="text-green-400">twitch get-videos</span>
                  <button className="ml-auto text-xs text-purple-300 underline" onClick={() => setShowRaw(s => ({...s, videos: !s.videos}))}>{showRaw.videos ? 'Hide' : 'Show'} raw</button>
                </div>
                <ul className="pl-4">
                  {videos.map(video => (
                    <li key={video.id} className="mb-2">
                      <a href={video.url} className="underline text-purple-400" target="_blank">{video.title}</a> <span className="text-gray-400">{video.view_count} views</span> <span className="text-gray-500">({video.created_at.slice(0,10)})</span>
                    </li>
                  ))}
                </ul>
                {showRaw.videos && <pre className="bg-black border border-purple-800 rounded p-2 text-xs text-purple-200 overflow-x-auto">{JSON.stringify(videos, null, 2)}</pre>}
              </section>
            )}
          </div>
        </>
      )}
      {authed && (
        <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {clips.map((clip, i) => (
            <div key={clip.id} className={`media-card ${colorMap[0]} rounded-lg shadow-lg p-2 flex flex-col items-center transition-transform duration-300`}> 
              <a href={clip.url} target="_blank" rel="noopener noreferrer">
                <Image src={clip.thumbnail_url} alt={clip.title} width={320} height={160} className="w-full h-40 object-cover rounded mb-2" />
                <div className="font-bold text-lg mb-1">{clip.title}</div>
                <div className="text-sm text-gray-300 mb-1">{clip.creator_name}</div>
                <div className="text-xs text-gray-400">{clip.created_at.slice(0,10)}</div>
              </a>
            </div>
          ))}
          {videos.map((video, i) => (
            <div key={video.id} className={`media-card ${colorMap[2]} rounded-lg shadow-lg p-2 flex flex-col items-center transition-transform duration-300`}>
              <a href={video.url} target="_blank" rel="noopener noreferrer">
                <Image src={video.thumbnail_url} alt={video.title} width={320} height={160} className="w-full h-40 object-cover rounded mb-2" />
                <div className="font-bold text-lg mb-1">{video.title}</div>
                <div className="text-sm text-gray-300 mb-1">{video.user_name}</div>
                <div className="text-xs text-gray-400">{video.created_at.slice(0,10)}</div>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
