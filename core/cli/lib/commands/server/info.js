const envinfo = require('envinfo');
const xbytes = require('xbytes');
const shell = require('shelljs');
const chalk = require('chalk');
const clipboardy = require('clipboardy');
const ip = require('@abtnode/core/lib/util/ip');
const info = require('@abtnode/core/lib/util/sysinfo');
const stripAnsi = require('strip-ansi');

const { canUseFileSystemIsolateApi } = require('@abtnode/util/lib/security');
const { print, printError, printInfo, getCLIBinaryName, getVersionInfo } = require('../../util');
const { readNodeConfigWithValidate, getNode } = require('../../node');
const getDockerStatusLog = require('../../util/docker-status-log');

exports.run = ({ clipboard }) => {
  // Clipboard is not accessible when on a linux tty
  const copyToClipboard = process.platform === 'linux' && !process.env.DISPLAY ? false : clipboard;
  // Accumulate printInfo output that will be copied to the clipboard
  const toPlainText = (str) => stripAnsi(str);
  let clipboardBuffer = `${getVersionInfo()}\n`;
  const bufferedPrintInfo = (...args) => {
    printInfo(...args);
    clipboardBuffer += `${args.map(toPlainText).join(' ')}\n`;
  };

  const printEnvInfo = (err) => {
    if (err) {
      console.error(err);
    }

    return envinfo
      .run({
        System: ['OS', 'CPU', 'Shell'],
        Binaries: ['Node', 'npm', 'Yarn', 'pm2', 'pnpm', 'bun'],
        Browsers: ['Chrome', 'Edge', 'Firefox', 'Safari'],
        Servers: ['Apache', 'Nginx'],
        Virtualization: ['Docker', 'Parallels', 'VirtualBox', 'VMware Fusion'],
        npmPackages: ['@abtnode/*', '@arcblock/*'],
        npmGlobalPackages: ['@abtnode/*', '@arcblock/*', 'pm2', 'npm', 'yarn'],
      })
      .then((output) => {
        print(output);
        clipboardBuffer += `${output}`;

        if (copyToClipboard) {
          const combined = `${clipboardBuffer}`;
          clipboardy.writeSync(combined);
        }

        process.exit(0);
      })
      .catch((e) => {
        printError(`Failed to fetch env info: ${e.message}`);
        process.exit(1);
      });
  };

  return readNodeConfigWithValidate(process.cwd())
    .then(async ({ config, configFile }) => {
      bufferedPrintInfo('Server binary from:', chalk.cyan(shell.which(getCLIBinaryName())?.stdout));
      bufferedPrintInfo('Server config from:', chalk.cyan(configFile));
      bufferedPrintInfo('Server router provider:', chalk.cyan(config.node.routing.provider));
      bufferedPrintInfo('Server http port:', chalk.cyan(config.node.routing.httpPort));
      bufferedPrintInfo('Server https port:', chalk.cyan(config.node.routing.httpsPort));

      let result = await info.getSysInfo();
      bufferedPrintInfo(
        'Server host cpu:',
        chalk.cyan(result.cpu.physicalCores),
        '/',
        chalk.cyan(result.cpu.cpus.length)
      );
      bufferedPrintInfo(
        'Server host memory:',
        chalk.cyan(xbytes(result.mem.used, { iec: true })),
        '/',
        chalk.cyan(xbytes(result.mem.total, { iec: true }))
      );

      result = await ip.get();
      bufferedPrintInfo('Server host IP:', chalk.cyan(JSON.stringify(result)));
      const correct = await ip.isDnsIpMappingCorrect(config.node.did);

      /**
       * @type {{node: import('@blocklet/server-js')}}
       */
      const { node } = await getNode({ dir: process.cwd() });

      const nodeInfo = await node.getNodeInfo();
      const { enableFileSystemIsolation } = nodeInfo;
      const canUseFileSystemIsolation = canUseFileSystemIsolateApi();

      bufferedPrintInfo(
        'Server file system isolation status:',
        enableFileSystemIsolation
          ? `${canUseFileSystemIsolation ? chalk.green('on(available)') : chalk.yellow('on(unavailable, version must be >= 21.6.0)')}`
          : chalk.red('off')
      );

      getDockerStatusLog(bufferedPrintInfo, nodeInfo);
      bufferedPrintInfo('Server domain status:', correct ? chalk.green('correct') : chalk.red('mismatch'));

      return printEnvInfo();
    })
    .catch(printEnvInfo);
};
