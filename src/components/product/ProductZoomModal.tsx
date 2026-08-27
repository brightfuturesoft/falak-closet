'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Plus, Minus } from 'lucide-react';

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

  // Reset zoom & pan when modal opens/closes or image changes
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(100);
      setPan({ x: 0, y: 0 });
    }
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

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center overflow-hidden select-none">
      {/* Top Right Close Button (✕) */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-50 w-10 h-10 rounded-full bg-stone-900/80 border border-white/20 text-white flex items-center justify-center hover:bg-stone-800 transition-all cursor-pointer shadow-lg"
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
        className={`w-full h-full flex items-center justify-center relative ${
          zoomLevel > 100 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        <div
          style={{
            transform: `scale(${zoomLevel / 100}) translate(${pan.x / (zoomLevel / 100)}px, ${pan.y / (zoomLevel / 100)}px)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
          className="relative w-full h-full max-w-5xl max-h-[85vh] p-4 flex items-center justify-center"
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

      {/* Bottom Left Floating (+) and (-) Stacked Circle Buttons */}
      <div className="absolute bottom-6 left-6 z-50 flex flex-col gap-2.5">
        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 500}
          className="w-10 h-10 rounded-full bg-stone-900/80 border border-white/20 text-white flex items-center justify-center hover:bg-stone-800 disabled:opacity-40 transition-all cursor-pointer shadow-lg"
          aria-label="Zoom In"
          title="Zoom In (+)"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 100}
          className="w-10 h-10 rounded-full bg-stone-900/80 border border-white/20 text-white flex items-center justify-center hover:bg-stone-800 disabled:opacity-40 transition-all cursor-pointer shadow-lg"
          aria-label="Zoom Out"
          title="Zoom Out (-)"
        >
          <Minus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Bottom Right Floating Percentage Slider Pill */}
      <div className="absolute bottom-6 right-6 z-50 bg-stone-900/90 border border-white/20 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl backdrop-blur-md">
        <span className="text-white font-mono text-xs font-bold w-10 text-right">
          {zoomLevel}%
        </span>
        <input
          type="range"
          min="100"
          max="500"
          step="10"
          value={zoomLevel}
          onChange={handleSliderChange}
          className="w-28 sm:w-36 accent-[#A80C14] cursor-pointer"
          aria-label="Zoom Percentage Slider"
        />
      </div>
    </div>
  );
}
