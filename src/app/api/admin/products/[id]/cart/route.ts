import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/session';
import { isObjectId } from '@/lib/products';

type RouteContext = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing product ID' }, { status: 400 });
    }

    // Find the product by ID or slug
    const product = await prisma.product.findFirst({
      where: isObjectId(id) ? { OR: [{ id }, { slug: id }] } : { slug: id },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Target product identifiers to match in user carts (both ID and slug)
    const targetProductIds = new Set([product.id, product.slug].filter(Boolean));

    // Fetch all users with non-empty carts
    const users = await prisma.user.findMany({
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
    });

    // Fetch all orders to compute customer lifetime spend & order counts
    const orders = await prisma.order.findMany({
      select: {
        total: true,
        userEmail: true,
        shippingAddress: true,
      },
    });

    // Create lookup for total spent and order counts by phone/email
    const userOrderStats = new Map<string, { totalOrders: number; totalSpent: number }>();
    for (const o of orders) {
      const keyPhone = o.shippingAddress?.phone;
      const keyEmail = o.userEmail;

      const keys = [keyPhone, keyEmail].filter(Boolean) as string[];
      for (const k of keys) {
        const curr = userOrderStats.get(k) || { totalOrders: 0, totalSpent: 0 };
        curr.totalOrders += 1;
        curr.totalSpent += o.total;
        userOrderStats.set(k, curr);
      }
    }

    const cartUsers: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      district: string;
      fullAddress: string;
      ip: string;
      isBlocked: boolean;
      registeredAt: string;
      totalOrders: number;
      totalSpent: number;
      cartItems: Array<{
        selectedColor: string;
        selectedSize: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }>;
      totalUserQuantity: number;
      totalUserCartValue: number;
    }> = [];

    const variantMap = new Map<
      string,
      { color: string; size: string; userCount: number; totalQuantity: number }
    >();

    let totalCartUnits = 0;
    let totalCartValue = 0;

    for (const u of users) {
      const matchingItems = u.cart.filter((item) => targetProductIds.has(item.productId));

      if (matchingItems.length > 0) {
        const stats =
          userOrderStats.get(u.phone) ||
          userOrderStats.get(u.email) || { totalOrders: 0, totalSpent: 0 };

        let totalUserQuantity = 0;
        let totalUserCartValue = 0;

        const cartItems = matchingItems.map((item) => {
          // Check for price overrides in product variations
          let unitPrice = product.price;
          if (product.variations && product.variations.length > 0) {
            const variant = product.variations.find(
              (v) => v.colorName === item.selectedColor && v.size === item.selectedSize
            );
            if (variant?.price) {
              unitPrice = variant.price;
            }
          }

          const lineTotal = unitPrice * item.quantity;
          totalUserQuantity += item.quantity;
          totalUserCartValue += lineTotal;

          // Track variation statistics
          const variantKey = `${item.selectedColor || 'Standard'} / ${item.selectedSize || 'Standard'}`;
          const existingVariant = variantMap.get(variantKey) || {
            color: item.selectedColor || 'Standard',
            size: item.selectedSize || 'Standard',
            userCount: 0,
            totalQuantity: 0,
          };
          existingVariant.userCount += 1;
          existingVariant.totalQuantity += item.quantity;
          variantMap.set(variantKey, existingVariant);

          return {
            selectedColor: item.selectedColor || 'Default',
            selectedSize: item.selectedSize || 'Free Size',
            quantity: item.quantity,
            unitPrice,
            lineTotal,
          };
        });

        totalCartUnits += totalUserQuantity;
        totalCartValue += totalUserCartValue;

        cartUsers.push({
          id: u.id,
          name: u.name || 'Valued Customer',
          email: u.email || '',
          phone: u.phone || '',
          district: u.district || 'Dhaka',
          fullAddress: u.fullAddress || '',
          ip: u.ip || '103.24.12.89',
          isBlocked: Boolean(u.isBlocked),
          registeredAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
          totalOrders: stats.totalOrders,
          totalSpent: stats.totalSpent,
          cartItems,
          totalUserQuantity,
          totalUserCartValue,
        });
      }
    }

    const variantBreakdown = Array.from(variantMap.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );

    return NextResponse.json({
      success: true,
      productId: product.id,
      productName: product.name,
      stats: {
        totalCartUsers: cartUsers.length,
        totalCartUnits,
        totalCartValue,
      },
      variantBreakdown,
      users: cartUsers,
    });
  } catch (error) {
    console.error('[GET /api/admin/products/[id]/cart]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product cart analytics' },
      { status: 500 }
    );
  }
}
