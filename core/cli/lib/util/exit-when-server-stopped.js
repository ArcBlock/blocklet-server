const pm2 = require('@abtnode/util/lib/pm2/async-pm2');
const { PROCESS_NAME_DAEMON } = require('@abtnode/constant');

const exitWhenServerStopped = () => {
  const isRunning = (name) =>
    new Promise((resolve) => {
      pm2.connect((err) => {
        if (err) {
          pm2.disconnect();
          resolve(false);
          return;
        }
        // eslint-disable-next-line no-shadow
        pm2.describe(name, (err, [info]) => {
          pm2.disconnect();
          if (err) {
            return resolve(false);
          }
          return resolve(!!info);
        });
      });
    });
  const MAX_RETRY = 3;
  const time = 5 * 1000;
  let retry = 0;
  setInterval(async () => {
    let running = false;
    try {
      running = await isRunning(PROCESS_NAME_DAEMON);
    } catch (err) {
      console.error(err);
    }
    if (!running) {
      retry++;
    } else {
      retry = 0;
    }
    if (retry >= MAX_RETRY) {
      process.exit(0);
    }
  }, time);
};

module.exports = exitWhenServerStopped;
