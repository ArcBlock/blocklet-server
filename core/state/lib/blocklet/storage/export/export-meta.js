const { outputJson } = require('fs-extra');
const { join } = require('path');

const EXPORT_META_VERSION = 1;
const EXPORT_META_FILENAME = 'export-meta.json';

/**
 * @param {object} params
 * @param {string} params.outDir - export output directory
 * @param {object} params.blocklet - blocklet state
 * @param {string} params.serverDid - source server DID
 * @param {string} params.appSk - plaintext application secret key
 * @param {string} params.appDid - application DID
 * @returns {Promise<object>} the written meta object
 */
async function writeExportMeta({ outDir, blocklet, serverDid, appSk, appDid }) {
  const meta = {
    version: EXPORT_META_VERSION,
    exportedAt: new Date().toISOString(),
    sourceServerDid: serverDid,
    blockletDid: blocklet.meta.did,
    blockletName: blocklet.meta.name,
    blockletTitle: blocklet.meta.title,
    blockletVersion: blocklet.meta.version,
    structVersion: blocklet.structVersion,
    appSk,
    appDid,
  };

  await outputJson(join(outDir, EXPORT_META_FILENAME), meta, { spaces: 2 });
  return meta;
}

module.exports = { writeExportMeta, EXPORT_META_VERSION, EXPORT_META_FILENAME };
