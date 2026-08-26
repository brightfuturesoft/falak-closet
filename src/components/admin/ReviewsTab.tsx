'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  RefreshCw,
  Check,
  Trash2,
  AlertTriangle,
  X,
  MessageSquareQuote,
  RotateCcw
} from 'lucide-react';

interface AdminReview {
  productId: string;
  productName: string;
  productSlug: string;
  review: {
    id: string;
    author: string;
    rating: number;
    date: string;
    comment: string;
    verifiedPurchase: boolean;
    status: string;
  };
}

type StatusFilter = 'pending' | 'approved' | 'all';

export function ReviewsTab() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Delete confirm state
  const [deleting, setDeleting] = useState<AdminReview | null>(null);

  const fetchReviews = useCallback(async (status: StatusFilter) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/reviews?status=${status}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
      } else {
        setLoadError(data.error || 'Failed to load reviews.');
      }
    } catch {
      setLoadError('Network error — could not reach /api/reviews.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(filter);
  }, [filter, fetchReviews]);

  const keyOf = (r: AdminReview) => `${r.productId}:${r.review.id}`;

  const handleStatus = async (r: AdminReview, status: 'approved' | 'pending') => {
    const key = keyOf(r);
    setBusyKey(key);
    setActionError(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: r.productId, reviewId: r.review.id, status }),
      });
      const data = await res.json();
      if (!data.success) {
        setActionError(data.error || 'Could not update the review.');
        return;
      }
      // Refetch keeps counts/filters honest without hand-merging.
      await fetchReviews(filter);
    } catch {
      setActionError('Network error — could not update the review.');
    } finally {
      setBusyKey(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const r = deleting;
    setBusyKey(keyOf(r));
    setActionError(null);
    try {
      const res = await fetch(
        `/api/reviews?productId=${r.productId}&reviewId=${encodeURIComponent(r.review.id)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!data.success) {
        setActionError(data.error || 'Could not delete the review.');
        return;
      }
      await fetchReviews(filter);
    } catch {
      setActionError('Network error — could not delete the review.');
    } finally {
      setBusyKey(null);
      setDeleting(null);
    }
  };

  const pendingCount = reviews.filter((r) => r.review.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-50 border border-pink-100 rounded-2xl">
            <MessageSquareQuote className="w-6 h-6 text-[#D92670]" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-stone-900">Customer Reviews</h2>
            <p className="text-xs text-stone-500">
              {filter === 'pending'
                ? `${reviews.length} awaiting approval`
                : `${reviews.length} shown${pendingCount > 0 ? ` · ${pendingCount} pending` : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchReviews(filter)}
            className="p-2.5 bg-white border border-stone-200 hover:border-stone-400 rounded-xl transition-colors cursor-pointer"
            title="Refresh reviews"
          >
            <RefreshCw className={`w-4 h-4 text-stone-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Filter chips */}
          <div className="flex bg-white border border-stone-200 rounded-xl p-1 gap-1">
            {(['pending', 'approved', 'all'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-colors cursor-pointer ${
                  filter === f ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {actionError}
          </span>
          <button onClick={() => setActionError(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-stone-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <div className="p-6 bg-white rounded-3xl border border-rose-200 text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-stone-900">Could not load reviews</p>
          <p className="text-xs text-stone-500">{loadError}</p>
          <button
            onClick={() => fetchReviews(filter)}
            className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-8 bg-white rounded-3xl border border-dashed border-stone-300 text-center space-y-2">
          <Star className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-sm font-bold text-stone-900">
            {filter === 'pending' ? 'No reviews waiting for approval' : 'No reviews here'}
          </p>
          <p className="text-xs text-stone-500">
            {filter === 'pending'
              ? 'New customer submissions will appear in this queue.'
              : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const busy = busyKey === keyOf(r);
            const isPending = r.review.status === 'pending';
            return (
              <div
                key={keyOf(r)}
                className={`bg-white rounded-3xl border p-5 shadow-xs space-y-3 ${
                  isPending ? 'border-amber-200' : 'border-stone-200'
                } ${busy ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                        isPending
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {r.review.status}
                    </span>
                    <span className="font-bold text-sm text-stone-900">{r.review.author}</span>
                    <span className="text-[10px] text-stone-400">on</span>
                    <span className="text-xs font-bold text-[#D92670] truncate max-w-[220px]">
                      {r.productName}
                    </span>
                    {r.review.verifiedPurchase && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold rounded">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(r.review.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">{r.review.date}</span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 italic leading-relaxed">“{r.review.comment}”</p>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-100">
                  {isPending ? (
                    <button
                      onClick={() => handleStatus(r, 'approved')}
                      disabled={busy}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatus(r, 'pending')}
                      disabled={busy}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      title="Move back to pending"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Unpublish
                    </button>
                  )}
                  <button
                    onClick={() => setDeleting(r)}
                    disabled={busy}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl w-fit">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900">Delete this review?</h3>
              <p className="text-xs text-stone-500 mt-1">
                “{deleting.review.comment.slice(0, 90)}
                {deleting.review.comment.length > 90 ? '…' : ''}” — by {deleting.review.author}. The
                product's rating is recalculated afterwards.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
