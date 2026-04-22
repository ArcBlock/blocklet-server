const CronScheduler = require('../lib/scheduler');

describe('Cron', () => {
  test('should throw error on invalid addJob param', () => {
    const cron = new CronScheduler();
    expect(cron.addJob).toThrowError();
  });

  test('should throw error on invalid addJob name', () => {
    const cron = new CronScheduler();
    expect(() => cron.addJob({})).toThrowError();
  });

  test('should throw error on invalid addJob fn', () => {
    const cron = new CronScheduler();
    expect(() => cron.addJob('test-job', {})).toThrowError();
  });

  test('should throw error on invalid addJob fn', () => {
    const cron = new CronScheduler();
    expect(() => cron.addJob('test-job', '* * * * * *')).toThrowError();
  });

  test('should return job on valid addJob param', () => {
    const cron = new CronScheduler();
    const job = cron.addJob('test-job', '0 0 1 1 1', () => {});
    expect(typeof job.start).toEqual('function');
    expect(typeof job.stop).toEqual('function');
  });

  test('should catch error if the job function is not a async function', (done) => {
    const cron = new CronScheduler({}, (error) => {
      expect(error.message).toEqual('test-job-non-async');
      done();
    });

    cron.addJob(
      'test-job-non-async',
      '0 */20 0 * * *',
      () => {
        throw new Error('test-job-non-async');
      },
      { runOnInit: true }
    );

    expect.assertions(1);
  });

  test('should catch error if the job function is a async function', (done) => {
    const cron = new CronScheduler({}, (error) => {
      expect(error.message).toEqual('test-job-async');
      done();
    });

    cron.addJob(
      'test-job-async',
      '0 */20 0 * * *',
      () => {
        throw new Error('test-job-async');
      },
      { runOnInit: true }
    );

    expect.assertions(1);
  });

  // FIXME: This works but fails frequently on travis, so let's disable it temporary
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('should auto start job on valid addJob param', (done) => {
    const cron = new CronScheduler();
    let value = 0;
    cron.addJob('test-job', '* * * * * *', () => ++value);
    setTimeout(() => {
      expect(value).toEqual(1);
    }, 100);
    setTimeout(() => {
      expect(value).toEqual(2);
      done();
    }, 1010);
  });

  test('should not run anymore on job removed', (done) => {
    const cron = new CronScheduler();
    cron.addJob('test-job', '* * * * * *', () => {});
    cron.removeJob('test-job');
    expect(() => cron.runJob('test-job')).toThrowError();
    done();
  });
});
