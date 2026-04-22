import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import camelCase from 'lodash/camelCase';
import cloneDeep from 'lodash/cloneDeep';
import Debug from 'debug';
import { BLOCKLET_META_FILE, BLOCKLET_META_FILE_ALT } from '@blocklet/constant';
import { createBlockletSchema } from './schema';
import { fixRequired, fixRepository, fixFiles, fixPerson, fixKeywords, fixTags, fixService, fixName } from './fix';
import { TBlockletMeta, TComponent } from './types';

const debug = Debug('@blocklet/meta:parse');

const isSourceFromStore = (source): boolean => 'name' in source || 'did' in source;

/**
 * Get blocklet meta from blocklet.yml
 * @param {string} dir blocklet directory
 * @param {object} options.extraRawAttrs extra attributes, will be used as base attributes
 * @param {boolean} options.ensureDist should we verify that dist exists
 * @param {boolean} options.ensureFiles should we verify that logo and files exists
 */
const parse = (
  dir: string,
  {
    ensureFiles = false,
    ensureDist = false,
    ensureComponentStore = true,
    extraRawAttrs = {},
    schemaOptions = {},
    defaultStoreUrl,
    fix = true,
  }: {
    ensureFiles?: boolean;
    ensureDist?: boolean;
    ensureComponentStore?: boolean;
    extraRawAttrs?: any;
    schemaOptions?: any;
    enableDefaults?: boolean;
    extraAttrSpec?: any;
    defaultStoreUrl?: string | ((component: TComponent) => string);
    fix?: boolean;
  } = {}
): TBlockletMeta => {
  let result: TBlockletMeta;
  const blockletMetaFile = path.join(dir, BLOCKLET_META_FILE);
  const blockletMetaFileAlt = path.join(dir, BLOCKLET_META_FILE_ALT);
  if (fs.existsSync(blockletMetaFile)) {
    try {
      result = yaml.load(fs.readFileSync(blockletMetaFile).toString(), { json: true }) as TBlockletMeta;
      debug(`parse ${blockletMetaFile}`, result);
    } catch (err) {
      console.error(`parse_blocklet_meta from ${BLOCKLET_META_FILE} failed`, err);
    }
  } else if (fs.existsSync(blockletMetaFileAlt)) {
    try {
      result = Object.assign(
        {},
        yaml.load(fs.readFileSync(blockletMetaFileAlt).toString(), { json: true })
      ) as TBlockletMeta;
      debug(`parse ${blockletMetaFileAlt}`, result);
    } catch (err) {
      console.error(`parse_blocklet_meta from ${BLOCKLET_META_FILE_ALT} failed`, err);
    }
  } else {
    throw new Error(`no ${BLOCKLET_META_FILE} or ${BLOCKLET_META_FILE_ALT} found`);
  }

  // User Can override with extra meta attrs: useful for registry
  if (extraRawAttrs) {
    result = Object.assign(result, extraRawAttrs);
  }
  if (!fix) {
    // @ts-ignore
    return result;
  }

  // Fix
  fixRequired(result, dir);
  fixRepository(result);
  fixFiles(result);
  fixKeywords(result);
  fixTags(result);
  fixName(result);
  fixPerson(result);
  fixService(result);
  ['components'].forEach((prop) => {
    if (defaultStoreUrl && result[prop]?.length) {
      result[prop].forEach((x) => {
        if (isSourceFromStore(x.source)) {
          if (!x.source.store) {
            x.source.store = typeof defaultStoreUrl === 'function' ? defaultStoreUrl(cloneDeep(x)) : defaultStoreUrl;
          }
        }
      });
    }
  });

  // Ensure camelCase
  result = Object.keys(result).reduce((acc, k) => {
    acc[camelCase(k)] = result[k];
    return acc;
  }, {}) as TBlockletMeta;
  debug('fix', result);

  // Validate and cleanup
  const schema = createBlockletSchema(dir, {
    ensureFiles,
    ensureDist,
    ensureComponentStore,
    ...schemaOptions,
  });

  const { value, error } = schema.validate(result);
  if (error) {
    throw new Error(
      `Invalid blocklet.yml:\n${error.details
        .map((x) => {
          try {
            // Customize error message display for navigation validation failures
            if (x.type === 'array.unique' && x.path[0] === 'navigation') {
              return `${x.message}: ${x.context.value.id}`;
            }
          } catch {
            //
          }
          return x.message;
        })
        .join('\n')}`
    );
  }
  return value;
};
export { parse };
