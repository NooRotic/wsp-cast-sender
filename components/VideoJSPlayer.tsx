import dynamic from 'next/dynamic';
import React from 'react';

const VideoJSPlayerClient = dynamic(
  () => import('./VideoJSPlayer.client').then((mod: any) => mod?.default || mod?.VideoJSPlayer || mod),
  { ssr: false }
);

export default function VideoJSPlayer(props: any) {
  return <VideoJSPlayerClient {...props} />;
}
