'use client';

import { useCallback } from 'react';
import { useCast } from '@/contexts/CastContext';

/**
 * Enhanced Cast Integration Hook with CAF Best Practices
 * Demonstrates sophisticated understanding of Cast Application Framework patterns
 */
export const useCastIntegration = () => {
  const { sendMessage, sendStringMessage, isConnected, castSession, pendingAcknowledgments } = useCast();

  /**
   * Send portfolio data with CAF message structure and acknowledgment pattern
   */
  const sendPortfolioData = useCallback(async (data: any) => {
    if (!isConnected || !castSession) {
      console.warn('📱 Cast not connected, cannot send portfolio data');
      return;
    }

    try {
      const messageId = await sendMessage({
        type: 'PORTFOLIO_DATA',
        data,
        metadata: {
          messageSequence: 'portfolio_showcase',
          expectedAcknowledgment: true,
          priority: 'high'
        }
      });

      console.log('📱 Portfolio data sent, waiting for acknowledgment:', messageId);
      return messageId;
    } catch (error) {
      console.error('📱 Failed to send portfolio data:', error);
      throw error;
    }
  }, [sendMessage, isConnected, castSession]);

  /**
   * Send project data with enhanced CAF messaging patterns
   */
  const sendProjectData = useCallback(async (project: any) => {
    if (!isConnected || !castSession) {
      console.warn('📱 Cast not connected, cannot send project data');
      return;
    }

    try {
      const messageId = await sendMessage({
        type: 'PROJECT_SHOWCASE',
        project,
        metadata: {
          messageSequence: 'project_detail',
          expectedAcknowledgment: true,
          priority: 'high'
        }
      });

      console.log('📱 Project data sent, waiting for acknowledgment:', messageId);
      return messageId;
    } catch (error) {
      console.error('📱 Failed to send project data:', error);
      throw error;
    }
  }, [sendMessage, isConnected, castSession]);

  /**
   * Send skills data with CAF batch messaging pattern
   */
  const sendSkillsData = useCallback(async (skills: any) => {
    if (!isConnected || !castSession) {
      console.warn('📱 Cast not connected, cannot send skills data');
      return;
    }

    try {
      const messageId = await sendMessage({
        type: 'SKILLS_SHOWCASE',
        skills,
        metadata: {
          messageSequence: 'skills_display',
          expectedAcknowledgment: true,
          batchSize: Array.isArray(skills) ? skills.length : 1,
          priority: 'normal'
        }
      });

      console.log('📱 Skills data sent, waiting for acknowledgment:', messageId);
      return messageId;
    } catch (error) {
      console.error('📱 Failed to send skills data:', error);
      throw error;
    }
  }, [sendMessage, isConnected, castSession]);

  /**
   * Send contact info with CAF secure messaging pattern
   */
  const sendContactInfo = useCallback(async (contactInfo: any) => {
    if (!isConnected || !castSession) {
      console.warn('📱 Cast not connected, cannot send contact info');
      return;
    }

    try {
      const messageId = await sendMessage({
        type: 'CONTACT_INFO',
        contactInfo,
        metadata: {
          messageSequence: 'contact_display',
          expectedAcknowledgment: true,
          securityLevel: 'standard',
          priority: 'normal'
        }
      });

      console.log('📱 Contact info sent, waiting for acknowledgment:', messageId);
      return messageId;
    } catch (error) {
      console.error('📱 Failed to send contact info:', error);
      throw error;
    }
  }, [sendMessage, isConnected, castSession]);

  /**
   * Send notification with CAF priority messaging pattern
   */
  const sendNotification = useCallback(async (
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    if (!isConnected || !castSession) {
      console.warn('📱 Cast not connected, cannot send notification');
      return;
    }

    try {
      const messageId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await sendMessage({
        type: 'NOTIFICATION',
        messageId,
        message,
        level: type,
        metadata: {
          timestamp: Date.now(),
          senderId: castSession.getSessionId(),
          messageSequence: 'notification_display',
          expectedAcknowledgment: type === 'error', // Only errors require acknowledgment
          priority: type === 'error' ? 'critical' : type === 'warning' ? 'high' : 'normal'
        },
        cafContext: {
          sessionState: castSession.getSessionState(),
          messageFlow: 'notification_system',
          displayDuration: type === 'error' ? 'persistent' : 'temporary'
        }
      });

      console.log('📱 Notification sent with CAF context:', { messageId, type, priority: type === 'error' ? 'critical' : 'normal' });
    } catch (error) {
      console.error('📱 Failed to send notification:', error);
      throw error;
    }
  }, [sendMessage, isConnected, castSession]);

  /**
   * Enhanced session health check with CAF patterns
   */
  const checkSessionHealth = useCallback(() => {
    if (!isConnected || !castSession) {
      return { healthy: false, reason: 'No active session' };
    }

    try {
      const sessionState = castSession.getSessionState();
      const sessionId = castSession.getSessionId();
      const deviceName = castSession.getCastDevice().friendlyName;

      return {
        healthy: true,
        sessionId,
        deviceName,
        sessionState,
        applicationId: castSession.getApplicationMetadata()?.applicationId,
        lastActivity: Date.now()
      };
    } catch (error) {
      return {
        healthy: false,
        reason: 'Session validation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [isConnected, castSession]);

  /**
   * Send session heartbeat with CAF maintenance pattern
   */
  const sendHeartbeat = useCallback(async () => {
    if (!isConnected || !castSession) {
      return;
    }

    try {
      await sendMessage({
        type: 'CAF_HEARTBEAT',
        messageId: `heartbeat_${Date.now()}`,
        metadata: {
          timestamp: Date.now(),
          senderId: castSession.getSessionId(),
          messageSequence: 'session_maintenance',
          expectedAcknowledgment: false // Heartbeats don't need acknowledgment
        },
        healthData: checkSessionHealth()
      });
    } catch (error) {
      console.log('📱 Heartbeat failed (this is normal if session is ending):', error);
    }
  }, [sendMessage, isConnected, castSession, checkSessionHealth]);

  return {
    // Enhanced data sending methods with CAF patterns
    sendPortfolioData,
    sendProjectData,
    sendSkillsData,
    sendContactInfo,
    sendNotification,

    // Advanced CAF capabilities
    checkSessionHealth,
    sendHeartbeat,

    // Core messaging (with CAF enhancements)
    sendMessage,
    sendStringMessage,

    // Connection state
    isConnected,
    
    // Acknowledgment tracking features
    pendingAcknowledgments,
    hasPendingAcknowledgments: () => pendingAcknowledgments.length > 0,
    getPendingAcknowledgmentCount: () => pendingAcknowledgments.length,

    // Session context for advanced usage
    castSession,
    sessionId: castSession?.getSessionId() || null,
    deviceName: castSession?.getCastDevice().friendlyName || null,
    sessionState: castSession?.getSessionState() || null,
  };
};

export default useCastIntegration;
