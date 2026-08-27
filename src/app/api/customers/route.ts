import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/customers — admin-only, server-paginated customer directory.
 *
 * Aggregates the same unified view the CRM table needs — registered users
 * (User collection), buyer analytics (Order collection), IP ban state
 * (BlockedIp collection), and saved-cart value (Product prices) — then
 * applies search / tier filter / sort / pagination server-side so the client
 * only ever receives one page of rows.
 *
 * Query params:
 *   page     int    1-based page number (default 1)
 *   pageSize int    rows per page, 1–100 for views; up to 500 for CSV export (default 8)
 *   query    string matches name, phone, email, district, or IP
 *   filter   string all | vip | active | blocked | cart (default all)
 *   sort     string name | orders | spent (default spent)
 *   dir      string asc | desc (default desc)
 *
 * Response: {
 *   success, customers: [...one page...],
 *   pagination: { page, pageSize, totalItems, totalPages },
 *   counts:  { all, vip, active, blocked, cart },   // within the current search
 *   stats:   { ...KPI aggregates over ALL customers }
 * }
 */

export const dynamic = 'force-dynamic';

// Display fallback when neither the user profile nor any order recorded an IP.
const FALLBACK_IP = '103.24.12.89';

const FILTERS = ['all', 'vip', 'active', 'blocked', 'cart'] as const;
const SORTS = ['name', 'orders', 'spent'] as const;

interface AggregatedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  address: string;
  ip: string;
  totalOrders: number;
  totalSpent: number;
  userBlocked: boolean;
  registered: boolean;
  registeredAt: string | null;
  cart: { productId: string; selectedColor: string; selectedSize: string; quantity: number }[];
}

