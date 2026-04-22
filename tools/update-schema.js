/* eslint-disable no-return-assign */
/* eslint-disable no-promise-executor-return */

const { isPortTaken } = require('@abtnode/util/lib/port');
const { spawn } = require('child_process');
const killPort = require('kill-port');
const path = require('path');

function runCommand(dir, command, args = [], options = {}, getCmd = () => {}) {
  return new Promise((resolve, reject) => {
    const cmd = spawn(command, args, {
      cwd: path.resolve(__dirname, '..', dir),
      stdio: 'inherit',
      ...options,
    });
    getCmd(cmd);
    cmd.on('close', () => {
      resolve(cmd);
    });
    cmd.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    // Step 1: Execute 'make build' in the 'core/schema' directory
    await runCommand('core/schema', 'make', ['dep']);
    await runCommand('core/schema', 'make', ['build']);
    await new Promise((res) => setTimeout(res, 1000));

    // Step 2: Execute 'npm run open:gql' in the 'core/webapp' directory
    // if the port is already in use, kill the process
    if (await isPortTaken(4000)) {
      await killPort(4000);
    }
    let gqlProcess;
    runCommand('core/webapp', 'npm', ['run', 'open:gql'], { detached: true }, (proc) => (gqlProcess = proc));

    await new Promise((res) => setTimeout(res, 5000));

    // Step 3: Execute 'npm run upgrade' in the 'core/client' directory
    try {
      await runCommand('core/client', 'npm', ['run', 'upgrade']);
    } catch (err) {
      throw new Error(`Failed to update schema: ${err.message}`);
    }

    // Step 4: Terminate the process started in Step 2
    process.kill(-gqlProcess.pid);

    // Step 5: Execute 'rm -fr node_modules/.vite' in the 'core/webapp' directory
    await runCommand('core/webapp', 'rm', ['-rf', 'node_modules/.vite']);

    // Step 6: Execute 'npx prettier --write docs/QUERIES.md' in the 'core/client' directory
    await runCommand('core/client', 'npx', ['prettier', '--write', 'docs/QUERIES.md']);

    // eslint-disable-nexne no-console
    // eslint-disable-next-line no-console
    console.log('Update scheme successfully!');

    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
