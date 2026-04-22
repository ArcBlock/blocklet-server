/**
 * Logo Module
 *
 * Functions for blocklet logo generation and management
 */

const fs = require('fs-extra');
const path = require('node:path');

const { isEthereumDid } = require('@arcblock/did');
const { toSvg: createDidLogo } = require('@arcblock/did-motif');
const { createBlockiesSvg } = require('@blocklet/meta/lib/blockies');
const { BlockletSource } = require('@blocklet/constant');

const { getBundleDir } = require('./install-utils');

/**
 * Update blocklet fallback logo with DID-based SVG
 * @param {object} blocklet - Blocklet object with env.dataDir and meta.did
 */
const updateBlockletFallbackLogo = async (blocklet) => {
  if (isEthereumDid(blocklet.meta.did)) {
    await fs.writeFile(path.join(blocklet.env.dataDir, 'logo.svg'), createBlockiesSvg(blocklet.meta.did));
  } else {
    await fs.writeFile(path.join(blocklet.env.dataDir, 'logo.svg'), createDidLogo(blocklet.meta.did));
  }
};

/**
 * Ensure app logo exists by copying from component if needed
 * @param {object} blocklet - Blocklet object
 * @param {string} blockletsDir - Blocklets directory path
 */
const ensureAppLogo = async (blocklet, blockletsDir) => {
  if (!blocklet) {
    return;
  }

  if (
    blocklet.source === BlockletSource.custom &&
    (blocklet.children || [])[0]?.meta?.logo &&
    blocklet.children[0].env.appDir
  ) {
    const fileName = blocklet.children[0].meta.logo;
    const src = path.join(blocklet.children[0].env.appDir, fileName);
    const dist = path.join(getBundleDir(blockletsDir, blocklet.meta), fileName);

    if (fs.existsSync(src)) {
      await fs.copy(src, dist);
    }
  }
};

module.exports = {
  updateBlockletFallbackLogo,
  ensureAppLogo,
};
