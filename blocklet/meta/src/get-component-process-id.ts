import crypto from 'crypto';
import { TBlockletMeta } from './types';

const md5 = (str: string) => crypto.createHash('md5').update(str).digest('hex');

const getComponentProcessId = (component: { meta: TBlockletMeta }, ancestors: any[] = []): string => {
  const realName = component.meta.name;
  const name = !ancestors.length
    ? realName
    : `${ancestors.map((x) => encodeURIComponent(x.meta.name)).join('/')}/${encodeURIComponent(realName)}`;

  if (name.length < 240) {
    return name;
  }
  return md5(name);
};

export { getComponentProcessId };
