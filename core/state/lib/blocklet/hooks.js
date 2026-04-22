const get = require('lodash/get');
const camelCase = require('lodash/camelCase');
const runScript = require('@abtnode/util/lib/run-script');
const { getSecurityNodeOptions } = require('@abtnode/util/lib/security');
// eslint-disable-next-line global-require
const logger = require('@abtnode/logger')(`${require('../../package.json').name}:blocklet:hooks`);

const { getSafeEnv } = require('../util');
const states = require('../states');

const runUserHook = async (label, hookName, args) => {
  const {
    appDir,
    hooks,
    env,
    exitOnError = true,
    silent = false,
    notification,
    did,
    timeout,
    output: outputFile,
    error: errorFile,
    teamManager,
  } = args;
  const hook = get(hooks, `[${hookName}]`) || get(hooks, `[${camelCase(hookName)}]`);

  try {
    if (!hook) {
      return;
    }

    logger.info(`run hook:${hookName}:`, { label, hook });

    const nodeInfo = await states.node.read();
    await runScript(hook, [label, hookName].join(':'), {
      cwd: appDir,
      env: {
        ...getSafeEnv(env),
        BLOCKLET_HOOK_NAME: hookName,
        NODE_OPTIONS: await getSecurityNodeOptions(
          { environmentObj: env, ...args },
          nodeInfo.enableFileSystemIsolation
        ),
      },
      silent,
      timeout,
      output: outputFile,
      error: errorFile,
    });
  } catch (error) {
    logger.error(`run ${hook} error:`, { label, error });

    if (notification) {
      teamManager.createNotification({
        title: `Run '${hook}' failed, check the description for more detailed error information`,
        description: error.message,
        entityType: 'blocklet',
        entityId: did,
        severity: 'error',
      });
    }

    if (exitOnError) {
      throw new Error(`Run [${label} - ${hookName}] failed: ${error.message}`);
    }
  }
};

const preInstall = (label, ...args) => runUserHook(label, 'pre-install', ...args);
const postInstall = (label, ...args) => runUserHook(label, 'post-install', ...args);
const preConfig = (label, ...args) => runUserHook(label, 'pre-config', ...args);
const preFlight = (label, ...args) => runUserHook(get(label, 'meta.title') || label, 'pre-flight', ...args);
const preStart = (blocklet, options) => {
  // check required environments
  let environments = get(blocklet, 'meta.environments', []);
  if (!Array.isArray(environments)) {
    environments = [environments];
  }

  const tmp = environments.filter((e) => e.required && options.env[e.name] === undefined).map((e) => e.name);
  if (tmp.length > 0) {
    throw new Error(`Required environments is not set: ${tmp.join(',')}`);
  }

  return runUserHook(blocklet.meta.title, 'pre-start', options);
};

const postStart = (blocklet, ...args) => runUserHook(blocklet.meta.title, 'post-start', ...args);
const preUninstall = (label, ...args) => runUserHook(label, 'pre-uninstall', ...args);
const preStop = (label, ...args) => runUserHook(label, 'pre-stop', ...args);

module.exports = { preInstall, postInstall, preFlight, preStart, postStart, preUninstall, preStop, preConfig };
