'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Check,
  Wand2,
  Eye,
  Sparkles,
  Layers,
  DollarSign,
  Package,
  Image as ImageIcon,
  Tag,
  Star,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Pipette,
  Palette
} from 'lucide-react';
import { Product, CATEGORIES, WORK_TYPES, OCCASIONS, MATERIALS, ProductVariation, ProductColor } from '@/data/products';
import { Category, getStoredCategories } from '@/data/categories';
import { FASHION_COLORS_50, autoDetectColor, getColorNameFromHex, ColorOption } from '@/data/colors';
import { formatCurrency } from '@/lib/utils';
import { ImageColorPickerModal } from './ImageColorPickerModal';

export interface DetailedColorVariation {
  id: string;
  name: string;
  hex: string;
  stock?: number;
  images: string[];
  mainImageIndex: number;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (productData: Partial<Product>) => Promise<void>;
  editingProduct?: Product | null;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSaveProduct,
  editingProduct
}: ProductFormModalProps) {
  // Active Wizard Tab (1: Basic, 2: Pricing, 3: Color Variations & Photos, 4: Features & Care)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Abayas',
    subCategory: '',
    price: 0,
    originalPrice: 0,
    workType: 'Embroidery' as typeof WORK_TYPES[number],
    occasion: 'Festive & Eid' as typeof OCCASIONS[number],
    material: 'Nida Silk' as typeof MATERIALS[number],
    stock: 0,
    description: '',
    featuresText: '',
    careText: '',
    isNewArrival: false,
    isBestSeller: false,
    isFlashSale: false
  });

  // Form Validation Errors State (2.1)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Validate a single wizard step (2.1)
  const validateStep = (step: number): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.name.trim()) errors.name = 'Product name is required.';
      if (!formData.description.trim()) errors.description = 'Description is required.';
    }
    if (step === 2) {
      if (!formData.price || formData.price <= 0) errors.price = 'Sale price must be greater than 0.';
      if (!formData.originalPrice || formData.originalPrice <= 0) errors.originalPrice = 'Original price must be greater than 0.';
    }
    if (step === 3) {
      const hasImages = colorVariations.some((c) => c.images.length > 0);
      if (colorVariations.length === 0) errors.colors = 'At least one color variation is required.';
      if (!hasImages) errors.images = 'At least one color variation must have an image.';
    }
    return errors;
  };

  // Validate all steps (2.1)
  const validateAll = (): Record<string, string> => {
    return { ...validateStep(1), ...validateStep(2), ...validateStep(3) };
  };

  // Dynamic Managed Categories & Subcategories State
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.categories)) {
          setAvailableCategories(data.categories);
        } else {
          setAvailableCategories(getStoredCategories());
        }
      })
      .catch(() => {
        setAvailableCategories(getStoredCategories());
      });
  }, []);

  // Color Variations State (Color-wise image arrays)
  const [colorVariations, setColorVariations] = useState<DetailedColorVariation[]>([]);

  // Sizes Selection
  const [selectedSizes, setSelectedSizes] = useState<('S' | 'M' | 'L' | 'XL' | 'XXL' | 'Free Size')[]>([
    'M'
  ]);

  // Size Price Overrides map
  const [sizePriceAdjustments, setSizePriceAdjustments] = useState<Record<string, number>>({});

  // Variation Combinations Matrix (Generated Color x Size items)
  const [variationsMatrix, setVariationsMatrix] = useState<ProductVariation[]>([]);

  // Interactive Eyedropper Modal State
  const [eyedropperImageUrl, setEyedropperImageUrl] = useState<string | null>(null);
  const [eyedropperTargetColorId, setEyedropperTargetColorId] = useState<string | null>(null);

  const handleOpenEyedropperForColor = (colorId: string, imgUrl: string) => {
    setEyedropperTargetColorId(colorId);
    setEyedropperImageUrl(imgUrl);
  };

  // Custom Hex Input State
  const [customHexInput, setCustomHexInput] = useState('#9B050B');
  const [customColorName, setCustomColorName] = useState('Royal Crimson');

  // Live Card Preview Swatch Selection
  const [previewColorIndex, setPreviewColorIndex] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Initial Product Data for Editing
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        category: (editingProduct.category as any) || 'Abayas',
        subCategory: (editingProduct as any).subCategory || '',
        price: editingProduct.price || 0,
        originalPrice: editingProduct.originalPrice || Math.round((editingProduct.price || 0) * 1.25),
        workType: (editingProduct.workType as any) || 'Embroidery',
        occasion: (editingProduct.occasion as any) || 'Festive & Eid',
        material: (editingProduct.material as any) || 'Nida Silk',
        stock: editingProduct.stock ?? 10,
        description: editingProduct.description || 'Luxury modest ensemble.',
        featuresText: (editingProduct.features || []).join('\n'),
        careText: (editingProduct.careInstructions || []).join('\n'),
        // Pre-populate featured flags (2.7)
        isNewArrival: editingProduct.isNewArrival ?? false,
        isBestSeller: editingProduct.isBestSeller ?? false,
        isFlashSale: editingProduct.isFlashSale ?? false
      });

      // Construct color variations array from editing product (2.8 - fixed broken Unsplash URL)
      const FALLBACK_IMG = 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80';
      if (editingProduct.colors && editingProduct.colors.length > 0) {
        const constructed: DetailedColorVariation[] = editingProduct.colors.map((c, i) => {
          const colorImages = editingProduct.images && editingProduct.images.length > 0
            ? [editingProduct.images[c.imageIndex || i % editingProduct.images.length] || editingProduct.images[0]]
            : [FALLBACK_IMG];

          return {
            id: `col-${Date.now()}-${i}-${Math.random()}`,
            name: c.name,
            hex: c.hex,
            images: (c as any).images || colorImages,
            mainImageIndex: 0
          };
        });
        setColorVariations(constructed);
      } else {
        // Default initial color variation (2.8 - fixed broken Unsplash URL)
        setColorVariations([
          {
            id: `col-${Date.now()}`,
            name: 'Royal Crimson',
            hex: '#9B050B',
            images: editingProduct.images || [FALLBACK_IMG],
            mainImageIndex: 0
          }
        ]);
      }

      if (editingProduct.sizes && editingProduct.sizes.length > 0) {
        setSelectedSizes(editingProduct.sizes as any);
      }
      if (editingProduct.variations && editingProduct.variations.length > 0) {
        setVariationsMatrix(editingProduct.variations);
      }
    } else {
      setFormData({
        name: '',
        category: 'Abayas',
        subCategory: '',
        price: 0,
        originalPrice: 0,
        workType: 'Embroidery',
        occasion: 'Festive & Eid',
        material: 'Nida Silk',
        stock: 0,
        description: '',
        featuresText: '',
        careText: '',
        isNewArrival: false,
        isBestSeller: false,
        isFlashSale: false
      });
      setColorVariations([
        {
          id: `col-${Date.now()}`,
          name: 'Emerald Green',
          hex: '#0B6623',
          images: [],
          mainImageIndex: 0
        }
      ]);
      setSelectedSizes(['M']);
      setFormErrors({});
    }
  }, [editingProduct, isOpen]);

  // Update auto-detected color name when custom Hex input changes (e.g. #fff -> Pure White, #000 -> Midnight Black)
  const handleHexInputChange = (rawHex: string) => {
    setCustomHexInput(rawHex);
    if (rawHex.length >= 4) {
      const resolved = getColorNameFromHex(rawHex);
      setCustomColorName(resolved.name);
    }
  };

  // Re-generate variation combinations matrix whenever colorVariations or sizes change
  useEffect(() => {
    const matrix: ProductVariation[] = [];
    colorVariations.forEach((c) => {
      selectedSizes.forEach((sz) => {
        const existing = variationsMatrix.find(
          (v) => v.colorName === c.name && v.size === sz
        );
        const mappedImage = c.images[c.mainImageIndex || 0] || c.images[0] || '';

        matrix.push({
          id: existing?.id || `var-${c.name}-${sz}-${Date.now()}`,
          colorName: c.name,
          colorHex: c.hex,
          size: sz,
          stock: existing?.stock ?? 5,
          priceOverride: sizePriceAdjustments[sz] ? formData.price + sizePriceAdjustments[sz] : undefined,
          imageUrl: mappedImage
        });
      });
    });
    setVariationsMatrix(matrix);
  }, [colorVariations, selectedSizes, formData.price, sizePriceAdjustments]);

  if (!isOpen) return null;

  // Add a Color Variation from Preset or Eyedropper or Custom Hex
  const handleAddColorVariation = (name: string, hex: string, defaultImage?: string) => {
    const exists = colorVariations.some((c) => c.name.toLowerCase() === name.toLowerCase());
    if (exists) return;

    setColorVariations((prev) => [
      ...prev,
      {
        id: `col-${Date.now()}-${Math.random()}`,
        name,
        hex,
        images: defaultImage ? [defaultImage] : [],
        mainImageIndex: 0
      }
    ]);
  };

  // Remove Color Variation
  const handleRemoveColorVariation = (id: string) => {
    if (colorVariations.length === 1) return; // Keep at least 1 color variation
    setColorVariations((prev) => prev.filter((c) => c.id !== id));
  };

  // Update Color Variation Name inline
  const handleUpdateColorName = (id: string, name: string) => {
    setColorVariations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c))
    );
  };

  // Update Color Variation Hex Code inline
  const handleUpdateColorHex = (id: string, hex: string) => {
    setColorVariations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, hex } : c))
    );
  };

  // Update Color Variation Stock Quantity inline
  const handleUpdateColorStock = (id: string, stock: number) => {
    setColorVariations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stock } : c))
    );
  };

  // Append new empty Color Variation card when clicking [ Add More ]
  const handleAddNewColorRow = () => {
    const defaultColors = [
      { name: 'Obsidian Black', hex: '#0B0B0B' },
      { name: 'Emerald Green', hex: '#0B6623' },
      { name: 'Royal Crimson', hex: '#9B050B' },
      { name: 'Champagne Gold', hex: '#F7E7CE' },
      { name: 'Midnight Navy', hex: '#00052C' },
      { name: 'Dusty Rose', hex: '#DCAE96' }
    ];
    const unused = defaultColors.find(
      (dc) => !colorVariations.some((c) => c.name.toLowerCase() === dc.name.toLowerCase())
    ) || { name: `New Color ${colorVariations.length + 1}`, hex: '#9B050B' };

    setColorVariations((prev) => [
      ...prev,
      {
        id: `col-${Date.now()}-${Math.random()}`,
        name: unused.name,
        hex: unused.hex,
        stock: 10,
        images: [],
        mainImageIndex: 0
      }
    ]);
  };

  // Upload images specifically for a Color Variation
  const handleColorFileUpload = (colorId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImg = event.target.result as string;
          setColorVariations((prev) =>
            prev.map((c) => (c.id === colorId ? { ...c, images: [...c.images, newImg] } : c))
          );
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Add Image URL to a specific Color Variation
  const handleAddColorImageUrl = (colorId: string, url: string) => {
    if (!url.trim()) return;
    setColorVariations((prev) =>
      prev.map((c) => (c.id === colorId ? { ...c, images: [...c.images, url.trim()] } : c))
    );
  };

  // Remove image from specific Color Variation
  const handleRemoveColorImage = (colorId: string, imgIdx: number) => {
    setColorVariations((prev) =>
      prev.map((c) => {
        if (c.id !== colorId) return c;
        const newImgs = c.images.filter((_, i) => i !== imgIdx);
        const newMainIdx = c.mainImageIndex >= imgIdx && c.mainImageIndex > 0 ? c.mainImageIndex - 1 : 0;
        return { ...c, images: newImgs, mainImageIndex: newMainIdx };
      })
    );
  };

  // Set cover photo for a specific Color Variation
  const handleSetColorMainImage = (colorId: string, imgIdx: number) => {
    setColorVariations((prev) =>
      prev.map((c) => (c.id === colorId ? { ...c, mainImageIndex: imgIdx } : c))
    );
  };

  // Handle Eyedropper Selection from Image Color Picker Modal
  const handleEyedropperColorSelected = (name: string, hex: string) => {
    if (eyedropperTargetColorId) {
      // Update existing variation card with sampled color data
      setColorVariations((prev) =>
        prev.map((c) => (c.id === eyedropperTargetColorId ? { ...c, name, hex } : c))
      );
    } else {
      handleAddColorVariation(name, hex, eyedropperImageUrl || undefined);
    }
    setEyedropperTargetColorId(null);
    setEyedropperImageUrl(null);
  };

  const toggleSize = (sz: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Free Size') => {
    setSelectedSizes((prev) => {
      if (prev.includes(sz)) return prev.filter((s) => s !== sz);
      return [...prev, sz];
    });
  };

  const handleVariationStockChange = (varId: string, newStock: number) => {
    setVariationsMatrix((prev) =>
      prev.map((v) => (v.id === varId ? { ...v, stock: newStock } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 2.3 — Validate all steps before final submission
    const allErrors = validateAll();
    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      // Navigate to first step with errors
      if (allErrors.name || allErrors.description) setWizardStep(1);
      else if (allErrors.price || allErrors.originalPrice) setWizardStep(2);
      else if (allErrors.colors || allErrors.images) setWizardStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      // Aggregate all images across all color variations for global product images array
      const allAggregatedImages: string[] = [];
      colorVariations.forEach((c) => {
        if (c.images.length > 0) {
          const cover = c.images[c.mainImageIndex || 0] || c.images[0];
          if (!allAggregatedImages.includes(cover)) {
            allAggregatedImages.push(cover);
          }
          c.images.forEach((img) => {
            if (!allAggregatedImages.includes(img)) {
              allAggregatedImages.push(img);
            }
          });
        }
      });

      // Map color variations for storing in DB
      const formattedColors: ProductColor[] = colorVariations.map((c, i) => ({
        name: c.name,
        hex: c.hex,
        imageIndex: i,
        images: c.images
      })) as any;

      const features = formData.featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const careInstructions = formData.careText
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean);

      const totalStockFromMatrix = variationsMatrix.reduce((sum, v) => sum + v.stock, 0);

      // 2.4 — Auto-compute discountPercentage
      const computedDiscount = formData.originalPrice > formData.price && formData.originalPrice > 0
        ? Math.round((1 - formData.price / formData.originalPrice) * 100)
        : 0;

      // 2.6 — Include featured flags and discountPercentage in payload
      await onSaveProduct({
        ...formData,
        isNewArrival: formData.isNewArrival,
        isBestSeller: formData.isBestSeller,
        isFlashSale: formData.isFlashSale,
        discountPercentage: computedDiscount,
        colors: formattedColors,
        sizes: selectedSizes,
        images: allAggregatedImages.length > 0 ? allAggregatedImages : ['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80'],
        variations: variationsMatrix,
        stock: totalStockFromMatrix > 0 ? totalStockFromMatrix : formData.stock,
        features,
        careInstructions
      });
      onClose();
    } catch {
      // Handled upstream
    } finally {
      setIsSubmitting(false);
    }
  };

  const discountPercentage = Math.round(
    ((formData.originalPrice - formData.price) / formData.originalPrice) * 100
  );

  // Determine cover image for live preview
  const currentPreviewColor = colorVariations[previewColorIndex] || colorVariations[0];
  const livePreviewImage = currentPreviewColor?.images[currentPreviewColor?.mainImageIndex || 0] || currentPreviewColor?.images[0] || 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-6xl w-full p-4 sm:p-6 lg:p-8 space-y-6 max-h-[95vh] overflow-y-auto shadow-2xl relative text-stone-900">

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#9B050B]/10 text-[#9B050B] rounded-xl border border-[#9B050B]/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900">
                {editingProduct ? 'Edit Product Item' : 'Color-Wise Variation & Product Builder'}
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                Upload images color-wise, pick color hex/name from photos with Eyedropper, & build size matrix
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-stone-100 border border-stone-200 rounded-xl text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-200 text-xs font-bold scrollbar-none">
          {[
            { step: 1, label: '1. Basic Info', icon: Package },
            { step: 2, label: '2. Pricing & Stock', icon: DollarSign },
            { step: 3, label: '3. Color Variations & Photos', icon: ImageIcon },
            { step: 4, label: '4. Features & Care', icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = wizardStep === tab.step;
            return (
              <button
                key={tab.step}
                onClick={() => setWizardStep(tab.step as any)}
                className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${isActive
                  ? 'bg-stone-900 text-white shadow-sm font-bold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Split Screen Layout: Form Controls (Left) + Live Storefront Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column (7 cols): Step Form Controls */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6 text-xs font-sans">

              {/* STEP 1: BASIC INFO */}
              {wizardStep === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700">Product Title / Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) setFormErrors((prev) => { const n = { ...prev }; delete n.name; return n; });
                      }}
                      placeholder="e.g. Royal Emerald Silk Embroidered Abaya"
                      className={`w-full px-4 py-3 bg-stone-50 border rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                        formErrors.name ? 'border-rose-400 ring-1 ring-rose-400' : 'border-stone-200'
                      }`}
                    />
                    {formErrors.name && <p className="text-[11px] text-rose-600 font-medium">{formErrors.name}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-stone-700">Main Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          const newCatName = e.target.value;
                          const matchedCat = availableCategories.find(c => c.name.toLowerCase() === newCatName.toLowerCase() || c.slug.toLowerCase() === newCatName.toLowerCase());
                          const defaultSub = matchedCat?.subCategories[0]?.name || '';
                          setFormData({ ...formData, category: newCatName, subCategory: defaultSub });
                        }}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-stone-900"
                      >
                        {availableCategories.length > 0 ? (
                          availableCategories.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))
                        ) : (
                          CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-stone-700">Subcategory</label>
                      <select
                        value={formData.subCategory}
                        onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-stone-900"
                      >
                        <option value="">-- Select Subcategory (Optional) --</option>
                        {(() => {
                          const currentCatObj = availableCategories.find(
                            (c) => c.name.toLowerCase() === formData.category.toLowerCase() || c.slug.toLowerCase() === formData.category.toLowerCase()
                          );
                          return (currentCatObj?.subCategories || []).map((sub) => (
                            <option key={sub.id} value={sub.name}>{sub.name}</option>
                          ));
                        })()}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-stone-700">Material Fabric</label>
                      <select
                        value={formData.material}
                        onChange={(e) => setFormData({ ...formData, material: e.target.value as any })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                      >
                        {MATERIALS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-stone-700">Work Type & Detailing</label>
                      <select
                        value={formData.workType}
                        onChange={(e) => setFormData({ ...formData, workType: e.target.value as any })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                      >
                        {WORK_TYPES.map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-stone-700">Target Occasion</label>
                      <select
                        value={formData.occasion}
                        onChange={(e) => setFormData({ ...formData, occasion: e.target.value as any })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                      >
                        {OCCASIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700">Detailed Description *</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value });
                        if (formErrors.description) setFormErrors((prev) => { const n = { ...prev }; delete n.description; return n; });
                      }}
                      className={`w-full px-4 py-3 bg-stone-50 border rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                        formErrors.description ? 'border-rose-400 ring-1 ring-rose-400' : 'border-stone-200'
                      }`}
                    />
                    {formErrors.description && <p className="text-[11px] text-rose-600 font-medium">{formErrors.description}</p>}
                  </div>
                </div>
              )}

              {/* STEP 2: PRICING & INVENTORY */}
              {wizardStep === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-stone-700">Regular Sale Price (৳ BDT) *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={formData.price || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, price: Number(e.target.value) });
                          if (formErrors.price) setFormErrors((prev) => { const n = { ...prev }; delete n.price; return n; });
                        }}
                        className={`w-full px-4 py-3 bg-stone-50 border rounded-xl text-[#9B050B] font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                          formErrors.price ? 'border-rose-400 ring-1 ring-rose-400' : 'border-stone-200'
                        }`}
                      />
                      {formErrors.price && <p className="text-[11px] text-rose-600 font-medium">{formErrors.price}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-stone-700">Original Price (৳ BDT) *</label>
                      <input
                        type="number"
                        value={formData.originalPrice || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, originalPrice: Number(e.target.value) });
                          if (formErrors.originalPrice) setFormErrors((prev) => { const n = { ...prev }; delete n.originalPrice; return n; });
                        }}
                        className={`w-full px-4 py-3 bg-stone-50 border rounded-xl text-stone-700 font-mono text-base focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                          formErrors.originalPrice ? 'border-rose-400 ring-1 ring-rose-400' : 'border-stone-200'
                        }`}
                      />
                      {formErrors.originalPrice && <p className="text-[11px] text-rose-600 font-medium">{formErrors.originalPrice}</p>}
                    </div>
                  </div>

                  {/* 2.4 — Auto-computed discount badge */}
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-bold">Calculated Savings Badge:</span>
                    <span className="px-3 py-1 bg-[#9B050B] text-white rounded-full font-bold font-mono">
                      {discountPercentage > 0 ? `${discountPercentage}% OFF` : 'No Discount'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700">Default Total Stock Quantity</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                    <p className="text-[10px] text-stone-500">
                      Note: Setting color/size variation stock in Step 4 automatically updates the total stock.
                    </p>
                  </div>

                  {/* 2.5 — Featured Flags toggles */}
                  <div className="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
                    <p className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">Featured Flags</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {([
                        { key: 'isNewArrival', label: '🆕 New Arrival', color: 'emerald' },
                        { key: 'isBestSeller', label: '⭐ Best Seller', color: 'amber' },
                        { key: 'isFlashSale', label: '⚡ Flash Sale', color: 'rose' }
                      ] as const).map(({ key, label, color }) => {
                        const isActive = formData[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, [key]: !prev[key] }))}
                            className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer font-bold text-xs ${
                              isActive
                                ? color === 'emerald'
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                  : color === 'amber'
                                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                                  : 'border-rose-500 bg-rose-50 text-rose-800'
                                : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-400'
                            }`}
                          >
                            <span>{label}</span>
                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isActive ? 'bg-current border-current' : 'border-stone-300'
                            }`}>
                              {isActive && <span className="w-2 h-2 rounded-full bg-white" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: COLOR-WISE VARIATION & IMAGE UPLOAD */}
              {wizardStep === 3 && (
                <div className="space-y-6 animate-in fade-in">


                  {/* 2. Color Variations Cards matching exact wireframe sketch */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-stone-900 text-sm">
                        Color Variations ({colorVariations.length})
                      </label>
                      <span className="text-xs text-stone-500 font-mono">
                        Fill Color Name, Code & Stock for each variant
                      </span>
                    </div>

                    {colorVariations.map((colorVar, cIdx) => (
                      <div
                        key={colorVar.id}
                        className="p-4 sm:p-5 bg-white border-2 border-stone-800 rounded-3xl shadow-sm space-y-4 relative group"
                      >
                        {/* Card Layout: Left Square Image Box + Right Inputs (Color Name, Color Code, Stock Quantity) */}
                        <div className="grid grid-cols-12 gap-4 items-start">

                          {/* Left: Rounded Square Image Thumbnail & Uploader */}
                          <div className="col-span-12 sm:col-span-4 space-y-2">
                            <div className="relative aspect-square w-full rounded-2xl border-2 border-dashed border-stone-400 bg-stone-50 overflow-hidden flex flex-col items-center justify-center text-center group/img hover:border-stone-900 transition-all">
                              {colorVar.images.length > 0 ? (
                                <>
                                  <Image
                                    src={colorVar.images[colorVar.mainImageIndex || 0] || colorVar.images[0]}
                                    alt={colorVar.name}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                    <span className="text-[11px] font-mono font-bold text-white bg-stone-900/80 px-2 py-0.5 rounded-md">
                                      {colorVar.images.length} Photos
                                    </span>
                                    <label className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-900 text-xs font-black rounded-xl cursor-pointer shadow-md transition-transform active:scale-95">
                                      Upload More
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => handleColorFileUpload(colorVar.id, e)}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                </>
                              ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-stone-100/80 transition-colors">
                                  <Upload className="w-7 h-7 text-[#9B050B] mb-1" />
                                  <span className="font-extrabold text-xs text-stone-900">Upload Image</span>
                                  <span className="text-[10px] text-stone-500 font-mono">Click to browse</span>
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handleColorFileUpload(colorVar.id, e)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>

                          </div>

                          {/* Right: Color Name, Color Code, Stock Quantity */}
                          <div className="col-span-12 sm:col-span-8 space-y-3">
                            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                              <span className="text-xs font-black text-stone-900 font-mono uppercase tracking-wider">
                                Color Variant #{cIdx + 1}
                              </span>
                              {colorVariations.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColorVariation(colorVar.id)}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                  title="Remove Color Variant"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {/* 1. Color Name */}
                            <div className="space-y-1">
                              <label className="font-extrabold text-stone-900 text-xs flex items-center justify-between">
                                <span>Color Name</span>
                                <span className="text-[10px] text-stone-400 font-normal font-sans">(e.g. Obsidian Black)</span>
                              </label>
                              <input
                                type="text"
                                value={colorVar.name}
                                onChange={(e) => handleUpdateColorName(colorVar.id, e.target.value)}
                                placeholder="Color Name"
                                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-serif font-bold text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                              />
                            </div>

                            {/* 2. Color Code */}
                            <div className="space-y-1">
                              <label className="font-extrabold text-stone-900 text-xs flex items-center justify-between">
                                <span>Color Code</span>
                                <span className="text-[10px] text-stone-400 font-normal font-mono">(Hex Code)</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-stone-400 shadow-2xs shrink-0">
                                  <input
                                    type="color"
                                    value={colorVar.hex}
                                    onChange={(e) => handleUpdateColorHex(colorVar.id, e.target.value)}
                                    className="absolute -inset-2 w-14 h-14 cursor-pointer"
                                  />
                                </div>
                                <input
                                  type="text"
                                  value={colorVar.hex}
                                  onChange={(e) => handleUpdateColorHex(colorVar.id, e.target.value)}
                                  placeholder="Color Code (#000000)"
                                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 uppercase"
                                />
                                {colorVar.images.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEyedropperForColor(colorVar.id, colorVar.images[0])}
                                    className="p-2.5 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 rounded-xl border border-stone-300 transition-colors shrink-0 cursor-pointer"
                                    title="Pick exact color hex from photo to update this color variation"
                                  >
                                    <Pipette className="w-4 h-4 text-amber-600" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* 3. Stock Quantity */}
                            <div className="space-y-1">
                              <label className="font-extrabold text-stone-900 text-xs flex items-center justify-between">
                                <span>Stock Quantity</span>
                                <span className="text-[10px] text-stone-400 font-normal font-mono">(Units in stock)</span>
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={colorVar.stock ?? 10}
                                onChange={(e) => handleUpdateColorStock(colorVar.id, Number(e.target.value))}
                                placeholder="Stock Quantity"
                                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Extra Photo Thumbnails Row */}
                        {colorVar.images.length > 1 && (
                          <div className="pt-3 border-t border-stone-200 space-y-1.5">
                            <span className="text-[10px] font-bold text-stone-500 font-mono">
                              Gallery Photos ({colorVar.images.length} photos uploaded)
                            </span>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {colorVar.images.map((img, imgIdx) => {
                                const isMain = colorVar.mainImageIndex === imgIdx;
                                return (
                                  <div
                                    key={imgIdx}
                                    className={`relative w-14 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 group ${isMain ? 'border-amber-500 ring-2 ring-amber-400/40' : 'border-stone-300'
                                      }`}
                                  >
                                    <Image src={img} alt={`${colorVar.name} ${imgIdx}`} fill className="object-cover" />
                                    {isMain ? (
                                      <div className="absolute top-0.5 left-0.5 px-1 bg-amber-400 text-stone-950 font-black text-[7px] rounded">
                                        Cover
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSetColorMainImage(colorVar.id, imgIdx)}
                                        className="absolute inset-0 bg-stone-900/60 text-white font-bold text-[8px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                      >
                                        Cover
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveColorImage(colorVar.id, imgIdx)}
                                      className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded z-10"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Bottom Button matching user wireframe: [ Add More ] */}
                    <button
                      type="button"
                      onClick={handleAddNewColorRow}
                      className="px-6 py-3 bg-white hover:bg-stone-50 text-stone-900 border-2 border-stone-900 font-black text-xs sm:text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 hover:shadow-md"
                    >
                      <Plus className="w-4 h-4 text-[#9B050B]" />
                      <span>Add More</span>
                    </button>
                  </div>

                </div>
              )}

              {/* STEP 4: FEATURES & CARE */}
              {wizardStep === 4 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700">Key Features (One per line)</label>
                    <textarea
                      rows={4}
                      value={formData.featuresText}
                      onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                      placeholder="Premium modest tailoring&#10;Breathable fabric&#10;Includes matching scarf"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700">Care Instructions (One per line)</label>
                    <textarea
                      rows={4}
                      value={formData.careText}
                      onChange={(e) => setFormData({ ...formData, careText: e.target.value })}
                      placeholder="Dry clean recommended&#10;Steam iron on low heat"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>
              )}

              {/* Wizard Navigation Footer */}
              <div className="pt-4 flex items-center justify-between border-t border-stone-200">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((wizardStep - 1) as any)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous Step
                  </button>
                ) : <div />}

                {wizardStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      // 2.2 — Validate current step before advancing
                      const stepErrors = validateStep(wizardStep);
                      if (Object.keys(stepErrors).length > 0) {
                        setFormErrors((prev) => ({ ...prev, ...stepErrors }));
                        return;
                      }
                      setWizardStep((wizardStep + 1) as any);
                    }}
                    className="px-5 py-2.5 bg-stone-900 text-white font-extrabold rounded-xl hover:bg-stone-800 flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    Next Step <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#9B050B] to-[#C71B20] text-white font-black rounded-xl shadow-lg hover:from-[#B8000A] hover:to-[#E0242A] cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving Item...' : editingProduct ? 'Update Product Item' : 'Publish Product to Store'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Column (5 cols): Real-Time Live Product Storefront Preview */}
          <div className="lg:col-span-5 space-y-4 bg-stone-50 p-5 rounded-3xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-stone-900" /> Live Storefront Card Preview
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">Real-Time Sync</span>
            </div>

            {/* Rendered Live Card */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm space-y-3">
              <div className="relative aspect-[3/4] bg-stone-100">
                <Image
                  src={livePreviewImage}
                  alt={formData.name || 'Product Cover'}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 border border-stone-200 rounded-full text-[10px] font-bold text-stone-900">
                  {formData.category}
                </div>
                {discountPercentage > 0 && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#9B050B] text-white font-bold text-[10px] rounded-full font-mono">
                    {discountPercentage}% OFF
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm line-clamp-1">
                    {formData.name || 'Sample Product Title'}
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {formData.material} • {formData.workType}
                  </p>
                </div>

                {/* Color Swatches with Interactive Click to Switch Preview Photo */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 font-bold uppercase">Color Swatches:</span>
                    <span className="text-[10px] text-stone-700 font-bold">{currentPreviewColor?.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {colorVariations.map((c, idx) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setPreviewColorIndex(idx)}
                        className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${previewColorIndex === idx ? 'ring-2 ring-stone-900 scale-110 border-white' : 'border-stone-300'
                          }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Pills */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">Sizes:</span>
                  {selectedSizes.map((s) => (
                    <span key={s} className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 text-[10px] rounded font-mono font-bold text-stone-800">
                      {s}
                    </span>
                  ))}
                </div>

                {/* Price & Stock */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-base font-black text-stone-900">
                      {formatCurrency(formData.price)}
                    </span>
                    {formData.originalPrice > formData.price && (
                      <span className="ml-2 text-xs text-stone-400 line-through">
                        {formatCurrency(formData.originalPrice)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    In Stock ({variationsMatrix.reduce((sum, v) => sum + v.stock, 0) || formData.stock})
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Eyedropper Modal */}
      {eyedropperImageUrl && (
        <ImageColorPickerModal
          isOpen={!!eyedropperImageUrl}
          onClose={() => setEyedropperImageUrl(null)}
          imageUrl={eyedropperImageUrl}
          onSelectColor={handleEyedropperColorSelected}
        />
      )}
    </div>
  );
}
