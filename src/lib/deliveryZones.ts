/**
 * deliveryZones.ts — server-side delivery zone access.
 *
 * Same shape CartContext exposes to the client (no timestamps), read through
 * `unstable_cache` under DELIVERY_ZONES_TAG so admin writes via
 * /api/delivery-zones can bust storefront reads with
 * `revalidateTag(DELIVERY_ZONES_TAG, 'max')`.
 *
 * Import from Server Components and Route Handlers only.
 */

import type { DeliveryZone as DeliveryZoneRow } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { DELIVERY_ZONES_TAG } from '@/lib/fetcher';
import type { DeliveryZone } from '@/context/CartContext';

export type { DeliveryZone };

function serializeZone(row: DeliveryZoneRow): DeliveryZone {
  return {
    id: row.id,
    name: row.name,
    charge: row.charge,
    etaDays: row.etaDays,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    subAreas: (row.subAreas || []).map((s) => ({
      id: s.id,
      name: s.name,
      charge: s.charge ?? null,
    })),
  };
}

/** Matches the auto-seed in /api/delivery-zones so a fresh DB isn't empty. */
const SEED_ZONES = [
  {
    name: 'Inside Dhaka',
    charge: 60,
    etaDays: '1-2 Days',
    isActive: true,
    sortOrder: 1,
    subAreas: [
      { id: 'sub-seed-1', name: 'Dhanmondi', charge: null },
      { id: 'sub-seed-2', name: 'Uttara', charge: null },
      { id: 'sub-seed-3', name: 'Mirpur', charge: null },
      { id: 'sub-seed-4', name: 'Bashundhara', charge: null },
    ],
  },
  {
    name: 'Outside Dhaka',
    charge: 120,
    etaDays: '2-4 Days',
    isActive: true,
    sortOrder: 2,
    subAreas: [
      { id: 'sub-seed-5', name: 'Chattogram', charge: null },
      { id: 'sub-seed-6', name: 'Sylhet', charge: null },
      { id: 'sub-seed-7', name: 'Khulna', charge: null },
      { id: 'sub-seed-8', name: 'Rajshahi', charge: null },
    ],
  },
];

export const getActiveZones = unstable_cache(
  async (): Promise<DeliveryZone[]> => {
    const count = await prisma.deliveryZone.count();
    if (count === 0) {
      await prisma.deliveryZone.createMany({ data: SEED_ZONES });
    }
    const rows = await prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(serializeZone);
  },
  ['zones:active'],
  { tags: [DELIVERY_ZONES_TAG], revalidate: 3600 }
);

/**
 * `getActiveZones()` that never takes a page down — the shipping policy page
 * renders its generic copy without the rate table when the read fails.
 */
export async function getActiveZonesSafe(): Promise<DeliveryZone[]> {
  try {
    return await getActiveZones();
  } catch (err) {
    console.error('[zones] active read failed:', err);
    return [];
  }
}
