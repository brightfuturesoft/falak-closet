import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { PromotionModel } from '@/models/Promotion';

const DEFAULT_PROMOTIONS = [
  {
    id: 'promo-1',
    code: 'EID2026',
    discountType: 'percentage' as const,
    discountValue: 15,
    minSpend: 2500,
    maxDiscount: 1000,
    usageLimit: 500,
    usedCount: 142,
    expiryDate: '2026-06-30',
    status: 'Active' as const
  },
  {
    id: 'promo-2',
    code: 'FALAK10',
    discountType: 'percentage' as const,
    discountValue: 10,
    minSpend: 1500,
    maxDiscount: 500,
    usageLimit: 1000,
    usedCount: 689,
    expiryDate: '2026-12-31',
    status: 'Active' as const
  },
  {
    id: 'promo-3',
    code: 'WELCOME500',
    discountType: 'fixed' as const,
    discountValue: 500,
    minSpend: 3500,
    maxDiscount: 500,
    usageLimit: 200,
    usedCount: 95,
    expiryDate: '2026-09-30',
    status: 'Active' as const
  }
];

// READ All Promotions
export async function GET() {
  try {
    await connectToDatabase();
    const promotions = await PromotionModel.find({}).sort({ createdAt: -1 });

    if (promotions.length === 0) {
      // Seed default promotions if database is empty
      await PromotionModel.insertMany(DEFAULT_PROMOTIONS);
      return NextResponse.json({ success: true, promotions: DEFAULT_PROMOTIONS });
    }

    return NextResponse.json({ success: true, promotions });
  } catch (error) {
    return NextResponse.json({ success: true, promotions: DEFAULT_PROMOTIONS, source: 'offline' });
  }
}

// CREATE New Promotion
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { code, discountType, discountValue, minSpend, maxDiscount, usageLimit, expiryDate, status } = body;

    if (!code || !discountValue) {
      return NextResponse.json({ success: false, error: 'Promo code and discount value are required' }, { status: 400 });
    }

    const newPromo = await PromotionModel.create({
      code: code.toUpperCase().trim(),
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minSpend: Number(minSpend) || 0,
      maxDiscount: Number(maxDiscount) || 0,
      usageLimit: Number(usageLimit) || 100,
      usedCount: 0,
      expiryDate: expiryDate || '2026-12-31',
      status: status || 'Active'
    });

    return NextResponse.json({ success: true, promotion: newPromo });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// UPDATE Existing Promotion
export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, code, discountType, discountValue, minSpend, maxDiscount, usageLimit, expiryDate, status } = body;

    if (!code && !id) {
      return NextResponse.json({ success: false, error: 'Promo code or ID required' }, { status: 400 });
    }

    const filter = id ? { _id: id } : { code: code.toUpperCase().trim() };
    const updateData: any = {};

    if (code) updateData.code = code.toUpperCase().trim();
    if (discountType) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = Number(discountValue);
    if (minSpend !== undefined) updateData.minSpend = Number(minSpend);
    if (maxDiscount !== undefined) updateData.maxDiscount = Number(maxDiscount);
    if (usageLimit !== undefined) updateData.usageLimit = Number(usageLimit);
    if (expiryDate) updateData.expiryDate = expiryDate;
    if (status) updateData.status = status;

    const updated = await PromotionModel.findOneAndUpdate(filter, updateData, { new: true });

    return NextResponse.json({ success: true, promotion: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE Promotion
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const id = searchParams.get('id');

    if (!code && !id) {
      return NextResponse.json({ success: false, error: 'Promo code or ID required for deletion' }, { status: 400 });
    }

    await connectToDatabase();
    const filter = id ? { _id: id } : { code: code?.toUpperCase().trim() };
    await PromotionModel.deleteOne(filter);

    return NextResponse.json({ success: true, message: 'Promotion deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
