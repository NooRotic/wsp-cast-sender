// This file provides the correct type for the ReactPlayer config prop for Twitch support.
// See: https://github.com/cookpete/react-player#config-prop

export interface ReactPlayerConfig {
  twitch?: {
    options?: {
      parent?: string[];
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}
