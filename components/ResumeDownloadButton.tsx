'use client';

import { useState, useEffect } from 'react';
import { Download, FileText } from 'lucide-react';

interface ResumeDownloadButtonProps {
  onExpandChange?: (isExpanded: boolean) => void;
}

export default function ResumeDownloadButton({ onExpandChange }: ResumeDownloadButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInitiallyOpen, setIsInitiallyOpen] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Auto-close after 3 seconds on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitiallyOpen(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Force re-render when hover state changes to ensure DOM updates
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [isHovered]);

  // Notify parent when expanded state changes
  useEffect(() => {
    const isExpanded = isInitiallyOpen || isHovered;
    onExpandChange?.(isExpanded);
  }, [isInitiallyOpen, isHovered, onExpandChange]);

  const handleDownload = () => {
    // Open PDF in new tab (which will trigger download or view depending on browser settings)
    window.open('/resume/WalterSPollardJrResume.pdf', '_blank');
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Immediately set hover to false and force update
    setIsHovered(false);
    setForceUpdate(prev => prev + 1);
  };

  return (
    <div className="absolute top-4 left-14 md:left-4 z-[9999] pointer-events-none">
      <button
        key={`resume-btn-${forceUpdate}`}
        onClick={handleDownload}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group pointer-events-auto cursor-pointer scale-[0.92]"
        title="Download Resume PDF"
        aria-label="Download Resume PDF"
      >
        {/* Main button container */}
        <div className="flex items-center bg-black/80 backdrop-blur-sm border border-[#39FF14]/50 hover:border-[#39FF14] rounded-lg transition-all duration-200 hover:bg-black/90 hover:shadow-lg hover:shadow-[#39FF14]/25 hover:scale-105">
          
          {/* Icon container */}
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-[#39FF14]/20 to-[#2ed60a]/20 rounded-l-lg">
            <FileText className="w-5 h-5 text-[#39FF14] transition-transform duration-200 group-hover:scale-110" />
          </div>
          
          {/* Expandable text section - open initially, then only on hover */}
          <div className={`flex items-center transition-all duration-150 overflow-hidden ${
            (isInitiallyOpen || isHovered) ? 'max-w-32 px-3' : 'max-w-0 px-0'
          } md:${(isInitiallyOpen || isHovered) ? 'max-w-40' : 'max-w-0'}`}>
            <span className="text-[#39FF14] text-xs font-thin whitespace-nowrap">
              Resume
            </span>
            <Download className="w-4 h-4 text-[#39FF14] ml-2" />
          </div>
        </div>
        
        {/* Tooltip for when not hovered and not initially open - hidden on mobile */}
        {!isHovered && !isInitiallyOpen && (
          <div className="hidden md:block absolute top-full left-0 mt-2 px-2 py-1 bg-black/90 text-[#39FF14] text-xs rounded border border-[#39FF14]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Download Resume PDF
          </div>
        )}
        
        {/* Mobile tooltip - always visible on small screens when closed */}
        {!isInitiallyOpen && (
          <div className="md:hidden absolute top-full left-0 mt-0 text-[#39FF14] text-xs font-thin opacity-70">
            Resume
          </div>
        )}
      </button>
    </div>
  );
}
