'use client';

import { io, Socket } from 'socket.io-client';
import { OrderRecord } from '@/context/CartContext';

/**
 * Realtime transport policy (Vercel deployment — no socket server):
 *
 * This project deploys to Vercel, which cannot host the long-lived
 * `socket-server.js` process. Realtime therefore runs in one of two modes:
 *
 *  • POLLING (default in production): no `NEXT_PUBLIC_SOCKET_URL` is set, so
 *    no socket connection is attempted at all. New-order alerts come from the
 *    admin provider's periodic sync (sound + toast + instant table prepend,
 *    delayed by at most one interval). Zero extra infrastructure.
 *
 *  • SOCKET (opt-in): set `NEXT_PUBLIC_SOCKET_URL=https://your-socket-host`
 *    (e.g. a Railway/Render service running `node socket-server.js`) and
 *    redeploy — alerts become instant. Local dev keeps the zero-config
 *    `http://localhost:3001` default (`npm run socket`).
 */

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

/** True when a socket server is configured (explicitly, or implied in dev). */
export const isSocketEnabled = Boolean(SOCKET_URL);

let socketInstance: Socket | null = null;

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
  if (!isSocketEnabled) return; // polling mode — the admin sync will pick it up
  try {
    const socket = getSocket();
    socket.emit('new_order', order);
  } catch (err) {
    console.error('[Socket Client] Failed to emit order notification:', err);
  }
}
