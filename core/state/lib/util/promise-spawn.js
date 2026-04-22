const { spawn } = require('child_process');

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

/**
 * 通用的命令执行函数，支持字符串输入
 * @param {string} commandString - 完整的命令字符串
 * @param {object} [options={}] - 可选的 spawn 配置项
 * @returns {Promise<string>} - 执行结果
 */
function basePromiseSpawn(commandString, options = {}, timeout = 0) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(commandString, {
      ...options,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...options.env,
        PATH: process.env.PATH,
        HTTP_PROXY: process.env.DOCKER_HTTP_PROXY || '',
        HTTPS_PROXY: process.env.DOCKER_HTTPS_PROXY || '',
      },
    });

    let stdoutData = '';
    let stderrData = '';

    let timer;

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    childProcess.stdout.on('data', (data) => {
      stdoutData += data;
    });

    childProcess.stderr.on('data', (data) => {
      stderrData += data;
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
        reject(new Error(`Command failed with code ${code}: ${stderrData.substring(0, 2000)}`));
      }
    });

    childProcess.on('exit', () => {
      clearTimer();
    });

    if (timeout > 0) {
      // 启用超时功能
      timer = setTimeout(() => {
        childProcess.stdout.destroy();
        childProcess.stderr.destroy();
        childProcess.kill('SIGKILL');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);
    }
  });
}

const promiseSpawn = (command, options = {}, { timeout = 0, retry = 0 } = {}) => {
  if (command === '' || command === undefined) {
    throw new Error('Command is empty');
  }
  const func = () => basePromiseSpawn(command, options, timeout);
  if (!retry) {
    return func();
  }
  return retryFn(func, retry);
};

promiseSpawn.retryFn = retryFn;

module.exports = promiseSpawn;
