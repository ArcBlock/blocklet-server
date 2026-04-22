const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function retryFn(fn, retries) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const execute = async () => {
      try {
        attempt++;
        const result = await Promise.resolve(fn());
        resolve(result);
      } catch (error) {
        if (attempt < retries) {
          execute();
        } else {
          reject(error);
        }
      }
    };

    execute();
  });
}

function getFormattedDate() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').replace(/\..+/, '');
}

function createSafeStream(file) {
  if (!file) {
    // without a file, no log output is needed; callers typically log using the promiseSpawn return value
    return {
      end: () => {},
      write: () => {},
    };
  }
  const stream = fs.createWriteStream(file, { flags: 'a' });
  return {
    end: () => {
      stream.end();
    },
    write: (data) => {
      stream.write(data);
    },
  };
}

/**
 * Generic command execution function that accepts a command string
 * @param {string} commandString - the full command string to execute
 * @param {object} [options={}] - optional spawn configuration options
 * @returns {Promise<string>} - execution result
 */
function basePromiseSpawn(commandString, options = {}, timeout = 0, mute = false) {
  return new Promise((resolve, reject) => {
    const { outputLogPath, errorLogPath, ...restOptions } = options;
    const outputStream = createSafeStream(outputLogPath);
    const errorStream = createSafeStream(errorLogPath);

    const childProcess = spawn(commandString, {
      ...restOptions,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...restOptions.env,
        PATH: process.env.PATH,
        HTTP_PROXY: process.env.DOCKER_HTTP_PROXY || '',
        HTTPS_PROXY: process.env.DOCKER_HTTPS_PROXY || '',
      },
    });

    let stdoutData = '';
    let stderrData = '';

    let timer;

    const clearTimer = () => {
      outputStream.end();
      errorStream.end();
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    childProcess.stdout.on('data', (data) => {
      stdoutData += data;
      if (!mute) {
        outputStream.write(`(${getFormattedDate()}): ${data}`);
      }
    });

    childProcess.stderr.on('data', (data) => {
      stderrData += data;
      if (!mute) {
        errorStream.write(`(${getFormattedDate()}): ${data}`);
      }
    });

    childProcess.on('error', (err) => {
      clearTimer();
      childProcess.stdout.destroy();
      childProcess.stderr.destroy();
      reject(err);
    });

    childProcess.on('close', (code) => {
      clearTimer();
      childProcess.stdout.destroy();
      childProcess.stderr.destroy();
      if (code === 0) {
        resolve(stdoutData);
      } else {
        if (!mute) {
          console.error(`Command(${commandString}) failed with code ${code}: ${stderrData}`);
        }
        reject(new Error(`Command failed with code ${code}: ${stderrData}`));
      }
    });

    childProcess.on('exit', () => {
      clearTimer();
    });

    if (timeout > 0) {
      timer = setTimeout(() => {
        childProcess.stdout.destroy();
        childProcess.stderr.destroy();
        childProcess.kill('SIGKILL');
        outputStream.end();
        errorStream.end();
        console.error(`Command timed out after ${timeout}ms, command: ${commandString}`);
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);
    }
  });
}

const promiseSpawn = (
  command,
  options = { outputLogPath: '', errorLogPath: '', mute: false },
  { timeout = 0, retry = 0 } = {}
) => {
  const { outputLogPath = '', errorLogPath = '', mute = false } = options;

  if (outputLogPath && !fs.existsSync(path.dirname(errorLogPath))) {
    fs.mkdirSync(path.dirname(errorLogPath), { recursive: true });
  }
  if (outputLogPath && !fs.existsSync(path.dirname(outputLogPath))) {
    fs.mkdirSync(path.dirname(outputLogPath), { recursive: true });
  }
  if (command === '' || command === undefined) {
    throw new Error('Command is empty');
  }

  const func = () => basePromiseSpawn(command, options, timeout, mute);
  if (!retry) {
    return func();
  }
  return retryFn(func, retry);
};

promiseSpawn.retryFn = retryFn;

module.exports = promiseSpawn;
