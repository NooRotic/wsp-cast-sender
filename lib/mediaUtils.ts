/**
 * Media Type Detection and Categorization Utilities
 * Properly categorizes video streams including DASH, HLS, MP4, etc.
 */

export interface MediaCategory {
  type: 'HLS' | 'DASH' | 'MP4' | 'AUDIO_ONLY' | 'VIDEO_ONLY' | 'LIVE' | 'VOD' | 'DRM';
  subType?: 'LL_HLS' | 'ENCRYPTED' | 'MULTI_PERIOD' | '4K' | 'HEVC' | 'WIDEVINE' | 'PLAYREADY' | 'DATA_URI';
  contentType: 'video' | 'audio' | 'mixed';
  streamType: 'live' | 'vod';
  hasEncryption: boolean;
  quality?: 'SD' | 'HD' | '4K' | '8K';
  features: string[];
}

export interface Video {
  id: number;
  title: string;
  src: string;
  poster?: string;
  duration: string;
  mimetype?: string;
  name?: string;
  uri?: string;
  features?: string[];
  keySystems?: any;
  m3uData?: {
    tvgId?: string;
    tvgLogo?: string;
    groupTitle?: string;
  };
}

/**
 * Categorize media stream based on URL, mimetype, and metadata
 */
export function categorizeMedia(video: Video): MediaCategory {
  const src = video.src || video.uri || '';
  const mimetype = video.mimetype || '';
  const features = video.features || [];
  const hasKeySystems = !!(video.keySystems && Object.keys(video.keySystems).length > 0);
  
  // Determine primary type
  let type: MediaCategory['type'] = 'MP4';
  let subType: MediaCategory['subType'] | undefined;
  let contentType: MediaCategory['contentType'] = 'mixed';
  let streamType: MediaCategory['streamType'] = 'vod';
  let quality: MediaCategory['quality'] | undefined;
  
  // DASH Detection
  if (src.includes('.mpd') || mimetype.includes('dash') || mimetype.includes('application/dash+xml')) {
    type = 'DASH';
    
    // DASH subtypes
    if (hasKeySystems) {
      if (video.keySystems['com.widevine.alpha']) subType = 'WIDEVINE';
      else if (video.keySystems['com.microsoft.playready']) subType = 'PLAYREADY';
      else subType = 'ENCRYPTED';
    }
  }
  
  // HLS Detection
  else if (src.includes('.m3u8') || mimetype.includes('mpegurl') || mimetype.includes('application/x-mpegURL')) {
    type = 'HLS';
    
    // Low Latency HLS
    if (features.includes('low-latency') || features.includes('ll-hls')) {
      subType = 'LL_HLS';
    }
  }
  
  // MP4/Direct video
  else if (src.includes('.mp4') || src.includes('.webm') || src.includes('.mov') || mimetype.includes('video/')) {
    type = 'MP4';
  }
  
  // Audio-only detection
  else if (src.includes('.mp3') || src.includes('.aac') || src.includes('.m4a') || mimetype.includes('audio/')) {
    type = 'AUDIO_ONLY';
    contentType = 'audio';
  }
  
  // Live stream detection
  if (features.includes('live') || video.duration === 'LIVE' || src.includes('live')) {
    streamType = 'live';
    if (type === 'DASH' || type === 'HLS') {
      // Keep original type but note it's live
    } else {
      type = 'LIVE';
    }
  }
  
  // DRM detection
  if (hasKeySystems || features.includes('drm') || features.includes('encrypted')) {
    if (type !== 'DASH' && type !== 'HLS') {
      type = 'DRM';
    }
  }
  
  // Quality detection
  if (src.includes('4k') || src.includes('2160p') || features.includes('4K')) {
    quality = '4K';
    subType = subType || '4K';
  } else if (src.includes('8k') || src.includes('4320p')) {
    quality = '8K';
  } else if (src.includes('1080p') || src.includes('720p')) {
    quality = 'HD';
  } else if (src.includes('480p') || src.includes('360p')) {
    quality = 'SD';
  }
  
  // HEVC detection
  if (src.includes('hevc') || src.includes('h265') || features.includes('hevc')) {
    subType = subType || 'HEVC';
  }
  
  return {
    type,
    subType,
    contentType,
    streamType,
    hasEncryption: hasKeySystems,
    quality,
    features
  };
}

/**
 * Get a human-readable description of the media type
 */
export function getMediaDescription(category: MediaCategory): string {
  const parts: string[] = [];
  
  // Main type
  switch (category.type) {
    case 'DASH':
      parts.push('MPEG-DASH');
      break;
    case 'HLS':
      parts.push('HLS');
      break;
    case 'MP4':
      parts.push('MP4');
      break;
    case 'LIVE':
      parts.push('Live Stream');
      break;
    case 'DRM':
      parts.push('DRM Protected');
      break;
    case 'AUDIO_ONLY':
      parts.push('Audio Only');
      break;
    default:
      parts.push(category.type);
  }
  
  // Quality
  if (category.quality) {
    parts.push(category.quality);
  }
  
  // Sub-type
  if (category.subType) {
    switch (category.subType) {
      case 'LL_HLS':
        parts.push('Low Latency');
        break;
      case 'WIDEVINE':
        parts.push('Widevine');
        break;
      case 'PLAYREADY':
        parts.push('PlayReady');
        break;
      case 'ENCRYPTED':
        parts.push('Encrypted');
        break;
      case 'HEVC':
        parts.push('HEVC');
        break;
      case '4K':
        parts.push('4K');
        break;
      default:
        parts.push(category.subType);
    }
  }
  
  // Stream type
  if (category.streamType === 'live') {
    parts.push('Live');
  }
  
  return parts.join(' • ');
}

/**
 * Get appropriate emoji/icon for media type
 */
export function getMediaIcon(category: MediaCategory): string {
  switch (category.type) {
    case 'DASH':
      return '🎬'; // DASH
    case 'HLS':
      return '📺'; // HLS
    case 'MP4':
      return '🎥'; // MP4
    case 'LIVE':
      return '🔴'; // Live
    case 'DRM':
      return '🔐'; // DRM
    case 'AUDIO_ONLY':
      return '🎵'; // Audio
    default:
      return '🎞️'; // Generic video
  }
}

/**
 * Get color scheme for media type (for UI styling)
 */
export function getMediaColors(category: MediaCategory): {
  bg: string;
  border: string;
  text: string;
} {
  switch (category.type) {
    case 'DASH':
      return {
        bg: 'from-purple-500/20 to-indigo-500/20',
        border: 'border-purple-500/30',
        text: 'text-purple-200'
      };
    case 'HLS':
      return {
        bg: 'from-green-500/20 to-emerald-500/20',
        border: 'border-green-500/30',
        text: 'text-green-200'
      };
    case 'MP4':
      return {
        bg: 'from-blue-500/20 to-cyan-500/20',
        border: 'border-blue-500/30',
        text: 'text-blue-200'
      };
    case 'LIVE':
      return {
        bg: 'from-red-500/20 to-pink-500/20',
        border: 'border-red-500/30',
        text: 'text-red-200'
      };
    case 'DRM':
      return {
        bg: 'from-yellow-500/20 to-orange-500/20',
        border: 'border-yellow-500/30',
        text: 'text-yellow-200'
      };
    default:
      return {
        bg: 'from-gray-500/20 to-slate-500/20',
        border: 'border-gray-500/30',
        text: 'text-gray-200'
      };
  }
}
