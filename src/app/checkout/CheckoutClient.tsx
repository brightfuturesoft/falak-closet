'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ShieldCheck,
  Truck,
  Lock,
  ArrowRight,
  ArrowLeft,
  X,
  Banknote,
  Smartphone,
  ChevronDown,
  ShoppingBag,
  Ticket
} from 'lucide-react';
import { useCart, OrderRecord, DeliverySubArea } from '@/context/CartContext';
import { useAnalytics } from '@/context/AnalyticsContext';

/** Shared 44px-touch-target text field. */
function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = true,
  autoComplete,
  inputMode,
  pattern,
  maxLength,
  className = '',
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'numeric' | 'email';
  pattern?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={`co-${name}`} className="text-[11px] sm:text-xs font-bold text-stone-700">
        {label} {required && <span className="text-[#A80C14]">*</span>}
      </label>
      <input
        id={`co-${name}`}
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        className="w-full min-h-[44px] px-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A80C14] focus:border-transparent transition-shadow"
      />
    </div>
  );
}

/** Interactive searchable select dropdown for City, Zone, Area */
function SearchableSelect({
  label,
  id,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  loading = false,
  className = '',
}: {
  label: string;
  id: string;
  options: Array<{ value: number; label: string }>;
  value: number | null;
  onChange: (val: number | null) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`space-y-1.5 relative ${className}`}>
      <label htmlFor={id} className="text-[11px] sm:text-xs font-bold text-stone-700 flex items-center justify-between">
        <span>{label} {required && <span className="text-[#A80C14]">*</span>}</span>
        {selectedOption && <span className="text-[10px] text-emerald-600 font-semibold">✓ Selected</span>}
      </label>

      {/* Hidden input for standard HTML form validation */}
      <input
        type="text"
        id={id}
        tabIndex={-1}
        required={required}
        value={value ? String(value) : ''}
        onChange={() => { }}
        className="sr-only"
        aria-hidden="true"
      />

      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSearchQuery('');
        }}
        className={`w-full min-h-[44px] px-4 bg-stone-50 border rounded-2xl text-xs sm:text-sm text-left flex items-center justify-between gap-2 transition-all ${isOpen
          ? 'border-[#A80C14] ring-2 ring-[#A80C14]/20 bg-white shadow-sm'
          : 'border-stone-200 hover:border-stone-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`truncate ${selectedOption ? 'font-bold text-stone-900' : 'text-stone-400'}`}>
          {loading ? 'Loading options…' : selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#A80C14]' : ''}`} />
      </button>

      {/* Floating Search Dropdown Overlay */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-150">
          <div className="p-2 border-b border-stone-100 bg-stone-50">
            <div className="relative flex items-center">
              <input
                type="text"
                autoFocus
                placeholder={`Search ${label.toLowerCase()}…`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-3 pr-8 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#A80C14]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-stone-50 text-xs">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-stone-400 text-[11px] font-medium">
                No matching {label.toLowerCase()} found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors ${isSelected
                      ? 'bg-[#FDF2F3] text-[#A80C14] font-bold'
                      : 'text-stone-700 hover:bg-stone-50'
                      }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#A80C14]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const {
    cart,
    subtotal: cartSubtotal,
    discountAmount,
    shippingFee: cartShippingFee,
    placeOrder,
    deliveryZones,
    selectedZoneId,
    selectedSubAreaId,
    setSelectedZone,
    selectedZoneName,
    selectedSubAreaName,
    appliedCoupon,
    applyPromoCode,
    removePromoCode,
    promoNotice,
    totalAmount: cartTotalAmount,
    user,
    getProductBySlug,
    products,
    freeShippingThreshold,
  } = useCart();
  const { trackEvent } = useAnalytics();

  // ── Buy Now Mode ─────────────────────────────────────────────────────────────
  // When the user clicks "Buy Now" on a product card, we encode the item into
  // the URL. The checkout then shows ONLY that item — the cart is untouched.
  const buyNowProductId = searchParams.get('buyNow');
  const buyNowColor = searchParams.get('color') ?? '';
  const buyNowSize = searchParams.get('size') ?? '';
  const buyNowQty = Math.max(1, parseInt(searchParams.get('qty') ?? '1', 10));

  const buyNowProduct = useMemo(() => {
    if (!buyNowProductId) return null;
    return products.find((p) => p.id === buyNowProductId) ??
      getProductBySlug(buyNowProductId) ??
      null;
  }, [buyNowProductId, products, getProductBySlug]);

  const buyNowItems = useMemo(() => {
    if (!buyNowProduct) return null;
    return [{
      product: buyNowProduct,
      selectedColor: buyNowColor || buyNowProduct.colors?.[0]?.name || '',
      selectedSize: buyNowSize || buyNowProduct.sizes?.[0] || 'Free Size',
      quantity: buyNowQty,
    }];
  }, [buyNowProduct, buyNowColor, buyNowSize, buyNowQty]);

  // Use buyNow items when in that mode, otherwise fall back to cart
  const activeItems = buyNowItems ?? cart;

  // Recompute totals when in buyNow mode (ignore promo/shipping for simplicity;
  // shipping logic mirrors CartContext)
  const subtotal = useMemo(() => {
    if (!buyNowItems) return cartSubtotal;
    return buyNowItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  }, [buyNowItems, cartSubtotal]);

  const shippingFee = useMemo(() => {
    if (!buyNowItems) return cartShippingFee;
    return subtotal >= freeShippingThreshold ? 0 : cartShippingFee;
  }, [buyNowItems, cartShippingFee, subtotal, freeShippingThreshold]);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    country: 'Bangladesh',
    postalCode: ''
  });

  // ── Pathao Dynamic Shipping State ──────────────────────────────────────────
  const [pathaoCities, setPathaoCities] = useState<Array<{ city_id: number; city_name: string }>>([]);
  const [pathaoZones, setPathaoZones] = useState<Array<{ zone_id: number; zone_name: string }>>([]);
  const [pathaoAreas, setPathaoAreas] = useState<Array<{ area_id: number; area_name: string }>>([]);

  const [selectedPathaoCityId, setSelectedPathaoCityId] = useState<number | null>(null);
  const [selectedPathaoZoneId, setSelectedPathaoZoneId] = useState<number | null>(null);
  const [selectedPathaoAreaId, setSelectedPathaoAreaId] = useState<number | null>(null);

  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [pathaoShippingError, setPathaoShippingError] = useState<string | null>(null);

  const [pathaoCourierFee, setPathaoCourierFee] = useState<number | null>(null);
  const [pathaoCustomerFee, setPathaoCustomerFee] = useState<number | null>(null);
  const [isPathaoFreeShipping, setIsPathaoFreeShipping] = useState<boolean>(false);

  // Load Pathao Cities on Mount
  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const res = await fetch('/api/shipping/pathao/cities');
        const data = await res.json();
        if (data.success && Array.isArray(data.cities)) {
          setPathaoCities(data.cities);
        }
      } catch (err) {
        console.error('Failed to fetch Pathao cities:', err);
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  // Auto-fill Postal Code based on selected Pathao City & Zone
  useEffect(() => {
    if (!selectedPathaoCityId) return;

    const ZONE_POSTAL_MAP: Record<number, string> = {
      101: '1205', // Dhanmondi
      102: '1230', // Uttara
      103: '1212', // Gulshan
      104: '1216', // Mirpur
      105: '1207', // Mohammadpur
      106: '1229', // Bashundhara
      201: '4100', // Agrabad
      202: '4000', // GEC
      301: '3100', // Zindabazar
    };

    const CITY_POSTAL_MAP: Record<number, string> = {
      1: '1200', // Dhaka
      2: '4000', // Chattogram
      3: '3100', // Sylhet
      4: '9000', // Khulna
      5: '6000', // Rajshahi
      6: '8200', // Barishal
      7: '5400', // Rangpur
      8: '2200', // Mymensingh
    };

    const autoPostcode =
      (selectedPathaoZoneId && ZONE_POSTAL_MAP[selectedPathaoZoneId]) ||
      CITY_POSTAL_MAP[selectedPathaoCityId] ||
      '1000';

    setFormData((prev) => ({ ...prev, postalCode: autoPostcode }));
  }, [selectedPathaoCityId, selectedPathaoZoneId]);

  // Load Pathao Zones when City is selected
  useEffect(() => {
    if (!selectedPathaoCityId) {
      setPathaoZones([]);
      setSelectedPathaoZoneId(null);
      setPathaoAreas([]);
      setSelectedPathaoAreaId(null);
      setPathaoCourierFee(null);
      setPathaoCustomerFee(null);
      return;
    }

    const fetchZones = async () => {
      setIsLoadingZones(true);
      setPathaoZones([]);
      setSelectedPathaoZoneId(null);
      setPathaoAreas([]);
      setSelectedPathaoAreaId(null);
      setPathaoCourierFee(null);
      setPathaoCustomerFee(null);
      try {
        const res = await fetch(`/api/shipping/pathao/zones?cityId=${selectedPathaoCityId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.zones)) {
          setPathaoZones(data.zones);
        }
      } catch (err) {
        console.error('Failed to fetch Pathao zones:', err);
      } finally {
        setIsLoadingZones(false);
      }
    };
    fetchZones();
  }, [selectedPathaoCityId]);

  // Auto-detect Pathao Zone from Full Address or default to first zone when zones arrive
  useEffect(() => {
    if (!pathaoZones || pathaoZones.length === 0) return;
    const cleanStreet = (formData?.street || '').toLowerCase().trim();

    const matchedZone = pathaoZones.find((z) => {
      const zName = z.zone_name.toLowerCase();
      return cleanStreet.includes(zName) || (cleanStreet && zName.includes(cleanStreet));
    });

    if (matchedZone) {
      setSelectedPathaoZoneId(matchedZone.zone_id);
    } else if (!selectedPathaoZoneId || !pathaoZones.some((z) => z.zone_id === selectedPathaoZoneId)) {
      setSelectedPathaoZoneId(pathaoZones[0].zone_id);
    }
  }, [pathaoZones, formData?.street]);

  // Load Pathao Areas and auto-detect Area from Full Address
  useEffect(() => {
    if (!selectedPathaoCityId || !selectedPathaoZoneId) {
      setPathaoAreas([]);
      setSelectedPathaoAreaId(null);
      setPathaoCourierFee(null);
      setPathaoCustomerFee(null);
      return;
    }

    const fetchAreas = async () => {
      setIsLoadingAreas(true);
      setPathaoAreas([]);
      setSelectedPathaoAreaId(null);
      try {
        const res = await fetch(`/api/shipping/pathao/areas?zoneId=${selectedPathaoZoneId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.areas)) {
          setPathaoAreas(data.areas);
          const cleanStreet = (formData?.street || '').toLowerCase().trim();
          const matchedArea = data.areas.find((a: { area_name: string }) => {
            const aName = a.area_name.toLowerCase();
            return cleanStreet.includes(aName);
          });
          if (matchedArea) {
            setSelectedPathaoAreaId(matchedArea.area_id);
          } else if (data.areas.length > 0) {
            setSelectedPathaoAreaId(data.areas[0].area_id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch Pathao areas:', err);
      } finally {
        setIsLoadingAreas(false);
      }
    };
    fetchAreas();
  }, [selectedPathaoCityId, selectedPathaoZoneId]);

  // ── Tiered Delivery Fee Calculation ───────────────────────────────────────
  // Inside Dhaka: 80 taka, Sub area Dhaka: 100 taka, Outside Dhaka: 150 taka
  const DHAKA_SUB_AREAS = useMemo(
    () => [
      'savar',
      'gazipur',
      'narayanganj',
      'tongi',
      'keraniganj',
      'ashulia',
      'dhamrai',
      'bhedarganj',
      'kaliakair',
      'kapasia',
      'sreepur',
      'mirzapur',
    ],
    []
  );

  const calculatedDeliveryFee = useMemo(() => {
    if (subtotal >= freeShippingThreshold) return 0;

    const cleanCity = (formData.city || '').toLowerCase().trim();
    const cleanAddr = (formData.street || '').toLowerCase().trim();

    // Check sub-area match first
    const isSubArea = DHAKA_SUB_AREAS.some(
      (sub) => cleanCity.includes(sub) || cleanAddr.includes(sub)
    );
    if (isSubArea) return 100;

    // Check Dhaka core match
    const isDhakaCore = cleanCity.includes('dhaka') || cleanAddr.includes('dhaka');
    if (isDhakaCore) return 80;

    // Outside Dhaka fallback (when city is empty or any non-Dhaka district)
    return 150;
  }, [formData.city, formData.street, subtotal, freeShippingThreshold, DHAKA_SUB_AREAS]);

  const effectiveShippingFee = calculatedDeliveryFee;

  const effectiveTotalAmount = useMemo(() => {
    return Math.max(0, subtotal - (buyNowItems ? 0 : discountAmount) + effectiveShippingFee);
  }, [subtotal, buyNowItems, discountAmount, effectiveShippingFee]);

  const totalAmount = effectiveTotalAmount;

  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [isIpBlocked, setIsIpBlocked] = useState(false);
  const [userIp] = useState<string>('103.24.12.89');

  // Mobile summary disclosure + sticky CTA
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // bKash manual payment settings state
  const [bkashSettings, setBkashSettings] = useState<{
    bkashNumber?: string;
    bkashAccountType?: string;
    instructions?: string[];
  } | null>(null);
  const [isBkashModalOpen, setIsBkashModalOpen] = useState(false);
  const [bkashSenderNumber, setBkashSenderNumber] = useState('');
  const [bkashTrxId, setBkashTrxId] = useState('');
  const [bkashError, setBkashError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyNumber = () => {
    if (bkashSettings?.bkashNumber) {
      navigator.clipboard.writeText(bkashSettings.bkashNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Auto-select zone based on user's district
  React.useEffect(() => {
    if (!formData.city || deliveryZones.length === 0) return;
    const cleanCity = formData.city.toLowerCase().trim();
    if (cleanCity.includes('dhaka')) {
      const dhakaZone = deliveryZones.find(z => z.name.toLowerCase().includes('inside dhaka'));
      if (dhakaZone && selectedZoneId !== dhakaZone.id) {
        setSelectedZone(dhakaZone.id, null);
      }
    } else {
      const outsideZone = deliveryZones.find(z => z.name.toLowerCase().includes('outside dhaka'));
      if (outsideZone && selectedZoneId !== outsideZone.id) {
        setSelectedZone(outsideZone.id, null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.city, deliveryZones]);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings?key=payment');
        const data = await res.json();
        if (data.success && data.setting) {
          setBkashSettings(data.setting.value);
        }
      } catch {
        console.error('Failed to load settings');
      }
    };
    fetchSettings();
  }, []);

  // Auto fill shipping address
  React.useEffect(() => {
    if (user) {
      Promise.resolve().then(() => {
        if (user.email) setUserEmail(user.email);
        setFormData((prev) => ({
          ...prev,
          fullName: user.name || prev.fullName,
          phone: user.phone || prev.phone,
          city: user.district || prev.city,
          street: user.fullAddress || prev.street,
        }));
      });
    }
  }, [user]);

  // Check IP blocking status
  React.useEffect(() => {
    const checkBlockedIp = async () => {
      try {
        const res = await fetch('/api/security/block-ip');
        const data = await res.json();
        const localBlocked = JSON.parse(localStorage.getItem('falak_blocked_ips') || '[]');
        const allBlocked = [...(data.blockedIps || []), ...localBlocked];
        const isBlocked = allBlocked.some((b: { ip: string }) => b.ip === userIp);
        if (isBlocked) setIsIpBlocked(true);
      } catch {
        const localBlocked = JSON.parse(localStorage.getItem('falak_blocked_ips') || '[]');
        if (localBlocked.some((b: { ip: string }) => b.ip === userIp)) setIsIpBlocked(true);
      }
    };
    if (userIp) {
      checkBlockedIp();
    }
  }, [userIp]);

  // While the bKash sheet is open: lock background scroll, close on Escape
  // (the main form submit already intercepts the bKash flow).
  useEffect(() => {
    if (!isBkashModalOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsBkashModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isBkashModalOpen]);

  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery (COD)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    setIsValidatingPromo(true);
    setPromoFeedback(null);

    const res = await applyPromoCode(promoCodeInput.trim());
    if (res.success) {
      setPromoFeedback({ type: 'success', message: res.message });
      setPromoCodeInput('');
    } else {
      setPromoFeedback({ type: 'error', message: res.message });
    }
    setIsValidatingPromo(false);
  };
  const [createdOrder, setCreatedOrder] = useState<OrderRecord | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeItems.length === 0 || isIpBlocked) return;

    if (paymentMethod === 'bKash Send Money (Manual)' && !isBkashModalOpen) {
      // Intercept to display the gateway-style bKash payment portal first
      setIsBkashModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setBkashError(null);

    try {
      const selectedCityObj = pathaoCities.find((c) => c.city_id === selectedPathaoCityId);
      const selectedZoneObj = pathaoZones.find((z) => z.zone_id === selectedPathaoZoneId);
      const selectedAreaObj = pathaoAreas.find((a) => a.area_id === selectedPathaoAreaId);

      const updatedShippingAddress = {
        ...formData,
        city: selectedCityObj?.city_name || formData.city,
        district: selectedCityObj?.city_name || formData.city,
        pathaoCityId: selectedPathaoCityId || undefined,
        pathaoZoneId: selectedPathaoZoneId || undefined,
        pathaoAreaId: selectedPathaoAreaId || undefined,
        pathaoCityName: selectedCityObj?.city_name || undefined,
        pathaoZoneName: selectedZoneObj?.zone_name || undefined,
        pathaoAreaName: selectedAreaObj?.area_name || undefined,
      };

      const orderPayload: Record<string, unknown> = {
        items: activeItems,
        subtotal,
        discount: buyNowItems ? 0 : discountAmount,
        shippingFee: effectiveShippingFee,
        courierDeliveryFee: pathaoCourierFee || undefined,
        total: totalAmount,
        shippingAddress: updatedShippingAddress,
        deliveryMethod: selectedCityObj
          ? `Pathao Express (${selectedCityObj.city_name}${selectedZoneObj ? ` - ${selectedZoneObj.zone_name}` : ''})`
          : selectedZoneName + (selectedSubAreaName ? ` - ${selectedSubAreaName}` : ''),
        paymentMethod,
        userEmail,
        userIp,
        deliveryZone: selectedZoneObj?.zone_name || selectedZoneName,
        deliverySubArea: selectedAreaObj?.area_name || selectedSubAreaName || undefined,
        promoCode: appliedCoupon?.code || undefined,
      };

      if (paymentMethod === 'bKash Send Money (Manual)') {
        if (!/^01\d{9}$/.test(bkashSenderNumber.trim())) {
          setBkashError('Please enter a valid 11-digit bKash number.');
          setIsSubmitting(false);
          return;
        }
        if (!bkashTrxId.trim() || bkashTrxId.trim().length < 6) {
          setBkashError('Please enter a valid Transaction ID.');
          setIsSubmitting(false);
          return;
        }
        orderPayload.paymentSenderNumber = bkashSenderNumber.trim();
        orderPayload.paymentTrxId = bkashTrxId.trim().toUpperCase();
        orderPayload.paymentStatus = 'Pending';
      }

      const order = await placeOrder(orderPayload as any);

      trackEvent('purchase', {
        orderId: order.id,
        itemCount: order.items.length,
        totalValue: order.total,
        paymentMethod: order.paymentMethod
      });

      setCreatedOrder(order);
      setIsBkashModalOpen(false);
    } catch (err) {
      console.error('Order placement error:', err);
      setBkashError('An error occurred while placing the order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isIpBlocked) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full uppercase tracking-wider">
            Access Restricted
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-stone-900">
            IP Address Blocked
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
            Your IP address (<strong className="font-mono">{userIp}</strong>) has been restricted by system administration due to security policies.
          </p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 text-left space-y-1">
          <p className="font-bold">What can you do?</p>
          <p>• If you believe this is an error, please contact Falak Closet Support.</p>
          <p>• Admin team can lift the IP restriction from Security Settings.</p>
        </div>
      </div>
    );
  }

  if (createdOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 text-center space-y-6 pb-32 lg:pb-16">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
            Order Confirmed &amp; Placed
          </span>
          <h1 className="font-sans text-2xl sm:text-4xl font-extrabold text-stone-900">
            Thank You for Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
            Your order has been recorded and synced live to our Admin Fulfillment Dashboard.
          </p>
        </div>

        {/* Order Receipt Box */}
        <div className="p-4 sm:p-6 bg-white rounded-3xl border border-[#F8D2D5] text-left space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F8D2D5] pb-3 gap-2">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider">Order Reference ID</span>
              <div className="font-mono font-bold text-lg sm:text-xl text-[#A80C14] break-all">
                {createdOrder.id}
              </div>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider">Tracking Number</span>
              <div className="font-mono text-xs font-bold text-stone-700">
                {createdOrder.trackingNumber}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-bold text-stone-900">Shipping Address:</p>
              <p className="text-stone-500">{createdOrder.shippingAddress.fullName}</p>
              <p className="text-stone-500">{createdOrder.shippingAddress.street}</p>
              <p className="text-stone-500">
                {createdOrder.shippingAddress.city}, {createdOrder.shippingAddress.country} ({createdOrder.shippingAddress.postalCode})
              </p>
              <p className="text-stone-500">Phone: {createdOrder.shippingAddress.phone}</p>
            </div>

            <div>
              <p className="font-bold text-stone-900">Delivery &amp; Payment:</p>
              <p className="text-stone-500">{createdOrder.deliveryMethod}</p>
              <p className="text-stone-500">{createdOrder.paymentMethod}</p>
              <p className="font-bold text-[#A80C14] mt-2 font-mono text-sm">
                Total Paid: ৳ {createdOrder.total}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={`/track?id=${createdOrder.id}`}
            className="w-full sm:w-auto min-h-[48px] px-8 inline-flex items-center justify-center bg-[#A80C14] text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#8C0A10] active:scale-95 transition-all shadow-md gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Track Order Status</span>
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto min-h-[48px] px-8 inline-flex items-center justify-center bg-stone-900 text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-stone-700 active:scale-95 transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Friendly empty-cart state — nothing to check out.
  if (activeItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 text-center space-y-5 pb-28 lg:pb-12">
        <div className="w-20 h-20 bg-[#FDF2F3] text-[#A80C14] rounded-full flex items-center justify-center mx-auto shadow-sm">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-stone-900">
            Your cart is empty
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
            Add a few pieces to your cart before heading to checkout.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/shop"
            className="w-full sm:w-auto min-h-[48px] px-8 inline-flex items-center justify-center bg-[#A80C14] text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#8C0A10] active:scale-95 transition-all shadow-md gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Start Shopping</span>
          </Link>
          <Link
            href="/cart"
            className="w-full sm:w-auto min-h-[48px] px-8 inline-flex items-center justify-center bg-white border border-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-full hover:bg-stone-50 active:scale-95 transition-all"
          >
            View Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-10 space-y-6 lg:space-y-8 pb-44 lg:pb-12">
      <div className="flex items-center justify-between border-b border-[#F8D2D5] pb-3 sm:pb-4">
        <Link
          href="/cart"
          className="flex items-center gap-1.5 min-h-[40px] text-xs font-semibold text-stone-500 hover:text-[#A80C14] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Cart
        </Link>
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-stone-400">
          <Lock className="w-3.5 h-3.5 text-emerald-600" /> Secure SSL Checkout
        </div>
      </div>

      <form id="checkout-form" onSubmit={handleCompleteOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Order Summary — FIRST on mobile (collapsed by default), right rail on desktop.
            One markup source, reordered via grid placement. */}
        <aside className="lg:col-span-5 lg:order-2">
          <div className="lg:sticky lg:top-24 bg-white rounded-3xl border border-[#F8D2D5] shadow-xs overflow-hidden">
            {/* Summary header — doubles as the mobile disclosure toggle */}
            <button
              type="button"
              onClick={() => setIsSummaryOpen((v) => !v)}
              aria-expanded={isSummaryOpen}
              className="lg:cursor-default lg:pointer-events-none w-full flex items-center justify-between gap-3 p-4 sm:p-6 text-left"
            >
              <div className="min-w-0">
                <h2 className="font-bold text-xs sm:text-lg text-stone-900 flex items-center gap-2">
                  {buyNowItems ? 'Quick Order' : 'Order Summary'}
                  <span className="px-2 text-xs py-0.5 bg-[#FDF2F3] border border-[#F8D2D5] rounded-full text-[10px] font-bold text-[#A80C14]">
                    {activeItems.length} {activeItems.length === 1 ? 'item' : 'items'}
                  </span>
                  {buyNowItems && (
                    <span className="px-2 text-xs py-0.5 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-bold text-amber-700 flex items-center tex-xs gap-1">
                      ⚡ Buy Now
                    </span>
                  )}
                </h2>
                {/* Stacked thumbnails preview (mobile teaser) */}
                <div className="lg:hidden flex items-center gap-1 mt-1.5">
                  {activeItems.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="relative w-7 h-8 rounded-md overflow-hidden border border-white shadow-sm bg-stone-100 -ml-1.5 first:ml-0">
                      <Image src={item.product?.images[0]} alt="" fill sizes="28px" className="object-cover" />
                    </div>
                  ))}
                  {activeItems.length > 4 && (
                    <span className="text-[10px] font-bold text-stone-400 ml-0.5">+{activeItems.length - 4}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="block text-[9px] text-stone-400 uppercase tracking-wider leading-none">Total</span>
                  <span className="font-extrabold text-[#A80C14] font-mono text-base sm:text-lg leading-tight">
                    ৳ {totalAmount}
                  </span>
                </div>
                <ChevronDown className={`lg:hidden w-5 h-5 text-stone-400 transition-transform ${isSummaryOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Collapsible body: always open on lg, toggled on mobile */}
            <div className={`${isSummaryOpen ? 'block' : 'hidden'} lg:block border-t border-[#F8D2D5] p-4 sm:p-6 space-y-4`}>
              <div className="divide-y divide-[#FDF2F3] max-h-64 overflow-y-auto overscroll-contain pr-1 -mr-1">
                {activeItems.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                        <Image src={item.product?.images[0]} alt={item.product?.name} fill sizes="40px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 line-clamp-1">{item.product?.name}</p>
                        <p className="text-[10px] text-stone-400 truncate">{item.selectedColor} • {item.selectedSize} • Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-stone-900 shrink-0">৳ {item.product?.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Promo Code Voucher Input */}
              <div className="space-y-2">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800">
                    <span className="flex items-center gap-1.5 font-bold uppercase min-w-0">
                      <Ticket className="w-4 h-4 shrink-0" />
                      <span className="truncate">{appliedCoupon.code} — −৳{discountAmount}</span>
                    </span>
                    <button
                      type="button"
                      onClick={removePromoCode}
                      aria-label="Remove promo code"
                      className="w-8 h-8 -my-1 -mr-1 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-emerald-100 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      aria-label="Promo code"
                      placeholder="Enter Promo Code (e.g. EID2026)"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 min-h-[44px] px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold uppercase text-stone-900 placeholder:font-sans placeholder:font-normal placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A80C14] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromoCode}
                      disabled={isValidatingPromo || !promoCodeInput.trim()}
                      className="px-4 min-h-[44px] bg-stone-900 hover:bg-stone-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:active:scale-100"
                    >
                      {isValidatingPromo ? 'Checking…' : 'Apply'}
                    </button>
                  </div>
                )}
                {promoFeedback && (
                  <p
                    role="status"
                    className={`text-[11px] font-bold ${promoFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}
                  >
                    {promoFeedback.message}
                  </p>
                )}
                {promoNotice && (
                  <p className="text-[11px] font-bold text-amber-600">
                    ⚠️ {promoNotice}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#F8D2D5] space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-stone-900">৳ {subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount Applied ({appliedCoupon?.code})</span>
                    <span>-৳ {discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span>Delivery Fee</span>
                  <div className="text-right font-bold text-stone-900">
                    {effectiveShippingFee === 0 ? (
                      <span className="text-emerald-600 uppercase font-extrabold">Free Shipping</span>
                    ) : (
                      <span>৳ {effectiveShippingFee}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-[#F8D2D5]">
                  <span>Total</span>
                  <span className="text-[#A80C14] text-xl font-extrabold">৳ {totalAmount}</span>
                </div>
              </div>

              {/* Desktop CTA (mobile uses the sticky bottom bar) */}
              <button
                type="submit"
                disabled={isSubmitting || isCalculatingShipping}
                className="hidden lg:flex w-full min-h-[52px] items-center justify-center bg-[#A80C14] hover:bg-[#8C0A10] active:scale-[0.99] text-white font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-md gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Processing Order…' : 'Complete Order'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="hidden lg:flex items-center justify-center gap-1.5 text-[10px] font-semibold text-stone-400">
                <Lock className="w-3 h-3 text-emerald-600" /> 256-bit encrypted secure checkout
              </p>
            </div>
          </div>
        </aside>

        {/* Shipping Details */}
        <div className="lg:col-span-7 lg:order-1 space-y-5 lg:space-y-6">
          <section className="bg-white p-4 sm:p-6 rounded-3xl border border-[#F8D2D5] shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#A80C14]/10 text-[#A80C14] text-xs font-black flex items-center justify-center shrink-0">1</span>
                Shipping &amp; Contact Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Field
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="e.g. Sarah Ahmed"
                autoComplete="name"
              />

              <Field
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. 01700000000"
                autoComplete="tel-national"
                inputMode="tel"
                pattern="01[0-9]{9}"
                maxLength={11}
              />

              {/* Pathao Searchable City Selection */}
              <SearchableSelect
                label="City / District"
                id="co-pathao-city"
                required
                options={pathaoCities.map((city) => ({ value: city.city_id, label: city.city_name }))}
                value={selectedPathaoCityId}
                loading={isLoadingCities}
                placeholder="-- Type to search Pathao City --"
                onChange={(val) => {
                  setSelectedPathaoCityId(val);
                  if (val) {
                    const cityObj = pathaoCities.find((c) => c.city_id === val);
                    if (cityObj) {
                      setFormData((prev) => ({ ...prev, city: cityObj.city_name }));
                    }
                  }
                }}
              />

              <Field
                label="Full Address (House, Road, Flat & Landmark)"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="e.g. House 42, Road 11, Flat 4B, near Abahani Field"
                autoComplete="street-address"
                className="sm:col-span-2"
              />
            </div>

            {/* Delivery Fee Info Banner */}
            <div className="p-3.5 bg-rose-50/60 border border-[#F8D2D5] rounded-2xl text-xs text-stone-700 space-y-1">
              <div className="flex items-center justify-between font-bold text-stone-900">
                <span className="flex items-center gap-1.5 text-[#A80C14]">
                  <Truck className="w-4 h-4" /> Standard Delivery Rates
                </span>
                <span className="font-mono font-bold text-xs text-[#A80C14]">
                  {effectiveShippingFee === 0 ? 'Free Shipping' : `৳ ${effectiveShippingFee}`}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Inside Dhaka: <strong>৳80</strong> • Sub-area Dhaka: <strong>৳100</strong> • Outside Dhaka: <strong>৳150</strong>
              </p>
            </div>
          </section>

          {/* Payment Option */}
          <section className="bg-white p-4 sm:p-6 rounded-3xl border border-[#F8D2D5] shadow-xs space-y-3">
            <h2 className="font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#A80C14]/10 text-[#A80C14] text-xs font-black flex items-center justify-center shrink-0">2</span>
              Payment Option
            </h2>

            <div className="space-y-2.5 text-xs" role="radiogroup" aria-label="Payment method">
              {[
                {
                  id: 'Cash on Delivery (COD)',
                  icon: Banknote,
                  desc: 'Pay in cash when your parcel arrives at your door'
                },
                {
                  id: 'bKash Send Money (Manual)',
                  icon: Smartphone,
                  desc: 'Send Money now, then share the TrxID — verified before dispatch'
                }
              ].map((pm) => {
                const isSelected = paymentMethod === pm.id;
                const Icon = pm.icon;
                return (
                  <label
                    key={pm.id}
                    className={`flex items-start gap-3 min-h-[56px] p-3.5 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] ${isSelected
                      ? 'border-[#A80C14] bg-[#FDF2F3] font-bold shadow-xs'
                      : 'border-stone-200 text-stone-700 hover:border-[#F8D2D5]'
                      }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={isSelected}
                      onChange={() => setPaymentMethod(pm.id)}
                      className="accent-[#A80C14] w-4 h-4 shrink-0 mt-0.5"
                    />
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#A80C14] text-white' : 'bg-stone-100 text-stone-500'}`}>
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block font-bold ${isSelected ? 'text-[#A80C14]' : 'text-stone-800'}`}>{pm.id}</span>
                      <span className="block text-[10px] text-stone-500 font-normal mt-0.5 leading-snug">{pm.desc}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      </form>

      {/* Sticky mobile purchase bar — offset matches MobileBottomNav including
          its env(safe-area-inset-bottom) padding once the nav overhaul lands. */}
      <div className="lg:hidden fixed bottom-[calc(62px+env(safe-area-inset-bottom))] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F8D2D5] px-3 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0 shrink-0">
          <span className="text-[9px] text-stone-400 uppercase tracking-wider leading-none">Total ({activeItems.length} {activeItems.length === 1 ? 'item' : 'items'})</span>
          <span className="font-extrabold text-[#A80C14] font-mono text-base leading-tight">
            ৳ {totalAmount}
          </span>
        </div>
        <button
          type="submit"
          form="checkout-form"
          disabled={isSubmitting}
          className="flex-1 max-w-[62%] min-h-[44px] bg-[#A80C14] hover:bg-[#8C0A10] active:scale-95 text-white text-[11px] font-extrabold uppercase tracking-wider rounded-full transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span>{isSubmitting ? 'Processing…' : 'Complete Order'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Manual bKash Payment — bottom sheet on mobile, centered dialog on desktop */}
      {isBkashModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="bKash payment"
          onClick={(e) => e.target === e.currentTarget && setIsBkashModalOpen(false)}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-stone-200 max-w-md w-full shadow-2xl overflow-hidden text-stone-900 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-[#E2136E] text-white p-5 sm:p-6 text-center space-y-2 relative shrink-0">
              <button
                type="button"
                onClick={() => setIsBkashModalOpen(false)}
                aria-label="Close bKash payment"
                className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center justify-center bg-white text-[#E2136E] rounded-2xl px-4 py-2 font-black text-xl tracking-wider shadow-sm select-none">
                bKash
              </div>
              <p className="text-xs text-[#F8D2D5]">Send Money Payment Portal</p>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-contain flex-grow text-left">
              {/* Amount Info */}
              <div className="bg-[#FDF2F3]/60 border border-[#F8D2D5] p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Amount to Pay</p>
                  <p className="text-2xl font-black text-[#E2136E] font-mono">৳ {totalAmount}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Reference</p>
                  <p className="text-xs font-bold text-stone-600">Falak Closet Order</p>
                </div>
              </div>

              {/* Merchant number — tap-to-copy chip */}
              <button
                type="button"
                onClick={handleCopyNumber}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2 text-left hover:border-[#E2136E]/40 active:scale-[0.99] transition-all cursor-pointer"
                aria-label={`Copy bKash number ${bkashSettings?.bkashNumber || '01700000005'}`}
              >
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                  Send Money to — {copied ? 'copied ✓' : 'tap to copy'}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-base sm:text-lg font-extrabold text-stone-900 tracking-wide truncate">
                      {bkashSettings?.bkashNumber || '01700000005'}
                    </span>
                    <span className="px-2 py-0.5 bg-[#FDF2F3] text-[#E2136E] border border-[#F8D2D5] rounded text-[9px] font-bold shrink-0">
                      {bkashSettings?.bkashAccountType || 'Personal'}
                    </span>
                  </div>
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-[#E2136E] text-white'}`}>
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  </span>
                </div>
              </button>

              {/* Instructions list */}
              <div className="space-y-2 text-xs">
                <p className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">Instructions:</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-stone-600 font-medium">
                  {bkashSettings?.instructions?.map((inst: string, idx: number) => (
                    <li key={idx} className="leading-relaxed">{inst}</li>
                  )) || (
                      <>
                        <li>Dial *247# or open the bKash App.</li>
                        <li>Choose &quot;Send Money&quot; and enter our number.</li>
                        <li>Enter amount: ৳{totalAmount}.</li>
                        <li>Use your phone number as reference.</li>
                        <li>Confirm transaction and copy the Transaction ID.</li>
                      </>
                    )}
                </ol>
              </div>

              {bkashError && (
                <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold leading-normal">
                  {bkashError}
                </div>
              )}

              {/* Form inputs */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="space-y-1.5">
                  <label htmlFor="bkash-sender" className="text-[11px] font-bold text-stone-700">
                    Your Sender bKash Number <span className="text-[#E2136E]">*</span>
                  </label>
                  <input
                    id="bkash-sender"
                    type="text"
                    required
                    maxLength={11}
                    inputMode="tel"
                    value={bkashSenderNumber}
                    onChange={(e) => setBkashSenderNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 017XXXXXXXX"
                    className="w-full min-h-[44px] px-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#E2136E] focus:border-transparent font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bkash-trx" className="text-[11px] font-bold text-stone-700">
                    bKash Transaction ID (TrxID) <span className="text-[#E2136E]">*</span>
                  </label>
                  <input
                    id="bkash-trx"
                    type="text"
                    required
                    value={bkashTrxId}
                    onChange={(e) => setBkashTrxId(e.target.value.toUpperCase())}
                    placeholder="e.g. ABC123XYZ9"
                    className="w-full min-h-[44px] px-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#E2136E] focus:border-transparent font-mono font-bold uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions — sticky footer, full-width buttons on mobile */}
            <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setIsBkashModalOpen(false)}
                className="min-h-[44px] px-4 bg-stone-200 hover:bg-stone-300 active:scale-95 text-stone-800 rounded-xl font-bold transition-all cursor-pointer"
              >
                Close Gateway
              </button>
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={isSubmitting}
                className="min-h-[44px] px-5 bg-[#E2136E] hover:bg-[#C2105E] active:scale-95 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying payment…' : 'Confirm bKash Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
