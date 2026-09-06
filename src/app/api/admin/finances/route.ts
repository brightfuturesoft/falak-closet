import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/session';

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Server error';
}

function parseDateRange(timeframe: string, customStart?: string, customEnd?: string) {
  const now = new Date();
  let start: Date | undefined;
  let end: Date | undefined;

  switch (timeframe) {
    case 'today': {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    }
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0);
      end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59);
      break;
    }
    case 'week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date();
      break;
    }
    case 'month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date();
      break;
    }
    case 'last_month': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    }
    case 'year': {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      end = new Date();
      break;
    }
    case 'custom': {
      if (customStart) start = new Date(customStart);
      if (customEnd) end = new Date(customEnd);
      break;
    }
    case 'all':
    default:
      start = undefined;
      end = undefined;
      break;
  }

  return { start, end };
}

// ─── GET /api/admin/finances ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin session required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || 'month';
    const customStart = searchParams.get('startDate') || undefined;
    const customEnd = searchParams.get('endDate') || undefined;

    const { start, end } = parseDateRange(timeframe, customStart, customEnd);

    // Build Prisma createdAt filter for orders and transactions
    const dateFilter = start || end ? {
      createdAt: {
        ...(start ? { gte: start } : {}),
        ...(end ? { lte: end } : {}),
      }
    } : {};

    // 1. Fetch products map to resolve current buying prices if missing from historical order item snapshots
    const allProducts = await prisma.product.findMany({
      select: { id: true, buyingPrice: true, price: true, variations: true },
    });

    const productMap = new Map<string, { buyingPrice: number; price: number; variations: any[] }>();
    for (const p of allProducts) {
      productMap.set(p.id, {
        buyingPrice: p.buyingPrice || 0,
        price: p.price || 0,
        variations: p.variations || [],
      });
    }

    // 2. Fetch Orders in date range
    const orders = await prisma.order.findMany({
      where: dateFilter,
      orderBy: { createdAt: 'desc' },
    });

    // 3. Fetch Manual Financial Transactions in date range
    const transactions = await prisma.financeTransaction.findMany({
      where: dateFilter,
      orderBy: { date: 'desc' },
    });

    // Compute P&L Metrics based on Delivered & Completed Orders
    let totalOrdersCount = orders.length;
    let deliveredOrdersCount = 0;

    let grossDeliveredRevenue = 0;
    let totalDiscountGiven = 0;
    let totalShippingCollected = 0;
    let netDeliveredRevenue = 0;

    let deliveredOrderCOGS = 0;
    let courierShippingCosts = 0;

    const orderProfitabilityList: Array<{
      orderNumber: string;
      date: string;
      customerName: string;
      status: string;
      revenue: number;
      cogs: number;
      courierFee: number;
      netContribution: number;
      marginPct: number;
    }> = [];

    for (const order of orders) {
      const isDelivered = order.status === 'Delivered' || order.status === 'Completed';

      if (isDelivered) {
        deliveredOrdersCount += 1;
        const revenue = order.total;
        grossDeliveredRevenue += order.subtotal;
        totalDiscountGiven += order.discount || 0;
        totalShippingCollected += order.shippingFee || 0;
        netDeliveredRevenue += revenue;

        const courierFee = typeof order.courierDeliveryFee === 'number' ? order.courierDeliveryFee : (order.shippingFee || 0);
        courierShippingCosts += courierFee;

        // Calculate COGS for order items
        let orderItemCOGS = 0;
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            const rawProd = item.product as any;
            const pId = typeof rawProd === 'object' && rawProd ? (rawProd.id || rawProd._id) : (item as any).productId;
            const qty = Math.max(1, Number(item.quantity) || 1);

            let buyingPrice = 0;
            if (rawProd && typeof rawProd.buyingPrice === 'number' && rawProd.buyingPrice > 0) {
              buyingPrice = rawProd.buyingPrice;
            } else if (pId && productMap.has(pId)) {
              const pInfo = productMap.get(pId)!;
              // Check variation buying price if available
              const itemColor = (item.selectedColor || '').toLowerCase();
              const itemSize = (item.selectedSize || '').toLowerCase();
              const matchedVar = pInfo.variations.find(v =>
                (v.colorName || '').toLowerCase() === itemColor && (v.size || '').toLowerCase() === itemSize
              );
              if (matchedVar && typeof matchedVar.buyingPrice === 'number' && matchedVar.buyingPrice > 0) {
                buyingPrice = matchedVar.buyingPrice;
              } else {
                buyingPrice = pInfo.buyingPrice || 0;
              }
            }

            orderItemCOGS += buyingPrice * qty;
          }
        }

        deliveredOrderCOGS += orderItemCOGS;

        const netContribution = revenue - orderItemCOGS - courierFee;
        const marginPct = revenue > 0 ? (netContribution / revenue) * 100 : 0;

        orderProfitabilityList.push({
          orderNumber: order.orderNumber,
          date: order.date,
          customerName: order.shippingAddress?.fullName || 'Customer',
          status: order.status,
          revenue,
          cogs: orderItemCOGS,
          courierFee,
          netContribution,
          marginPct,
        });
      }
    }

    // 4. Calculate Expenses & Additional Incomes from FinanceTransaction
    let totalOperatingExpenses = 0;
    let totalAdditionalIncomes = 0;

    const expenseCategoryBreakdown: Record<string, number> = {};

    for (const tx of transactions) {
      if (tx.type === 'EXPENSE') {
        totalOperatingExpenses += tx.amount;
        expenseCategoryBreakdown[tx.category] = (expenseCategoryBreakdown[tx.category] || 0) + tx.amount;
      } else if (tx.type === 'INCOME') {
        totalAdditionalIncomes += tx.amount;
      }
    }

    // 5. Final P&L Calculations
    const grossProfit = netDeliveredRevenue - deliveredOrderCOGS - courierShippingCosts;
    const netProfit = grossProfit + totalAdditionalIncomes - totalOperatingExpenses;
    const netMarginPct = netDeliveredRevenue > 0 ? (netProfit / netDeliveredRevenue) * 100 : 0;

    return NextResponse.json({
      success: true,
      timeframe,
      dateRange: { start: start?.toISOString(), end: end?.toISOString() },
      summary: {
        totalOrdersCount,
        deliveredOrdersCount,
        grossDeliveredRevenue,
        totalDiscountGiven,
        totalShippingCollected,
        netDeliveredRevenue,
        deliveredOrderCOGS,
        courierShippingCosts,
        grossProfit,
        totalOperatingExpenses,
        totalAdditionalIncomes,
        netProfit,
        netMarginPct,
      },
      expenseCategoryBreakdown,
      orderProfitabilityList: orderProfitabilityList.slice(0, 50), // Return top 50 recent delivered orders for audit
      transactions,
    });
  } catch (err) {
    console.error('[GET /api/admin/finances]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── POST /api/admin/finances ────────────────────────────────────────────────
// Body: { title, type: 'INCOME' | 'EXPENSE', category, amount, date?, notes? }
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin session required' }, { status: 401 });
    }

    const body = await req.json();
    const title = String(body.title || '').trim();
    const type = body.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
    const category = String(body.category || 'Operational').trim();
    const amount = Number(body.amount);
    const notes = String(body.notes || '').trim();
    const dateInput = body.date ? new Date(body.date) : new Date();

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be greater than 0' }, { status: 400 });
    }

    const transaction = await prisma.financeTransaction.create({
      data: {
        title,
        type,
        category,
        amount,
        notes,
        date: Number.isNaN(dateInput.getTime()) ? new Date() : dateInput,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Financial record saved',
      transaction,
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/finances]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── DELETE /api/admin/finances ──────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin session required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
    }

    await prisma.financeTransaction.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    console.error('[DELETE /api/admin/finances]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
