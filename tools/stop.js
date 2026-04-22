/* eslint-disable no-return-assign */
/* eslint-disable no-promise-executor-return */

const { spawn } = require('child_process');
const path = require('path');

require('dotenv-flow').config();

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
  // eslint-disable-next-line no-console
  console.log('Tmux is available. Using tmux-stop.sh...');
  await runCommand('./', 'bash tools/tmux-stop.sh');
}

main();
