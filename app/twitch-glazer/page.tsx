// This page uses the Twitch OAuth Implicit Grant Flow for authentication.
// See: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#implicit-grant-flow
"use client";

import React from "react";
import dynamic from 'next/dynamic';
const TwitchPlayer = dynamic(() => import('../../components/TwitchPlayer'), { ssr: false });
import MediaTwitchDashboard from "../../components/MediaTwitchDashboard";

export default function TwitchGlazerPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <MediaTwitchDashboard />
      </div>
      <div className="w-full max-w-2xl mt-10">
        <TwitchPlayer />
      </div>
    </main>
  );
}
