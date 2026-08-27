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
      <div className="relative aspect-[16/9] sm:aspect-[21/9] lg:aspect-[24/9] w-full rounded-3xl overflow-hidden shadow-xl bg-[#0D153A]">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              safeIndex === idx ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={idx === 0}
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-center"
            />
            {/* Gradient Overlay for Text Visibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D153A]/90 via-[#0D153A]/60 to-transparent flex flex-col justify-center px-6 sm:px-12 lg:px-16 space-y-3 sm:space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5C77E]/20 text-[#F5C77E] border border-[#F5C77E]/30 font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-full w-fit">
                <Sparkles className="w-3.5 h-3.5" />
                {slide.tag || 'Special Offer'}
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white max-w-xl leading-tight drop-shadow-sm font-sans">
                {slide.title}
              </h2>
              <p className="text-xs sm:text-base text-stone-200 max-w-md line-clamp-2 drop-shadow-xs font-sans">
                {slide.subtitle}
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Link
                  href={slide.ctaLink}
                  className="inline-flex min-h-[44px] items-center gap-1.5 px-6 py-3 bg-[#A80C14] hover:bg-[#8C0A10] text-white font-extrabold text-xs sm:text-sm rounded-full transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#F5C77E]" />
                  <span>{slide.ctaText}</span>
                </Link>
                
                <Link
                  href="/how-to-order"
                  className="inline-flex min-h-[44px] items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/40 font-extrabold text-xs sm:text-sm rounded-full transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
                >
                  <span className="w-4.5 h-4.5 flex items-center justify-center bg-white text-[#0D153A] rounded-full shrink-0">
                    <svg className="w-2.5 h-2.5 fill-current text-[#0D153A] translate-x-[0.5px]" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <span>How to order</span>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Top-Right Arrow Buttons */}
        <div className="hidden sm:flex absolute top-4 right-4 z-30 items-center gap-2">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-full bg-[#0D153A]/60 hover:bg-[#A80C14] text-white backdrop-blur-xs transition-all cursor-pointer border border-white/20 flex items-center justify-center active:scale-90"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-full bg-[#0D153A]/60 hover:bg-[#A80C14] text-white backdrop-blur-xs transition-all cursor-pointer border border-white/20 flex items-center justify-center active:scale-90"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-30 flex items-center gap-1.5 sm:gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`relative h-2 rounded-full transition-all duration-300 cursor-pointer after:content-[''] after:absolute after:-inset-2.5 ${
                safeIndex === idx ? 'w-7 bg-[#A80C14]' : 'w-2 bg-white/60 hover:bg-white'
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
