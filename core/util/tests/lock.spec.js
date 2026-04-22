const { describe, expect, test } = require('bun:test');
const sleep = require('../lib/sleep');
const Lock = require('../lib/lock');

describe('Lock', () => {
  const lock = new Lock('test-lock');
  test('should have basic acquire and release logic', async () => {
    await lock.acquire();
    expect(lock.locked).toBeTruthy();

    await lock.release();
    expect(lock.locked).toBeFalsy();
  });

  test('should block 1 operation when locked', async () => {
    const start = performance.now();
    await lock.acquire();
    await sleep(500);
    await lock.release();
    expect(performance.now() - start).toBeGreaterThanOrEqual(400);
  });

  test('should block multiple operations when locked', async () => {
    const start = performance.now();

    const doTask = async () => {
      await lock.acquire();
      await sleep(200);
      await lock.release();
    };

    const tasks = [1, 2, 3, 4, 5].map((x) => doTask(x));
    await Promise.all(tasks);

    expect(performance.now() - start).toBeGreaterThanOrEqual(900);
  });

  test('should getLock cache', () => {
    const origin = Lock.getLock('test');
    const cached = Lock.getLock('test');
    expect(origin).toBe(cached);
  });
});
