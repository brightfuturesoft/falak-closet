import { NextResponse } from 'next/server';
import { Prisma, type DiscountType, type PromotionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { DEFAULT_COUPONS } from '@/data/promotions';

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Server error';
}

const DISCOUNT_TYPES: DiscountType[] = ['percentage', 'fixed'];
const STATUSES: PromotionStatus[] = ['Active', 'Expired', 'Disabled'];

function asDiscountType(value: unknown): DiscountType | undefined {
  return DISCOUNT_TYPES.includes(value as DiscountType) ? (value as DiscountType) : undefined;
}

function asStatus(value: unknown): PromotionStatus | undefined {
  return STATUSES.includes(value as PromotionStatus) ? (value as PromotionStatus) : undefined;
}

function normalizeCode(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

/** Match on ObjectId when one was supplied, else on the (unique) code. */
function whereFor(id: unknown, code: unknown): Prisma.PromotionWhereUniqueInput | null {
  const objectId = String(id ?? '').trim();
  if (/^[0-9a-fA-F]{24}$/.test(objectId)) return { id: objectId };

  const normalized = normalizeCode(code);
  return normalized ? { code: normalized } : null;
}

// ─── GET /api/promotions ─────────────────────────────────────────────────────
export async function GET() {
  try {
    const existing = await prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });

    // First run: give the admin something to edit rather than an empty table.
    if (existing.length === 0) {
      await prisma.promotion.createMany({ data: DEFAULT_COUPONS });
      const seeded = await prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
      return NextResponse.json({ success: true, promotions: seeded, seeded: seeded.length });
    }

    return NextResponse.json({ success: true, promotions: existing });
  } catch (err) {
    // No fall-back-to-defaults here: pretending the defaults are live records
    // hides an outage and invites the admin to "edit" rows that do not exist.
    console.error('[GET /api/promotions]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
}

// ─── POST /api/promotions ────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = normalizeCode(body.code);
    const discountValue = Number(body.discountValue);

    if (!code || !Number.isFinite(discountValue) || discountValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'Promo code and a positive discount value are required' },
        { status: 400 }
      );
    }

    const clash = await prisma.promotion.findUnique({ where: { code } });
    if (clash) {
      return NextResponse.json(
        { success: false, error: `Promo code ${code} already exists` },
        { status: 409 }
      );
    }

    const promotion = await prisma.promotion.create({
      data: {
        code,
        discountType: asDiscountType(body.discountType) ?? 'percentage',
        discountValue,
        minSpend: Number(body.minSpend) || 0,
        maxDiscount: Number(body.maxDiscount) || 0,
        usageLimit: Number(body.usageLimit) || 100,
        usedCount: 0,
        expiryDate: String(body.expiryDate || '2026-12-31'),
        status: asStatus(body.status) ?? 'Active',
      },
    });

    return NextResponse.json(
      { success: true, message: 'Promotion created', promotion },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/promotions]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── PATCH /api/promotions ───────────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const where = whereFor(body.id ?? body._id, body.code);

    if (!where) {
      return NextResponse.json(
        { success: false, error: 'Promo code or ID required' },
        { status: 400 }
      );
    }

    const existing = await prisma.promotion.findUnique({ where });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Promotion not found' }, { status: 404 });
    }

    const data: Prisma.PromotionUpdateInput = {};
    const code = normalizeCode(body.code);
    if (code && code !== existing.code) {
      const clash = await prisma.promotion.findUnique({ where: { code } });
      if (clash && clash.id !== existing.id) {
        return NextResponse.json(
          { success: false, error: `Promo code ${code} already exists` },
          { status: 409 }
        );
      }
      data.code = code;
    }

    const discountType = asDiscountType(body.discountType);
    if (discountType) data.discountType = discountType;

    const status = asStatus(body.status);
    if (status) data.status = status;

    if (body.discountValue !== undefined) data.discountValue = Number(body.discountValue) || 0;
    if (body.minSpend !== undefined) data.minSpend = Number(body.minSpend) || 0;
    if (body.maxDiscount !== undefined) data.maxDiscount = Number(body.maxDiscount) || 0;
    if (body.usageLimit !== undefined) data.usageLimit = Number(body.usageLimit) || 0;
    if (body.expiryDate) data.expiryDate = String(body.expiryDate);

    const promotion = await prisma.promotion.update({ where: { id: existing.id }, data });
    return NextResponse.json({ success: true, message: 'Promotion updated', promotion });
  } catch (err) {
    console.error('[PATCH /api/promotions]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── DELETE /api/promotions?id=...&code=... ──────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const where = whereFor(searchParams.get('id'), searchParams.get('code'));

    if (!where) {
      return NextResponse.json(
        { success: false, error: 'Promo code or ID required for deletion' },
        { status: 400 }
      );
    }

    const existing = await prisma.promotion.findUnique({ where });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Promotion not found' }, { status: 404 });
    }

    await prisma.promotion.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, message: 'Promotion deleted successfully' });
  } catch (err) {
    console.error('[DELETE /api/promotions]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
