"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import { useCast } from "@/contexts/CastContext";
const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), { ssr: false, loading: () => null });
import Navigation from "@/components/Navigation";
import ContactSection from "@/components/ContactSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CastButton from "@/components/CastButton";
import {
  Cast,
  Monitor,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Code,
  Video,
  Wifi,
  Loader2,
  ChevronRight,
  Smartphone,
  Tv,
} from "lucide-react";
import { gsap } from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import SplitType from "split-type";

if (typeof window !== "undefined") {
  gsap.registerPlugin(TextPlugin);
}

export default function CastDemoPage() {
  const {
    isConnected,
    isAvailable,
    currentDevice,
    initializeCast,
    requestSession,
    sendMessage,
    hasValidSession,
    endSession,
    connectionStatus,
  } = useCast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string>("");
  const [demoStep, setDemoStep] = useState(0);
  // Control panel visibility and enable state
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [controlsEnabled, setControlsEnabled] = useState(false);
  const [presentationData, setPresentationData] = useState({
    currentSlide: 0,
    totalSlides: 4,
    isPlaying: false,
  });
  // Track receiver's current page for control visibility
  const [receiverPage, setReceiverPage] = useState<string>("");
  // Track when media is selected to bring VideoMediaCard forward
  const [isMediaSelected, setIsMediaSelected] = useState(false);

  // Refs for animations
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Listen for PAGE_CHANGED, PORTFOLIO_PRESENTATION, or DASHBOARD_LOADED messages from receiver
  useEffect(() => {
    const handleMessage = (msg: any) => {
      try {
        const parsed = typeof msg === "string" ? JSON.parse(msg) : msg;
        if (parsed?.type === "PAGE_CHANGED" && parsed.payload?.currentPage) {
          setReceiverPage(parsed.payload.currentPage);
        } else if (parsed?.type === "PORTFOLIO_PRESENTATION") {
          setReceiverPage("portfolio-cards");
        } else if (parsed?.type === "DASHBOARD_LOADED") {
          setReceiverPage("dashboard");
          // Show success feedback for dashboard load
          gsap.to(".action-feedback", {
            scale: 1.1,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut",
          });
        }
      } catch {}
    };
    // Add message listener (assume addCastMessageListener is set up by CastContext or custom hook)
    const remove = (window as any).addCastMessageListener?.(handleMessage);
    return () => {
      if (remove) remove();
    };
  }, []);

  /*
   * Expected receiver message format for dashboard loaded callback:
   * {
   *   type: 'DASHBOARD_LOADED',
   *   payload: {
   *     dashboardType: 'analytics',
   *     status: 'ready',
   *     timestamp: Date.now()
   *   }
   * }
   */

  useEffect(() => {
    // Initialize cast framework
    initializeCast();

    // --- Title Rain Animation ---
    if (titleRef.current) {
      // Add gsap-loaded class to make title container visible first
      titleRef.current.classList.add("gsap-loaded");

      // Split title into characters first
      const split = new SplitType(titleRef.current, { types: "chars" });
      const chars = titleRef.current.querySelectorAll(".char");

      // Set initial state for characters - use random opacity like the original working version
      gsap.set(chars, {
        opacity: 0,
        y: () => gsap.utils.random(-68, -23),
      });

      // Animate characters in
      gsap.to(chars, {
        opacity: 1,
        y: 0,
        stagger: {
          each: 0.09, // slower stagger
          from: "random",
        },
        duration: 1.2, // slower duration
        ease: "back.out(2)",
        delay: 0.3,
      });
    }

    // --- Subtitle Word Zoom Animation ---
    if (subtitleRef.current) {
      // Remove the hiding class and split subtitle into words
      subtitleRef.current.classList.remove("hero-subtitle-hidden");
      const split = new SplitType(subtitleRef.current, { types: "words" });
      const words = subtitleRef.current.querySelectorAll(".word");
      gsap.set(words, {
        opacity: 0,
        scale: 0.3,
        transformOrigin: "center center",
      });
      gsap.to(words, {
        opacity: 1,
        scale: 1,
        stagger: {
          each: 0.3, // slower stagger
          from: "start",
        },
        duration: 1.1, // slower duration
        ease: "back.out(2)",
        delay: 4.0,
      });
    }

    // Status animation
    if (statusRef.current) {
      // Remove the hiding class before animating
      statusRef.current.classList.remove("action-feedback-hidden");
      gsap.fromTo(
        statusRef.current,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.2)",
          delay: 0.8,
        }
      );
    }
  }, [initializeCast]);

  // Animate panels on connection
  useEffect(() => {
    if (isConnected) {
      // Animate connection setup out, cast receiver left, control panel in
      gsap.to(".connection-setup-panel", {
        x: -100,
        opacity: 0,
        duration: 0.5,
        pointerEvents: "none",
      });
      gsap.to(".cast-receiver-panel", { x: -220, duration: 0.5, delay: 0.1 });
      setTimeout(() => setShowControlPanel(true), 400);
    } else {
      // Reset panels
      gsap.to(".connection-setup-panel", {
        x: 0,
        opacity: 1,
        duration: 0.5,
        pointerEvents: "auto",
      });
      gsap.to(".cast-receiver-panel", { x: 0, duration: 0.5 });
      setShowControlPanel(false);
      setControlsEnabled(false);
    }
  }, [isConnected]);

  // Enable controls when portfolio presentation is launched (dashboard has its own controls)
  useEffect(() => {
    if (receiverPage === "portfolio-cards") {
      setControlsEnabled(true);
    } else {
      setControlsEnabled(false);
    }
  }, [receiverPage]);

  const handleActionWithSpinner = async (
    action: () => Promise<void>,
    actionName: string
  ) => {
    setIsLoading(true);
    setLastAction(actionName);

    try {
      await action();

      // Animate success
      gsap.to(".action-feedback", {
        scale: 1.1,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    } catch (error) {
      console.error(`Failed to ${actionName}:`, error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setLastAction("");
      }, 1000);
    }
  };

  const handleConnect = () => {
    handleActionWithSpinner(async () => {
      await requestSession();
    }, "Connecting to Cast device");
  };

  // Monitor connection state changes for user feedback
  useEffect(() => {
    if (isConnected) {
      // Animate success when connection is established
      gsap.to(".action-feedback", {
        scale: 1.1,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }
  }, [isConnected]);

  const handleSendPortfolioData = () => {
    handleActionWithSpinner(async () => {
      const portfolioMessage = {
        type: "PORTFOLIO_PRESENTATION",
        payload: {
          action: "start_presentation",
          slides: [
            {
              id: 1,
              title: "Chromecast Development Expert",
              subtitle: "Building Connected TV Experiences",
              type: "intro",
              description:
                "Specialized in Google Cast SDK, streaming protocols, and TV app development.",
              tags: ["Google Cast SDK", "NextJS", "HLS/DASH", "TV UI/UX"],
            },
            {
              id: 2,
              title: "Streaming Architecture",
              subtitle: "Scalable Video Solutions",
              type: "technical",
              description:
                "Designed streaming infrastructure handling 1M+ concurrent users with adaptive bitrate streaming.",
              tags: [
                "CDN Integration",
                "Adaptive Bitrate",
                "Load Balancing",
                "Real-time Analytics",
              ],
            },
            {
              id: 3,
              title: "Cast Integration Projects",
              subtitle: "Real-world Implementations",
              type: "projects",
              description:
                "Successfully deployed Cast-enabled applications for major streaming platforms.",
              tags: [
                "Custom Receivers",
                "Sender Apps",
                "Queue Management",
                "Session Recovery",
              ],
            },
            {
              id: 4,
              title: "Advanced Features",
              subtitle: "Beyond Basic Casting",
              type: "advanced",
              description:
                "Implemented advanced Cast features including custom namespaces, media status, and offline capabilities.",
              tags: [
                "Custom Namespaces",
                "Media Session API",
                "Offline Support",
                "DRM Integration",
              ],
            },
          ],
          timestamp: Date.now(),
        },
      };

      await sendMessage(portfolioMessage);
      setDemoStep(1);
    }, "Sending portfolio presentation");
  };

  const handleNextSlide = () => {
    handleActionWithSpinner(async () => {
      const nextSlide =
        (presentationData.currentSlide + 1) % presentationData.totalSlides;
      setPresentationData((prev) => ({ ...prev, currentSlide: nextSlide }));

      await sendMessage({
        type: "PRESENTATION_CONTROL",
        payload: {
          action: "next_slide",
          slideIndex: nextSlide,
          timestamp: Date.now(),
        },
      });
    }, "Advancing to next slide");
  };

  const handlePlayPause = () => {
    handleActionWithSpinner(
      async () => {
        const newPlayState = !presentationData.isPlaying;
        setPresentationData((prev) => ({ ...prev, isPlaying: newPlayState }));

        await sendMessage({
          type: "PRESENTATION_CONTROL",
          payload: {
            action: newPlayState ? "play" : "pause",
            timestamp: Date.now(),
          },
        });
      },
      presentationData.isPlaying
        ? "Pausing presentation"
        : "Playing presentation"
    );
  };

  const handleShowTechDemo = () => {
    handleActionWithSpinner(async () => {
      await sendMessage({
        type: "TECH_DEMO",
        payload: {
          action: "show_technical_capabilities",
          demos: [
            {
              title: "Real-time Communication",
              description: "WebSocket-based bidirectional communication",
              technology: "WebSocket API + Custom Protocol",
            },
            {
              title: "Media Synchronization",
              description: "Frame-perfect video and audio sync across devices",
              technology: "Media Session API + TimeSync",
            },
            {
              title: "Queue Management",
              description: "Advanced playlist handling with smooth transitions",
              technology: "Cast Queue API + State Management",
            },
          ],
          timestamp: Date.now(),
        },
      });
      setDemoStep(2);
    }, "Launching technical demonstration");
  };

  const handleResetDemo = () => {
    handleActionWithSpinner(async () => {
      await sendMessage({
        type: "DEMO_RESET",
        payload: {
          action: "reset_to_home",
          timestamp: Date.now(),
        },
      });
      setDemoStep(0);
      setPresentationData({
        currentSlide: 0,
        totalSlides: 4,
        isPlaying: false,
      });
    }, "Resetting demonstration");
  };

  const handleDisconnect = () => {
    handleActionWithSpinner(async () => {
      await endSession();
      setDemoStep(0);
    }, "Disconnecting from Cast device");
  };

  const LoadingSpinner = ({ action }: { action: string }) => (
    <div className="flex items-center gap-2 text-[#39FF14] text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{action}...</span>
    </div>
  );

  return (
    <main className="relative z-10 pt-20 pb-12">
      <div className="min-h-screen relative">
        <ParticleBackground />
        <Navigation />

        <div className="max-w-6xl mx-auto px-4">
          {/* Hero Section */}
          <section ref={heroRef} className="text-center mb-12">
            <h1
              ref={titleRef}
              className="text-2xl md:text-4xl font-bold text-gradient-active-green mb-3 leading-snug pb-1"
            >
              Chromecast Demo Portfolio
            </h1>
            <p
              ref={subtitleRef}
              className="text-base md:text-lg text-gray-300 mb-4 max-w-3xl mx-auto hero-subtitle-hidden"
            >
              A custom web casting receiver demonstration in 2025, showcasing my
              passion for Google Casting.
            </p>

            {/* Connection Status */}
            <div
              ref={statusRef}
              className="action-feedback inline-block action-feedback-hidden"
            >
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className={`px-3 py-1 text-sm ${
                  isConnected
                    ? "bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30"
                    : "bg-gray-700/50 text-gray-300 border-gray-600/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <Wifi className="w-4 h-4" />
                      Connected to {currentDevice || "Cast Device"}
                    </>
                  ) : (
                    <>
                      <Cast className="w-4 h-4" />
                      {isAvailable ? "Ready to Cast" : "Cast Not Available"}
                    </>
                  )}
                </div>
              </Badge>
            </div>
          </section>

          {/* Demo Controls - Top Row (4 Panels) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative">
            {/* Connection & Setup */}
            <div
              className="bg-gradient-to-br from-[#181c1f] to-[#23272b] border border-[#23272b] shadow-xl rounded-2xl p-3 md:p-4 lg:p-5 card-featured transition-all duration-500 connection-setup-panel z-20 flex flex-col justify-between w-full"
              style={{
                pointerEvents: isConnected ? "none" : "auto",
                minWidth: "220px",
                minHeight: "190px",
                maxHeight: "240px",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#39FF14]/15 to-[#2ed60a]/15 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-[#39FF14]" />
                </div>
                <h2 className="text-base md:text-xl font-semibold text-gradient-active tracking-tight drop-shadow-sm">
                  Connection Setup
                </h2>
              </div>
              <p className="text-gray-300 text-sm md:text-base mb-5 text-center">
                Connect to a nearby Chromecast device to begin the interactive
                demonstration.
              </p>
              <div className="space-y-3">
                {!isConnected ? (
                  <div>
                    <CastButton
                      functionType="googleCast"
                      variant="default"
                      size="default"
                      className="w-full animated-gradient-btn-blue-purple text-white font-semibold py-3 hover:shadow-xl hover:shadow-[#39FF14]/25 transition-all duration-300 transform hover:scale-105 hover:bg-black/60 hover:text-[#39FF14]"
                      showText={false}
                    >
                      Connect to Cast Device
                    </CastButton>
                  </div>
                ) : (
                  <Button
                    onClick={handleDisconnect}
                    variant="destructive"
                    className="w-full"
                  >
                    <Monitor className="w-5 h-5 mr-2" />
                    Disconnect
                  </Button>
                )}
                {isLoading && lastAction.includes("Connecting") && (
                  <LoadingSpinner action={lastAction} />
                )}
              </div>
            </div>

            {/* Cast Receiver Panel */}
            <div
              className="bg-gradient-to-br from-[#181c1f] to-[#23272b] border border-[#23272b] shadow-xl rounded-2xl p-3 md:p-4 lg:p-4 card-featured transition-all duration-500 cast-receiver-panel z-10 flex flex-col justify-between w-full"
              style={{
                minWidth: "220px",
                minHeight: "190px",
                maxHeight: "240px",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#39FF14]/15 to-[#2ed60a]/15 rounded-lg flex items-center justify-center">
                  <Tv className="w-8 h-8 text-[#39FF14]" />
                </div>
                <h2 className="text-base md:text-xl font-semibold text-gradient-active tracking-tight drop-shadow-sm">
                  Cast Walt&apos;s Portfolio
                </h2>
              </div>
              <p className="text-gray-300 text-sm md:text-base mb-5 text-center">
                Send portfolio content and control the presentation on the
                connected display.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handleSendPortfolioData}
                  disabled={!isConnected || isLoading}
                  className="w-full animated-gradient-btn-blue-purple text-white font-semibold py-3 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-sm transform hover:scale-105 hover:bg-black/60"
                >
                  <Code className="w-5 h-5 mr-2" />
                  Launch Portfolio Presentation
                </Button>
                {isLoading && lastAction.includes("portfolio") && (
                  <LoadingSpinner action={lastAction} />
                )}
              </div>
            </div>

            {/* Media Demo Page Card */}
            <div
              className="bg-gradient-to-br from-[#181c1f] to-[#23272b] border border-[#23272b] shadow-xl rounded-2xl p-3 md:p-4 lg:p-5 card-featured transition-all duration-500 media-demo-panel z-10 flex flex-col justify-between w-full"
              style={{
                minWidth: "220px",
                minHeight: "190px",
                maxHeight: "240px",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#39FF14]/15 to-[#2ed60a]/15 rounded-lg flex items-center justify-center">
                  <Video className="w-8 h-8 text-[#39FF14]" />
                </div>
                <h2 className="text-base md:text-xl font-semibold text-gradient-active tracking-tight drop-shadow-sm">
                  Media Demo Page
                </h2>
              </div>
              <p className="text-gray-300 text-sm md:text-base mb-5 text-center">
                Launch an interactive media demo page with video content and casting controls.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    handleActionWithSpinner(async () => {
                      router.push('/media-demo');
                    }, "Launching Media Demo Page");
                  }}
                  disabled={isLoading}
                  className="w-full animated-gradient-btn-blue-purple text-white font-semibold py-3 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-sm transform hover:scale-105 hover:bg-black/60"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Launch Media Demo Page
                </Button>
                {isLoading && lastAction.includes("Media Demo") && (
                  <LoadingSpinner action={lastAction} />
                )}
              </div>
            </div>

            {/* Dashboard View Card */}
            <div
              className="bg-gradient-to-br from-[#181c1f] to-[#23272b] border border-[#23272b] shadow-xl rounded-2xl p-3 md:p-4 lg:p-5 card-featured transition-all duration-500 dashboard-panel z-10 flex flex-col justify-between w-full"
              style={{
                minWidth: "220px",
                minHeight: "190px",
                maxHeight: "240px",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#39FF14]/15 to-[#2ed60a]/15 rounded-lg flex items-center justify-center">
                  <Monitor className="w-8 h-8 text-[#39FF14]" />
                </div>
                <h2 className="text-base md:text-xl font-semibold text-gradient-active tracking-tight drop-shadow-sm">
                  Dashboard View
                </h2>
              </div>
              <p className="text-gray-300 text-sm md:text-base mb-5 text-center">
                Launch an interactive dashboard with analytics and controls on
                the connected display.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    handleActionWithSpinner(async () => {
                      await sendMessage({
                        type: "LAUNCH_DASHBOARD",
                        payload: {
                          action: "launch_dashboard",
                          dashboardType: "analytics",
                          timestamp: Date.now(),
                        },
                      });
                    }, "Launching dashboard view");
                  }}
                  disabled={!isConnected || isLoading}
                  className="w-full animated-gradient-btn-blue-purple text-white font-semibold py-3 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-sm transform hover:scale-105 hover:bg-black/60"
                >
                  <Monitor className="w-5 h-5 mr-2" />
                  Launch Dashboard View
                </Button>
                {isLoading && lastAction.includes("dashboard") && (
                  <LoadingSpinner action={lastAction} />
                )}
              </div>
            </div>
          </div>


          {/* Control Panel (hidden until showControlPanel and only for portfolio) */}
          {showControlPanel && receiverPage === "portfolio-cards" && (
            <div
              className={`glass-morphism-large neon-glow-enhanced p-8 absolute right-0 top-0 w-full lg:w-[48%] control-panel transition-all duration-500 z-20 ${
                controlsEnabled
                  ? ""
                  : "opacity-60 grayscale pointer-events-none"
              }`}
              style={{ right: 0, opacity: showControlPanel ? 1 : 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-[#39FF14]" />
                <h2 className="text-lg font-bold text-white">
                  Presentation Controls
                </h2>
              </div>
              <div className="flex gap-4 flex-wrap">
                <Button
                  onClick={handleNextSlide}
                  disabled={isLoading || !controlsEnabled}
                  className="flex flex-col items-center p-4 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white"
                >
                  <ChevronRight className="w-6 h-6 mb-2" />
                  <span className="text-sm">Next Slide</span>
                  <span className="text-xs text-gray-400">
                    {presentationData.currentSlide + 1}/
                    {presentationData.totalSlides}
                  </span>
                </Button>
                <Button
                  onClick={handlePlayPause}
                  disabled={isLoading || !controlsEnabled}
                  className="flex flex-col items-center p-4 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white"
                >
                  {presentationData.isPlaying ? (
                    <Pause className="w-6 h-6 mb-2" />
                  ) : (
                    <Play className="w-6 h-6 mb-2" />
                  )}
                  <span className="text-sm">
                    {presentationData.isPlaying ? "Pause" : "Play"}
                  </span>
                </Button>
                <Button
                  onClick={handlePlayPause}
                  disabled={isLoading || !controlsEnabled}
                  className="flex flex-col items-center p-4 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white"
                >
                  <Video className="w-6 h-6 mb-2" />
                  <span className="text-sm">Auto Play Presentation</span>
                </Button>
                <Button
                  onClick={handleResetDemo}
                  disabled={isLoading || !controlsEnabled}
                  className="flex flex-col items-center p-4 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white"
                >
                  <RotateCcw className="w-6 h-6 mb-2" />
                  <span className="text-sm">Reset</span>
                </Button>
              </div>
              {isLoading && (
                <div className="mt-4 flex justify-center">
                  <LoadingSpinner action={lastAction} />
                </div>
              )}
              {/* Glowing Dots Row for Portfolio Pages */}
              <div className="flex justify-center items-center gap-4 mt-8">
                {Array.from({ length: presentationData.totalSlides }).map(
                  (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        // Send Cast message to scroll to the selected page
                        const msg = JSON.stringify({
                          type: "PRESENTATION_CONTROL",
                          payload: { action: "goto", page: idx },
                        });
                        if ((window as any).sendCastMessage) {
                          (window as any).sendCastMessage(msg);
                        }
                      }}
                      aria-label={`Go to page ${idx + 1}`}
                      title={`Go to page ${idx + 1}`}
                      className={`w-5 h-5 rounded-full border-2 border-[#39FF14] bg-black/80 shadow-lg transition-all duration-200 focus:outline-none ${
                        idx === presentationData.currentSlide
                          ? "shadow-[0_0_12px_4px_#39FF14,0_0_2px_1px_#2ed60a] bg-[#39FF14]/80 scale-110"
                          : "shadow-[0_0_8px_2px_#39FF14] hover:bg-[#39FF14]/40 opacity-80"
                      }`}
                      style={{
                        boxShadow:
                          idx === presentationData.currentSlide
                            ? "0 0 16px 6px #39FF14, 0 0 2px 1px #2ed60a"
                            : "0 0 8px 2px #39FF14",
                      }}
                    >
                      <span className="sr-only">Go to page {idx + 1}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          )}
          {/* Dashboard Control Panel (shows when dashboard is loaded) */}
          {showControlPanel && receiverPage === "dashboard" && (
            <div
              className="glass-morphism-large neon-glow-enhanced p-8 absolute right-0 top-0 w-full lg:w-[48%] dashboard-control-panel transition-all duration-500 z-30 max-h-[90vh] overflow-y-auto"
              style={{ right: 0, opacity: showControlPanel ? 1 : 0 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Monitor className="w-6 h-6 text-[#39FF14]" />
                <h2 className="text-lg font-bold text-white">
                  Dashboard Controls
                </h2>
              </div>

              {/* Device Information Controls */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Device Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "show_device_capabilities",
                            view: "device_info",
                            dataTypes: [
                              "deviceCapabilities",
                              "playerSupported",
                              "bluetoothSupported",
                              "displaySupported",
                            ],
                            timestamp: Date.now(),
                          },
                        });
                      }, "Loading device capabilities");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-3 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white text-xs"
                  >
                    <Tv className="w-5 h-5 mb-1" />
                    <span>Device Info</span>
                  </Button>
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "show_cast_options",
                            view: "cast_receiver_options",
                            dataTypes: [
                              "versionCode",
                              "applicationId",
                              "displayName",
                              "supportedMediaCommands",
                              "maxInactivity",
                            ],
                            timestamp: Date.now(),
                          },
                        });
                      }, "Loading Cast receiver options");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-3 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white text-xs"
                  >
                    <Cast className="w-5 h-5 mb-1" />
                    <span>Cast Options</span>
                  </Button>
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "show_version_info",
                            view: "version_details",
                            dataTypes: [
                              "versionCode",
                              "applicationVersion",
                              "receiverVersion",
                              "sdkVersion",
                            ],
                            timestamp: Date.now(),
                          },
                        });
                      }, "Loading version information");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-3 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white text-xs"
                  >
                    <Code className="w-5 h-5 mb-1" />
                    <span>Version Info</span>
                  </Button>
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "show_system_metrics",
                            view: "performance_data",
                            dataTypes: [
                              "playerState",
                              "mediaInfo",
                              "currentTime",
                              "volume",
                              "networkState",
                            ],
                            timestamp: Date.now(),
                          },
                        });
                      }, "Loading system metrics");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-3 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white text-xs"
                  >
                    <Wifi className="w-5 h-5 mb-1" />
                    <span>Metrics</span>
                  </Button>
                </div>

                {/* Additional Device Details Row */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "show_media_commands",
                            view: "supported_commands",
                            dataTypes: [
                              "supportedMediaCommands",
                              "queueSupported",
                              "editTracksInfoSupported",
                            ],
                            timestamp: Date.now(),
                          },
                        });
                      }, "Loading supported media commands");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-2 h-auto bg-black/20 border border-gray-700/30 hover:border-[#39FF14]/20 text-white text-xs"
                  >
                    <Play className="w-4 h-4 mb-1" />
                    <span>Commands</span>
                  </Button>
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "show_queue_data",
                            view: "queue_information",
                            dataTypes: [
                              "queueSupported",
                              "queueData",
                              "currentQueueItem",
                            ],
                            timestamp: Date.now(),
                          },
                        });
                      }, "Loading queue information");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-2 h-auto bg-black/20 border border-gray-700/30 hover:border-[#39FF14]/20 text-white text-xs"
                  >
                    <Video className="w-4 h-4 mb-1" />
                    <span>Queue</span>
                  </Button>
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "show_session_data",
                            view: "session_information",
                            dataTypes: [
                              "sessionId",
                              "statusText",
                              "receiver",
                              "senderApps",
                            ],
                            timestamp: Date.now(),
                          },
                        });
                      }, "Loading session information");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-2 h-auto bg-black/20 border border-gray-700/30 hover:border-[#39FF14]/20 text-white text-xs"
                  >
                    <Wifi className="w-4 h-4 mb-1" />
                    <span>Session</span>
                  </Button>
                </div>
              </div>

              {/* Comprehensive Data Display */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Comprehensive Data Views
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "show_all_cast_data",
                            view: "comprehensive_dashboard",
                            layout: "grid_detailed",
                            dataTypes: [
                              "versionCode",
                              "applicationId",
                              "displayName",
                              "applicationVersion",
                              "receiverVersion",
                              "sdkVersion",
                              "deviceCapabilities",
                              "playerSupported",
                              "bluetoothSupported",
                              "displaySupported",
                              "supportedMediaCommands",
                              "queueSupported",
                              "editTracksInfoSupported",
                              "maxInactivity",
                              "playerState",
                              "mediaInfo",
                              "currentTime",
                              "volume",
                              "networkState",
                              "sessionId",
                              "statusText",
                              "receiver",
                              "senderApps",
                              "queueData",
                            ],
                            timestamp: Date.now(),
                          },
                        });
                      }, "Loading comprehensive Cast data dashboard");
                    }}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center p-4 h-auto bg-gradient-to-r from-[#39FF14]/20 to-[#2ed60a]/20 border border-[#39FF14]/30 hover:border-[#39FF14]/50 text-white font-semibold"
                  >
                    <Monitor className="w-5 h-5 mr-2" />
                    <span>Show All Cast Data (Comprehensive View)</span>
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        handleActionWithSpinner(async () => {
                          await sendMessage({
                            type: "DASHBOARD_CONTROL",
                            payload: {
                              action: "show_receiver_options_detailed",
                              view: "cast_receiver_options_full",
                              dataTypes: [
                                "versionCode",
                                "applicationId",
                                "displayName",
                                "applicationVersion",
                                "maxInactivity",
                                "supportedMediaCommands",
                                "skipSupported",
                                "pauseStringId",
                                "loadingStringId",
                                "launchingStringId",
                              ],
                              displayFormat: "detailed_cards",
                              timestamp: Date.now(),
                            },
                          });
                        }, "Loading detailed Cast receiver options");
                      }}
                      disabled={isLoading}
                      className="flex flex-col items-center p-3 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white text-xs"
                    >
                      <Cast className="w-5 h-5 mb-1" />
                      <span>Receiver Options</span>
                      <span className="text-xs text-gray-400">Detailed</span>
                    </Button>

                    <Button
                      onClick={() => {
                        handleActionWithSpinner(async () => {
                          await sendMessage({
                            type: "DASHBOARD_CONTROL",
                            payload: {
                              action: "show_device_capabilities_detailed",
                              view: "device_capabilities_full",
                              dataTypes: [
                                "deviceCapabilities",
                                "playerSupported",
                                "bluetoothSupported",
                                "displaySupported",
                                "receiverVersion",
                                "sdkVersion",
                              ],
                              displayFormat: "detailed_cards",
                              timestamp: Date.now(),
                            },
                          });
                        }, "Loading detailed device capabilities");
                      }}
                      disabled={isLoading}
                      className="flex flex-col items-center p-3 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white text-xs"
                    >
                      <Tv className="w-5 h-5 mb-1" />
                      <span>Device Caps</span>
                      <span className="text-xs text-gray-400">Detailed</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Debug Window Controls */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Debug Windows & Console
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DEBUG_WINDOW_CONTROL",
                          payload: {
                            action: "toggle_visibility",
                            visible: true,
                            size: "small",
                            position: "bottom_right",
                            timestamp: Date.now(),
                          },
                        });
                      }, "Toggling debug window");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-3 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white text-xs"
                  >
                    <Monitor className="w-5 h-5 mb-1" />
                    <span>Debug Window</span>
                    <span className="text-xs text-gray-400">Small</span>
                  </Button>
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "CONSOLE_CONTROL",
                          payload: {
                            action: "toggle_visibility",
                            visible: true,
                            size: "small",
                            position: "bottom_left",
                            timestamp: Date.now(),
                          },
                        });
                      }, "Toggling console panel");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-3 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white text-xs"
                  >
                    <Code className="w-5 h-5 mb-1" />
                    <span>Console Panel</span>
                    <span className="text-xs text-gray-400">Small</span>
                  </Button>
                </div>

                {/* Debug Window Size Controls */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DEBUG_WINDOW_CONTROL",
                          payload: {
                            action: "set_size",
                            size: "large",
                            visible: true,
                            timestamp: Date.now(),
                          },
                        });
                      }, "Setting debug window to large");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-2 h-auto bg-black/20 border border-gray-700/30 hover:border-[#39FF14]/20 text-white text-xs"
                  >
                    <Monitor className="w-4 h-4 mb-1" />
                    <span>Large</span>
                  </Button>
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "CONSOLE_CONTROL",
                          payload: {
                            action: "set_size",
                            size: "medium",
                            visible: true,
                            timestamp: Date.now(),
                          },
                        });
                      }, "Setting console to medium");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-2 h-auto bg-black/20 border border-gray-700/30 hover:border-[#39FF14]/20 text-white text-xs"
                  >
                    <Code className="w-4 h-4 mb-1" />
                    <span>Medium</span>
                  </Button>
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "hide_all_overlays",
                            timestamp: Date.now(),
                          },
                        });
                      }, "Hiding all debug overlays");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-2 h-auto bg-black/20 border border-red-700/30 hover:border-red-500/20 text-white text-xs"
                  >
                    <Monitor className="w-4 h-4 mb-1" />
                    <span>Hide All</span>
                  </Button>
                </div>
              </div>

              {/* Dashboard Layout Controls */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Dashboard Layout
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "set_layout",
                            layout: "grid_2x2",
                            timestamp: Date.now(),
                          },
                        });
                      }, "Setting 2x2 grid layout");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-3 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white text-xs"
                  >
                    <div className="w-5 h-5 mb-1 grid grid-cols-2 gap-0.5">
                      <div className="bg-[#39FF14] rounded-sm"></div>
                      <div className="bg-[#39FF14] rounded-sm"></div>
                      <div className="bg-[#39FF14] rounded-sm"></div>
                      <div className="bg-[#39FF14] rounded-sm"></div>
                    </div>
                    <span>2x2 Grid</span>
                  </Button>
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "set_layout",
                            layout: "grid_3x2",
                            timestamp: Date.now(),
                          },
                        });
                      }, "Setting 3x2 grid layout");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-3 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white text-xs"
                  >
                    <div className="w-5 h-5 mb-1 grid grid-cols-3 gap-0.5">
                      <div className="bg-[#39FF14] rounded-sm"></div>
                      <div className="bg-[#39FF14] rounded-sm"></div>
                      <div className="bg-[#39FF14] rounded-sm"></div>
                      <div className="bg-[#39FF14] rounded-sm"></div>
                      <div className="bg-[#39FF14] rounded-sm"></div>
                      <div className="bg-[#39FF14] rounded-sm"></div>
                    </div>
                    <span>3x2 Grid</span>
                  </Button>
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "set_layout",
                            layout: "sidebar_main",
                            timestamp: Date.now(),
                          },
                        });
                      }, "Setting sidebar layout");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-3 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white text-xs"
                  >
                    <div className="w-5 h-5 mb-1 flex gap-0.5">
                      <div className="w-1.5 bg-[#39FF14] rounded-sm"></div>
                      <div className="flex-1 bg-[#39FF14] rounded-sm"></div>
                    </div>
                    <span>Sidebar</span>
                  </Button>
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "set_layout",
                            layout: "fullscreen",
                            timestamp: Date.now(),
                          },
                        });
                      }, "Setting fullscreen layout");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-3 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white text-xs"
                  >
                    <div className="w-5 h-5 mb-1 bg-[#39FF14] rounded-sm"></div>
                    <span>Fullscreen</span>
                  </Button>
                </div>
              </div>

              {/* System Controls */}
              <div className="mb-4">
                <h3 className="text-md font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  System Controls
                </h3>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "refresh_data",
                            timestamp: Date.now(),
                          },
                        });
                      }, "Refreshing dashboard data");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-4 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white"
                  >
                    <RotateCcw className="w-6 h-6 mb-2" />
                    <span className="text-sm">Refresh Data</span>
                  </Button>
                  <Button
                    onClick={() => {
                      handleActionWithSpinner(async () => {
                        await sendMessage({
                          type: "DASHBOARD_CONTROL",
                          payload: {
                            action: "toggle_theme",
                            timestamp: Date.now(),
                          },
                        });
                      }, "Toggling dashboard theme");
                    }}
                    disabled={isLoading}
                    className="flex flex-col items-center p-4 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white"
                  >
                    <Monitor className="w-6 h-6 mb-2" />
                    <span className="text-sm">Toggle Theme</span>
                  </Button>
                  <Button
                    onClick={handleResetDemo}
                    disabled={isLoading}
                    className="flex flex-col items-center p-4 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white"
                  >
                    <RotateCcw className="w-6 h-6 mb-2" />
                    <span className="text-sm">Reset</span>
                  </Button>
                </div>
              </div>

              {isLoading && (
                <div className="mt-4 flex justify-center">
                  <LoadingSpinner action={lastAction} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Advanced Controls - Show only when receiver is on portfolio-cards */}
        {isConnected && receiverPage === "portfolio-cards" && (
          <div
            id="presentation-controls-float"
            className="fixed left-1/2 bottom-8 z-50 transform -translate-x-1/2 drop-shadow-lg"
            style={{
              pointerEvents: isLoading ? "none" : "auto",
              opacity: 0,
              transition: "opacity 0.5s, transform 0.5s",
              animation: "dropFadeIn 0.7s cubic-bezier(0.4,0,0.2,1) forwards",
            }}
          >
            <div className="glass-morphism-large neon-glow-enhanced p-6 flex flex-col items-center">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-[#39FF14]" />
                <h2 className="text-xl font-bold text-white">
                  Presentation Controls
                </h2>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={handleNextSlide}
                  disabled={isLoading}
                  className="flex flex-col items-center p-4 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white"
                >
                  <ChevronRight className="w-6 h-6 mb-2" />
                  <span className="text-sm">Next Slide</span>
                  <span className="text-xs text-gray-400">
                    {presentationData.currentSlide + 1}/
                    {presentationData.totalSlides}
                  </span>
                </Button>
                <Button
                  onClick={handlePlayPause}
                  disabled={isLoading}
                  className="flex flex-col items-center p-4 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white"
                >
                  {presentationData.isPlaying ? (
                    <Pause className="w-6 h-6 mb-2" />
                  ) : (
                    <Play className="w-6 h-6 mb-2" />
                  )}
                  <span className="text-sm">
                    {presentationData.isPlaying ? "Pause" : "Play"}
                  </span>
                </Button>
                <Button
                  onClick={handlePlayPause}
                  disabled={isLoading}
                  className="flex flex-col items-center p-4 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white"
                >
                  <Video className="w-6 h-6 mb-2" />
                  <span className="text-sm">Auto Play Presentation</span>
                </Button>
                <Button
                  onClick={handleResetDemo}
                  disabled={isLoading}
                  className="flex flex-col items-center p-4 h-auto bg-black/30 border border-gray-700/50 hover:border-[#39FF14]/30 text-white"
                >
                  <RotateCcw className="w-6 h-6 mb-2" />
                  <span className="text-sm">Reset</span>
                </Button>
              </div>
              {isLoading && (
                <div className="mt-4 flex justify-center">
                  <LoadingSpinner action={lastAction} />
                </div>
              )}
              {/* Glowing Dots Row for Portfolio Pages */}
              <div className="flex justify-center items-center gap-4 mt-8">
                {Array.from({ length: presentationData.totalSlides }).map(
                  (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        // Send Cast message to scroll to the selected page
                        const msg = JSON.stringify({
                          type: "PRESENTATION_CONTROL",
                          payload: { action: "goto", page: idx },
                        });
                        if ((window as any).sendCastMessage) {
                          (window as any).sendCastMessage(msg);
                        }
                      }}
                      aria-label={`Go to page ${idx + 1}`}
                      title={`Go to page ${idx + 1}`}
                      className={`w-5 h-5 rounded-full border-2 border-[#39FF14] bg-black/80 shadow-lg transition-all duration-200 focus:outline-none ${
                        idx === presentationData.currentSlide
                          ? "shadow-[0_0_12px_4px_#39FF14,0_0_2px_1px_#2ed60a] bg-[#39FF14]/80 scale-110"
                          : "shadow-[0_0_8px_2px_#39FF14] hover:bg-[#39FF14]/40 opacity-80"
                      }`}
                      style={{
                        boxShadow:
                          idx === presentationData.currentSlide
                            ? "0 0 16px 6px #39FF14, 0 0 2px 1px #2ed60a"
                            : "0 0 8px 2px #39FF14",
                      }}
                    >
                      <span className="sr-only">Go to page {idx + 1}</span>
                    </button>
                  )
                )}
              </div>
            </div>
            <style>{`
            @keyframes dropFadeIn {
          0% { opacity: 0; transform: translate(-50%, 40px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
            }
          `}</style>
          </div>
        )}

        {/* Skills Showcase */}
        <div className="glass-morphism-large neon-glow-enhanced p-8">
          <h2 className="text-xl font-bold text-center text-gradient-active mb-6">
            Chromecast Development Expertise
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Cast,
                title: "Google Cast SDK",
                description:
                  "Advanced integration with Cast framework, custom receivers, and sender applications",
                level: "Expert",
              },
              {
                icon: Video,
                title: "Streaming Protocols",
                description:
                  "HLS, DASH, WebRTC implementation for seamless video delivery",
                level: "Advanced",
              },
              {
                icon: Monitor,
                title: "TV UI/UX Design",
                description:
                  "Optimized interfaces for large screens and remote control navigation",
                level: "Expert",
              },
              {
                icon: Zap,
                title: "Real-time Sync",
                description:
                  "Frame-perfect synchronization across multiple devices and platforms",
                level: "Advanced",
              },
            ].map((skill, index) => {
              const IconComponent = skill.icon;
              return (
                <div
                  key={index}
                  className="bg-black/40 backdrop-blur-sm border border-gray-700/50 hover:border-[#39FF14]/30 rounded-lg p-6 transition-all duration-300 hover:bg-black/60 transform hover:scale-105"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#39FF14]/20 to-[#2ed60a]/20 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-5 h-5 text-[#39FF14]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {skill.title}
                  </h3>
                  <p className="text-gray-300 text-xs mb-2">
                    {skill.description}
                  </p>
                  <Badge
                    className={`text-[10px] ${
                      skill.level === "Expert"
                        ? "bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30"
                        : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    }`}
                  >
                    {skill.level}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Section */}
        <ContactSection />
        <footer className="pt-10 text-center text-gray-400 relative z-10">
          <div className="max-w-4xl mx-auto px-4">
            <p>
              &copy; 2025 WSP - Senior Software Engineer. All rights reserved.
            </p>
            <p className="m-2 text-sm">
              Built with Next.js, TypeScript, GSAP, and Tailwind CSS
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