const parseEnum = <T extends readonly string[]>(
  allowed: T,
  raw: string | null,
  fallback: T[number]
): T[number] => (allowed.includes(raw as T[number]) ? (raw as T[number]) : fallback);

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
    const pageSize = Math.min(500, Math.max(1, parseInt(sp.get('pageSize') || '8', 10) || 8));
    const query = (sp.get('query') || '').trim().toLowerCase();
    const filter = parseEnum(FILTERS, sp.get('filter'), 'all');
    const sort = parseEnum(SORTS, sp.get('sort'), 'spent');
    const dir = sp.get('dir') === 'asc' ? 'asc' : 'desc';

    // Only the fields each aggregate actually needs — this feeds a table, not
    // the full catalog, so keep the payload narrow.
    const [users, orders, blockedIps, productRows] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          district: true,
          fullAddress: true,
          ip: true,
          isBlocked: true,
          createdAt: true,
          cart: true,
        },
      }),
      prisma.order.findMany({
        select: {
          orderNumber: true,
          total: true,
          userEmail: true,
          userIp: true,
          createdAt: true,
          shippingAddress: true,
        },
      }),
      prisma.blockedIp.findMany({ select: { ip: true } }),
      prisma.product.findMany({ select: { id: true, price: true } }),
    ]);

    const blockedIpSet = new Set(blockedIps.map((b) => b.ip));
    const priceById = new Map(productRows.map((p) => [p.id, p.price]));
    const cartValue = (cart: AggregatedCustomer['cart']) =>
      cart.reduce((s, i) => s + (priceById.get(i.productId) ?? 0) * i.quantity, 0);

    // ── Unify: seed from registered users, then fold order history in ─────────
    const map = new Map<string, AggregatedCustomer>();

    for (const u of users) {
      const key = u.phone || u.email;
      if (!key) continue;
      map.set(key, {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        district: u.district || 'Dhaka',
        address: u.fullAddress || 'Dhaka, Bangladesh',
        ip: u.ip || FALLBACK_IP,
        totalOrders: 0,
        totalSpent: 0,
        userBlocked: Boolean(u.isBlocked),
        registered: true,
        registeredAt: u.createdAt ? u.createdAt.toISOString() : null,
        cart: u.cart,
      });
    }

    for (const o of orders) {
      const key = o.shippingAddress?.phone || o.userEmail || 'Guest';
      const ip = o.userIp || FALLBACK_IP;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          id: o.orderNumber,
          name: o.shippingAddress?.fullName || 'Valued Customer',
          email: o.userEmail || `${o.shippingAddress?.phone || 'guest'}@falakcloset.com`,
          phone: o.shippingAddress?.phone || '',
          district: o.shippingAddress?.district || o.shippingAddress?.city || 'Dhaka',
          address: o.shippingAddress?.fullAddress || o.shippingAddress?.street || 'Dhaka, Bangladesh',
          ip,
          totalOrders: 1,
          totalSpent: o.total,
          userBlocked: false,
          registered: false,
          registeredAt: o.createdAt ? o.createdAt.toISOString() : null,
          cart: [],
        });
      } else {
        existing.totalOrders += 1;
        existing.totalSpent += o.total;
        if (!existing.ip || existing.ip === FALLBACK_IP) {
          existing.ip = ip;
        }
      }
    }

    const all = Array.from(map.values());
    const isBlocked = (c: AggregatedCustomer) => c.userBlocked || blockedIpSet.has(c.ip);
    const tier = (c: AggregatedCustomer): 'blocked' | 'vip' | 'active' => {
      if (isBlocked(c)) return 'blocked';
      if (c.totalSpent > 10000 || c.totalOrders >= 2) return 'vip';
      return 'active';
    };

    // ── KPI stats over the ENTIRE customer base (independent of filters) ──────
    const registeredCount = all.filter((c) => c.registered).length;
    const stats = {
      totalCustomers: all.length,
      vipCount: all.filter((c) => tier(c) === 'vip').length,
      blockedCount: all.filter((c) => tier(c) === 'blocked').length,
      lifetimeRevenue: all.reduce((s, c) => s + c.totalSpent, 0),
      openCartsCount: all.filter((c) => c.cart.length > 0).length,
      openCartValue: all.reduce((s, c) => s + cartValue(c.cart), 0),
      registeredCount,
      guestCount: Math.max(0, all.length - registeredCount),
      maxSpend: all.reduce((m, c) => Math.max(m, c.totalSpent), 0),
    };

    // ── Search (scope for the filter pills) ───────────────────────────────────
    const searched = query
      ? all.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.phone.includes(query) ||
            c.email.toLowerCase().includes(query) ||
            c.district.toLowerCase().includes(query) ||
            c.ip.includes(query)
        )
      : all;

    const counts = {
      all: searched.length,
      vip: searched.filter((c) => tier(c) === 'vip').length,
      active: searched.filter((c) => tier(c) === 'active').length,
      blocked: searched.filter((c) => tier(c) === 'blocked').length,
      cart: searched.filter((c) => c.cart.length > 0).length,
    };

    // ── Tier filter → sort → paginate ─────────────────────────────────────────
    const filtered =
      filter === 'all'
        ? searched
        : filter === 'cart'
          ? searched.filter((c) => c.cart.length > 0)
          : searched.filter((c) => tier(c) === filter);

    const dirMul = dir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name) * dirMul;
        case 'orders':
          return (a.totalOrders - b.totalOrders) * dirMul;
        case 'spent':
        default:
          return (a.totalSpent - b.totalSpent) * dirMul;
      }
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    return NextResponse.json({
      success: true,
      customers: pageItems.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        district: c.district,
        address: c.address,
        ip: c.ip,
        totalOrders: c.totalOrders,
        totalSpent: c.totalSpent,
        isBlocked: isBlocked(c),
        registeredAt: c.registeredAt,
        cart: c.cart,
      })),
      pagination: { page: safePage, pageSize, totalItems, totalPages },
      counts,
      stats,
    });
  } catch (error) {
    console.error('[GET /api/customers]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
