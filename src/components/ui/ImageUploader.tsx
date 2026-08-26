'use client';

import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadImages } from '@/lib/cloudinary';

interface ImageUploaderProps {
  /** Storage area under `falak-closet/`, e.g. 'products', 'banners'. */
  folder: string;
  multiple?: boolean;
  accept?: string;
  onUploaded: (results: { url: string; publicId: string }[]) => void;
  label?: string;
  maxSizeMb?: number;
  onError?: (message: string) => void;
  className?: string;
}

/**
 * Reusable Cloudinary upload button. Controlled by design — the parent owns
 * the URL list; this component only handles the picking + uploading states.
 */
export function ImageUploader({
  folder,
  multiple = false,
  accept = 'image/*',
  onUploaded,
  label = 'Upload Image',
  maxSizeMb = 5,
  onError,
  className = '',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const list = Array.from(files);
    const badType = list.find((f) => !f.type.startsWith('image/'));
    const tooBig = list.find((f) => f.size > maxSizeMb * 1024 * 1024);

    if (badType) {
      const msg = `"${badType.name}" is not an image.`;
      setError(msg);
      onError?.(msg);
      return;
    }
    if (tooBig) {
      const msg = `"${tooBig.name}" exceeds the ${maxSizeMb} MB limit.`;
      setError(msg);
      onError?.(msg);
      return;
    }

    setError(null);
    setBusy(true);
    setProgress({ done: 0, total: list.length });

    try {
      const results = await uploadImages(list, folder, (done, total) =>
        setProgress({ done, total })
      );
      onUploaded(results);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setError(msg);
      onError?.(msg);
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="px-3.5 py-2.5 bg-white hover:bg-stone-50 text-stone-900 border border-dashed border-stone-400 hover:border-stone-900 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
      >
        {busy ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
            <span>
              Uploading{progress ? ` ${progress.done}/${progress.total}` : '…'}
            </span>
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5 text-[#9B050B]" />
            <span>{label}</span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {error && (
        <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
          <X className="w-3 h-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
