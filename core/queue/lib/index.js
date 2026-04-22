/* eslint-disable no-return-assign */
/* eslint-disable no-underscore-dangle */
const uuid = require('uuid');
const Queue = require('fastq');
const { EventEmitter } = require('events');
const tryWithTimeout = require('@abtnode/util/lib/try-with-timeout');
const sleep = require('@abtnode/util/lib/sleep');

const NedbStore = require('./store/nedb');
const defaultLogger = require('./logger');

const CANCELLED = '__CANCELLED__';
const MIN_DELAY = process.env.NODE_ENV === 'test' ? 2 : 5;

/**
 * @typedef {{
 *  entity: string,
 *  action?: string,
 *  blocklet: import('@blocklet/server-js').BlockletState,
 *  context: {},
 * }} Job
 */

/**
 *
 * @param {Object} config
 * @param {string} [config.file] filepath of JobStore
 * @param {import('@abtnode/queue/lib/store/sequelize')} [config.store] queue store instance
 * @param {function} config.onJob called on receives job
 * @param {Object} [config.options] options
 * @param {string} [config.options.id] id of the job
 * @param {number} [config.options.concurrency] [param=1] number of concurrent jobs
 * @param {number} [config.options.maxRetries] [param=1] number of max retries, default 1
 * @param {number} [config.options.maxTimeout] [param=86400000] max timeout, in ms, default 86400000ms(1d)
 * @param {number} [config.options.retryDelay] [param=0] retry delay, in ms, default 0ms
 * @param {boolean} [config.options.enableScheduledJob] [param=false] enable scheduled job or not, default is false
 */
