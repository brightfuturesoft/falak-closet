'use client';

import React, { useState } from 'react';
import { Edit3, X, Loader2, Save, Phone } from 'lucide-react';
import { InputField } from './fields';
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
    <div className="p-5 bg-white rounded-3xl border border-[#F2C76E]/60 space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <h2 className="font-serif font-bold text-base text-[#0C163A]">Profile & Address</h2>
        {!isEditing && (
          <button
            id="account-edit-address-btn"
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#9B050B]/30 text-[#9B050B] rounded-full font-bold hover:bg-[#9B050B]/5 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <InputField
            label="Full Name"
            value={editName}
            onChange={setEditName}
            placeholder="Your full name"
            required
          />
          <InputField
            label="Phone Number"
            value={editPhone}
            onChange={setEditPhone}
            placeholder="01XXXXXXXXX"
            required
          />
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#0C163A]/70">
              District
            </label>
            <select
              value={editDistrict}
              onChange={e => setEditDistrict(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/70 rounded-xl text-[#0C163A] text-xs focus:outline-none focus:ring-2 focus:ring-[#9B050B]/25"
            >
              {districts.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <InputField
            label="Full Address"
            value={editAddress}
            onChange={setEditAddress}
            placeholder="House, road, area..."
          />
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2.5 border border-stone-300 text-stone-600 font-bold rounded-full text-xs hover:bg-stone-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              type="submit"
              id="account-save-address-btn"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-[#9B050B] text-[#FFFBF0] font-bold rounded-full text-xs hover:bg-[#B8000A] disabled:opacity-60 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
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
        <div className="p-4 bg-[#FFFBF0] rounded-2xl border border-[#F2C76E]/40 space-y-1.5">
          <p className="font-bold text-[#0C163A] text-sm">{user.name}</p>
          {user.fullAddress && <p className="text-stone-600">{user.fullAddress}</p>}
          <p className="text-stone-600 font-medium">{user.district}, Bangladesh</p>
          <p className="text-stone-600 font-mono flex items-center gap-1">
            <Phone className="w-3 h-3" /> {user.phone || '—'}
          </p>
        </div>
      )}
    </div>
  );
}
