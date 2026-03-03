/**
 * Enhanced Session Storage Utility for CAF Session Persistence
 * Handles saving and retrieving session IDs following Cast Application Framework patterns
 *
 * CAF Session Management Best Practices:
 * - Use session.getSessionId() as the authoritative session identifier
 * - Sessions managed by CAF have built-in expiration and validation
 * - Session restoration depends on receiver app availability and device state
 * - Always validate session state before attempting operations
 * - Handle CAF session state changes (STARTED, RESUMED, ENDED, ENDING)
 * - Use senderId for receiver-side session correlation
 * - Implement proper message acknowledgment patterns
 * - Consider network conditions and device sleep states
 * - Session IDs are unique per sender-receiver connection pair
 */

export interface CastSessionData {
  sessionId: string;
  timestamp: number;
  deviceName?: string;
  applicationId?: string;
  namespace?: string;
  // Enhanced CAF-specific properties
  castState?: cast.framework.SessionState;
  receiverApplicationId?: string;
  sessionMetadata?: {
    deviceCapabilities?: string[];
    receiverVersion?: string;
    senderUserAgent?: string;
  };
}

const CAST_SESSION_KEY = 'cast_session_data';
const SESSION_EXPIRY_TIME = 4 * 60 * 60 * 1000; // 4 hours

export class CastSessionStorage {
  /**
   * Check if localStorage is available (client-side)
   */
  static isLocalStorageAvailable(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save session data to localStorage
   */
  static saveSession(sessionData: CastSessionData): void {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage not available, cannot save session');
      return;
    }

    try {
      const dataToStore = {
        ...sessionData,
        timestamp: Date.now()
      };
      localStorage.setItem(CAST_SESSION_KEY, JSON.stringify(dataToStore));
      console.log('📱 Session saved to localStorage:', dataToStore);
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
    }
  }

  /**
   * Retrieve session data from localStorage
   */
  static getSession(): CastSessionData | null {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage not available, cannot retrieve session');
      return null;
    }

    try {
      const stored = localStorage.getItem(CAST_SESSION_KEY);
      if (!stored) {
        return null;
      }

      const sessionData: CastSessionData = JSON.parse(stored);

      // Check if session has expired
      const now = Date.now();
      if (now - sessionData.timestamp > SESSION_EXPIRY_TIME) {
        console.log('📱 Stored session has expired, removing...');
        this.clearSession();
        return null;
      }

      console.log('📱 Retrieved session from localStorage:', sessionData);
      return sessionData;
    } catch (error) {
      console.error('Failed to retrieve session from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear session data from localStorage
   */
  static clearSession(): void {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage not available, cannot clear session');
      return;
    }

    try {
      localStorage.removeItem(CAST_SESSION_KEY);
      console.log('📱 Session cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear session from localStorage:', error);
    }
  }

  /**
   * Update session timestamp to extend expiry
   */
  static refreshSession(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    const session = this.getSession();
    if (session) {
      this.saveSession(session);
    }
  }

  /**
   * Check if a session exists and is valid
   */
  static hasValidSession(): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    const session = this.getSession();
    return session !== null;
  }

  /**
   * Get session ID if available
   */
  static getSessionId(): string | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    const session = this.getSession();
    return session ? session.sessionId : null;
  }

  /**
   * Validate session with Cast SDK and resume if possible
   * Returns true if session is active and resumed, false otherwise
   */
  static async validateAndResumeSession(): Promise<boolean> {
    if (!this.isLocalStorageAvailable()) return false;

    const session = this.getSession();
    if (!session) return false;

    // Check with Cast SDK if session is still active
    const castContext = (window as any).cast?.framework?.CastContext?.getInstance?.();
    if (!castContext) return false;

    const currentSession = castContext.getCurrentSession?.();
    if (currentSession && currentSession.getSessionId() === session.sessionId) {
      // Session is active, resume control
      console.log('✅ Cast SDK session is active, resuming...');
      return true;
    } else {
      // Session not active, clear localStorage
      this.clearSession();
      return false;
    }
  }
}
