'use client';

import React, { useState, useEffect, useCallback, useMemo, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingBag,
  Users,
  Package,
  DollarSign,
  Edit,
  Star,
  Tag,
  Palette,
  Ruler,
  Clock,
  MapPin,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  ShieldCheck,
  Ban,
  Plus,
  Minus,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  Layers,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Product } from '@/data/products';
import { formatCurrency } from '@/lib/utils';
import { useAdminDashboard } from '@/components/admin/AdminDashboardContext';

interface CartUserDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  fullAddress: string;
  ip: string;
  isBlocked: boolean;
  registeredAt: string;
  totalOrders: number;
  totalSpent: number;
  cartItems: Array<{
    selectedColor: string;
    selectedSize: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  totalUserQuantity: number;
  totalUserCartValue: number;
}

interface CartAnalyticsData {
  success: boolean;
  productId: string;
  productName: string;
  stats: {
    totalCartUsers: number;
    totalCartUnits: number;
    totalCartValue: number;
  };
  variantBreakdown: Array<{
    color: string;
    size: string;
    userCount: number;
    totalQuantity: number;
  }>;
  users: CartUserDetail[];
  error?: string;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=600&q=80';

const AVATAR_GRADIENTS = [
  'from-rose-500 to-red-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-fuchsia-500 to-pink-600',
];

export default function AdminProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const admin = useAdminDashboard();

  const [product, setProduct] = useState<Product | null>(null);
  const [cartAnalytics, setCartAnalytics] = useState<CartAnalyticsData | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Pagination state for cart users table
  const [cartSearchQuery, setCartSearchQuery] = useState('');
  const [cartPage, setCartPage] = useState(1);
  const [cartPageSize, setCartPageSize] = useState(5);

  const allCartUsers = cartAnalytics?.users || [];

  const filteredCartUsers = useMemo(() => {
    const q = cartSearchQuery.trim().toLowerCase();
    if (!q) return allCartUsers;
    return allCartUsers.filter((u) => {
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPhone = u.phone.includes(q);
      const matchDistrict = u.district.toLowerCase().includes(q);
      const matchCartOptions = u.cartItems.some(
        (ci) =>
          ci.selectedColor.toLowerCase().includes(q) ||
          ci.selectedSize.toLowerCase().includes(q)
      );
      return matchName || matchEmail || matchPhone || matchDistrict || matchCartOptions;
    });
  }, [allCartUsers, cartSearchQuery]);

  const totalCartPages = Math.max(1, Math.ceil(filteredCartUsers.length / cartPageSize));
  const safeCartPage = Math.min(cartPage, totalCartPages);

  const paginatedCartUsers = useMemo(() => {
    const start = (safeCartPage - 1) * cartPageSize;
    return filteredCartUsers.slice(start, start + cartPageSize);
  }, [filteredCartUsers, safeCartPage, cartPageSize]);

  // Fetch product data
  const fetchProduct = useCallback(async () => {
    setLoadingProduct(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${id}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.product) {
        setProduct(data.product);
      } else {
        setError(data.error || 'Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to fetch product details');
    } finally {
      setLoadingProduct(false);
    }
  }, [id]);

