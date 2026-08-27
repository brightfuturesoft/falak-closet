'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { HeroSlideView } from '@/lib/heroSlides';

interface HeroCarouselProps {
  /** Active slides, fetched server-side (see src/lib/heroSlides.ts). */
  slides: HeroSlideView[];
}

/** Horizontal px a swipe must travel before it counts as prev/next. */
const SWIPE_THRESHOLD = 48;

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Autoplay pauses on hover/focus/touch so a reader can dwell on a slide.
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
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
        setIsPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current != null) {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > SWIPE_THRESHOLD) {
            if (dx < 0) handleNext();
            else handlePrev();
          }
        }
        touchStartX.current = null;
        // Give the reader a beat before autoplay resumes.
        setTimeout(() => setIsPaused(false), 4000);
      }}
    >
      <div className="relative h-[340px] sm:h-[420px] lg:h-[480px] rounded-3xl overflow-hidden shadow-md bg-[#0C163A]">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === safeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${idx + 1} of ${slides.length}`}
            aria-hidden={idx !== safeIndex}
          >
            {/* Background Image */}
            <div className="relative w-full h-full bg-[#0C163A]">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={idx === 0}
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover object-[70%_center] sm:object-center opacity-90"
              />

              {/* Navy to Crimson Rich Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0C163A] via-[#0C163A]/90 to-[#9B050B]/40 sm:to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C163A]/80 via-transparent to-transparent" />
            </div>

            {/* Banner Text Overlay */}
            <div className="absolute inset-0 p-5 sm:p-12 flex flex-col justify-center max-w-xl text-white space-y-2.5 sm:space-y-4 z-20">
              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.2em] sm:tracking-widest text-[#F2C76E]">
                {slide.tag}
              </span>

              <h1 className="font-sans text-[26px] sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.12] sm:leading-tight drop-shadow-xs line-clamp-2">
                {slide.title}
              </h1>

              <p className="text-stone-200 text-xs sm:text-base leading-relaxed drop-shadow-xs max-w-md line-clamp-2 sm:line-clamp-none">
                {slide.subtitle}
              </p>

              <div className="pt-1.5 sm:pt-2">
                <Link
                  href={slide.ctaLink}
                  className="inline-flex min-h-[44px] items-center gap-2 px-6 py-3 bg-[#F2C76E] hover:bg-[#E5B550] text-[#0C163A] font-extrabold text-xs sm:text-sm rounded-full transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#9B050B]" />
                  <span>{slide.ctaText}</span>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Top-Right Arrow Buttons — desktop pointers only (mobile swipes) */}
        <div className="hidden sm:flex absolute top-4 right-4 z-30 items-center gap-2">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-full bg-[#0C163A]/60 hover:bg-[#0C163A] text-[#F2C76E] backdrop-blur-xs transition-all cursor-pointer border border-[#F2C76E]/30 flex items-center justify-center active:scale-90"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-full bg-[#0C163A]/60 hover:bg-[#0C163A] text-[#F2C76E] backdrop-blur-xs transition-all cursor-pointer border border-[#F2C76E]/30 flex items-center justify-center active:scale-90"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Pagination Dots — centered under the thumb arc on mobile, right on sm+ */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-30 flex items-center gap-1.5 sm:gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`relative h-2 rounded-full transition-all duration-300 cursor-pointer after:content-[''] after:absolute after:-inset-2.5 ${
                safeIndex === idx ? 'w-7 bg-[#F2C76E]' : 'w-2 bg-white/60 hover:bg-white'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
              aria-current={safeIndex === idx}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
