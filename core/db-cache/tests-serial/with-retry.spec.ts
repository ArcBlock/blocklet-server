import { test, expect, describe, mock } from 'bun:test';
import { withRetry } from '../src/with-retry';

describe('withRetry (without fake timers)', () => {
  const smallOpts = {
    max: 5,
    backoffBase: 20, // 1ms 初始退避
    backoffExponent: 1, // 不指数增长
    backoffJitter: 0, // 无随机抖动
  };

  test('resolves immediately when no error', async () => {
    const fn = mock().mockResolvedValue('ok');
    const result = await withRetry(fn, smallOpts);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('retries on retryable error until success', async () => {
    const retryErr = new Error('retryable');
    const fn = mock().mockRejectedValueOnce(retryErr).mockRejectedValueOnce(retryErr).mockResolvedValue('finally');
    const needRetry = (err: Error) => err.message === 'retryable';

    const start = Date.now();
    const result = await withRetry(fn, { ...smallOpts, needRetry });
    const duration = Date.now() - start;

    expect(result).toBe('finally');
    expect(fn).toHaveBeenCalledTimes(3);
    // 两次重试，每次 1ms，合计至少 ~2ms
    expect(duration).toBeGreaterThanOrEqual(35);
  });

  test('throws immediately on non‑retryable error', async () => {
    const fatalErr = new Error('fatal');
    const fn = mock().mockRejectedValue(fatalErr);

    await expect(withRetry(fn, { ...smallOpts, needRetry: () => false })).rejects.toThrow('fatal');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('throws after exceeding max retries', async () => {
    const retryErr = new Error('retry');
    const fn = mock().mockRejectedValue(retryErr);

    const start = Date.now();
    await expect(
      withRetry(fn, { max: 3, backoffBase: 10, backoffExponent: 1, backoffJitter: 0, needRetry: () => true })
    ).rejects.toThrow('retry');
    const duration = Date.now() - start;

    // 初始调用 + 3 次重试 = 4 次调用
    expect(fn).toHaveBeenCalledTimes(4);
    // 3 次重试，每次 1ms，合计至少 ~3ms
    expect(duration).toBeGreaterThanOrEqual(30);
  });
});
