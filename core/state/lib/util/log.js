/* eslint-disable no-underscore-dangle */
const path = require('path');
const createArchive = require('archiver');
const fs = require('fs-extra');
const glob = require('fast-glob');
const isEqual = require('lodash/isEqual');
const { Tail } = require('tail');
const readLastLines = require('read-last-lines');
const { BLOCKLET_MODES } = require('@blocklet/constant');
const { findComponentByIdV2 } = require('@blocklet/meta/lib/util');
const dayjs = require('@abtnode/util/lib/dayjs');
const logger = require('@abtnode/logger')(require('../../package.json').name);

class StreamLog {
  constructor() {
    this._files = null; // Object { <level>: <filePath> }
    this._tails = null; // Object { <level>: <Tail> }
  }

  /**
   * @param {Object} files Object { <level>: <filePath> }
   * @return {Boolean} if files change
   */
  setFiles(files) {
    if (!isEqual(this._files, files)) {
      this.clearTails();
      this._files = files;
      return true;
    }
    return false;
  }

  getRecent(lineNum, callback) {
    if (!this._files) {
      callback(new Error('files is empty'));
    }
    Object.entries(this._files).forEach(([level, file]) => {
      if (!file || !fs.existsSync(file)) {
        return;
      }
      readLastLines
        .read(file, lineNum || 0)
        .then((data) => {
          callback(null, level, data);
        })
        .catch((error) => {
          callback(error, level);
        });
    });
  }

  ensureTails() {
    if (this._tails) {
      return this._tails;
    }
    if (!this._files) {
      return {};
    }
    try {
      this._tails = {};
      Object.entries(this._files).forEach(([level, file]) => {
        if (!file || !fs.existsSync(file)) {
          return;
        }

        // 测试发现 Windows 下 fs.watch 没有效果，但是 fs.watch 的性能更好，所以只在 windows 下使用 fs.watchFile
        this._tails[level] = new Tail(file, {
          useWatchFile: process.platform === 'win32',
          fsWatchOptions: { interval: 1500 },
        });
      });
      return this._tails;
    } catch (error) {
      this._tails = null;
      throw error;
    }
  }

  clearTails() {
    if (this._tails) {
      Object.values(this._tails).forEach((tail) => {
        tail.unwatch();
      });
      this._tails = null;
    }
  }
}

const createFile = (files) => {
  files.forEach((file) => {
    const targetFile = typeof file === 'string' ? file : file.target;

    if (!fs.existsSync(targetFile)) {
      try {
        const dir = path.dirname(targetFile);
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        // Do nothing
      }
      fs.writeFileSync(targetFile, '', 'utf8');
    }

    if (file.symbol && !fs.existsSync(file.symbol)) {
      fs.symlinkSync(targetFile, file.symbol);
    }
  });
};

