'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { CastSessionStorage, CastSessionData } from '@/lib/sessionStorage';

interface CastContextType {
  isConnected: boolean;
  isAvailable: boolean;
  currentDevice: string | null;
  castSession: cast.framework.CastSession | null;
  sessionId: string | null;
  playerManager: cast.framework.RemotePlayerController | null;
  remotePlayer: cast.framework.RemotePlayer | null;
  initializeCast: () => Promise<void>;
  requestSession: () => Promise<void>;
  endSession: () => void;
  sendMessage: (message: any) => Promise<string>;
  sendStringMessage: (message: string) => Promise<void>;
  connectionStatus: string;
  error: string | null;
  resumeSession: () => Promise<void>;
  forceDeviceDiscovery: () => void;
  hasValidSession: () => boolean;
  lastReceivedMessage: any;
  mediaStatus: any;
  addMessageListener: (listener: (message: any) => void) => () => void;
  pendingAcknowledgments: string[];
}

const CastContext = createContext<CastContextType | undefined>(undefined);

export const useCast = () => {
  const context = useContext(CastContext);
  if (!context) {
    throw new Error('useCast must be used within a CastProvider');
  }
  return context;
};

interface CastProviderProps {
  children: React.ReactNode;
}

export const CastProvider: React.FC<CastProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<string | null>(null);
  const [castSession, setCastSession] = useState<cast.framework.CastSession | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Not initialized');
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastReceivedMessage, setLastReceivedMessage] = useState<any>(null);
  const [mediaStatus, setMediaStatus] = useState<any>(null);
  const [pendingAcknowledgments, setPendingAcknowledgments] = useState<string[]>([]);
  const [playerManager, setPlayerManager] = useState<cast.framework.RemotePlayerController | null>(null);
  const [remotePlayer, setRemotePlayer] = useState<cast.framework.RemotePlayer | null>(null);
  
  // Message listeners registry
  const messageListenersRef = useRef<Set<(message: any) => void>>(new Set());
  
  // Track if session listener is already registered to prevent duplicates
  const sessionListenerRegisteredRef = useRef<string | null>(null);

  // Pending messages tracking for acknowledgments
  const pendingMessagesRef = useRef<Map<string, {
    messageId: string;
    timestamp: number;
    type: string;
    timeout: NodeJS.Timeout;
    expectsAck: boolean;
  }>>(new Map());

  const appId = process.env.NEXT_PUBLIC_CAST_APP_ID || '44453EED';
  const namespace = process.env.NEXT_PUBLIC_CAST_NAMESPACE || 'urn:x-cast:com.nrx.cast.skills';

  // Enhanced message acknowledgment timeout (30 seconds)
  const ACK_TIMEOUT_MS = 30000;

  // Handle message timeout
  const handleMessageTimeout = useCallback((messageId: string, messageType: string) => {
    console.warn(`📱 ⚠️ Message acknowledgment timeout: ${messageType} (${messageId})`);
    console.warn(`📱 ⚠️ No confirmation received from receiver within ${ACK_TIMEOUT_MS/1000} seconds`);
    
    // Remove from pending messages
    const pending = pendingMessagesRef.current.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      pendingMessagesRef.current.delete(messageId);
      setPendingAcknowledgments(prev => prev.filter(id => id !== messageId));
    }

    // Optionally set error state for user feedback
    setError(`Message not acknowledged by receiver: ${messageType}`);
    
    // Clear error after 10 seconds
    setTimeout(() => {
      setError(null);
    }, 10000);
  }, []);

  // Track message acknowledgment
  const trackMessageAcknowledgment = useCallback((messageId: string, messageType: string, expectsAck: boolean) => {
    if (!expectsAck) return;

    const timeout = setTimeout(() => {
      handleMessageTimeout(messageId, messageType);
    }, ACK_TIMEOUT_MS);

    pendingMessagesRef.current.set(messageId, {
      messageId,
      timestamp: Date.now(),
      type: messageType,
      timeout,
      expectsAck: true
    });

    setPendingAcknowledgments(prev => [...prev, messageId]);
  }, [handleMessageTimeout]);

  // Handle received acknowledgment
  const handleReceivedAcknowledgment = useCallback((messageId: string, acknowledgmentCode: string) => {
    const pending = pendingMessagesRef.current.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      pendingMessagesRef.current.delete(messageId);
      setPendingAcknowledgments(prev => prev.filter(id => id !== messageId));
      
      console.log(`📱 ✅ Message acknowledged: ${pending.type} (${messageId}) - ${acknowledgmentCode}`);
    } else {
      console.log(`📱 ℹ️ Received acknowledgment for unknown message: ${messageId}`);
    }
  }, []);

  // Enhanced message handler with comprehensive message type support
  const handleIncomingMessage = useCallback((namespace: string, message: string) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log('📱 Received message from receiver:', parsedMessage);
      
      setLastReceivedMessage(parsedMessage);
      
      // Handle specific message types with comprehensive coverage
      switch (parsedMessage.type) {
        case 'RECEIVER_READY':
          console.log('📱 ✅ Receiver confirmed ready state');
          setConnectionStatus(`Ready - ${castSession?.getCastDevice().friendlyName || 'Unknown Device'}`);
          break;

        case 'RECEIVER_STATUS':
          console.log('📱 📊 Receiver status update:', parsedMessage.status || parsedMessage.payload);
          // Handle receiver status updates
          if (parsedMessage.status) {
            setConnectionStatus(`${parsedMessage.status} - ${castSession?.getCastDevice().friendlyName || 'Unknown Device'}`);
          }
          break;

        case 'RECEIVER_ERROR':
          console.error('📱 ❌ Receiver reported error:', parsedMessage.error || parsedMessage.message);
          setError(`Receiver error: ${parsedMessage.error || parsedMessage.message || 'Unknown receiver error'}`);
          break;

        case 'SESSION_STATUS':
          console.log('📱 📋 Receiver session status:', parsedMessage.status || parsedMessage.payload);
          break;

        case 'MESSAGE_ACKNOWLEDGMENT':
          console.log('📱 ✅ Message acknowledgment received:', parsedMessage);
          if (parsedMessage.payload?.originalMessageId || parsedMessage.messageId) {
            const ackMessageId = parsedMessage.payload?.originalMessageId || parsedMessage.messageId;
            const ackCode = parsedMessage.payload?.acknowledgmentCode || 'SUCCESS';
            const responseMessage = parsedMessage.payload?.responseMessage || 'Acknowledged';
            
            console.log(`📱 ✅ Processing acknowledgment for message: ${ackMessageId} - ${ackCode}: ${responseMessage}`);
            handleReceivedAcknowledgment(ackMessageId, ackCode);
          } else {
            console.warn('📱 ⚠️ Received acknowledgment without message ID:', parsedMessage);
          }
          break;

        case 'CAF_HEARTBEAT':
          console.log('📱 💓 Receiver heartbeat:', parsedMessage.healthData);
          // Update connection status based on heartbeat
          if (parsedMessage.healthData?.healthy === false) {
            console.warn('📱 ⚠️ Receiver reported unhealthy state:', parsedMessage.healthData.reason);
            setError(`Receiver unhealthy: ${parsedMessage.healthData.reason || 'Unknown issue'}`);
          }
          break;

        case 'MEDIA_STATUS':
          console.log('📱 🎬 Media status update:', parsedMessage.payload);
          setMediaStatus(parsedMessage.payload);
          break;

        case 'MEDIA_STATUS_UPDATE':
          console.log('📱 🎬 Media status update:', parsedMessage.payload);
          setMediaStatus(parsedMessage.payload);
          break;

        case 'MEDIA_ERROR':
          console.error('📱 ❌ Receiver media error:', parsedMessage.payload);
          const mediaError = parsedMessage.payload?.error || parsedMessage.payload?.message || 'Unknown media error';
          const errorContext = parsedMessage.payload?.context || 'MEDIA_ERROR';
          console.error(`📱 🎬 Media error [${errorContext}]:`, mediaError);
          setError(`Media Error: ${mediaError}`);
          // You could also show a toast notification or update UI state here
          break;

        case 'PAGE_LOADED':
        case 'VIDEO_LOADED':
        case 'MEDIA_CONTROL_RECEIVED':
        case 'PORTFOLIO_LAUNCHED':
        case 'PORTFOLIO_ERROR':
        case 'DASHBOARD_LOADED':
        case 'DASHBOARD_CONTROL_RECEIVED':
        case 'DEBUG_WINDOW_CONTROL_RECEIVED':
        case 'CONSOLE_CONTROL_RECEIVED':
        case 'PRESENTATION_UPDATED':
        case 'TECH_DEMO_STARTED':
        case 'DEMO_RESET_COMPLETE':
        case 'WELCOME':
        case 'RECEIVER_RESPONSE':
          console.log(`📱 ✅ Content acknowledgment: ${parsedMessage.type}`);
          if (parsedMessage.originalMessageId || parsedMessage.messageId) {
            handleReceivedAcknowledgment(
              parsedMessage.originalMessageId || parsedMessage.messageId, 
              'CONTENT_RECEIVED'
            );
          }
          break;

        case 'NOTIFICATION':
          console.log(`📱 🔔 Receiver notification [${parsedMessage.level || 'info'}]:`, parsedMessage.message);
          break;

        case 'PAGE_CHANGED':
          console.log('📱 📄 Receiver page changed:', parsedMessage.payload?.currentPage);
          break;

        case 'CONTENT_LOADED':
          console.log('📱 📂 Receiver content loaded:', parsedMessage.payload);
          break;

        case 'ERROR_REPORT':
          console.error('📱 ❌ Receiver error report:', parsedMessage.payload);
          setError(`Receiver reported: ${parsedMessage.payload?.message || 'Unknown error'}`);
          break;

        default:
          console.log('📱 ❓ Unhandled message type:', parsedMessage.type);
          console.log('📱 📄 Full message:', parsedMessage);
          
          // Log unhandled message types for debugging
          console.warn(`📱 ⚠️ Add handler for message type: ${parsedMessage.type}`);
      }
      
      // Notify all registered listeners
      messageListenersRef.current.forEach(listener => {
        try {
          listener(parsedMessage);
        } catch (err) {
          console.error('Error in message listener:', err);
        }
      });
    } catch (err) {
      console.error('Failed to parse incoming message:', err);
      console.log('📱 Raw message received:', message);
    }
  }, [castSession, handleReceivedAcknowledgment]);

  // Helper function to send enhanced messages with messageId
  const sendEnhancedMessage = useCallback((session: cast.framework.CastSession, message: any) => {
    const messageId = message.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const enhancedMessage = {
      ...message,
      messageId,
      senderId: session.getSessionId(),
      timestamp: Date.now(),
      metadata: {
        timestamp: Date.now(),
        senderId: session.getSessionId(),
        messageSequence: message.metadata?.messageSequence || 'system',
        expectedAcknowledgment: message.metadata?.expectedAcknowledgment ?? true,
        priority: message.metadata?.priority || 'normal',
        ...message.metadata
      }
    };

    return session.sendMessage(namespace, JSON.stringify(enhancedMessage));
  }, [namespace]);

  // Use a ref for the message handler to avoid dependency loops
  const handleIncomingMessageRef = useRef(handleIncomingMessage);
  
  // Update the ref when the handler changes
  useEffect(() => {
    handleIncomingMessageRef.current = handleIncomingMessage;
  }, [handleIncomingMessage]);
  
  // Create a stable wrapper function that never changes reference
  const stableMessageHandler = useCallback((namespace: string, message: string) => {
    handleIncomingMessageRef.current(namespace, message);
  }, []);
  const addMessageListener = useCallback((listener: (message: any) => void) => {
    messageListenersRef.current.add(listener);
    
    // Return cleanup function
    return () => {
      messageListenersRef.current.delete(listener);
    };
  }, []);

  const sessionListener = useCallback((session: cast.framework.CastSession) => {
    setCastSession(session);
    setIsConnected(true);
    setCurrentDevice(session.getCastDevice().friendlyName);
    setConnectionStatus(`Connected to ${session.getCastDevice().friendlyName}`);
    setError(null);

    // Set up CAF RemotePlayer and RemotePlayerController for media control
    const remotePlayerInstance = new cast.framework.RemotePlayer();
    const playerControllerInstance = new cast.framework.RemotePlayerController(remotePlayerInstance);
    
    setRemotePlayer(remotePlayerInstance);
    setPlayerManager(playerControllerInstance);

    // Listen for remote player events
    playerControllerInstance.addEventListener(
      cast.framework.RemotePlayerEventType.IS_PAUSED_CHANGED,
      () => {
        console.log('📱 🎵 Remote player paused state changed:', remotePlayerInstance.isPaused);
        setMediaStatus((prev: any) => ({ ...prev, isPlaying: !remotePlayerInstance.isPaused }));
      }
    );

    playerControllerInstance.addEventListener(
      cast.framework.RemotePlayerEventType.CURRENT_TIME_CHANGED,
      () => {
        console.log('📱 ⏱️ Remote player time changed:', remotePlayerInstance.currentTime);
        setMediaStatus((prev: any) => ({ ...prev, currentTime: remotePlayerInstance.currentTime }));
      }
    );

    playerControllerInstance.addEventListener(
      cast.framework.RemotePlayerEventType.DURATION_CHANGED,
      () => {
        console.log('📱 ⏳ Remote player duration changed:', remotePlayerInstance.duration);
        setMediaStatus((prev: any) => ({ ...prev, duration: remotePlayerInstance.duration }));
      }
    );

    // Use proper CAF session management - session.getSessionId() is the authoritative source
    const cafSessionId = session.getSessionId();
    setSessionId(cafSessionId);

    // Save session data using CAF session ID for proper resumption
    const sessionData: CastSessionData = {
      sessionId: cafSessionId,
      timestamp: Date.now(),
      deviceName: session.getCastDevice().friendlyName,
      applicationId: appId,
      namespace: namespace,
      // Store CAF-specific data for better session restoration
      castState: session.getSessionState(),
      receiverApplicationId: session.getApplicationMetadata()?.applicationId || appId
    };
    CastSessionStorage.saveSession(sessionData);

    // Set up message listener for receiver responses (prevent duplicates)
    const currentSessionId = session.getSessionId();
    if (sessionListenerRegisteredRef.current === currentSessionId) {
      console.log('📱 Message listener already registered for session:', currentSessionId);
      return;
    }
    
    try {
      // Remove any existing listener first to prevent duplicates
      session.removeMessageListener(namespace, stableMessageHandler);
    } catch (e) {
      // Ignore errors when removing non-existent listener
    }
    
    session.addMessageListener(namespace, stableMessageHandler);
    sessionListenerRegisteredRef.current = currentSessionId;
    console.log('📱 Message listener added for namespace:', namespace, 'session:', currentSessionId);

    // Listen for session state changes with comprehensive CAF state handling
    const sessionStateListener = (event: cast.framework.SessionStateEventData) => {
      console.log('📱 CAF Session State Changed:', event.sessionState, event);

      switch (event.sessionState) {
        case cast.framework.SessionState.SESSION_ENDED:
          console.log('📱 Session ended - cleaning up state');
          setIsConnected(false);
          setCastSession(null);
          setCurrentDevice(null);
          setSessionId(null);
          setPlayerManager(null);
          setRemotePlayer(null);
          setConnectionStatus('Session ended');
          CastSessionStorage.clearSession();
          break;

        case cast.framework.SessionState.SESSION_RESUMED:
          console.log('📱 Session resumed - updating state');
          setIsConnected(true);
          setCurrentDevice(session.getCastDevice().friendlyName);
          setConnectionStatus(`Resumed connection to ${session.getCastDevice().friendlyName}`);
          // Send session resume notification to receiver
          sendEnhancedMessage(session, {
            type: 'CAF_SESSION_RESUMED',
            sessionMetadata: {
              deviceName: session.getCastDevice().friendlyName,
              applicationId: session.getApplicationMetadata()?.applicationId
            }
          }).catch(err => console.log('Failed to send resume notification:', err));
          // Refresh session timestamp for proper expiration tracking
          CastSessionStorage.refreshSession();
          break;

        case cast.framework.SessionState.SESSION_STARTED:
          console.log('📱 New session started');
          setIsConnected(true);
          setCurrentDevice(session.getCastDevice().friendlyName);
          setConnectionStatus(`Connected to ${session.getCastDevice().friendlyName}`);
          // Send session start notification to receiver
          sendEnhancedMessage(session, {
            type: 'CAF_SESSION_STARTED',
            sessionMetadata: {
              deviceName: session.getCastDevice().friendlyName,
              applicationId: session.getApplicationMetadata()?.applicationId
            }
          }).catch(err => console.log('Failed to send start notification:', err));
          CastSessionStorage.refreshSession();
          break;

        case cast.framework.SessionState.SESSION_ENDING:
          console.log('📱 Session ending - preparing cleanup');
          setConnectionStatus('Ending session...');
          break;

        default:
          console.log('📱 Unhandled session state:', event.sessionState);
      }
    };

    // Add comprehensive CAF event listeners
    cast.framework.CastContext.getInstance().addEventListener(
      cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
      sessionStateListener
    );

    // Send initial session establishment message with CAF session context
    setTimeout(() => {
      sendEnhancedMessage(session, {
        type: 'CAF_SESSION_ESTABLISHED',
        sessionContext: {
          deviceName: session.getCastDevice().friendlyName,
          applicationId: session.getApplicationMetadata()?.applicationId || appId,
          namespace: namespace,
          sessionState: session.getSessionState()
        }
      }).catch(err => console.log('Failed to send session establishment message:', err));
    }, 500);
  }, [namespace, appId, sendEnhancedMessage, stableMessageHandler]); // Include stableMessageHandler

  const initializeCast = useCallback(async () => {
    try {
      // Prevent multiple initializations
      if (isInitialized) {
        console.log('Cast already initialized, skipping re-initialization');
        return;
      }

      setConnectionStatus('Initializing Cast...');
      setError(null);

      if (!window.cast?.framework) {
        throw new Error('Cast framework not available');
      }

      // Check if Cast is already initialized globally
      try {
        const existingContext = cast.framework.CastContext.getInstance();
        if (existingContext) {
          console.log('Cast Context already exists, reusing existing instance');
          setIsInitialized(true);

          // Check current session state
          const currentSession = existingContext.getCurrentSession();
          if (currentSession) {
            console.log('📱 Found existing active session, restoring immediately...');
            sessionListener(currentSession);
          } else {
            // No active session, but check if we have stored session data
            const storedSession = CastSessionStorage.getSession();
            if (storedSession) {
              console.log('📱 No active session but found stored session data');
              // We'll let the session recovery effect handle this
            }
          }

          // Set up state based on existing context
          const currentState = existingContext.getCastState();
          console.log('📱 Existing Cast Context state:', currentState);

          // Always allow device discovery attempts
          setIsAvailable(true);

          // Set appropriate status based on current state
          switch (currentState) {
            case cast.framework.CastState.CONNECTED:
              setConnectionStatus('Cast device connected');
              break;
            case cast.framework.CastState.CONNECTING:
              setConnectionStatus('Connecting to Cast device...');
              break;
            case cast.framework.CastState.NOT_CONNECTED:
              setConnectionStatus('Ready to connect to Cast device');
              break;
            case cast.framework.CastState.NO_DEVICES_AVAILABLE:
              setConnectionStatus('No Cast devices found - devices may appear dynamically');
              break;
            default:
              setConnectionStatus('Cast framework ready');
          }
          return;
        }
      } catch (error) {
        console.log('No existing Cast Context found, creating new one');
      }

      // Get the Cast Context instance
      const castContext = cast.framework.CastContext.getInstance();

      // Set options for the Cast Context
      castContext.setOptions({
        receiverApplicationId: appId,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      console.log('📱 Cast Context configured with App ID:', appId);
      console.log('📱 Cast namespace:', namespace);

      // Add event listeners for Cast Context
      castContext.addEventListener(
        cast.framework.CastContextEventType.CAST_STATE_CHANGED,
        (event: cast.framework.CastStateEventData) => {
          console.log('Cast state changed:', event.castState);
          switch (event.castState) {
            case cast.framework.CastState.CONNECTED:
              const session = castContext.getCurrentSession();
              if (session) {
                sessionListener(session);
              }
              setIsAvailable(true);
              break;
            case cast.framework.CastState.CONNECTING:
              setConnectionStatus('Connecting to Cast device...');
              setIsAvailable(true);
              break;
            case cast.framework.CastState.NOT_CONNECTED:
              setIsConnected(false);
              setCastSession(null);
              setCurrentDevice(null);
              setConnectionStatus('Ready to connect to Cast device');
              // Always keep devices available for discovery
              setIsAvailable(true);
              break;
            case cast.framework.CastState.NO_DEVICES_AVAILABLE:
              setIsConnected(false);
              setCastSession(null);
              setCurrentDevice(null);
              // Still allow connection attempts - devices can appear dynamically
              setIsAvailable(true);
              setConnectionStatus('No Cast devices found - click Connect to scan again');
              break;
          }
        }
      );

      // Check current session state
      const currentSession = castContext.getCurrentSession();
      if (currentSession) {
        sessionListener(currentSession);
      } else {
        setIsConnected(false);
        setCastSession(null);
        setCurrentDevice(null);
      }

      // Initial cast state check and device availability
      const castState = castContext.getCastState();
      console.log('📱 Initial cast state:', castState);

      // Always enable device discovery - Cast devices can appear/disappear dynamically
      setIsAvailable(true);

      // Set initial status based on Cast state
      switch (castState) {
        case cast.framework.CastState.NO_DEVICES_AVAILABLE:
          setConnectionStatus('Cast framework ready - no devices found yet');
          break;
        case cast.framework.CastState.NOT_CONNECTED:
          setConnectionStatus('Cast framework ready - ready to connect');
          break;
        case cast.framework.CastState.CONNECTED:
          setConnectionStatus('Cast device already connected');
          break;
        case cast.framework.CastState.CONNECTING:
          setConnectionStatus('Cast device connecting...');
          break;
        default:
          setConnectionStatus('Cast framework initialized successfully');
      }

      // Mark as successfully initialized
      setIsInitialized(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Cast initialization error: ${errorMessage}`);
      setConnectionStatus('Cast initialization failed');
      console.error('Cast initialization error:', err);
    }
  }, [appId, namespace, sessionListener, isInitialized]);

  const requestSession = useCallback(async () => {
    try {
      if (!window.cast?.framework) {
        throw new Error('Cast framework not available');
      }

      // Ensure Cast is initialized before requesting session
      if (!isInitialized) {
        console.log('📱 Cast not initialized, initializing first...');
        await initializeCast();
      }

      setConnectionStatus('Opening device selection dialog...');
      setError(null);

      const castContext = cast.framework.CastContext.getInstance();

      // Ensure Cast options are properly set by checking if we have a valid app ID
      if (!appId || appId === 'CC1AD845') {
        console.log('📱 Invalid or default app ID, using fallback...');
        castContext.setOptions({
          receiverApplicationId: '44453EED', // Default receiver app ID
          autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
      } else {
        console.log('📱 Setting Cast options with app ID:', appId);
        castContext.setOptions({
          receiverApplicationId: appId,
          autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
      }

      console.log('📱 Requesting Cast session...');
      console.log('📱 Current Cast state before request:', castContext.getCastState());

      // Set status to indicate we're waiting for user interaction
      setConnectionStatus('Please select a Cast device from the dialog...');

      try {
        await castContext.requestSession();

        // If we get here, check if we have a session
        const session = castContext.getCurrentSession();
        if (session) {
          console.log('📱 Cast session established successfully');
          const deviceName = session.getCastDevice().friendlyName;
          sessionListener(session);
          setConnectionStatus(`Successfully connected to ${deviceName}`);
          setError(null); // Clear any previous errors
        } else {
          console.log('📱 No session returned after request');
          setConnectionStatus('Device selection completed - no connection established');
          setError(null); // Clear any previous errors
        }
      } catch (sessionError) {
        const sessionErrorMessage = sessionError instanceof Error ? sessionError.message : 'Unknown session error';
        console.log('📱 Session request resulted in error:', sessionErrorMessage);

        // Handle specific session request errors
        if (sessionErrorMessage.includes('cancel') || sessionErrorMessage.includes('CANCEL')) {
          setError(null); // Clear any previous errors
          setConnectionStatus('Device selection cancelled by user');
        } else if (sessionErrorMessage.includes('timeout') || sessionErrorMessage.includes('TIMEOUT')) {
          setError('Connection timeout - no devices responded');
          setConnectionStatus('Connection timeout');
        } else {
          // For other errors, don't immediately show as error - might be normal Cast behavior
          console.log('📱 Session request error (may be normal):', sessionErrorMessage);
          setError(null); // Don't show error immediately
          setConnectionStatus('Device selection completed - no connection established');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('📱 Cast connection setup error:', err);

      // Only show errors for actual setup/framework issues
      if (errorMessage.includes('session before cast options')) {
        setError('Cast framework not ready - please try Initialize Cast first');
        setConnectionStatus('Cast options not configured');
      } else if (errorMessage.includes('Cast framework not available')) {
        setError('Cast framework not loaded - please refresh the page');
        setConnectionStatus('Cast framework unavailable');
      } else {
        setError(`Setup error: ${errorMessage}`);
        setConnectionStatus('Connection setup failed');
      }
    }
  }, [sessionListener, isInitialized, initializeCast, appId]);

  const endSession = useCallback(async () => {
    try {
      if (!window.cast?.framework) {
        throw new Error('Cast framework not available');
      }

      const castContext = cast.framework.CastContext.getInstance();
      const session = castContext.getCurrentSession();

      if (session) {
        await session.endSession(true);
        setIsConnected(false);
        setCastSession(null);
        setCurrentDevice(null);
        setSessionId(null);
        setPlayerManager(null);
        setRemotePlayer(null);
        setConnectionStatus('Session ended');
        setError(null);
        
        // Clear session listener tracking
        sessionListenerRegisteredRef.current = null;

        // Clear stored session
        CastSessionStorage.clearSession();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`End session error: ${errorMessage}`);
      console.error('End session error:', err);
    }
  }, []);

  const resumeSession = useCallback(async () => {
    try {
      const storedSession = CastSessionStorage.getSession();
      if (!storedSession) {
        console.log('📱 No stored session found to resume');
        return;
      }

      // Enhanced session validation with CAF patterns
      const sessionAge = Date.now() - storedSession.timestamp;
      const maxAge = 4 * 60 * 60 * 1000; // 4 hours
      if (sessionAge > maxAge) {
        console.log('📱 Session too old to resume (>4 hours), clearing...');
        CastSessionStorage.clearSession();
        setSessionId(null);
        return;
      }

      if (!window.cast?.framework) {
        throw new Error('Cast framework not available');
      }

      setConnectionStatus('Attempting to resume CAF session...');
      setError(null);

      const castContext = cast.framework.CastContext.getInstance();

      // Ensure Cast options are set before attempting session operations
      console.log('📱 🔧 Ensuring Cast options are configured for session resume...');
      castContext.setOptions({
        receiverApplicationId: appId,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      // Check if there's already an active session with matching ID
      const currentSession = castContext.getCurrentSession();
      if (currentSession && currentSession.getSessionId() === storedSession.sessionId) {
        console.log('📱 Active session matches stored session, reusing');
        sessionListener(currentSession);

        // Send session resume confirmation to receiver
        await sendEnhancedMessage(currentSession, {
          type: 'CAF_SESSION_RESUME_CONFIRMED',
          originalSessionData: storedSession
        });
        return;
      }

      console.log('📱 Attempting CAF session restoration...');

      // Use CAF's session restoration capabilities
      try {
        // Request session - CAF will attempt to restore if possible
        await castContext.requestSession();

        const session = castContext.getCurrentSession();
        if (session) {
          console.log('📱 CAF session restored successfully');
          sessionListener(session);

          // Verify session matches our stored session or update storage
          const actualSessionId = session.getSessionId();
          if (actualSessionId !== storedSession.sessionId) {
            console.log('📱 Session ID changed during restoration, updating storage');
            const updatedSessionData: CastSessionData = {
              ...storedSession,
              sessionId: actualSessionId,
              timestamp: Date.now()
            };
            CastSessionStorage.saveSession(updatedSessionData);
          }

          // Send comprehensive session resume message to receiver
          await sendEnhancedMessage(session, {
            type: 'CAF_SESSION_RESTORED',
            originalSessionId: storedSession.sessionId,
            restorationContext: {
              sessionAge: sessionAge,
              deviceName: session.getCastDevice().friendlyName,
              applicationId: session.getApplicationMetadata()?.applicationId
            }
          });
        } else {
          console.log('📱 CAF session restoration failed - no session returned');
          setConnectionStatus('Session restoration failed - device may not be available');
          CastSessionStorage.clearSession();
        }
      } catch (sessionError) {
        console.log('📱 CAF session restoration error:', sessionError);

        // Handle CAF-specific session restoration errors
        const errorMessage = sessionError instanceof Error ? sessionError.message : 'Unknown error';
        if (errorMessage.includes('CANCEL') || errorMessage.includes('cancel')) {
          setConnectionStatus('Session restoration cancelled by user');
          setError(null);
        } else if (errorMessage.includes('NO_DEVICES_AVAILABLE')) {
          setConnectionStatus('No devices available for session restoration');
          setError('Device not available for restoration');
          CastSessionStorage.clearSession();
        } else if (errorMessage.includes('cast options')) {
          setConnectionStatus('Cast configuration error during restoration');
          setError('Cast options not properly configured');
          console.error('📱 Cast options error during session restoration:', errorMessage);
        } else {
          setConnectionStatus('Session restoration failed');
          setError(`Restoration error: ${errorMessage}`);
          CastSessionStorage.clearSession();
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('📱 Resume session error:', err);
      setError(`Resume session error: ${errorMessage}`);
      setConnectionStatus('Resume session failed');

      // Clear invalid session
      CastSessionStorage.clearSession();
      setSessionId(null);
    }
  }, [sessionListener, appId, sendEnhancedMessage]);

  const forceDeviceDiscovery = useCallback(() => {
    console.log('📱 Forcing device discovery...');
    try {
      if (window.cast?.framework) {
        const castContext = cast.framework.CastContext.getInstance();
        // Force a state refresh by requesting the current state
        const currentState = castContext.getCastState();
        console.log('📱 Current Cast state during force discovery:', currentState);

        // Update status to indicate we're actively looking
        setConnectionStatus('Actively scanning for Cast devices...');
        setError(null);

        // Force the Cast framework to refresh device availability
        setTimeout(() => {
          if (castContext.getCastState() === cast.framework.CastState.NO_DEVICES_AVAILABLE) {
            setConnectionStatus('No devices found - ensure Cast device is powered on and on same network');
          } else {
            setConnectionStatus('Cast framework ready - devices may be available');
          }
        }, 2000);
      }
    } catch (err) {
      console.error('📱 Error during force discovery:', err);
    }
  }, []);

  const hasValidSession = useCallback(() => {
    // Check if there's an active Cast session
    if (isConnected && castSession) {
      return true;
    }

    // Check if there's a stored session that hasn't expired
    const storedSession = CastSessionStorage.getSession();
    if (!storedSession) {
      return false;
    }

    // Check if the session is expired (4 hours)
    const sessionAge = Date.now() - storedSession.timestamp;
    const maxAge = 4 * 60 * 60 * 1000; // 4 hours

    return sessionAge <= maxAge;
  }, [isConnected, castSession]);

  const sendMessage = useCallback(async (message: any): Promise<string> => {
    try {
      if (!castSession) {
        throw new Error('No active cast session');
      }

      // Generate message ID if not provided
      const messageId = message.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Enhanced message sending with CAF best practices and acknowledgment tracking
      const enhancedMessage = {
        ...message,
        messageId,
        senderId: castSession.getSessionId(),
        timestamp: Date.now(),
        metadata: {
          timestamp: Date.now(),
          senderId: castSession.getSessionId(),
          messageSequence: message.metadata?.messageSequence || 'general',
          expectedAcknowledgment: message.metadata?.expectedAcknowledgment ?? true,
          priority: message.metadata?.priority || 'normal',
          ...message.metadata
        },
        cafContext: {
          sessionState: castSession.getSessionState(),
          deviceName: castSession.getCastDevice().friendlyName,
          applicationId: castSession.getApplicationMetadata()?.applicationId || appId,
          ...message.cafContext
        },
        senderMetadata: {
          applicationId: appId,
          namespace: namespace,
          deviceName: castSession.getCastDevice().friendlyName
        }
      };

      const messageString = typeof message === 'string' ? message : JSON.stringify(enhancedMessage);

      // Track acknowledgment if expected
      const expectsAck = enhancedMessage.metadata.expectedAcknowledgment;
      if (expectsAck) {
        trackMessageAcknowledgment(messageId, enhancedMessage.type || 'UNKNOWN', true);
      }

      // Use CAF's built-in message queuing and retry logic
      await castSession.sendMessage(namespace, messageString);
      console.log('📱 ✅ Message sent successfully via CAF:', {
        messageId,
        type: enhancedMessage.type,
        expectsAck,
        sessionId: castSession.getSessionId()
      });

      return messageId;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      // Handle CAF-specific errors with appropriate responses
      if (errorMessage.includes('DISCONNECTED') || errorMessage.includes('SESSION_ERROR')) {
        console.log('📱 Session appears disconnected, attempting to clean up');
        setIsConnected(false);
        setCastSession(null);
        setCurrentDevice(null);
        setSessionId(null);
        setConnectionStatus('Connection lost');
        CastSessionStorage.clearSession();
      }

      setError(`Send message error: ${errorMessage}`);
      console.error('📱 CAF Send message error:', err);
      throw err; // Re-throw for caller handling
    }
  }, [castSession, namespace, appId, trackMessageAcknowledgment]);

  const sendStringMessage = useCallback(async (message: string) => {
    await sendMessage(message);
  }, [sendMessage]);

  // Initialize Cast API when component mounts
  useEffect(() => {
    // Check for existing session on startup and validate expiration
    const storedSession = CastSessionStorage.getSession();
    if (storedSession) {
      // Double-check session expiration (getSession() already checks this, but let's be explicit)
      const sessionAge = Date.now() - storedSession.timestamp;
      const maxAge = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

      if (sessionAge > maxAge) {
        console.log('📱 Session expired (older than 4 hours), clearing...');
        CastSessionStorage.clearSession();
        setSessionId(null);
      } else {
        console.log('📱 Found valid stored session on startup:', storedSession);
        console.log(`📱 Session age: ${Math.round(sessionAge / 1000 / 60)} minutes`);
        setSessionId(storedSession.sessionId);
      }
    } else {
      console.log('📱 No stored session found or session was expired');
    }

    // Wait for Cast framework to be loaded
    const initializeCastFramework = () => {
      window['__onGCastApiAvailable'] = function(isAvailable: boolean) {
        console.log('Cast API available:', isAvailable);
        if (isAvailable) {
          // Give Chrome a moment to finish setting up the framework
          setTimeout(() => {
            initializeCast().then(() => {
              // Try to resume session after initialization only if we have a valid session
              const validSession = CastSessionStorage.getSession();
              if (validSession) {
                console.log('📱 Will attempt to resume valid session after initialization');
                setTimeout(() => {
                  resumeSession();
                }, 1000);
              } else {
                console.log('📱 No valid session to resume');
              }
            });
          }, 100);
        } else {
          setError('Cast framework not available');
          setConnectionStatus('Cast framework unavailable');
          setIsAvailable(false);
        }
      };

      // Check if Cast framework is already available
      if (window.cast && window.cast.framework) {
        console.log('Cast framework already available, initializing...');
        setTimeout(() => {
          initializeCast().then(() => {
            // Try to resume session after initialization only if we have a valid session
            const validSession = CastSessionStorage.getSession();
            if (validSession) {
              console.log('📱 Will attempt to resume valid session after initialization');
              setTimeout(() => {
                resumeSession();
              }, 1000);
            } else {
              console.log('📱 No valid session to resume');
            }
          });
        }, 100);
      }
    };

    initializeCastFramework();
  }, [initializeCast, resumeSession]);

  // Session recovery effect - handles page refresh scenarios
  useEffect(() => {
    const checkAndRecoverSession = async () => {
      // Only run if Cast is initialized and we're not already connected
      if (!isInitialized || isConnected) {
        console.log('📱 Session recovery check skipped:', { isInitialized, isConnected });
        return;
      }

      try {
        console.log('📱 🔄 Running session recovery check after page refresh...');
        
        // Check if Cast framework is available
        if (!window.cast?.framework) {
          console.log('📱 ❌ Cast framework not available for session recovery');
          return;
        }

        // Get Cast context
        const castContext = cast.framework.CastContext.getInstance();
        
        // First, ensure Cast options are properly set before attempting any session operations
        console.log('📱 🔧 Ensuring Cast options are configured...');
        castContext.setOptions({
          receiverApplicationId: appId,
          autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
        
        // First, check if there's already an active Cast session
        const currentSession = castContext.getCurrentSession();
        if (currentSession) {
          console.log('📱 ✅ Found active Cast session, restoring state...', {
            sessionId: currentSession.getSessionId(),
            deviceName: currentSession.getCastDevice().friendlyName
          });
          sessionListener(currentSession);
          return;
        }

        // If no active session but we have stored session data, try to resume
        const storedSession = CastSessionStorage.getSession();
        if (storedSession) {
          console.log('📱 📋 Found stored session data, attempting recovery...', {
            sessionId: storedSession.sessionId,
            deviceName: storedSession.deviceName,
            age: Math.round((Date.now() - storedSession.timestamp) / 1000 / 60) + ' minutes'
          });
          
          // Check if session is still valid (not too old)
          const sessionAge = Date.now() - storedSession.timestamp;
          const maxAge = 4 * 60 * 60 * 1000; // 4 hours
          
          if (sessionAge < maxAge) {
            console.log('📱 ⏰ Session is recent enough, attempting to resume...');
            setConnectionStatus('Recovering previous session...');
            // Small delay to ensure Cast framework is fully ready with options
            setTimeout(() => {
              resumeSession();
            }, 800); // Slightly longer delay to ensure options are set
          } else {
            console.log('📱 ⏰ Stored session is too old, clearing...');
            CastSessionStorage.clearSession();
            setConnectionStatus('Previous session expired');
          }
        } else {
          console.log('📱 📋 No stored session data found');
          setConnectionStatus('Ready to connect');
        }
      } catch (error) {
        console.error('📱 ❌ Error during session recovery check:', error);
        setError('Session recovery error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };

    // Run session recovery check after initialization
    if (isInitialized) {
      console.log('📱 🚀 Cast initialized, scheduling session recovery check...');
      // Small delay to ensure everything is ready
      setTimeout(checkAndRecoverSession, 200);
    }
  }, [isInitialized, isConnected, resumeSession, sessionListener, appId]);

  const value: CastContextType = {
    isConnected,
    isAvailable,
    currentDevice,
    castSession,
    sessionId,
    playerManager,
    remotePlayer,
    initializeCast,
    requestSession,
    forceDeviceDiscovery,
    hasValidSession,
    endSession,
    sendMessage,
    sendStringMessage,
    connectionStatus,
    error,
    resumeSession,
    lastReceivedMessage,
    mediaStatus,
    addMessageListener,
    pendingAcknowledgments,
  };

  // Cleanup pending messages on unmount
  useEffect(() => {
    const pendingMessages = pendingMessagesRef.current;
    return () => {
      // Clear all pending timeouts
      pendingMessages.forEach(pending => {
        clearTimeout(pending.timeout);
      });
      pendingMessages.clear();
    };
  }, []);

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
};
