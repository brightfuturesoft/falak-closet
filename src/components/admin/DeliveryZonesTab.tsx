'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  MapPin,
  Clock,
  ArrowUpDown,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SubArea {
  id: string;
  name: string;
  charge: number | null;
}

interface DeliveryZone {
  id: string;
  name: string;
  charge: number;
  etaDays: string;
  isActive: boolean;
  sortOrder: number;
  subAreas: SubArea[];
}

export function DeliveryZonesTab() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal States
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  // Delete Confirm State
  const [deletingTarget, setDeletingTarget] = useState<{
    id: string;
    name: string;
    isSubarea: boolean;
    zoneId?: string;
  } | null>(null);

  // Sub-area inline edit states
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState('');
  const [editingSubCharge, setEditingSubCharge] = useState<string>('');

  // Zone Form State
  const [zoneFormData, setZoneFormData] = useState({
    name: '',
    charge: '',
    etaDays: '2-3 Days',
    isActive: true,
    sortOrder: '0'
  });

  // New sub-area inputs state per zone card
  const [newSubNameMap, setNewSubNameMap] = useState<Record<string, string>>({});
  const [newSubChargeMap, setNewSubChargeMap] = useState<Record<string, string>>({});

  const fetchZones = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/delivery-zones');
      const data = await res.json();
      if (data.success && Array.isArray(data.deliveryZones)) {
        setZones(data.deliveryZones);
      } else {
        setLoadError(data.error || 'Failed to load delivery zones.');
      }
    } catch {
      setLoadError('Network error — failed to load delivery zones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchZones();
  }, []);

  const handleOpenZoneModal = (zone?: DeliveryZone) => {
    if (zone) {
      setEditingZone(zone);
      setZoneFormData({
        name: zone.name,
        charge: String(zone.charge),
        etaDays: zone.etaDays,
        isActive: zone.isActive,
        sortOrder: String(zone.sortOrder)
      });
    } else {
      setEditingZone(null);
      setZoneFormData({
        name: '',
        charge: '',
        etaDays: '2-3 Days',
        isActive: true,
        sortOrder: '0'
      });
    }
    setActionError(null);
    setIsZoneModalOpen(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneFormData.name.trim() || zoneFormData.charge === '') return;

    setIsSaving(true);
    setActionError(null);

    const payload = {
      id: editingZone?.id,
      name: zoneFormData.name,
      charge: Number(zoneFormData.charge),
      etaDays: zoneFormData.etaDays,
      isActive: zoneFormData.isActive,
      sortOrder: Number(zoneFormData.sortOrder)
    };

    try {
      const method = editingZone ? 'PUT' : 'POST';
      const res = await fetch('/api/delivery-zones', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setIsZoneModalOpen(false);
        fetchZones();
      } else {
        setActionError(data.error || 'Failed to save delivery zone.');
      }
    } catch {
      setActionError('Network error — failed to save delivery zone.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubarea = async (zoneId: string) => {
    const subName = newSubNameMap[zoneId]?.trim();
    if (!subName) return;

    setActionError(null);
    setIsSaving(true);

    const subChargeInput = newSubChargeMap[zoneId];
    const subCharge = subChargeInput !== undefined && subChargeInput !== '' ? Number(subChargeInput) : null;

    try {
      const res = await fetch('/api/delivery-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_subarea',
          zoneId,
          name: subName,
          charge: subCharge
        })
      });
      const data = await res.json();

      if (data.success) {
        setNewSubNameMap((prev) => ({ ...prev, [zoneId]: '' }));
        setNewSubChargeMap((prev) => ({ ...prev, [zoneId]: '' }));
        fetchZones();
      } else {
        setActionError(data.error || 'Failed to add sub-area.');
      }
    } catch {
      setActionError('Network error — failed to add sub-area.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubareaInline = async (subId: string, zoneId: string) => {
    if (!editingSubName.trim()) return;

    setActionError(null);
    setIsSaving(true);

    const subCharge = editingSubCharge !== '' ? Number(editingSubCharge) : null;

    try {
      const res = await fetch('/api/delivery-zones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: subId,
          isSubarea: true,
          zoneId,
          name: editingSubName,
          charge: subCharge
        })
      });
      const data = await res.json();

      if (data.success) {
        setEditingSubId(null);
        fetchZones();
      } else {
        setActionError(data.error || 'Failed to update sub-area.');
      }
    } catch {
      setActionError('Network error — failed to update sub-area.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditSubarea = (sub: SubArea) => {
    setEditingSubId(sub.id);
    setEditingSubName(sub.name);
    setEditingSubCharge(sub.charge !== null ? String(sub.charge) : '');
  };

  const handleDelete = async () => {
    if (!deletingTarget) return;

    setIsSaving(true);
    setActionError(null);

    try {
      const params = new URLSearchParams({
        id: deletingTarget.id,
        isSubarea: String(deletingTarget.isSubarea)
      });
      if (deletingTarget.zoneId) {
        params.append('zoneId', deletingTarget.zoneId);
      }

      const res = await fetch(`/api/delivery-zones?${params.toString()}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success) {
        setDeletingTarget(null);
        fetchZones();
      } else {
        setActionError(data.error || 'Failed to delete target.');
      }
    } catch {
      setActionError('Network error — failed to delete.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleZoneActive = async (zone: DeliveryZone) => {
    try {
      await fetch('/api/delivery-zones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: zone.id,
          isActive: !zone.isActive
        })
      });
      fetchZones();
    } catch {
      setActionError('Network error — failed to toggle active state.');
    }
  };

  return (
    <div className="space-y-6 text-stone-900">
      {/* Top Header Card */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-stone-850" />
              <span>Delivery Zones & Charges</span>
            </h3>
            <p className="text-xs text-stone-500">
              Manage shipping costs, delivery times, and specific sub-areas.
            </p>
          </div>
          <button
            onClick={() => handleOpenZoneModal()}
            className="px-4 py-2.5 bg-[#9B050B] hover:bg-[#B8000A] text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Zone</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{actionError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-stone-500 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-stone-400" />
          <span className="text-xs font-bold font-mono">Fetching active delivery zones...</span>
        </div>
      ) : loadError ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
          <p className="text-sm text-stone-500">{loadError}</p>
          <button
            onClick={fetchZones}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-300"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`p-6 bg-white rounded-3xl border shadow-sm flex flex-col justify-between transition-all ${
                zone.isActive ? 'border-stone-200' : 'border-stone-200/50 bg-stone-50/50 opacity-75'
              }`}
            >
              <div className="space-y-4">
                {/* Zone Info Header */}
                <div className="flex items-start justify-between pb-3 border-b border-stone-100">
                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-1.5">
                      <span>{zone.name}</span>
                      {!zone.isActive && (
                        <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded text-[9px] font-bold text-stone-500 font-sans uppercase">
                          Disabled
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {zone.etaDays}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowUpDown className="w-3.5 h-3.5" /> Order: {zone.sortOrder}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-[#9B050B] font-mono block">
                      {formatCurrency(zone.charge)}
                    </span>
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Base Charge</span>
                  </div>
                </div>

                {/* Sub-areas section */}
                <div className="space-y-3">
                  <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">
                    Sub-areas & Custom Charges ({zone.subAreas.length})
                  </h5>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {zone.subAreas.map((sub) => {
                      const isEditing = editingSubId === sub.id;

                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-100 rounded-xl text-xs"
                        >
                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                value={editingSubName}
                                onChange={(e) => setEditingSubName(e.target.value)}
                                className="px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs flex-1"
                                placeholder="Sub-area Name"
                              />
                              <input
                                type="number"
                                value={editingSubCharge}
                                onChange={(e) => setEditingSubCharge(e.target.value)}
                                className="px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs w-20 font-mono"
                                placeholder="৳ Base"
                              />
                              <button
                                onClick={() => handleSaveSubareaInline(sub.id, zone.id)}
                                className="p-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingSubId(null)}
                                className="p-1 bg-stone-100 text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-200"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 font-bold text-stone-800">
                                <MapPin className="w-3.5 h-3.5 text-stone-450 shrink-0" />
                                <span>{sub.name}</span>
                              </div>

                              <div className="flex items-center gap-3 font-mono">
                                <span className="font-bold text-stone-600">
                                  {sub.charge !== null ? formatCurrency(sub.charge) : 'Inherited'}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleStartEditSubarea(sub)}
                                    className="p-1 bg-stone-100 hover:bg-stone-250 text-stone-700 rounded transition-colors"
                                    title="Edit Sub-area"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setDeletingTarget({
                                        id: sub.id,
                                        name: sub.name,
                                        isSubarea: true,
                                        zoneId: zone.id
                                      })
                                    }
                                    className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition-colors"
                                    title="Delete Sub-area"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}

                    {zone.subAreas.length === 0 && (
                      <p className="text-[10px] text-stone-400 italic">No specific sub-areas added. All points inherit zone charge.</p>
                    )}
                  </div>

                  {/* Add Sub-area Input Box */}
                  <div className="flex gap-2 pt-1.5">
                    <input
                      type="text"
                      placeholder="Add sub-area (e.g. Dhanmondi)"
                      value={newSubNameMap[zone.id] || ''}
                      onChange={(e) =>
                        setNewSubNameMap((prev) => ({ ...prev, [zone.id]: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                    <input
                      type="number"
                      placeholder="৳ Override (optional)"
                      value={newSubChargeMap[zone.id] || ''}
                      onChange={(e) =>
                        setNewSubChargeMap((prev) => ({ ...prev, [zone.id]: e.target.value }))
                      }
                      className="w-28 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                    <button
                      onClick={() => handleAddSubarea(zone.id)}
                      disabled={!newSubNameMap[zone.id]?.trim()}
                      className="px-3 bg-stone-900 hover:bg-stone-850 text-white rounded-xl font-bold text-xs disabled:opacity-40 transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between pt-4 mt-6 border-t border-stone-150 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={zone.isActive}
                    onChange={() => handleToggleZoneActive(zone)}
                    className="w-4 h-4 rounded border-stone-300 accent-[#9B050B] cursor-pointer"
                  />
                  <span>Active Delivery Option</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenZoneModal(zone)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Zone
                  </button>
                  <button
                    onClick={() =>
                      setDeletingTarget({
                        id: zone.id,
                        name: zone.name,
                        isSubarea: false
                      })
                    }
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone CRUD Modal */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-stone-900">
            <button
              onClick={() => setIsZoneModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif font-bold text-lg border-b border-stone-100 pb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-stone-850" />
              <span>{editingZone ? 'Edit Delivery Zone' : 'Create Delivery Zone'}</span>
            </h3>

            <form onSubmit={handleSaveZone} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Zone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inside Dhaka"
                  value={zoneFormData.name}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Base Shipping Charge (৳ BDT) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="e.g. 60"
                  value={zoneFormData.charge}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, charge: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Estimated Delivery Time (ETA)</label>
                <input
                  type="text"
                  placeholder="e.g. 2-3 Days"
                  value={zoneFormData.etaDays}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, etaDays: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Sort Order</label>
                <input
                  type="number"
                  placeholder="e.g. 0"
                  value={zoneFormData.sortOrder}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, sortOrder: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={zoneFormData.isActive}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-stone-300 accent-[#9B050B]"
                />
                <label htmlFor="isActive" className="font-bold text-stone-700 cursor-pointer">
                  Activate zone on creation
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-850 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-stone-900">
            <h3 className="font-serif font-bold text-base flex items-center gap-2 text-rose-800">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Confirm Deletion</span>
            </h3>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to delete the {deletingTarget.isSubarea ? 'sub-area' : 'delivery zone'}{' '}
              <strong className="text-stone-900">&quot;{deletingTarget.name}&quot;</strong>?
              {!deletingTarget.isSubarea && ' This will delete all associated sub-areas and cannot be undone.'}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 text-xs">
              <button
                onClick={() => setDeletingTarget(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-850 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {isSaving ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
