require('dotenv-flow').config({ silent: true, node_env: 'development' });

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const open = require('open');
const get = require('lodash/get');
const uniq = require('lodash/uniq');
const { default: axios } = require('axios');
const Jwt = require('@arcblock/jwt');
const { joinURL } = require('ufo');
const debug = require('debug')('@blocklet/cli:dev');
const Client = require('@ocap/client');
const { isValid: isValidDid, toAddress } = require('@arcblock/did');
const { evaluateURLs, isDidDomain } = require('@abtnode/util/lib/url-evaluation');
const isDocker = require('@abtnode/util/lib/is-docker');
const { toBase58, fromBase58, fromUnitToToken } = require('@ocap/util');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { replaceSlotToIp, isInProgress, findComponentByIdV2, isGatewayBlocklet } = require('@blocklet/meta/lib/util');
const { getBlockletMetaFromUrls, getSourceUrlsFromConfig } = require('@blocklet/meta/lib/util-meta');
const { getComponentsInternalInfo } = require('@blocklet/meta/lib/blocklet');
const { parse: getBlockletMeta } = require('@blocklet/meta/lib/parse');
const { hasReservedKey } = require('@blocklet/meta/lib/has-reserved-key');
const { hasMountPoint } = require('@blocklet/meta/lib/engine');
const {
  BLOCKLET_MODES,
  BlockletStatus,
  BlockletEvents,
  BlockletInternalEvents,
  BLOCKLET_CONFIGURABLE_KEY,
} = require('@blocklet/constant');
const {
  PROCESS_NAME_EVENT_HUB,
  WELLKNOWN_PING_PREFIX,
  WELLKNOWN_SERVICE_PATH_PREFIX,
  ROUTING_RULE_TYPES,
} = require('@abtnode/constant');
const getIP = require('@abtnode/util/lib/get-ip');
const sleep = require('@abtnode/util/lib/sleep');
const Lock = require('@abtnode/util/lib/lock');
const { getBaseUrls } = require('@abtnode/core/lib/util');
const codespaces = require('@abtnode/util/lib/codespaces');
const isEmpty = require('lodash/isEmpty');
const pMap = require('p-map');
const getDownloadBundleStep = require('../../util/get-download-bundle-step');

process.env.ABT_NODE_EVENT_PORT = process.env.ABT_NODE_EVENT_PORT || PROCESS_NAME_EVENT_HUB;

const {
  print,
  printError,
  printInfo,
  printWarning,
  printSuccess,
  getCLIBinaryName,
  getDevUrl,
  checkTerminalProxy,
  wrapDefaultStoreUrl,
  printBlockletDevelopmentGuide,
} = require('../../util');
const { getNode: getProdNode } = require('../../node');
const { checkRunning } = require('../../manager');
const { wrapSpinner } = require('../../ui');
const ensureBlockletEnv = require('../../util/blocklet/env');
const { HELP_DOCS_GITHUB_CODESPACES_URL } = require('../../constant');

const lock = new Lock('exit-lock');

const ACTIONS = {
  INSTALL: 'install',
  START: 'start',
  REMOVE: 'remove',
  RESET: 'reset',
  FAUCET: 'faucet',
  STUDIO: 'studio',
};

const checkBlockletMode = (blocklet, { throwOnError } = {}) => {
  if (blocklet.mode === BLOCKLET_MODES.PRODUCTION) {
    if (throwOnError) {
      throw new Error('Cannot develop blocklet which is in production mode');
    }

    printError('The blocklet of production mode already exists, please remove it before developing');
    process.exit(1);
  }

  return false;
};

const isDevelopmentMode = (blocklet = {}) => blocklet.mode === BLOCKLET_MODES.DEVELOPMENT;

const checkNodeRunning = async () => {
  const isRunning = await checkRunning();
  if (!isRunning) {
    const startCommand = chalk.cyan(`${getCLIBinaryName()} server start`);
    printError('Blocklet Server is not running, can not dev anything!');
    printInfo(`To start Blocklet Server, use ${startCommand}`);
    process.exit(1);
  }
};

const getNode = (devNode) => {
  if (devNode) {
    return devNode;
  }

  return getProdNode({ dir: process.cwd() });
};

