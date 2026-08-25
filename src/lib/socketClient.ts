'use client';

import { io, Socket } from 'socket.io-client';
import { OrderRecord } from '@/context/CartContext';

let socketInstance: Socket | null = null;

export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function getSocket(): Socket {
  if (!socketInstance) {
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

export function sendNewOrderNotification(order: OrderRecord) {
  try {
    const socket = getSocket();
    socket.emit('new_order', order);
  } catch (err) {
    console.error('[Socket Client] Failed to emit order notification:', err);
  }
}
