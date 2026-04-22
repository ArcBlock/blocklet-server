import path from 'path';
import pick from 'lodash/pick';
import { BlockletStatus, BlockletGroup, APP_CONFIG_PUBLIC_DIR, COMPONENT_ENV_FILE_NAME } from '@blocklet/constant';
import { parseEnvFile } from '../util/parse-env-file';
import type { TComponent } from '../config';

type Resource = {
  title: string;
  did: string;
  version: string;
  status?: number;
  path?: string;
  env?: Record<string, any>;
};

function getResources(
  {
    scope,
    components: allComponents,
    types,
    skipRunningCheck,
    ignorePublic,
  }: {
    scope?: 'all' | 'pack' | 'excludePack';
    components: TComponent[];
    types?: { did: string; type: string }[];
    skipRunningCheck?: boolean;
    ignorePublic?: boolean;
  } = {
    scope: 'all',
    components: [],
  }
): Resource[] {
  const list: Resource[] = [];

  if (!types?.length) {
    return list;
  }

  const appDataDir = process.env.BLOCKLET_APP_DATA_DIR;

  let components = allComponents;
  if (scope === 'pack') {
    components = allComponents.filter((x) => x.group === BlockletGroup.pack);
  } else if (scope === 'excludePack') {
    components = allComponents.filter((x) => x.group !== BlockletGroup.pack);
  }

  components
    // auto skip running check for pack component
    .filter((x) => scope === 'pack' || skipRunningCheck || x.status === BlockletStatus.running)
    .forEach((component) => {
      const resources = component.resourcesV2 || [].filter((x) => ignorePublic || x.public);

      const filteredResources = resources.filter((x) => {
        const [resourceDid, resourceType] = x.path.split('/').slice(-2);
        return types.some((item) => item?.did === resourceDid && item?.type === resourceType);
      });

      filteredResources.forEach((resource) => {
        if (resource?.path) {
          const item: Resource = {
            ...pick(component, ['title', 'did', 'version', 'status']),
            path: resource.path,
          };

          // import env from public env file
          try {
            const envFile = path.join(appDataDir, APP_CONFIG_PUBLIC_DIR, component.did, COMPONENT_ENV_FILE_NAME);
            const env = parseEnvFile(envFile);
            item.env = env;
          } catch (err) {
            if (process.env.NODE_ENV !== 'test') {
              console.error(err);
            }
          }

          list.push(item);
        }
      });
    });

  return list;
}

export { getResources };
export { Resource };

export default {
  getResources,
};
