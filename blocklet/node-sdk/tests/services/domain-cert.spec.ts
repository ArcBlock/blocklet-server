// @eslint-disable-next
import { describe, test, expect, beforeEach } from 'bun:test';
import { setEnvironment } from '../../tools/environment';
import { BlockletService } from '../../src/index';

process.env.BLOCKLET_LOG_DIR = '/tmp/abtnode/test-log';
setEnvironment();

describe('Domain and Certificate API', () => {
  beforeEach(() => {
    setEnvironment();
  });

  describe('API existence', () => {
    test('domain alias api should exist', () => {
      const client = new BlockletService();
      expect(typeof client.addDomainAlias).toBe('function');
      expect(typeof client.deleteDomainAlias).toBe('function');
    });

    test('certificate api should exist', () => {
      const client = new BlockletService();
      expect(typeof client.findCertificateByDomain).toBe('function');
    });
  });

  describe('API not in whitelist should be undefined', () => {
    test('non-existent api should be undefined', () => {
      const client = new BlockletService();
      // @ts-ignore
      expect(typeof client.nonExistentMethod).toBe('undefined');
    });
  });
});
