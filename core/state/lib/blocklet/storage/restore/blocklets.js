const { existsSync, remove, ensureDirSync } = require('fs-extra');
const { join } = require('path');
const fg = require('fast-glob');
const { BaseRestore } = require('./base');
const { zipToDir } = require('../utils/zip');

class BlockletsRestore extends BaseRestore {
  filename = 'blocklets';

  async import() {
    const blockletsDir = join(this.restoreDir, this.filename);

    if (!existsSync(blockletsDir)) {
      ensureDirSync(blockletsDir);
      return;
    }

    const paths = await fg('**/*.zip', {
      cwd: blockletsDir,
      onlyFiles: true,
      absolute: true,
    });

    const configs = paths.map((path) => {
      return {
        source: path,
        target: path.replace(/.zip$/, ''),
      };
    });

    await Promise.all(
      configs.map(async ({ source, target }) => {
        if (!existsSync(target)) {
          ensureDirSync(target);
        }
        await zipToDir(source, target);
        await remove(source);
      })
    );
  }
}

module.exports = { BlockletsRestore };
