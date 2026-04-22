const fs = require('fs-extra');
const { join } = require('path');
const fg = require('fast-glob');
const logger = require('@abtnode/logger')('@abtnode/core:storage:import');

const { EXPORT_META_FILENAME } = require('../export/export-meta');
const { installApplicationFromBackup } = require('../../manager/helper/install-application-from-backup');
const { zipToDir } = require('../utils/zip');

class BlockletImporter {
  constructor({ inputDir, manager, states, context = {}, progressCallback } = {}) {
    if (!inputDir || !fs.existsSync(inputDir)) {
      throw new Error(`Input directory does not exist: ${inputDir}`);
    }
    this.inputDir = inputDir;
    this.manager = manager;
    this.states = states;
    this.context = context;
    this.progressCallback = progressCallback || (() => {});
  }

  readExportMeta() {
    const metaPath = join(this.inputDir, EXPORT_META_FILENAME);
    if (!fs.existsSync(metaPath)) {
      throw new Error(`Export metadata not found: ${metaPath}`);
    }
    return fs.readJSONSync(metaPath);
  }

  validate(meta) {
    if (!meta.version) {
      throw new Error('Invalid export metadata: missing version');
    }
    if (!meta.appSk) {
      throw new Error('Invalid export metadata: missing appSk');
    }
    if (!meta.appDid) {
      throw new Error('Invalid export metadata: missing appDid');
    }

    // Check required files exist
    const requiredFiles = ['blocklet.json', 'blocklet-extras.json', 'routing_rule.json'];
    for (const file of requiredFiles) {
      if (!fs.existsSync(join(this.inputDir, file))) {
        throw new Error(`Required file missing in export directory: ${file}`);
      }
    }
  }

  /**
   * Extract bundle zip files so installApplicationFromBackup can find them.
   * Similar to BlockletsRestore.import() but keeps the zip files intact.
   */
  async extractBundleZips() {
    const blockletsDir = join(this.inputDir, 'blocklets');
    if (!fs.existsSync(blockletsDir)) {
      return;
    }

    // Match bundle zips: <name>/<version>.zip and @<scope>/<name>/<version>.zip
    const paths = await fg('{*/*.zip,@*/*/*.zip}', {
      cwd: blockletsDir,
      onlyFiles: true,
      absolute: true,
    });

    await Promise.all(
      paths.map(async (zipPath) => {
        const target = zipPath.replace(/.zip$/, '');
        if (!fs.existsSync(target)) {
          fs.ensureDirSync(target);
        }
        await zipToDir(zipPath, target);
        logger.info('extracted bundle zip', { zipPath, target });
      })
    );
  }

  async import() {
    this.progressCallback('Reading export metadata...');
    const meta = this.readExportMeta();
    this.validate(meta);

    logger.info('import started', {
      appDid: meta.appDid,
      blockletName: meta.blockletName,
      sourceServer: meta.sourceServerDid,
    });

    this.progressCallback('Extracting bundle archives...');
    await this.extractBundleZips();

    // Read controller from exported extras so it can be restored on the new server
    const extrasPath = join(this.inputDir, 'blocklet-extras.json');
    const { controller } = fs.readJSONSync(extrasPath);

    this.progressCallback('Installing blocklet from export...');
    const result = await installApplicationFromBackup({
      url: `file://${this.inputDir}`,
      appSk: meta.appSk,
      moveDir: false,
      manager: this.manager,
      states: this.states,
      sync: true,
      controller,
      context: { startImmediately: false, skipHooks: true, ...this.context },
    });

    logger.info('import completed', { appDid: meta.appDid });
    return { meta, blocklet: result };
  }
}

module.exports = { BlockletImporter };
