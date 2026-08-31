import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { DELIVERY_ZONES_TAG } from '@/lib/fetcher';

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Server error';
}

/** Bust the cached zone reads (shipping page) after any zone write. */
function bustZoneCache() {
  revalidateTag(DELIVERY_ZONES_TAG, 'max');
  revalidatePath('/shipping');
}

const DEFAULT_ZONES = [
  {
    name: 'Inside Dhaka',
    charge: 80.0,
    etaDays: '1-2 Days',
    isActive: true,
    sortOrder: 0,
    subAreas: [
      { id: 'sub-dhanmondi', name: 'Dhanmondi', charge: null },
      { id: 'sub-uttara', name: 'Uttara', charge: null },
      { id: 'sub-mirpur', name: 'Mirpur', charge: null },
      { id: 'sub-bashundhara', name: 'Bashundhara', charge: null }
    ]
  },
  {
    name: 'Sub-area Dhaka',
    charge: 100.0,
    etaDays: '2-3 Days',
    isActive: true,
    sortOrder: 1,
    subAreas: [
      { id: 'sub-savar', name: 'Savar', charge: null },
      { id: 'sub-gazipur', name: 'Gazipur', charge: null },
      { id: 'sub-narayanganj', name: 'Narayanganj', charge: null },
      { id: 'sub-tongi', name: 'Tongi', charge: null },
      { id: 'sub-keraniganj', name: 'Keraniganj', charge: null }
    ]
  },
  {
    name: 'Outside Dhaka',
    charge: 150.0,
    etaDays: '3-5 Days',
    isActive: true,
    sortOrder: 2,
    subAreas: [
      { id: 'sub-chattogram', name: 'Chattogram', charge: null },
      { id: 'sub-sylhet', name: 'Sylhet', charge: null },
      { id: 'sub-khulna', name: 'Khulna', charge: null },
      { id: 'sub-rajshahi', name: 'Rajshahi', charge: null }
    ]
  }
];

// ─── GET /api/delivery-zones ──────────────────────────────────────────────────
export async function GET() {
  try {
    let zones = await prisma.deliveryZone.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    if (zones.length === 0) {
      // Auto-seed defaults once
      console.log('[GET /api/delivery-zones] Seeding default delivery zones...');
      for (const zone of DEFAULT_ZONES) {
        await prisma.deliveryZone.create({
          data: zone
        });
      }
      zones = await prisma.deliveryZone.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
    }

    return NextResponse.json({ success: true, deliveryZones: zones });
  } catch (err) {
    console.error('[GET /api/delivery-zones]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch delivery zones' }, { status: 500 });
  }
}

// ─── POST /api/delivery-zones ─────────────────────────────────────────────────
// body: { action: 'create_zone' | 'create_subarea', name, charge, etaDays?, isActive?, sortOrder?, zoneId? }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, name, charge, etaDays, isActive, sortOrder, zoneId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    if (action === 'create_subarea') {
      if (!zoneId) {
        return NextResponse.json({ success: false, error: 'Zone ID is required' }, { status: 400 });
      }
      const zone = await prisma.deliveryZone.findUnique({ where: { id: zoneId } });
      if (!zone) {
        return NextResponse.json({ success: false, error: 'Zone not found' }, { status: 404 });
      }

      const rawCharge = charge !== undefined && charge !== null && charge !== '' ? Number(charge) : null;
      if (rawCharge !== null && (isNaN(rawCharge) || rawCharge < 0)) {
        return NextResponse.json({ success: false, error: 'Charge must be a non-negative number' }, { status: 400 });
      }

      const newSub = {
        id: `sub-${Math.random().toString(36).substring(2, 9)}`,
        name: name.trim(),
        charge: rawCharge,
      };

      const updated = await prisma.deliveryZone.update({
        where: { id: zoneId },
        data: { subAreas: { push: newSub } },
      });

      bustZoneCache();

    return NextResponse.json({ success: true, message: 'Sub-area created', zone: updated });
    }

    // Create Main Zone
    const baseCharge = Number(charge);
    if (isNaN(baseCharge) || baseCharge < 0) {
      return NextResponse.json({ success: false, error: 'Charge is required and must be non-negative' }, { status: 400 });
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        name: name.trim(),
        charge: baseCharge,
        etaDays: etaDays?.trim() || '2-3 Days',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
        subAreas: []
      }
    });

    bustZoneCache();

    return NextResponse.json({ success: true, message: 'Delivery zone created', zone }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/delivery-zones]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── PUT /api/delivery-zones ──────────────────────────────────────────────────
// body: { id, isSubarea?, zoneId?, name?, charge?, etaDays?, isActive?, sortOrder? }
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, isSubarea, zoneId, name, charge, etaDays, isActive, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    if (isSubarea) {
      // Find parent zone
      const parent = zoneId
        ? await prisma.deliveryZone.findUnique({ where: { id: zoneId } })
        : await prisma.deliveryZone.findFirst({ where: { subAreas: { some: { id } } } });

      if (!parent) {
        return NextResponse.json({ success: false, error: 'Sub-area parent zone not found' }, { status: 404 });
      }

      const rawCharge = charge !== undefined && charge !== null && charge !== '' ? Number(charge) : null;
      if (rawCharge !== null && (isNaN(rawCharge) || rawCharge < 0)) {
        return NextResponse.json({ success: false, error: 'Charge must be a non-negative number' }, { status: 400 });
      }

      const updatedSubs = parent.subAreas.map((s) =>
        s.id === id
          ? {
              ...s,
              ...(name ? { name: name.trim() } : {}),
              charge: rawCharge
            }
          : s
      );

      const updated = await prisma.deliveryZone.update({
        where: { id: parent.id },
        data: { subAreas: updatedSubs }
      });

      bustZoneCache();

    return NextResponse.json({ success: true, message: 'Sub-area updated', zone: updated });
    }

    // Update main zone
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (charge !== undefined && charge !== null) {
      const baseCharge = Number(charge);
      if (isNaN(baseCharge) || baseCharge < 0) {
        return NextResponse.json({ success: false, error: 'Charge must be non-negative' }, { status: 400 });
      }
      updateData.charge = baseCharge;
    }
    if (etaDays !== undefined) updateData.etaDays = etaDays.trim();
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);

    const updated = await prisma.deliveryZone.update({
      where: { id },
      data: updateData
    });

    bustZoneCache();

    return NextResponse.json({ success: true, message: 'Delivery zone updated', zone: updated });
  } catch (err) {
    console.error('[PUT /api/delivery-zones]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── DELETE /api/delivery-zones?id=...&isSubarea=...&zoneId=... ───────────────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const isSubarea = searchParams.get('isSubarea') === 'true';
    const zoneId = searchParams.get('zoneId');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    if (isSubarea) {
      const parent = zoneId
        ? await prisma.deliveryZone.findUnique({ where: { id: zoneId } })
        : await prisma.deliveryZone.findFirst({ where: { subAreas: { some: { id } } } });

      if (!parent) {
        return NextResponse.json({ success: false, error: 'Sub-area parent zone not found' }, { status: 404 });
      }

      const filteredSubs = parent.subAreas.filter((s) => s.id !== id);
      await prisma.deliveryZone.update({
        where: { id: parent.id },
        data: { subAreas: filteredSubs }
      });

      bustZoneCache();

    return NextResponse.json({ success: true, message: 'Sub-area deleted' });
    }

    await prisma.deliveryZone.delete({ where: { id } });
    bustZoneCache();

    return NextResponse.json({ success: true, message: 'Delivery zone deleted' });
  } catch (err) {
    console.error('[DELETE /api/delivery-zones]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
