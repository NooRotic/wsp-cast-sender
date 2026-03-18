import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { Video, StepForward } from "lucide-react";
import { gsap } from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import SplitType from "split-type";
import { useAnimation } from "@/contexts/AnimationContext";

// Register GSAP plugins (TextPlugin only, SplitText removed)
if (typeof window !== "undefined") {
  gsap.registerPlugin(TextPlugin);
}

export default function HeroSection() {
  const { setHeroAnimationsComplete, setUserHasScrolled } = useAnimation();
  const heroRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const subtitle2Ref = useRef<HTMLParagraphElement | null>(null);
  const subtitle3Ref = useRef<HTMLParagraphElement | null>(null);
  const skillsRef = useRef<HTMLDivElement | null>(null);
  const expertiseHeaderRef = useRef<HTMLHeadingElement | null>(null);
  const featuredWorkHeaderRef = useRef<HTMLHeadingElement | null>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const developerName = process.env.NEXT_PUBLIC_DEVELOPER_NAME || 'Walter S. Pollard Jr';
  const developerTitle = process.env.NEXT_PUBLIC_DEVELOPER_TITLE || 'Senior Software Engineer';

  // Hide all animated elements before the first browser paint so GSAP
  // can take ownership of opacity/visibility without any flash of content.
  useLayoutEffect(() => {
    gsap.set(
      [
        titleRef.current,
        subtitleRef.current,
        subtitle2Ref.current,
        subtitle3Ref.current,
        skillsRef.current,
        expertiseHeaderRef.current,
        featuredWorkHeaderRef.current,
      ].filter(Boolean),
      { opacity: 0 }
    );
    if (titleRef.current) titleRef.current.textContent = "";
  }, []);

  useEffect(() => {
    // Scroll detection to skip animation
    const handleScroll = () => {
      if (window.scrollY > 50 && !userScrolled) {
        setUserScrolled(true);
        setUserHasScrolled(true); // Update context
        // Skip animation and show content immediately
        if (timelineRef.current) {
          timelineRef.current.kill();
        }
        showContentImmediately();
        setHeroAnimationsComplete(true); // Mark animations as complete
      }
    };

    const showContentImmediately = () => {
      // Show all content immediately without animation
      if (titleRef.current) {
        titleRef.current.textContent = developerName;
        titleRef.current.style.opacity = '1';
      }
      if (subtitleRef.current) {
        subtitleRef.current.style.opacity = '1';
        subtitleRef.current.classList.remove('hero-initial-hidden');
      }
      if (subtitle2Ref.current) {
        subtitle2Ref.current.style.opacity = '1';
        subtitle2Ref.current.classList.remove('hero-initial-hidden');
      }
      if (subtitle3Ref.current) {
        subtitle3Ref.current.style.opacity = '1';
        subtitle3Ref.current.classList.remove('hero-initial-hidden');
      }
      if (skillsRef.current) {
        skillsRef.current.style.opacity = '1';
        skillsRef.current.classList.remove('hero-initial-hidden');
      }
      if (expertiseHeaderRef.current) {
        expertiseHeaderRef.current.style.opacity = '1';
      }
      if (featuredWorkHeaderRef.current) {
        featuredWorkHeaderRef.current.style.opacity = '1';
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const initTimer = setTimeout(() => {
      if (userScrolled) {
        showContentImmediately();
        return;
      }

      if (!titleRef.current) return;
  
      timelineRef.current = gsap.timeline()
        // ── phase: title-intro ──────────────────────────────────────────────
        .addLabel("title-intro")
        .fromTo(
          titleRef.current,
          { text: "", opacity: 0, y: 20, scale: 0.1, duration: 0.5, delay: 1 },
          {
            text: developerName,
            opacity: 1,
            y: 0,
            z: 0,
            rotateX: 0,
            stagger: 0.5,
            duration: 1.2,
            scale: 1,
            ease: "power1.inOut",
          }
        )
        // ── phase: title-cycle ──────────────────────────────────────────────
        .addLabel("title-cycle")
        .to({}, { duration: 0.6 })
        .to(titleRef.current, {
          text: 'From Flash & ActionScript\nto Streaming Video\nto Local AI LLMs\nto AI Agentic Development',
          duration: 5.5,
          scale: 1,
          ease: "none",
        })
        .to({}, { duration: 1.5 })
        .to(titleRef.current, {
          text: 'Chromecast Development',
          duration: 1.5,
          ease: "none",
        })
        .to({}, { duration: 1.2 })
        // ── phase: title-return ─────────────────────────────────────────────
        .addLabel("title-return")
        .to(titleRef.current, {
          text: developerName,
          rotateY: 0,
          rotateX: 0,
          duration: 1.2,
          delay: 0.2,
          ease: "power2.out",
        })
        // ── phase: subtitles ────────────────────────────────────────────────
        .addLabel("subtitles")
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: -18 },
          {
            opacity: 1,
            y: 0,
            z: -6,
            duration: 1.0,
            ease: "power2.out",
          },
          "-=0.8"
        )
        .add(
          () => {
            if (subtitle2Ref.current) {
              (subtitle2Ref.current as HTMLElement).classList.remove("hero-initial-hidden");
              (subtitle2Ref.current as HTMLElement).style.opacity = "1";
              (subtitle2Ref.current as HTMLElement).classList.add("split");
              
              // Use split-type to split subtitle2 into words and chars
              const split = new SplitType(subtitle2Ref.current!, { types: 'words,chars' });
              // Animate words (similar to SplitText)
              gsap.fromTo(
                split.words,
                {
                  y: 20,
                  x: () => gsap.utils.random(-50, 50),
                  rotation: -45,
                  autoAlpha: 0,
                  transformOrigin: () => gsap.utils.random(["left bottom", "right bottom", "left top", "right top"]),
                },
                {
                  duration: 1.0,
                  y: 0,
                  x: 0,
                  rotation: 0,
                  autoAlpha: 1,
                  stagger: 0.1,
                  ease: "back.out(1.7)",
                  onComplete: () => {
                    if (subtitle2Ref.current)
                      (subtitle2Ref.current as HTMLElement).style.opacity = "1";
                  },
                }
              );
            }
          },
          "-=0.5"
        )
        .add(
          () => {
            if (subtitle3Ref.current) {
              (subtitle3Ref.current as HTMLElement).classList.remove("hero-initial-hidden");
              (subtitle3Ref.current as HTMLElement).style.opacity = "1";

              // Use split-type to split subtitle3 into words only
              const split3 = new SplitType(subtitle3Ref.current!, { types: 'words' });
              gsap.fromTo(
                split3.words,
                {
                  opacity: 0,
                  x: 15,
                },
                {
                  duration: 1.8,
                  opacity: 1,
                  x: 0,
                  stagger: 0.2,
                  ease: "power2.out",
                  onComplete: () => {
                    if (subtitle3Ref.current)
                      (subtitle3Ref.current as HTMLElement).style.opacity = "1";
                  },
                }
              );
            }
          },
          "+=0.4"
        )
        // ── phase: skills ───────────────────────────────────────────────────
        .addLabel("skills")
        .fromTo(
          skillsRef.current,
          {
            opacity: 0,
            y: -15,
            z: 10
          },
          {
            opacity: 1,
            y: 0,
            z: 10,
            duration: 1.8,
            ease: "back.out(1.7)",
            onComplete: () => {
              // All main hero animations are complete
              setHeroAnimationsComplete(true);
            }
           },
          "+=1.2"
        );

      if (expertiseHeaderRef.current) {
        gsap.fromTo(
          expertiseHeaderRef.current,
          { opacity: 0, y: 10, rotateX: -10 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 1.5,
            ease: "power2.out",
            delay: 1,
          }
        );
      }
      if (featuredWorkHeaderRef.current) {
        gsap.fromTo(
          featuredWorkHeaderRef.current,
          { opacity: 0, y: 10, rotateX: -10 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 1.5,
            ease: "power2.out",
            delay: 0.5,
          }
        );
      }
      gsap.to(".skill-icon:not(.skill-card-performance)", {
        y: -2,
        duration: 4.75,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.8,
      });
      
      // Performance card floats slightly more than the other skill icons
      gsap.to(".skill-card-performance", {
        y: -4, // tweak this value for more/less float
        duration: 4.75,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 2.4,
      });
      
      gsap.to(
        [expertiseHeaderRef.current, featuredWorkHeaderRef.current],
        {
          y: -1,
          duration: 6.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          stagger: 0.3,
        }
      );
    }, 5);
    
    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('scroll', handleScroll);
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [developerName, userScrolled, setHeroAnimationsComplete, setUserHasScrolled]);

  return (
    <section ref={heroRef} className="min-h-screen flex flex-col justify-center items-center relative px-4 z-0 hero-section-loading pt-12 hero-perspective">
      <style jsx>{`
        :root {
          --skill-card-min-height: 625px; /* Increased by 10% for even better GIF window visibility */
          --skill-card-max-height: 750px; /* Increased by 10% for even better GIF window visibility */
        }
        
        .skill-card-showcase {
          min-height: var(--skill-card-min-height);
          max-height: var(--skill-card-max-height);
          width: 120%; /* Ensure cards take full available width */
        }

      `}</style>
      <div className="text-center w-full max-w-full mx-auto m-8 drop-shadow-xl relative z-0 hero-content-spacing-compact hero-3d-container">
        <h1
          ref={titleRef}
          className="hero-title text-2xl md:text-6xl font-semibold tracking-wide text-gradient-active mb-3 drop-shadow-white hero-title-3d leading-relaxed pb-2"
          style={{ whiteSpace: 'pre-line' }}
        />
        {/* Glass Container for Developer Info */}
        <div 
          ref={subtitleRef}
          className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 hover:border-[#39FF14]/30 transition-all duration-300 w-full max-w-2xl mx-auto mb-6 hero-initial-hidden opacity-0"
        >
          <p
            className="hero-subtitle text-lg md:text-2xl underline tracking-normal text-center mx-auto hero-subtitle-z1 mb-4"
            style={{ 
              textUnderlineOffset: "8px",
              textDecorationColor: '#39FF14', 
              textDecorationThickness: '3px' 
            }}
         >
            {developerTitle}
          </p>
          <p
            ref={subtitle2Ref}
            className="hero-subtitle text-xs md:text-base text-center tracking-wide mx-auto hero-initial-hidden hero-subtitle-z2"
          >
            Developing software from ActionScript to JavaScript<br />
            25+ years of experience in web development<br />
            Passionate Chromecast Developer<br />
            <strong>High interest in local LLMs and AI innovation</strong>
          </p>
        </div> 
        <div>
          <p
            ref={subtitle3Ref}
            className="hero-skills-3d text-lg md:text-2xl m-1 leading-loose tracking-wide font-bold hero-initial-hidden text-center"
          >
            I&apos;ve been building complex data-driven UIs since the early Flash days,<br />
            and I&apos;m excited to leverage AI to create the next generation of web experiences.
          </p>
       </div>
       <hr className="border-gray-700/30 w-full max-w-2xl mx-auto mb-6" />
        {/* Responsive Layout: Featured Work on top for mobile, side-by-side for larger screens */}
        <div ref={skillsRef} className="w-full max-w-[90%] mx-auto mt-6 hero-initial-hidden hero-skills-3d">
          {/* Featured Work Section - Mobile First (appears on top) */}
          <div className="space-y-8 lg:hidden mb-24">
            <h3 
              ref={featuredWorkHeaderRef}
              className="text-base md:text-2xl font-bold text-center text-gradient-active mb-3 opacity-0 drop-shadow-white leading-tight"
            >
              Featured Work
            </h3>

            {/* Project Preview Cards for Mobile - Responsive Row */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-8 py-10 project-preview-card flex-1 min-h-[420px]">
                <div className="flex items-center gap-3 mb-4">
                  <Video className="w-5 h-5 text-[#39FF14]" />
                  <h4 className="font-semibold text-white text-base">Comcast Video Streaming Products</h4>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 flex items-center justify-center w-16 h-16">
                    <Image
                      src="/icons/xfinity-stream.png"
                      alt="Xfinity Stream"
                      width={48}
                      height={48}
                      className="object-contain rounded"
                      loader={({ src }) => src}
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <ul className="space-y-3">
                      <li className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">▶</span>
                        <span className="leading-relaxed text-left">VOD/Linear/SVOD/OTT/DAI solutions handling millions of worldwide concurrent users</span>
                      </li>
                      <li className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">▶</span>
                        <span className="leading-relaxed text-left">Created custom debugging tools for video playback issues, desktop and chromecast</span>
                      </li>
                      <li className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">▶</span>
                        <span className="leading-relaxed text-left">Created device detection, HDCP detection, and custom error handling for video playback</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">LitElement</span>
                  <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">Custom Debugging Tools</span>
                  <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">OPEN API - Swagger</span>
                  <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">Full CI workflow</span>
                </div>
              </div>
              <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 py-10 project-preview-card flex-1 min-h-[420px]">
                <div className="flex items-center gap-3 mb-4">
                  <StepForward className="w-5 h-5 text-[#39FF14]" />
                  <h4 className="font-semibold text-white text-base">Sr Software Engineer</h4>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 flex items-center justify-center w-16 h-16">
                    <Image
                      src="/icons/Wu-Tang-Logo.png"
                      alt="Wu-Tang Clan Logo"
                      width={48}
                      height={48}
                      className="object-contain rounded"
                      loader={({ src }) => src}
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <ul className="space-y-1">
                      <li className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">◉</span>
                        <span className="leading-relaxed text-left">Comcast - Developed and maintained video playback solutions for video streaming applications</span>
                      </li>
                      <li className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">◉</span>
                        <span className="leading-relaxed text-left">Extensive Ad Agency Experience</span>
                      </li>
                      <li className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">◉</span>
                        <span className="leading-relaxed text-left">Passionate about cutting-edge video technologies and delivering exceptional user experiences</span>
                      </li>
                      <li className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">◉</span>
                        <span className="leading-relaxed text-left">Building custom debugging tools to ensure delivering exceptional user experiences</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-6 mt-6 mb-4">
                  <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">Javascript</span>
                  <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">TypeScript</span>
                  <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">LitElement</span>
                  <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">JIRA</span>
                  <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">CI workflows</span>
                  <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">Agile Methodologies</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 m-auto max-w-7xl">
            {/* Left Column: Skills Showcase - Takes up ~35% of width */}
            <div className="space-y-2 flex-1 lg:flex-[0.8] flex flex-col items-center">
              <h3 
                ref={expertiseHeaderRef}
                className="text-xl md:text-3xl font-bold text-center text-gradient-active mb-1 opacity-0 drop-shadow-white"
              >
                Core Expertise
              </h3>

              {/* Glass Container for Skills & Stats - Two Row Layout */}
              <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-5  hover:border-[#39FF14]/30 transition-all duration-300 w-full max-w-xl mx-auto">
                {/* First Row: Skills with GIFs - Single Column Layout */}
                <div className="grid grid-cols-1 gap-10 mb-8 mt-6 justify-items-center">
                  {/* JavaScript Skill Card */}
                  <div className="skill-icon skill-card-showcase relative bg-black/30 backdrop-blur-sm border border-gray-700/30 hover:border-[#39FF14]/30 rounded-lg transition-all duration-300 hover:bg-black/50 overflow-hidden group w-full">
                    <div className="skill-card-container w-full h-full absolute inset-0">
                      <Image
                        src="/gifs/vscode-javascript.gif"
                        alt="JavaScript coding animation"
                        width={600}
                        height={289}
                        className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                        loader={({ src }) => src}
                        unoptimized
                      />
                    </div>
                    <div className="relative z-10 p-6 h-full flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent">
                      <span className="text-base font-bold text-white skill-card-text text-center w-full leading-relaxed drop-shadow-xl bg-black/60 px-4 py-3 rounded-lg whitespace-nowrap overflow-hidden text-ellipsis">JavaScript Experience</span>
                    </div>
                  </div>

                  {/* Streaming Video Skill Card */}
                  <div className="skill-icon skill-card-showcase relative bg-black/30 backdrop-blur-sm border border-gray-700/30 hover:border-[#39FF14]/30 rounded-lg transition-all duration-300 hover:bg-black/50 overflow-hidden group w-full">
                    <div className="skill-card-container w-full h-full absolute inset-0">
                      <Image
                        src="/gifs/big-buck-bunny.gif"
                        alt="Streaming video animation"
                        width={480}
                        height={272}
                        className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                        loader={({ src }) => src}
                        unoptimized
                      />
                    </div>
                    <div className="relative z-10 p-6 h-full flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent">
                      <span className="text-base font-bold text-white skill-card-text text-center w-full leading-relaxed drop-shadow-xl bg-black/60 px-4 py-3 rounded-lg whitespace-nowrap overflow-hidden text-ellipsis">Streaming HD Video</span>
                    </div>
                  </div>

                  {/* Performance Skill Card */}
                  <div className="skill-card-performance skill-icon skill-card-showcase relative bg-black/30 backdrop-blur-sm border border-gray-700/30 hover:border-[#39FF14]/30 rounded-lg transition-all duration-300 hover:bg-black/50 overflow-hidden group w-full">
                   <div className="skill-card-container w-full h-full absolute inset-0">
                      <Image
                        src="/gifs/eva_ritsuko_typing.gif"
                        alt="Performance optimization animation"
                        width={490}
                        height={372}
                        className="object-contain w-full h-full opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          objectPosition: 'center -10vh',
                          scale: '1.05',
                        }}
                        loader={({ src }) => src}
                        unoptimized
                      />
                    </div>
                    <div className="relative z-10 p-6 h-full flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent">
                      <span className="text-base font-bold text-white skill-card-text text-center w-full leading-relaxed drop-shadow-xl bg-black/60 px-4 py-3 rounded-lg whitespace-nowrap overflow-hidden text-ellipsis">Performance & Debugging</span>
                    </div>
                  </div>

                  {/* Real World Experience Card */}
                  <div className="skill-icon skill-card-showcase relative bg-black/30 backdrop-blur-sm border border-gray-700/30 hover:border-[#39FF14]/30 rounded-lg transition-all duration-300 hover:bg-black/50 overflow-hidden group w-full">
                    <div className="skill-card-container w-full h-full absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                      <Image
                        src="/gifs/Matrix_welcome_to_the_real.gif"
                        alt="Real world experience animation"
                        width={240}
                        height={240}
                        className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                        loader={({ src }) => src}
                        unoptimized
                      />
                    </div>
                    <div className="relative z-10 p-6 h-full flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent">
                      <span className="text-base font-bold text-white skill-card-text text-center w-full leading-relaxed drop-shadow-xl bg-black/60 px-4 py-3 rounded-lg whitespace-nowrap overflow-hidden text-ellipsis">Real World Experience</span>
                    </div>
                  </div>
                </div>

                {/* Second Row: Stats */}
                <div className="grid grid-cols-3 gap-5 md:gap-6 mb-2 w-full">
                  {/* Years Experience Stat */}
                  <div className="bg-black/40 backdrop-blur-sm border border-gray-700/30 rounded-lg p-2 md:p-3 hover:border-[#39FF14]/30 transition-all duration-300 text-center flex flex-col justify-center min-h-[90px] md:min-h-[100px] min-w-[90px] md:min-w-[100px]">
                    <div className="text-lg md:text-xl font-bold text-[#39FF14] mb-1 leading-tight">25+</div>
                    <div className="text-[10px] md:text-xs text-gray-300 leading-tight break-words px-1">Years Experience</div>
                  </div>

                  {/* Projects Delivered Stat */}
                  <div className="bg-black/40 backdrop-blur-sm border border-gray-700/30 rounded-lg p-2 md:p-3 hover:border-[#39FF14]/30 transition-all duration-300 text-center flex flex-col justify-center min-h-[90px] md:min-h-[100px] min-w-[90px] md:min-w-[100px]">
                    <div className="text-lg md:text-xl font-bold text-[#39FF14] mb-1 leading-tight">50+</div>
                    <div className="text-[10px] md:text-xs text-gray-300 leading-tight break-words px-1">Projects Delivered</div>
                  </div>
                  {/* Users Served Stat */}
                  <div className="bg-black/40 backdrop-blur-sm border border-gray-700/30 rounded-lg p-2 md:p-3 hover:border-[#39FF14]/30 transition-all duration-300 text-center flex flex-col justify-center min-h-[90px] md:min-h-[100px] min-w-[90px] md:min-w-[100px]">
                    <div className="text-lg md:text-xl font-bold text-[#39FF14] mb-1 leading-tight">100M+</div>
                    <div className="text-[10px] md:text-xs text-gray-300 leading-tight break-words px-1">Ads Served</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Featured Projects Preview - Desktop Only - Takes up ~65% of width */}
            <div className="space-y-3 hidden lg:block flex-1 lg:flex-[1.45]">
              <h3 
                ref={featuredWorkHeaderRef}
                className="text-xl md:text-3xl font-bold text-center text-gradient-active mb-2 opacity-0 drop-shadow-white leading-tight"
              >
                Featured Work
              </h3>

              {/* Single Column Project Preview Cards for Desktop */}
              <div className="space-y-3">
                <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 py-3 project-preview-card">
                  <div className="flex items-center gap-3 mb-2">
                    <Video className="w-5 h-5 text-[#39FF14]" />
                  <h4 className="font-semibold text-white text-base">Comcast Video Streaming Products</h4>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 flex items-center justify-center w-14 h-14">
                      <Image
                        src="/icons/xfinity-stream.png"
                        alt="Xfinity Stream"
                        width={48}
                        height={48}
                        className="object-contain rounded"
                        loader={({ src }) => src}
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <ul className="space-y-2">
                      <li className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-[#39FF14] font-bold text-xs leading-relaxed flex-shrink-0 mt-0.5">▶</span>
                          <span className="leading-relaxed text-left">VOD/Linear/SVOD/OTT/DAI solutions handling millions of worldwide concurrent users</span>
                        </li>
                        <li className="text-base text-gray-300 flex items-start gap-2">
                          <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">▶</span>
                          <span className="leading-relaxed text-left">Led video player development from Flash RTMPE to Javascript based HLS</span>
                        </li>
                        <li className="text-base text-gray-300 flex items-start gap-2">
                          <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">▶</span>
                          <span className="leading-relaxed text-left">Created custom debugging tools for video playback issues, desktop and chromecast</span>
                        </li>
                        <li className="text-base text-gray-300 flex items-start gap-2">
                          <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">▶</span>
                          <span className="leading-relaxed text-left">Created solutions for <strong>chromecast device detection</strong>, chromecast TV <strong>HDCP detection</strong>, and custom error handling for video playback</span>
                        </li>
                        <li className="text-base text-gray-300 flex items-start gap-2">
                          <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">▶</span>
                          <span className="leading-relaxed text-left">Updated Chromecast app to support both a hypermedia API and openAPI specifications in the same app</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">Javascript</span>
                    <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">TypeScript</span>
                    <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">LitElement</span>
                    <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">Custom Tools</span>
                    <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">OPEN API - Swagger</span>
                    <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">JIRA</span>
                    <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">CI workflows</span>
                  </div>
                </div>
                <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 project-preview-card min-h-[400px]">
                  <div className="flex items-center gap-3 mb-2">
                    <StepForward className="w-5 h-5 text-[#39FF14]" />
                    <h4 className="font-semibold text-white text-lg">Career and Personal Development</h4>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 -mr-3">
                      <Image
                        src="/icons/Wu-Tang-Logo.png"
                        alt="Wu-Tang Clan Logo"
                        width={45}
                        height={45}
                        className="object-contain rounded"
                        loader={({ src }) => src}
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <ul className="space-y-2">
                        <li className="text-base text-gray-300 flex items-start gap-2">
                          <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">◉</span>
                          <span className="leading-relaxed text-left"><strong>Comcast Experience: </strong>A part of CIM (Comcast Interactive Media), 
                          focusing on video playback solutions. Grew from contractor in to a full time<strong>Software Engineer 4</strong> position. 
                          Grew into a lead engineer for Stream Xfinity Chromecast product generating <strong>millions</strong> of video and ad views </span>
                        </li>
                        <li className="text-base text-gray-300 flex items-start gap-2">
                          <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">◉</span>
                          <span className="leading-relaxed text-left">Extensive high stakes <strong> ad agency experience </strong> delivering exceptional user experiences</span>
                        </li>
                        <li className="text-base text-gray-300 flex items-start gap-2">
                          <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">◉</span>
                          <span className="leading-relaxed text-left">Passionate about cutting-edge video technologies and leveraging open source frameworks</span>
                        </li>
                        <li className="text-base text-gray-300 flex items-start gap-2">
                          <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">◉</span>
                          <span className="leading-relaxed text-left">Able to and takes pride in self-starting projects, leading teams to new findings and putting effort into team mentoring</span>
                        </li>
                           <li className="text-base text-gray-300 flex items-start gap-2">
                          <span className="text-[#39FF14] font-bold text-sm leading-relaxed flex-shrink-0 mt-0.5">◉</span>
                          <span className="leading-relaxed text-left">A love of learning, always highly interested in learning new frameworks, new technologies and not planning on stopping</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6 flex-wrap">
                    <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">Dog Dad (foster a dog!)</span>
                    <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">Father</span>
                    <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">Long time Video Gamer</span>
                    <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">Live Streamer</span>
                    <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">Outdoorsman</span>
                    <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-sm rounded">Rug Tufting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA button removed as it's redundant above the featured projects */}
      </div>
    </section>
  );
}
