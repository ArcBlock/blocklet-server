const { test, expect, describe, beforeAll, afterAll } = require('bun:test');
const fs = require('fs');
const path = require('path');
const { doSchemaMigration } = require('@abtnode/models');
// eslint-disable-next-line import/no-extraneous-dependencies
const { getDbFilePath } = require('@abtnode/core/lib/util');

const states = require('../../states');
const { CERT_SOURCE } = require('../../libs/constant');

const dataDir = `/tmp/certificate-manager-test/${Date.now()}`;

describe('Certificate State', () => {
  beforeAll(async () => {
    await doSchemaMigration(getDbFilePath(path.join(dataDir, 'module.db')), 'certificate-manager');
    states.init(dataDir);
  });

  afterAll(() => {
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true });
    }
  });

  describe('findRenewCerts', () => {
    beforeAll(async () => {
      // Clean up any existing certs
      const existing = await states.certificate.find({});
      for (const cert of existing) {
        // eslint-disable-next-line no-await-in-loop
        await states.certificate.remove({ id: cert.id });
      }
    });

    test('should find certs that need renewal based on ratio (90-day cert, 1/3 ratio)', async () => {
      const now = Date.now();
      const validFrom = now - 60 * 24 * 60 * 60 * 1000; // 60 days ago
      const validTo = now + 30 * 24 * 60 * 60 * 1000; // 30 days from now (90 days total)

      // Insert without certificate field to avoid validation
      await states.certificate.insert({
        domain: 'ratio-test-90.example.com',
        source: CERT_SOURCE.letsEncrypt,
        meta: { validFrom, validTo },
      });

      const certs = await states.certificate.findRenewCerts(1 / 3, 10);
      const cert = certs.find((c) => c.domain === 'ratio-test-90.example.com');

      expect(cert).toBeDefined();
      // 90-day cert with 30 days remaining should trigger renewal (30 <= 90 * 1/3 = 30)
    });

    test('should not find certs that do not need renewal (90-day cert, 1/3 ratio)', async () => {
      const now = Date.now();
      const validFrom = now - 50 * 24 * 60 * 60 * 1000; // 50 days ago
      const validTo = now + 40 * 24 * 60 * 60 * 1000; // 40 days from now (90 days total)

      await states.certificate.insert({
        domain: 'no-renewal-90.example.com',
        source: CERT_SOURCE.letsEncrypt,
        meta: { validFrom, validTo },
      });

      const certs = await states.certificate.findRenewCerts(1 / 3, 10);
      const cert = certs.find((c) => c.domain === 'no-renewal-90.example.com');

      expect(cert).toBeUndefined();
      // 90-day cert with 40 days remaining should not trigger renewal (40 > 90 * 1/3 = 30)
    });

    test('should find short-term certs based on minimum days threshold', async () => {
      const now = Date.now();
      const validFrom = now - 20 * 24 * 60 * 60 * 1000; // 20 days ago
      const validTo = now + 9 * 24 * 60 * 60 * 1000; // 9 days from now (29 days total)

      await states.certificate.insert({
        domain: 'short-term.example.com',
        source: CERT_SOURCE.letsEncrypt,
        meta: { validFrom, validTo },
      });

      const certs = await states.certificate.findRenewCerts(1 / 3, 10);
      const cert = certs.find((c) => c.domain === 'short-term.example.com');

      expect(cert).toBeDefined();
      // 29-day cert with 9 days remaining should trigger renewal (9 <= max(29 * 1/3, 10) = 10)
    });

    test('should find certs exactly at minimum threshold', async () => {
      const now = Date.now();
      const validFrom = now - 20 * 24 * 60 * 60 * 1000; // 20 days ago
      const validTo = now + 10 * 24 * 60 * 60 * 1000; // exactly 10 days from now

      await states.certificate.insert({
        domain: 'exact-threshold.example.com',
        source: CERT_SOURCE.letsEncrypt,
        meta: { validFrom, validTo },
      });

      const certs = await states.certificate.findRenewCerts(1 / 3, 10);
      const cert = certs.find((c) => c.domain === 'exact-threshold.example.com');

      expect(cert).toBeDefined();
      // Cert with exactly 10 days remaining should trigger renewal (10 <= 10)
    });

    test('should not find certs just above minimum threshold', async () => {
      const now = Date.now();
      const validFrom = now - 19 * 24 * 60 * 60 * 1000; // 19 days ago
      const validTo = now + 11 * 24 * 60 * 60 * 1000; // 11 days from now (30 days total)

      await states.certificate.insert({
        domain: 'above-threshold.example.com',
        source: CERT_SOURCE.letsEncrypt,
        meta: { validFrom, validTo },
      });

      const certs = await states.certificate.findRenewCerts(1 / 3, 10);
      const cert = certs.find((c) => c.domain === 'above-threshold.example.com');

      expect(cert).toBeUndefined();
      // 30-day cert with 11 days remaining should not trigger renewal (11 > max(30 * 1/3, 10) = 10)
    });

    test('should ignore certs without validFrom', async () => {
      const now = Date.now();
      const validTo = now + 20 * 24 * 60 * 60 * 1000;

      await states.certificate.insert({
        domain: 'no-valid-from.example.com',
        source: CERT_SOURCE.letsEncrypt,
        meta: { validTo },
      });

      const certs = await states.certificate.findRenewCerts(1 / 3, 10);
      const cert = certs.find((c) => c.domain === 'no-valid-from.example.com');

      expect(cert).toBeUndefined();
    });

    test('should ignore certs without validTo', async () => {
      const now = Date.now();
      const validFrom = now - 20 * 24 * 60 * 60 * 1000;

      await states.certificate.insert({
        domain: 'no-valid-to.example.com',
        source: CERT_SOURCE.letsEncrypt,
        meta: { validFrom },
      });

      const certs = await states.certificate.findRenewCerts(1 / 3, 10);
      const cert = certs.find((c) => c.domain === 'no-valid-to.example.com');

      expect(cert).toBeUndefined();
    });

    test('should ignore certs without meta', async () => {
      await states.certificate.insert({
        domain: 'no-meta.example.com',
        source: CERT_SOURCE.letsEncrypt,
      });

      const certs = await states.certificate.findRenewCerts(1 / 3, 10);
      const cert = certs.find((c) => c.domain === 'no-meta.example.com');

      expect(cert).toBeUndefined();
    });

    test('should only find letsEncrypt certs, not uploaded certs', async () => {
      const now = Date.now();
      const validFrom = now - 60 * 24 * 60 * 60 * 1000;
      const validTo = now + 5 * 24 * 60 * 60 * 1000; // 5 days from now

      await states.certificate.insert({
        domain: 'uploaded.example.com',
        source: CERT_SOURCE.upload,
        meta: { validFrom, validTo },
      });

      const certs = await states.certificate.findRenewCerts(1 / 3, 10);
      const cert = certs.find((c) => c.domain === 'uploaded.example.com');

      expect(cert).toBeUndefined();
      // Uploaded certs should not be automatically renewed
    });

    test('should use custom minimum renewal days', async () => {
      const now = Date.now();
      const validFrom = now - 50 * 24 * 60 * 60 * 1000;
      const validTo = now + 15 * 24 * 60 * 60 * 1000; // 15 days from now

      await states.certificate.insert({
        domain: 'custom-minimum.example.com',
        source: CERT_SOURCE.letsEncrypt,
        meta: { validFrom, validTo },
      });

      // With custom minimum of 20 days
      const certs = await states.certificate.findRenewCerts(1 / 3, 20);
      const cert = certs.find((c) => c.domain === 'custom-minimum.example.com');

      expect(cert).toBeDefined();
      // 15 days remaining <= max(65 * 1/3, 20) = max(21.67, 20) = 21.67, should trigger renewal
    });

    test('should handle very long lifetime certs (365 days)', async () => {
      const now = Date.now();
      const validFrom = now - 245 * 24 * 60 * 60 * 1000; // 245 days ago
      const validTo = now + 120 * 24 * 60 * 60 * 1000; // 120 days from now (365 days total)

      await states.certificate.insert({
        domain: 'long-lifetime.example.com',
        source: CERT_SOURCE.letsEncrypt,
        meta: { validFrom, validTo },
      });

      const certs = await states.certificate.findRenewCerts(1 / 3, 10);
      const cert = certs.find((c) => c.domain === 'long-lifetime.example.com');

      expect(cert).toBeDefined();
      // 365-day cert with 120 days remaining should trigger renewal (120 <= 365 * 1/3 = 121.67)
    });
  });
});
