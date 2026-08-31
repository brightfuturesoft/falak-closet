import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapPathaoStatusToOrderStatus } from '@/lib/shipping/pathao';
import { adjustStockForOrderItems, serializeOrder } from '@/lib/orders';

/**
 * POST /api/webhooks/pathao
 * Pathao Webhook Listener for real-time order status updates.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Optional Secret Header Verification if PATHAO_WEBHOOK_SECRET is set in .env
    const webhookSecret = process.env.PATHAO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature =
        req.headers.get('x-pathao-signature') ||
        req.headers.get('x-pathao-secret') ||
        req.headers.get('authorization');
      if (signature !== webhookSecret && signature !== `Bearer ${webhookSecret}`) {
        console.warn('[Pathao Webhook] Unauthorized webhook attempt with invalid signature.');
        return NextResponse.json({ success: false, error: 'Unauthorized webhook request' }, { status: 401 });
      }
    }

    // Extract fields from Pathao webhook payload
    const consignmentId = body.consignment_id || body.consignmentId || body.consignment_number;
    const merchantOrderId = body.merchant_order_id || body.merchantOrderId || body.order_id;
    const rawPathaoStatus = String(body.order_status || body.status || body.event_type || '').trim();
    const reason = body.reason || body.message || body.failure_reason || '';

    if (!consignmentId && !merchantOrderId) {
      return NextResponse.json(
        { success: false, error: 'Webhook payload missing consignment_id and merchant_order_id' },
        { status: 400 }
      );
    }

    console.log(
      `[Pathao Webhook] Received status update: ${rawPathaoStatus} for consignment ${consignmentId || 'N/A'} / order ${merchantOrderId || 'N/A'}`
    );

    // Locate matching order in DB
    const searchConditions: Array<Record<string, string>> = [];
    if (consignmentId) searchConditions.push({ consignmentId: String(consignmentId) });
    if (merchantOrderId) searchConditions.push({ orderNumber: String(merchantOrderId) });

    const order = await prisma.order.findFirst({
      where: {
        OR: searchConditions,
      },
    });

    if (!order) {
      console.warn(`[Pathao Webhook] Order not found for consignment: ${consignmentId}, order: ${merchantOrderId}`);
      return NextResponse.json(
        { success: false, error: 'Order not found for given consignment_id / merchant_order_id' },
        { status: 404 }
      );
    }

    const mapped = mapPathaoStatusToOrderStatus(rawPathaoStatus);
    const oldStatus = order.status;
    const newStatus = mapped.status;

    // Update order data
    const updateData: Record<string, unknown> = {
      courierStatus: rawPathaoStatus,
      status: newStatus,
    };

    if (mapped.markAsPaid && order.paymentStatus !== 'Paid') {
      updateData.paymentStatus = 'Paid';
    }

    if (consignmentId && !order.consignmentId) {
      updateData.consignmentId = String(consignmentId);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    // Auto-restock product inventory if order transitioned to Cancelled
    if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
      try {
        await adjustStockForOrderItems(order.items, 'increase');
        console.log(`[Pathao Webhook] Restocked product items for cancelled order #${order.orderNumber}`);
      } catch (stockErr) {
        console.error('[Pathao Webhook] Stock restock error:', stockErr);
      }
    } else if (oldStatus === 'Cancelled' && newStatus !== 'Cancelled') {
      try {
        await adjustStockForOrderItems(order.items, 'decrease');
        console.log(`[Pathao Webhook] Re-deducted product items for un-cancelled order #${order.orderNumber}`);
      } catch (stockErr) {
        console.error('[Pathao Webhook] Stock deduction error:', stockErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order #${order.orderNumber} status updated to ${newStatus} (Courier: ${rawPathaoStatus})`,
      order: serializeOrder(updatedOrder),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Pathao webhook execution failed';
    console.error('[POST /api/webhooks/pathao] Exception:', err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
