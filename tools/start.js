/* eslint-disable no-return-assign */
/* eslint-disable no-promise-executor-return */

const { spawn, execSync } = require('child_process');
const path = require('path');
const waitPort = require('wait-port');

require('dotenv-flow').config();

// Add this function to check if tmux is available
function isTmuxAvailable() {
  try {
    execSync('tmux -V', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function runCommand(dir, args, options = {}, getCmd = () => {}) {
  return new Promise((resolve) => {
    const command = args.split(' ');
    const cmd = spawn(command[0], command.slice(1), {
      cwd: path.resolve(__dirname, '..', dir),
      stdio: 'inherit',
      ...options,
    });
    getCmd(cmd);
    cmd.on('close', () => {
      resolve(cmd);
    });
  });
}

async function main() {
  if (isTmuxAvailable() && process.env.SKIP_TMUX !== 'true') {
    // eslint-disable-next-line no-console
    console.log('Tmux is available. Using tmux-start.sh...');
    await runCommand('./', 'bash tools/tmux-start.sh');
    return;
  }

  try {
    // Step 1: Execute 'make build' in the 'core/schema' directory
    // npm run kill-ports && npm run turbo:dep
    if (process.env.SKIP_KILL_PORT !== 'true') {
      await runCommand('./', 'npm run kill-ports');
    }
    if (process.env.SKIP_DEP !== 'true') {
      await runCommand('./', 'npm run turbo:dep');
    }
    // Step 1: Start hub (database and message queue)
    runCommand('core/webapp', 'npm run start:hub');
    await new Promise((res) => setTimeout(res, 2000));

    // Step 2: Start UX component library
    runCommand('core/ux', 'npm run watch');
    await waitPort({ host: '127.0.0.1', port: 3030 });

    // Step 3: Start daemon (must be before client)
    runCommand('core/webapp', 'npm run start:daemon');
    await new Promise((res) => setTimeout(res, 2000));

    // Step 4: Start service (must be before client)
    runCommand('core/webapp', 'npm run start:service');
    await new Promise((res) => setTimeout(res, 2000));

    // Step 5: Start clients (after daemon and service are ready)
    runCommand('core/blocklet-services', 'npm run start:client');
    runCommand('core/webapp', 'npm run start:client');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