const getLogFiles = async ({ name, node }) => {
  const dt = new Date();
  const { yyyy, mm, dd } = {
    yyyy: dt.getFullYear(),
    mm: `${dt.getMonth() + 1}`.padStart(2, 0),
    dd: `${dt.getDate()}`.padStart(2, 0),
  };
  const date = `${yyyy}-${mm}-${dd}`;

  if (name === 'abtnode') {
    const logDir = path.join(node.dataDirs.logs, '_abtnode');

    const infoSymbol = path.join(logDir, 'daemon.log');
    const infoTarget = path.join(logDir, `daemon-${date}.log`);
    const errorSymbol = path.join(logDir, 'daemon-error.log');
    const errorTarget = path.join(logDir, `daemon-error-${date}.log`);

    const access = path.join(logDir, 'access.log');
    const stdout = path.join(logDir, 'daemon.stdout.log');
    const stderr = path.join(logDir, 'daemon.stderr.log');
    const pm2 = path.join(process.env.PM2_HOME, 'pm2.log');

    createFile([
      { symbol: infoSymbol, target: infoTarget },
      { symbol: errorSymbol, target: errorTarget },
      access,
      stdout,
      stderr,
      pm2,
    ]);

    return {
      info: infoSymbol,
      error: errorSymbol,
      access,
      stdout,
      stderr,
      pm2,
    };
  }

  if (name === 'blocklet-services') {
    const logDir = path.join(node.dataDirs.logs, '_abtnode');
    const infoSymbol = path.join(logDir, 'service.log');
    const infoTarget = path.join(logDir, `service-${date}.log`);
    const errorSymbol = path.join(logDir, 'service-error.log');
    const errorTarget = path.join(logDir, `service-error-${date}.log`);
    const access = path.join(logDir, 'service.access.log');
    const stdout = path.join(logDir, 'service.stdout.log');
    const stderr = path.join(logDir, 'service.stderr.log');
    createFile([
      { info: infoSymbol, target: infoTarget },
      { symbol: errorSymbol, target: errorTarget },
      access,
      stdout,
      stderr,
    ]);

    return { info: infoSymbol, error: errorSymbol, access, stdout, stderr };
  }

  if (name.indexOf('blocklet-') === 0) {
    const did = name.substring('blocklet-'.length);
    const [appId, componentId] = did.split('/');
    const blocklet = await node.getBlocklet({ did: appId, useCache: true });
    let { name: blockletName } = blocklet.meta;

    let component;
    if (componentId) {
      component = findComponentByIdV2(blocklet, componentId);
      if (component) {
        blockletName = path.join(blockletName, component.meta.name);
      }
    }

    const dir = path.join(node.dataDirs.logs, blockletName);
    const infoSymbol = path.join(dir, 'info.log');
    const infoTarget = path.join(dir, `info-${date}.log`);
    const errorSymbol = path.join(dir, 'info-error.log');
    const errorTarget = path.join(dir, `info-error-${date}.log`);
    const access = path.join(dir, 'access.log');
    const stdout = path.join(dir, 'output.log');
    const stderr = path.join(dir, 'error.log');

    createFile([
      { symbol: infoSymbol, target: infoTarget },
      { symbol: errorSymbol, target: errorTarget },
      access,
      stdout,
      stderr,
    ]);

    return {
      info: infoSymbol,
      error: errorSymbol,
      access,
      stdout,
      stderr,
      recent: component?.mode === BLOCKLET_MODES.DEVELOPMENT ? 0 : 100,
    };
  }

  if (name.startsWith('service-gateway-')) {
    const providerName = name.substring('service-gateway-'.length);
    const provider = node.getRouterProvider(providerName);
    if (!provider) {
      logger.error('router engine is empty', { name, providerName });
      return {};
    }

    return provider.getLogFilesForToday();
  }

  return {};
};

const getDownloadLogFilesFromServer = async ({ dates, nodeInfo, node } = {}) => {
  const logDir = path.join(node.dataDirs.logs, '_abtnode');

  const pm2Log = path.join(logDir, 'pm2.log');
  const pm2LogSrc = path.join(process.env.PM2_HOME, 'pm2.log');
  if (fs.existsSync(pm2LogSrc)) {
    await fs.copy(pm2LogSrc, pm2Log);
  }

  const provider = node.getRouterProvider(nodeInfo.routing.provider);
  if (!provider) {
    logger.error('router engine is empty');
  }

  const list = [];

  dates.forEach((d) => {
    // log file created by @abtnode/log
    // log file created by abt-node-log-rotate
    list.push(path.join(logDir, `*-${d}*`));

    // log file create by router
    const routerLogDir = provider.getLogDir();
    if (routerLogDir) {
      list.push(path.join(routerLogDir, `*-${d}*`));
    }
  });

  // abt-node-daemon console & gateway
  list.push(path.join(logDir, 'daemon.stdout.log*'));
  list.push(path.join(logDir, 'daemon.stderr.log*'));
  list.push(path.join(logDir, 'access.log*'));

  // abt-node-service console & gateway
  list.push(path.join(logDir, 'service.stdout.log*'));
  list.push(path.join(logDir, 'service.stderr.log*'));
  list.push(path.join(logDir, 'service.log*'));

  // abt-node-db-hub console & backup
  list.push(path.join(logDir, 'db.output.log*'));
  list.push(path.join(logDir, 'db.error.log*'));

  // abt-node-event-hub console
  list.push(path.join(logDir, 'event.output.log*'));
  list.push(path.join(logDir, 'event.error.log*'));

  // abt-node-log-rotate console
  list.push(path.join(logDir, 'pm2-logrotate.stdout.log*'));
  list.push(path.join(logDir, 'pm2-logrotate.stderr.log*'));

  // abt-node-updater console
  list.push(path.join(logDir, 'updater.error.log*'));
  list.push(path.join(logDir, 'updater.output.log*'));

  // fallback log
  list.push(path.join(logDir, 'stderr.log*'));
  list.push(path.join(logDir, 'stdout.log*'));

  // router
  list.push(...Object.values(provider.getLogFilesForToday() || {}));

  // pm2 log
  list.push(pm2Log);

  return glob(list);
};

