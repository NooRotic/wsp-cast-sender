/**
 * DASH Manifest Parser Utilities
 * Provides parsing capabilities for MPEG-DASH (.mpd) manifests
 * Complements the existing M3U8 parsing for complete adaptive streaming support
 */

import { parse as parseMPD, ParsedManifest, ParseOptions } from 'mpd-parser';

export interface ParsedDashInfo {
  isValid: boolean;
  totalDuration?: number;
  videoQualities: Array<{
    width: number;
    height: number;
    bitrate: number;
    codecs: string;
  }>;
  audioTracks: Array<{
    language: string;
    bitrate: number;
    codecs: string;
  }>;
  subtitles: Array<{
    language: string;
    uri?: string;
  }>;
  isLive: boolean;
  error?: string;
}

export function parseDashManifest(manifestContent: string, manifestUri: string): ParsedDashInfo {
  try {
    const eventHandler = ({ type, message }: { type: string; message: string }) => {
      console.log(`DASH Parser ${type}: ${message}`);
    };

    const parsedManifest: ParsedManifest = parseMPD(manifestContent, { 
      manifestUri, 
      eventHandler 
    });

    // Extract video qualities
    const videoQualities = extractVideoQualities(parsedManifest);
    
    // Extract audio tracks
    const audioTracks = extractAudioTracks(parsedManifest);
    
    // Extract subtitles
    const subtitles = extractSubtitles(parsedManifest);
    
    // Determine if it's live
    const isLive = !parsedManifest.endList || parsedManifest.playlistType !== 'VOD';
    
    return {
      isValid: true,
      totalDuration: parsedManifest.totalDuration,
      videoQualities,
      audioTracks,
      subtitles,
      isLive
    };

  } catch (error) {
    console.error('Error parsing DASH manifest:', error);
    return {
      isValid: false,
      videoQualities: [],
      audioTracks: [],
      subtitles: [],
      isLive: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    };
  }
}

/**
 * Extract video quality information from parsed manifest
 */
function extractVideoQualities(manifest: ParsedManifest): Array<{
  width: number;
  height: number;
  bitrate: number;
  codecs: string;
}> {
  const qualities: Array<{
    width: number;
    height: number;
    bitrate: number;
    codecs: string;
  }> = [];

  try {
    // Extract from playlists (video representations)
    manifest.playlists?.forEach((playlist) => {
      const attrs = playlist.attributes || {};
      if (attrs.RESOLUTION && attrs.BANDWIDTH) {
        qualities.push({
          width: parseInt(attrs.RESOLUTION.width) || 0,
          height: parseInt(attrs.RESOLUTION.height) || 0,
          bitrate: parseInt(attrs.BANDWIDTH) || 0,
          codecs: attrs.CODECS || 'unknown'
        });
      }
    });

    // Sort by bitrate (highest first)
    return qualities.sort((a, b) => b.bitrate - a.bitrate);
  } catch (error) {
    console.warn('Error extracting video qualities:', error);
    return [];
  }
}

/**
 * Extract audio track information from parsed manifest
 */
function extractAudioTracks(manifest: ParsedManifest): Array<{
  language: string;
  bitrate: number;
  codecs: string;
}> {
  const audioTracks: Array<{
    language: string;
    bitrate: number;
    codecs: string;
  }> = [];

  try {
    const audioGroups = manifest.mediaGroups?.AUDIO || {};
    
    Object.keys(audioGroups).forEach(groupId => {
      const group = audioGroups[groupId];
      Object.keys(group).forEach(trackId => {
        const track = group[trackId];
        audioTracks.push({
          language: track.language || 'unknown',
          bitrate: track.bandwidth || 0,
          codecs: track.codecs || 'unknown'
        });
      });
    });

    return audioTracks;
  } catch (error) {
    console.warn('Error extracting audio tracks:', error);
    return [];
  }
}

/**
 * Extract subtitle information from parsed manifest
 */
function extractSubtitles(manifest: ParsedManifest): Array<{
  language: string;
  uri?: string;
}> {
  const subtitles: Array<{
    language: string;
    uri?: string;
  }> = [];

  try {
    const subtitleGroups = manifest.mediaGroups?.SUBTITLES || {};
    
    Object.keys(subtitleGroups).forEach(groupId => {
      const group = subtitleGroups[groupId];
      Object.keys(group).forEach(trackId => {
        const track = group[trackId];
        subtitles.push({
          language: track.language || 'unknown',
          uri: track.uri
        });
      });
    });

    return subtitles;
  } catch (error) {
    console.warn('Error extracting subtitles:', error);
    return [];
  }
}

/**
 * Test DASH parsing with a sample manifest URL
 */
export async function testDashParsing(manifestUrl: string): Promise<ParsedDashInfo> {
  try {
    console.log('🎬 Testing DASH parsing for:', manifestUrl);
    
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const manifestContent = await response.text();
    console.log('📄 DASH manifest fetched, length:', manifestContent.length);
    
    const parsedInfo = parseDashManifest(manifestContent, manifestUrl);
    
    console.log('🎯 DASH parsing result:', {
      isValid: parsedInfo.isValid,
      videoQualities: parsedInfo.videoQualities.length,
      audioTracks: parsedInfo.audioTracks.length,
      subtitles: parsedInfo.subtitles.length,
      isLive: parsedInfo.isLive,
      duration: parsedInfo.totalDuration
    });
    
    return parsedInfo;
    
  } catch (error) {
    console.error('❌ DASH test failed:', error);
    return {
      isValid: false,
      videoQualities: [],
      audioTracks: [],
      subtitles: [],
      isLive: false,
      error: error instanceof Error ? error.message : 'Unknown test error'
    };
  }
}
