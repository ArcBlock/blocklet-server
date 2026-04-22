const path = require('path');
const chalk = require('chalk');
const { formatError } = require('@blocklet/error');
const { parse: parseBlockletMeta } = require('@blocklet/meta/lib/parse');
const { hasReservedKey } = require('@blocklet/meta/lib/has-reserved-key');
const zipBundle = require('./zip');
const simpleBundle = require('./simple');
const compactBundle = require('./compact');
const {
  printError,
  printInfo,
  printSuccess,
  wrapDefaultStoreUrl,
  checkEntryFileForStaticBlocklet,
} = require('../../../util');
const { checkCircularDependencies } = require('../../../util/blocklet/meta');

const getMode = (meta, { useZip, useSimple, useCompact } = {}) => {
  if (useCompact) {
    return 'compact';
  }

  if (useSimple) {
    return 'simple';
  }

  let mode = 'simple';
  if (meta.group === 'static' || useZip) {
    mode = 'zip';
  }

  if (meta.group === 'gateway') {
    mode = 'simple';
  }

  if (!meta.group) {
    mode = 'zip';
  }

  return mode;
};

exports.getMode = getMode;

exports.run = async ({
  zip: useZip = false,
  simple: useSimple = false,
  changelog: withChangeLog = true,
  createRelease = false,
  createArchive = false,
  monorepo: inMonoRepo = false,
  compact: useCompact = false,
  sourceMap = false,
  nosourcesSourceMap = false,
  external = [],
  externalManager = 'npm',
  storeUrl,
  minify = true,
  dependenciesDepth = 9,
}) => {
  const defaultStoreUrl = storeUrl || process.env.COMPONENT_STORE_URL;
  const blockletDir = process.cwd();
  let meta = {};

  try {
    meta = parseBlockletMeta(blockletDir, {
      ensureFiles: true,
      schemaOptions: {
        stripUnknown: false,
      },
      defaultStoreUrl: defaultStoreUrl ? wrapDefaultStoreUrl(defaultStoreUrl) : null,
    });
    printSuccess(`Parsing blocklet meta from: ${chalk.cyan(blockletDir)}`);
  } catch (err) {
    if (process.env.DEBUG) {
      console.error(err);
    }
    printError(`Blocklet bundle failed from ${chalk.cyan(blockletDir)}`);
    printError(`Abort due to error: ${chalk.red(formatError(err))}`);
    printInfo(`Please check your ${chalk.cyan(path.join(blockletDir, 'blocklet.yml'))}`);
    printInfo(`See ${chalk.cyan('https://developer.blocklet.io/docs/reference/blocklet-spec')}`);
    process.exit(1);
  }

  if (hasReservedKey(meta.environments)) {
    printError('Blocklet key of environments can not start with `ABT_NODE_` or `BLOCKLET_`');
    process.exit(1);
  }

  if (meta.group === 'static') {
    try {
      checkEntryFileForStaticBlocklet(meta, blockletDir);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  }

  // Try parse components to avoid circular dependencies
  await checkCircularDependencies(meta);

  const mode = getMode(meta, { useZip, useSimple, useCompact });

  printInfo(`Bundling in ${chalk.cyan(mode)} mode for blocklet ${chalk.cyan(meta.name)}...`);

  let externals = [];
  if (external) {
    externals = Array.isArray(external) ? external : [external];
    externals = externals.reduce((acc, cur) => {
      if (cur.indexOf(',') > -1) {
        acc.push(...cur.split(','));
      } else {
        acc.push(cur);
      }
      return acc;
    }, []);
  }

  if (mode === 'compact') {
    await compactBundle.run({
      meta,
      blockletDir,
      createRelease,
      createArchive,
      inMonoRepo,
      withChangeLog,
      sourceMap,
      nosourcesSourceMap,
      externals,
      externalManager,
      minify,
      dependenciesDepth,
    });
  } else if (mode === 'zip') {
    await zipBundle.run({
      meta,
      blockletDir,
      createRelease,
      createArchive,
      inMonoRepo,
      withChangeLog,
      externals,
      externalManager,
    });
  } else if (mode === 'simple') {
    await simpleBundle.run({
      meta,
      blockletDir,
      createRelease,
      inMonoRepo,
      withChangeLog,
      externals,
      externalManager,
      createArchive,
    });
  } else {
    // should not reach here
    printError(`Unsupported bundle mode ${mode}`);
    process.exit(1);
  }
};
