// You must install pm2 as project dependency
const pm2 = require('@arcblock/pm2'); // eslint-disable-line import/no-extraneous-dependencies
const { promisify } = require('util');

const api = [
  'connect',
  'delete',
  'describe',
  'disconnect',
  'dump',
  'killDaemon',
  'launchBus',
  'list',
  'reload',
  'reloadLogs',
  'restart',
  'sendSignalToProcessName',
  'start',
  'startup',
  'stop',
];

const nodeArgs = [];

const originStart = pm2.start.bind(pm2);
pm2.start = (opts, cb) => {
  if (opts.node_args) {
    opts.node_args = `${opts.node_args} ${nodeArgs.join(' ')}`.trim();
  } else {
    opts.node_args = nodeArgs.join(' ');
  }
  if (opts.env && opts.name) {
    opts.env.RELOAD_PM2_APP_NAME = opts.name;
  }

  return originStart(opts, cb);
};

api.forEach((x) => {
  if (typeof pm2[x] === 'function') {
    pm2[`${x}Async`] = promisify(pm2[x]).bind(pm2);
  }
});

module.exports = pm2;
module.exports.__asyncApiList = api;