  // Fetch cart analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/admin/products/${id}/cart`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCartAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching cart analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
    fetchAnalytics();
  }, [fetchProduct, fetchAnalytics]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    admin.addToast('info', `Copied ${label} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStockChange = async (newStock: number) => {
    if (!product) return;
    const targetStock = Math.max(0, newStock);
    admin.handleUpdateStock(product.id, targetStock);
    setProduct((prev) => (prev ? { ...prev, stock: targetStock } : prev));
  };

  if (loadingProduct) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#9B050B]" />
        <p className="text-stone-500 font-medium text-sm">Loading product details & cart history...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Product Not Found</h2>
        <p className="text-stone-500 text-sm">{error || "The requested product doesn't exist or was removed."}</p>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Products
        </Link>
      </div>
    );
  }

  const stock = product.stock ?? 0;
  const images = product.images && product.images.length > 0 ? product.images : [FALLBACK_IMAGE];
  const currentImage = images[activeImageIndex] || images[0];

  // Calculate profit margin if buying price is set
  const buyingPrice = product.buyingPrice || 0;
  const profit = buyingPrice > 0 ? product.price - buyingPrice : 0;
  const marginPercentage = buyingPrice > 0 ? ((profit / product.price) * 100).toFixed(1) : null;

  return (
    <div className="space-y-8 text-stone-900">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/products"
              className="p-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-700 transition-colors cursor-pointer"
              title="Back to products list"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
              <Link href="/admin/products" className="hover:text-stone-900">
                Products
              </Link>
              <span>/</span>
              <span className="text-stone-900 font-semibold truncate max-w-[200px]">{product.name}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 flex items-center gap-3">
            {product.name}
            {product.code && (
              <span className="text-xs font-mono px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg border border-stone-200 font-normal">
                SKU: {product.code}
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              fetchProduct();
              fetchAnalytics();
              admin.addToast('info', 'Refreshed product & cart details');
            }}
            className="p-2.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              admin.setEditingProduct(product);
              admin.setIsAddProductOpen(true);
            }}
            className="px-4 py-2.5 bg-[#9B050B] hover:bg-[#800409] text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Product</span>
          </button>
        </div>
      </div>

      {/* Grid Section 1: Product Overview & Stock Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Gallery Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-[3/4] bg-stone-100 rounded-3xl overflow-hidden border border-stone-200 shadow-sm group">
            <Image
              src={currentImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
            {product.category && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-white/95 backdrop-blur-xs text-stone-900 font-bold text-xs rounded-full border border-stone-200 shadow-xs">
                {product.category}
              </span>
            )}
            <span
              className={`absolute top-4 right-4 px-3 py-1 text-xs font-mono font-bold rounded-full border shadow-xs ${stock === 0
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : stock < 5
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-stone-900 text-white border-stone-900'
                }`}
            >
              {stock === 0 ? 'Out of Stock' : stock < 5 ? `Low Stock (${stock})` : `In Stock (${stock})`}
            </span>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${activeImageIndex === idx ? 'border-[#9B050B] ring-2 ring-[#9B050B]/20' : 'border-stone-200 opacity-60 hover:opacity-100'
                    }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Specifications & Financials */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Retail Price</span>
              <p className="font-mono font-black text-xl text-stone-900">{formatCurrency(product.price)}</p>
              {product.originalPrice > product.price && (
                <span className="text-[10px] text-stone-400 line-through font-mono">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Buying Cost</span>
              <p className="font-mono font-bold text-xl text-stone-700">
                {buyingPrice > 0 ? formatCurrency(buyingPrice) : '—'}
              </p>
              {marginPercentage && (
                <span className="text-[10px] text-emerald-600 font-bold">
                  +{marginPercentage}% margin
                </span>
              )}
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Current Stock</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStockChange(stock - 1)}
                  className="p-1 bg-stone-100 hover:bg-stone-200 rounded text-stone-700 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-mono font-black text-xl text-stone-900">{stock}</span>
                <button
                  onClick={() => handleStockChange(stock + 1)}
                  className="p-1 bg-stone-100 hover:bg-stone-200 rounded text-stone-700 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Rating & Reviews</span>
              <p className="font-mono font-bold text-xl text-stone-900 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{product.rating || 5.0}</span>
              </p>
              <span className="text-[10px] text-stone-500 font-medium">
                {product.reviewCount || 0} customer reviews
              </span>
            </div>
          </div>

          {/* Detailed Attributes Card */}
          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wide border-b border-stone-100 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#9B050B]" />
              <span>Product Specifications</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-stone-400 block text-[11px]">Sub Category</span>
                <p className="font-semibold text-stone-800">{product.subCategory || 'N/A'}</p>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px]">Material / Fabric</span>
                <p className="font-semibold text-stone-800">{product.material || 'Nida Silk'}</p>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px]">Work Type</span>
                <p className="font-semibold text-stone-800">{product.workType || 'Embroidery'}</p>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px]">Occasion</span>
                <p className="font-semibold text-stone-800">{product.occasion || 'Casual / Party'}</p>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px]">Weather</span>
                <p className="font-semibold text-stone-800">{product.weather || 'All Season'}</p>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px]">Weight</span>
                <p className="font-semibold text-stone-800">{product.weight ? `${product.weight} kg` : '0.5 kg'}</p>
              </div>
            </div>

            {/* Colors & Sizes Badges */}
            <div className="pt-3 border-t border-stone-100 space-y-3">
              {product.colors && product.colors.length > 0 && (
                <div>
                  <span className="text-stone-400 text-[11px] block mb-1.5 font-medium">Available Colors:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.colors.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-[11px] font-semibold text-stone-800"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <span className="text-stone-400 text-[11px] block mb-1.5 font-medium">Available Sizes:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {product.sizes.map((s, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-stone-900 text-white rounded-lg text-[11px] font-mono font-bold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Variations Matrix (if configured) */}
          {product.variations && product.variations.length > 0 && (
            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wide border-b border-stone-100 pb-3 flex items-center justify-between">
                <span>Color × Size Matrix ({product.variations.length} variations)</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-400 font-mono text-[10px] uppercase">
                      <th className="pb-2 font-medium">Color</th>
                      <th className="pb-2 font-medium">Size</th>
                      <th className="pb-2 font-medium text-right">Stock</th>
                      <th className="pb-2 font-medium text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {product.variations.map((v) => (
                      <tr key={v.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-2.5 pr-2 font-medium flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: v.colorHex || '#000' }}
                          />
                          {v.colorName}
                        </td>
                        <td className="py-2.5 pr-2 font-mono font-semibold text-stone-700">{v.size}</td>
                        <td className="py-2.5 pr-2 text-right font-mono font-bold">
                          <span
                            className={
                              v.stock === 0
                                ? 'text-rose-600 font-black'
                                : v.stock < 5
                                  ? 'text-amber-600 font-bold'
                                  : 'text-stone-900'
                            }
                          >
                            {v.stock} pcs
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono text-stone-900">
                          {v.price ? formatCurrency(v.price) : formatCurrency(product.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CORE FEATURE SECTION: Cart History & Logged-In Users Analytics */}
      <div className="space-y-6 pt-6 border-t border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#9B050B] font-bold text-xs uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4" />
              <span>Live Storefront Demand</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900">
              Users with Item in Cart ({cartAnalytics?.stats.totalCartUsers || 0})
            </h2>
            <p className="text-stone-500 text-xs mt-0.5">
              Logged-in customers who currently have this product saved in their active shopping cart.
            </p>
          </div>
        </div>

        {/* Cart KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {/* Card 1: Interested Users */}
          <div className="p-3.5 sm:p-5 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-200/90 rounded-2xl sm:rounded-3xl space-y-1.5 shadow-xs hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700" />
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800/80">
                Users
              </span>
            </div>
            <p className="font-mono font-black text-lg sm:text-2xl text-amber-950 leading-tight">
              {loadingAnalytics ? '...' : `${cartAnalytics?.stats.totalCartUsers || 0}`}
            </p>
            <p className="text-[10px] sm:text-[11px] text-amber-800/90 font-medium truncate">
              Holding in cart
            </p>
          </div>

          {/* Card 2: Units in Carts */}
          <div className="p-3.5 sm:p-5 bg-gradient-to-br from-sky-500/10 to-sky-500/5 border border-sky-200/90 rounded-2xl sm:rounded-3xl space-y-1.5 shadow-xs hover:border-sky-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-800 shrink-0">
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-700" />
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-sky-800/80">
                Units
              </span>
            </div>
            <p className="font-mono font-black text-lg sm:text-2xl text-sky-950 leading-tight">
              {loadingAnalytics ? '...' : `${cartAnalytics?.stats.totalCartUnits || 0} pcs`}
            </p>
            <p className="text-[10px] sm:text-[11px] text-sky-800/90 font-medium truncate">
              Queued quantity
            </p>
          </div>

          {/* Card 3: Potential Cart Revenue (Full width on mobile grid-cols-2) */}
          <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-emerald-500/10 border border-emerald-200/90 rounded-2xl sm:rounded-3xl space-y-1.5 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
                  ৳
                </span>
                <span className="text-[10px] sm:hidden font-mono font-bold uppercase tracking-wider text-emerald-800/90">
                  Potential Value
                </span>
              </div>
              <span className="hidden sm:block text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800/80">
                Revenue
              </span>
            </div>
            <p className="font-mono font-black text-xl sm:text-2xl text-emerald-950 leading-tight">
              {loadingAnalytics ? '...' : formatCurrency(cartAnalytics?.stats.totalCartValue || 0)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-emerald-800/90 font-medium truncate">
              Potential checkout value
            </p>
          </div>
        </div>

        {/* Variant Demand Breakdown Pills */}
        {cartAnalytics?.variantBreakdown && cartAnalytics.variantBreakdown.length > 0 && (
          <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-2.5 sm:space-y-3">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wide block">
              Demand Breakdown by Color & Size
            </span>
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              {cartAnalytics.variantBreakdown.map((vb, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-xl sm:rounded-2xl flex items-center gap-2 text-xs font-semibold text-stone-900"
                >
                  <span className="font-bold text-[#9B050B]">
                    {vb.color} / {vb.size}
                  </span>
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-700">{vb.userCount} users</span>
                  <span className="px-2 py-0.5 bg-stone-900 text-white rounded-full text-[10px] font-mono font-bold">
                    {vb.totalQuantity} pcs
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Carted Customers List (Responsive Layout: Mobile Cards + Desktop Table with Search & Pagination) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs overflow-hidden space-y-0">
          {/* Header Search & Rows Control Bar */}
          {allCartUsers.length > 0 && (
            <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cartSearchQuery}
                  onChange={(e) => {
                    setCartSearchQuery(e.target.value);
                    setCartPage(1);
                  }}
                  placeholder="Search by name, email, phone, district, or option..."
                  className="w-full pl-10 pr-9 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#9B050B] focus:ring-1 focus:ring-[#9B050B] transition-colors"
                />
                {cartSearchQuery && (
                  <button
                    onClick={() => {
                      setCartSearchQuery('');
                      setCartPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Rows Per Page Picker */}
              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-stone-500 font-medium">
                <span className="text-[11px] font-mono">
                  {filteredCartUsers.length} {filteredCartUsers.length === 1 ? 'user' : 'users'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]">Rows:</span>
                  <select
                    value={cartPageSize}
                    onChange={(e) => {
                      setCartPageSize(Number(e.target.value));
                      setCartPage(1);
                    }}
                    className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#9B050B] cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {loadingAnalytics ? (
            <div className="p-8 sm:p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#9B050B] mx-auto" />
              <p className="text-xs text-stone-500 font-medium">Fetching cart users history...</p>
            </div>
          ) : !cartAnalytics || allCartUsers.length === 0 ? (
            <div className="p-8 sm:p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-stone-900 text-base">No Users Currently Have This Item in Cart</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                When registered customers add this product to their cart, their contact info, selected color/size, and quantity will appear here.
              </p>
            </div>
          ) : filteredCartUsers.length === 0 ? (
            <div className="p-8 sm:p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-stone-900 text-base">No Matching Cart Users</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No users match your search criteria &quot;{cartSearchQuery}&quot;.
              </p>
              <button
                onClick={() => {
                  setCartSearchQuery('');
                  setCartPage(1);
                }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <>
              {/* MOBILE CARDS VIEW (Visible on mobile screens < md) */}
              <div className="block md:hidden divide-y divide-stone-100">
                {paginatedCartUsers.map((user, idx) => {
                  const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                  const isVip = user.totalSpent > 10000 || user.totalOrders >= 2;

                  return (
                    <div key={user.id} className="p-4 space-y-3 bg-white">
                      {/* Top Row: Avatar, Name, Tier Badge & Action */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0`}
                          >
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-stone-900 text-sm truncate">{user.name}</span>
                              {user.isBlocked ? (
                                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[9px] font-bold">
                                  Blocked
                                </span>
                              ) : isVip ? (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded text-[9px] font-bold">
                                  VIP
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded text-[9px] font-bold">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-500 mt-0.5">
                              Orders: {user.totalOrders} ({formatCurrency(user.totalSpent)})
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/admin/customers?query=${encodeURIComponent(user.phone || user.email || user.name)}`}
                          className="p-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl text-stone-700 transition-colors shrink-0"
                          title="Manage User in CRM"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* Contact & Location Strip */}
                      <div className="p-3 bg-stone-50 rounded-xl space-y-1.5 text-xs text-stone-700">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-stone-800 truncate">
                            <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">{user.email || 'No email'}</span>
                          </div>
                          {user.email && (
                            <button
                              onClick={() => handleCopy(user.email, `email-${user.id}`)}
                              className="p-1 text-stone-400 hover:text-stone-700 shrink-0"
                              title="Copy Email"
                            >
                              {copiedId === `email-${user.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-stone-800">
                            <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{user.phone || 'No phone'}</span>
                          </div>
                          {user.phone && (
                            <button
                              onClick={() => handleCopy(user.phone, `phone-${user.id}`)}
                              className="p-1 text-stone-400 hover:text-stone-700 shrink-0"
                              title="Copy Phone"
                            >
                              {copiedId === `phone-${user.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-[10px] text-stone-500">
                          <span className="flex items-center gap-1 font-medium text-stone-800">
                            <MapPin className="w-3 h-3 text-[#9B050B]" />
                            {user.district}
                          </span>
                          <span className="font-mono">{user.ip}</span>
                        </div>
                      </div>

                      {/* Carted Options & Line Value */}
                      <div className="flex items-center justify-between pt-1 gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] text-stone-400 block font-medium">Carted Items:</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {user.cartItems.map((ci, itemIdx) => (
                              <div key={itemIdx} className="flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded text-[10px] font-bold text-stone-800">
                                  {ci.selectedColor}
                                </span>
                                <span className="px-1.5 py-0.5 bg-stone-900 text-white rounded text-[10px] font-mono font-bold">
                                  {ci.selectedSize}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-stone-400 block font-medium">{user.totalUserQuantity} pcs</span>
                          <span className="font-mono font-black text-[#9B050B] text-base">
                            {formatCurrency(user.totalUserCartValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (Visible on desktop screens >= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-400 font-mono text-[10px] uppercase">
                      <th className="py-3.5 pl-6 pr-4 font-semibold">Customer Details</th>
                      <th className="py-3.5 pr-4 font-semibold">Contact Info</th>
                      <th className="py-3.5 pr-4 font-semibold">Location & IP</th>
                      <th className="py-3.5 pr-4 font-semibold">Carted Options</th>
                      <th className="py-3.5 pr-4 font-semibold text-center">Qty</th>
                      <th className="py-3.5 pr-4 font-semibold text-right">Cart Value</th>
                      <th className="py-3.5 pr-6 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {paginatedCartUsers.map((user, idx) => {
                      const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                      const isVip = user.totalSpent > 10000 || user.totalOrders >= 2;

                      return (
                        <tr key={user.id} className="hover:bg-stone-50/80 transition-colors">
                          {/* Customer Profile */}
                          <td className="py-4 pl-6 pr-4 font-medium">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0`}
                              >
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-stone-900">{user.name}</span>
                                  {user.isBlocked ? (
                                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[9px] font-bold">
                                      Blocked
                                    </span>
                                  ) : isVip ? (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded text-[9px] font-bold">
                                      VIP
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded text-[9px] font-bold">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-stone-500 mt-0.5">
                                  Registered: {new Date(user.registeredAt).toLocaleDateString('en-GB')} • Orders: {user.totalOrders} ({formatCurrency(user.totalSpent)})
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="py-4 pr-4 text-stone-700">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-stone-800 font-mono text-[11px]">
                                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                <span className="truncate max-w-[160px]">{user.email || 'No email'}</span>
                                {user.email && (
                                  <button
                                    onClick={() => handleCopy(user.email, `email-${user.id}`)}
                                    className="text-stone-400 hover:text-stone-700 transition-colors"
                                    title="Copy Email"
                                  >
                                    {copiedId === `email-${user.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-stone-800 font-mono text-[11px]">
                                <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                <span>{user.phone || 'No phone'}</span>
                                {user.phone && (
                                  <button
                                    onClick={() => handleCopy(user.phone, `phone-${user.id}`)}
                                    className="text-stone-400 hover:text-stone-700 transition-colors"
                                    title="Copy Phone"
                                  >
                                    {copiedId === `phone-${user.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Address & IP */}
                          <td className="py-4 pr-4 text-stone-700 text-[11px]">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-stone-900 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#9B050B]" />
                                {user.district}
                              </p>
                              <p className="text-[10px] text-stone-500 truncate max-w-[180px]">
                                {user.fullAddress || 'Dhaka, Bangladesh'}
                              </p>
                              <p className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {user.ip}
                              </p>
                            </div>
                          </td>

                          {/* Carted Variations */}
                          <td className="py-4 pr-4">
                            <div className="space-y-1.5">
                              {user.cartItems.map((ci, itemIdx) => (
                                <div key={itemIdx} className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded text-[11px] font-bold text-stone-800">
                                    Color: {ci.selectedColor}
                                  </span>
                                  <span className="px-2 py-0.5 bg-stone-900 text-white rounded text-[11px] font-mono font-bold">
                                    {ci.selectedSize}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Quantity */}
                          <td className="py-4 pr-4 text-center font-mono font-bold text-stone-900 text-sm">
                            {user.totalUserQuantity} pcs
                          </td>

                          {/* Line Value */}
                          <td className="py-4 pr-4 text-right font-mono font-bold text-[#9B050B] text-sm">
                            {formatCurrency(user.totalUserCartValue)}
                          </td>

                          {/* Action */}
                          <td className="py-4 pr-6 text-right">
                            <Link
                              href={`/admin/customers?query=${encodeURIComponent(user.phone || user.email || user.name)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl text-stone-800 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              <span>Manage User</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION FOOTER CONTROLS */}
              {totalCartPages > 1 && (
                <div className="p-4 border-t border-stone-100 bg-stone-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="text-stone-500 font-medium text-center sm:text-left text-[11px]">
                    Showing <span className="font-bold text-stone-900">{(safeCartPage - 1) * cartPageSize + 1}</span> to{' '}
                    <span className="font-bold text-stone-900">
                      {Math.min(safeCartPage * cartPageSize, filteredCartUsers.length)}
                    </span>{' '}
                    of <span className="font-bold text-stone-900">{filteredCartUsers.length}</span> cart users
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCartPage((p) => Math.max(1, p - 1))}
                      disabled={safeCartPage === 1}
                      className="p-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 transition-colors cursor-pointer"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalCartPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setCartPage(pg)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          safeCartPage === pg
                            ? 'bg-[#9B050B] text-white shadow-xs'
                            : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}

                    <button
                      onClick={() => setCartPage((p) => Math.min(totalCartPages, p + 1))}
                      disabled={safeCartPage === totalCartPages}
                      className="p-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 transition-colors cursor-pointer"
                      title="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
