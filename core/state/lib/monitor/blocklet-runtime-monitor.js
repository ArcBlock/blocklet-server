const { EventEmitter } = require('events');

const cloneDeep = require('@abtnode/util/lib/deep-clone');
const pLimit = require('p-limit');
const dayjs = require('@abtnode/util/lib/dayjs');
const { forEachBlocklet, isGatewayBlocklet, hasStartEngine } = require('@blocklet/meta/lib/util');
const { getComponentProcessId } = require('@blocklet/meta/lib/get-component-process-id');
const { EVENTS } = require('@abtnode/constant');
const { BlockletStatus } = require('@blocklet/constant');
const defaultLogger = require('@abtnode/logger')('blocklet-runtime-monitor');

const { Op } = require('sequelize');
const { isWorkerInstance } = require('@abtnode/util/lib/pm2/is-instance-worker');
const { getRuntimeInfo } = require('../util/blocklet');

const insertThrottleMap = new Map();

const isRuntimeMonitorDisabled = () => {
  const value = process.env.ABT_NODE_RUNTIME_MONITOR_DISABLED;
  // Disabled when set to '1' or 'true', enabled when '0', 'false', or unset
  return value === '1' || value === 'true';
};

class BlockletRuntimeMonitor extends EventEmitter {
  constructor({ states, logger = defaultLogger } = {}) {
    super();

    /**
     * @type {import('../states')}
     */
    this.states = states;
    this.data = {};
    this.logger = logger;
    this.inProgress = false;
  }

  async getHistory(blockletDid, hours = 1) {
    if (isRuntimeMonitorDisabled()) {
      return [];
    }

    const result = await this.states.runtimeInsight.model.findAll({
      where: {
        did: {
          [Op.like]: `${blockletDid}%`,
        },
        date: {
          [Op.gte]: dayjs().subtract(hours, 'hours').toDate().getTime(),
          [Op.lte]: dayjs().toDate().getTime(),
        },
      },
    });

    return result.map((x) => x.toJSON());
  }

  /**
   *
   *
   * @param {string} blockletDid
   * @param {string} [componentId='app'] example: 'app', '${blockletDid}/${componentId}'
   * @return {*}
   * @memberof BlockletRuntimeMonitor
   */
  getRuntimeInfo(blockletDid, componentId = 'app') {
    if (isRuntimeMonitorDisabled()) {
      return null;
    }

    if (!this.data[blockletDid]) {
      return null;
    }

    if (!this.data[blockletDid][componentId]) {
      return null;
    }

    return this.data[blockletDid][componentId].runtimeInfo;
  }

  async monit(did) {
    if (isRuntimeMonitorDisabled()) {
      return;
    }

    const blocklet = await this.states.blocklet.getBlocklet(did);
    await this._monit(blocklet);
  }

