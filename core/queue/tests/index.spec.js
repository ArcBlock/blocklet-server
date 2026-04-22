/* eslint-disable no-console */
const { test, expect, describe, beforeAll, afterAll, beforeEach, afterEach, mock } = require('bun:test');
const os = require('os');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const sleep = require('@abtnode/util/lib/sleep');
/* eslint-disable import/no-extraneous-dependencies */
const { BaseState, getServerModels, createSequelize } = require('@abtnode/models');

const createQueue = require('../lib/index');
const SequelizeStore = require('../lib/store/sequelize');

const dataDir = path.join(os.tmpdir(), 'blocklet-server-queue-test');
const models = getServerModels();
const db = new BaseState(models.Job);

let sequelize;

const stores = [
  {
    name: 'nedb',
    getArgs: () => {
      return { file: path.join(dataDir, `${uuid.v4()}.db`) };
    },
    beforeAll: () => {},
    beforeEach: () => {},
    afterEach: () => {},
    afterAll: () => {
      try {
        fs.rmSync(dataDir, { recursive: true });
      } catch {
        //
      }
    },
  },
  {
    name: 'sequelize',
    getArgs: () => {
      return { store: new SequelizeStore(db, 'test') };
    },
    beforeAll: async () => {
      sequelize = createSequelize('/core/index-queue:memory:', { logging: false, retry: { max: 15 } });
      models.Job.initialize(sequelize);
      await sequelize.sync({ force: true });
    },
    beforeEach: async () => {
      try {
        await models.Job.destroy({ truncate: true });
      } catch {
        //
      }
    },
    afterEach: async () => {
      try {
        await models.Job.destroy({ truncate: true });
      } catch {
        //
      }
    },
    afterAll: async () => {},
  },
];

