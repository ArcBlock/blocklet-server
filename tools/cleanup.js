/* eslint-disable import/no-extraneous-dependencies */
const killProcess = require('fkill');
const noop = require('lodash/noop');

Promise.all([
  killProcess(':9090', { silent: true, force: true }),
  killProcess(':8080', { silent: true, force: true }),
]).catch(noop);
