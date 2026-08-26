import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Server error';
}

const DEFAULT_SETTINGS = {
  // Free-delivery amount threshold read by CartContext on the storefront.
  // currencySymbol is stored for records — display formatting is ৳ BDT only.
  store: {
    freeShippingThreshold: 100,
    currencySymbol: '৳ BDT'
  },
  payment: {
    bkashNumber: '01700000000',
    bkashAccountType: 'Personal',
    instructions: [
      'Open your bKash app and select "Send Money".',
      'Enter the number listed above.',
      'Enter the exact total order amount.',
      'Put your phone number as reference.',
      'Enter your PIN to confirm the payment.',
      'Copy the Transaction ID (TrxID) from the SMS and paste it below.'
    ]
  }
};

// ─── GET /api/settings?key=... ───────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
    }

    let setting = await prisma.siteSetting.findUnique({
      where: { key }
    });

    if (!setting) {
      // Return and seed default setting
      const defaultValue = DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS] || {};
      setting = await prisma.siteSetting.upsert({
        where: { key },
        update: {},
        create: {
          key,
          value: defaultValue
        }
      });
    }

    return NextResponse.json({ success: true, setting });
  } catch (err) {
    console.error('[GET /api/settings]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch setting' }, { status: 500 });
  }
}

// ─── POST /api/settings ───────────────────────────────────────────────────────
// body: { key, value }
function validateSettingValue(key: string, value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return 'Value must be an object';

  if (key === 'store') {
    const store = value as Record<string, unknown>;
    if (store.freeShippingThreshold !== undefined) {
      const threshold = Number(store.freeShippingThreshold);
      if (!Number.isFinite(threshold) || threshold < 0) {
        return 'Free delivery threshold must be a non-negative number';
      }
    }
    if (store.currencySymbol !== undefined && typeof store.currencySymbol !== 'string') {
      return 'Currency symbol must be text';
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json({ success: false, error: 'Key and value are required' }, { status: 400 });
    }

    const validationError = validateSettingValue(key, value);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    return NextResponse.json({ success: true, message: 'Settings saved', setting });
  } catch (err) {
    console.error('[POST /api/settings]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
