/* eslint-disable import/order */
/* eslint-disable global-require */
const {
  ABT_NODE_MAX_CLUSTER_SIZE,
  CLI_MODE,
  NODE_ENV,
  ABT_NODE_HOME,
  PM2_HOME,
  ABT_NODE_CONFIG_FILE,
  ABT_NODE_ACCESS_KEY_FILE,
} = require('../constant');

process.env.CLI_MODE = CLI_MODE;
process.env.NODE_ENV = NODE_ENV;
process.env.ABT_NODE_HOME = ABT_NODE_HOME;
process.env.PM2_HOME = PM2_HOME;
process.env.ABT_NODE_CONFIG_FILE = ABT_NODE_CONFIG_FILE;
process.env.ABT_NODE_ACCESS_KEY_FILE = ABT_NODE_ACCESS_KEY_FILE;
process.env.ABT_NODE_MAX_CLUSTER_SIZE = String(ABT_NODE_MAX_CLUSTER_SIZE);

require('please-upgrade-node')(require('../../package.json'));

const { Command } = require('commander');
const last = require('lodash/last');

const { PROCESS_NAME_UPDATER, PROCESS_NAME_SERVICE, PROCESS_NAME_EVENT_HUB } = require('@abtnode/constant');
const debug = require('debug')('@blocklet/cli:blocklet');
const { echoBrand, isNewInstalled, removeNewInstalled } = require('../arcblock');
const { print, checkUpdate, printVersionTip } = require('../util');

const { getInternalPort: getPort } = require('../port');

process.env.ABT_NODE_UPDATER_PORT = getPort(PROCESS_NAME_UPDATER);
process.env.ABT_NODE_SERVICE_PORT = getPort(PROCESS_NAME_SERVICE);
process.env.ABT_NODE_EVENT_PORT = getPort(PROCESS_NAME_EVENT_HUB);

const { version } = require('../../package.json');
const bundle = require('./blocklet/bundle');
const deploy = require('./blocklet/deploy');
const dev = require('./blocklet/dev');
const test = require('./blocklet/test');
const init = require('./blocklet/init');
const meta = require('./blocklet/meta');
const blockletVersion = require('./blocklet/version');
const upload = require('./blocklet/upload');
const config = require('./blocklet/config');
const create = require('./blocklet/create');
const connect = require('./blocklet/connect');
const exec = require('./blocklet/exec');
const $debug = require('./blocklet/debug');
const add = require('./blocklet/add');
const remove = require('./blocklet/remove');
const cleanup = require('./blocklet/cleanup');
const deleteCmd = require('./blocklet/delete');
const exportCmd = require('./blocklet/export');
const importCmd = require('./blocklet/import');
const document = require('./blocklet/document');
const component = require('./blocklet/component');
const ServerCommand = require('./server/command');

const program = new Command();

program.version(version);
program.option('-y --yes', 'Automatic yes to prompts', false);

const handleUnexpectedError = (error) => {
  print();
  console.error(error);
  process.exit(1);
};

process.on('uncaughtException', handleUnexpectedError).on('unhandledRejection', handleUnexpectedError);

process.on('SIGINT', () => {
  // Skip process.exit for blocklet dev and server start commands
  // as they have their own SIGINT handlers
  const hasStartCommand = process.argv.includes('start');
  const hasDevCommand = process.argv.includes('dev');
  if (!hasStartCommand && !hasDevCommand) {
    process.exit();
  }
});

// if it's new installed, print the brand and version
// else just print the version
if (isNewInstalled() && ['--version', '-V'].includes(last(process.argv)) === false) {
  echoBrand({ version });
  removeNewInstalled();
}

const getOptions = (...args) => {
  const command = args[args.length - 1];
  const commonOptions = program.opts();
  const parentOpts = command.parent?._optionValues || {};
  const currentOpts = command._optionValues || {};
  const allOptions = { ...commonOptions, ...parentOpts, ...currentOpts };
  debug('parse options', allOptions);
  return allOptions;
};

const parseOptions =
  (handler) =>
  async (...args) => {
    const allOptions = getOptions(...args);
    await handler(allOptions);
  };

const parseArgsAndOptions =
  (handler) =>
  async (...args) => {
    if (isNewInstalled() === false) {
      printVersionTip();
    }
    const commonOptions = program.opts();
    const options = last(args);
    const allOptions = { ...commonOptions, ...options };
    debug('parse options', allOptions);
    await handler(...args.slice(0, args.length - 1), allOptions);
  };

