/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
const assert = require('assert');
const os = require('os');
const isUrl = require('is-url');
const { Hasher } = require('@ocap/mcrypto');
const isDocker = require('@abtnode/util/lib/is-docker');
const isGitpod = require('@abtnode/util/lib/is-gitpod');
const getFolderSize = require('@abtnode/util/lib/get-folder-size');
const canPackageReadWrite = require('@abtnode/util/lib/can-pkg-rw');
const { toDelegateAddress } = require('@arcblock/did-util');
const { MONITOR_RECORD_INTERVAL_SEC, NODE_MODES } = require('@abtnode/constant');
const { getLauncherInfo } = require('@abtnode/auth/lib/launcher');
const { getProvider } = require('@abtnode/router-provider/lib');
const get = require('lodash/get');

const logger = require('@abtnode/logger')('@abtnode/core:api:node');

const IP = require('../util/ip');
const { validateNodeInfo, validateUpdateGateway } = require('../validators/node');
const { getAll } = require('../blocklet/manager/engine');
const { getDelegateState } = require('../util');
const { NodeRuntimeMonitor } = require('../monitor/node-runtime-monitor');
const { hasMigratedToPostgres } = require('../util/migration-sqlite-to-postgres');
const getHistoryList = require('../monitor/get-history-list');

class NodeAPI {
  /**
   * @param {object} states StateDB
   * @param {string} nodeDid
   */
  constructor(states, nodeDid) {
    assert.notStrictEqual(states, undefined, 'argument states can not be undefined');
    assert.notStrictEqual(states, null, 'argument states can not be null');

    this.runtimeMonitor = new NodeRuntimeMonitor({
      state: states.runtimeInsight,
      did: nodeDid,
    });

    this.state = states.node;
  }

  async updateNodeInfo(entity = {}, context) {
    await validateNodeInfo(entity, context);

    if (entity.autoUpgrade && process.env.NODE_ENV !== 'development') {
      try {
        canPackageReadWrite(process.env.ABT_NODE_BINARY_NAME, process.env.ABT_NODE_PACKAGE_NAME);
      } catch (err) {
        throw new Error(`Auto upgrade is not supported for this node due to: ${err.message}`);
      }
    }

    try {
      if (entity.registerUrl && isUrl(entity.registerUrl)) {
        const launcherInfo = await getLauncherInfo(entity.registerUrl);
        entity.registerInfo = launcherInfo;
        logger.info(`Updated launcher info from ${entity.registerUrl}`, launcherInfo);
      }

      const updateResult = await this.state.updateNodeInfo(entity);
      return updateResult;
    } catch (error) {
      logger.error('update node info failed', { error, entity });
      throw error;
    }
  }

  async getInfo() {
    const info = await this.state.read();
    const env = await this.state.getEnvironments(info);
    info.environments = Object.keys(env).map((x) => ({ key: x, value: env[x] }));
    info.uptime = process.uptime() * 1000;
    return info;
  }

  deleteCache() {
    this.state.deleteCache?.();
  }

  async getDiskInfo() {
    let diskInfo = { app: 0, cache: 0, log: 0, data: 0, blocklets: 0 };
    if (process.env.ABT_NODE_FAKE_DISK_INFO === '1') {
      return diskInfo;
    }

    // Do not get real disk info for serverless mode to avoid too much resource usage
    const info = await this.state.read();
    if (info.mode === NODE_MODES.SERVERLESS) {
      return diskInfo;
    }

    try {
      const [app, cache, log, data, blocklets] = await Promise.all([
        getFolderSize(this.state.dataDirs.core),
        getFolderSize(this.state.dataDirs.cache),
        getFolderSize(this.state.dataDirs.logs),
        getFolderSize(this.state.dataDirs.data),
        getFolderSize(this.state.dataDirs.blocklets),
      ]);
      diskInfo = { app, cache, log, data, blocklets };
    } catch (err) {
      // Do nothing
    }

    return diskInfo;
  }

  async getServerProviders({ dataDir } = {}) {
    const nodeInfo = await this.state.read();
    const name = get(nodeInfo, 'routing.provider', null);
    const Provider = getProvider(name);
    const routerProvider = [name, Provider.version].join('@');
    const dataPath = dataDir || process.env.ABT_NODE_DATA_DIR;
    const postgresVersion = process.env.ABT_NODE_POSTGRES_VERSION || '17.5';
    let dbProvider = '';
    if (hasMigratedToPostgres(dataPath)) {
      dbProvider = `PostgresGQL@${postgresVersion}`;
    } else {
      const sqliteVersion = await this.state.getSqliteVersion();
      dbProvider = sqliteVersion ? `SQLite@${sqliteVersion}` : 'SQLite';
    }

    return {
      routerProvider,
      ...(dbProvider ? { dbProvider } : {}),
    };
  }

  async getEnv() {
    const info = await IP.get({ timeout: 5000 });
    info.internalV4 = info.internal;
    info.externalV4 = info.external;
    // get router provider info
    const providers = await this.getServerProviders();

    const res = {
      ip: info,
      os: [os.platform(), os.arch(), os.release()].join(', '),
      docker: isDocker(),
      location: '', // TODO: load location from ip
      blockletEngines: getAll(),
      gitpod: isGitpod(),
      disk: await this.getDiskInfo(),
      ...providers,
    };

    return res;
  }

  async updateGateway(entity, context) {
    const data = await validateUpdateGateway(entity, context);

    return this.state.updateGateway(data);
  }

  async getDelegationState() {
    const info = await this.state.read();

    const ownerNft = info.ownerNft || {};
    if (!ownerNft.did) {
      throw new Error('Invalid owner NFT');
    }

    const address = toDelegateAddress(ownerNft.holder, info.did);
    const state = await getDelegateState(info.launcher.chainHost, address);
    if (!state) {
      return { delegated: false };
    }

    const transferV2Delegation = (state.ops || []).find(({ key }) => key === 'fg:t:transfer_v2');
    return { delegated: !!transferV2Delegation };
  }

  // eslint-disable-next-line no-unused-vars
  async getHistory({ hours = 1 } = {}, context) {
    const history = await this.runtimeMonitor.getHistory(hours);
    return getHistoryList({
      history,
      hours,
      recordIntervalSec: MONITOR_RECORD_INTERVAL_SEC,
      props: ['date', 'cpu', 'mem', 'daemonMem', 'serviceMem', 'hubMem'],
    });
  }

  getRealtimeData() {
    return this.runtimeMonitor.getRealtimeData();
  }

  getCrons() {
    return [
      {
        name: 'record-node-runtime-info',
        time: `*/${MONITOR_RECORD_INTERVAL_SEC} * * * * *`,
        fn: () => this.runtimeMonitor.monit(),
      },
      {
        name: 'cleanup-runtime-info',
        time: '0 5 */2 * * *', // every 2 hours, eg: 00:05, 02:05, 04:05, 06:05
        fn: () => this.runtimeMonitor.cleanup(),
      },
    ];
  }

  async getSessionSecret() {
    const info = await this.getInfo();
    return Hasher.SHA3.hash256(
      Buffer.concat([process.env.ABT_NODE_SESSION_SECRET, info.sessionSalt].filter(Boolean).map((v) => Buffer.from(v)))
    );
  }
}

module.exports = NodeAPI;