const getAccessibleUrl = async (urls) => {
  if (!urls || urls.length === 0) {
    return '';
  }

  const ping = async (url) => {
    try {
      // FIXME: When a Host IP is specified via ABT_NODE_HOST, HTTP-based reachability checks fail,
      // so temporarily return true to bypass the check when running inside Docker.
      if (isDocker()) {
        return true;
      }

      await axios.get(joinURL(new URL(url).origin, WELLKNOWN_PING_PREFIX), { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  };

  const results = await evaluateURLs(urls, { checkAccessible: ping });

  const result = results.find((x) => x.accessible === true);
  if (result) {
    return result.url;
  }

  let resultUrl = urls.find((url) => isDidDomain(url));
  if (!resultUrl) {
    [resultUrl] = urls; // No accessible URL found; fall back to the first one
  }

  print('');
  printWarning(chalk.black(chalk.bgYellow(`The url ${resultUrl} may not be accessible due to network reasons`)));
  return resultUrl;
};

const onProcessClose = (cb) => {
  [
    'SIGINT',
    'SIGTERM',
    'SIGHUP', // the console window is closed
    'SIGBREAK', // <Ctrl>+<Break> (in Windows)
  ].forEach((sig) => {
    process.on(sig, () => {
      cb();
    });
  });
};

const tipWhenDownloadIsSlow = (getBlocklet) => {
  setTimeout(async () => {
    const blocklet = await getBlocklet();
    if (
      !blocklet ||
      [BlockletStatus.added, BlockletStatus.waiting, BlockletStatus.downloading].includes(blocklet.status)
    ) {
      printWarning('Component bundle download is slow, may be due to network reasons');
    }
  }, 30 * 1000);
};

const waitForAnyEvents = ({ blocklet, socket, events }) =>
  new Promise((resolve) => {
    events.forEach((event) => {
      socket.on(event, (d) => {
        if (d.meta.did === blocklet.meta.did) {
          events.forEach((e) => socket.off(e));
          resolve();
        }
      });
    });
  });

const getBlockletMetaWithTimeout = (urls, options, timeout = 5000) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`Failed to fetch component metadata: timeout after ${timeout / 1000}s`)),
      timeout
    );
  });
  return Promise.race([getBlockletMetaFromUrls(urls, options), timeoutPromise]);
};

const findMountPointConflicts = async (meta, existedApp) => {
  // Collect components to be installed, to detect mountPoint conflicts between them
  let components = meta.components || [];
  if (isEmpty(components)) {
    const { title, name, did } = meta;
    components.push({
      mountPoint: meta.mountPoint,
      did,
      title: title || name || did,
    });
  }
  // Already-installed components
  components.unshift(
    ...(existedApp.children?.map((v) => ({
      mountPoint: v.mountPoint,
      did: v.meta.did,
      title: v.meta.title || v.meta.name || v.meta.did,
    })) || [])
  );
  // Ignore components that have no mountPoint defined
  components = components.filter((x) => Boolean(x.mountPoint));
  // Resolve the DID for each component that is pending installation
  await pMap(
    components.filter((v) => !v.did),
    async (config) => {
      const urls = getSourceUrlsFromConfig(config);
      try {
        const rawMeta = await getBlockletMetaWithTimeout(urls, { logger: console });
        config.did = rawMeta.did;
        config.title = rawMeta.title || rawMeta.name || rawMeta.did;
      } catch (error) {
        printWarning(`Failed get component meta. Component: ${urls.join(', ')}, reason: ${error.message}`);
        config.did = '';
      }
    }
  );
  // Ignore components whose DID could not be resolved
  components = components.filter((x) => Boolean(x.did));

  const conflictMsgs = [];
  components.reduce((acc, child) => {
    // Two different components are attempting to mount at the same mountPoint
    if (acc[child.mountPoint] && acc[child.mountPoint].did !== child.did) {
      conflictMsgs.push(
        `mountPoint conflict: '${child.title}' attempted to mount on '${child.mountPoint}', but it is already occupied by '${acc[child.mountPoint].title}'`
      );
    } else {
      acc[child.mountPoint] = child;
    }
    return acc;
  }, {});

  return conflictMsgs;
};

