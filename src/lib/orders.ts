/**
 * orders.ts — shared shaping for the orders API.
 *
 * Two things this file exists to reconcile:
 *
 * 1. **Order number vs id.** The app generates and tracks by `FLK-12345`
 *    (`CartContext.placeOrder`, `AdminCreateOrderModal`), but under Prisma `id`
 *    is the Mongo ObjectId. The number lives in `orderNumber`, and
 *    `serializeOrder` puts it back on `id` so no caller has to change.
 * 2. **Unknown keys.** Writers post whole UI objects, including keys Prisma has
 *    no column for (`createdAt: Date.now()` as a number, for one). Prisma rejects
 *    unknown fields, so every write goes through `buildOrderData`.
 */

import type { Order as OrderRow, Prisma } from '@prisma/client';

/** Statuses the admin UI can set. Stored as a plain String — see the schema comment. */
export const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Quality Checked',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

function opt<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

function toStr(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

function toNum(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

function toInt(value: unknown, fallback = 0): number {
  return Math.trunc(toNum(value, fallback));
}

type Raw = Record<string, unknown>;

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderValidationError';
  }
}

/** `Date` objects cannot cross to a Client Component, and `id` must read as the FLK number. */
export function serializeOrder(row: OrderRow) {
  return {
    id: row.orderNumber,
    _id: row.id,
    orderNumber: row.orderNumber,
    date: row.date,
    items: row.items,
    subtotal: row.subtotal,
    discount: row.discount,
    shippingFee: row.shippingFee,
    total: row.total,
    status: row.status,
    shippingAddress: {
      fullName: row.shippingAddress.fullName,
      phone: row.shippingAddress.phone,
      district: opt(row.shippingAddress.district),
      fullAddress: opt(row.shippingAddress.fullAddress),
      street: opt(row.shippingAddress.street),
      city: opt(row.shippingAddress.city),
      country: opt(row.shippingAddress.country),
      postalCode: opt(row.shippingAddress.postalCode),
    },
    userEmail: opt(row.userEmail),
    userIp: opt(row.userIp),
    deliveryMethod: opt(row.deliveryMethod),
    paymentMethod: opt(row.paymentMethod),
    trackingNumber: opt(row.trackingNumber),
    estimatedDelivery: opt(row.estimatedDelivery),
    deliveryZone: opt(row.deliveryZone),
    deliverySubArea: opt(row.deliverySubArea),
    paymentSenderNumber: opt(row.paymentSenderNumber),
    paymentTrxId: opt(row.paymentTrxId),
    paymentStatus: opt(row.paymentStatus),
    promoCode: opt(row.promoCode),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((i): i is Raw => Boolean(i) && typeof i === 'object')
    .map((i) => ({
      // A snapshot of the product as sold — deliberately Json, so historical
      // orders keep their prices when the catalog entry later changes.
      product: (i.product ?? {}) as Prisma.InputJsonValue,
      selectedColor: toStr(i.selectedColor),
      selectedSize: toStr(i.selectedSize),
      quantity: Math.max(1, toInt(i.quantity, 1)),
    }));
}

function toShippingAddress(value: unknown) {
  const raw: Raw = value && typeof value === 'object' ? (value as Raw) : {};

  const fullName = toStr(raw.fullName);
  const phone = toStr(raw.phone);
  if (!fullName || !phone) {
    throw new OrderValidationError('Shipping address needs at least a full name and phone number');
  }

  const optional = (value: unknown): string | undefined => toStr(value) || undefined;

  // Built field-by-field rather than by spreading a computed-key helper: a
  // `{ [k: string]: string }` spread leaks an index signature into the return
  // type, and that collides with the `set?: never` arm of Prisma's composite
  // create input. `undefined` means "not provided" to Prisma, so absent fields
  // stay absent.
  return {
    fullName,
    phone,
    district: optional(raw.district),
    fullAddress: optional(raw.fullAddress),
    street: optional(raw.street),
    city: optional(raw.city),
    country: optional(raw.country),
    postalCode: optional(raw.postalCode),
  };
}

/** Fallback for a writer that did not supply one. Both current writers do. */
function generateOrderNumber(): string {
  return `FLK-${Math.floor(10000 + Math.random() * 90000)}`;
}

export function buildOrderData(body: Raw): Prisma.OrderCreateInput {
  const items = toItems(body.items);
  if (items.length === 0) {
    throw new OrderValidationError('An order needs at least one item');
  }

  const subtotal = toNum(body.subtotal);
  const discount = toNum(body.discount);
  const shippingFee = toNum(body.shippingFee);

  return {
    orderNumber: toStr(body.orderNumber) || toStr(body.id) || generateOrderNumber(),
    date: toStr(body.date) || new Date().toISOString(),
    items,
    subtotal,
    discount,
    shippingFee,
    total: toNum(body.total, Math.max(0, subtotal - discount + shippingFee)),
    status: toStr(body.status) || 'Processing',
    shippingAddress: toShippingAddress(body.shippingAddress),
    ...(toStr(body.userEmail) ? { userEmail: toStr(body.userEmail) } : {}),
    ...(toStr(body.userIp) ? { userIp: toStr(body.userIp) } : {}),
    ...(toStr(body.deliveryMethod) ? { deliveryMethod: toStr(body.deliveryMethod) } : {}),
    ...(toStr(body.paymentMethod) ? { paymentMethod: toStr(body.paymentMethod) } : {}),
    ...(toStr(body.trackingNumber) ? { trackingNumber: toStr(body.trackingNumber) } : {}),
    ...(toStr(body.estimatedDelivery)
      ? { estimatedDelivery: toStr(body.estimatedDelivery) }
      : {}),
    ...(toStr(body.deliveryZone) ? { deliveryZone: toStr(body.deliveryZone) } : {}),
    ...(toStr(body.deliverySubArea) ? { deliverySubArea: toStr(body.deliverySubArea) } : {}),
    ...(toStr(body.paymentSenderNumber) ? { paymentSenderNumber: toStr(body.paymentSenderNumber) } : {}),
    ...(toStr(body.paymentTrxId) ? { paymentTrxId: toStr(body.paymentTrxId) } : {}),
    ...(toStr(body.paymentStatus) ? { paymentStatus: toStr(body.paymentStatus) } : {}),
    ...(toStr(body.promoCode) ? { promoCode: toStr(body.promoCode) } : {}),
  };
}
