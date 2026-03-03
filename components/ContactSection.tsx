'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, Linkedin, Github, Phone } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Matrix-styled title animation (same as SkillsShowcase titleRef)
    if (titleRef.current) {
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    // Content animation
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    // Gentle floating animation for title header
    if (titleRef.current) {
      gsap.to(titleRef.current, {
        y: -5,
        duration: 4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.7,
      });
    }
  }, [mounted]);

  const contactItems = [
    {
      icon: Mail,
      label: 'Email',
      value: 'walter@pollardjr.com',
      href: 'mailto:walter@pollardjr.com',
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      value: 'linkedin.com/in/walterpollardjr',
      href: 'www.linkedin.com/in/walterpollardjr',
    },
    {
      icon: Github,
      label: 'GitHub',
      value: 'github.com/noorotic',
      href: 'https://github.com/noorotic',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '+1 (484) 297-2112',
      href: 'tel:+14842972112',
    },
  ];

  return (
    <section id="contact" ref={sectionRef} className="py-5 px-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        <h2
          ref={titleRef}
          className="text-3xl md:text-4xl font-bold text-center mb-8 text-gradient-active drop-shadow-white"
        >
          Let&apos;s Build Something Amazing
        </h2>

        <div ref={contentRef} className="text-center">

          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            With experiences from e-Learning to world-class video streaming, <br />I&apos;m excited to see where the future of digital experiences take us.<br />Let&apos;s discuss how we can
            work together to create exceptional digital experiences.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            {contactItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="bg-black/40 backdrop-blur-sm border border-gray-700/50 hover:border-[#39FF14]/30 rounded-lg p-6 flex items-center gap-4 hover:scale-105 transition-all duration-300 hover:bg-black/60"
              >
                <div className="p-3 bg-[#39FF14]/20 rounded-full">
                  <item.icon className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-400">{item.label}</div>
                  <div className="text-white font-medium">{item.value}</div>
                </div>
              </a>
            ))}
          </div>

          <div className="space-y-4">
            <p className="text-gray-400">
              Available for freelance projects and full-time opportunities
            </p>
            <div className="flex justify-center gap-4">
              <span className="px-4 py-2 bg-[#39FF14]/20 text-[#39FF14] rounded-full text-sm">
                Remote Work
              </span>
              <span className="px-4 py-2 bg-[#39FF14]/20 text-[#39FF14] rounded-full text-sm">
                Contract
              </span>
              <span className="px-4 py-2 bg-[#39FF14]/20 text-[#39FF14] rounded-full text-sm">
                Full-time
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}