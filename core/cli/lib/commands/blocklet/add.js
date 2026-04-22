const chalk = require('chalk');
const { joinURL } = require('ufo');
const { parse: getBlockletMeta } = require('@blocklet/meta/lib/parse');
const { toBlockletDid } = require('@blocklet/meta/lib/did');
const { select: getMetaFile, update: updateMetaFile } = require('@blocklet/meta/lib/file');
const { urlPathFriendly } = require('@blocklet/meta/lib/url-path-friendly');
const { BLOCKLET_STORE_API_BLOCKLET_PREFIX, BLOCKLET_STORE_URL } = require('@abtnode/constant');
const { getBlockletMetaFromUrl } = require('@blocklet/meta/lib/util-meta');

const { printSuccess, printError } = require('../../util');
const Config = require('../../util/blocklet/config');
const { fixComponents, checkCircularDependencies } = require('../../util/blocklet/meta');
const debug = require('../../debug')('blocklet:version');

const getMetaUrl = (store, name, version) => {
  return joinURL(
    store,
    BLOCKLET_STORE_API_BLOCKLET_PREFIX,
    toBlockletDid(name),
    !version || version === 'latest' ? '' : version,
    'blocklet.json'
  );
};

// eslint-disable-next-line consistent-return
const getMeta = async (url) => {
  try {
    const meta = await getBlockletMetaFromUrl(url, { logger: console });
    return meta;
  } catch (error) {
    printError(`Failed validate component meta: ${error.message}`);
    process.exit(1);
  }
};

const parseComponent = (text) => {
  if (/^\w+:\/\//.test(text)) {
    return { url: text };
  }

  const match = /(.*)@((latest)|(\d+\.\d+\.\d+))$/.exec(text);
  const name = match ? match[1] : text;
  const version = match ? match[2] : 'latest';

  return {
    name,
    version,
  };
};

const getSource = async (param, opts) => {
  const { url, name, version } = parseComponent(param);
  if (url) {
    const componentMeta = await getMeta(url);
    // bundleName must match the 'name' field in the blocklet's blocklet.yml
    return { source: { url }, bundleName: componentMeta.name, bundleTitle: componentMeta.title || '' };
  }

  const config = new Config({
    configFile: process.env.ABT_NODE_CONFIG_FILE,
    section: opts.profile === 'default' ? '' : opts.profile,
  });

  let store = opts.store || config.get('store') || config.get('registry') || BLOCKLET_STORE_URL;
  if (!/^https?:\/\//.test(store)) {
    store = `https://${store}`;
  }

  const bundleMetaUrl = getMetaUrl(store, name, version);
  const componentMeta = await getMeta(bundleMetaUrl);
  // NOTICE: Installing by blocklet DID is also supported
  if (componentMeta.name !== name && componentMeta.did !== name) {
    printError(`Failed validate component meta: invalid name. Expected ${name}, Got: ${componentMeta.name}`);
    process.exit(1);
  }
  return {
    source: { store, name: componentMeta.name, version },
    bundleName: componentMeta.name,
    bundleTitle: componentMeta.title || '',
  };
};

exports.run = async (param, opts = {}) => {
  try {
    const dir = process.cwd();
    const file = getMetaFile(dir);
    const meta = getBlockletMeta(dir, { fix: false });

    const { source, bundleName, bundleTitle } = await getSource(param, opts);

    fixComponents(meta);

    meta.components = meta.components || [];

    const name = bundleName;

    if (meta.components.some((x) => x.name === name)) {
      printSuccess(`Component ${chalk.cyan(name)} already exists`);
      process.exit(0);
    }

    const component = {
      name,
      title: opts.title || bundleTitle,
      mountPoint: opts.mountPoint || `/${urlPathFriendly(name, { keepSlash: false })}`,
      source,
    };

    debug('component config', component);

    meta.components.push(component);

    await checkCircularDependencies(meta);

    updateMetaFile(file, meta, { fix: false });
    printSuccess(`Component ${chalk.cyan(name)} was successfully added`);

    process.exit(0);
  } catch (error) {
    debug('Failed add blocklet', error);
    printError('Failed add component: ', error.message);
    process.exit(1);
  }
};
