import { NextRequest, NextResponse } from 'next/server';
import { getPathaoDeliveryFee, calculateOrderWeight } from '@/lib/shipping/pathao';
import { getStoreSettingsSafe } from '@/lib/siteSettings';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cityId, zoneId, items, subtotal: clientSubtotal } = body;

    const parsedCityId = parseInt(String(cityId), 10);
    const parsedZoneId = parseInt(String(zoneId), 10);

    if (isNaN(parsedCityId) || isNaN(parsedZoneId)) {
      return NextResponse.json(
        { success: false, error: 'Valid cityId and zoneId are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order items are required to calculate shipping' },
        { status: 400 }
      );
    }

    // Compute actual subtotal from items
    let serverSubtotal = 0;
    for (const item of items) {
      const price = typeof item.product?.price === 'number' ? item.product.price : 0;
      const qty = Math.max(1, parseInt(String(item.quantity || 1), 10));
      serverSubtotal += price * qty;
    }

    const subtotal = serverSubtotal > 0 ? serverSubtotal : Number(clientSubtotal) || 0;

    // Calculate actual order weight
    const weight = calculateOrderWeight(items);

    // Call Pathao API to get dynamic delivery fee
    const quote = await getPathaoDeliveryFee({
      cityId: parsedCityId,
      zoneId: parsedZoneId,
      weight,
    });

    const courierDeliveryFee = quote.final_price;

    // Fetch site store settings for free shipping threshold
    const storeSettings = await getStoreSettingsSafe();
    const threshold = storeSettings.freeShippingThreshold;

    const isFreeShipping = subtotal > 0 && subtotal >= threshold;
    const customerShippingFee = isFreeShipping ? 0 : courierDeliveryFee;

    return NextResponse.json({
      success: true,
      courierDeliveryFee,
      customerShippingFee,
      isFreeShipping,
      freeShippingThreshold: threshold,
      weight,
      quote,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Pathao price calculation failed';
    console.error('[POST /api/shipping/pathao/price-quote]', err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
