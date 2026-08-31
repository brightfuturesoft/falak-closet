'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, RotateCcw } from 'lucide-react';

interface ProductZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

export function ProductZoomModal({ isOpen, onClose, imageUrl, title }: ProductZoomModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchZoomRef = useRef<number>(100);
  const lastTapRef = useRef<number>(0);

  // Reset zoom & pan when modal opens/closes or image changes, lock body scroll
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(100);
      setPan({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, imageUrl]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(500, prev + 50));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(100, prev - 50);
      if (next === 100) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
    setPan({ x: 0, y: 0 });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setZoomLevel(val);
    if (val === 100) setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((prev) => Math.min(500, prev + 25));
    } else {
      setZoomLevel((prev) => {
        const next = Math.max(100, prev - 25);
        if (next === 100) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 100) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 100) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap to toggle zoom level between 100% and 250%
        if (zoomLevel > 100) {
          handleResetZoom();
        } else {
          setZoomLevel(250);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      if (zoomLevel > 100) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y,
        };
      }
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
      initialPinchZoomRef.current = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && zoomLevel > 100) {
      setPan({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    } else if (e.touches.length === 2 && initialPinchDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / initialPinchDistRef.current;
      const newZoom = Math.min(500, Math.max(100, Math.round(initialPinchZoomRef.current * scale)));
      setZoomLevel(newZoom);
      if (newZoom === 100) setPan({ x: 0, y: 0 });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    initialPinchDistRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md flex items-center justify-center overflow-hidden select-none touch-none">
      {/* Top Right Close Button (✕) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-11 h-11 rounded-full bg-stone-900/80 border border-white/20 text-white flex items-center justify-center hover:bg-stone-800 transition-all cursor-pointer shadow-lg active:scale-90"
        aria-label="Close Fullscreen Zoom"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Main Image Container */}
      <div
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full flex items-center justify-center relative ${
          zoomLevel > 100 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        <div
          style={{
            transform: `scale(${zoomLevel / 100}) translate(${pan.x / (zoomLevel / 100)}px, ${pan.y / (zoomLevel / 100)}px)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
          className="relative w-full h-full max-w-5xl max-h-[85vh] p-2 sm:p-4 flex items-center justify-center"
        >
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="100vw"
            priority
            className="object-contain pointer-events-none"
          />
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-stone-900/90 border border-white/20 rounded-full px-3.5 py-2 flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shadow-2xl backdrop-blur-md max-w-sm mx-auto sm:mx-0">
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 100}
          className="w-8 h-8 rounded-full bg-stone-800 border border-white/10 text-white flex items-center justify-center hover:bg-stone-700 disabled:opacity-30 transition-all cursor-pointer shrink-0 active:scale-90"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4 text-white" />
        </button>

        <input
          type="range"
          min="100"
          max="500"
          step="10"
          value={zoomLevel}
          onChange={handleSliderChange}
          className="w-20 sm:w-32 accent-[#A80C14] cursor-pointer"
          aria-label="Zoom Percentage Slider"
        />

        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 500}
          className="w-8 h-8 rounded-full bg-stone-800 border border-white/10 text-white flex items-center justify-center hover:bg-stone-700 disabled:opacity-30 transition-all cursor-pointer shrink-0 active:scale-90"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>

        <button
          onClick={handleResetZoom}
          title="Reset Zoom"
          className="px-2 py-1 bg-stone-800 hover:bg-stone-700 border border-white/10 rounded-full text-white font-mono text-[11px] font-bold transition-all cursor-pointer shrink-0 active:scale-90 flex items-center gap-1"
        >
          <span>{zoomLevel}%</span>
          {zoomLevel > 100 && <RotateCcw className="w-3 h-3 text-[#F5C77E]" />}
        </button>
      </div>
    </div>
  );
}
