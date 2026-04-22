const childProcess = require('child_process');
const chalk = require('chalk');

const { print, printWarning } = require('../../util');

exports.run = () => {
  // build the base npx command
  let npxCommand = 'npx -y @blocklet/component-studio-cli';

  const rawArgs = process.argv.slice(3);

  if (rawArgs.length > 0) {
    npxCommand += ` ${rawArgs.join(' ')}`;
  }

  // only for debug
  // print(chalk.green(`Executing command: ${npxCommand}`));

  try {
    // execute command
    childProcess.execSync(npxCommand, { stdio: 'inherit' });
    process.exit(0);
  } catch (error) {
    if (error?.stderr) {
      print('');

      console.error(error);

      print('');
      printWarning(`There was a problem executing ${chalk.cyan(npxCommand)}`);
      print(`You can try running the command directly: ${chalk.cyan(npxCommand)}\n`);
    }

    process.exit(error.status || 1);
  }
};
