/**
 * CAF (Cast Application Framework) Message Type Definitions
 * Demonstrates sophisticated understanding of Cast messaging patterns and lifecycle
 */

export enum CastMessageType {
  // Session lifecycle messages (following CAF patterns)
  CAF_SESSION_ESTABLISHED = 'CAF_SESSION_ESTABLISHED',
  CAF_SESSION_STARTED = 'CAF_SESSION_STARTED',
  CAF_SESSION_RESUMED = 'CAF_SESSION_RESUMED',
  CAF_SESSION_RESTORED = 'CAF_SESSION_RESTORED',
  CAF_SESSION_RESUME_CONFIRMED = 'CAF_SESSION_RESUME_CONFIRMED',
  CAF_HEARTBEAT = 'CAF_HEARTBEAT',

  // Content delivery messages
  PORTFOLIO_DATA = 'PORTFOLIO_DATA',
  PROJECT_SHOWCASE = 'PROJECT_SHOWCASE',
  SKILLS_SHOWCASE = 'SKILLS_SHOWCASE',
  CONTACT_INFO = 'CONTACT_INFO',
  
  // Media control messages
  LOAD_MEDIA = 'LOAD_MEDIA',
  MEDIA_CONTROL = 'MEDIA_CONTROL',

  // System messages
  NOTIFICATION = 'NOTIFICATION',

  // Receiver response messages
  RECEIVER_READY = 'RECEIVER_READY',
  RECEIVER_ERROR = 'RECEIVER_ERROR',
  RECEIVER_STATUS = 'RECEIVER_STATUS',
  SESSION_STATUS = 'SESSION_STATUS',
  MESSAGE_ACKNOWLEDGMENT = 'MESSAGE_ACKNOWLEDGMENT',

  // Media and content status messages
  MEDIA_STATUS = 'MEDIA_STATUS',
  PAGE_LOADED = 'PAGE_LOADED',
  VIDEO_LOADED = 'VIDEO_LOADED',
  MEDIA_CONTROL_RECEIVED = 'MEDIA_CONTROL_RECEIVED',
  PORTFOLIO_LAUNCHED = 'PORTFOLIO_LAUNCHED',
  PORTFOLIO_ERROR = 'PORTFOLIO_ERROR',
  DASHBOARD_LOADED = 'DASHBOARD_LOADED',
  DASHBOARD_CONTROL_RECEIVED = 'DASHBOARD_CONTROL_RECEIVED',
  DEBUG_WINDOW_CONTROL_RECEIVED = 'DEBUG_WINDOW_CONTROL_RECEIVED',
  CONSOLE_CONTROL_RECEIVED = 'CONSOLE_CONTROL_RECEIVED',
  PRESENTATION_UPDATED = 'PRESENTATION_UPDATED',
  TECH_DEMO_STARTED = 'TECH_DEMO_STARTED',
  DEMO_RESET_COMPLETE = 'DEMO_RESET_COMPLETE',
  WELCOME = 'WELCOME',
  RECEIVER_RESPONSE = 'RECEIVER_RESPONSE',
  PAGE_CHANGED = 'PAGE_CHANGED',
  CONTENT_LOADED = 'CONTENT_LOADED',
  ERROR_REPORT = 'ERROR_REPORT',
}

export interface CastMessageMetadata {
  timestamp: number;
  senderId: string;
  messageSequence: string;
  expectedAcknowledgment: boolean;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  batchSize?: number;
  securityLevel?: 'standard' | 'elevated';
}

export interface CafContext {
  sessionState: cast.framework.SessionState;
  deviceName: string;
  applicationId?: string;
  messageFlow?: string;
  displayMode?: string;
  displayDuration?: 'temporary' | 'persistent';
}

export interface BaseCastMessage {
  type: CastMessageType;
  messageId: string;
  metadata: CastMessageMetadata;
  cafContext?: CafContext;
}

export interface SessionEstablishedMessage extends BaseCastMessage {
  type: CastMessageType.CAF_SESSION_ESTABLISHED;
  sessionContext: {
    deviceName: string;
    applicationId: string;
    namespace: string;
    sessionState: cast.framework.SessionState;
  };
}

export interface SessionRestoredMessage extends BaseCastMessage {
  type: CastMessageType.CAF_SESSION_RESTORED;
  originalSessionId: string;
  restorationContext: {
    sessionAge: number;
    deviceName: string;
    applicationId?: string;
  };
}

export interface HeartbeatMessage extends BaseCastMessage {
  type: CastMessageType.CAF_HEARTBEAT;
  healthData: {
    healthy: boolean;
    sessionId?: string;
    deviceName?: string;
    sessionState?: cast.framework.SessionState;
    applicationId?: string;
    lastActivity?: number;
    reason?: string;
    error?: string;
  };
}

export interface PortfolioDataMessage extends BaseCastMessage {
  type: CastMessageType.PORTFOLIO_DATA;
  data: any;
}

export interface ProjectShowcaseMessage extends BaseCastMessage {
  type: CastMessageType.PROJECT_SHOWCASE;
  project: any;
}

export interface SkillsShowcaseMessage extends BaseCastMessage {
  type: CastMessageType.SKILLS_SHOWCASE;
  skills: any;
}