program
  .command('bundle')
  .description('Bundle a blocklet that can run in Blocklet Server')
  .option('--zip', 'Bundle using zip mode, enabled by default', true)
  .option('--simple', 'Bundle using simple mode', false)
  .option('--compact', 'Bundle using compact mode, together with all its dependencies', false)
  .option('--dependencies-depth <number>', 'The depth of dependencies to be included in bundle', parseInt, 9)
  .option('--source-map', 'Create source map for bundled blocklet, only available for compact mode', false)
  .option(
    '--nosources-source-map <boolean>',
    'Create a source map without including sources content, only available for compact mode',
    false
  )
  .option('--minify', 'Use minify in compact mode', true)
  .option('--no-minify', 'Do not use minify in compact mode')
  .option(
    '--external <items>',
    'External dependencies to be included in bundle, use comma to separate multiple items',
    (val, memo) => {
      memo.push(val);
      return memo;
    },
    []
  )
  .option('--create-release', 'Create release tarball/meta for bundled blocklet', false)
  .option('--create-archive', 'Create archive *.zip file for bundled blocklet', false)
  .option('--monorepo', 'Bundle a blocklet that is in a monorepo', false)
  .option('--changelog', 'Include CHANGELOG.md in blocklet bundle', true)
  .option('--no-changelog', 'Skip including CHANGELOG.md in blocklet bundle')
  .option('--store-url <storeUrl>', 'Default store url used when component source store is not declared')
  .action(parseOptions(bundle.run));

program
  .command('deploy <folder>')
  .option('--endpoint <host>', 'The endpoint of remote Blocklet Server dashboard, such as http://127.0.0.1/admin')
  .option('--access-key <key>', 'Access key of remote Blocklet Server')
  .option('--access-secret <secret>', 'Access secret of remote Blocklet Server')
  .option('--app-id <did>', 'Which app to mount to when deploy a component')
  .option('--app-did <did>', '[Deprecated] Alias of --app-id')
  .option('--mount-point <mountPoint>', 'Mount point to the app when deploy a component')
  .option('--incremental', 'Deploy only changed files compared to the previous version', false)
  .description('Deploy blocklet from local directory to Blocklet Server')
  .action(parseArgsAndOptions(deploy.run));

program.addCommand(
  (function makeDevCommand() {
    const command = new Command('dev');
    command.description('Develop blocklet from current directory');
    command.option('--open', 'Open the browser after blocklet had been started', false);
    command.option('--app-id <did>', 'Develop the blocklet as a component and mount it to which app');
    command.option('--app-did <did>', '[Deprecated] Alias of --app-id');
    command.option('--mount-point <mountPoint>', 'Mount point to the app');
    command.option('--store-url <storeUrl>', 'Default store url used when component source store is not declared');
    command.option('--start-all-components', 'Auto start all components in the blocklet', false);
    command.command('install').description('Install the development mode blocklet').action(parseOptions(dev.install));
    command
      .command('start')
      .description('Start developing blocklet after installed')
      .option('--e2e', 'Start blocklet in e2e mode, must have e2eDev script', false)
      .action(parseOptions(dev.start));
    command.command('remove').description('Remove the development mode blocklet').action(parseOptions(dev.remove));
    command.command('studio').description('Start the blocklet studio').action(parseOptions(dev.studio));
    command.command('reset').alias('clear').description('Reset blocklet data').action(parseOptions(dev.reset));
    command
      .command('faucet')
      .option('--host <host>', 'The host of the faucet', 'https://faucet.abtnetwork.io')
      .option('--token <token>', 'The token symbol')
      .description('Fund your app with test token from faucet')
      .action(parseOptions(dev.faucet));
    command.action(parseOptions(dev.run));
    return command;
  })()
);

program.addCommand(
  (function makeTestCommand() {
    const command = new Command('test');
    command.description('Setup blocklet test environment');
    command
      .command('init')
      .option('--app-sk <appSk>', 'The secretKey for the blocklet app')
      .option('--owner-sk <ownerSk>', 'The secretKey for the blocklet owner')
      .option('--app-name [appName]', 'The name for the blocklet app', 'Test App')
      .description('Init new blocklet, skip if same appDid exist')
      .action(parseOptions(test.init));
    command
      .command('start')
      .option('--app-sk <appSk>', 'The secretKey for the blocklet app')
      .description('Start the blocklet for testing')
      .action(parseOptions(test.start));
    command
      .command('remove')
      .option('--app-sk <appSk>', 'The secretKey for the blocklet app')
      .description('Delete the testing blocklet completely')
      .action(parseOptions(test.remove));
    command
      .command('reset')
      .option('--app-sk <appSk>', 'The secretKey for the blocklet app')
      .description('Reset the testing blocklet state')
      .action(parseOptions(test.reset));
    command.action(parseOptions(test.run));
    return command;
  })()
);

program
  .command('init')
  .option('--did [did]', 'Specify a blocklet did', '')
  .option('-f --force', 'Initialize a blocklet project without having it ask any questions', false)
  .option('--monikers <monikers>', 'Custom did create moniker, support array combine with comma', '')
  .option('--connectUrl <connectUrl>', 'A connect url help to generate did', '')
  .description('Create an empty blocklet project')
  .action(parseOptions(init.run));

