import fs from 'fs';
import path from 'path';
import os from 'os';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { BLOCKLET_BUNDLE_FOLDER, BlockletGroup } from '@blocklet/constant';
import { TBlockletMeta } from './types';

const validateBlockletEntry = (dir: string, meta: TBlockletMeta): void => {
  const { main, group } = meta;

  if (!main) {
    return;
  }

  if (group === BlockletGroup.dapp) {
    // backward compatible
    if (
      !fs.existsSync(path.join(dir, 'blocklet.js')) &&
      !fs.existsSync(path.join(dir, BLOCKLET_BUNDLE_FOLDER, 'blocklet.js'))
    ) {
      // backward compatible
      if (isEmpty(meta.engine)) {
        throw new Error(`${meta.bundleName} may be corrupted or not properly bundled: missing blocklet.js`);
      }
      const engine = get(meta, 'engine', null);

      if (engine) {
        if (!Array.isArray(engine)) {
          if (!engine.interpreter) {
            throw new Error(
              `${meta.bundleName} may be corrupted or not properly configured: missing engine.interpreter`
            );
          }
          return;
        }
        engine.forEach((r) => {
          ['interpreter', 'platform'].forEach((k) => {
            if (!get(r, k, null)) {
              throw new Error(`${meta.bundleName} may be corrupted or not properly configured: missing engine.${k}`);
            }
          });
        });
        const platform = os.platform();

        if (!engine.find((r) => r.platform === platform)) {
          throw new Error(
            `${meta.bundleName} may be corrupted or not properly configured: no engine run on ${platform}`
          );
        }
      }
    }
  }

  if (group === BlockletGroup.static) {
    if (!fs.existsSync(path.join(dir, main))) {
      throw new Error(`${meta.bundleName} may be corrupted or not properly configured: missing main folder`);
    }
  }
};

export { validateBlockletEntry };
