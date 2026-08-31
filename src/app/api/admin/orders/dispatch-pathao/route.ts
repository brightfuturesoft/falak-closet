import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPathaoShipment, calculateOrderWeight } from '@/lib/shipping/pathao';
import { serializeOrder } from '@/lib/orders';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    const idStr = String(orderId).trim();
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idStr);

    const order = await prisma.order.findFirst({
      where: isValidObjectId
        ? { OR: [{ orderNumber: idStr }, { id: idStr }] }
        : { orderNumber: idStr },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (order.consignmentId) {
      return NextResponse.json(
        {
          success: false,
          error: `Order already dispatched to Pathao with Consignment ID: ${order.consignmentId}`,
          consignmentId: order.consignmentId,
        },
        { status: 400 }
      );
    }

    const sh = order.shippingAddress;
    if (!sh?.pathaoCityId || !sh?.pathaoZoneId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order shipping address missing Pathao City or Zone selection',
        },
        { status: 400 }
      );
    }

    // Determine total item quantity
    const totalItemsCount = order.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
    const weight = calculateOrderWeight(order.items);

    // Determine COD amount to collect
    // If prepaid (e.g. bKash verified), amount_to_collect is 0. Otherwise order.total.
    const isPrepaid =
      order.paymentMethod?.toLowerCase().includes('bkash') &&
      order.paymentStatus === 'Verified';

    const amountToCollect = isPrepaid ? 0 : order.total;

    // Build recipient full address text
    const addressText = [
      sh.fullAddress || sh.street || '',
      sh.pathaoAreaName || '',
      sh.pathaoZoneName || sh.district || '',
      sh.pathaoCityName || sh.city || '',
    ]
      .filter(Boolean)
      .join(', ');

    const result = await createPathaoShipment({
      merchantOrderId: order.orderNumber,
      recipientName: sh.fullName,
      recipientPhone: sh.phone,
      recipientAddress: addressText || 'Address not specified',
      recipientCityId: sh.pathaoCityId,
      recipientZoneId: sh.pathaoZoneId,
      ...(sh.pathaoAreaId ? { recipientAreaId: sh.pathaoAreaId } : {}),
      itemQuantity: Math.max(1, totalItemsCount),
      itemWeight: weight,
      amountToCollect,
      itemDescription: `Order ${order.orderNumber} - ${totalItemsCount} item(s)`,
    });

    // Update order with Pathao consignment info
    const updatedOrder = await prisma.order.update({
      where: { orderNumber: order.orderNumber },
      data: {
        consignmentId: result.consignment_id,
        courierStatus: result.order_status || 'Pending',
        status: 'Shipped',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Order successfully dispatched to Pathao Courier',
      consignmentId: result.consignment_id,
      order: serializeOrder(updatedOrder),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Pathao dispatch failed';
    console.error('[POST /api/admin/orders/dispatch-pathao]', err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
