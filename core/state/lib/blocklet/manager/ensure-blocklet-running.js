/* eslint-disable no-await-in-loop */
const logger = require('@abtnode/logger')('@abtnode/core:blocklet-status-checker');
const pAll = require('p-all');
const { BlockletStatus } = require('@blocklet/constant');
const sleep = require('@abtnode/util/lib/sleep');
const { getDisplayName } = require('@blocklet/meta/lib/util');
const states = require('../../states');
const { isBlockletPortHealthy, shouldCheckHealthy } = require('../../util/blocklet');

const inProgressStatuses = [
  BlockletStatus.stopping,
  BlockletStatus.restarting,
  BlockletStatus.waiting,
  BlockletStatus.starting,
  BlockletStatus.downloading,
];

// Restart queue concurrency, 这个改大，容易 blocklet 超时导致启动失败
const RESTART_CONCURRENCY = 2;

class EnsureBlockletRunning {
  canRunEnsureBlockletRunning = false;

  initialized = false;

  whenCycleCheck = false;

  cycleCheckCount = 0;

  // 每次任务的最小间隔时间
  checkInterval = +process.env.ABT_NODE_ENSURE_RUNNING_CHECK_INTERVAL || 120 * 1000;

  minCheckInterval = 30_000;

  preCheckInterval = 1000;

  everyBlockletCheckInterval = 2000;

  highLoadCpu = +process.env.ABT_NODE_ENSURE_RUNNING_HIGH_LOAD_CPU || 0.85;

  highLoadMemory = +process.env.ABT_NODE_ENSURE_RUNNING_HIGH_LOAD_MEMORY || 0.85;

  highLoadDisk = +process.env.ABT_NODE_ENSURE_RUNNING_HIGH_LOAD_DISK || 0.95;

  // 各个状态的超时阈值（毫秒）
  // 如果是首次调用（whenCycleCheck 为 false），这些值应该是 0
  stoppingTimeout = +process.env.ABT_NODE_ENSURE_RUNNING_STOPPING_TIMEOUT || 60 * 1000;

  restartingTimeout = +process.env.ABT_NODE_ENSURE_RUNNING_RESTARTING_TIMEOUT || 6 * 60 * 1000;

  waitingTimeout = +process.env.ABT_NODE_ENSURE_RUNNING_WAITING_TIMEOUT || 60 * 1000;

  downloadingTimeout = +process.env.ABT_NODE_ENSURE_RUNNING_DOWNLOADING_TIMEOUT || 10 * 60 * 1000;

  startingTimeout = +process.env.ABT_NODE_ENSURE_RUNNING_STARTING_TIMEOUT || 6 * 60 * 1000;

  runningBlocklets = {};

  rootBlockletsInfo = {};

  progressBlockletsTime = {};

  stopped = false;

  // Queue for restarting fake running blocklets
  restartQueue = [];

  // Set to track queue keys for fast lookup
  restartQueueKeys = new Set();

  restartQueueProcessing = false;

  // Track pending jobs by componentDid to prevent duplicate processing
  pendingJobs = {};

  // Ease to mock
  isBlockletPortHealthy = isBlockletPortHealthy;

