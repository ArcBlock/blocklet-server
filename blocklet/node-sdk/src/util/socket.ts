import type { Socket } from 'phoenix';

/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
export async function safeDisconnect(socket: Socket): Promise<void> {
  try {
    if (!socket) return;

    const conn = socket.conn ?? socket.socket?.conn ?? null;
    if (!conn) {
      socket.conn = null;
      return;
    }

    let state = conn.readyState;

    // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
    if (state === 0) {
      let attempts = 0;
      const MAX_ATTEMPTS = 10;
      while (conn.readyState === 0 && attempts < MAX_ATTEMPTS) {
        console.warn(
          `[safeDisconnect] Connection still CONNECTING, waiting before disconnect... attempts: ${attempts} / ${MAX_ATTEMPTS}`
        );
        await new Promise((resolve) => {
          setTimeout(resolve, 300);
        });
        attempts += 1;
        if (conn.readyState !== 0) break;
      }

      if (conn.readyState === 0) {
        console.warn(
          '[safeDisconnect] Connection still CONNECTING after 10 attempts, skipping disconnect to avoid crash.'
        );
        return;
      }

      state = conn.readyState;
      console.log(`[safeDisconnect] Connection state changed to ${state} after waiting ${attempts * 300}ms`);
    }

    if (state === 1 || state === 2) {
      try {
        // Phoenix's disconnect is an async teardown
        await new Promise<void>((resolve) => {
          socket?.disconnect?.(() => resolve());
          // Fallback: prevent the callback from never firing
          setTimeout(resolve, 1500);
        });
      } catch (err) {
        console.warn('[safeDisconnect] socket.disconnect threw', err);
        try {
          conn.close();
        } catch (closeErr) {
          console.warn('[safeDisconnect] conn.close threw', closeErr);
        }
      }
    } else if (state === 3) {
      console.log('[safeDisconnect] Already CLOSED');
    }

    // Final cleanup: clear the socket reference
    if (socket) {
      socket.conn = null;
    }
  } catch (err) {
    console.error('[safeDisconnect] Unexpected error', err);
  }
}
