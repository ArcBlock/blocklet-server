const { test, describe, expect } = require('bun:test');
/* eslint-disable no-underscore-dangle */
const { fromRandom } = require('@ocap/wallet');
const { toBase58 } = require('@ocap/util');

const ABTNodeClient = require('..');

describe('ABTNodeClient', () => {
  test('should be a function', () => {
    expect(typeof ABTNodeClient).toEqual('function');
  });

  const endpoint = 'http://127.0.0.1:4000/graphql';
  const client = new ABTNodeClient(endpoint);
  test('should have many query methods', () => {
    expect(client.getQueries().length).toBeGreaterThan(0);
  });

  test('should have many mutation methods', () => {
    expect(client.getMutations().length).toBeGreaterThan(0);
  });

  test('should have basic blocklet action methods', () => {
    expect(typeof client.installBlocklet).toEqual('function');
    expect(typeof client.startBlocklet).toEqual('function');
    expect(typeof client.stopBlocklet).toEqual('function');
    expect(typeof client.restartBlocklet).toEqual('function');
    expect(typeof client.reloadBlocklet).toEqual('function');
    expect(typeof client.deleteBlocklet).toEqual('function');
  });

  test('should have basic node methods', () => {
    expect(typeof client.updateNodeInfo).toEqual('function');
  });

  test('should have basic team methods', () => {
    expect(typeof client.getUsers).toEqual('function');
    expect(typeof client.removeUser).toEqual('function');
    expect(typeof client.getRoles).toEqual('function');
    expect(typeof client.getPermissions).toEqual('function');
  });

  test('should have basic query methods', () => {
    expect(typeof client.getBlocklets).toEqual('function');
    expect(typeof client.getBlocklet).toEqual('function');
    expect(typeof client.getNodeInfo).toEqual('function');
  });

  test('should _getAuthHeaders works correctly', async () => {
    client.setAuthToken(() => 'xxxxxx');

    const headers = await client._getAuthHeaders();

    expect(headers.Authorization).toEqual('Bearer xxxxxx');
    expect(headers['x-timezone']).toBeDefined();
  });

  test('should _getSocketEndpoint works correctly', () => {
    expect(client._getSocketEndpoint('http://example.com')).toEqual('ws://example.com/socket');
    expect(client._getSocketEndpoint('https://example.com')).toEqual('wss://example.com/socket');
  });

  test('should setAuthAccessKey works correctly', async () => {
    const wallet = fromRandom();
    const accessKeyId = toBase58(wallet.address);
    const accessKeySecret = toBase58(wallet.secretKey);

    expect(() => client.setAuthAccessKey({ accessKeyId, accessKeySecret })).not.toThrow();

    const headers = await client._getAuthHeaders();
    expect(headers['x-access-key-id']).toEqual(accessKeyId);
    expect(headers['x-access-stamp']).toBeTruthy();
    expect(headers['x-access-signature']).toBeTruthy();
  });

  test('should setAuthAccessKey works correctly (type: totp & sha256', async () => {
    client.setAuthAccessKey({ accessKeyId: 'mockId', accessKeySecret: 'mockSecret', type: 'totp' });
    const headers = await client._getAuthHeaders();
    expect(headers['x-access-alg']).toEqual('totp');
    expect(headers['x-access-key-id']).toEqual('mockId');
    expect(headers['x-access-signature']).toMatch(/\d{6}/);
    expect(headers['x-access-stamp']).toBeFalsy();

    client.setAuthAccessKey({ accessKeyId: 'mockId', accessKeySecret: Buffer.from('mockSecret'), type: 'totp' });
    const headers2 = await client._getAuthHeaders();
    expect(headers2['x-access-alg']).toEqual('totp');
    expect(headers2['x-access-key-id']).toEqual('mockId');
    expect(headers2['x-access-signature']).toMatch(/\d{6}/);
    expect(headers2['x-access-signature']).toEqual(headers['x-access-signature']);
    expect(headers2['x-access-stamp']).toBeFalsy();

    client.setAuthAccessKey({ accessKeyId: 'mockId', accessKeySecret: 'mockSecret', type: 'sha256' });
    const headers3 = await client._getAuthHeaders();
    expect(headers3['x-access-alg']).toEqual('sha256');
    expect(headers3['x-access-key-id']).toEqual('mockId');
    expect(headers3['x-access-signature']).toBeTruthy();
    expect(headers3['x-access-signature']).not.toBe(headers2['x-access-signature']);
    expect(headers3['x-access-stamp']).toBeFalsy();

    client.setAuthAccessKey({ accessKeyId: 'mockId', accessKeySecret: Buffer.from('mockSecret'), type: 'sha256' });
    const headers4 = await client._getAuthHeaders();
    expect(headers4['x-access-alg']).toEqual('sha256');
    expect(headers4['x-access-key-id']).toEqual('mockId');
    expect(headers4['x-access-signature']).toBeTruthy();
    expect(headers4['x-access-signature']).toEqual(headers3['x-access-signature']);
    expect(headers4['x-access-stamp']).toBeFalsy();
  });
});
