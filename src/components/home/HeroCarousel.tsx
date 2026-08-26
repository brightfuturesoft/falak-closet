'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { HeroSlideView } from '@/lib/heroSlides';

interface HeroCarouselProps {
  /** Active slides, fetched server-side (see src/lib/heroSlides.ts). */
  slides: HeroSlideView[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Autoplay pauses on hover/focus so a reader can dwell on a slide.
  useEffect(() => {
    if (isPaused || slides.length < 2) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  if (slides.length === 0) return null;

  const safeIndex = Math.min(currentSlide, slides.length - 1);
  const handleNext = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const handlePrev = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-4 sm:my-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[320px] sm:h-[400px] lg:h-[440px] rounded-3xl overflow-hidden shadow-md">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === safeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image */}
            <div className="relative w-full h-full bg-[#0C163A]">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={idx === 0}
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover object-right sm:object-center opacity-90"
              />

              {/* Navy to Crimson Rich Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0C163A] via-[#0C163A]/90 to-[#9B050B]/40 sm:to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C163A]/80 via-transparent to-transparent" />
            </div>

            {/* Banner Text Overlay */}
            <div className="absolute inset-0 p-6 sm:p-12 flex flex-col justify-center max-w-xl text-white space-y-3 sm:space-y-4 z-20">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F2C76E]">
                {slide.tag}
              </span>

              <h1 className="font-sans text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-xs">
                {slide.title}
              </h1>

              <p className="text-stone-200 text-xs sm:text-base leading-relaxed drop-shadow-xs max-w-md">
                {slide.subtitle}
              </p>

              <div className="pt-2">
                <Link
                  href={slide.ctaLink}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#F2C76E] hover:bg-[#E5B550] text-[#0C163A] font-extrabold text-xs sm:text-sm rounded-full transition-all shadow-md hover:scale-105"
                >
                  <Sparkles className="w-4 h-4 text-[#9B050B]" />
                  <span>{slide.ctaText}</span>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Top-Right Arrow Buttons */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg bg-[#0C163A]/60 hover:bg-[#0C163A] text-[#F2C76E] backdrop-blur-xs transition-all cursor-pointer border border-[#F2C76E]/30"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-lg bg-[#0C163A]/60 hover:bg-[#0C163A] text-[#F2C76E] backdrop-blur-xs transition-all cursor-pointer border border-[#F2C76E]/30"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom-Right Pagination Dots */}
        <div className="absolute bottom-4 right-6 z-30 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                safeIndex === idx ? 'w-6 bg-[#F2C76E]' : 'w-2 bg-white/60 hover:bg-white'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
