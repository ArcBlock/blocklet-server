import { BLOCKLET_PREFERENCE_PREFIX, SUPPORTED_LANGUAGES } from '@blocklet/constant';

export function getBlockletLanguages(langs: string = 'en,zh'): Array<{ code: string; name: string }> {
  const languages = (langs || 'en')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => !!SUPPORTED_LANGUAGES[x]);

  return languages.map((x) => ({ code: x, name: SUPPORTED_LANGUAGES[x].nativeName }));
}

export function getBlockletPreferences(env: Record<string, string>): Record<string, any> {
  return Object.keys(env)
    .filter((x) => x.startsWith(BLOCKLET_PREFERENCE_PREFIX))
    .reduce((acc, x) => {
      const key = x.replace(BLOCKLET_PREFERENCE_PREFIX, '');
      try {
        acc[key] = JSON.parse(env[x]);
      } catch {
        acc[key] = env[x];
      }
      return acc;
    }, {});
}

// eslint-disable-next-line import/prefer-default-export
export function parseEnv(env: Record<string, string> = process.env) {
  return Object.freeze({
    appId: env.BLOCKLET_APP_ID,
    appPid: env.BLOCKLET_APP_PID,
    appIds: (env.BLOCKLET_APP_IDS || '').split(',').filter(Boolean),
    appName: env.BLOCKLET_APP_NAME,
    appNameSlug: env.BLOCKLET_APP_NAME_SLUG,
    appDescription: env.BLOCKLET_APP_DESCRIPTION,
    appUrl: env.BLOCKLET_APP_URL,
    isComponent: env.BLOCKLET_DID !== env.BLOCKLET_REAL_DID,
    dataDir: env.BLOCKLET_DATA_DIR,
    cacheDir: env.BLOCKLET_CACHE_DIR,
    mode: env.BLOCKLET_MODE,
    tenantMode: env.BLOCKLET_APP_TENANT_MODE,
    appStorageEndpoint: env.BLOCKLET_APP_SPACE_ENDPOINT,
    serverVersion: env.ABT_NODE_VERSION || env.ABT_NODE,
    languages: getBlockletLanguages(env.BLOCKLET_APP_LANGUAGES),
    preferences: getBlockletPreferences(env),
    componentDid: env.BLOCKLET_COMPONENT_DID,
  });
}
