import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import { TEnvironment } from './types';

const hasReservedKey = (environments: TEnvironment[]): boolean =>
  (environments || []).some((x) => {
    // @ts-ignore
    const key = (x.key || x.name || '').toString();

    if (key.startsWith('ABT_NODE_')) {
      return true;
    }
    return !!(key.startsWith('BLOCKLET_') && !BLOCKLET_CONFIGURABLE_KEY[key]);
  });

export { hasReservedKey };
