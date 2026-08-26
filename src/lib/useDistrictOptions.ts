'use client';

import { useEffect, useState } from 'react';
import type { DeliveryZone } from '@/context/CartContext';

/**
 * useDistrictOptions — district/area names derived from the admin-managed
 * delivery zones (zones themselves + their sub-areas).
 *
 * The account profile's "District" select used to ship a hardcoded 20-item
 * list that silently disagreed with the zones the admin actually serves
 * (and the checkout charges by). This hook reads the same /api/delivery-zones
 * the checkout uses, so one admin source drives both.
 *
 * Falls back to a reasonable static list when the API is unreachable —
 * signing up or editing an address must never be blocked by a zones outage.
 */

const FALLBACK_DISTRICTS = [
  'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Sylhet',
  'Barishal', 'Rangpur', 'Mymensingh', 'Gazipur', 'Narayanganj',
];

export interface DistrictOptions {
  /** Unique district/area names, zone-major (zone name, then its sub-areas). */
  districts: string[];
  /** Raw zones when the API responded — null while loading or on failure. */
  zones: DeliveryZone[] | null;
}

export function useDistrictOptions(): DistrictOptions {
  const [districts, setDistricts] = useState<string[]>(FALLBACK_DISTRICTS);
  const [zones, setZones] = useState<DeliveryZone[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/delivery-zones');
        const data = await res.json();
        if (cancelled) return;

        if (data.success && Array.isArray(data.deliveryZones)) {
          const active: DeliveryZone[] = data.deliveryZones.filter(
            (z: DeliveryZone) => z.isActive
          );

          // Zone names themselves are selectable (e.g. "Inside Dhaka" covers
          // the whole zone), followed by each zone's named sub-areas.
          const names: string[] = [];
          for (const zone of active) {
            if (!names.includes(zone.name)) names.push(zone.name);
            for (const sub of zone.subAreas || []) {
              if (!names.includes(sub.name)) names.push(sub.name);
            }
          }

          if (names.length > 0) setDistricts(names);
          setZones(active);
        }
      } catch {
        // API unreachable → fallback list stays; profile editing keeps working.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { districts, zones };
}
