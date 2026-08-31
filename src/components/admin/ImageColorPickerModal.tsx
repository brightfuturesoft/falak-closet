'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Pipette, Check, Sparkles, AlertCircle } from 'lucide-react';
import { getColorNameFromHex } from '@/data/colors';

interface ImageColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSelectColor: (colorName: string, colorHex: string) => void;
}

export function ImageColorPickerModal({
  isOpen,
  onClose,
  imageUrl,
  onSelectColor
}: ImageColorPickerModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sampledHex, setSampledHex] = useState('#9B050B');
  const [sampledName, setSampledName] = useState('Royal Crimson');
  const [hoverHex, setHoverHex] = useState<string | null>(null);
  const [hoverName, setHoverName] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isOpen || !imageUrl) return;
    setIsLoaded(false);
    setLoadError(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      // Set canvas size matching image aspect ratio
      const maxWidth = 700;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setIsLoaded(true);

      // Sample center pixel as initial color
      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      samplePixelAt(centerX, centerY);
    };

    img.onerror = () => {
      setLoadError(true);
    };
  }, [isOpen, imageUrl]);

  const samplePixelAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
      const resolved = getColorNameFromHex(hex);
      return { hex, name: resolved.name };
    } catch {
      return null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

    setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    const result = samplePixelAt(x, y);
    if (result) {
      setHoverHex(result.hex);
      setHoverName(result.name);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

    const result = samplePixelAt(x, y);
    if (result) {
      setSampledHex(result.hex);
      setSampledName(result.name);
    }
  };

  // Browser Native EyeDropper API fallback
  const handleNativeEyedropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          const resolved = getColorNameFromHex(hex);
          setSampledHex(hex);
          setSampledName(resolved.name);
        }
      } catch {}
    }
  };

  const handleConfirmSelection = () => {
    onSelectColor(sampledName, sampledHex);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative text-stone-900 dark:text-stone-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#9B050B]/10 text-[#9B050B] rounded-xl">
              <Pipette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                Image Color Eyedropper
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                Click anywhere on the product photo to pick exact color hex & name
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">

        {/* Canvas & Eyedropper Interactive Area */}
        <div className="relative bg-stone-950 rounded-2xl p-2 flex items-center justify-center min-h-[320px] overflow-hidden border border-stone-800">
          {!isLoaded && !loadError && (
            <div className="text-center space-y-2 text-stone-400">
              <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold">Loading Image to Eyedropper Canvas...</p>
            </div>
          )}

          {loadError && (
            <div className="text-center space-y-2 p-6 text-rose-400 text-xs">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p className="font-bold">Could not load image to canvas due to CORS or broken URL.</p>
              <p className="text-[11px] text-stone-400">You can still use the hex input below or Native EyeDropper.</p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverPos(null)}
            onClick={handleCanvasClick}
            className="max-h-[420px] w-auto max-w-full rounded-xl cursor-crosshair object-contain shadow-lg"
          />

          {/* Floating Hover Color Badge Loupe */}
          {hoverPos && hoverHex && (
            <div
              className="absolute pointer-events-none p-1.5 bg-stone-900/90 text-white rounded-xl shadow-xl border border-stone-700 flex items-center gap-2 text-[10px] font-mono z-20"
              style={{
                left: `${hoverPos.x + 15}px`,
                top: `${hoverPos.y - 35}px`
              }}
            >
              <span className="w-4 h-4 rounded-full border border-white/40 shadow-xs" style={{ backgroundColor: hoverHex }} />
              <div>
                <p className="font-bold">{hoverHex}</p>
                <p className="text-[9px] text-amber-400 truncate max-w-[100px]">{hoverName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Native Browser Eyedropper Button */}
        {typeof window !== 'undefined' && 'EyeDropper' in window && (
          <button
            type="button"
            onClick={handleNativeEyedropper}
            className="w-full py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-stone-300 dark:border-stone-700"
          >
            <Pipette className="w-4 h-4 text-amber-500" />
            <span>Use System Eyedropper Tool (Screen Sample)</span>
          </button>
        )}

        {/* Selected Color Details & Fine-Tuning */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[10px]">
              Sampled Variation Color
            </span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              Auto-Matched Name
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-3 flex-1 w-full">
              {/* Color Swatch Preview */}
              <div
                className="w-12 h-12 rounded-2xl border-2 border-stone-300 dark:border-stone-700 shadow-md shrink-0 transition-colors"
                style={{ backgroundColor: sampledHex }}
              />

              <div className="space-y-1 flex-1">
                <input
                  type="text"
                  value={sampledName}
                  onChange={(e) => setSampledName(e.target.value)}
                  placeholder="Color Name (e.g. Royal Crimson)"
                  className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-xs font-bold text-stone-900 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={sampledHex}
                    onChange={(e) => {
                      const hex = e.target.value.toUpperCase();
                      setSampledHex(hex);
                      setSampledName(getColorNameFromHex(hex).name);
                    }}
                    className="w-6 h-6 rounded cursor-pointer border border-stone-300 dark:border-stone-700"
                  />
                  <input
                    type="text"
                    value={sampledHex}
                    onChange={(e) => {
                      const hex = e.target.value.toUpperCase();
                      setSampledHex(hex);
                      if (hex.length >= 4) {
                        setSampledName(getColorNameFromHex(hex).name);
                      }
                    }}
                    className="w-28 px-2 py-1 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded font-mono text-xs font-bold text-stone-900 dark:text-white uppercase"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmSelection}
              className="w-full sm:w-auto px-6 py-3 bg-[#9B050B] hover:bg-[#B8000A] text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Set Color Variation</span>
            </button>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
