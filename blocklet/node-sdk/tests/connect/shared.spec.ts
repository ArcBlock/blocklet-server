// @eslint-disable-next
import { describe, test, expect } from 'bun:test';
import { setEnvironment, clearEnvironment } from '../../tools/environment';
import { getDelegation, getDelegator, getDelegatee } from '../../src/connect/shared';

process.env.BLOCKLET_LOG_DIR = '/tmp/abtnode/test-log';

describe('Connect.shared', () => {
  test('should getDelegator work', () => {
    setEnvironment(undefined, false);
    expect(getDelegator()).toBe(null);
    clearEnvironment();

    setEnvironment(undefined, true);
    expect(getDelegator()).toBeTruthy();
    expect(getDelegator()?.address).not.toEqual(getDelegatee().address);
    clearEnvironment();
  });

  test('should getDelegatee work', () => {
    setEnvironment(undefined, false);
    expect(getDelegatee()).toBeTruthy();
    clearEnvironment();

    setEnvironment(undefined, true);
    expect(getDelegatee()).toBeTruthy();
    clearEnvironment();
  });

  test('getDelegation work', () => {
    setEnvironment(undefined, true);
    expect(async () => {
      await getDelegation(getDelegator(), getDelegatee());
    }).toThrow(/signing API/);
    clearEnvironment();
  });
});
