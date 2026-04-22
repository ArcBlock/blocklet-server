import { describe, test, expect, beforeEach, beforeAll } from 'bun:test';
import { types } from '@ocap/mcrypto';
import { fromRandom, WalletObject } from '@ocap/wallet';
import { signResponse, verifyResponse, verifyVault } from '../src/security';

describe('Security', () => {
  let wallet: WalletObject;

  beforeEach(() => {
    // Create a new random wallet for each test
    wallet = fromRandom();
  });

  describe('signResponse', () => {
    test('should sign an object and add $signature', async () => {
      const testObj = { foo: 'bar', num: 123 };
      const signedObj = await signResponse(testObj, wallet);

      expect(signedObj).toHaveProperty('$signature');
      expect(signedObj.foo).toBe('bar');
      expect(signedObj.num).toBe(123);
      expect(typeof signedObj.$signature).toBe('string');
    });

    test('should handle empty objects', async () => {
      const testObj = {};
      const signedObj = await signResponse(testObj, wallet);

      expect(signedObj).toHaveProperty('$signature');
      expect(typeof signedObj.$signature).toBe('string');
      expect(Object.keys(signedObj).length).toBe(1); // Only $signature
    });

    test('should handle nested objects', async () => {
      const testObj = {
        nested: { foo: 'bar' },
        array: [1, 2, 3],
      };
      const signedObj = await signResponse(testObj, wallet);

      expect(signedObj).toHaveProperty('$signature');
      expect(signedObj.nested.foo).toBe('bar');
      expect(signedObj.array).toEqual([1, 2, 3]);
      expect(typeof signedObj.$signature).toBe('string');
    });
  });

  describe('verifyResponse', () => {
    test('should return false if no signature exists', async () => {
      const testObj = { foo: 'bar' };
      const result = await verifyResponse(testObj, wallet);

      expect(result).toBe(false);
    });

    test('should verify a correctly signed object', async () => {
      const testObj = { foo: 'bar' };
      const signedObj = await signResponse(testObj, wallet);
      const result = await verifyResponse(signedObj, wallet);

      expect(result).toBe(true);
    });

    test('should fail verification for tampered objects', async () => {
      const testObj = { foo: 'bar' };
      const signedObj = await signResponse(testObj, wallet);
      signedObj.foo = 'tampered';
      const result = await verifyResponse(signedObj, wallet);

      expect(result).toBe(false);
    });

    test('should fail verification with different wallet', async () => {
      const testObj = { foo: 'bar' };
      const signedObj = await signResponse(testObj, wallet);
      const differentWallet = fromRandom();
      const result = await verifyResponse(signedObj, differentWallet);

      expect(result).toBe(false);
    });
  });

  describe('verifyVault', () => {
    let app: WalletObject;
    let wallet1: WalletObject;
    let wallet2: WalletObject;
    let wallet3: WalletObject;
    let prevSig1: string;
    let prevSig2: string;
    let prevSig3: string;
    let vault1: any;
    let vault2: any;
    let vault3: any;

    beforeAll(async () => {
      app = fromRandom({ role: types.RoleType.ROLE_APPLICATION });
      wallet1 = fromRandom();
      wallet2 = fromRandom();
      wallet3 = fromRandom();

      prevSig1 = await app.sign(
        Buffer.concat([Buffer.from(`vault:${app.address}`), Buffer.from(`:${wallet1.address}`)])
      );
      vault1 = {
        at: 100,
        did: wallet1.address,
        pk: wallet1.publicKey,
        sig: await wallet1.sign(
          Buffer.concat([
            Buffer.from(`vault:${app.address}`),
            Buffer.from(`:${wallet1.address}`),
            Buffer.from(`:${prevSig1}`),
          ])
        ),
        approverSig: prevSig1,
        approverDid: app.address,
        approverPk: app.publicKey,
      };

      prevSig2 = await wallet1.sign(
        Buffer.concat([
          Buffer.from(`vault:${app.address}`),
          Buffer.from(`:${wallet1.address}`),
          Buffer.from(`:${wallet2.address}`),
        ])
      );
      vault2 = {
        at: 200,
        did: wallet2.address,
        pk: wallet2.publicKey,
        approverSig: prevSig2,
        sig: await wallet2.sign(
          Buffer.concat([
            Buffer.from(`vault:${app.address}`),
            Buffer.from(`:${wallet1.address}`),
            Buffer.from(`:${wallet2.address}`),
            Buffer.from(`:${prevSig2}`),
          ])
        ),
      };

      prevSig3 = await wallet2.sign(
        Buffer.concat([
          Buffer.from(`vault:${app.address}`),
          Buffer.from(`:${wallet1.address}`),
          Buffer.from(`:${wallet2.address}`),
          Buffer.from(`:${wallet3.address}`),
        ])
      );
      vault3 = {
        at: 300,
        did: wallet3.address,
        pk: wallet3.publicKey,
        approverSig: prevSig3,
        sig: await wallet3.sign(
          Buffer.concat([
            Buffer.from(`vault:${app.address}`),
            Buffer.from(`:${wallet1.address}`),
            Buffer.from(`:${wallet2.address}`),
            Buffer.from(`:${wallet3.address}`),
            Buffer.from(`:${prevSig3}`),
          ])
        ),
      };
    });

    test('should return empty string for empty vaults array', async () => {
      expect(await verifyVault([], app.address)).toBe('');
    });

    test('should throw error for empty vaults array when throwOnError is true', () => {
      expect(verifyVault([], app.address, true)).rejects.toThrow('vaults list is empty');
    });

    test('should return empty string for non-array input', async () => {
      expect(await verifyVault(null as any, app.address)).toBe('');
      expect(await verifyVault(undefined as any, app.address)).toBe('');
    });

    test('should throw error for duplicate vaults', async () => {
      expect(await verifyVault([vault1, { ...vault1, at: vault1.at + 1 }], app.address)).toBe('');
      expect(verifyVault([vault1, { ...vault1, at: vault1.at + 1 }], app.address, true)).rejects.toThrow(
        /vaults list has duplicate vaults/
      );
    });

    test('should return empty string when vaults are not in ascending order', async () => {
      const vaults = [
        { at: 200, did: 'did:1', pk: 'pk1', sig: 'sig1' },
        { at: 100, did: 'did:2', pk: 'pk2', sig: 'sig2' },
      ];
      expect(await verifyVault(vaults, app.address)).toBe('');
    });

    test('should throw error when vaults are not in ascending order and throwOnError is true', () => {
      const vaults = [
        { at: 200, did: 'did:1', pk: 'pk1', sig: 'sig1' },
        { at: 100, did: 'did:2', pk: 'pk2', sig: 'sig2' },
      ];
      expect(verifyVault(vaults, app.address, true)).rejects.toThrow('vaults are not in ascending order');
    });

    test('should verify vault signatures and return last did on success', async () => {
      expect(await verifyVault([vault1], app.address)).toBe(wallet1.address);
      expect(await verifyVault([vault1, vault2], app.address)).toBe(wallet2.address);
      expect(await verifyVault([vault1, vault2, vault3], app.address)).toBe(wallet3.address);
    });

    test('should throw when approve signature is missing', async () => {
      expect(await verifyVault([{ ...vault1, approverSig: '' }], app.address)).toBe('');
      expect(verifyVault([{ ...vault1, approverSig: '' }], app.address, true)).rejects.toThrow(
        /vault approve signature missing/
      );
    });

    test('should throw when commit signature is missing', async () => {
      expect(await verifyVault([{ ...vault1, sig: '' }], app.address)).toBe('');
      expect(verifyVault([{ ...vault1, sig: '' }], app.address, true)).rejects.toThrow(/commit signature missing/);
    });

    test('should throw when vault did and pk mismatch', async () => {
      expect(await verifyVault([{ ...vault1, did: 'invalid_did' }], app.address)).toBe('');
      expect(verifyVault([{ ...vault1, did: 'invalid_did' }], app.address, true)).rejects.toThrow(
        /vault did and pk mismatch/
      );
    });

    test('should throw when approver did or pk missing', async () => {
      expect(await verifyVault([{ ...vault1, approverDid: '' }], app.address)).toBe('');
      expect(verifyVault([{ ...vault1, approverDid: '' }], app.address, true)).rejects.toThrow(
        /approver config missing/
      );
    });

    test('should throw when approver signature invalid', async () => {
      expect(await verifyVault([{ ...vault1, approverSig: vault2.approverSig }], app.address)).toBe('');
      await expect(verifyVault([{ ...vault1, approverSig: vault2.approverSig }], app.address, true)).rejects.toThrow(
        /signature verify failed/
      );
    });

    test('should return empty string when signature verification fails', async () => {
      expect(await verifyVault([{ ...vault1, sig: 'invalid_signature' }], app.address)).toBe('');
      await expect(verifyVault([{ ...vault1, sig: 'invalid_signature' }], app.address, true)).rejects.toThrow(
        /vault commit verify failed/
      );

      expect(await verifyVault([{ ...vault1, sig: vault2.sig }], app.address)).toBe('');
      expect(verifyVault([{ ...vault1, sig: vault2.sig }], app.address, true)).rejects.toThrow(
        /signature verify failed/
      );

      expect(await verifyVault([vault1, { ...vault2, sig: 'invalid_signature' }], app.address)).toBe('');
      expect(verifyVault([vault1, { ...vault2, sig: 'invalid_signature' }], app.address, true)).rejects.toThrow(
        /vault commit verify failed/
      );
    });
  });
});
