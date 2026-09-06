import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPathaoShipment, calculateOrderWeight } from '@/lib/shipping/pathao';
import { serializeOrder } from '@/lib/orders';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientCityId,
      recipientZoneId,
      recipientAreaId,
      recipientCityName,
      recipientZoneName,
      recipientAreaName,
      deliveryType,
      itemType,
      itemQuantity,
      itemWeight,
      amountToCollect,
      storeId,
      itemDescription,
      specialInstruction,
    } = body;

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
    const finalCityId = recipientCityId ? parseInt(String(recipientCityId), 10) : sh?.pathaoCityId;
    const finalZoneId = recipientZoneId ? parseInt(String(recipientZoneId), 10) : sh?.pathaoZoneId;
    const finalAreaId = recipientAreaId ? parseInt(String(recipientAreaId), 10) : sh?.pathaoAreaId;

    if (!finalCityId || !finalZoneId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order shipping address missing Pathao City or Zone selection',
        },
        { status: 400 }
      );
    }

    const finalName = recipientName?.trim() || sh?.fullName || 'Valued Customer';
    const finalPhone = recipientPhone?.trim() || sh?.phone || '';
    const finalCityName = recipientCityName || sh?.pathaoCityName || sh?.city || 'Dhaka';
    const finalZoneName = recipientZoneName || sh?.pathaoZoneName;
    const finalAreaName = recipientAreaName || sh?.pathaoAreaName;

    // Address text for Pathao shipment
    const addressText = recipientAddress?.trim() || [
      sh?.fullAddress || sh?.street || '',
      finalAreaName || '',
      finalZoneName || sh?.district || '',
      finalCityName || '',
    ]
      .filter(Boolean)
      .join(', ');

    // Quantities and weights
    const defaultTotalCount = order.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
    const finalItemCount = typeof itemQuantity === 'number' && itemQuantity > 0 ? itemQuantity : Math.max(1, defaultTotalCount);
    const finalWeight = typeof itemWeight === 'number' && itemWeight > 0 ? itemWeight : calculateOrderWeight(order.items);

    // COD Amount calculation: default to order.total if not prepaid
    const isPrepaid =
      order.paymentMethod?.toLowerCase().includes('bkash') &&
      order.paymentStatus === 'Verified';

    const defaultAmountToCollect = isPrepaid ? 0 : order.total;
    const finalAmountToCollect = typeof amountToCollect === 'number' ? Math.max(0, amountToCollect) : defaultAmountToCollect;

    const result = await createPathaoShipment({
      storeId: storeId ? String(storeId) : undefined,
      merchantOrderId: order.orderNumber,
      recipientName: finalName,
      recipientPhone: finalPhone,
      recipientAddress: addressText || 'Address not specified',
      recipientCityId: finalCityId,
      recipientZoneId: finalZoneId,
      ...(finalAreaId ? { recipientAreaId: finalAreaId } : {}),
      deliveryType: typeof deliveryType === 'number' ? deliveryType : undefined,
      itemType: typeof itemType === 'number' ? itemType : undefined,
      itemQuantity: finalItemCount,
      itemWeight: finalWeight,
      amountToCollect: finalAmountToCollect,
      itemDescription: itemDescription || `Order ${order.orderNumber} - ${finalItemCount} item(s)`,
      specialInstruction: specialInstruction || undefined,
    });

    // Update shippingAddress object in Prisma
    const updatedShippingAddress = {
      ...sh,
      fullName: finalName,
      phone: finalPhone,
      fullAddress: recipientAddress?.trim() || sh?.fullAddress || sh?.street,
      street: recipientAddress?.trim() || sh?.street,
      city: finalCityName,
      district: finalCityName,
      pathaoCityId: finalCityId,
      pathaoZoneId: finalZoneId,
      pathaoAreaId: finalAreaId,
      pathaoCityName: finalCityName,
      pathaoZoneName: finalZoneName,
      pathaoAreaName: finalAreaName,
    };

    // Update order with Pathao consignment info and updated address
    const updatedOrder = await prisma.order.update({
      where: { orderNumber: order.orderNumber },
      data: {
        shippingAddress: updatedShippingAddress,
        deliveryZone: finalZoneName || order.deliveryZone,
        deliverySubArea: finalAreaName || order.deliverySubArea,
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
