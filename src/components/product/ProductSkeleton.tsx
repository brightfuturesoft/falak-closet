import React from 'react';

export default function ProductSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 md:py-12">
      {/* Breadcrumb Skeleton */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-stone-500 mb-6 sm:mb-8 md:mb-10">
        <div className="w-10 h-3 bg-stone-200 animate-pulse rounded-md" />
        <span className="text-stone-300">/</span>
        <div className="w-12 h-3 bg-stone-200 animate-pulse rounded-md" />
        <span className="text-stone-300">/</span>
        <div className="w-16 h-3 bg-stone-200 animate-pulse rounded-md" />
        <span className="text-stone-300">/</span>
        <div className="w-24 h-3 bg-stone-200 animate-pulse rounded-md" />
      </nav>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
        {/* Left: Gallery (Thumbnails & Main Image) */}
        <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-3 lg:gap-4">
          {/* Thumbnail Strip */}
          <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 w-full lg:w-20 flex-shrink-0">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-[68px] h-[84px] sm:w-20 sm:h-24 rounded-2xl bg-stone-200/80 animate-pulse border border-stone-100 flex-shrink-0"
              />
            ))}
          </div>

          {/* Main Display Image */}
          <div className="relative aspect-[4/5] w-full sm:aspect-[3/4] rounded-3xl bg-stone-200 animate-pulse border border-pink-50/30 flex-grow shadow-sm" />
        </div>

        {/* Right: Details & Purchase Form */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-7">
          {/* Header Info */}
          <div className="space-y-3">
            {/* Category / Code Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-20 h-5 rounded-full bg-pink-100/60 animate-pulse" />
              <div className="w-24 h-5 rounded-md bg-stone-200 animate-pulse" />
            </div>

            {/* Title */}
            <div className="h-8 sm:h-10 bg-stone-200 animate-pulse rounded-xl w-5/6" />
            <div className="h-8 sm:h-10 bg-stone-200 animate-pulse rounded-xl w-3/5" />

            {/* Stars */}
            <div className="flex items-center space-x-2 pt-1">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-4 h-4 bg-stone-200 animate-pulse rounded-md" />
                ))}
              </div>
              <div className="w-16 h-4 bg-stone-200 animate-pulse rounded-md" />
            </div>
          </div>

          {/* Pricing Info */}
          <div className="pt-2 pb-1 border-y border-stone-200/40 space-y-2">
            <div className="h-7 bg-stone-200 animate-pulse rounded-lg w-1/3" />
            <div className="h-4 bg-stone-200 animate-pulse rounded-md w-1/2" />
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <div className="h-4 bg-stone-200 animate-pulse rounded-md w-1/4" />
            <div className="flex gap-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-stone-200 animate-pulse border border-stone-100" />
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center w-5/6">
              <div className="h-4 bg-stone-200 animate-pulse rounded-md w-1/4" />
              <div className="h-3.5 bg-stone-200 animate-pulse rounded-md w-1/5" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-12 h-10 rounded-xl bg-stone-200 animate-pulse border border-stone-100" />
              ))}
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div className="flex items-center gap-3 pt-2">
            {/* Quantity */}
            <div className="w-24 h-12 rounded-2xl bg-stone-200 animate-pulse" />
            {/* Buy Buttons */}
            <div className="flex-1 h-12 rounded-2xl bg-stone-200 animate-pulse" />
          </div>
          <div className="h-12 bg-pink-100/50 animate-pulse rounded-2xl w-full" />

          {/* Description Snippet */}
          <div className="space-y-2 pt-4">
            <div className="h-4 bg-stone-200 animate-pulse rounded-md w-1/3" />
            <div className="space-y-1.5 pt-1">
              <div className="h-3.5 bg-stone-200 animate-pulse rounded-md w-full" />
              <div className="h-3.5 bg-stone-200 animate-pulse rounded-md w-11/12" />
              <div className="h-3.5 bg-stone-200 animate-pulse rounded-md w-4/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
