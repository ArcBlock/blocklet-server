/* eslint-disable no-console */
const pm2 = require('@abtnode/util/lib/pm2/async-pm2');

const LogRotator = require('../../util/rotator');

const RETAIN = parseInt(process.env.RETAIN || '', 10);
const COMPRESS = JSON.parse(process.env.COMPRESS || 'false');
const DATE_FORMAT = process.env.DATE_FORMAT || 'YYYY-MM-DD';
const { TZ } = process.env;

const logRotate = new LogRotator({ compress: COMPRESS, dateFormat: DATE_FORMAT, tz: TZ, retain: RETAIN });

// register the cron to force rotate file
console.info('Start rotating pm2 logs...');

// get list of process managed by pm2
pm2.connect((err) => {
  if (err) {
    console.error('Can not connect to pm2 daemon', err);
    process.exit(1);
  }

  // eslint-disable-next-line no-shadow
  pm2.list(async (err, apps) => {
    if (err) {
      console.error('Can not list apps from pm2', err);
      process.exit(1);
    }

    const appMap = {};

    // force rotate for each app
    await Promise.allSettled(
      apps.map((app) => {
        // if apps instances are multi and one of the instances has rotated, ignore
        if (app.pm2_env.instances > 1 && appMap[app.name]) {
          return Promise.resolve(true);
        }

        appMap[app.name] = app;

        return logRotate
          .proceedPm2App(app)
          .then(() => {
            console.info(`Rotate ${app.name} log files succeed`);
          })
          .catch((error) => {
            console.error(`Rotate ${app.name} log files failed`, { error });
          });
      })
    );

    console.info('Done rotating pm2 logs...');
    process.exit(0);
  });
});
