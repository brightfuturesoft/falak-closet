/**
 * Server-side broadcaster for Next.js route handlers.
 * Sends an event to the local or remote Socket.IO server's /broadcast endpoint.
 */
export async function broadcastSocketEventServer(event: string, data: any): Promise<void> {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${socketUrl}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data }),
      // Short timeout so API routes never hang if socket server is unreachable
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) {
      console.warn(`[Socket Broadcast] Server returned status ${res.status}`);
    }
  } catch (err) {
    // Non-blocking catch — serverless functions shouldn't fail if socket server is offline
    // (e.g. dev server restarted)
  }
}