const getDownloadLogFilesFromBlocklet = ({ dates, blocklet } = {}) => {
  const appLogDir = path.join(blocklet.env.logsDir);
  const componentLogDirs = blocklet.children.map((c) => path.join(c.env.logsDir));

  const list = [];

  [appLogDir, ...componentLogDirs].forEach((logDir) => {
    dates.forEach((d) => {
      // log file created by @abtnode/log
      // log file created by abt-node-log-rotate
      list.push(path.join(logDir, `*-${d}*`));
    });

    list.push(path.join(logDir, 'output.log*'));
    list.push(path.join(logDir, 'error.log*'));
    list.push(path.join(logDir, 'access.log*'));
  });

  return glob(list);
};

const getDownloadLogFiles = async ({ did, node, days = 1, now } = {}) => {
  const dates = [dayjs(now).format('YYYY-MM-DD')];

  for (let i = 1; i <= days; i++) {
    dates.unshift(dayjs(now).subtract(i, 'day').format('YYYY-MM-DD'));
  }

  const nodeInfo = await node.getNodeInfo({ useCache: true });

  if (nodeInfo.did === did) {
    return getDownloadLogFilesFromServer({ dates, node, nodeInfo });
  }

  const blocklet = await node.getBlocklet({ did });
  if (!blocklet) {
    throw new Error('blocklet not found');
  }

  return getDownloadLogFilesFromBlocklet({ dates, blocklet });
};

const createStreamLogManager = ({ onLog, onGetLogFiles }) => {
  const store = {}; // Object<name: streamLog>

  const ensure = (name) => {
    if (!store[name]) {
      store[name] = new StreamLog();
    }
    return store[name];
  };

  const destroy = (name) => {
    logger.info('log stream: destroy', { name });
    if (!store[name]) {
      return;
    }
    const log = store[name];
    try {
      log.clearTails();
      delete store[name];
    } catch (error) {
      logger.error('log stream: remove ref error ', error);
      delete store[name];
    }
  };

  const add = async (name, topic, firstLogCb) => {
    logger.info('log stream: add', { name });
    const log = ensure(name);
    try {
      // update files
      // push recent 100 log
      const { recent = 100, ...logFiles } = await onGetLogFiles(name);

      const changed = await log.setFiles(logFiles);
      logger.info('log stream: added', { name, logFiles });
      log.getRecent(recent, (error, level, data) => {
        if (error) {
          logger.error('log stream error ', error);
        }
        if (firstLogCb) {
          firstLogCb(level, data, logFiles);
        }
      });
      // stream
      if (changed) {
        const tails = log.ensureTails();
        Object.entries(tails).forEach(([level, tail]) => {
          tail.on('line', (data) => {
            onLog({ topic, level, logFiles, data });
          });
          tail.on('error', (error) => {
            logger.error('log tail error ', { error });
            destroy(name);
          });
        });
      }
    } catch (error) {
      logger.error('log stream error ', error);
    }
  };

  return {
    add,
    destroy,
  };
};

const createDownloadLogStream = async ({ node, did, days, now }) => {
  const files = await getDownloadLogFiles({ node, did, days, now });

  if (!files.length) {
    throw new Error('Log file does not found');
  }

  const cwd = path.dirname(node.dataDirs.logs);

  const archive = createArchive('zip', { zlib: { level: 9 } });
  files.forEach((x) => {
    archive.file(x, {
      name: x.replace(`${cwd}/logs`, '/logs').replace(`${cwd}`, '/logs').replace('/_abtnode', '/blocklet-server'),
    });
  });

  archive.rawPipe = archive.pipe.bind(archive);
  archive.pipe = (s) => {
    archive.rawPipe(s);
    // 延迟调用 finalize，确保 pipe 的内部流完全初始化
    // 使用 setTimeout(0) 以避免在 Bun/Node 中 finalize 过早导致 zip 不完整
    setTimeout(() => {
      archive.finalize();
    }, 0);
  };

  return archive;
};

module.exports = {
  createStreamLogManager,
  getLogFiles,
  getDownloadLogFiles,
  createDownloadLogStream,
};