  isBlockletPortHealthyWithRetries = async (blocklet) => {
    let error;
    if (!this.whenCycleCheck) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.isBlockletPortHealthy(blocklet, {
          minConsecutiveTime: 200,
          timeout: 1000,
        });
        return true;
      } catch (e) {
        logger.error('blocklet port is not healthy', e);
      }
      return false;
    }

    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.isBlockletPortHealthy(blocklet, {
          minConsecutiveTime: 3000,
          timeout: 6000,
        });
        return true;
      } catch (e) {
        error = e;
        // eslint-disable-next-line no-await-in-loop
        await sleep(this.everyBlockletCheckInterval);
      }
    }
    logger.error('blocklet port is not healthy', error);
    return false;
  };

  constructor() {
    this.states = states;
  }

  initialize = ({ start, stop, notification, checkSystemHighLoad, createAuditLog }) => {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.start = start;
    this.stop = stop;
    this.notification = notification;
    this.createAuditLog = createAuditLog;
    this.checkSystemHighLoad = checkSystemHighLoad;
    logger.info('check and fix blocklet status interval', this.checkInterval);
    const task = async () => {
      await sleep(this.preCheckInterval);

      // 完全停止，后续也不再继续检查
      if (this.stopped) {
        logger.info('blocklet status checker stopped');
        return;
      }
      // 如果还没进入到需要检查的阶段，则等待 1 秒后继续检查
      if (!this.canRunEnsureBlockletRunning) {
        task();
        return;
      }

      // 首次检查前不等待（whenCycleCheck 为 false）
      try {
        await this.checkAndFix();

        // 每次检查完之后查看消耗的时间
        await sleep(Math.max(this.checkInterval, this.minCheckInterval));
        this.cycleCheckCount++;
        if (this.cycleCheckCount >= 3) {
          this.cycleCheckCount = 0;
          this.whenCycleCheck = true;
        }
      } catch (e) {
        logger.error('check and fix blocklet status failed', e);
        // 出错时也要等待，避免频繁重试
        if (this.whenCycleCheck) {
          await sleep(Math.max(this.checkInterval, this.minCheckInterval));
        }
      }
      task();
    };
    task();
  };

  getDisplayNameByRootDid = async (rootDid) => {
    const rootBlocklet = this.rootBlockletsInfo[rootDid] || (await this.states.blocklet.getBlocklet(rootDid));
    if (rootBlocklet) {
      return getDisplayName(rootBlocklet);
    }
    return rootDid;
  };

  getDisplayName = (blocklet) => {
    return blocklet.meta.title || blocklet.meta.name || blocklet.meta.did;
  };

  /**
   * Get timeout threshold for a specific status
   * @param {string} status - Blocklet status
   * @returns {number} Timeout threshold in milliseconds
   */
  getStatusTimeout = (status) => {
    // 如果是首次调用，所有阈值都是 0
    if (!this.whenCycleCheck) {
      return 0;
    }

    let timeout = 0;
    switch (status) {
      case BlockletStatus.stopping:
        timeout = this.stoppingTimeout;
        break;
      case BlockletStatus.restarting:
        timeout = this.restartingTimeout;
        break;
      case BlockletStatus.waiting:
        timeout = this.waitingTimeout;
        break;
      case BlockletStatus.downloading:
        timeout = this.downloadingTimeout;
        break;
      case BlockletStatus.starting:
        timeout = this.startingTimeout;
        break;
      default:
        timeout = this.downloadingTimeout;
        break;
    }
    // 需要减去检查间隔时间，因为每次检查都会在第二次检查之后才比对时间，最少间隔时间不能小于 waitingTimeout
    return Math.max(timeout - this.checkInterval, this.waitingTimeout);
  };

  checkAndFix = async () => {
    logger.info('check and fix blocklet status');
    const systemHighLoad = this.checkSystemHighLoad({
      maxCpus: this.highLoadCpu,
      maxMem: this.highLoadMemory,
      maxDisk: this.highLoadDisk,
    });

    if (this.whenCycleCheck && systemHighLoad.isHighLoad) {
      logger.warn('Skip once ensure blocklet running because system high load', systemHighLoad);
      return 0;
    }

    this.runningBlocklets = {};
    const startTime = Date.now();
    try {
      this.startRestartQueueProcessor();
      await this.getRunningBlocklets();
      await this.getFakeRunningBlocklets();
    } catch (e) {
      logger.error('ensure blocklet status failed', e);
    }
    const elapsedTime = Date.now() - startTime;
    logger.info(
      `ensure blocklet status finished in ${elapsedTime}ms. It's server first start: ${!this.whenCycleCheck}`
    );
    return elapsedTime;
  };

  getRunningBlocklets = async () => {
    const rootBlocklets = await this.states.blocklet.getBlocklets();
    for (const rootBlocklet of rootBlocklets) {
      const rootDid = rootBlocklet.appPid || rootBlocklet.meta.did;
      if (rootBlocklet.children) {
        for (const childBlocklet of rootBlocklet.children) {
          const isRunning =
            childBlocklet.status === BlockletStatus.running || childBlocklet.greenStatus === BlockletStatus.running;
          const isInProgress =
            inProgressStatuses.includes(childBlocklet.status) || inProgressStatuses.includes(childBlocklet.greenStatus);
          const isStopped =
            childBlocklet.status === BlockletStatus.stopped && childBlocklet.greenStatus === BlockletStatus.stopped;

          // 如果处于过 running, 或 stopped，则删除 progressBlockletsTime
          if (isRunning || isStopped) {
            delete this.progressBlockletsTime[`${rootDid}-${childBlocklet.meta.did}`];
          }
          if (isRunning || isInProgress) {
            if (!this.runningBlocklets[rootDid]) {
              this.runningBlocklets[rootDid] = [];
            }
            if (this.runningBlocklets[rootDid].find((child) => child.meta.did === childBlocklet.meta.did)) {
              continue;
            }
            this.runningBlocklets[rootDid].push(childBlocklet);
            this.rootBlockletsInfo[rootDid] = rootBlocklet;
          }
        }
      }
    }
    logger.info('get running blocklets', Object.keys(this.runningBlocklets).length);
  };

  getFakeRunningBlocklets = async () => {
    const rootDids = Object.keys(this.runningBlocklets);
    await pAll(
      rootDids.map((rootDid) => {
        return async () => {
          // runningBlocklets[rootDid] 存储的是该根 blocklet 下的所有子组件（childBlocklets）
          const childBlocklets = this.runningBlocklets[rootDid];
          // eslint-disable-next-line
          const fakeDids = [];
          await pAll(
            childBlocklets.map((childBlocklet) => {
              return async () => {
                if (!shouldCheckHealthy(childBlocklet)) {
                  // 如果 childBlocklet 是不需要启动的，并且不是 running，则设置为 running 状态
                  if (
                    childBlocklet.status !== BlockletStatus.running &&
                    childBlocklet.greenStatus !== BlockletStatus.running
                  ) {
                    await this.states.blocklet.setBlockletStatus(rootDid, BlockletStatus.running, {
                      componentDids: [childBlocklet.meta.did],
                    });
                  }
                  return;
                }

                const isInProgress =
                  inProgressStatuses.includes(childBlocklet.status) ||
                  inProgressStatuses.includes(childBlocklet.greenStatus);

                // 如果处于进行中状态，则记录上次检查时间
                if (isInProgress) {
                  const key = `${rootDid}-${childBlocklet.meta.did}`;
                  if (!this.progressBlockletsTime[key]) {
                    this.progressBlockletsTime[key] = Date.now();
                  }
                  const lastProgressTime = this.progressBlockletsTime[key];
                  // 首次调用或者超过阈值时间，则认为是 fake running
                  if (
                    !this.whenCycleCheck ||
                    Date.now() - lastProgressTime > this.getStatusTimeout(childBlocklet.status)
                  ) {
                    logger.warn('InProgress timeout reached, proceeding with health check', {
                      did: rootDid,
                      componentDid: childBlocklet.meta.did,
                      status: childBlocklet.status,
                    });
                  } else if (this.whenCycleCheck) {
                    // 如果没有 inProgressStart 时间戳，且非首次调用，跳过检查
                    logger.info('Skip ensure running check: no inProgressStart timestamp', {
                      did: rootDid,
                      componentDid: childBlocklet.meta.did,
                      status: childBlocklet.status,
                    });
                    return;
                  }
                }

                if (!isInProgress) {
                  const health = await this.isBlockletPortHealthyWithRetries(childBlocklet);
                  if (health) {
                    return;
                  }
                }

                logger.warn('check blocklet port healthy', rootDid, childBlocklet.meta.did, 'no healthy');

                // Add to restart queue immediately
                fakeDids.push(childBlocklet.meta.did);
              };
            }),
            { concurrency: 10 }
          );
          if (fakeDids.length > 0) {
            this.addToRestartQueue(rootDid, fakeDids);
          }
        };
      }),
      { concurrency: 8 }
    );
  };

  /**
   * Add a childBlocklet to the restart queue
   * @param {string} rootDid - Root blocklet DID
   * @param {Object} childBlocklet - Child blocklet (component) to restart
   */
  addToRestartQueue = (rootDid, dids) => {
    // Check if job is pending (being processed)
    if (this.restartQueueKeys.has(rootDid) || this.pendingJobs[rootDid]) {
      return;
    }

    this.restartQueue.push({
      rootDid,
      entityId: rootDid,
      componentDids: dids,
      firstCycle: !this.whenCycleCheck,
    });
    this.restartQueueKeys.add(rootDid);
  };

  // 启动重启队列，保持 4 个 worker 并发处理，如果有一个完成了，则会补充到队列中
  startRestartQueueProcessor = () => {
    if (this.restartQueueProcessing) {
      return;
    }
    this.restartQueueProcessing = true;

    const runWorker = async () => {
      while (!this.stopped) {
        const item = this.restartQueue.shift();
        if (!item) {
          return;
        }

        this.restartQueueKeys.delete(item.rootDid);

        try {
          await this.restartBlockletFromQueue(item);
        } catch (err) {
          logger.error('restart blocklet failed', err);
        }
      }
    };

    const processQueue = async () => {
      while (!this.stopped) {
        // 防止没有重启队列时，快速空转
        await sleep(this.preCheckInterval);

        if (this.restartQueue.length === 0) {
          continue; // 等下一轮
        }

        // 创建固定数量 worker
        const workers = [];
        for (let i = 0; i < RESTART_CONCURRENCY; i++) {
          workers.push(runWorker());
        }

        try {
          await Promise.all(workers);
        } catch (err) {
          logger.error('restart queue processor batch failed', err);
        }
      }
    };

    processQueue().catch((err) => {
      logger.error('restart queue processor failed', err);
      this.restartQueueProcessing = false;
    });
  };

  /**
   * Create restart notification and audit log context
   * @param {string} rootDid - Root blocklet DID
   * @param {Object} childBlocklet - Child blocklet object
   * @param {string[]} componentDids - Component DIDs
   * @returns {Object} Context object with displayName, title, description
   */
  createRestartContext = async (rootDid, componentDids) => {
    const blockletDisplayName = await this.getDisplayNameByRootDid(rootDid);
    const componentNames = componentDids.map((componentDid) => {
      const child = this.rootBlockletsInfo[rootDid]?.children?.find((bl) => bl.meta.did === componentDid);
      return child ? this.getDisplayName(child) : componentDid;
    });
    const componentNamesStr = componentNames.length === 1 ? componentNames[0] : componentNames.join(', ');

    return {
      blockletDisplayName,
      title: 'Blocklet health check failed',
      description: `Blocklet ${blockletDisplayName} with component${componentNames.length > 1 ? 's' : ''} ${componentNamesStr} health check failed, restarting...`,
    };
  };

  /**
   * Handle restart success
   * @param {string} key - Queue item key
   * @param {string} rootDid - Root blocklet DID
   * @param {string} componentDid - Component DID
   * @param {Object} context - Restart context
   */
  handleRestartSuccess = (rootDid, componentDids, firstCycle, context) => {
    if (firstCycle) {
      return;
    }
    this.createAuditLog({
      action: 'ensureBlockletRunning',
      args: {
        teamDid: rootDid,
        componentDids,
      },
      context: {
        user: {
          did: rootDid,
          role: 'daemon',
          blockletDid: rootDid,
          fullName: context.blockletDisplayName,
          elevated: false,
        },
      },
      result: {
        title: context.title,
        description: context.description,
      },
    });
  };

  /**
   * Handle restart failure
   * @param {string} key - Queue item key
   * @param {string} rootDid - Root blocklet DID
   * @param {string[]} componentDids - Component DIDs
   * @param {Object} context - Restart context
   * @param {Error} error - Error object
   */
  handleRestartFailure = (rootDid, componentDids, context, error) => {
    const title = 'Restart blocklet failed when health check failed';
    const description = `Ensure blocklet running failed, restart blocklet ${context.blockletDisplayName} with component${componentDids.length > 1 ? 's' : ''} ${componentDids.join(', ')} failed`;
    this.notification(rootDid, title, description, 'error');
    logger.error('restart many times blocklet failed', rootDid, componentDids, error);
    try {
      this.createAuditLog({
        action: 'ensureBlockletRunning',
        args: {
          blockletDisplayName: context.blockletDisplayName,
          teamDid: rootDid,
          componentDids,
        },
        context: {
          user: {
            did: rootDid,
            role: 'daemon',
            blockletDid: rootDid,
            fullName: context.blockletDisplayName,
            elevated: false,
          },
        },
        result: {
          title,
          description,
        },
      });
    } catch (err) {
      logger.error('ensure blocklet running, create audit log failed', rootDid, componentDids, err);
    }
  };

  /**
   * Restart a childBlocklet from the queue
   * @param {Object} item - Queue item with rootDid, componentDids, firstCycle
   */
  restartBlockletFromQueue = async ({ rootDid, componentDids, firstCycle }) => {
    // Set pending status to prevent duplicate processing
    if (this.pendingJobs[rootDid]) {
      logger.warn('Skip restart: job is already pending', { rootDid });
      return;
    }
    this.pendingJobs[rootDid] = true;

    try {
      const context = await this.createRestartContext(rootDid, componentDids);
      if (!firstCycle) {
        this.notification(rootDid, context.title, context.description, 'warning');
      }

      logger.info('restart blocklet:', rootDid, componentDids);
      try {
        await this.start({
          did: rootDid,
          componentDids,
          checkHealthImmediately: true,
          atomic: true,
          operator: 'ensure-blocklet-running',
        });
      } catch (e) {
        // 如果启动失败，则尝试启动一次 error 状态的组件
        const blocklet = await this.states.blocklet.getBlocklet(rootDid);
        if (blocklet) {
          const errorComponentDids = blocklet.children
            .filter((child) => child.status === BlockletStatus.error || child.greenStatus === BlockletStatus.error)
            .map((child) => child.meta.did);
          if (errorComponentDids.length) {
            logger.error('restart blocklet failed, retry with once, error:', e);
            await this.start({
              did: rootDid,
              componentDids: errorComponentDids,
              checkHealthImmediately: true,
              atomic: true,
              operator: 'ensure-blocklet-running',
            });
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }
      this.handleRestartSuccess(rootDid, componentDids, firstCycle, context);
    } catch (e) {
      await this.handleRestartFailure(rootDid, componentDids, context, e);
    } finally {
      // Clear pending status after processing
      delete this.pendingJobs[rootDid];
      // Clear progress blocklets time
      for (const componentDid of componentDids) {
        delete this.progressBlockletsTime[`${rootDid}-${componentDid}`];
      }
    }
  };
}

const ensureBlockletRunning = new EnsureBlockletRunning();

module.exports = {
  ensureBlockletRunning,
  EnsureBlockletRunning,
};
