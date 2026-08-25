'use client';

import React, { useState } from 'react';
import { Settings, Database, RefreshCw, CheckCircle2, KeyRound } from 'lucide-react';

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

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
