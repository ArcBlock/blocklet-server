const { joinURL, withQuery } = require('ufo');
const pick = require('lodash/pick');
const isBase64 = require('is-base64');
const semver = require('semver');
const { BLOCKLET_STORE_API_PREFIX, BLOCKLET_STORE_META_PATH, BLOCKLET_STORE_DID } = require('@abtnode/constant');
const { validateMeta, fixAndValidateService } = require('@blocklet/meta/lib/validate');
const { verifyMultiSig } = require('@blocklet/meta/lib/verify-multi-sig');
const isRequirementsSatisfied = require('./requirement');

const { name } = require('../../package.json');
const logger = require('@abtnode/logger')(`${name}:util:registry`); // eslint-disable-line

const request = require('./request');

const fixAndVerifyMetaFromStore = async (meta) => {
  const sanitized = validateMeta(meta, { ensureDist: false, schemaOptions: { noDefaults: true, stripUnknown: true } });

  isRequirementsSatisfied(meta.requirements);

  if (meta.children) {
    sanitized.children = meta.children;
    delete sanitized.components;
  }

  if (meta.navigation) {
    meta.navigation.forEach((nav, index) => {
      if (nav.child) {
        sanitized.navigation[index].child = nav.child;
        delete sanitized.navigation[index].component;
      }
    });
  }

  try {
    const result = await verifyMultiSig(sanitized);
    if (!result) {
      throw new Error('invalid signature from developer or store');
    }
  } catch (err) {
    throw new Error(`Invalid blocklet meta: ${err.message}`);
  }

  // this step comes last because it has side effects: the meta is changed
  return fixAndValidateService(meta);
};

// Note: registry should contain the store endpoint
const getStoreMeta = async (registry) => {
  try {
    const url = withQuery(joinURL(registry, BLOCKLET_STORE_META_PATH), { t: Date.now() });
    const { data } = await request.get(url);
    if (!data) {
      return {};
    }

    const requiredFields = ['name', 'description'];
    const missingFields = requiredFields.filter((x) => !data[x]);
    if (missingFields.length > 0) {
      throw new Error(`the store missing required information: ${missingFields.join(', ')}`);
    }

    const result = pick(data, ['id', 'name', 'description', 'cdnUrl', 'chainHost']);
    const { logoUrl } = data;
    if (logoUrl) {
      if (logoUrl.startsWith('http') === true) {
        result.logoUrl = logoUrl;
      } else if (isBase64(logoUrl, { allowMime: true })) {
        result.logoUrl = logoUrl;
      } else {
        result.logoUrl = joinURL(registry, logoUrl);
      }
    }

    return result;
  } catch (err) {
    logger.error('Failed to getStoreMeta', err);
    throw new Error(`Can not get meta info for store [${registry}]: ${err.message}`);
  }
};

async function getStoreUrl(url) {
  const { origin } = new URL(url);
  let mountPoint = '';
  try {
    const { data: meta } = await request.get(joinURL(origin, '__blocklet__.js?type=json&nocache=1'));
    const component = meta.componentMountPoints?.find((item) => item.did === BLOCKLET_STORE_DID);
    if (component) {
      mountPoint = component.mountPoint;
    }
  } catch (err) {
    logger.error('Failed to getStoreUrl', err);
  }

  return joinURL(origin, mountPoint);
}

async function getStoreInfo(url) {
  const { pathname } = new URL(url);

  // 匹配
  // 1. /api/blocklets/${did}/blocklet.json
  // 2. /api/blocklets/${did}/${version}/blocklet.json
  const match = pathname.match(/\/api\/blocklets\/(\w*)(?:\/([^/]+))?\/blocklet\.json$/);
  if (match) {
    try {
      const version = match[2];
      if (version && !semver.valid(version)) {
        throw new Error(`Invalid version: ${version}`);
      }
      const registryUrl = await getStoreUrl(url);
      const meta = await getStoreMeta(registryUrl);
      if (meta && meta.id) {
        return {
          inStore: true,
          registryUrl,
          blockletDid: match[1],
          registryMeta: meta,
        };
      }
    } catch (err) {
      logger.error('Failed to getStoreInfo', err);
    }
  }

  return {
    inStore: false,
  };
}

const resolveTarballURL = ({ did, tarball = '', storeUrl = '' }) => {
  if (!tarball) {
    return '';
  }

  if (tarball.startsWith('file://')) {
    return decodeURIComponent(tarball);
  }

  if (tarball.startsWith('http://') || tarball.startsWith('https://')) {
    return tarball;
  }

  if (!storeUrl) {
    return '';
  }

  if (!did) {
    return '';
  }

  return joinURL(storeUrl, 'api', 'blocklets', did, tarball);
};

const getBlockletMetaUrl = ({ did, storeUrl }) =>
  joinURL(storeUrl, BLOCKLET_STORE_API_PREFIX, `/blocklets/${did}/blocklet.json`);

const getBlockletMeta = async ({ did, storeUrl }) => {
  const url = joinURL(storeUrl, BLOCKLET_STORE_API_PREFIX, `/blocklets/${did}/blocklet.json?__t__=${Date.now()}`);

  const { data } = await request.get(url);
  try {
    if (data.did !== did) {
      throw new Error('Invalid blocklet meta: did does not match');
    }

    const meta = await fixAndVerifyMetaFromStore(data);

    meta.dist.tarball = await resolveTarballURL({
      did,
      tarball: meta.dist.tarball,
      storeUrl,
    });

    return meta;
  } catch (err) {
    logger.error('failed to get blocklet meta', { did, data, error: err });
    throw err;
  }
};

module.exports = {
  getStoreMeta,
  getStoreInfo,
  getStoreUrl,
  getBlockletMeta,
  resolveTarballURL,
  getBlockletMetaUrl,
  fixAndVerifyMetaFromStore,
};
