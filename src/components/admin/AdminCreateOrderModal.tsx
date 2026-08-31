'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  Truck,
  CreditCard,
  Tag,
  CheckCircle2,
  Search,
  Printer,
  Sparkles,
  Zap,
  Check,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/data/products';
import { CartItem, OrderRecord } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

interface AdminCreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: OrderRecord) => void;
  productsList?: Product[];
}

export function AdminCreateOrderModal({
  isOpen,
  onClose,
  onOrderCreated,
  productsList = []
}: AdminCreateOrderModalProps) {
  // Mobile Tab State ('catalog' | 'ticket')
  const [mobileTab, setMobileTab] = useState<'catalog' | 'ticket'>('catalog');

  // POS Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Customer Details State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDistrict, setCustomerDistrict] = useState('Dhaka');
  const [customerAddress, setCustomerAddress] = useState('');

  // Selected Product Variation Modal State
  const [activeProductForVariation, setActiveProductForVariation] = useState<Product | null>(null);
  const [varColor, setVarColor] = useState<string>('');
  const [varSize, setVarSize] = useState<string>('');

  // Order Items Ticket State
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);

  // Financials & Settings
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [customDiscountInput, setCustomDiscountInput] = useState<string>('');
  const [isCustomDiscount, setIsCustomDiscount] = useState<boolean>(false);
  const [shippingFee, setShippingFee] = useState<number>(120);
  const [deliveryMethod, setDeliveryMethod] = useState('Standard Express (2-3 Days)');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery (COD)');
  const [orderStatus, setOrderStatus] = useState<OrderRecord['status']>('Processing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Extract color name helper
  const getColorName = (c: any): string => {
    if (typeof c === 'string') return c;
    if (c && typeof c === 'object' && c.name) return c.name;
    return 'Default';
  };

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      setMobileTab('catalog');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter products by category and search query
  const categories = ['All', ...Array.from(new Set(productsList.map((p) => p.category).filter(Boolean)))];
  const filteredProducts = productsList.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCode = (p.code || '').toLowerCase().includes(q);
      const matchMat = (p.material || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchMat) return false;
    }
    return true;
  });

  // Open variation picker for a product card
  const handleOpenVariationPicker = (product: Product) => {
    setActiveProductForVariation(product);
    if (product.colors && product.colors.length > 0) {
      setVarColor(getColorName(product.colors[0]));
    } else {
      setVarColor('Default');
    }
    if (product.sizes && product.sizes.length > 0) {
      setVarSize(product.sizes[0]);
    } else {
      setVarSize('Free Size');
    }
  };

  // Add product item to POS Ticket
  const handleAddProductToTicket = (product: Product, color: string, size: string) => {
    const newItem: CartItem = {
      product,
      selectedColor: color || 'Default',
      selectedSize: size || 'Free Size',
      quantity: 1
    };

    setOrderItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.product.id === newItem.product.id &&
          i.selectedColor === newItem.selectedColor &&
          i.selectedSize === newItem.selectedSize
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [newItem, ...prev];
    });

    setActiveProductForVariation(null);
  };

  const handleUpdateQuantity = (idx: number, delta: number) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      const newQty = updated[idx].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== idx);
      }
      updated[idx].quantity = newQty;
      return updated;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const totalItemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleSubmitPOSOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert('Please select at least one product item for the POS ticket.');
      setMobileTab('catalog');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Customer Name and Phone Number are required for POS ticket.');
      setMobileTab('ticket');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderId = `FLK-POS-${randomNum}`;
    const trackingNum = `TRK-POS-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPOSOrder: OrderRecord = {
      id: orderId,
      date: new Date().toISOString(),
      createdAt: Date.now(),
      items: orderItems,
      subtotal,
      discount: discountAmount,
      shippingFee,
      total: totalAmount,
      status: orderStatus,
      shippingAddress: {
        fullName: customerName.trim(),
        phone: customerPhone.trim(),
        district: customerDistrict,
        city: customerDistrict,
        fullAddress: customerAddress.trim() || `${customerDistrict}, Bangladesh`,
        street: customerAddress.trim()
      },
      deliveryMethod,
      paymentMethod,
      trackingNumber: trackingNum,
      estimatedDelivery: '2-3 Business Days'
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPOSOrder)
      });
      const body = await res.json().catch(() => null);

      if (!res.ok || !body?.success) {
        setSubmitError(body?.error || `Could not save the order (HTTP ${res.status}). Nothing was charged.`);
        setIsSubmitting(false);
        return;
      }

      onOrderCreated({ ...newPOSOrder, ...body.order });
    } catch (err) {
      setSubmitError((err as Error).message || 'Network error — the order was not saved.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl h-full sm:h-[94vh] bg-stone-900 text-stone-100 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden border-0 sm:border border-stone-800 flex flex-col">
        
        {/* POS Header Bar */}
        <div className="px-4 sm:px-6 py-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/10">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-sm sm:text-base text-amber-400">FALAK POS TERMINAL</h2>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded-full border border-emerald-500/30 uppercase">
                  LIVE SYSTEM
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-400">Fast Order Billing & Receipt Printer</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-stone-900 border border-stone-800 rounded-full text-stone-300">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Cashier: <strong className="text-white">Super Admin</strong></span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer border border-stone-800"
              aria-label="Close POS Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs (< lg screen switch between Catalog & Order Ticket) */}
        <div className="lg:hidden flex border-b border-stone-800 bg-stone-950 p-1.5 gap-1 shrink-0 text-xs font-bold">
          <button
            onClick={() => setMobileTab('catalog')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
              mobileTab === 'catalog'
                ? 'bg-amber-400 text-stone-950 font-extrabold shadow-md'
                : 'text-stone-400 hover:bg-stone-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Product Catalog</span>
          </button>
          <button
            onClick={() => setMobileTab('ticket')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 relative ${
              mobileTab === 'ticket'
                ? 'bg-amber-400 text-stone-950 font-extrabold shadow-md'
                : 'text-stone-400 hover:bg-stone-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Ticket</span>
            {totalItemCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                mobileTab === 'ticket' ? 'bg-stone-950 text-amber-400' : 'bg-amber-400 text-stone-950'
              }`}>
                {totalItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Dual Panel Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT PANEL: Product Catalog Grid & Search (7 Cols on Desktop) */}
          <div className={`${mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'} lg:col-span-7 p-3 sm:p-5 flex-col gap-4 border-r border-stone-800 bg-stone-900/60 overflow-hidden h-full`}>
            {/* Catalog Search & Category Filter Bar */}
            <div className="space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search catalog by product name, SKU code (e.g. FLK-101), fabric..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-stone-950 font-extrabold shadow-md shadow-amber-500/20'
                        : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800 border border-stone-700/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 auto-rows-max gap-3">
              {filteredProducts.map((p) => {
                const stock = p.stock ?? 10;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleOpenVariationPicker(p)}
                    className="bg-stone-950 hover:bg-stone-900 border border-stone-800/80 hover:border-amber-500/70 p-2.5 rounded-2xl transition-all cursor-pointer flex flex-col gap-2 group shadow-sm hover:shadow-md hover:shadow-amber-500/10 relative"
                  >
                    {/* Image Container with Badges */}
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-stone-900 border border-stone-800/60">
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 200px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {p.code && (
                        <span className="absolute top-1.5 left-1.5 bg-stone-950/80 text-amber-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-lg border border-amber-500/30 backdrop-blur-xs shadow-xs">
                          {p.code}
                        </span>
                      )}
                      <span className={`absolute top-1.5 right-1.5 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-lg border backdrop-blur-xs shadow-xs ${
                        stock === 0
                          ? 'bg-rose-950/80 text-rose-400 border-rose-800/80'
                          : stock < 5
                          ? 'bg-amber-950/80 text-amber-400 border-amber-800/80'
                          : 'bg-stone-950/80 text-stone-300 border-stone-800'
                      }`}>
                        {stock} left
                      </span>
                    </div>

                    {/* Details Container */}
                    <div className="space-y-1">
                      <p className="font-bold text-stone-100 text-xs line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-stone-400 truncate">
                        {p.material || p.category}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-stone-800/60">
                        <span className="font-mono font-black text-amber-400 text-xs sm:text-sm">
                          {formatCurrency(p.price)}
                        </span>
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-[10px] rounded-xl transition-all shadow-sm shadow-amber-500/20 flex items-center gap-0.5 active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-full py-16 text-center text-stone-500 space-y-2">
                  <ShoppingBag className="w-8 h-8 mx-auto text-stone-600" />
                  <p className="font-bold text-xs text-stone-400">No matching products</p>
                  <p className="text-[11px] text-stone-600">Try searching another title or category.</p>
                </div>
              )}
            </div>

            {/* Mobile Bottom Floating Cart Summary Bar */}
            {orderItems.length > 0 && (
              <div className="lg:hidden shrink-0 pt-2 border-t border-stone-800">
                <button
                  onClick={() => setMobileTab('ticket')}
                  className="w-full py-3 px-4 bg-amber-400 text-stone-950 font-extrabold text-xs rounded-2xl shadow-xl flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-stone-950 text-amber-400 text-[11px] font-mono font-bold flex items-center justify-center">
                      {totalItemCount}
                    </span>
                    <span>View Ticket Summary</span>
                  </div>
                  <span className="font-mono text-sm font-black">{formatCurrency(totalAmount)} →</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Live Order Ticket & Billing Summary (5 Cols on Desktop) */}
          <div className={`${mobileTab === 'ticket' ? 'flex' : 'hidden lg:flex'} lg:col-span-5 flex-col bg-stone-950 overflow-hidden h-full`}>
            <form onSubmit={handleSubmitPOSOrder} className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Customer Quick Input Bar */}
              <div className="p-3.5 bg-stone-900/90 border-b border-stone-800 space-y-2 text-xs shrink-0">
                <div className="flex items-center justify-between text-stone-400 font-bold text-[11px]">
                  <span className="flex items-center gap-1.5 text-stone-200">
                    <User className="w-3.5 h-3.5 text-amber-400" /> Customer Information
                  </span>
                  <span className="font-mono text-stone-500">POS Ticket</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Customer Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone (017...) *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={customerDistrict}
                    onChange={(e) => setCustomerDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none cursor-pointer"
                  >
                    {['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Street / Area Address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Order Ticket Items Manifest */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
                {orderItems.length === 0 ? (
                  <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center space-y-3 text-stone-500 py-10">
                    <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-600">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-300 text-xs">POS Ticket is empty</p>
                      <p className="text-[11px] text-stone-500 mt-0.5 max-w-xs">Select products from the catalog to build this customer order ticket.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileTab('catalog')}
                      className="lg:hidden px-4 py-2 bg-amber-400 text-stone-950 font-bold text-xs rounded-xl"
                    >
                      + Select Products
                    </button>
                  </div>
                ) : (
                  orderItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-stone-900/80 rounded-2xl border border-stone-800 flex items-center gap-3 hover:border-stone-700 transition-colors"
                    >
                      <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-stone-800 shrink-0 border border-stone-800">
                        <Image
                          src={item.product?.images[0]}
                          alt={item.product?.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-100 text-xs line-clamp-1">{item.product?.name}</p>
                        <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                          {item.selectedColor} · {item.selectedSize}
                        </p>
                        <span className="text-xs font-bold text-amber-400 font-mono block mt-0.5">
                          {formatCurrency((item.product?.price || 0) * item.quantity)}
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-xl p-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, -1)}
                          className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1.5 font-mono font-bold text-xs min-w-[18px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, 1)}
                          className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* POS Discounts, Shipping & Billing Footer */}
              <div className="p-4 bg-stone-900/90 border-t border-stone-800 space-y-3 shrink-0">
                
                {/* Discount Presets & Custom Input */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-stone-400 font-bold">
                    <span>Admin Discount</span>
                    <span className="font-mono text-emerald-400">-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 100, 200, 500].map((disc) => (
                      <button
                        type="button"
                        key={disc}
                        onClick={() => {
                          setDiscountAmount(disc);
                          setIsCustomDiscount(false);
                        }}
                        className={`py-1.5 rounded-xl font-mono text-[11px] font-bold border transition-all cursor-pointer ${
                          !isCustomDiscount && discountAmount === disc
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-xs'
                            : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        {disc === 0 ? 'No Disc' : `৳${disc}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery Options */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Shipping Fee</label>
                    <select
                      value={shippingFee}
                      onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 font-mono focus:outline-none cursor-pointer"
                    >
                      <option value={120}>Standard (৳120)</option>
                      <option value={150}>Same-Day Dhaka (৳150)</option>
                      <option value={0}>Free Delivery (৳0)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-2.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none cursor-pointer"
                    >
                      <option value="Cash on Delivery (COD)">Cash on Delivery</option>
                      <option value="Admin POS Cash">Admin POS Cash</option>
                      <option value="Bkash Direct Payment">bKash Direct</option>
                      <option value="Bank Wire Transfer">Bank Wire</option>
                    </select>
                  </div>
                </div>

                {/* Grand Bill Net Total Display */}
                <div className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 flex items-center justify-between shadow-inner">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">NET PAYABLE TOTAL</span>
                    <span className="text-xs text-stone-400 font-mono">
                      Subtotal: {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <span className="font-mono text-2xl font-black text-amber-400">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                {/* Save failure error message */}
                {submitError && (
                  <div className="px-3 py-2.5 rounded-2xl bg-red-950/60 border border-red-800 text-red-200 text-[11px] font-bold">
                    {submitError}
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || orderItems.length === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Printer className="w-4.5 h-4.5" />
                  <span>{isSubmitting ? 'SAVING ORDER…' : 'PAY & PRINT INVOICE'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Product Variation Selection Modal */}
      {activeProductForVariation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-2xl space-y-4 text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-amber-400 line-clamp-1">{activeProductForVariation.name}</h3>
              <button
                onClick={() => setActiveProductForVariation(null)}
                className="p-1 text-stone-400 hover:text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Colors Picker */}
            {activeProductForVariation.colors && activeProductForVariation.colors.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-400">Select Color</label>
                <div className="flex flex-wrap gap-1.5">
                  {activeProductForVariation.colors.map((c, i) => {
                    const cName = getColorName(c);
                    return (
                      <button
                        type="button"
                        key={`${cName}-${i}`}
                        onClick={() => setVarColor(cName)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          varColor === cName
                            ? 'bg-amber-400 text-stone-950 font-extrabold'
                            : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        {cName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes Picker */}
            {activeProductForVariation.sizes && activeProductForVariation.sizes.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-400">Select Size</label>
                <div className="flex flex-wrap gap-1.5">
                  {activeProductForVariation.sizes.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setVarSize(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        varSize === s
                          ? 'bg-amber-400 text-stone-950 font-extrabold'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleAddProductToTicket(activeProductForVariation, varColor, varSize)}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Add to POS Ticket ({formatCurrency(activeProductForVariation.price)})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
