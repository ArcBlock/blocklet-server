const shelljs = require('shelljs');
const semver = require('semver');
const { ABT_NODE_KERNEL_OR_BLOCKLET_MODE } = require('@blocklet/constant');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:engine');
const { BUN_VERSION } = require('../../util/ensure-bun');

// eslint-disable-next-line no-underscore-dangle
const _getVersion = (fn, name) => {
  if (typeof fn !== 'function') {
    throw new Error('func must be a function');
  }

  try {
    return semver.clean(fn());
  } catch (error) {
    logger.error('get engine version failed', { error, name });
    return '';
  }
};

/**
 * @return {boolean} is current engine is available
 */
// eslint-disable-next-line no-underscore-dangle
const _isAvailable = (name) => {
  if (!name) {
    throw new Error('name param is required');
  }

  const result = shelljs.which(name);
  return !!result && result.code === 0 && !!result.stdout;
};

function describe() {
  return {
    name: this.name,
    displayName: this.displayName,
    description: this.description,
    version: this.version(),
    available: this.isAvailable(),
    visible: this.visible || false,
  };
}

const engineMap = new Map();

engineMap.set('node', {
  name: 'node',
  displayName: 'Node.js',
  interpreter: 'node',
  description: 'Powered by Node.js',
  args:
    process.env.ABT_NODE_KERNEL_MODE === ABT_NODE_KERNEL_OR_BLOCKLET_MODE.PERFORMANT
      ? '--max-http-header-size=16384'
      : '--max-http-header-size=16384 --optimize_for_size',
  visible: true,
  version() {
    return _getVersion(() => process.version, this.name);
  },
  describe,
  isAvailable() {
    return _isAvailable(this.name);
  },
});

engineMap.set('bun', {
  name: 'bun',
  displayName: 'Bun',
  interpreter: 'bun',
  description: 'Powered by Bun',
  args: '',
  visible: true,
  version() {
    return BUN_VERSION;
  },
  describe,
  isAvailable() {
    return _isAvailable(this.name);
  },
});

engineMap.set('binary', {
  name: 'binary',
  visible: false,
  displayName: 'Executable binary',
  interpreter: 'none',
  description: 'Executable binary',
  version() {
    return '';
  },
  describe,
  isAvailable: () => true,
});

const engineNames = [...engineMap.keys()];

const validate = (engine) => {
  if (!engine) {
    return true;
  }
  if (engine === 'blocklet') {
    return true;
  }

  if (!engineMap.has(engine)) {
    throw new Error(
      `${engine} engine is not supported, currently supported interpreter types are: ${engineNames.toString()}` // eslint-disable-line max-len
    );
  }

  if (!engineMap.get(engine)?.isAvailable()) {
    throw new Error(`${engine} bin path does not exist`);
  }

  return true;
};

const get = (name) => {
  if (!name) {
    throw new Error('engine name is required');
  }

  if (!engineMap.has(name)) {
    throw new Error(`${name} engine does not exist`);
  }

  return engineMap.get(name);
};

const getAll = () => {
  const result = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const v of engineMap.values()) {
    result.push(v.describe());
  }

  return result;
};

module.exports = { get, getAll, validate };
