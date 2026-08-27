'use client';

import type { Socket } from 'socket.io-client';
import { OrderRecord } from '@/context/CartContext';

let socketInstance: Socket | null = null;

export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

/**
 * Lazily create/connect the admin notification socket.
 *
 * socket.io-client (~40KB gz) is imported dynamically so the storefront's
 * shared bundle stays lean — the library only downloads on the admin panel
 * or the moment an order is actually placed.
 */
export async function getSocket(): Promise<Socket> {
  if (!socketInstance) {
    const { io } = await import('socket.io-client');
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
  }

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
}

export async function sendNewOrderNotification(order: OrderRecord) {
  try {
    const socket = await getSocket();
    socket.emit('new_order', order);
  } catch (err) {
    console.error('[Socket Client] Failed to emit order notification:', err);
  }
}
