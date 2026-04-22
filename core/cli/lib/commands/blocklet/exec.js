const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const runScript = require('@abtnode/util/lib/run-script');
const { parse: getBlockletMeta } = require('@blocklet/meta/lib/parse');
const { getSafeEnv } = require('@abtnode/core/lib/util');
const { isValid: isValidDid, toAddress } = require('@arcblock/did');
const { getRuntimeEnvironments } = require('@abtnode/core/lib/util/blocklet');

const { printError, printInfo, printWarning, printSuccess, getCLIBinaryName } = require('../../util');
const { getNode } = require('../../node');
const { checkRunning } = require('../../manager');
const ensureBlockletEnv = require('../../util/blocklet/env');

const checkNodeRunning = async () => {
  const isRunning = await checkRunning();
  if (!isRunning) {
    const startCommand = chalk.cyan(`${getCLIBinaryName()} server start`);
    printError('Blocklet Server is not running, can not execute anything!');
    printInfo(`To start Blocklet Server, use ${startCommand}`);
    process.exit(1);
  }
};

const run = async (script, { appId: inputAppId, timeout } = {}) => {
  try {
    await checkNodeRunning();
    const timeoutMs = (+timeout || 30 * 60) * 1000;
    const appDir = process.cwd();
    let appId = inputAppId;
    let componentDid = null;

    if (!appId && process.env.BLOCKLET_DEV_APP_DID) {
      printWarning(`Use ${chalk.cyan('--app-id')} from env: ${chalk.cyan(process.env.BLOCKLET_DEV_APP_DID)}`);
      appId = process.env.BLOCKLET_DEV_APP_DID;
    }

    // Validate appId
    if (appId) {
      if (isValidDid(appId) === false) {
        printError(`${chalk.yellow('--app-id')} is not valid: ${appId}`);
        process.exit(1);
      }
    } else {
      printError(`${chalk.yellow('--app-id')} is not provided`);
      process.exit(1);
    }

    printInfo(`Try to run script for blocklet(${chalk.yellow(appId)}) (timeout: ${timeoutMs}ms)`);

    // Check that the script file exists
    const scriptPath = path.join(appDir, script);
    if (fs.existsSync(scriptPath) === false) {
      printError(`Script ${chalk.cyan(scriptPath)} does not exist`);
      process.exit(1);
    }

    try {
      // Try to read meta information from blocklet.yml
      if (fs.existsSync(path.join(appDir, 'blocklet.yml'))) {
        const meta = getBlockletMeta(appDir, { fix: false });
        componentDid = meta?.did;
      }
    } catch (err) {
      // ignore
    }
    const { node } = await getNode();
    const rootDid = toAddress(appId);

    node.onReady(async () => {
      try {
        let blocklet = await node.getBlocklet({ did: rootDid });
        let component;

        if (!blocklet) {
          printError(`Blocklet ${rootDid} not found, you should install the blocklet first.`);
          process.exit(1);
        }

        if (componentDid) {
          component = blocklet.children.find((x) => x.meta.did === componentDid);
          if (!component) {
            printError(
              `Component ${chalk.yellow(componentDid)} not found in ${chalk.yellow(blocklet.meta.name)}, you should add the component to the blocklet first`
            );
            process.exit(1);
          }
        }
        // ensure environments
        await ensureBlockletEnv(node, blocklet, appDir);

        blocklet = await node.getBlocklet({ did: rootDid });
        const nodeEnvironments = await node.states.node.getEnvironments();

        // If componentDid is present, run the script for that component
        if (componentDid) {
          component = blocklet.children.find((x) => x.meta.did === componentDid);

          await runScript(`node ${scriptPath}`, component.env.processId, {
            cwd: appDir,
            env: getSafeEnv(getRuntimeEnvironments(component, nodeEnvironments, [blocklet])),
            silent: false,
            timeout: timeoutMs,
          });
        } else {
          await runScript(`node ${scriptPath}`, blocklet.env.processId, {
            cwd: appDir,
            env: getSafeEnv(getRuntimeEnvironments(blocklet, nodeEnvironments)),
            silent: false,
            timeout: timeoutMs,
          });
        }
        printSuccess('Done!');
        process.exit(0);
      } catch (err) {
        printError(err.message);
        process.exit(1);
      }
    });
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }
};

exports.run = run;
