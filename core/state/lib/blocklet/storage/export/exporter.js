const path = require('path');
const { isValid } = require('@arcblock/did');
const { ensureDirSync } = require('fs-extra');
const isEmpty = require('lodash/isEmpty');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const logger = require('@abtnode/logger')('@abtnode/core:storage:export');

const states = require('../../../states');
const { BlockletExport } = require('./blocklet-export');
const { BlockletExtrasExport } = require('./blocklet-extras-export');
const { BlockletsExport } = require('./blocklets-export');
const { DataBackup } = require('../backup/data');
const { RoutingRuleBackup } = require('../backup/routing-rule');
const { LogsBackup } = require('../backup/logs');
const { writeExportMeta } = require('./export-meta');
const { dockerExecChown } = require('../../../util/docker/docker-exec-chown');
const checkDockerRunHistory = require('../../../util/docker/check-docker-run-history');
const { dockerBackupPgBlockletDb } = require('../../../util/docker/docker-backup-pg-blocklet-db');

class BlockletExporter {
  constructor({ appDid, outDir, serverDir, options = {}, progressCallback } = {}) {
    if (isEmpty(appDid) || !isValid(appDid)) {
      throw new Error(`appDid(${appDid}) is not a valid did`);
    }
    if (isEmpty(outDir)) {
      throw new Error('outDir is required');
    }

    this.appDid = appDid;
    this.outDir = outDir;
    this._serverDir = serverDir;
    this.includeLogs = options.includeLogs || false;
    this.progressCallback = progressCallback || (() => {});
  }

  async initialize() {
    this.blocklet = await states.blocklet.getBlocklet(this.appDid);
    if (isEmpty(this.blocklet)) {
      throw new Error(`Blocklet ${this.appDid} not found`);
    }

    this.serverDir = this._serverDir || process.env.ABT_NODE_DATA_DIR;
    this.backupDir = this.outDir;
    ensureDirSync(this.backupDir);

    // Extract appSk from blocklet wallet
    const nodeInfo = await states.node.read();
    const { wallet } = getBlockletInfo(this.blocklet, nodeInfo.sk);
    this.appSk = wallet.secretKey;
    this.appDid = wallet.address;
    this.serverDid = nodeInfo.did;

    logger.info('export initialized', { appDid: this.appDid, outDir: this.outDir });
  }

  async prepareDocker() {
    const nodeInfo = await states.node.read();

    if (checkDockerRunHistory(nodeInfo)) {
      let paths = [];
      if (this.blocklet) {
        paths = this.blocklet.children.map((child) => {
          if (!child.meta?.docker?.image) {
            return null;
          }
          return path.join(this.serverDir, 'blocklets', child.meta.name, child.meta.version);
        });
      }
      await dockerExecChown({
        name: `${this.blocklet.meta.did}-export`,
        dirs: [path.join(this.serverDir, 'data', this.blocklet.meta.did), ...paths.filter(Boolean)],
      });
    }
  }

  async backupPostgres() {
    if (!this.blocklet) {
      return;
    }
    const dataDir =
      this.blocklet.environments?.find((v) => v.key === 'BLOCKLET_APP_DATA_DIR')?.value ||
      path.join(this.serverDir, 'data', this.blocklet.appPid || this.blocklet.appDid);
    const dbPath = path.join(dataDir, 'blocklet.db');
    await dockerBackupPgBlockletDb(dbPath);
  }

  async export() {
    await this.initialize();
    this.progressCallback('Preparing Docker environment...');

    await this.prepareDocker();
    await this.backupPostgres();

    const input = { appDid: this.appDid };

    // Data must be exported first
    this.progressCallback('Exporting data directory...');
    const dataBackup = new DataBackup(input);
    dataBackup.ensureParams(this);
    await dataBackup.export();

    // Export blocklet state, extras, bundles, and routing rules in parallel
    this.progressCallback('Exporting blocklet state and bundles...');
    const storages = [
      new BlockletExport(input),
      new BlockletsExport(input),
      new BlockletExtrasExport(input),
      new RoutingRuleBackup(input),
    ];
    await Promise.all(
      storages.map((storage) => {
        storage.ensureParams(this);
        return storage.export();
      })
    );

    // Optional: export logs
    if (this.includeLogs) {
      this.progressCallback('Exporting logs...');
      const logsBackup = new LogsBackup(input);
      logsBackup.ensureParams(this);
      await logsBackup.export();
    }

    // Write export metadata
    this.progressCallback('Writing export metadata...');
    const meta = await writeExportMeta({
      outDir: this.backupDir,
      blocklet: this.blocklet,
      serverDid: this.serverDid,
      appSk: this.appSk,
      appDid: this.appDid,
    });

    logger.info('export completed', { appDid: this.appDid, outDir: this.outDir });
    return meta;
  }
}

module.exports = { BlockletExporter };
