const { test, expect, describe, beforeEach, afterAll, beforeAll, mock } = require('bun:test');
const { default: axios } = require('axios');

const {
  getDID,
  updateServerDocument,
  getServerServices,
  getBlockletServices,
  getRetryCount,
  DEFAULT_RETRY_COUNT,
  getDebounceTime,
  DEFAULT_DEBOUNCE_TIME,
} = require('../lib/did-document');
const { encode } = require('../lib/base32');

const testDidRegistryUrl = 'https://test.arc.registry.com';
const testDidDomain = 'did.abtnet.io';
const wallet = {
  type: { role: 0, pk: 0, hash: 1, address: 1 },
  secretKey:
    '0x4cc391c89af8df8fd2b33755980d409b761b18f1b6f5f1475751eeef64a9e0678be7856d2d33fe1523f4517d4f97d3a217aa7a3e2b2cd46d3933aee10f88cf91',
  publicKey: '0x8be7856d2d33fe1523f4517d4f97d3a217aa7a3e2b2cd46d3933aee10f88cf91',
  address: 'z1U1xjtfuNKHL2VDwRnS1tWx2fXDSCq2Vwu',
  sign: () => 'signed',
};

describe('did-document', () => {
  beforeAll(() => {
    axios.post = mock().mockImplementation(() => {});
  });

  describe('getServerServices', () => {
    test('should return expected services', () => {
      const services = getServerServices({ ips: ['192.168.0.1'], wallet, domain: testDidDomain });

      expect(services[0].type).toEqual('DNSRecords');
      expect(services[0].records[0].type).toEqual('A');
      expect(services[0].records[0].rr).toEqual(encode(wallet.address));
      expect(services[0].records[0].value).toEqual('192.168.0.1');
    });
  });

  describe('getBlockletServices', () => {
    test('should return expected services', () => {
      const services = getBlockletServices({
        appPid: wallet.address,
        daemonDidDomain: 'test.com',
        domain: testDidDomain,
      });

      expect(services[0].type).toEqual('DNSRecords');
      expect(services[0].records[0].type).toEqual('CNAME');
      expect(services[0].records[0].rr).toEqual(encode(wallet.address));
      expect(services[0].records[0].value).toEqual('test.com');
    });

    test('should add CNAME records for migrated alsoKnownAs DIDs', () => {
      const migratedDid = 'z1migratedDidAddress1234567890abc';
      const services = getBlockletServices({
        appPid: wallet.address,
        appAlsoKnownAs: [wallet.address, migratedDid],
        daemonDidDomain: 'test.com',
        domain: testDidDomain,
      });

      expect(services[0].records).toHaveLength(2);
      expect(services[0].records[0].rr).toEqual(encode(wallet.address));
      expect(services[0].records[1].rr).toEqual(encode(migratedDid));
      expect(services[0].records[1].value).toEqual('test.com');
      expect(services[0].records[1].domain).toEqual(testDidDomain);
    });

    test('should not duplicate CNAME records for appPid already in alsoKnownAs', () => {
      const services = getBlockletServices({
        appPid: wallet.address,
        appAlsoKnownAs: [wallet.address],
        daemonDidDomain: 'test.com',
        domain: testDidDomain,
      });

      expect(services[0].records).toHaveLength(1);
    });
  });

  describe('updateServerDocument', () => {
    test('should throw error if ip list is empty', () => {
      expect(updateServerDocument({})).rejects.toThrow(/No DID Document to update/);
      expect(updateServerDocument({ ips: [] })).rejects.toThrow(/No DID Document to update/);
      expect(updateServerDocument({ ips: [null] })).rejects.toThrow(/No DID Document to update/);
    });

    test('should call registry service as expected', async () => {
      const ips = ['192.168.0.1'];

      await updateServerDocument({ ips, wallet, didRegistryUrl: testDidRegistryUrl, domain: testDidDomain });
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDID', () => {
    test('should return original value if it is invalid', () => {
      expect(getDID(null)).toEqual(null);
      expect(getDID({})).toEqual({});
      expect(getDID({ a: 1 })).toEqual({ a: 1 });
    });

    test('should return correct did', () => {
      const testDid = 'test-did';

      expect(getDID(testDid)).toEqual(`did:abt:${testDid}`);
      expect(`did:abt:${testDid}`).toEqual(`did:abt:${testDid}`);
    });
  });

  describe('getRetryCount', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      mock.clearAllMocks();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    test('should return default retry count when env is not set', () => {
      delete process.env.ABT_NODE_UPDATE_DID_DOCUMENT_RETRY_COUNT;
      expect(getRetryCount()).toBe(DEFAULT_RETRY_COUNT);
    });

    test('should return env retry count when valid', () => {
      process.env.ABT_NODE_UPDATE_DID_DOCUMENT_RETRY_COUNT = '10';
      expect(getRetryCount()).toBe(10);
    });

    test('should return default retry count when env is invalid', () => {
      process.env.ABT_NODE_UPDATE_DID_DOCUMENT_RETRY_COUNT = 'invalid';
      expect(getRetryCount()).toBe(DEFAULT_RETRY_COUNT);
    });

    test('should return default retry count when env is empty', () => {
      process.env.ABT_NODE_UPDATE_DID_DOCUMENT_RETRY_COUNT = '';
      expect(getRetryCount()).toBe(DEFAULT_RETRY_COUNT);
    });
  });

  describe('getDebounceTime', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      mock.clearAllMocks();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    test('should return default debounce time when env is not set', () => {
      delete process.env.ABT_NODE_DID_DOCUMENT_DEBOUNCE_TIME;
      expect(getDebounceTime()).toBe(DEFAULT_DEBOUNCE_TIME);
    });

    test('should return env debounce time when valid', () => {
      process.env.ABT_NODE_DID_DOCUMENT_DEBOUNCE_TIME = '10000';
      expect(getDebounceTime()).toBe(10000);
    });

    test('should return default debounce time when env is invalid', () => {
      process.env.ABT_NODE_DID_DOCUMENT_DEBOUNCE_TIME = 'invalid';
      expect(getDebounceTime()).toBe(DEFAULT_DEBOUNCE_TIME);
    });
  });
});