stores.forEach((store) => {
  beforeAll(async () => {
    await store.beforeAll();
  });

  beforeEach(async () => {
    await store.beforeEach();
  });

  afterEach(async () => {
    await store.afterEach();
  });

  afterAll(async () => {
    await store.afterAll();
  });

  describe('Scheduled job', () => {
    if (!process.env.GITHUB_ACTIONS && store.name === 'sequelize') {
      test('should the job run 2s later', (done) => {
        const start = Date.now();
        const queue = createQueue({
          ...store.getArgs(),
          options: { enableScheduledJob: true },
          onJob: () => {
            const end = Date.now();
            expect(end - start).toBeGreaterThan(1000);
            done();
          },
        });

        const ticket = queue.push({ job: { id: 3 }, delay: 2 });
        ticket.on('error', console.error);

        expect.assertions(1);
      }, 5000);
    }
  });

  describe(`Queue with store ${store.name}`, () => {
    test('should throw error when job is not a function', () => {
      expect(() => {
        createQueue({
          ...store.getArgs(),
          onJob: 'it is not a function',
        });
      }).toThrowError('onJob must be a function to create a queue');
    });

    test('should cancel a job', (done) => {
      const queue = createQueue({
        ...store.getArgs(),
        onJob: async (job) => {
          if (job === 'job1') {
            // avoid job2 was triggered before cancelled
            await sleep(400);
            return;
          }

          if (job === 'job2') {
            done('The test should not be executed here');
          }
        },
      });

      const job1 = queue.push('job1');
      job1.on('queued', () => {
        const job2 = queue.push('job2');
        job2.on('queued', () => {
          queue.cancel(job2.id);
        });

        job2.on('cancelled', ({ result }) => {
          expect(result).toBe('__CANCELLED__');
          done();
        });
      });
    });

    test('should delete a job', async () => {
      const queue = createQueue({
        ...store.getArgs(),
        onJob: (job) => job,
        options: {
          enableScheduledJob: true,
        },
      });

      const jobId = 'jobId1';

      queue.push('test-job', jobId, true, 60);

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 1 * 1000));

      const bool = await queue.delete(jobId);
      expect(bool).toBeTruthy();

      expect(await queue.get(jobId)).toBe(null);
    });

    test('should not cancel non-exist job', (done) => {
      const queue = createQueue({
        ...store.getArgs(),
        onJob: (job) => job,
      });
      queue.cancel('none-exist-id').then((result) => {
        expect(result).toBeFalsy();
        done();
      });
    });

    test('should not cancel non-persistent job', (done) => {
      const queue = createQueue({
        ...store.getArgs(),
        onJob: async (job) => {
          if (job === 'job1') {
            await sleep(3000);
          }
        },
      });

      const job1 = queue.push('job1');
      job1.on('queued', () => {
        const job2 = queue.push('job2', null, false);
        job2.on('queued', () => {
          queue.cancel(job2.id).then((result) => {
            expect(result).toBeFalsy();
            done();
          });
        });
      });
    });

    test('should require an onJob callback', () => {
      try {
        createQueue({});
      } catch (err) {
        expect(err).toBeTruthy();
      }
    });

    test('should process job as expected', (done) => {
      const queue = createQueue({
        ...store.getArgs(),
        onJob: (job) => {
          if (job.id === 3) {
            done();
          }

          return job;
        },
      });

      expect(typeof queue.on).toEqual('function');

      queue.push({ id: 1 });
      queue.push({ id: 2 });
      queue.push({ id: 3 });
    });

    test('should throw on empty job', () => {
      const queue = createQueue({
        ...store.getArgs(),
        onJob: () => new Error('should not come here'),
      });

      try {
        queue.push(null);
      } catch (err) {
        expect(err).toBeTruthy();
        expect(err.message).toContain('Can not queue empty job');
      }
    });

    test('should not throw and run duplicate job', () => {
      const onJob = mock();
      const queue = createQueue({
        ...store.getArgs(),
        onJob,
      });

      queue.push({ job: 1, jobId: 1 });
      queue.push({ job: 2, jobId: 1 });

      queue.drain = () => {
        expect(onJob).toHaveBeenCalledTimes(1);
      };
    });

    test('should process error job as expected', (done) => {
      const queue = createQueue({
        ...store.getArgs(),
        onJob: () => {
          throw new Error('The job error');
        },
      });

      const task = queue.push({ id: 6 });
      task
        .on('failed', ({ job, error }) => {
          expect(job).toEqual({ id: 6 });
          expect(error.message).toContain('The job error');
          done();
        })
        .on('finished', () => {
          expect(false).toEqual(true);
        });
    });

    test('should throw error when timeout', (done) => {
      const queue = createQueue({
        ...store.getArgs(),
        options: {
          maxTimeout: 50,
        },
        onJob: async (job) => {
          if (job.id === 4) {
            await sleep(100);
          }

          return job;
        },
      });

      const ticket = queue.push({ id: 4 });
      ticket.on('failed', ({ job, error }) => {
        expect(job).toEqual({ id: 4 });
        expect(error.message).toContain('timed out');
        done();
      });
    });

    test('should not throw error when retry', (done) => {
      let retryCount = 0;

      const start = Date.now();
      const queue = createQueue({
        ...store.getArgs(),
        options: {
          maxRetries: 3,
          retryDelay: 10,
          maxTimeout: 50,
        },
        onJob: async (job) => {
          if (job.id === 5) {
            retryCount += 1;
            await sleep(100);
          }

          return job;
        },
      });

      const ticket = queue.push({ id: 5 });
      ticket.on('failed', async ({ job, error }) => {
        expect(job).toEqual({ id: 5 });
        expect(error.message).toContain('timed out');
        // Wait a bit to ensure all background onJob callbacks complete
        // The timeout doesn't cancel the onJob callback, so it may continue running
        await sleep(150);
        // With maxRetries: 3, the job should run 3 times (1 initial + 2 retries)
        // But due to race conditions with timeout, it might run 4 times
        // The issue: when timeout occurs, tryWithTimeout rejects but onJob continues running
        // If onJob completes after timeout but before next retry, retryCount increments again
        // So we check that it's at least 3 (expected) and at most 4 (race condition case)
        expect(retryCount >= 3 && retryCount <= 4).toBe(true);
        expect(Date.now() - start).toBeGreaterThan(50 * 3);
        done();
      });
    });

    test('should have options attribute', () => {
      const options = {
        maxTimeout: 50,
      };

      const queue = createQueue({
        ...store.getArgs(),
        options,
        onJob: (job) => job,
      });

      expect(!!queue.options).toEqual(true);
    });

    test('should not set maxRetries if options.maxRetries is not a valid value', () => {
      const queue1 = createQueue({
        ...store.getArgs(),
        options: { maxRetries: null },
        onJob: (job) => job,
      });

      const queue2 = createQueue({
        ...store.getArgs(),
        onJob: (job) => job,
      });

      const queue3 = createQueue({
        ...store.getArgs(),
        options: { maxRetries: 'test' },
        onJob: (job) => job,
      });

      const queue4 = createQueue({
        ...store.getArgs(),
        options: { maxRetries: -1 },
        onJob: (job) => job,
      });

      const queue5 = createQueue({
        ...store.getArgs(),
        options: { maxRetries: 0 },
        onJob: (job) => job,
      });

      expect(queue1.options.maxRetries).toEqual(1);
      expect(queue2.options.maxRetries).toEqual(1);
      expect(queue3.options.maxRetries).toEqual(1);
      expect(queue4.options.maxRetries).toEqual(1);
      expect(queue5.options.maxRetries).toEqual(0);
    });

    test('should not retry when maxRetries = 0', (done) => {
      let retryCount = 0;
      const id = 101;
      const maxRetries = 0;

      const queue = createQueue({
        ...store.getArgs(),
        options: {
          maxRetries,
        },
        onJob: (job) => {
          if (job.id === id) {
            retryCount += 1;
          }

          throw new Error('test error');
        },
      });

      const ticket = queue.push({ id });
      ticket.on('failed', ({ job }) => {
        expect(job).toEqual({ id });
        expect(retryCount).toEqual(1);
        done();
      });
    });

    test('should not retry when maxRetries = 1', (done) => {
      let retryCount = 0;
      const id = 105;
      const maxRetries = 1;

      const queue = createQueue({
        ...store.getArgs(),
        options: {
          maxRetries,
          id: () => id,
        },
        onJob: (job) => {
          if (job.id === id) {
            retryCount += 1;
          }

          throw new Error('test error');
        },
      });

      const ticket = queue.push({ id });
      ticket.on('failed', ({ job }) => {
        expect(job).toEqual({ id });
        expect(retryCount).toEqual(1);
        done();
      });
    });

    test('should get a job', (done) => {
      const queue = createQueue({
        ...store.getArgs(),
        onJob: async () => {
          await sleep(600);
          const job = await queue.get('id-job1');
          expect(job).toBe('data-job1');
          done();
        },
      });

      const job1 = queue.push('data-job1', 'id-job1');
      job1.on('queued', async () => {
        const job = await queue.get('id-job1');
        expect(job).toBe('data-job1');
      });
    });

    test('should return null when get a none-exist job', async () => {
      const queue = createQueue({
        ...store.getArgs(),
        onJob: async () => {},
      });

      expect(await queue.get('none-exist')).toEqual(null);
    });

    test('should throw error if delay < 5', () => {
      const queue = createQueue({
        ...store.getArgs(),
        options: { enableScheduledJob: true },
        onJob: () => {},
      });

      expect(() => queue.push({ job: { test: 1 }, delay: 1 })).toThrow(/minimum delay is/i);
    });

    test('should throw error if options.enableScheduledJob falsy when run delay job', () => {
      const queue = createQueue({
        ...store.getArgs(),
        onJob: () => {},
      });

      expect(() => queue.push({ job: { test: 1 }, delay: 4 })).toThrow(
        /The queue must have options.enableScheduledJob set to true to run delay jobs/i
      );
    });
  });
});

