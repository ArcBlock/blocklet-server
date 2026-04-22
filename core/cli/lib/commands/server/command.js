#!/usr/bin/env node
/* eslint-disable global-require */

const chalk = require('chalk');
const { Command } = require('commander');
const last = require('lodash/last');

const { NODE_MODES, WEB_WALLET_URL } = require('@abtnode/constant');
const debug = require('debug')('@blocklet/cli:abtnode');

const { version } = require('../../../package.json');
const start = require('./start');
const stop = require('./stop');
const init = require('./init');
const info = require('./info');
const cleanup = require('./cleanup');
const logs = require('./logs');
const status = require('./status');
const upgrade = require('./upgrade');
const migrate = require('./migrate');
const nginx = require('./nginx');
const { printVersionTip } = require('../../util');

module.exports = (parentCommand = '') => {
  const program = new Command(parentCommand);

  program.version(version);
  program.description('Manage Blocklet Server');
  program.option('-c --config [node-config]', 'Blocklet Server configuration file');
  program.option('-y --yes', 'Automatic yes to prompts', false);

  const parseOptions =
    (handler) =>
    async (...args) => {
      printVersionTip();

      // @note: The --yes flag cannot be reliably read via commander.js, so it is parsed directly from process.argv
      const yes = process.argv.includes('--yes') || process.argv.includes('-y');
      Object.assign(args[0], { yes });

      const commonOptions = program.opts();
      const options = last(args);
      const allOptions = { ...commonOptions, ...options };
      debug('parse options', allOptions);
      await handler(...args.slice(0, args.length - 1), allOptions);
    };

  const modes = Object.values(NODE_MODES)
    .map((d) => `"${d}"`)
    .join(', ');

  const forceIntranet = process.env.ABT_NODE_FORCE_INTRANET === '1';

  program
    .command('start')
    .allowUnknownOption(true)
    .option('-u --update-db', 'Should we update Blocklet Server database with latest settings from config file')
    .option('--update-blocklet-env', 'Should we update blocklet environments', false)
    .option('-k --keep-alive', 'Should I keep running without exiting after starting success', false)
    .option(
      '-a --auto-init',
      'If the configuration data directory does not exists, initialize it automatically.',
      false
    )
    .option('-m --force-mode <forceMode>', `Update blocklet server mode to specified, allowed options can be ${modes}`)
    .option('--force-intranet', 'Force blocklet server to run in intranet, ignore any external IP.', forceIntranet)
    .option(
      '--routing <strategy>',
      'Routing update strategy on startup: system (fast, default), full/all (complete rebuild)'
    )
    .description('Start Blocklet Server')
    .action(parseOptions(start.run));

  program
    .command('init')
    .option(
      '-y --yes',
      'Initialize a Blocklet Server instance without having it ask any questions, same as --force',
      false
    )
    .option('-f --force', 'alias of -y, --yes', false)
    .option(
      '-i --interactive',
      'Should we run in interactive mode (default: false), if `--force` or `--yes` is enabled, the `--interactive` argument will be invalid',
      false
    )
    .option(
      '--mode <mode>',
      `Initial server mode, allowed mode can be ${NODE_MODES.PRODUCTION}, ${NODE_MODES.DEBUG}`,
      NODE_MODES.PRODUCTION
    )
    .option('--https', 'Enable default https support for dashboard and blocklets')
    .option('--no-https', 'Disable default https support for dashboard and blocklets')
    .option('--sk <custom-sk>', 'Customize the blocklet server secret key', '')
    .option(
      '--web-wallet-url <url>',
      'Customize the web wallet url',
      process.env.ABT_NODE_WEB_WALLET_URL || WEB_WALLET_URL
    )
    .option('--http-port <httpPort>', 'Http port of the service gateway', 80)
    .option('--https-port <httpsPort>', 'Https port of the service gateway', 443)
    .option('--owner-nft-holder <ownerNftHolderDid>', 'The did that holds the ownership NFT', '')
    .option('--owner-nft-issuer <ownerNftIssuerDid>', 'The did that issued the ownership NFT', '')
    .option('--trusted-passport-issuer <passportIssuerDid>', 'The passport issuer did that is trusted by this node', '')
    .option('--disable-passport-issuance', 'Disable passport issuance by this node', false)
    .description('Init Blocklet Server config')
    .action(parseOptions(init.run));

  program
    .command('status')
    .description('Show Blocklet Server and blocklet status')
    .option('--force-intranet', 'Force blocklet server to run in intranet, ignore any external IP.', forceIntranet)
    .option('-a, --all', 'Show all blocklets without pagination', false)
    .action(parseOptions(status.run));

  program
    .command('logs')
    .description('Show Blocklet Server and blocklet log files')
    .option('-a, --all', 'Show logs for all blocklets without pagination', false)
    .action(parseOptions(logs.run));

  program
    .command('stop')
    .option('-f --force', 'Force stop all Blocklet Server related processes', false)
    .description('Stop Blocklet Server and blocklets')
    .action(parseOptions(stop.run));

  program
    .command('info')
    .option('-C --clipboard', 'Automatically copy environment information to clipboard', false)
    .description('Get environment information for debugging and issue reporting')
    .action(parseOptions(info.run));

  program
    .command('cleanup')
    .option(
      '--target <target>',
      'Which target to cleanup, available options: cache, maintenance-status, blacklist, blacklist-expired, orphan-process, stuck-components'
    )
    .option('--app-id <did>', 'Which blocklet to cleanup stuck components')
    .description('Do some server level cleanup work')
    .action(parseOptions(cleanup.run));

  program
    .command('migrate')
    .option('--dialect <dialect>', 'Which dialect to migrate, available options: sqlite, postgres')
    .description('Migrate database from sqlite to postgres')
    .action(parseOptions(migrate.run));

  program
    .command('nginx')
    .option('--setup', 'Setup nginx environment for Blocklet Server (requires sudo)')
    .description('Configure nginx as reverse proxy for Blocklet Server')
    .action(parseOptions(nginx.run));

  program.command('upgrade').description('Self-Upgrade Blocklet Server').action(parseOptions(upgrade.run));

  program.on('--help', () => {
    /* eslint-disable no-console */
    console.log('');
    console.log(`None of the above command seems help? Consider command line utility ${chalk.cyan('blocklet')}.`);
  });

  return program;
};
