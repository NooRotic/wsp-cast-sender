'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import skillsData from '@/data/skills.json';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface Skill {
  name: string;
  level: number;
  years: number;
}

interface SkillCategory {
  category: string;
  items: Skill[];
}

export default function SkillsShowcase() {
  const skillsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const cards = cardsRef.current.filter(Boolean);

    // Title animation
    if (titleRef.current) {
      gsap.fromTo(titleRef.current,
        { text: '', opacity: 0, y: 20 },
        {
          text: 'Technical Expertise',
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    // Cards staggered animation
    if (cards.length > 0) {
      gsap.fromTo(cards,
        { opacity: 0, scale: 0.2, transformOrigin: "center" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          transformOrigin: "center",
          delay: 0.5,
          duration: 0.7,
          ease: 'power2.inOut',
          stagger: 1.4, // Increased stagger for smoother animation
          scrollTrigger: {
            trigger: skillsRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Skill bars animation
      cards.forEach((card) => {
        if (!card) return;
        const skillBars = card.querySelectorAll('.skill-bar');

        gsap.fromTo(skillBars,
          { width: 0 },
          {
            width: (i, target) => `${target.dataset.level}%`,
            duration: 1.4,
            ease: 'power2.out',
            stagger: 0.6,
            delay: 0.4,
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }

    // Gentle floating animation for title header
    if (titleRef.current) {
      gsap.to(titleRef.current, {
        y: -2,
        duration: 4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.3,
      });
    }

  }, [mounted]);

  const renderCompactSkillCard = (category: SkillCategory, index: number) => {
    return (
      <div
        key={category.category}
        ref={(el) => {
          if (el) cardsRef.current[index] = el;
        }}
        className="skill-card bg-black/40 backdrop-blur-sm border border-gray-700/50 hover:border-[#39FF14]/30 rounded-lg p-4 transition-all duration-300 hover:bg-black/60 group"
      >
        <h3 className="text-sm font-semibold text-[#39FF14] mb-3 group-hover:text-[#39FF14] transition-colors">
          {category.category}
        </h3>

        <div className="space-y-2">
          {category.items.map((skill: Skill) => (
            <div key={skill.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300 font-medium truncate pr-2">{skill.name}</span>
                <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                  <span>{skill.level}%</span>
                  <span className="text-gray-600">•</span>
                  <span>{skill.years}y</span>
                </div>
              </div>

              <div className="w-full bg-gray-800/60 rounded-full h-1.5 relative">
                <div
                  className="skill-bar h-1.5 rounded-full bg-gradient-to-r from-[#39FF14]/80 to-[#2ed60a]/80"
                  data-level={skill.level}
                  style={{
                    background: skill.years 
                      ? `linear-gradient(to right, 
                          #39FF14 0%, 
                          #39FF14 25%, 
                          #2ed60a ${Math.max(25, 70 - (skill.years / 25) * 30)}%, 
                          #ff6b35 ${Math.max(50, 85 - (skill.years / 25) * 25)}%, 
                          #ff4444 100%)`
                      : undefined
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section id="skills" className="py-6 px-4 relative z-10">
      <div className="max-w-full mx-auto">
        <h2
          ref={titleRef}
          className="text-3xl md:text-4xl font-bold text-center mb-6 text-gradient-active drop-shadow-white"
        >
          Technical Expertise
        </h2>

        {/* Multi-Column Responsive Grid */}
        <div
          ref={skillsRef}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 justify-center max-w-full mx-auto"
        >
          {skillsData.skills.map((category: SkillCategory, index: number) =>
            renderCompactSkillCard(category, index)
          )}
        </div>

        {/* Professional Summary Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-black/30 backdrop-blur-sm border border-gray-700/30 rounded-lg p-3">
            <div className="text-lg font-bold text-[#39FF14]">25+</div>
            <div className="text-xs text-gray-400">Years</div>
          </div>
          <div className="bg-black/30 backdrop-blur-sm border border-gray-700/30 rounded-lg p-3">
            <div className="text-lg font-bold text-[#39FF14]">20+</div>
            <div className="text-xs text-gray-400">Technologies</div>
          </div>
          <div className="bg-black/30 backdrop-blur-sm border border-gray-700/30 rounded-lg p-3">
            <div className="text-lg font-bold text-[#39FF14]">Over 50+</div>
            <div className="text-xs text-gray-400">Projects</div>
          </div>
          <div className="bg-black/30 backdrop-blur-sm border border-gray-700/30 rounded-lg p-3">
            <div className="text-lg font-bold text-[#39FF14]">Millions+</div>
            <div className="text-xs text-gray-400">Users</div>
          </div>
        </div>
      </div>
    </section>
  );
}