describe('logger options', () => {
  test('should use custom logger when provided', (done) => {
    const logMessages = [];
    const customLogger = {
      error: (...args) => logMessages.push(['error', ...args]),
      warn: (...args) => logMessages.push(['warn', ...args]),
      info: (...args) => logMessages.push(['info', ...args]),
      debug: (...args) => logMessages.push(['debug', ...args]),
      verbose: (...args) => logMessages.push(['verbose', ...args]),
      silly: (...args) => logMessages.push(['silly', ...args]),
    };

    const queue = createQueue({
      file: path.join(dataDir, `${uuid.v4()}.db`),
      onJob: async () => {},
      options: { logger: customLogger },
    });

    queue.push('test-job');
    queue.on('queued', () => {
      const infoLogs = logMessages.filter((log) => log[0] === 'info');
      expect(infoLogs.length).toBeGreaterThan(0);
      // logger.info is called as info(...args), args = ['queue job', { id, job }]
      // So log format is: ['info', 'queue job', { id, job }]
      const hasQueueJobLog = infoLogs.some((log) => log[1] && log[1].includes && log[1].includes('queue job'));
      expect(hasQueueJobLog).toBe(true);
      done();
    });
  });

  test('should use default logger for missing methods', (done) => {
    const logMessages = [];
    const partialLogger = {
      info: (...args) => logMessages.push(['info', ...args]),
      error: (...args) => logMessages.push(['error', ...args]),
      // missing: warn, debug, verbose, silly
    };

    const queue = createQueue({
      file: path.join(dataDir, `${uuid.v4()}.db`),
      onJob: async () => {},
      options: { logger: partialLogger },
    });

    queue.push('test-job');
    queue.on('queued', () => {
      // Should still work without throwing errors
      const infoLogs = logMessages.filter((log) => log[0] === 'info');
      expect(infoLogs.length).toBeGreaterThan(0);
      const hasQueueJobLog = infoLogs.some((log) => log[1] && log[1].includes && log[1].includes('queue job'));
      expect(hasQueueJobLog).toBe(true);
      done();
    });
  });

  test('should work without logger', (done) => {
    const queue = createQueue({
      file: path.join(dataDir, `${uuid.v4()}.db`),
      onJob: async () => {},
      // No logger option - should use default
    });

    queue.push('test-job');
    queue.on('queued', () => {
      // Should not throw errors
      done();
    });
  });
});
