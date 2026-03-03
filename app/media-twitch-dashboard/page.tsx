"use client";

import React, { useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { getVideos, getClips } from "../../lib/twitchApi";
// import getUserId from the correct location or implement it here if missing

const colorMap = [
  "bg-purple-700", // Clips
  "bg-green-700",  // Featured Clips
  "bg-blue-700",   // Videos
];

export default function MediaTwitchDashboard() {
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [clips, setClips] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll(channel: string) {
    setLoading(true);
    setError("");
    setProfile(null);
    setClips([]);
    setVideos([]);
    try {
      // Fetch user info directly to get userId
      const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${channel}`, {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID!,
          "Authorization": `Bearer ${process.env.TWITCH_AUTH_TOKEN}`,
        },
      });
      const userData = await userRes.json();
      if (!userData.data || userData.data.length === 0) throw new Error("Channel not found");
      setProfile(userData.data[0]);
      const userId = userData.data[0].id;
      setProfile(userData.data[0]);
      // Get clips
      const clipsRes = await getClips(userId);
      setClips(clipsRes.data || []);
      // Get videos
      const videosRes = await getVideos(userId);
      setVideos(videosRes.data || []);
      if (typeof window !== 'undefined' && window.gsap) {
        setTimeout(() => {
          window.gsap.fromTo(
            ".media-card",
            { scale: 0.2, rotateX: 60, opacity: 0 },
            { scale: 1, rotateX: 0, opacity: 1, stagger: 0.07, duration: 1.2, ease: "power3.out" }
          );
        }, 100);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load channel data");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  if (!input.trim()) return;
  fetchAll(input.trim());
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center py-10 px-4">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8 w-full max-w-xl">
        <input
          type="text"
          className="flex-1 border-2 border-purple-600 bg-black text-green-400 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-3 py-2 font-mono shadow-md transition-colors duration-200"
          placeholder="Enter Twitch channel name (e.g. pokimane)"
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
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {loading && <div className="text-lg animate-pulse mb-4">Loading…</div>}
      {profile && (
        <div className="flex flex-col items-center mb-8">
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-purple-600 mb-4">
            <Image
              src={profile.profile_image_url}
              alt={profile.display_name}
              className="w-full h-full object-cover"
              width={320}
              height={320}
              priority
            />
          </div>
          <h2 className="text-3xl font-bold mb-1">{profile.display_name}</h2>
          <div className="text-purple-300 text-lg">@{profile.login}</div>
          <div className="text-gray-400 text-sm mt-2 max-w-xl text-center">{profile.description}</div>
        </div>
      )}
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {clips.map((clip, i) => (
          <div key={clip.id} className={`media-card ${colorMap[0]} rounded-lg shadow-lg p-2 flex flex-col items-center transition-transform duration-300`}> 
            <a href={clip.url} target="_blank" rel="noopener noreferrer">
              <Image
                src={clip.thumbnail_url}
                alt={clip.title}
                className="w-full h-40 object-cover rounded mb-2"
                width={320}
                height={160}
              />
              <div className="font-bold text-lg mb-1">{clip.title}</div>
              <div className="text-sm text-gray-300 mb-1">{clip.creator_name}</div>
              <div className="text-xs text-gray-400">{clip.created_at.slice(0,10)}</div>
            </a>
          </div>
        ))}
        {videos.map((video, i) => (
          <div key={video.id} className={`media-card ${colorMap[2]} rounded-lg shadow-lg p-2 flex flex-col items-center transition-transform duration-300`}>
            <a href={video.url} target="_blank" rel="noopener noreferrer">
              <Image
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-40 object-cover rounded mb-2"
                width={320}
                height={160}
              />
              <div className="font-bold text-lg mb-1">{video.title}</div>
              <div className="text-sm text-gray-300 mb-1">{video.user_name}</div>
              <div className="text-xs text-gray-400">{video.created_at.slice(0,10)}</div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
