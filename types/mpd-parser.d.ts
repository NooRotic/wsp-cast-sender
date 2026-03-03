// Type declarations for mpd-parser
// Based on the official documentation at https://www.npmjs.com/package/mpd-parser

declare module 'mpd-parser' {
  export interface EventHandler {
    type: string;
    message: string;
  }

  export interface ParseOptions {
    manifestUri: string;
    eventHandler?: (event: EventHandler) => void;
    previousManifest?: any;
  }

  export interface MediaGroup {
    default?: boolean;
    autoselect?: boolean;
    language?: string;
    uri?: string;
    instreamId?: string;
    characteristics?: string;
    forced?: boolean;
    bandwidth?: number;
    codecs?: string;
    [key: string]: any;
  }

  export interface Segment {
    byterange?: {
      length: number;
      offset: number;
    };
    duration: number;
    attributes: any;
    discontinuity?: number;
    uri: string;
    timeline?: number;
    key?: {
      method: string;
      uri: string;
      iv: string;
    };
    map?: {
      uri: string;
      byterange?: {
        length: number;
        offset: number;
      };
    };
    'cue-out'?: string;
    'cue-out-cont'?: string;
    'cue-in'?: string;
  }

  export interface Playlist {
    attributes: {
      RESOLUTION?: {
        width: string;
        height: string;
      };
      BANDWIDTH?: string;
      CODECS?: string;
      [key: string]: any;
    };
    uri?: string;
    [key: string]: any;
  }

  export interface ParsedManifest {
    allowCache: boolean;
    contentSteering?: {
      defaultServiceLocation: string;
      proxyServerURL: string;
      queryBeforeStart: boolean;
      serverURL: string;
    };
    endList: boolean;
    mediaSequence: number;
    discontinuitySequence: number;
    playlistType: string;
    playlists: Playlist[];
    mediaGroups: {
      AUDIO: Record<string, Record<string, MediaGroup>>;
      VIDEO: Record<string, Record<string, MediaGroup>>;
      'CLOSED-CAPTIONS': Record<string, Record<string, MediaGroup>>;
      SUBTITLES: Record<string, Record<string, MediaGroup>>;
    };
    dateTimeString?: string;
    dateTimeObject?: Date;
    targetDuration?: number;
    totalDuration?: number;
    discontinuityStarts?: number[];
    segments: Segment[];
  }

  export function parse(manifest: string, options: ParseOptions): ParsedManifest;
}
