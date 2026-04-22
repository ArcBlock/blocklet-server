const chalk = require('chalk');
const prettyMs = require('pretty-ms-i18n');
const upperFirst = require('lodash/upperFirst');
const isEmpty = require('lodash/isEmpty');
const Table = require('cli-table3');
const { encode: encodeBase32 } = require('@abtnode/util/lib/base32');
const { fromBlockletStatus } = require('@blocklet/constant');
const { PROCESS_NAME_DAEMON, DEFAULT_DID_DOMAIN } = require('@abtnode/constant');

const {
  print,
  printWarning,
  printSuccess,
  printAccessUrls,
  printInfo,
  getDaemonAccessUrls,
  getProcessInfo,
} = require('../../util');
const getDockerStatusLog = require('../../util/docker-status-log');
const { getNode } = require('../../node');
const { wrapSpinner } = require('../../ui');

const statusMap = {
  online: 'running',
  launching: 'starting',
  errored: 'error',
  stopping: 'stopping',
  stopped: 'stopped',
};

const colorMap = {
  running: 'green',
  error: 'red',
  launching: 'yellow',
  stopping: 'orange',
  stopped: 'gray',
};

const DEFAULT_PAGE_SIZE = 20;

exports.run = async ({ forceIntranet = false, all = false }) => {
  const { node, getBaseUrls, dataDir } = await getNode({ dir: process.cwd() });

  try {
    const info = await getProcessInfo(PROCESS_NAME_DAEMON);
    if (!info) {
      print('Blocklet Server is not started');
      process.exit(0);
    }

    const nodeInfo = await node.getNodeInfo();

    try {
      getDockerStatusLog(printInfo, nodeInfo);
    } catch (error) {
      printWarning(error.message);
    }

    const providers = await node.getServerProviders({ dataDir });
    const status = statusMap[info.pm2_env.status];
    const statusFn = chalk[colorMap[status]];
    const time = status === 'running' ? ` (${statusFn(prettyMs(Date.now() - Number(info.pm2_env.pm_uptime)))})` : '';

    print();
    print(`Blocklet Server status: ${statusFn(upperFirst(status))}${time}`);
    print(`Blocklet Server mode: ${chalk.cyan(upperFirst(nodeInfo.mode))}`);
    print(`Blocklet Server Data Directory: ${chalk.cyan(info.pm2_env.env.ABT_NODE_DATA_DIR)}`);
    if (providers.routerProvider) {
      print(`Blocklet Server Router Engine: ${chalk.cyan(providers.routerProvider)}`);
    }
    if (providers.dbProvider) {
      print(`Blocklet Server Database: ${chalk.cyan(providers.dbProvider)}`);
    }

    print();
    if (nodeInfo.initialized) {
      let blocklets = [];
      let paging = {};

      await wrapSpinner('Fetching the blocklets...', async () => {
        const options = { includeRuntimeInfo: false };
        if (!all) {
          options.paging = { page: 1, pageSize: DEFAULT_PAGE_SIZE };
        }
        const result = await node.getBlocklets(options);
        blocklets = result.blocklets || [];
        paging = result.paging || {};
      });

      if (blocklets.length) {
        const table = new Table({
          head: ['Name', 'Status', 'URL'],
          style: { 'padding-left': 1, head: ['cyan', 'bold'] },
          colWidths: [30, 15, 70],
        });

        const total = paging.total || blocklets.length;
        const showing = blocklets.length;
        const headerText = total > showing ? `Blocklets Status (showing ${showing} of ${total}):` : 'Blocklets Status:';
        print(headerText);

        // eslint-disable-next-line no-shadow
        blocklets.forEach(({ meta, status }) =>
          table.push([
            meta.title,
            fromBlockletStatus(status),
            `https://${encodeBase32(meta.did)}.${DEFAULT_DID_DOMAIN}`,
          ])
        );
        print(table.toString());

        if (!all && total > showing) {
          printInfo(`Run ${chalk.cyan('blocklet server status --all')} to see all blocklets`);
        }
      } else {
        printWarning('No blocklets installed yet.');
      }
    }

    if (status === 'running') {
      print();
      const accessUrls = await getDaemonAccessUrls({ info: nodeInfo, getBaseUrls, forceIntranet });

      if (!isEmpty(accessUrls)) {
        printSuccess('You can access your blocklet server with either of the following URLs:');
        printAccessUrls(accessUrls);
      } else {
        printWarning('No accessible URL found.');
      }
    }
  } catch (err) {
    console.error(err);
  }

  process.exit(0);
};