module.exports = function createQueue({ file, store, onJob, options = {} }) {
  const requiredMethods = ['error', 'warn', 'info', 'debug', 'verbose', 'silly'];
  const logger = requiredMethods.reduce((acc, method) => {
    acc[method] =
      options.logger?.[method] && typeof options.logger[method] === 'function'
        ? (...args) => options.logger[method](...args)
        : defaultLogger[method];
    return acc;
  }, {});

  if (!file && !store) {
    throw new Error('Either nedb file path or store instance must be provided to create a queue');
  }
  if (typeof onJob !== 'function') {
    throw new Error('onJob must be a function to create a queue');
  }

  const defaults = {
    concurrency: 1,
    maxRetries: 1,
    maxTimeout: 24 * 60 * 60 * 1000,
    retryDelay: 0,
  };

  let { maxRetries } = defaults;
  const concurrency = Math.max(options.concurrency || defaults.concurrency, 1);
  const maxTimeout = Math.max(options.maxTimeout || defaults.maxTimeout, 0);
  const retryDelay = Math.max(options.retryDelay || defaults.retryDelay, 0);
  const enableScheduledJob = typeof options.enableScheduledJob === 'boolean' ? options.enableScheduledJob : false;
  const queueEvents = new EventEmitter();

  if (typeof options.maxRetries === 'number' && options.maxRetries >= 0) {
    maxRetries = options.maxRetries;
  }

  if (file) {
    // eslint-disable-next-line no-param-reassign
    store = new NedbStore(file);
  }

  /**
   *
   * @param {string} jobId
   * @param {Job} job
   * @returns
   */
  const getJobId = (jobId, job) =>
    jobId || (typeof options.id === 'function' ? options.id(job) : uuid.v4()) || uuid.v4();

  const queue = Queue(async ({ job, id, persist }, cb) => {
    if (persist) {
      try {
        const cancelled = await store.isCancelled(id);
        if (cancelled) {
          cb(null, CANCELLED);
          return;
        }
      } catch (err) {
        cb(err);
        return;
      }
    }

    try {
      const result = await tryWithTimeout(async () => {
        try {
          await onJob(job);
        } catch (error) {
          // @note: 这里必须要输出错误，当我们在 onJob 里面使用 throw new Error() 的时候，它不是一次 request，错误根本就不会输出到日志，这会让排查变得异常困难
          console.error('onJob.error', error);
          throw error;
        }
      }, maxTimeout);
      cb(null, result);
    } catch (err) {
      cb(err);
    }
  }, concurrency);

  /**
   * Push job to the queue, the old way of calling `push(job, jobId, persist)` will be deprecated
   * @param {object} params
   * @param {Job} params.job The data of the job
   * @param {string} params.jobId Optional, custom jobId
   * @param {boolean} params.persist [persist=true] Persisting the job to the database
   * @param {number} params.delay Optional, default with no delay, unit is second, for example: 10 will run after 10s
   * @returns
   */
  const push = (...args) => {
    let job;
    let jobId;
    let persist;
    let delay;

    if (
      args.length === 1 &&
      args[0] &&
      typeof args[0] === 'object' &&
      (args[0].job || args[0].jobId || args[0].persist)
    ) {
      [{ job, jobId, persist = true, delay }] = args;
    } else {
      [job, jobId, persist = true, delay] = args;
    }

    const events = new EventEmitter();
    const emit = (e, data) => {
      queueEvents.emit(e, data);
      events.emit(e, data);
    };

    if (!job) {
      throw new Error('Can not queue empty job');
    }

    const id = getJobId(jobId, job);

    if (delay) {
      if (!enableScheduledJob) {
        throw new Error('The queue must have options.enableScheduledJob set to true to run delay jobs');
      }

      // 这里不是精确的 delay, 延迟的时间太短没有意义，所以这里限制了最小 delay
      if (delay < MIN_DELAY) {
        throw new Error(`minimum delay is ${MIN_DELAY}s`);
      }

      store
        .addJob(id, job, { delay, willRunAt: Date.now() + delay * 1000 })
        .then(() => {
          emit('queued', { id, job });
        })
        .catch((err) => {
          logger.error('Can not add scheduled job to store', { error: err });
        });

      events.id = id;
      return events;
    }

    // eslint-disable-next-line no-shadow
    const clearJob = (id) => store.deleteJob(id);

    const onJobComplete = async (err, result) => {
      if (result === CANCELLED) {
        await clearJob(id);
        emit('cancelled', { id, job, result });
        return;
      }

      if (!err) {
        await clearJob(id);
        emit('finished', { id, job, result });
        return;
      }

      try {
        const doc = await store.getJob(id);
        if (!doc) {
          emit('failed', { id, job, error: err });
          return;
        }

        if (doc.retryCount >= maxRetries) {
          logger.info('fail job', { id });
          await clearJob(id);
          emit('failed', { id, job, error: err });
          return;
        }

        await store.updateJob(id, { retryCount: doc.retryCount + 1 });
        logger.info('retry job', { id, count: doc.retryCount + 1 });
        setTimeout(() => {
          emit('retry', { id, job, doc });
          queue.unshift({ id, job }, onJobComplete);
        }, retryDelay);
        // eslint-disable-next-line no-shadow
      } catch (err) {
        console.error(err);
        await clearJob(id);
        emit('failed', { id, job, error: err });
      }
    };

    const queueJob = () =>
      setImmediate(() => {
        emit('queued', { id, job, persist });
        logger.info('queue job', { id, job });
        queue.push({ id, job, persist }, onJobComplete);
      });

    if (persist) {
      store
        .addJob(id, job)
        .then(queueJob)
        .catch((err) => {
          logger.error('Can not add job to store', { error: err });
        });
    } else {
      queueJob();
    }

    events.id = id;
    return events;
  };

  const cancel = async (id) => {
    let doc = await store.getJob(id);
    if (doc) {
      doc = await store.updateJob(id, { cancelled: true });
    }
    return doc ? doc.job : null;
  };

  /**
   * Restore the cancelled job
   * @param {string} id
   * @returns
   */
  const restoreCancelled = async (id) => {
    let doc = await store.getJob(id);
    if (doc) {
      doc = await store.updateJob(id, { cancelled: false });
    }
    return doc ? doc.job : null;
  };

  const getJob = async (id, { full } = {}) => {
    const doc = await store.getJob(id);

    if (full) {
      return doc || null;
    }

    return doc ? doc.job : null;
  };

  /**
   *
   * @param {string} id
   */
  const deleteJob = async (id) => {
    const exists = await getJob(id);

    if (exists) {
      await cancel(id);
      await store.deleteJob(id);
      return true;
    }

    return false;
  };

  // Populate the queue on startup
  store.loadDatabase(async (err) => {
    if (err) {
      logger.error('Can not load job database', { error: err });
      throw err;
    }

    try {
      const jobs = await store.getJobs();
      logger.info('queue jobs to populate', { count: jobs.length });
      jobs.forEach((x) => {
        if (x.job && x.id) {
          push(x.job, x.id, false);
        } else {
          logger.info('skip invalid job from db', { job: x });
        }
      });
      // eslint-disable-next-line no-shadow
    } catch (err) {
      console.error(err);
      logger.error('Can not load existing jobs', { error: err });
    }
  });

  const loop = async () => {
    if (enableScheduledJob === true) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          /* eslint-disable no-await-in-loop */
          const jobs = await store.getScheduledJobs();
          for (const x of jobs) {
            if (x.job && x.id) {
              await cancel(x.id);
              push(x.job, x.id, false);
            } else {
              logger.info('skip invalid job from db', { job: x });
            }
          }
        } catch (err) {
          console.error(err);
          logger.error('Can not load scheduled jobs', { error: err });
        }

        await sleep((MIN_DELAY * 1000) / 2);
      }
    }
  };

  loop();

  return Object.assign(queueEvents, {
    store,
    push,
    drain: (cb) => (queue.drain = cb),
    empty: (cb) => (queue.empty = cb),
    saturated: (cb) => (queue.saturated = cb),
    error: (cb) => (queue.error = cb),
    get: getJob,
    cancel,
    restoreCancelled,
    delete: deleteJob,
    options: {
      concurrency,
      maxRetries,
      maxTimeout,
      retryDelay,
      enableScheduledJob,
    },
  });
};
