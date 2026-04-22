import type { Blocklet } from '.';

declare module '@abtnode/constant' {
  export const WELLKNOWN_SERVICE_PATH_PREFIX: string;
  export const SESSION_TOKEN_STORAGE_KEY: string;
  export const REFRESH_TOKEN_STORAGE_KEY: string;
}

declare global {
  interface Window {
    blocklet: Blocklet;
    env?: ServerEnv;
  }
}
