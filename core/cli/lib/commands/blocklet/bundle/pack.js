const path = require('path');
const { createRelease } = require('@abtnode/util/lib/create-blocklet-release');

const { printError, printInfo } = require('../../../util');

const pack = (dir, { createArchive }) =>
  createRelease(path.join(dir, '.blocklet'), { printError, printInfo, createArchive });

module.exports = pack;
