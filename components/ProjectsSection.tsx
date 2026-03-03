'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProjectCard from './ProjectCard';
import projectsData from '@/data/projects.json';
import { ProjectsData, Project } from '@/types';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const cards = cardsRef.current.filter(Boolean);

    // Matrix-styled title animation (same as SkillsShowcase titleRef)
    if (titleRef.current) {
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: 15, transformOrigin: "center" },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    // Cards animation with stagger
    if (cards.length > 0) {
      gsap.fromTo(cards,
        { opacity: 0, y: 15, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.5,
          ease: 'power2.out',
          stagger: 0.5,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    // Gentle floating animation for title header
    if (titleRef.current) {
      gsap.to(titleRef.current, {
        y: -2,
        duration: 4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1.5,
      });
    }

  }, [mounted]);

  // Helper function to determine if project has media
  const hasMedia = (project: Project) => {
    return (project.imageUrls && project.imageUrls.length > 0) ||
           (project.type === 'text+video' && project.videoUrl) ||
           (project.type === 'interactive' && project.embedUrl);
  };

  // Separate projects with and without media
  const projectsWithMedia = (projectsData as ProjectsData).projects.filter(hasMedia);
  const projectsWithoutMedia = (projectsData as ProjectsData).projects.filter(project => !hasMedia(project));

  return (
    <section id="projects" ref={sectionRef} className="py-5 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        <h2
          ref={titleRef}
          className="text-4xl md:text-5xl font-bold text-center mb-6 text-gradient-active drop-shadow-white leading-relaxed pb-2"
        >
          Featured Projects
        </h2>
        
        {/* Projects with media - larger cards in 2-column layout */}
        {projectsWithMedia.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {projectsWithMedia.map((project, index) => (
              <div
                key={project.id}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el;
                }}
                className="skill-card bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-lg group"
                onMouseEnter={() => {
                  const card = cardsRef.current[index];
                  if (card) {
                  gsap.to(card, {
                    scale: 1.04,
                    boxShadow: '0 0 32px 0 #39FF14',
                    borderColor: '#39FF14',
                    borderWidth: '2px',
                    duration: 0.35,
                    ease: 'power2.out',
                  });
                  }
                }}
                onMouseLeave={() => {
                  const card = cardsRef.current[index];
                  if (card) {
                  gsap.to(card, {
                    scale: 1,
                    boxShadow: 'none',
                    borderColor: '#3f3f46', // Tailwind gray-700
                    borderWidth: '1px',
                    duration: 0.35,
                    ease: 'power2.out',
                  });
                  }
                }}
              >
                <ProjectCard project={project} index={index} />
              </div>
            ))}
          </div>
        )}

        {/* Projects without media - condensed cards in 3-column layout */}
        {projectsWithoutMedia.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsWithoutMedia.map((project, index) => (
              <div
                key={project.id}
                ref={(el) => {
                  if (el) cardsRef.current[projectsWithMedia.length + index] = el;
                }}
                className="skill-card bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-lg group"
                onMouseEnter={() => {
                  const card = cardsRef.current[projectsWithMedia.length + index];
                  if (card) {
                    gsap.to(card, {
                      scale: 1.04,
                      boxShadow: '0 0 32px 0 #39FF14, 0 0 0 4px #39FF14',
                      borderColor: '#39FF14',
                      duration: 0.35,
                      ease: 'power2.out',
                    });
                  }
                }}
                onMouseLeave={() => {
                  const card = cardsRef.current[projectsWithMedia.length + index];
                  if (card) {
                    gsap.to(card, {
                      scale: 1,
                      boxShadow: 'none',
                      borderColor: '#3f3f46', // Tailwind gray-700
                      duration: 0.35,
                      ease: 'power2.out',
                    });
                  }
                }}
              >
                <ProjectCard project={project} index={projectsWithMedia.length + index} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}