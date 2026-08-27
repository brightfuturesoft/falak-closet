'use client';

import React, { useState } from 'react';
import { Edit3, X, Loader2, Save, Phone, MapPin, Home, User } from 'lucide-react';
import { InputField, SelectField } from './fields';
import { useDistrictOptions } from '@/lib/useDistrictOptions';
import type { UserProfile } from '@/app/account/useAccount';

interface AddressTabProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onShowFeedback: (type: 'success' | 'error', message: string) => void;
}

export function AddressTab({ user, onUpdateUser, onShowFeedback }: AddressTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editDistrict, setEditDistrict] = useState(user.district);
  const [editAddress, setEditAddress] = useState(user.fullAddress);
  const [isSaving, setIsSaving] = useState(false);

  const { districts } = useDistrictOptions();

  const startEdit = () => {
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditDistrict(user.district || 'Dhaka');
    setEditAddress(user.fullAddress || '');
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updated: UserProfile = {
      ...user,
      name: editName.trim() || user.name,
      phone: editPhone.trim() || user.phone,
      district: editDistrict || user.district || 'Dhaka',
      fullAddress: editAddress.trim(),
    };

    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updated.name,
          phone: updated.phone,
          district: updated.district,
          fullAddress: updated.fullAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onShowFeedback('error', data.error || 'Failed to update address. Please try again.');
        setIsSaving(false);
        return;
      }
      onUpdateUser(data.user);
      onShowFeedback('success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch {
      onShowFeedback('error', 'Unable to connect. Please check your internet connection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 bg-white rounded-3xl border border-stone-200/70 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif font-bold text-base text-[#0C163A]">Profile & Address</h2>
        {!isEditing && (
          <button
            id="account-edit-address-btn"
            onClick={startEdit}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#D92670]/30 text-[#D92670] rounded-full font-bold text-xs hover:bg-[#D92670] hover:border-[#D92670] hover:text-white transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Full Name"
              value={editName}
              onChange={setEditName}
              placeholder="Your full name"
              required
              icon={User}
            />
            <InputField
              label="Phone Number"
              value={editPhone}
              onChange={setEditPhone}
              placeholder="01XXXXXXXXX"
              required
              icon={Phone}
              inputMode="tel"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="District"
              value={editDistrict}
              onChange={setEditDistrict}
              options={districts}
            />
            <InputField
              label="Full Address"
              value={editAddress}
              onChange={setEditAddress}
              placeholder="House, road, area…"
              icon={Home}
            />
          </div>
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 min-h-[44px] border border-stone-300 text-stone-600 font-bold rounded-full text-xs hover:bg-stone-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              type="submit"
              id="account-save-address-btn"
              disabled={isSaving}
              className="flex-1 min-h-[44px] bg-[#D92670] hover:bg-[#C2185B] text-white font-bold rounded-full text-xs disabled:opacity-60 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#D92670]/25"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-2.5 text-xs">
          <p className="flex items-center gap-2 font-bold text-[#0C163A] text-sm">
            <User className="w-4 h-4 text-[#D92670]" /> {user.name}
          </p>
          {user.fullAddress && (
            <p className="flex items-start gap-2 text-stone-600">
              <Home className="w-4 h-4 text-[#D92670] shrink-0 mt-0.5" /> {user.fullAddress}
            </p>
          )}
          <p className="flex items-center gap-2 text-stone-600 font-medium">
            <MapPin className="w-4 h-4 text-[#D92670]" /> {user.district}, Bangladesh
          </p>
          <p className="flex items-center gap-2 text-stone-600 font-mono">
            <Phone className="w-4 h-4 text-[#D92670]" /> {user.phone || '—'}
          </p>
        </div>
      )}
    </div>
  );
}