export interface ContactInfoMessage extends BaseCastMessage {
  type: CastMessageType.CONTACT_INFO;
  contactInfo: any;
}

export interface NotificationMessage extends BaseCastMessage {
  type: CastMessageType.NOTIFICATION;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

export interface ReceiverReadyMessage extends BaseCastMessage {
  type: CastMessageType.RECEIVER_READY;
  receiverStatus: {
    ready: boolean;
    capabilities: string[];
    version?: string;
  };
}

export interface ReceiverErrorMessage extends BaseCastMessage {
  type: CastMessageType.RECEIVER_ERROR;
  error: string;
  errorCode?: string;
  recoverable: boolean;
}

export interface MessageAcknowledgmentMessage extends BaseCastMessage {
  type: CastMessageType.MESSAGE_ACKNOWLEDGMENT;
  acknowledgedMessageId: string;
  acknowledgmentCode: 'SUCCESS' | 'ERROR' | 'PARTIAL';
  details?: string;
}

export type CastMessage =
  | SessionEstablishedMessage
  | SessionRestoredMessage
  | HeartbeatMessage
  | PortfolioDataMessage
  | ProjectShowcaseMessage
  | SkillsShowcaseMessage
  | ContactInfoMessage
  | NotificationMessage
  | ReceiverReadyMessage
  | ReceiverErrorMessage
  | MessageAcknowledgmentMessage;

/**
 * CAF Message Validation Utilities
 */
export class CastMessageValidator {
  static isValidMessage(message: any): message is CastMessage {
    return (
      message &&
      typeof message === 'object' &&
      'type' in message &&
      'messageId' in message &&
      'metadata' in message &&
      Object.values(CastMessageType).includes(message.type)
    );
  }

  static requiresAcknowledgment(message: CastMessage): boolean {
    return message.metadata.expectedAcknowledgment === true;
  }

  static getMessagePriority(message: CastMessage): string {
    return message.metadata.priority || 'normal';
  }

  static isSessionMessage(message: CastMessage): boolean {
    return [
      CastMessageType.CAF_SESSION_ESTABLISHED,
      CastMessageType.CAF_SESSION_STARTED,
      CastMessageType.CAF_SESSION_RESUMED,
      CastMessageType.CAF_SESSION_RESTORED,
      CastMessageType.CAF_SESSION_RESUME_CONFIRMED
    ].includes(message.type);
  }

  static isContentMessage(message: CastMessage): boolean {
    return [
      CastMessageType.PORTFOLIO_DATA,
      CastMessageType.PROJECT_SHOWCASE,
      CastMessageType.SKILLS_SHOWCASE,
      CastMessageType.CONTACT_INFO
    ].includes(message.type);
  }
}

/**
 * CAF Message Factory for creating properly structured messages
 */
export class CastMessageFactory {
  static createHeartbeat(
    sessionId: string,
    healthData: HeartbeatMessage['healthData']
  ): HeartbeatMessage {
    return {
      type: CastMessageType.CAF_HEARTBEAT,
      messageId: `heartbeat_${Date.now()}`,
      metadata: {
        timestamp: Date.now(),
        senderId: sessionId,
        messageSequence: 'session_maintenance',
        expectedAcknowledgment: false
      },
      healthData
    };
  }

  static createAcknowledgment(
    sessionId: string,
    acknowledgedMessageId: string,
    code: MessageAcknowledgmentMessage['acknowledgmentCode'],
    details?: string
  ): MessageAcknowledgmentMessage {
    return {
      type: CastMessageType.MESSAGE_ACKNOWLEDGMENT,
      messageId: `ack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        timestamp: Date.now(),
        senderId: sessionId,
        messageSequence: 'acknowledgment',
        expectedAcknowledgment: false
      },
      acknowledgedMessageId,
      acknowledgmentCode: code,
      details
    };
  }
}

// Media Control Message Interfaces
export interface LoadMediaMessage extends BaseCastMessage {
  type: CastMessageType.LOAD_MEDIA;
  payload: {
    mediaUrl: string;
    contentType: string;
    poster?: string;
    title: string;
    currentTime?: number;
    duration?: number;
    autoplay?: boolean;
    metadata?: {
      title: string;
      subtitle?: string;
      images?: { url: string }[];
      mediaType: string;
    };
    streamInfo?: {
      availableQualities: any[];
      currentQuality: any;
    };
  };
}

export interface MediaControlMessage extends BaseCastMessage {
  type: CastMessageType.MEDIA_CONTROL;
  payload: {
    command: 'PLAY' | 'PAUSE' | 'SEEK' | 'MUTE' | 'UNMUTE' | 'VOLUME';
    currentTime?: number;
    seekTime?: number;
    volume?: number;
    muted?: boolean;
  };
}

export interface MediaStatusMessage extends BaseCastMessage {
  type: CastMessageType.MEDIA_STATUS;
  payload: {
    playerState: 'IDLE' | 'PLAYING' | 'PAUSED' | 'BUFFERING' | 'ERROR';
    currentTime: number;
    duration?: number;
    volume?: number;
    muted?: boolean;
    mediaTitle?: string;
    mediaUrl?: string;
  };
}
