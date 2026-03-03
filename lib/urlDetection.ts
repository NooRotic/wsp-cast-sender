// URL detection utilities for different player types

export interface URLDetectionResult {
  type: 'twitch' | 'hls' | 'dash' | 'mp4' | 'unknown';
  platform?: 'twitch-clip' | 'twitch-video' | 'twitch-stream';
  originalUrl: string;
  playableUrl?: string;
  metadata?: {
    clipId?: string;
    videoId?: string;
    channelName?: string;
  };
}

/**
 * Detects URL type and determines the best player to use
 */
export function detectURLType(url: string): URLDetectionResult {
  if (!url || typeof url !== 'string') {
    return {
      type: 'unknown',
      originalUrl: url || '',
    };
  }

  const cleanUrl = url.trim().toLowerCase();

  // Twitch URL patterns
  if (isTwitchURL(cleanUrl)) {
    return detectTwitchURL(url);
  }

  // HLS streams (.m3u8)
  if (cleanUrl.includes('.m3u8') || cleanUrl.includes('m3u8')) {
    return {
      type: 'hls',
      originalUrl: url,
      playableUrl: url,
    };
  }

  // DASH streams (.mpd)
  if (cleanUrl.includes('.mpd') || cleanUrl.includes('dash')) {
    return {
      type: 'dash',
      originalUrl: url,
      playableUrl: url,
    };
  }

  // MP4 files
  if (cleanUrl.includes('.mp4') || cleanUrl.includes('.mov') || cleanUrl.includes('.avi')) {
    return {
      type: 'mp4',
      originalUrl: url,
      playableUrl: url,
    };
  }

  // Default to unknown
  return {
    type: 'unknown',
    originalUrl: url,
    playableUrl: url,
  };
}

/**
 * Checks if URL is a Twitch URL
 */
export function isTwitchURL(url: string): boolean {
  const cleanUrl = url.toLowerCase();
  return (
    cleanUrl.includes('twitch.tv') ||
    cleanUrl.includes('clips.twitch.tv') ||
    cleanUrl.includes('m.twitch.tv')
  );
}

/**
 * Detects specific Twitch URL type and extracts metadata
 */
export function detectTwitchURL(url: string): URLDetectionResult {
  const cleanUrl = url.trim();

  // Twitch clip patterns
  // https://clips.twitch.tv/ClipSlug
  // https://www.twitch.tv/username/clip/ClipSlug
  const clipRegex = /(?:clips\.twitch\.tv\/|twitch\.tv\/\w+\/clip\/)([a-zA-Z0-9_-]+)/i;
  const clipMatch = cleanUrl.match(clipRegex);
  
  if (clipMatch) {
    return {
      type: 'twitch',
      platform: 'twitch-clip',
      originalUrl: url,
      playableUrl: url, // ReactPlayer handles Twitch URLs directly
      metadata: {
        clipId: clipMatch[1],
      },
    };
  }

  // Twitch VOD patterns
  // https://www.twitch.tv/videos/123456789
  const vodRegex = /twitch\.tv\/videos\/(\d+)/i;
  const vodMatch = cleanUrl.match(vodRegex);
  
  if (vodMatch) {
    return {
      type: 'twitch',
      platform: 'twitch-video',
      originalUrl: url,
      playableUrl: url,
      metadata: {
        videoId: vodMatch[1],
      },
    };
  }

  // Twitch live stream patterns
  // https://www.twitch.tv/username
  const streamRegex = /twitch\.tv\/([a-zA-Z0-9_-]+)(?:\/|$)/i;
  const streamMatch = cleanUrl.match(streamRegex);
  
  if (streamMatch && !cleanUrl.includes('/clip/') && !cleanUrl.includes('/videos/')) {
    return {
      type: 'twitch',
      platform: 'twitch-stream',
      originalUrl: url,
      playableUrl: url,
      metadata: {
        channelName: streamMatch[1],
      },
    };
  }

  // Fallback for any Twitch URL
  return {
    type: 'twitch',
    originalUrl: url,
    playableUrl: url,
  };
}

/**
 * Gets a display name for the URL type
 */
export function getURLTypeDisplayName(result: URLDetectionResult): string {
  switch (result.type) {
    case 'twitch':
      switch (result.platform) {
        case 'twitch-clip': return 'Twitch Clip';
        case 'twitch-video': return 'Twitch VOD';
        case 'twitch-stream': return 'Twitch Stream';
        default: return 'Twitch Content';
      }
    case 'hls': return 'HLS Stream';
    case 'dash': return 'DASH Stream';
    case 'mp4': return 'MP4 Video';
    default: return 'Unknown';
  }
}

/**
 * Determines which player component to use
 */
export function getRecommendedPlayer(result: URLDetectionResult): 'videojs' | 'reactplayer' | 'dashjs' {
  switch (result.type) {
    case 'twitch':
      return 'reactplayer'; // ReactPlayer handles Twitch best
    case 'dash':
      return 'dashjs'; // DashJS is best for DASH
    case 'hls':
    case 'mp4':
      return 'videojs'; // Video.js handles these well
    default:
      return 'videojs'; // Default fallback
  }
}
