import fs from 'fs-extra';
import { isPreferenceKey } from '@blocklet/meta/lib/util';
import { getBlockletPreferences } from '@blocklet/env/lib/util';
import { decrypt } from '../security';

const parseEnvFile = (
  envFile: string,
  { apiKey, componentDid }: { apiKey?: string; componentDid?: string } = {}
): Record<string, any> => {
  if (!fs.existsSync(envFile)) {
    return {};
  }

  const raw = fs.readFileSync(envFile).toString();
  const decrypted = apiKey ? decrypt(raw, apiKey, componentDid) : raw;
  const configObj = JSON.parse(decrypted);

  const env: Record<string, any> = Object.keys(configObj)
    .filter((key) => !isPreferenceKey({ key }))
    .reduce((o, key) => {
      o[key] = configObj[key];
      return o;
    }, {});

  env.preferences = getBlockletPreferences(configObj);

  return env;
};

export { parseEnvFile };

export default { parseEnvFile };
