'use client';

import { useState, useRef, useEffect } from 'react';
import { Github, Calendar, Building, TrendingUp } from 'lucide-react';
import { gsap } from 'gsap';
import Image from 'next/image';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  // Removed all scaling and GSAP transform effects. Only border color will update on hover via CSS.

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    
    if (!isExpanded && expandedRef.current) {
      gsap.fromTo(expandedRef.current,
        { opacity: 0, height: 0 },
        { opacity: 1, height: 'auto', duration: 0.5, ease: 'power3.out' }
      );
    }
  };

  const renderMedia = () => {
    // Only render media if there are imageUrls, videos, or it's an interactive project with embed
    const hasImages = project.imageUrls && project.imageUrls.length > 0;
    const hasVideo = project.type === 'text+video' && project.videoUrl;
    const hasEmbed = project.type === 'interactive' && project.embedUrl;

    if (hasVideo) {
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
          <video
            src={project.videoUrl}
            poster={project.thumbnail}
            controls
            className="w-full h-full object-cover"
            onLoadedData={() => setMediaLoaded(true)}
          />
        </div>
      );
    }

    if (hasImages) {
      return (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {project.imageUrls!.slice(0, 4).map((image, idx) => (
            <div key={idx} className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={image}
                alt={`${project.title} - Image ${idx + 1}`}
                width={400}
                height={225}
                className="w-full h-full object-cover"
                onLoad={() => setMediaLoaded(true)}
                unoptimized
                loader={({ src }) => src}
              />
            </div>
          ))}
        </div>
      );
    }

    if (hasEmbed) {
      return (
        <div className="aspect-video bg-black bg-transparent rounded-lg overflow-hidden mb-4">
          <iframe
            src={project.embedUrl}
            title={project.title}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => setMediaLoaded(true)}
          />
        </div>
      );
    }

    // No media to render - this will make the card more condensed
    return null;
  };

  const hasMedia = () => {
    return (project.imageUrls && project.imageUrls.length > 0) ||
           (project.type === 'text+video' && project.videoUrl) ||
           (project.type === 'interactive' && project.embedUrl);
  };

  return (
    <div
      ref={cardRef}
      className="p-4 h-full flex flex-col  border-gray-700 hover:border-[#39FF14] transition-colors duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#39FF14] mb-2 group-hover:text-[#39FF14] transition-colors">{project.title}</h3>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {project.duration}
            </div>
            {project.company && (
              <div className="flex items-center gap-1">
                <Building className="w-3 h-3" />
                {project.company}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-[#39FF14]/20 rounded-lg transition-colors"
            >
              <Github className="w-3 h-3 text-[#39FF14]" />
            </a>
          )}
        </div>
      </div>

      {/* Media - only render if media exists */}
      {renderMedia()}

      {/* Demo URL - displayed as text with clickable link */}
      {project.demoUrl && (
        <div className="mb-3 text-sm text-gray-300">
          <span className="text-gray-400">URL: </span>
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#39FF14] hover:text-[#39FF14]/80 underline transition-colors"
          >
            {project.demoUrl}
          </a>
        </div>
      )}

      {/* Description */}
      <p className="text-gray-300 mb-4 flex-1">{project.description}</p>

      {/* Tech Stack */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {project.techStack.map((tech, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-[#8B0000]/20 text-[#39FF14] text-sm rounded-full border border-[#8B0000]"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {Object.entries(project.metrics).slice(0, 2).map(([key, value]) => (
          <div key={key} className="text-center">
            <div className="text-[#39FF14] font-semibold">{value}</div>
            <div className="text-xs text-gray-400 capitalize">{key.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      {/* Expand Button */}
      <button
        onClick={toggleExpanded}
        className="flex items-center justify-center gap-2 w-full py-2 text-[#39FF14] hover:bg-[#39FF14]/10 rounded-lg transition-colors"
      >
        <TrendingUp className="w-4 h-4" />
        {isExpanded ? 'Show Less' : 'Show Details'}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div ref={expandedRef} className="mt-4 space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-[#39FF14] mb-2">Key Achievements</h4>
            <ul className="space-y-1">
              {project.achievements.map((achievement, idx) => (
                <li key={idx} className="text-gray-300 text-sm">
                  • {achievement}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-[#39FF14] mb-2">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(project.metrics).map(([key, value]) => (
                <div key={key} className="bg-black/20 p-3 rounded-lg">
                  <div className="text-[#39FF14] font-semibold">{value}</div>
                  <div className="text-xs text-gray-400 capitalize">{key.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}