const getUtil = ({
  node,
  nodeInfo,
  socket,
  publishEvent,
  meta,
  rootDid,
  mountPoint,
  dir,
  autoOpen,
  e2eMode,
  defaultStoreUrl,
  faucetToken,
  faucetHost,
  autoStartAllComponents,
}) => {
  let componentDids = [meta.did];

  const getApp = () => node.getBlocklet({ did: rootDid });

  // install app container
  const installApp = async ({ updateRouting } = {}) => {
    const exist = await node.getBlocklet({ did: rootDid, attachConfig: false });
    if (exist) {
      // should not be here
      throw new Error('Blocklet already exists');
    }

    // add
    let blocklet = null;
    try {
      await wrapSpinner(`Installing application ${meta.title}...`, async () => {
        blocklet = await node.devBlocklet(dir, { defaultStoreUrl });
      });

      if (updateRouting) {
        // Update routing
        await publishEvent(BlockletEvents.installed, { blocklet });
        await waitForAnyEvents({ blocklet, socket, events: [BlockletEvents.installed] }); // wait for db updating
      }

      return blocklet;
    } catch (err) {
      printError(`Application ${meta.title} install failed: ${err.message}`);
      if (process.env.DEBUG) {
        console.error(err);
      }
      // eslint-disable-next-line no-use-before-define
      await deleteApp();
      return process.exit(1);
    }
  };

  const installComponent = async ({ skipParseDependents } = {}) => {
    // check exist
    const existRoot = await node.getBlocklet({ did: rootDid, attachConfig: false });

    if (!existRoot) {
      printError('Root blocklet does not exist');
      process.exit(1);
    }

    // eslint-disable-next-line no-use-before-define
    onProcessClose(stopDev);

    // add
    let blocklet = null;
    try {
      tipWhenDownloadIsSlow(node.getBlocklet.bind(node, { did: rootDid, attachConfig: false }));

      const installingTip = `Installing Component ${meta.title}@${meta.version}...`;
      const progressList = [];
      const ref = {};
      const paddingStart = '  ';
      const progressHandler = (data) => {
        const index = progressList.findIndex((x) => x.component?.did === data.component?.did);
        if (data.status === 'completed') {
          if (index !== -1) {
            progressList.splice(index, 1);
          }
        } else if (index !== -1) {
          progressList[index] = data;
        } else {
          progressList.push(data);
        }
        if (ref.spinner) {
          ref.spinner.text = `${installingTip}\n${paddingStart}${getDownloadBundleStep(progressList, {
            paddingStart,
          })}`;
        }
      };
      ref.spinner = await wrapSpinner(
        installingTip,
        async () => {
          node.on(BlockletEvents.downloadBundleProgress, progressHandler);
          blocklet = await node.devBlocklet(dir, { rootDid, mountPoint, defaultStoreUrl, skipParseDependents });
          node.off(BlockletEvents.downloadBundleProgress, progressHandler);
          ref.spinner = null;
        },
        { ref }
      );
    } catch (err) {
      printError(`Blocklet ${meta.title}@${meta.version} install failed: ${err.message}`);
      if (process.env.DEBUG) {
        console.error(err);
      }
      // eslint-disable-next-line no-use-before-define
      await deleteComponent();
      process.exit(1);
    }

    // Update routing
    await publishEvent(BlockletEvents.upgraded, { blocklet });
    await waitForAnyEvents({ blocklet, socket, events: [BlockletEvents.upgraded] }); // wait for db updating

    // send componentInternalInfo to other components
    await publishEvent(BlockletInternalEvents.componentInstalled, {
      appDid: blocklet.appDid,
      components: getComponentsInternalInfo(blocklet).filter((x) => x.did === meta.did),
    });

    printSuccess(`Component ${meta.title}@${meta.version} was successfully installed`);

    // Publish event
    try {
      await publishEvent(BlockletEvents.updated, blocklet);
      await sleep(200);
    } catch (err) {
      printError(`Failed to publish event to socket server: ${err.message}`);
    }

    // reset config
    if (!isGatewayBlocklet(meta)) {
      const configs = (meta.environments || [])
        .filter((x) => x.name !== 'CHAIN_TYPE')
        .map((x) => {
          const { name, default: defaultValue, ...opts } = x;
          return {
            ...opts,
            key: name,
            value: defaultValue || '',
          };
        });
      await node.configBlocklet({ did: [rootDid, meta.did], configs, skipHook: true });
    }

    return blocklet;
  };

  const deleteApp = async ({ keepData = true, checkDevMode, silent } = {}) => {
    if (checkDevMode) {
      const blocklet = await node.getBlocklet({ did: rootDid, attachConfig: false });
      if (blocklet) {
        if (!isDevelopmentMode(blocklet)) {
          printError('Blocklet in production mode cannot be deleted');
          process.exit(1);
        }
      }
    }

    try {
      const keepConfigs = keepData;
      const keepRouting = keepData;
      const deleted = await node.deleteBlocklet({
        did: rootDid,
        keepData,
        keepLogsDir: false,
        keepConfigs,
      });
      await publishEvent(BlockletEvents.removed, { blocklet: deleted, context: { keepRouting } });
      if (!silent) {
        print(`Application ${deleted.meta.title} was removed`);
      }
    } catch (error) {
      // do nothing
    }
    await sleep(200);
  };

  const deleteComponent = async ({ keepData = true, checkDevMode, silent } = {}) => {
    if (checkDevMode) {
      const rootBlocklet = await node.getBlocklet({ did: rootDid, attachConfig: false });
      if (rootBlocklet) {
        const blocklet = rootBlocklet.children.find((x) => x.meta.did === meta.did);
        if (blocklet) {
          if (!isDevelopmentMode(blocklet)) {
            printError('Component in production mode cannot be deleted');
            process.exit(1);
          }
        }
      }
    }

    try {
      const rootBlocklet = await node.deleteComponent({
        did: meta.did,
        rootDid,
        keepData,
        keepState: false,
      });
      await publishEvent(BlockletEvents.upgraded, { blocklet: rootBlocklet });
      if (!silent) {
        print(`Component ${meta.title} was removed`);
      }
    } catch (error) {
      // do nothing
    }
    await sleep(200);
  };

  const stopDev = async () => {
    await lock.acquire();
    print('\nDisconnecting from Blocklet Server daemon....');
    socket.disconnect(() => {
      return deleteComponent().then(() => process.exit(0));
    });
  };

  const saveWebPort = async () => {
    try {
      const blocklet = await node.getBlocklet({ did: rootDid });
      const child = blocklet.children.find((x) => x.meta.did === meta.did);
      const { ports } = child;
      const { BLOCKLET_PORT } = ports;
      if (BLOCKLET_PORT) {
        const str = `BLOCKLET_PORT=${BLOCKLET_PORT}`;
        const envFile = path.join(process.cwd(), '.env.development.local');
        if (!fs.existsSync(envFile)) {
          fs.writeFileSync(envFile, str);
        } else {
          const content = fs.readFileSync(envFile, 'utf-8');
          if (!content.includes('BLOCKLET_PORT')) {
            fs.writeFileSync(envFile, `${content}\n${str}`);
          } else if (!content.includes(str)) {
            print('');
            printWarning(
              `The port of ${meta.title} has changed to ${chalk.cyan(
                BLOCKLET_PORT
              )} due to conflict , check your ${chalk.cyan('.env.development.local')} file to see the change.`
            );
            fs.writeFileSync(envFile, content.replace(/BLOCKLET_PORT=.*/, str));
          }
        }
      }
    } catch (error) {
      printError(`Failed to save port: ${error.message}`);
    }
  };

  const start = async ({ ignoreCloseEvent, componentDids: _componentDids } = {}) => {
    componentDids = uniq(_componentDids);

    if (!ignoreCloseEvent) {
      onProcessClose(stopDev);
    }

    try {
      const blocklet = await node.ensureBlockletIntegrity(rootDid);
      const child = blocklet.children.find((x) => x.meta.did === meta.did);
      debug('child in db', child);

      if (!isDevelopmentMode(child)) {
        print();
        const command = `  ${getCLIBinaryName()} dev install --app-did ${rootDid}${mountPoint ? ' --mount-point ' : ''}${mountPoint || ''}`; // prettier-ignore
        printError('The component of production mode already exists, please reinstall it before developing:');
        print(chalk.cyan(command));
        print();
        process.exit(1);
      }

      // ensure environments
      await ensureBlockletEnv(node, blocklet, dir);

      setTimeout(async () => {
        // start
        try {
          blocklet.status = BlockletStatus.starting;
          await publishEvent(BlockletEvents.statusChange, blocklet);
        } catch (err) {
          printError(`Failed to publish deploy event to socket server: ${err.message}`);
        }

        // pipe logs to console
        // NOTE: this is postponed because the log subscribe will fail before blocklet start
        socket.on(`log.blocklet-${blocklet.meta.did}/${child.meta.did}`, (log) => {
          if (log.level === 'error') {
            console.error(log.data);
          } else {
            // eslint-disable-next-line no-console
            console.log(log.data);
          }
        });
      }, 500);
      await node.startBlocklet({
        did: rootDid,
        throwOnError: true,
        checkHealthImmediately: true,
        e2eMode,
        atomic: true,
        componentDids: autoStartAllComponents ? null : componentDids,
      });

      blocklet.status = BlockletStatus.running;
      blocklet.children.find((x) => x.meta.did === meta.did).status = BlockletStatus.running;

      await publishEvent(BlockletEvents.statusChange, blocklet);

      // send componentInternalInfo to other components
      await publishEvent(BlockletInternalEvents.componentStarted, {
        appDid: blocklet.appDid,
        components: getComponentsInternalInfo(blocklet).filter((x) => x.did === meta.did),
      });

      await sleep(1000);
      printSuccess(`Blocklet ${meta.title}@${meta.version} was successfully started`);

      const blockletPort = blocklet.environmentObj?.BLOCKLET_PORT;

      let url;
      if (codespaces.isCodespaces()) {
        await node
          .addRoutingRuleToDefaultSite({
            from: { pathPrefix: '/' },
            to: {
              type: ROUTING_RULE_TYPES.BLOCKLET,
              port: blockletPort,
              did: blocklet.meta.did,
              interfaceName: 'publicUrl',
            },
          })
          .then(() => {
            printSuccess('Routing rule was successfully added to default site.');
          })
          .catch((error) => {
            debug(error);
            printWarning(
              `Failed to add routing rule to default site. To manually add the routing rule, please follow the GitHub Codespaces development guide at: ${chalk.cyan(HELP_DOCS_GITHUB_CODESPACES_URL)}`
            );
          });

        await node
          .addDomainAlias({
            id: blocklet.site?.id,
            domainAlias: codespaces.getDomain(nodeInfo.routing.httpsPort),
            inBlockletSetup: false,
            force: true,
            issueCert: false,
          })
          .then(() => {
            printSuccess('Domain on codespaces was successfully added to current blocklet.');
          })
          .catch((error) => {
            if (!/already exists/i.test(error.message)) {
              debug(error);
              printWarning(
                `Failed to add domain on codespaces to current blocklet, you may handle it manually, for more help please refer the GitHub Codespaces development guide at: ${chalk.cyan(HELP_DOCS_GITHUB_CODESPACES_URL)}`
              );
            }
          });

        url = codespaces.getAccessUrl({ port: nodeInfo.routing.httpsPort });
        printInfo('Developing blocklet in codespaces');
      } else {
        // print info
        const info = await node.getNodeInfo();
        const port = Number(info.routing.httpsPort) !== 443 ? `:${info.routing.httpsPort}` : '';
        url = await getDevUrl({
          getUrl: async () => {
            const ips = await getIP();
            const urls = blocklet.site.domainAliases.map(
              (x) => `https://${replaceSlotToIp(x.value, ips.internal)}${port}`
            );

            return getAccessibleUrl(urls);
          },
        });
      }

      if (url) {
        const childUrl = joinURL(url, child.mountPoint);
        if (autoOpen) {
          await open(childUrl);
        }

        // print blocklet entry
        if (!hasMountPoint(meta)) {
          print('');
          printInfo('The blocklet has no running process');
          printInfo('You can access with the following URL\n');
          const [{ url: endpoint }] = await getBaseUrls(node, []);
          print(`- ${chalk.cyan(joinURL(endpoint, '/blocklets', rootDid || meta.did, '/components'))}`);
        } else {
          print('');
          printInfo('You can access with the following URL\n');
          print(`- ${chalk.cyan(childUrl)}`);
        }
      }

      print('');
      printInfo('Note that your blocklet is running in development in Blocklet Server,');
      // eslint-disable-next-line max-len
      printInfo(
        `To run it in production mode, you can use ${chalk.cyan(`${getCLIBinaryName()} bundle`)} and then ${chalk.cyan(
          `${getCLIBinaryName()} deploy`
        )}.`
      );

      printBlockletDevelopmentGuide();

      saveWebPort();
    } catch (err) {
      printError(err.message);
      await stopDev();
    }
  };

  const resetApp = async () => {
    const blocklet = await node.getBlocklet({ did: rootDid });

    if (blocklet) {
      if (isInProgress(blocklet.status)) {
        printError('Please stop development before reset data');
        process.exit(1);
      }

      await node.resetBlocklet({ did: rootDid });
    } else {
      await node.devBlocklet(dir, { defaultStoreUrl }); // install blocklet and then remove blocklet and all data
      await deleteApp({
        keepData: false,
        silent: true,
      });
    }

    print(`\nApplication ${meta.title} has been reset\n`);
  };

  const resetComponent = async () => {
    const rootBlocklet = await node.getBlocklet({ did: rootDid });

    if (!rootBlocklet) {
      printError('Root blocklet does not exist');
      process.exit(1);
    }

    if (isInProgress(rootBlocklet.status)) {
      printError('Please stop development before reset data');
      process.exit(1);
    }

    const blocklet = rootBlocklet.children.find((x) => x.meta.did === meta.did);

    if (blocklet) {
      await node.resetBlocklet({ did: rootDid, childDid: meta.did });
    } else {
      await node.devBlocklet(dir, { rootDid, mountPoint, defaultStoreUrl, skipParseDependents: true }); // install component and then remove blocklet and all data
      await deleteComponent({
        keepData: false,
        silent: true,
      });
    }

    print(`\nComponent ${meta.title} of ${rootBlocklet.meta.title} has been reset\n`);
  };

  const faucet = async () => {
    if (!faucetToken) {
      printError('Please provide a valid token address');
      return;
    }
    const { data: tokens } = await axios.get(joinURL(faucetHost, '/api/tokens'), { timeout: 8000 });
    const token = tokens.find((x) => x.symbol === faucetToken || x.address === faucetToken);
    if (!token) {
      printError(`Token ${faucetToken} is not supported by faucet: ${faucetHost}`);
      return;
    }

    try {
      const blocklet = await node.getBlocklet({ did: rootDid });
      if (!blocklet) {
        throw new Error('Application does not exist');
      }
      const result = await wrapSpinner(`Claim ${token.symbol} from faucet ${faucetHost}...`, async () => {
        const keys = Object.keys(BLOCKLET_CONFIGURABLE_KEY);
        const { wallet } = getBlockletInfo(
          {
            meta: blocklet.meta,
            environments: keys.map((key) => ({ key, value: blocklet.configObj[key] })).filter((x) => x.value),
          },
          nodeInfo.sk
        );

        const { data } = await axios.post(
          joinURL(faucetHost, '/api/claim'),
          {
            userPk: toBase58(wallet.publicKey),
            userInfo: await Jwt.sign(wallet.address, wallet.secretKey, { token: token.address }),
          },
          { timeout: 8000 }
        );

        if (await Jwt.verify(data.authInfo, fromBase58(data.appPk))) {
          const decoded = Jwt.decode(data.authInfo);
          if (decoded.status !== 'ok') {
            throw new Error(decoded.errorMessage);
          }

          if (decoded.response.error) {
            throw new Error(decoded.response.error);
          }

          const client = new Client(token.chainHost);
          const { info } = await client.getTx({ hash: decoded.response.hash });
          const receipt = info.receipts.find((x) => x.address === wallet.address);
          if (receipt) {
            return {
              hash: decoded.response.hash,
              amount: receipt.changes.find((x) => x.target === token.address).value,
            };
          }

          return { hash: decoded.response.hash, amount: 0 };
        }

        throw new Error('invalid response from faucet');
      });

      printInfo(`Claimed ${fromUnitToToken(result.amount, token.decimal)} ${token.symbol} from faucet`);
      printInfo(joinURL(token.chainHost.replace('/api', ''), '/explorer/txs', result.hash));
    } catch (err) {
      printError(`Failed to claim from faucet: ${err.message}`);
    }
  };

  const faucetApp = async () => {
    const exist = await getApp();
    if (!exist) {
      await installApp();
    }

    await faucet();
    if (!exist) {
      await deleteApp();
    }
  };

  const studio = async () => {
    let blocklet = await getApp();
    if (!blocklet) {
      await installApp({ updateRouting: true });
      blocklet = await getApp();
    } else if (!findComponentByIdV2(blocklet, meta.did)) {
      await installComponent({ skipParseDependents: true });
    }

    checkBlockletMode(blocklet);

    const info = await node.getNodeInfo();
    const port = Number(info.routing.httpsPort) !== 443 ? `:${info.routing.httpsPort}` : '';
    const baseUrl = await getDevUrl({
      getUrl: async () => {
        const ips = await getIP();
        const urls = blocklet.site.domainAliases.map((x) => `https://${replaceSlotToIp(x.value, ips.internal)}${port}`);
        return getAccessibleUrl(urls);
      },
    });
    await open(joinURL(baseUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/studio/home'));
  };

  return {
    getApp,
    installApp,
    installComponent,
    start,
    resetApp,
    resetComponent,
    deleteApp,
    deleteComponent,
    faucetApp,
    faucetComponent: faucet,
    studio,
  };
};

const run = async (
  action,
  {
    open: autoOpen,
    host: faucetHost,
    token: faucetToken,
    devNode,
    e2eMode,
    appId: inputRootDid,
    mountPoint: inputMountPoint,
    storeUrl,
    startAllComponents: autoStartAllComponents,
  }
) => {
  checkTerminalProxy('the command');

  const defaultStoreUrl = storeUrl || process.env.COMPONENT_STORE_URL;

  try {
    const dir = process.cwd();

    // get meta
    let meta;
    try {
      meta = getBlockletMeta(dir, {
        schemaOptions: { stripUnknown: false },
        defaultStoreUrl: defaultStoreUrl ? wrapDefaultStoreUrl(defaultStoreUrl) : null,
      });
    } catch (err) {
      printError(err.message);
      if (err.message.includes("missing 'store'")) {
        print('');
        printInfo('Please confirm that blocklet.yml is filled in components[].source.store');
        printInfo(
          `You can also dynamically config COMPONENT_STORE_URL in environment or .env file. e.g.: ${chalk.cyan(
            'COMPONENT_STORE_URL="https://store.blocklet.dev"'
          )}`
        );
      }
      process.exit(1);
    }
    debug('blocklet meta', meta);

    if (hasReservedKey(meta.environments)) {
      printError('Blocklet key of environments can not start with `ABT_NODE_` or `BLOCKLET_`');
      process.exit(1);
    }

    if (!devNode) {
      await checkNodeRunning();
    }

    // rootDid
    let rootDid;
    if (inputRootDid) {
      rootDid = inputRootDid;
    } else if (!inputRootDid && process.env.BLOCKLET_DEV_APP_DID) {
      printInfo(`Use appDid from env: ${chalk.cyan(process.env.BLOCKLET_DEV_APP_DID)}`);
      rootDid = process.env.BLOCKLET_DEV_APP_DID;
    }
    if (rootDid) {
      if (isValidDid(rootDid) === false) {
        printError(`appDid is not valid: ${rootDid}`);
        process.exit(1);
      }

      rootDid = toAddress(rootDid);
    }

    // mountPoint
    let mountPoint;
    if (inputMountPoint) {
      mountPoint = inputMountPoint;
    } else if (rootDid && !inputMountPoint && process.env.BLOCKLET_DEV_MOUNT_POINT) {
      printInfo(`Use mountPoint from env: ${chalk.cyan(process.env.BLOCKLET_DEV_MOUNT_POINT)}`);
      mountPoint = process.env.BLOCKLET_DEV_MOUNT_POINT;
    } else if (!rootDid) {
      mountPoint = '/';
    }

    printInfo('Try to dev blocklet from', chalk.cyan(dir));
    print('');

    const { node, publishEvent, getWsClient } = await getNode(devNode);
    const nodeInfo = await node.getNodeInfo();
    const socket = await getWsClient();

    const params = {
      dir,
      meta,
      autoOpen,
      faucetHost,
      faucetToken,
      devNode,
      e2eMode,
      rootDid: rootDid || meta.did,
      mountPoint,
      node,
      publishEvent,
      getWsClient,
      nodeInfo,
      socket,
      defaultStoreUrl,
      autoStartAllComponents,
    };

    const util = getUtil(params);

    node.onReady(async () => {
      if (action === ACTIONS.REMOVE) {
        const app = await util.getApp();
        if (!app) {
          printError('Application does not exist');
          process.exit(1);
        }
        if (rootDid) {
          const component = await findComponentByIdV2(app, meta.did);
          if (!component) {
            printError('Component does not exist');
            process.exit(1);
          }
          await util.deleteComponent({ checkDevMode: true });
        } else {
          await util.deleteApp({ checkDevMode: true });
        }
        process.exit(0);
      }

      if (action === ACTIONS.START) {
        print('');
        printError(
          `${chalk.cyan(`${getCLIBinaryName()} dev start`)} is not yet supported, please use ${chalk.cyan(
            `${getCLIBinaryName()} dev`
          )} instead`
        );
        print('');
        process.exit(0);
      }

      if (action === ACTIONS.RESET) {
        if (rootDid) {
          await util.resetComponent();
        } else {
          await util.resetApp();
        }
        process.exit(0);
      }

      if (action === ACTIONS.FAUCET) {
        if (rootDid) {
          await util.faucetComponent();
        } else {
          await util.faucetApp();
        }
        process.exit(0);
      }

      if (action === ACTIONS.STUDIO) {
        const studioUtil = getUtil({ ...params, rootDid: meta.did });
        await studioUtil.studio();

        process.exit(0);
      }

      let blocklet = await util.getApp();
      if (!blocklet) {
        blocklet = await util.installApp();
      }

      const conflictMsgs = await findMountPointConflicts({ ...params.meta, mountPoint: params.mountPoint }, blocklet);

      if (conflictMsgs.length > 0) {
        printError(conflictMsgs.join('\n'));
        process.exit(1);
      }

      const { componentDids } = await util.installComponent();
      if (isGatewayBlocklet(meta)) {
        printInfo('Gateway blocklet detected, skip starting');
        const [{ url: endpoint }] = await getBaseUrls(node, []);
        printInfo(
          `Please open ${chalk.cyan(
            joinURL(endpoint, '/blocklets', rootDid || meta.did, '/components')
          )} to start the blocklet`
        );
        process.exit(0);
      }
      if (action === ACTIONS.INSTALL) {
        printInfo('The development mode blocklet is already installed!');
        print('');
        process.exit(0);
      }
      await util.start({ ignoreCloseEvent: true, componentDids });
    });
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }
};

const getOption = (command, key) => {
  if (get(command, `parent.${key}`) !== undefined) {
    return get(command, `parent.${key}`);
  }

  return get(command, key);
};

const getOptions = (command) => ({
  open: getOption(command, 'open'),
  host: getOption(command, 'host'),
  token: getOption(command, 'token'),
  e2eMode: getOption(command, 'e2e'),
  devNode: getOption(command, 'devNode'),
  appId: getOption(command, 'appId') || getOption(command, 'appDid'),
  mountPoint: getOption(command, 'mountPoint'),
  studio: getOption(command, 'studio'),
  storeUrl: getOption(command, 'storeUrl'),
  startAllComponents: getOption(command, 'startAllComponents'),
});

module.exports = {
  run: (command) => run(null, getOptions(command)),
  install: (command) => run('install', getOptions(command)),
  start: (command) => run('start', getOptions(command)),
  remove: (command) => run('remove', getOptions(command)),
  reset: (command) => run('reset', getOptions(command)),
  faucet: (command) => run('faucet', getOptions(command)),
  studio: (command) => run('studio', getOptions(command)),
  waitForAnyEvents,
  getAccessibleUrl,
  checkNodeRunning,
  getOption,
  findMountPointConflicts,
};
