'use client';

import React from 'react';
import { useCast } from '@/contexts/CastContext';
import { Button } from '@/components/ui/button';
import { RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { CastSessionStorage } from '@/lib/sessionStorage';

interface SessionResumeButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const SessionResumeButton: React.FC<SessionResumeButtonProps> = ({
  variant = 'outline',
  size = 'default',
  className = '',
}) => {
  const { isConnected, resumeSession, sessionId, connectionStatus } = useCast();
  const [isResuming, setIsResuming] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleResumeSession = async () => {
    if (isConnected) {
      return; // Already connected
    }

    const storedSession = CastSessionStorage.getSession();
    if (!storedSession) {
      console.log('📱 No stored session available to resume');
      return; // No session to resume
    }

    // Check session age
    const sessionAge = Date.now() - storedSession.timestamp;
    const maxAge = 4 * 60 * 60 * 1000; // 4 hours
    const ageMinutes = Math.round(sessionAge / 1000 / 60);

    if (sessionAge > maxAge) {
      console.log(`📱 Session too old to resume (${ageMinutes} minutes old), clearing...`);
      CastSessionStorage.clearSession();
      return;
    }

    console.log(`📱 Attempting to resume session (${ageMinutes} minutes old)`);

    setIsResuming(true);
    try {
      await resumeSession();
    } catch (error) {
      console.error('Failed to resume session:', error);
    } finally {
      setIsResuming(false);
    }
  };

  // Don't render until client-side mounted to avoid SSR issues
  if (!mounted) {
    return null;
  }

  // Don't show if already connected or no stored session
  const storedSession = CastSessionStorage.getSession();
  if (isConnected || !storedSession) {
    return null;
  }

  // Calculate session age for display
  const sessionAge = Date.now() - storedSession.timestamp;
  const ageMinutes = Math.round(sessionAge / 1000 / 60);
  const ageDisplay = ageMinutes < 60
    ? `${ageMinutes}m ago`
    : `${Math.round(ageMinutes / 60)}h ago`;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={variant}
        size={size}
        disabled={isResuming}
        onClick={handleResumeSession}
        className={`${className} border-green-500/20 hover:border-green-500/40 text-green-400 hover:text-green-300`}
        title={`Resume session: ${storedSession.sessionId.slice(-8)} (${ageDisplay})`}
      >
        {isResuming ? (
          <RotateCcw className="w-4 h-4 animate-spin" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="ml-2">
          {isResuming ? 'Resuming...' : `Resume (${ageDisplay})`}
        </span>
      </Button>

      {sessionId && (
        <div className="text-xs text-green-400 font-mono">
          {sessionId.slice(-8)}
        </div>
      )}
    </div>
  );
};

export default SessionResumeButton;
