'use client';

import { useState, useEffect } from 'react';
import { Download, FileText } from 'lucide-react';

interface ResumeDownloadButtonProps {
  onExpandChange?: (isExpanded: boolean) => void;
}

export default function ResumeDownloadButton({ onExpandChange }: ResumeDownloadButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInitiallyOpen, setIsInitiallyOpen] = useState(true);

  // Auto-close after 1 second on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitiallyOpen(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Notify parent when expanded state changes
  useEffect(() => {
    onExpandChange?.(isInitiallyOpen || isHovered);
  }, [isInitiallyOpen, isHovered, onExpandChange]);

  const isExpanded = isInitiallyOpen || isHovered;

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => window.open('/resume/WalterSPollardJrResume.pdf', '_blank')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group flex items-center cursor-pointer scale-[0.92] bg-black/80 backdrop-blur-sm border border-[#39FF14]/50 hover:border-[#39FF14] rounded-lg transition-all duration-200 hover:bg-black/90 hover:shadow-lg hover:shadow-[#39FF14]/25"
        title="Download Resume PDF"
        aria-label="Download Resume PDF"
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-[#39FF14]/20 to-[#2ed60a]/20 rounded-l-lg flex-shrink-0">
          <FileText className="w-5 h-5 text-[#39FF14] transition-transform duration-200 group-hover:scale-110" />
        </div>

        {/* Expandable label */}
        <div
          className="flex items-center overflow-hidden transition-all duration-200 ease-in-out"
          style={{ maxWidth: isExpanded ? 160 : 0, paddingLeft: isExpanded ? 12 : 0, paddingRight: isExpanded ? 12 : 0 }}
        >
          <span className="text-[#39FF14] text-xs font-thin whitespace-nowrap">Resume</span>
          <Download className="w-4 h-4 text-[#39FF14] ml-2 flex-shrink-0" />
        </div>
      </button>

      {/* Hover tooltip (desktop only, when collapsed) */}
      {!isExpanded && (
        <div className="hidden md:block absolute top-full left-0 mt-2 px-2 py-1 bg-black/90 text-[#39FF14] text-xs rounded border border-[#39FF14]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          Download Resume PDF
        </div>
      )}
    </div>
  );
}
