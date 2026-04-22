const { expect, describe, it, mock } = require('bun:test');
const { getDeviceData } = require('../lib/device');

const DEVICE_HEADERS = {
  CLIENT_NAME: 'device-client-name',
  MESSAGE_TOKEN: 'device-message-token',
  DEVICE_ID: 'device-id',
  WALLET_MESSAGE_TOKEN: 'wallet-device-message-token',
  WALLET_DEVICE_ID: 'wallet-device-id',
};

describe('getDeviceData', () => {
  it('returns null if req is not provided', () => {
    expect(getDeviceData({ req: undefined })).toBeNull();
    expect(getDeviceData({ req: null })).toBeNull();
  });

  it('returns correct data when all device headers are present', () => {
    const req = {
      get: mock((header) => {
        switch (header) {
          case DEVICE_HEADERS.CLIENT_NAME:
            return 'client-x';
          case DEVICE_HEADERS.MESSAGE_TOKEN:
            return 'token-x';
          case DEVICE_HEADERS.DEVICE_ID:
            return 'device-x';
          case DEVICE_HEADERS.WALLET_MESSAGE_TOKEN:
            return 'wallet-token-x';
          case DEVICE_HEADERS.WALLET_DEVICE_ID:
            return 'wallet-device-x';
          default:
            return undefined;
        }
      }),
    };
    expect(getDeviceData({ req })).toEqual({
      clientName: 'client-x',
      id: 'device-x',
      messageToken: 'token-x',
    });
  });

  it('falls back to wallet headers if device headers are missing', () => {
    const req = {
      get: mock((header) => {
        switch (header) {
          case DEVICE_HEADERS.CLIENT_NAME:
            return 'client-y';
          case DEVICE_HEADERS.MESSAGE_TOKEN:
            return undefined;
          case DEVICE_HEADERS.DEVICE_ID:
            return undefined;
          case DEVICE_HEADERS.WALLET_MESSAGE_TOKEN:
            return 'wallet-token-y';
          case DEVICE_HEADERS.WALLET_DEVICE_ID:
            return 'wallet-device-y';
          default:
            return undefined;
        }
      }),
    };
    expect(getDeviceData({ req })).toEqual({
      clientName: 'client-y',
      id: 'wallet-device-y',
      messageToken: 'wallet-token-y',
    });
  });

  it('returns undefined for id and messageToken if all relevant headers are missing', () => {
    const req = {
      get: mock(() => undefined),
    };
    expect(getDeviceData({ req })).toEqual({
      clientName: undefined,
      id: undefined,
      messageToken: undefined,
    });
  });
});
