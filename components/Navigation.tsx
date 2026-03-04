"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ChevronDown } from "lucide-react";
import CastButton from "@/components/CastButton";
import Link from "next/link";
import ResumeDownloadButton from "@/components/ResumeDownloadButton";
import { useAnimation } from "@/contexts/AnimationContext";

export default function Navigation() {
  const { heroAnimationsComplete, userHasScrolled, setUserHasScrolled } = useAnimation();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isResumeExpanded, setIsResumeExpanded] = useState(false);
  const [isDemoDropdownOpen, setIsDemoDropdownOpen] = useState(false);
  const [shouldShowNav, setShouldShowNav] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const hasScrolled = window.scrollY > 100;
      setScrolled(hasScrolled);
      
      // If user scrolls, mark as scrolled and show nav
      if (window.scrollY > 50 && !userHasScrolled) {
        setUserHasScrolled(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [userHasScrolled, setUserHasScrolled]);

  // Show navigation when animations complete OR user has scrolled OR not on home page
  useEffect(() => {
    const isHomePage = pathname === '/' || pathname === '';
    if (!isHomePage || heroAnimationsComplete || userHasScrolled) {
      setShouldShowNav(true);
    } else {
      setShouldShowNav(false);
    }
  }, [heroAnimationsComplete, userHasScrolled, pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDemoDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { label: "Home", href: "#home" },
    { label: "Skills", href: "#skills" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" },
  ];

  const demoPages = [
    { label: "Cast Demo", href: "/cast-demo" },
    { label: "Media Demo", href: "/media-demo" },
  ];

  const scrollToSection = (href: string) => {
    if (pathname === '/' || pathname === '') {
      // On the welcome page, scroll as before
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      setIsOpen(false);
    } else {
      // On any other page, navigate to / with hash
      router.push('/' + href);
      setIsOpen(false);
    }
  };

  return (
    <nav
      className={`nav-background transition-all duration-500 ease-in-out ${
        scrolled ? "nav-background-scrolled" : "nav-background-transparent"
      } ${
        shouldShowNav 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 -translate-y-full pointer-events-none"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <ResumeDownloadButton onExpandChange={setIsResumeExpanded} />
        <div className="flex justify-between items-center h-16 relative pt-2">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center justify-between w-full">
            {/* Left side - Navigation menu items — always clears the resume button icon */}
            <div className={`flex items-center space-x-3 transition-all duration-300 ease-in-out ${
              isResumeExpanded ? 'ml-60' : 'ml-16'
            }`}>
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="nav-menu-item"
                >
                  {item.label}
                </button>
              ))}
              
              {/* Demo Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDemoDropdownOpen(!isDemoDropdownOpen)}
                  className="nav-menu-item flex items-center space-x-1"
                >
                  <span>Demo Pages</span>
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${isDemoDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDemoDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-sm border border-[#39FF14]/20 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      {demoPages.map((page) => (
                        <Link
                          key={page.href}
                          href={page.href}
                          onClick={() => setIsDemoDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-[#39FF14] hover:bg-[#39FF14]/10 transition-colors"
                        >
                          {page.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Cast buttons positioned at absolute top-right corner */}
          <div className="hidden md:flex items-center space-x-2 pt-3 absolute top-1/2 right-0 transform -translate-y-1/2 z-10">
            <div className="cast-button-nav-scale">
              <CastButton
                variant="outline"
                size="xs"
                href="/cast-demo"
                theme="navigation"
                ignoreCastState={true}
              >
                Cast Demo Page
              </CastButton>
            </div>
            <div className="cast-button-nav-scale">
              <CastButton
                variant="outline"
                size="xs"
                href="/media-demo"
                theme="navigation"
                ignoreCastState={true}
              >
                Media Player Demo
              </CastButton>
            </div>

            {/* Google Cast menu button - opens Chrome's native cast menu */}
            <div className="cast-button-nav-scale">
              <CastButton
                variant="outline"
                size="xs"
                theme="youtube"
                functionType="googleCast"
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="nav-mobile-button"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="nav-mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="nav-mobile-menu-item"
                >
                  {item.label}
                </button>
              ))}
              
              {/* Demo Pages in Mobile Menu */}
              <div className="border-t border-[#39FF14]/20 pt-2 mt-2">
                <div className="px-3 py-1 text-xs text-[#39FF14] font-semibold">Demo Pages</div>
                {demoPages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-300 hover:text-[#39FF14] hover:bg-[#39FF14]/10 transition-colors rounded"
                  >
                    {page.label}
                  </Link>
                ))}
              </div>
              
              <div className="border-t border-[#39FF14]/20 pt-2 mt-2">
                <div className="px-3 py-2">
                  <CastButton
                    variant="outline"
                    size="sm"
                    theme="youtube"
                    functionType="googleCast"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