  async _monit(blocklet, { addToHistory } = {}) {
    if (isRuntimeMonitorDisabled()) {
      return;
    }

    const {
      meta: { did: blockletDid },
      status,
      greenStatus,
    } = blocklet;

    if (status !== BlockletStatus.running && greenStatus !== BlockletStatus.running) {
      if (this.data[blockletDid]) {
        Object.keys(this.data[blockletDid]).forEach((key) => {
          this.data[blockletDid][key].runtimeInfo = {};
        });
      }
      return;
    }

    this.data[blockletDid] = this.data[blockletDid] || {
      app: {
        runtimeInfo: {
          memoryUsage: 0,
          cpuUsage: 0,
          pid: -1,
          uptime: 0,
          status: '',
        },
        history: [],
      },
    };

    let appCpu = 0;
    let appMem = 0;
    let runningDocker = false;

    await forEachBlocklet(
      blocklet,
      async (component, { id: componentId, ancestors }) => {
        const { meta } = component;
        if (
          !isGatewayBlocklet(meta) &&
          hasStartEngine(meta) &&
          (component.status === BlockletStatus.running || component.greenStatus === BlockletStatus.running)
        ) {
          const _processId = getComponentProcessId(component, ancestors);
          const processId = component.greenStatus === BlockletStatus.running ? `${_processId}-green` : _processId;

          try {
            const runtimeInfo = await getRuntimeInfo(processId);

            this.data[blockletDid][componentId] = { runtimeInfo };

            if (!component.mountPoint || component.mountPoint === '/') {
              this.data[blockletDid].app.runtimeInfo = cloneDeep(runtimeInfo);
            }

            appCpu += runtimeInfo.cpuUsage || 0;
            appMem += runtimeInfo.memoryUsage || 0;
            runningDocker = runningDocker || runtimeInfo.runningDocker;
          } catch (err) {
            // component status in db may not sync with pm2 when server has just started
            if (err.code !== 'BLOCKLET_PROCESS_404') {
              this.logger.error('failed to get blocklet runtime info', { processId, error: err });
            }
          }
        } else {
          delete this.data[blockletDid][componentId];
        }
      },
      { parallel: true }
    );

    appCpu = Number(appCpu.toFixed(2));

    this.data[blockletDid].app.runtimeInfo.cpuUsage = appCpu;
    this.data[blockletDid].app.runtimeInfo.memoryUsage = appMem;
    this.data[blockletDid].app.runtimeInfo.runningDocker = runningDocker;

    // push to history
    if (addToHistory) {
      const date = Date.now();

      Object.entries(this.data[blockletDid]).forEach(([componentId, value]) => {
        if (componentId === 'app') {
          this._push(blockletDid, { date, cpu: value.runtimeInfo.cpuUsage, mem: value.runtimeInfo.memoryUsage });
        } else {
          this._push(componentId, { date, cpu: value.runtimeInfo.cpuUsage, mem: value.runtimeInfo.memoryUsage });
        }
      });
    }
  }

  async monitAll() {
    if (isRuntimeMonitorDisabled()) {
      return;
    }

    if (this.inProgress) {
      this.logger.debug('monitoring is in progress');
      return;
    }

    this.inProgress = true;

    try {
      const blocklets = await this.states.blocklet.getBlocklets();

      const limit = pLimit(5);
      await Promise.allSettled(
        blocklets.map((blocklet) =>
          limit(async () => {
            await this._monit(blocklet, { addToHistory: true });
          })
        )
      );

      this.inProgress = false;

      // emit event
      const eventData = [];
      Object.entries(this.data).forEach(([did, x]) => {
        Object.entries(x).forEach(([componentId, { runtimeInfo }]) => {
          if (componentId !== 'app') {
            eventData.push({ did, componentId, runtimeInfo });
          }
        });
      });
      this.emit(EVENTS.BLOCKLETS_RUNTIME_INFO, eventData);
    } catch (error) {
      this.inProgress = false;
      this.logger.error('monit blocklet runtime failed', { error });
    }
  }

  async getBlockletRuntimeInfo(blockletDid) {
    if (isRuntimeMonitorDisabled()) {
      return null;
    }

    const blocklet = await this.states.blocklet.getBlocklet(blockletDid);
    if (!blocklet) {
      return null;
    }

    const info = this.getRuntimeInfo(blockletDid);
    if (blocklet && !info) {
      await this._monit(blocklet, { addToHistory: false }).catch((err) => {
        this.logger.error('failed to get blocklet runtime info', { error: err });
      });
    }

    return this.getRuntimeInfo(blockletDid);
  }

  delete(blockletDid) {
    delete this.data[blockletDid];
  }

  _push(blockletDid, value) {
    if (isWorkerInstance()) {
      return Promise.resolve();
    }

    const now = Date.now();
    const lastInsertTime = insertThrottleMap.get(blockletDid);

    if (lastInsertTime && now - lastInsertTime < 3000) {
      return Promise.resolve();
    }

    insertThrottleMap.set(blockletDid, now);

    return this.states.runtimeInsight.insert({ did: blockletDid, ...value }).catch((error) => {
      const err = typeof error === 'string' ? error : error.message;
      if (err.includes('duplicate key value violates unique constraint ')) {
        console.error('RuntimeInsight insert error duplicate key value violates unique constraint');
        return;
      }
      if (err.name === 'SequelizeValidationError') {
        console.error('RuntimeInsight validation error:', err);
      } else {
        console.error('RuntimeInsight insert error', err);
      }
    });
  }
}

module.exports.BlockletRuntimeMonitor = BlockletRuntimeMonitor;
module.exports.isRuntimeMonitorDisabled = isRuntimeMonitorDisabled;
