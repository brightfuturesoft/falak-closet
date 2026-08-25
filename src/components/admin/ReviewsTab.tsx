'use client';

import React, { useState, useEffect } from 'react';
import { Star, Trash2, Search, Sparkles, HelpCircle, MessageSquare } from 'lucide-react';
import { getReviews, deleteReview } from '@/actions/reviewActions';

interface ReviewRecord {
  id: string;
  productId: string;
  rating: number;
  comment: string;
  author: string;
  verifiedPurchase: boolean;
  orderId?: string;
  createdAt: string;
}

export function ReviewsTab({ addToast }: { addToast: (type: 'success' | 'error', msg: string) => void }) {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<number | 'All'>('All');

  // Load reviews on mount
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await getReviews();
      if (res.success && res.reviews) {
        setReviews(res.reviews as any[]);
      } else {
        addToast('error', res.error || 'Failed to fetch reviews');
      }
    } catch (e: any) {
      addToast('error', e.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await deleteReview(id);
      if (res.success) {
        addToast('success', 'Review deleted successfully!');
        fetchReviews();
      } else {
        addToast('error', res.error || 'Failed to delete review');
      }
    } catch (e: any) {
      addToast('error', e.message || 'An error occurred');
    }
  };

  // Filter logic
  const filtered = reviews.filter(rev => {
    const matchesSearch = 
      rev.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.productId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRating = filterRating === 'All' || rev.rating === filterRating;
    return matchesSearch && matchesRating;
  });

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : '0';

  return (
    <div className="space-y-6 text-[#0C163A]">
      {/* Header Cards / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-pink-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-stone-400">Total Reviews</span>
            <h3 className="text-2xl font-black text-stone-900">{reviews.length}</h3>
          </div>
          <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-[#D92670]">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-pink-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-stone-400">Average Rating</span>
            <h3 className="text-2xl font-black text-stone-900 flex items-center gap-1.5">
              <span>{avgRating}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-pink-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-stone-400">Verified Purchases</span>
            <h3 className="text-2xl font-black text-stone-900">
              {reviews.filter(r => r.verifiedPurchase).length}
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-3xl border border-pink-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search author, comment, product..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-[#D92670]"
          />
        </div>

        {/* Rating filter */}
        <div className="flex items-center gap-2 self-end md:self-auto text-xs">
          <span className="text-stone-500 font-bold">Filter Rating:</span>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value === 'All' ? 'All' : Number(e.target.value))}
            className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#D92670]"
          >
            <option value="All">All Stars</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Main Reviews Table */}
      <div className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-stone-400">
            Fetching dynamic database reviews...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white p-8">
            <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mx-auto text-[#D92670]">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm">No reviews found</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No matching feedback reviews exist in the database collections.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-pink-100 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                  <th className="p-4">Author</th>
                  <th className="p-4">Product ID</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Comment</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {filtered.map((rev) => (
                  <tr key={rev.id} className="hover:bg-pink-50/20 transition-colors">
                    <td className="p-4 font-bold text-stone-900">
                      <div className="space-y-0.5">
                        <p>{rev.author}</p>
                        {rev.verifiedPurchase && (
                          <span className="inline-flex text-[9px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 px-1.5 py-0.2 rounded-full">
                            Verified Buyer
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-medium text-stone-500">{rev.productId}</td>
                    <td className="p-4">
                      <div className="flex text-amber-400 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-4 max-w-xs text-stone-600 truncate" title={rev.comment}>
                      {rev.comment}
                    </td>
                    <td className="p-4 text-stone-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(rev.id)}
                        className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors border border-rose-100 cursor-pointer inline-flex items-center gap-1 font-bold text-[10px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