program.command('meta').description('Print blocklet meta from a directory').action(parseOptions(meta.run));

program
  .command('version [newVersion]')
  .option('--git-commit', 'Do a git commit after the bump')
  .option('-f --force', 'Force bumping blocklet version')
  .description('Bump blocklet version and persist to disk')
  .action(parseArgsAndOptions(blockletVersion.run));

program
  .command('upload [metafile]')
  .option('--profile <profile>', 'Your config profile', 'default')
  .option('--access-token <accessToken>', 'Your blocklet store access token')
  .description('Upload the blocklet to blocklet store')
  .action(parseArgsAndOptions(upload.run));

program
  .command('exec <script>')
  .option('--app-id <did>', "Execute component script in which app's running context")
  .option('--timeout <timeout>', 'Max timeout in seconds for script to run')
  .description('Execute script in blocklet running context')
  .action(parseArgsAndOptions(exec.run));

program
  .command('debug <value>')
  .option('--app-id <did>', "Setting debug config for which app's running context")
  .description('Setting debug environment for blocklet')
  .action(parseArgsAndOptions($debug.run));

program
  .command('connect <store-url>')
  .option('--profile <profile>', 'Your config profile', 'default')
  .description('Connect to blocklet store. This command will set store configuration by "blocklet config"')
  .action(parseArgsAndOptions(connect.run));

program
  .command('create [name]')
  .option('--did <did>', 'Specify a blocklet did')
  .option('--did-only', 'Only create a blocklet did, do not create a blocklet project')
  .option('--random', 'Generate a random DID locally without invoking DID Wallet (requires --did-only)')
  .description('Bootstrap a brand new blocklet from various starter templates within minutes')
  .action(parseArgsAndOptions(create.run));

program
  .command('component [command...]')
  .description('Execute the Component Studio CLI commands')
  .option('-h --help', 'Show help for Component Studio CLI')
  .allowUnknownOption()
  .helpOption(false)
  .action(parseArgsAndOptions(component.run));

program
  .command('add <component>')
  .description('Add component to blocklet.yml')
  .option('--profile <profile>', 'Your config profile', 'default')
  .option('--store <store>', 'Which store is the component from')
  .option('--title <title>', 'Custom title of the component')
  .option('--mount-point <mountPoint>', 'MountPoint of the component')
  .action(parseArgsAndOptions(add.run));

program
  .command('remove <component>')
  .description('Remove component from blocklet.yml')
  .action(parseArgsAndOptions(remove.run));

program
  .command('cleanup')
  .option('--target <target>', 'Which target to cleanup, available options: cache, backup')
  .option('--app-did <did>', 'Which blocklet to cleanup')
  .description('Do some blocklet level cleanup work')
  .action(parseOptions(cleanup.run));

program
  .command('delete')
  .requiredOption('--app-did <did>', 'The appDid of the blocklet to delete')
  .option('--keep-data', 'Keep blocklet data and configs on disk', false)
  .description('Delete a blocklet completely from the server')
  .action(parseOptions(deleteCmd.run));

program
  .command('export')
  .requiredOption('--app-did <did>', 'The appDid of the blocklet to export')
  .requiredOption('--out-dir <path>', 'Output directory for exported blocklet data')
  .option('--include-logs', 'Include logs in the export', false)
  .description('Export blocklet data for cross-server migration')
  .action(parseOptions(exportCmd.run));

program
  .command('import <input-dir>')
  .description('Import blocklet data from an export directory')
  .action(parseArgsAndOptions(importCmd.run));

function makeDocumentCommand() {
  const documentCommand = new Command('document');
  documentCommand.description('Manage DID document for the blocklet or the Blocklet Server');
  documentCommand
    .command('update <app-id>')
    .description('Update DID document for the blocklet')
    .action(parseArgsAndOptions(document.update));
  return documentCommand;
}

program.addCommand(makeDocumentCommand());

function makeConfigCommand() {
  const configCommand = new Command('config');
  configCommand.description('Manage the configuration for Blocklet CLI, use blocklet config help to see detail');
  configCommand.option('--profile <profile>', 'Your config profile', 'default');
  configCommand.command('set [key] [value]').description('Set config value').action(parseArgsAndOptions(config.set));
  configCommand.command('get [key]').description('Get config value').action(parseArgsAndOptions(config.get));
  configCommand.command('delete [key]').description('Delete config value').action(parseArgsAndOptions(config.delete));
  configCommand.command('list').alias('ls').description('List config value').action(parseArgsAndOptions(config.list));
  configCommand.action(config.run);
  return configCommand;
}
program.addCommand(makeConfigCommand());

program.addCommand(ServerCommand('server'));

if (process.argv.includes('upgrade') === false) {
  checkUpdate();
}

program.on('command:*', () => {
  program.help();
});

program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}
