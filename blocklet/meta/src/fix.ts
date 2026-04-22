import get from 'lodash/get';
import * as gitInfo from 'hosted-git-info';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BlockletMeta } from '@blocklet/server-js';
import {
  BLOCKLET_DEFAULT_VERSION,
  BLOCKLET_DEFAULT_PORT_NAME,
  BLOCKLET_DYNAMIC_PATH_PREFIX,
  BLOCKLET_INTERFACE_TYPE_WEB,
  BLOCKLET_INTERFACE_PUBLIC,
} from '@blocklet/constant';
import { fixAndValidateService } from './validate';
import { validateNewDid } from './name';

// Assign sensible defaults: description/main/group/version/public_url
const fixRequired = (data: any, dir: string): void => {
  if (!data.description) {
    data.description = `Blocklet from ${dir}`;
  }
  if (!data.version) {
    data.version = BLOCKLET_DEFAULT_VERSION;
  }
};

const fixRepository = (data: any): void => {
  if (!data.repository) return;
  if (typeof data.repository === 'string') {
    data.repository = {
      type: 'git',
      url: data.repository,
    };
  }
  if (data.repository.url) {
    const info = gitInfo.fromUrl(data.repository.url);

    if (info) {
      data.repository.url = info.getDefaultRepresentation() === 'shortcut' ? info.https() : info.toString();
    }
  }
};

const fixFiles = (data: any): void => {
  if (!Array.isArray(data.files)) {
    delete data.files;
  } else if (data.files) {
    data.files = data.files.filter((file) => {
      return !(!file || typeof file !== 'string');
    });
  }
};

const fixKeywords = (data: any): void => {
  if (typeof data.keywords === 'string') {
    data.keywords = data.keywords.split(/,\s+/);
  }
  if (data.keywords && !Array.isArray(data.keywords)) {
    delete data.keywords;
  } else if (data.keywords) {
    data.keywords = data.keywords.filter((kw) => {
      return !(typeof kw !== 'string' || !kw);
    });
  }
};

const fixTags = (data: any): void => {
  if (typeof data.tags === 'string') {
    data.tags = data.tags.split(/,\s+/);
  }
  if (data.tags && !Array.isArray(data.tags)) {
    delete data.tags;
  } else if (data.tags) {
    data.tags = data.tags.filter((t) => {
      return !(typeof t !== 'string' || !t);
    });
  }
};

const updatePerson = (data: BlockletMeta, fn: Function): BlockletMeta => {
  if (data.author) data.author = fn(data.author);
  ['maintainers', 'contributors'].forEach((key) => {
    if (!Array.isArray(data[key])) {
      return;
    }
    data[key] = data[key].map(fn as (value: any, index: number, array: any[]) => unknown);
  });
  return data;
};

const formatPerson = (person: string | Record<string, unknown>): string => {
  if (!person) {
    return '';
  }
  if (typeof person === 'string') {
    return person;
  }
  const name = person.name || '';
  const u = person.url || person.web;
  const url = u ? ` (${u})` : '';
  const e = person.email || person.mail;
  const email = e ? ` <${e}>` : '';
  return name + email + url;
};

const parsePerson = (person: string): any => {
  if (typeof person !== 'string') {
    return person;
  }
  const name = person.match(/^([^(<]+)/);

  const url = person.match(/\(([^)]+)\)/);

  const email = person.match(/<([^>]+)>/);

  const obj = {};

  if (name && name[0].trim()) (obj as any).name = name[0].trim();
  if (email) {
    [, (obj as any).email] = email;
  }
  if (url) {
    [, (obj as any).url] = url;
  }
  return obj;
};

const fixPerson = (data: any): any => {
  updatePerson(data, formatPerson);
  updatePerson(data, parsePerson);
  return data;
};

const fixInterfaces = (meta: any, removeMerged: boolean = true): any => {
  if (!Array.isArray(meta.interfaces)) {
    meta.interfaces = [];
  }
  if (meta.interfaces.length) {
    // Web interfaces should always use http protocol
    meta.interfaces.forEach((x) => {
      if (x.type === BLOCKLET_INTERFACE_TYPE_WEB) {
        x.protocol = 'http';
      }
    });
    return meta;
  }
  const supportDynamicPathPrefix = get(meta, 'capabilities.dynamicPathPrefix', true);

  const prefix = supportDynamicPathPrefix ? BLOCKLET_DYNAMIC_PATH_PREFIX : '/';

  const addInterface = ({
    type = 'web',
    name,
    path: _path = '/', // eslint-disable-line no-shadow
    protocol = 'http',
    port = BLOCKLET_DEFAULT_PORT_NAME,
  }: {
    type?: string;
    name?: string;
    path?: string;
    protocol?: string;
    port?: string | { internal: string; external: number };
  }) => {
    meta.interfaces.push({ type, name, path: _path, prefix, port, protocol });
  };

  [BLOCKLET_INTERFACE_PUBLIC].forEach((x) => {
    if (meta[x]) {
      addInterface({ name: x, path: meta[x] });
    }
  });
  if (Array.isArray(meta.exposeServices)) {
    meta.exposeServices.forEach((x) => {
      addInterface({
        type: 'service',
        name: x.protocol,
        protocol: x.protocol,
        port: {
          internal: `BLOCKLET_${x.protocol}_PORT`.toUpperCase(),
          external: x.port,
        },
      });
    });
  }
  if (removeMerged) {
    delete meta.publicUrl;
    delete meta.adminUrl;
    delete meta.configUrl;
    delete meta.docUrl;
    delete meta.exposeServices;
    if (meta.capabilities) {
      delete meta.capabilities.dynamicPathPrefix;
    }
  }
  return meta;
};

const fixName = (meta: any): any => {
  const { did } = meta;
  try {
    validateNewDid(did);
    meta.name = did;
  } catch {
    /* empty */
  }
  return meta;
};

export { fixRequired };
export { fixRepository };
export { fixFiles };
export { fixKeywords };
export { fixPerson };
export { fixTags };
export { fixName };
export { formatPerson };
export { parsePerson };
export { fixInterfaces };
export { fixAndValidateService as fixService };
export default {
  fixRequired,
  fixRepository,
  fixFiles,
  fixKeywords,
  fixPerson,
  fixTags,
  fixName,
  formatPerson,
  parsePerson,
  fixInterfaces,
  fixService: fixAndValidateService,
};
