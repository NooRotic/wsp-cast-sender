// Google Cast Web Components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'google-cast-launcher': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }

  interface Window {
    cast: typeof cast;
    __onGCastApiAvailable: (isAvailable: boolean) => void;
  }

  namespace cast {
    namespace framework {
      class CastContext {
        static getInstance(): CastContext;
        getCastState(): string;
        requestSession(): Promise<CastSession>;
        getCurrentSession(): CastSession | null;
        setOptions(options: any): void;
      }

      interface CastSession {
        getCastDevice(): {
          friendlyName: string;
          deviceId: string;
        };
        sendMessage(namespace: string, data: any): Promise<void>;
        endSession(stopCasting: boolean): Promise<void>;
      }
    }
  }
}

export {};
