const CronScheduler = require('./scheduler');

const logger = require('./logger');

function init({ context = {}, jobs = [], onError = () => {} }) {
  const cron = new CronScheduler(context, onError);

  if (Array.isArray(jobs)) {
    jobs.forEach((x) => {
      if (x.name && x.time && typeof x.fn === 'function') {
        try {
          cron.addJob(x.name, x.time, x.fn, x.options || {});
          logger.info('job added to scheduler', x);
        } catch (err) {
          logger.error('failed to add job to scheduler', { error: err, name: x.name });
        }
      } else {
        logger.error('invalid job for scheduler', x);
      }
    });
  }

  return cron;
}

module.exports = { init };
