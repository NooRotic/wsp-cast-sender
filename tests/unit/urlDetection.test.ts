import {
  detectURLType,
  isTwitchURL,
  detectTwitchURL,
  getURLTypeDisplayName,
  getRecommendedPlayer,
} from '../../lib/urlDetection';

// ---------------------------------------------------------------------------
// isTwitchURL
// ---------------------------------------------------------------------------
describe('isTwitchURL', () => {
  it('matches twitch.tv channel URLs', () => {
    expect(isTwitchURL('https://www.twitch.tv/shroud')).toBe(true);
  });

  it('matches clips.twitch.tv URLs', () => {
    expect(isTwitchURL('https://clips.twitch.tv/SomeClugSlug')).toBe(true);
  });

  it('matches m.twitch.tv mobile URLs', () => {
    expect(isTwitchURL('https://m.twitch.tv/shroud')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isTwitchURL('https://TWITCH.TV/shroud')).toBe(true);
  });

  it('does not match unrelated URLs', () => {
    expect(isTwitchURL('https://youtube.com/watch?v=abc')).toBe(false);
    expect(isTwitchURL('https://example.com/video.m3u8')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectURLType — HLS
// ---------------------------------------------------------------------------
describe('detectURLType — HLS', () => {
  it('detects .m3u8 URLs', () => {
    const result = detectURLType('https://cdn.example.com/stream/master.m3u8');
    expect(result.type).toBe('hls');
    expect(result.playableUrl).toBe('https://cdn.example.com/stream/master.m3u8');
  });

  it('detects m3u8 in query params', () => {
    const url = 'https://cdn.example.com/stream?format=m3u8&token=abc';
    const result = detectURLType(url);
    expect(result.type).toBe('hls');
  });

  it('preserves originalUrl', () => {
    const url = 'https://cdn.example.com/live.m3u8';
    expect(detectURLType(url).originalUrl).toBe(url);
  });
});

// ---------------------------------------------------------------------------
// detectURLType — DASH
// ---------------------------------------------------------------------------
describe('detectURLType — DASH', () => {
  it('detects .mpd URLs', () => {
    const result = detectURLType('https://cdn.example.com/manifest.mpd');
    expect(result.type).toBe('dash');
  });

  it('detects URLs containing "dash" in path', () => {
    const result = detectURLType('https://cdn.example.com/dash/manifest');
    expect(result.type).toBe('dash');
  });
});

// ---------------------------------------------------------------------------
// detectURLType — MP4
// ---------------------------------------------------------------------------
describe('detectURLType — MP4 / video files', () => {
  it('detects .mp4 URLs', () => {
    const result = detectURLType('https://cdn.example.com/video.mp4');
    expect(result.type).toBe('mp4');
  });

  it('detects .mov URLs', () => {
    const result = detectURLType('https://cdn.example.com/clip.mov');
    expect(result.type).toBe('mp4');
  });

  it('detects .avi URLs', () => {
    const result = detectURLType('https://cdn.example.com/file.avi');
    expect(result.type).toBe('mp4');
  });
});

// ---------------------------------------------------------------------------
// detectURLType — Twitch (routed through detectTwitchURL)
// ---------------------------------------------------------------------------
describe('detectURLType — Twitch', () => {
  it('routes all Twitch URLs to type=twitch', () => {
    const result = detectURLType('https://www.twitch.tv/shroud');
    expect(result.type).toBe('twitch');
  });
});

// ---------------------------------------------------------------------------
// detectURLType — edge cases
// ---------------------------------------------------------------------------
describe('detectURLType — edge cases', () => {
  it('returns unknown for unrecognised URLs', () => {
    const result = detectURLType('https://example.com/some-page');
    expect(result.type).toBe('unknown');
  });

  it('handles empty string', () => {
    const result = detectURLType('');
    expect(result.type).toBe('unknown');
    expect(result.originalUrl).toBe('');
  });

  it('handles null-like input gracefully', () => {
    // @ts-expect-error testing invalid input
    const result = detectURLType(null);
    expect(result.type).toBe('unknown');
  });

  it('trims whitespace before matching', () => {
    const result = detectURLType('  https://cdn.example.com/live.m3u8  ');
    expect(result.type).toBe('hls');
  });
});

// ---------------------------------------------------------------------------
// detectTwitchURL — platform detection
// ---------------------------------------------------------------------------
describe('detectTwitchURL', () => {
  it('detects clips.twitch.tv clip URLs', () => {
    const result = detectTwitchURL('https://clips.twitch.tv/FunnyClipSlug');
    expect(result.platform).toBe('twitch-clip');
    expect(result.metadata?.clipId).toBe('FunnyClipSlug');
  });

  it('detects /clip/ path on twitch.tv', () => {
    const result = detectTwitchURL('https://www.twitch.tv/shroud/clip/FunnyClipSlug');
    expect(result.platform).toBe('twitch-clip');
    expect(result.metadata?.clipId).toBe('FunnyClipSlug');
  });

  it('detects Twitch VOD URLs', () => {
    const result = detectTwitchURL('https://www.twitch.tv/videos/123456789');
    expect(result.platform).toBe('twitch-video');
    expect(result.metadata?.videoId).toBe('123456789');
  });

  it('detects live channel stream URLs', () => {
    const result = detectTwitchURL('https://www.twitch.tv/shroud');
    expect(result.platform).toBe('twitch-stream');
    expect(result.metadata?.channelName).toBe('shroud');
  });

  it('always sets type=twitch', () => {
    const urls = [
      'https://clips.twitch.tv/FunnyClipSlug',
      'https://www.twitch.tv/videos/123456789',
      'https://www.twitch.tv/shroud',
    ];
    urls.forEach(url => {
      expect(detectTwitchURL(url).type).toBe('twitch');
    });
  });

  it('preserves playableUrl as the original URL', () => {
    const url = 'https://www.twitch.tv/shroud';
    const result = detectTwitchURL(url);
    expect(result.playableUrl).toBe(url);
  });
});

// ---------------------------------------------------------------------------
// getRecommendedPlayer
// ---------------------------------------------------------------------------
describe('getRecommendedPlayer', () => {
  it('routes twitch → reactplayer', () => {
    expect(getRecommendedPlayer({ type: 'twitch', originalUrl: '' })).toBe('reactplayer');
  });

  it('routes dash → dashjs', () => {
    expect(getRecommendedPlayer({ type: 'dash', originalUrl: '' })).toBe('dashjs');
  });

  it('routes hls → videojs', () => {
    expect(getRecommendedPlayer({ type: 'hls', originalUrl: '' })).toBe('videojs');
  });

  it('routes mp4 → videojs', () => {
    expect(getRecommendedPlayer({ type: 'mp4', originalUrl: '' })).toBe('videojs');
  });

  it('routes unknown → videojs (default fallback)', () => {
    expect(getRecommendedPlayer({ type: 'unknown', originalUrl: '' })).toBe('videojs');
  });
});

// ---------------------------------------------------------------------------
// getURLTypeDisplayName
// ---------------------------------------------------------------------------
describe('getURLTypeDisplayName', () => {
  it('returns "Twitch Clip" for twitch-clip platform', () => {
    expect(getURLTypeDisplayName({ type: 'twitch', platform: 'twitch-clip', originalUrl: '' })).toBe('Twitch Clip');
  });

  it('returns "Twitch VOD" for twitch-video platform', () => {
    expect(getURLTypeDisplayName({ type: 'twitch', platform: 'twitch-video', originalUrl: '' })).toBe('Twitch VOD');
  });

  it('returns "Twitch Stream" for twitch-stream platform', () => {
    expect(getURLTypeDisplayName({ type: 'twitch', platform: 'twitch-stream', originalUrl: '' })).toBe('Twitch Stream');
  });

  it('returns "Twitch Content" for twitch without platform', () => {
    expect(getURLTypeDisplayName({ type: 'twitch', originalUrl: '' })).toBe('Twitch Content');
  });

  it('returns "HLS Stream" for hls', () => {
    expect(getURLTypeDisplayName({ type: 'hls', originalUrl: '' })).toBe('HLS Stream');
  });

  it('returns "DASH Stream" for dash', () => {
    expect(getURLTypeDisplayName({ type: 'dash', originalUrl: '' })).toBe('DASH Stream');
  });

  it('returns "MP4 Video" for mp4', () => {
    expect(getURLTypeDisplayName({ type: 'mp4', originalUrl: '' })).toBe('MP4 Video');
  });

  it('returns "Unknown" for unknown type', () => {
    expect(getURLTypeDisplayName({ type: 'unknown', originalUrl: '' })).toBe('Unknown');
  });
});

// ---------------------------------------------------------------------------
// Integration: detectURLType → getRecommendedPlayer round-trip
// ---------------------------------------------------------------------------
describe('URL detection → player routing (round-trip)', () => {
  const cases: [string, string, 'videojs' | 'reactplayer' | 'dashjs'][] = [
    ['HLS stream', 'https://cdn.example.com/live.m3u8', 'videojs'],
    ['DASH manifest', 'https://cdn.example.com/manifest.mpd', 'dashjs'],
    ['MP4 file', 'https://cdn.example.com/video.mp4', 'videojs'],
    ['Twitch channel', 'https://www.twitch.tv/shroud', 'reactplayer'],
    ['Twitch VOD', 'https://www.twitch.tv/videos/987654321', 'reactplayer'],
    ['Twitch clip', 'https://clips.twitch.tv/FunnySlug', 'reactplayer'],
  ];

  test.each(cases)('%s routes to %s player', (_label, url, expectedPlayer) => {
    const result = detectURLType(url);
    expect(getRecommendedPlayer(result)).toBe(expectedPlayer);
  });
});
