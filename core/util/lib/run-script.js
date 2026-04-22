/* eslint-disable prefer-const */
/* eslint-disable no-nested-ternary */
const fs = require('fs-extra');
const which = require('which');
const stream = require('stream');
const spawn = require('cross-spawn');

const getDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  const hours = `0${date.getHours()}`.slice(-2);
  const minutes = `0${date.getMinutes()}`.slice(-2);
  const seconds = `0${date.getSeconds()}`.slice(-2);
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

class PrefixTransform extends stream.Transform {
  constructor(prefix, state) {
    super();

    this.prefix = prefix;
    this.state = state;
  }

  // transform all output from child process with a prefix for better readability
  _transform(chunk, _encoding, callback) {
    const { prefix: rawPrefix, state } = this;
    const prefix = `[${getDate()}] ${rawPrefix}`;
    const nPrefix = `\n${prefix}`;
    const firstPrefix = state.lastIsLineBreak ? prefix : state.lastPrefix !== prefix ? '\n' : '';
    const prefixed = `${firstPrefix}${chunk}`.replace(/\n/g, nPrefix);
    const index = prefixed.indexOf(prefix, Math.max(0, prefixed.length - prefix.length));

    state.lastPrefix = prefix;
    state.lastIsLineBreak = index !== -1;

    callback(null, index !== -1 ? prefixed.slice(0, index) : prefixed);
  }
}

const wrapStream = (next, prefix, state) => {
  const transform = new PrefixTransform(prefix ? `[${prefix}] ` : '', state);
  transform.pipe(next);
  return transform;
};

/**
 * Run script with a childProcess.spawn
 *
 * @param {string} script
 * @param {string} label
 * @param {object} options
 * @param {object} options.env
 * @param {string} options.cwd
 * @param {number} options.timeout
 * @param {boolean} options.silent
 * @param {string} options.output
 * @param {string} options.error
 * @return {Promise}
 */
const runScript = (script, label, options = {}) => {
  if (!script) {
    throw new Error('script is required');
  }
  if (!label) {
    throw new Error('label is required');
  }

  let child = null;

  const cleanup = () => {
    if (child) {
      child.kill();
      child = null;
    }
  };

  const { output: outputFile, error: errorFile, silent, env, cwd, ...opts } = options;
  const timeout = opts.timeout ?? 1000 * 120;

  const promise = new Promise((resolve, reject) => {
    process.stdout.setMaxListeners(0);
    process.stderr.setMaxListeners(0);
    let [command, ...args] = script.split(' ');
    if (fs.existsSync(command) === false) {
      command = which.sync(command);
      if (!command) {
        reject(new Error(`Command not found: ${command}`));
        return;
      }
    }

    const state = {
      lastPrefix: null,
      lastIsLineBreak: true,
    };

    [outputFile, errorFile].forEach((file) => {
      if (file) {
        fs.ensureFileSync(file);
      }
    });

    const stdout = wrapStream(
      outputFile ? fs.createWriteStream(outputFile, { flags: 'a' }) : process.stdout,
      process.stdout.isTTY ? '' : label,
      state
    );
    const stderr = wrapStream(
      errorFile ? fs.createWriteStream(errorFile, { flags: 'a' }) : process.stderr,
      process.stdout.isTTY ? '' : label,
      state
    );

    const now = Date.now();
    child = spawn(command, args, {
      ...opts,
      windowsHide: true, // required for Windows
      detached: false,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout,
      env,
      cwd,
    });

    if (!silent) {
      child.stdout.pipe(stdout, { end: false });
      child.stderr.pipe(stderr, { end: false });
    }

    let hasUnhandledRejection = false;
    const errorMessages = [];

    const handleExit = (code, signal) => {
      if (signal) {
        if (Date.now() - now > timeout) {
          return reject(new Error(`Process timeout after ${timeout / 1000} seconds`));
        }
        return reject(new Error(`Process was killed with signal: ${signal}`));
      }

      if (errorMessages.length > 0) {
        if (code !== 0 || hasUnhandledRejection) {
          return reject(new Error(errorMessages.join('\r\n')));
        }
      }

      return resolve({ code, script });
    };

    child.stderr.on('data', (err) => {
      errorMessages.push(err);
      if (err.includes('UnhandledPromiseRejectionWarning')) {
        hasUnhandledRejection = true;
      }
    });

    child.on('error', (err) => {
      console.error(err);
      errorMessages.push(err.message);
      return reject(new Error(errorMessages.join('\r\n')));
    });

    child.on('close', handleExit);
    child.on('exit', handleExit);
  });

  promise.abort = cleanup;

  return promise;
};

module.exports = runScript;
