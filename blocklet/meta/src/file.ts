import path from 'path';
import yaml from 'js-yaml';
import fs from 'fs-extra';
import { BLOCKLET_META_FILE, BLOCKLET_META_FILE_ALT } from '@blocklet/constant';
import { TBlockletMeta } from './types';

const list = [BLOCKLET_META_FILE, BLOCKLET_META_FILE_ALT];

const select = (dir: string, { throwOnError = true }: { throwOnError?: boolean } = {}): string => {
  const metaFile = path.join(dir, BLOCKLET_META_FILE);

  const metaFileAlt = path.join(dir, BLOCKLET_META_FILE_ALT);

  if (fs.existsSync(metaFile) === false && fs.existsSync(metaFileAlt) === false) {
    if (throwOnError) {
      throw new Error('blocklet.yml not found, please migrate your blocklet meta by run `abtnode blocklet:migrate`');
    }
    return '';
  }
  const metaToUpdate = fs.existsSync(metaFile) ? metaFile : fs.existsSync(metaFileAlt) ? metaFileAlt : null; // eslint-disable-line

  return metaToUpdate;
};

const update = (file: string, meta: TBlockletMeta, { fix = true }: { fix?: boolean } = {}): void => {
  if (!fix) {
    fs.writeFileSync(file, yaml.dump(meta, { sortKeys: false, skipInvalid: true }));
    return;
  }
  delete meta.path;
  // @ts-ignore
  delete meta.folder;
  delete meta.htmlAst;
  delete meta.stats;
  delete meta.nftFactory;
  delete meta.signatures;
  delete meta.lastPublishedAt;
  if (!meta.specVersion) {
    meta.specVersion = '1.0.0';
  }
  fs.writeFileSync(file, yaml.dump(meta, { sortKeys: false, skipInvalid: true }));
};

const read = (file: string) => {
  const fileContent = fs.readFileSync(file, 'utf8').toString();
  return yaml.load(fileContent);
};

export { list };
export { read };
export { select };
export { update };
export default {
  list,
  read,
  select,
  update,
};
