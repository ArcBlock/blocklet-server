const { EventEmitter } = require('events');
const dayjs = require('@abtnode/util/lib/dayjs');
const pick = require('lodash/pick');
const cloneDeep = require('@abtnode/util/lib/deep-clone');

const { PROCESS_NAME_DAEMON, PROCESS_NAME_SERVICE, EVENTS } = require('@abtnode/constant');
const defaultLogger = require('@abtnode/logger')('@abtnode/util:node-runtime-info');
const pm2 = require('@abtnode/util/lib/pm2/async-pm2');

const { getSysInfo } = require('../util/sysinfo');

const getProcessInfo = (processId, { returnList } = {}) =>
  new Promise((resolve, reject) => {
    pm2.describe(processId, (err, infos) => {
      if (err) {
        return reject(err);
      }

      if (!infos || !infos[0]) {
        return resolve(null);
      }

      if (returnList) {
        return resolve(infos);
      }

      return resolve(infos[0]);
    });
  });

const DEFAULT_DATA = {
  realtime: {
    cpu: {},
    mem: {},
    os: {},
    disks: [],
    daemon: {},
    service: {},
  },
  history: [],
};

class NodeRuntimeMonitor extends EventEmitter {
  constructor({ did, state, logger = defaultLogger } = {}) {
    super();

    this.logger = logger;
    this.data = cloneDeep(DEFAULT_DATA);
    this.inProgress = false;
    this.did = did;
    this.state = state;
  }

  emitRealtimeData() {
    this.emit(EVENTS.NODE_RUNTIME_INFO, this.getRealtimeData());
  }

  getRealtimeData() {
    return this.data.realtime;
  }

  async getHistory(hours = 1) {
    const result = await this.state.findPaginated({
      did: this.did,
      startDate: dayjs().subtract(hours, 'hours').toDate().getTime(),
      paging: { pageSize: hours * 360 },
    });
    return (result.list || []).reverse();
  }

  async monit() {
    if (this.inProgress) {
      this.logger.debug('monitoring is in progress');
      return;
    }

    this.inProgress = true;

    const date = Date.now();
    await Promise.allSettled([
      getSysInfo().catch((error) => {
        this.logger.error(`failed to getSysInfo: ${error.message}`);
      }),
      getProcessInfo(PROCESS_NAME_SERVICE, { returnList: true }).catch((error) => {
        this.logger.error(`failed to get blocklet-service info: ${error.message}`);
      }),
      process.env.NODE_ENV !== 'development'
        ? getProcessInfo(PROCESS_NAME_DAEMON).catch((error) => {
            this.logger.error(`failed to get daemon info: ${error.message}`);
          })
        : Promise.resolve(),
    ])
      .then(([{ value: sysInfo }, { value: serviceInfos }, { value: daemonInfo }]) => {
        this.inProgress = false;

        const historyItem = {
          date,
          cpu: 0,
          mem: 0,
          daemonMem: 0,
          serviceMem: 0,
        };

        if (sysInfo) {
          Object.assign(this.data.realtime, pick(sysInfo, ['cpu', 'mem', 'os', 'disks']));

          historyItem.cpu = Number(sysInfo.cpu.currentLoad.toFixed(2));
          historyItem.mem = sysInfo.mem.total - sysInfo.mem.available;
        }

        if (serviceInfos) {
          const [proc] = serviceInfos;

          const runtimeInfo = {
            pid: proc.pid,
            uptime: proc.pm2_env ? +new Date() - Number(proc.pm2_env.pm_uptime) : 0,
            // FIXME: 将 services 进程聚合在一起不利于排查问题
            memoryUsage: serviceInfos.reduce((total, info) => total + info.monit.memory, 0),
            cpuUsage: serviceInfos.reduce((total, info) => total + info.monit.cpu, 0),
            status: proc.pm2_env ? proc.pm2_env.status : null,
            instanceCount: serviceInfos.length,
          };

          this.data.realtime.service = runtimeInfo;

          historyItem.serviceMem = runtimeInfo.memoryUsage;
        } else {
          this.data.realtime.service = {};
        }

        if (daemonInfo) {
          const proc = daemonInfo;

          const runtimeInfo = {
            pid: proc.pid,
            uptime: proc.pm2_env ? +new Date() - Number(proc.pm2_env.pm_uptime) : 0,
            memoryUsage: proc.monit.memory,
            cpuUsage: proc.monit.cpu,
            status: proc.pm2_env ? proc.pm2_env.status : null,
          };

          this.data.realtime.daemon = runtimeInfo;

          historyItem.daemonMem = runtimeInfo.memoryUsage;
        } else {
          this.data.realtime.daemon = {};
        }

        this.logger.info('server runtime info', historyItem);

        this._push(historyItem);

        this.emitRealtimeData();
      })
      .catch((err) => {
        this.inProgress = false;
        this.logger.error(err.message);
      });
  }

  calculateUtilization() {
    if (!this.data.realtime || !this.data.realtime.cpu || !this.data.realtime.mem || !this.data.realtime.disks) {
      return {
        cpus: [0],
        disks: [0],
        memory: 0,
      };
    }
    try {
      const { cpu, mem, disks } = this.data.realtime;
      // 计算每个 CPU 的占用率：load字段为百分比，除以 100 得到 0 到 1 的值
      const cpuUtilizations = cpu.cpus?.filter((v) => v.load > 0).map((v) => v.load / 100) || [0];

      // 计算每个硬盘占用率：used / total
      const diskUtilizations = disks?.filter((v) => v.used > 0).map((v) => v.used / v.total) || [0];

      // 计算内存占用率：used / total
      const memoryUtilization = mem.total > 0 && mem.available > 0 ? (mem.total - mem.available) / mem.total : 0;

      // 返回包含所需值的对象
      return {
        cpus: cpuUtilizations,
        disks: diskUtilizations,
        memory: memoryUtilization,
      };
    } catch (error) {
      this.logger.error('failed to calculate utilization', error);
      return {
        cpus: [0],
        disks: [0],
        memory: 0,
      };
    }
  }

  checkSystemHighLoad({ maxCpus, maxMem, maxDisk }) {
    const { cpus, memory, disks } = this.calculateUtilization();
    let highType = '';
    if (cpus.some((v) => v > maxCpus) && memory > maxMem) {
      highType = 'cpu and memory';
    }
    // 1 表示虚拟盘，不参与计算
    if (disks.some((v) => v !== 1 && v > maxDisk)) {
      highType = 'disk';
    }
    if (highType) {
      this.logger.info('system high load', { cpus, memory, disks });
    }
    return {
      isHighLoad: !!highType,
      highType,
      cpus,
      memory,
      disks,
    };
  }

  cleanup() {
    return this.state.remove({ date: { $lt: Date.now() - 1000 * 60 * 60 * 24 } });
  }

  _push(value) {
    return this.state.insert({ did: this.did, ...value }).catch((err) => {
      if (err.name === 'SequelizeValidationError') {
        console.error(
          'RuntimeInsight validation error',
          err.errors.map((e) => e.message)
        );
      } else {
        console.error('RuntimeInsight insert error', err);
      }
    });
  }
}

module.exports.NodeRuntimeMonitor = NodeRuntimeMonitor;
