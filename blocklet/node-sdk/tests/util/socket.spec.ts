/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-console */
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
// @ts-ignore
import { Socket } from 'phoenix';
import { safeDisconnect } from '../../src/util/socket';

// eslint-disable-next-line no-promise-executor-return
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createDelayedWsServer({ delay = 1500 } = {}) {
  const server = http.createServer();
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (req, socket, head) => {
    setTimeout(() => {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }, delay);
  });
  return { server, wss };
}

describe('Compare Phoenix disconnect behaviors', () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    const { server: s } = createDelayedWsServer({ delay: 2000 });
    server = s;
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = (server.address() as { port: number }).port;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  // New safe wrapper
  it('should NOT crash using safeDisconnect', async () => {
    const url = `ws://127.0.0.1:${port}/socket`;
    const client = new Socket(url, {
      heartbeatIntervalMs: 500,
      transport: WebSocket,
    });

    client.connect();
    await sleep(50);

    // Safe wrapper call
    await safeDisconnect(client);

    await sleep(100);

    const state = client.conn?.readyState ?? 'no-conn';
    console.log('[safeDisconnect] connectionState =', state);

    // Ensure it does not crash
    expect([undefined, 0, 1, 2, 3, 'no-conn']).toContain(state);
  });

  it('should safely disconnect even if connection never establishes', async () => {
    const url = `ws://127.0.0.1:${port}/socket`;

    const client = new Socket(url, {
      heartbeatIntervalMs: 500,
      transport: WebSocket,
      timeout: 1000,
    });

    // Start connection, but the server never responds to upgrade
    client.connect();

    await sleep(100); // Ensure conn has been created but remains CONNECTING

    expect(client.conn?.readyState).toBe(0);

    // Call safe disconnect
    await safeDisconnect(client);

    await sleep(200); // Wait for internal cleanup to finish

    const state = client.conn?.readyState ?? 'no-conn';
    console.log('final state =', state);

    // Verify no exception is thrown; CONNECTING/CLOSED/NULL are all acceptable
    expect([undefined, 0, 2, 3, 'no-conn']).toContain(state);
  });
});
