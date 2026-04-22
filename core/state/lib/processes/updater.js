/* eslint-disable no-console */
const fs = require('fs-extra');
const os = require('os');
const axon = require('axon');
const path = require('path');
const shell = require('shelljs');
const semver = require('semver');
const { getInstaller, getInstallCommands } = require('@abtnode/util/lib/get-installer');

const VERBOSE = '';
// const VERBOSE = '--verbose';

const USER = os.userInfo().username;
const BINARY_NAME = process.env.ABT_NODE_BINARY_NAME;
const COMMAND_NAME = process.env.ABT_NODE_COMMAND_NAME;
const PACKAGE_NAME = process.env.ABT_NODE_PACKAGE_NAME;
const VALID_BINARY_NAMES = ['blocklet', 'abtnode'];

console.info(`binary name: ${BINARY_NAME}`);
console.info(`command name: ${COMMAND_NAME}`);
console.info(`package name: ${PACKAGE_NAME}`);

// server state control
const state = { locked: false };

// async and promise style of shelljs.exec
const runAsync = (command, options) =>
  new Promise((resolve) => {
    console.info(`Run command: ${command} as ${USER}`);
    shell.exec(command, { async: true, windowsHide: true, ...options }, (code, stdout, stderr) => {
      resolve({ code, stdout, stderr });
    });
  });

const getBinaryDir = () => {
  const installer = getInstaller(BINARY_NAME);
  if (installer === 'pnpm') {
    const { stdout: binaryDir, code } = shell.exec('pnpm bin -g', { silent: true });
    if (code === 0) {
      return binaryDir.trim();
    }
  }

  if (installer === 'yarn') {
    const { stdout: binaryDir, code } = shell.exec(`yarn global bin ${BINARY_NAME}`, { silent: true });
    if (code === 0) {
      return binaryDir.trim();
    }
  }

  const { stdout: binaryDir, code } = shell.exec('npm root -g', { silent: true });
  if (code === 0) {
    return path.join(binaryDir.trim(), '../../bin');
  }

  return '';
};

const installBlockletServer = async (version) => {
  if (VALID_BINARY_NAMES.includes(BINARY_NAME) === false) {
    return { code: 1, stderr: 'Abort because you are not using a standard @blocklet/cli setup' };
  }

  const installer = getInstaller(BINARY_NAME);
  const commands = getInstallCommands({ packageName: PACKAGE_NAME, version, params: VERBOSE });
  const command = commands[installer];
  console.info('Installing blocklet server', { version, installer, command });
  const result = await runAsync(command, {
    env: {
      ...process.env,
    },
  });
  console.info('Installing blocklet server done', { version });

  // Fix sqlite caused ENOMEM
  if (PACKAGE_NAME && installer === 'npm') {
    const output = (result.stderr || result.stdout || '').trim();
    if (output.includes('ENOMEM')) {
      console.info('Sqlite caused ENOMEM error');
      const { stdout } = shell.exec('npm root -g', { silent: true });
      const depDir = path.join(stdout.trim(), PACKAGE_NAME, 'node_modules', 'sqlite3');
      if (fs.existsSync(depDir)) {
        await runAsync('npm install --production', { cwd: depDir });
        console.info('Sqlite caused ENOMEM fixed');
      }
    }
  }

  return result;
};

const verifyBlockletServer = async (version) => {
  console.info('Verifying blocklet server', { version });
  const result = await runAsync(`${BINARY_NAME} --version`);
  console.info('Verifying blocklet server done', { version });

  if (result.code === 0) {
    const actual = semver.coerce(result.stdout);
    const expected = semver.coerce(version);
    if (actual && expected && actual.version === expected.version) {
      return result;
    }

    return { code: 1, stderr: `Blocklet server version is not expected ${version}` };
  }

  return result;
};

// Restart Blocklet Server
const restartBlockletServer = (dataDir) => {
  // We put this in the event loop because it will terminate the current node process
  // But we need to wait for the session state to transition from restarting to cleanup
  process.nextTick(async () => {
    const binaryDir = getBinaryDir();
    console.info('Restarting blocklet server', { dataDir, binaryDir });

    if (!binaryDir) {
      console.error('Can not restart blocklet server because no binaryDir found');
      return;
    }

    // restart the server
    if (VALID_BINARY_NAMES.includes(BINARY_NAME)) {
      await runAsync(`${binaryDir}/${COMMAND_NAME} start`, { cwd: path.dirname(dataDir) });
    } else {
      await runAsync(`${COMMAND_NAME} start`, { cwd: path.dirname(dataDir) });
    }
    console.info('Restarting blocklet server done');
  });

  return dataDir;
};

// Start the updater
const sock = axon.socket('rep');
const port = Number(process.env.ABT_NODE_UPDATER_PORT);
sock.bind(port, '127.0.0.1');
sock.on('message', async (raw, reply) => {
  console.info('receive', { raw, state });

  try {
    const message = JSON.parse(raw);
    if (message.command === 'install') {
      state.locked = true;
      const result = await installBlockletServer(message.version);
      state.locked = false;
      reply(result);
    } else if (message.command === 'verify') {
      state.locked = true;
      const result = await verifyBlockletServer(message.version);
      state.locked = false;
      reply(result);
    } else if (message.command === 'restart') {
      state.locked = true;
      const result = await restartBlockletServer(message.dataDir);
      state.locked = false;
      reply(result);
    } else if (message.command === 'shutdown') {
      if (state.locked) {
        reply('Refuse to terminate myself since I have work to do');
      } else {
        reply('Terminate myself after this message');
        setTimeout(() => {
          // The lock state may change within the timeout, so we need to check again
          // Assume signal sequence: shutdown(timer) -> install(lock), when timer run out, we should not exit
          if (state.locked) {
            console.info('Refuse to terminate myself because locked', state);
          } else {
            process.exit(0);
          }
        }, 60 * 1000);
      }
    } else if (message.command === 'ping') {
      reply('pong');
    } else {
      reply({ error: 'Unknown command' });
    }
  } catch (err) {
    state.locked = false;
    console.error('failed to process command', { error: err });
  }
});

console.info(`Blocklet Server Updater process is ready on port ${port}`);
