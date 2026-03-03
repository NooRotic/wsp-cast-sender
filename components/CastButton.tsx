'use client';

import React, { useState } from 'react';
import { useCast } from '@/contexts/CastContext';
import { Button } from '@/components/ui/button';
import { Cast, Radio, Loader2, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CastSessionStorage } from '@/lib/sessionStorage';

interface CastButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'xs' | 'lg' | 'icon';
  showText?: boolean;
  customText?: string;
  className?: string;
  theme?: 'navigation' | 'default' | 'youtube' | 'green' | 'purple';
  connectedColor?: string;
  disconnectedColor?: string;
  children?: React.ReactNode;
  href?: string;
  openInNewTab?: boolean;
  onClick?: () => void;
  /**
   * Defines the casting behavior:
   * - 'default': Uses CastContext for programmatic session management
   * - 'googleCast': Opens Chrome's native Cast device selection menu
   */
  functionType?: 'default' | 'googleCast';
  /**
   * When true, the button ignores cast connection state and maintains consistent appearance
   * Useful for navigation buttons that should not change based on cast status
   */
  ignoreCastState?: boolean;
}

const CastButton: React.FC<CastButtonProps> = ({
  variant = 'outline',
  size = 'default',
  showText = true,
  customText,
  className = '',
  theme = 'default',
  connectedColor,
  disconnectedColor,
  children,
  href,
  openInNewTab = false,
  onClick,
  functionType = 'default',
  ignoreCastState = false,
}) => {
  const {
    isConnected,
    isAvailable,
    currentDevice,
    sessionId,
    requestSession,
    resumeSession,
    endSession,
    connectionStatus,
    error,
  } = useCast();

  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const getThemeColors = () => {
    const themes = {
      navigation: {
        connected: 'cast-button-nav-connected',
        disconnected: 'cast-button-nav-disconnected',
      },
      default: {
        connected: 'cast-button-default-connected',
        disconnected: 'cast-button-default-disconnected',
      },
      youtube: {
        connected: 'cast-button-youtube-connected',
        disconnected: 'cast-button-youtube-disconnected',
      },
      green: {
        connected: 'cast-button-green-connected',
        disconnected: 'cast-button-green-disconnected',
      },
      purple: {
        connected: 'cast-button-purple-connected',
        disconnected: 'cast-button-purple-disconnected',
      },
    };

    return themes[theme] || themes.default;
  };

  // Note: Using CastContext.requestSession() for reliable Google Cast menu instead of custom implementations

  const handleClick = async () => {
    // If href is provided, navigate to the route
    if (href) {
      // Check if this is a cast-related route to show loading spinner
      const isCastRoute = href.includes('/cast-demo') || href.includes('/cast-debug');
      
      if (isCastRoute) {
        setIsNavigating(true);
      }

      if (openInNewTab) {
        window.open(href, '_blank');
        if (isCastRoute) {
          // Reset loading state after a short delay for new tab
          setTimeout(() => setIsNavigating(false), 1000);
        }
      } else {
        router.push(href);
        // Navigation state will be reset when component unmounts or route changes
      }
      return;
    }

    // Handle different function types with CAF best practices - this takes priority
    if (functionType === 'googleCast') {
      // Use the CastContext requestSession for reliable Google Cast menu opening
      console.log('📱 CastButton: Triggering Google Cast menu via CastContext');
      try {
        await requestSession();
      } catch (error) {
        console.log('📱 CastButton: Cast session request completed (may have been cancelled):', error);
      }
      return;
    }

    // If custom onClick is provided, call it (only for non-googleCast function types)
    if (onClick) {
      onClick();
      return;
    }

    // Enhanced default cast functionality with CAF patterns
    if (isConnected) {
      console.log('📱 Ending CAF session via CastButton');
      endSession();
    } else {
      console.log('📱 Requesting CAF session via CastButton');
      try {
        await requestSession();
        console.log('📱 CAF session request completed successfully');
      } catch (error) {
        console.log('📱 CAF session request failed or was cancelled:', error);
      }
    }
  };

  const getButtonText = () => {
    // Show loading text when navigating to cast routes
    if (isNavigating) {
      return 'Loading...';
    }

    // If there are children, use them as the text
    if (children) {
      return children;
    }

    // If customText is provided, use it
    if (customText) {
      return customText;
    }

    // If showText is false, return null
    if (!showText) {
      return null;
    }

    // Default text based on connection state
    if (isConnected) {
      return currentDevice ? `Casting to ${currentDevice}` : 'Connected';
    }

    // Handle loading/scanning states
    if (connectionStatus.includes('Initializing') || connectionStatus.includes('Scanning')) {
      return 'Scanning...';
    }

    if (connectionStatus.includes('framework unavailable')) {
      return 'Cast unavailable';
    }

    if (isAvailable) {
      return 'Cast';
    }

    return 'No devices';
  };

  const getIcon = () => {
    // Show loading spinner when navigating to cast routes
    if (isNavigating) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    // If ignoring cast state, always show the same icon
    if (ignoreCastState) {
      return <Cast className="h-4 w-4" />;
    }

    if (connectionStatus.includes('Requesting') || connectionStatus.includes('Initializing') || connectionStatus.includes('Scanning')) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (isConnected) {
      return <Radio className="h-4 w-4" />;
    }

    return <Cast className="h-4 w-4" />;
  };

  const getButtonVariant = () => {
    if (ignoreCastState) return variant;
    if (isConnected) return 'default';
    return variant;
  };

  const getButtonClasses = () => {
    const baseClasses = className;
    const themeColors = getThemeColors();

    if (ignoreCastState) {
      return `${baseClasses} ${disconnectedColor || themeColors.disconnected}`;
    }

    if (isConnected) {
      return `${baseClasses} ${connectedColor || themeColors.connected}`;
    }

    return `${baseClasses} ${disconnectedColor || themeColors.disconnected}`;
  };

  const buttonContent = (
    <>
      {getIcon()}
      {getButtonText() && <span className="ml-2">{getButtonText()}</span>}
    </>
  );

  const buttonProps = {
    variant: getButtonVariant(),
    size,
    disabled: !isAvailable && !isConnected && !href && !isNavigating || isNavigating,
    className: getButtonClasses(),
    title: isNavigating 
      ? 'Loading cast application...' 
      : isConnected 
        ? `Connected to ${currentDevice}` 
        : connectionStatus,
  };

  // If href is provided and it's an internal link, use Link component
  if (href && !openInNewTab && !href.startsWith('http')) {
    return (
      <>
        <Link href={href} className="inline-block">
          <Button {...buttonProps} asChild>
            <span role="button" tabIndex={0}>
              {buttonContent}
            </span>
          </Button>
        </Link>
      </>
    );
  }

  // Default button behavior
  return (
    <>
      <Button
        {...buttonProps}
        onClick={handleClick}
      >
        {buttonContent}
      </Button>
    </>
  );
};

export default CastButton;
