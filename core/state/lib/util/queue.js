const createQueue = require('@abtnode/queue');
const QueueStore = require('@abtnode/queue/lib/store/sequelize');

/**
 * @param {object} params
 * @param {string} params.name name of the queue
 * @param {object} params.model model
 * @param {function} params.onJob called on receives job
 * @param {boolean} params.daemon [param=false] is the running in a daemon environment, default false
 * @param {object} params.options options
 * @param {any} [params.options.id] id of the job
 * @param {number} [params.options.concurrency] [param=1] number of concurrent jobs
 * @param {number} [params.options.maxRetries] [param=1] number of max retries, default 1
 * @param {number} [params.options.maxTimeout] [param=86400000] max timeout, in ms, default 86400000ms(1d)
 * @param {number} [params.options.retryDelay] [param=0] retry delay, in ms, default 0ms
 * @param {boolean} [params.options.enableScheduledJob]
 * @typedef {
 *  EventEmitter & {
 *    store: JobStore;
 *    push: (...args: {
 *      job: any;
 *      jobId: string;
 *      persist: boolean;
 *      delay: number;
 *    }) => EventEmitter;
 *    get: (id: string) => Promise<any>;
 *    cancel: (id: string) => Promise<...>;
 *    options: {}
 *  }
 * } Queue
 */
module.exports = ({ name, model, onJob, daemon = false, options = {} }) => {
  if (daemon) {
    const queue = createQueue({
      store: new QueueStore(model, name),
      onJob,
      options,
    });

    return queue;
  }

  return { push: () => ({ on: () => {} }) };
};
