import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
// @ts-ignore
import sleep from '@abtnode/util/lib/sleep';
import { clearEnvironment, setEnvironment } from '../../tools/environment';

const mockConnect = mock();
const mockDisconnect = mock();

let shouldTriggerJoinError = false;

// Mock @arcblock/ws module
mock.module('@arcblock/ws', () => ({
  WsClient: class MockWsClient {
    constructor(
      public url: string,
      public options: any
    ) {}

    connect() {
      mockConnect();
    }

    disconnect() {
      mockDisconnect();
    }

    onError() {}

    onClose() {}

    channel() {
      return {
        join() {
          return this;
        },
        receive(status: string, callback: (err?: any) => void) {
          if (status === 'ok' && !shouldTriggerJoinError) {
            // Normal case: trigger success immediately
            setImmediate(() => callback());
          }

          if (status === 'error' && shouldTriggerJoinError) {
            // Trigger error after a short delay
            setTimeout(() => callback(new Error('verify did failed')), 1000);
          }

          return this;
        },
        on() {
          return this;
        },
      };
    }
  },
}));

// Now import NotificationService after mocking
// eslint-disable-next-line import/first
import NotificationService, { cleanup, getConnectionToken } from '../../src/service/notification';

describe('NotificationService Reconnection', () => {
  const OLD_ENV = process.env;

  beforeAll(() => {
    process.env = { ...OLD_ENV, BLOCKLET_MODE: '' };
    cleanup();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  beforeEach(() => {
    setEnvironment('9999');
    shouldTriggerJoinError = false;
    mockConnect.mockClear();
    mockDisconnect.mockClear();
  });

  afterEach(() => {
    clearEnvironment();
    cleanup();
  });

  test('should generate token on initial connection', async () => {
    await NotificationService.on('message', () => {});

    // Should have called connect
    expect(mockConnect).toHaveBeenCalled();
    // Should have generated initial token
    expect(getConnectionToken()).not.toBeNull();
  });

  test('should auto-refresh token after 3 seconds in test environment', async () => {
    await NotificationService.on('message', () => {});

    // Get initial token
    const initialToken = getConnectionToken();
    expect(initialToken).not.toBeNull();

    // Wait for auto-refresh (3 seconds in test environment)
    await sleep(3500);

    // Should have refreshed automatically
    const newToken = getConnectionToken();
    expect(newToken).not.toBeNull();
    expect(newToken).not.toBe(initialToken);
  });

  test('should refresh token when join error occurs', async () => {
    // Enable join errors
    shouldTriggerJoinError = true;

    await NotificationService.on('message', () => {});

    // Get initial token
    const initialToken = getConnectionToken();

    // Wait for error to be triggered (1000ms) + debounce (300ms) + async signJWT
    await sleep(1500);

    // Should have refreshed token after error
    const newToken = getConnectionToken();
    expect(newToken).not.toBe(initialToken);
  });

  test('should cleanup timer on cleanup', async () => {
    await NotificationService.on('message', () => {});

    const initialToken = getConnectionToken();
    expect(initialToken).not.toBeNull();

    cleanup();

    expect(getConnectionToken()).toBeNull();

    // Wait longer than the refresh interval (3 seconds)
    // Token should still be null (timer was stopped)
    await sleep(3500);
    expect(getConnectionToken()).toBeNull();
  });
});
