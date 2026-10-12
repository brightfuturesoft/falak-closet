'use client';

import { io, Socket } from 'socket.io-client';
import { OrderRecord } from '@/context/CartContext';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'http://localhost:3001');

/** True when a socket server is configured (explicitly or locally). */
export const isSocketEnabled = Boolean(SOCKET_URL);

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });
  }

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
}

/** Emit a new purchase notification to alert admins in real time */
export function sendNewOrderNotification(order: OrderRecord) {
  if (!isSocketEnabled) return;
  try {
    const socket = getSocket();
    socket.emit('new_order', order);
  } catch (err) {
    console.error('[Socket Client] Failed to emit order notification:', err);
  }
}

/** Emit an order status / payment / courier update event */
export function sendOrderUpdateNotification(orderData: Partial<OrderRecord> & { id: string; orderId?: string }) {
  if (!isSocketEnabled) return;
  try {
    const socket = getSocket();
    socket.emit('order_update', orderData);
  } catch (err) {
    console.error('[Socket Client] Failed to emit order update:', err);
  }
}

/** Emit a product catalog change (create, edit, delete, stock update) */
export function sendProductUpdateNotification(payload: {
  type: 'create' | 'update' | 'delete';
  product?: any;
  id?: string;
}) {
  if (!isSocketEnabled) return;
  try {
    const socket = getSocket();
    socket.emit('product_update', payload);
  } catch (err) {
    console.error('[Socket Client] Failed to emit product update:', err);
  }
}

/** Emit a promotion voucher change */
export function sendPromotionUpdateNotification(payload?: any) {
  if (!isSocketEnabled) return;
  try {
    const socket = getSocket();
    socket.emit('promotion_update', payload);
  } catch (err) {
    console.error('[Socket Client] Failed to emit promotion update:', err);
  }
}

/** Emit a category taxonomy change */
export function sendCategoryUpdateNotification(payload?: any) {
  if (!isSocketEnabled) return;
  try {
    const socket = getSocket();
    socket.emit('category_update', payload);
  } catch (err) {
    console.error('[Socket Client] Failed to emit category update:', err);
  }
}

/** Emit a store settings change */
export function sendSettingsUpdateNotification(payload?: any) {
  if (!isSocketEnabled) return;
  try {
    const socket = getSocket();
    socket.emit('settings_update', payload);
  } catch (err) {
    console.error('[Socket Client] Failed to emit settings update:', err);
  }
}
