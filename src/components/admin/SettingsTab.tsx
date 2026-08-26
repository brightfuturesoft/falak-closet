'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Database, RefreshCw, CheckCircle2, KeyRound, CloudUpload } from 'lucide-react';
import { uploadImages } from '@/lib/cloudinary';
import type { Product } from '@/data/products';

interface SettingsTabProps {
  dbSource: string;
  onSeedDatabase: () => Promise<void>;
  isSeeding: boolean;
  seedResult: string | null;
}

export function SettingsTab({
  dbSource,
  onSeedDatabase,
  isSeeding,
  seedResult
}: SettingsTabProps) {
  const [currencySymbol, setCurrencySymbol] = useState('৳ BDT');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(5000);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // bKash manual payment settings state
  const [bkashNumber, setBkashNumber] = useState('');
  const [bkashAccountType, setBkashAccountType] = useState('Personal');
  const [bkashInstructions, setBkashInstructions] = useState('');
  const [isSavingBkash, setIsSavingBkash] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const fetchBkashSettings = async () => {
    try {
      const res = await fetch('/api/settings?key=payment');
      const data = await res.json();
      if (data.success && data.setting) {
        const val = data.setting.value;
        setBkashNumber(val.bkashNumber || '');
        setBkashAccountType(val.bkashAccountType || 'Personal');
        setBkashInstructions(Array.isArray(val.instructions) ? val.instructions.join('\n') : '');
      }
    } catch (e) {
      console.error('Failed to load bkash settings:', e);
    }
  };

  useEffect(() => {
    fetchBkashSettings();
  }, []);

  const handleSaveBkashSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^01\d{9}$/.test(bkashNumber.trim())) {
      setSettingsError('bKash number must be an 11-digit number starting with 01');
      return;
    }

    setIsSavingBkash(true);
    setSettingsError(null);
    setSettingsSavedSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'payment',
          value: {
            bkashNumber: bkashNumber.trim(),
            bkashAccountType,
            instructions: bkashInstructions.split('\n').map(l => l.trim()).filter(Boolean)
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSavedSuccess(true);
        setTimeout(() => setSettingsSavedSuccess(false), 3000);
      } else {
        setSettingsError(data.error || 'Failed to save settings.');
      }
    } catch {
      setSettingsError('Network error — failed to save settings.');
    } finally {
      setIsSavingBkash(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // ── One-time base64 → Cloudinary migration ─────────────────────────────
  // Products saved before the Cloudinary integration may still carry base64
  // `data:` image strings (MongoDB bloat). This utility re-uploads them and
  // rewrites the URLs. Idempotent — already-remote URLs are skipped.
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState<string | null>(null);

  const dataUrlToFile = async (dataUrl: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = blob.type.split('/')[1] || 'jpg';
    return new File([blob], `legacy-${Date.now()}.${ext}`, { type: blob.type });
  };

  const handleMigrateImages = async () => {
    if (isMigrating) return; // in-flight guard against double-runs
    if (
      !confirm(
        'Upload every embedded (base64) product image to Cloudinary and replace the stored URLs?\nAlready-remote images are skipped. This may take a while.'
      )
    )
      return;

    setIsMigrating(true);
    setMigrationSummary(null);
    let productsTouched = 0;
    let imagesMoved = 0;
    const failures: string[] = [];

    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      const products: Product[] = data.products || [];

      for (const product of products) {
        const hasLegacy =
          product.images.some((i) => i.startsWith('data:')) ||
          product.colors.some((c) => (c.images || []).some((i) => i.startsWith('data:')));
        if (!hasLegacy) continue;

        try {
          let moved = 0;

          const mainImages: string[] = [];
          for (const img of product.images) {
            if (img.startsWith('data:')) {
              const [uploaded] = await uploadImages(
                await dataUrlToFile(img),
                'products/migrated'
              );
              mainImages.push(uploaded.url);
              moved++;
            } else {
              mainImages.push(img);
            }
          }

          const colors = [];
          for (const color of product.colors) {
            const colorImages: string[] = [];
            for (const img of color.images || []) {
              if (img.startsWith('data:')) {
                const [uploaded] = await uploadImages(
                  await dataUrlToFile(img),
                  'products/migrated'
                );
                colorImages.push(uploaded.url);
                moved++;
              } else {
                colorImages.push(img);
              }
            }
            colors.push({ ...color, images: colorImages });
          }

          const update = await fetch(`/api/products/${product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: mainImages, colors }),
          });
          if (!update.ok) throw new Error(`HTTP ${update.status}`);

          productsTouched++;
          imagesMoved += moved;
        } catch (err) {
          console.warn('[migration] product failed:', product.name, err);
          failures.push(product.name);
        }
      }

      setMigrationSummary(
        `Done — ${imagesMoved} image(s) moved across ${productsTouched} product(s).` +
          (failures.length ? ` Failed: ${failures.join(', ')}.` : '')
      );
    } catch {
      setMigrationSummary('Migration failed — could not load the product list.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl text-stone-900">
      {/* DB Connection & Seeder Card */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <span>MongoDB Database Engine</span>
            </h3>
            <p className="text-xs text-stone-500">
              Live connection status and database re-seeder controls
            </p>
          </div>

          <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-mono text-emerald-800 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            {dbSource === 'mongodb' ? 'Connected to Mongo Daemon' : 'Local Static Mode'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <span className="text-stone-500 text-[10px] uppercase font-bold">Connection String</span>
            <p className="text-stone-900 font-bold truncate">mongodb://localhost:27017</p>
          </div>
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <span className="text-stone-500 text-[10px] uppercase font-bold">Database Name</span>
            <p className="text-stone-900 font-bold">falak-closet</p>
          </div>
        </div>

        {/* Database Seeder Button */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-stone-900 text-xs">Reset / Seed Sample Modest Fashion Dataset</p>
            <p className="text-[11px] text-stone-500">
              Populates MongoDB with sample Abayas, Kaftans, Hijabs, and Promotions.
            </p>
          </div>

          <button
            onClick={onSeedDatabase}
            disabled={isSeeding}
            className="px-4 py-2.5 bg-[#9B050B] hover:bg-[#B8000A] text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Seeding MongoDB...' : 'Seed Database Now'}</span>
          </button>
        </div>

        {seedResult && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold">
            {seedResult}
          </div>
        )}
      </div>

      {/* General Store Settings Form */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div className="pb-4 border-b border-stone-200">
          <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-stone-900" />
            <span>Store Configuration</span>
          </h3>
          <p className="text-xs text-stone-500">Manage currency formatting and free shipping threshold.</p>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Store configuration updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Default Store Currency</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Free Shipping Threshold (৳ BDT)</label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* bKash Payment Settings */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div className="pb-4 border-b border-stone-200">
          <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
            <span className="w-5 h-5 bg-[#E2136E] text-white flex items-center justify-center rounded font-sans text-[10px] font-bold">b</span>
            <span>bKash Payment Settings</span>
          </h3>
          <p className="text-xs text-stone-500">Configure manual payment number, account type, and instructions.</p>
        </div>

        {settingsSavedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>bKash settings saved successfully!</span>
          </div>
        )}

        {settingsError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold">
            {settingsError}
          </div>
        )}

        <form onSubmit={handleSaveBkashSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">bKash Mobile Number *</label>
              <input
                type="text"
                required
                value={bkashNumber}
                onChange={(e) => setBkashNumber(e.target.value)}
                placeholder="e.g. 017XXXXXXXX"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Account Type</label>
              <select
                value={bkashAccountType}
                onChange={(e) => setBkashAccountType(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 font-bold"
              >
                <option value="Personal">Personal</option>
                <option value="Agent">Agent</option>
                <option value="Merchant">Merchant</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-stone-700">Payment Instructions (one step per line)</label>
            <textarea
              rows={5}
              value={bkashInstructions}
              onChange={(e) => setBkashInstructions(e.target.value)}
              placeholder="Enter instructions, one step per line"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingBkash}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSavingBkash ? 'Saving settings...' : 'Save bKash Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Cloudinary Image Migration */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div className="pb-4 border-b border-stone-200">
          <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
            <CloudUpload className="w-5 h-5 text-[#9B050B]" />
            <span>Cloudinary Image Storage</span>
          </h3>
          <p className="text-xs text-stone-500">
            New uploads already go to Cloudinary. Use this once to move old embedded (base64)
            product photos out of MongoDB.
          </p>
        </div>

        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-stone-900 text-xs">Migrate Product Images to Cloudinary</p>
            <p className="text-[11px] text-stone-500">
              Idempotent — products whose images are already remote URLs are skipped.
            </p>
          </div>

          <button
            onClick={handleMigrateImages}
            disabled={isMigrating}
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <CloudUpload className={`w-4 h-4 ${isMigrating ? 'animate-bounce' : ''}`} />
            <span>{isMigrating ? 'Migrating…' : 'Start Migration'}</span>
          </button>
        </div>

        {migrationSummary && (
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-bold">
            {migrationSummary}
          </div>
        )}
      </div>

      {/* Admin Security Credentials Card */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
            <KeyRound className="w-4 h-4 text-stone-900" />
            <span>Admin Authentication Protocol</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 font-bold">2FA Ready</span>
        </div>
        <p className="text-xs text-stone-500">
          Admin Portal authentication is protected with local session token validation. Demo username: <strong className="text-stone-900">admin</strong> / Password: <strong className="text-stone-900">falak123</strong>.
        </p>
      </div>
    </div>
  );
}
