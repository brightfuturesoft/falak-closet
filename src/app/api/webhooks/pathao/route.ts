import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapPathaoStatusToOrderStatus } from '@/lib/shipping/pathao';
import { adjustStockForOrderItems, serializeOrder } from '@/lib/orders';

const INTEGRATION_SECRET =
  process.env.PATHAO_WEBHOOK_SECRET || 'f3992ecc-59da-4cbe-a049-a13da2018d51';

/** Helper to create responses matching Pathao's exact HTTP 202 & secret header requirements */
function createWebhookResponse(
  data: Record<string, unknown>,
  status: number = 202
) {
  return NextResponse.json(data, {
    status,
    headers: {
      'X-Pathao-Merchant-Webhook-Integration-Secret': INTEGRATION_SECRET,
    },
  });
}

/**
 * GET /api/webhooks/pathao
 * Pathao Webhook Integration Handshake endpoint (GET method).
 */
export async function GET() {
  return createWebhookResponse(
    { success: true, message: 'Pathao Webhook endpoint active' },
    202
  );
}

/**
 * POST /api/webhooks/pathao
 * Pathao Webhook Listener for real-time order status updates & integration handshake.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    // If empty payload or handshake test
    if (!body) {
      return createWebhookResponse(
        { success: true, message: 'Integration test received' },
        202
      );
    }

    // Extract fields from Pathao webhook payload
    const consignmentId = body.consignment_id || body.consignmentId || body.consignment_number;
    const merchantOrderId = body.merchant_order_id || body.merchantOrderId || body.order_id;
    const rawPathaoStatus = String(body.order_status || body.status || body.event_type || '').trim();

    // Integration handshake event (or missing order IDs during Pathao verification test)
    if (!consignmentId && !merchantOrderId) {
      console.log('[Pathao Webhook] Integration handshake test received:', body);
      return createWebhookResponse(
        {
          success: true,
          message: 'Pathao Webhook integration handshake successful',
        },
        202
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
      // Return 202 so Pathao integration test passes even if order ID is a dummy test ID from Pathao
      return createWebhookResponse(
        { success: true, message: 'Webhook received, order not found' },
        202
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

    return createWebhookResponse(
      {
        success: true,
        message: `Order #${order.orderNumber} status updated to ${newStatus} (Courier: ${rawPathaoStatus})`,
        order: serializeOrder(updatedOrder),
      },
      202
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Pathao webhook execution failed';
    console.error('[POST /api/webhooks/pathao] Exception:', err);
    return createWebhookResponse(
      { success: false, error: errorMsg },
      202
    );
  }
}
