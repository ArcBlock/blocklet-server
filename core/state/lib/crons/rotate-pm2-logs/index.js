/* eslint-disable no-console */
const path = require('path');
const spawn = require('cross-spawn');
const { LOG_RETAIN_IN_DAYS } = require('@abtnode/constant');

const getCron = () => ({
  name: 'rotate-pm2-logs',
  time: '0 0 * * *', // default : every day at midnight
  options: { runOnInit: false },
  fn: () => {
    console.info(`Log rotator started on ${new Date().toISOString()}`);
    const child = spawn('node', [path.join(__dirname, './script.js')], {
      detached: true,
      windowsHide: true, // required for Windows
      cwd: process.cwd(),
      timeout: 30 * 60 * 1000, // 30 minutes
      shell: process.env.SHELL || false,
      stdio: ['ignore', process.stdout, process.stderr],
      env: {
        PATH: process.env.PATH,
        PM2_HOME: process.env.PM2_HOME,
        COMPRESS: true,
        RETAIN: LOG_RETAIN_IN_DAYS,
      },
    });

    child.on('error', (err) => {
      console.error('Log rotator errored', err);
    });

    child.on('close', (code) => {
      console.info(`Log rotator exited with code ${code} on ${new Date().toISOString()}`);
    });

    child.unref();
  },
});

module.exports = {
  getCron,
};
