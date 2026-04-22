/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const { test, expect, describe, beforeAll, afterAll, beforeEach } = require('bun:test');
const uuid = require('uuid');
const sleep = require('@abtnode/util/lib/sleep');
const { BaseState, getServerModels, createSequelize } = require('@abtnode/models');
const { CustomError } = require('@blocklet/error');

const SequelizeStore = require('../lib/store/sequelize');

const models = getServerModels();
let sequelize;
let db;

describe('SequelizeStore cluster support', () => {
  beforeAll(async () => {
    sequelize = createSequelize('/core/queue:memory:', { logging: false, retry: { max: 15 } });
    models.Job.initialize(sequelize);

    await sleep(Math.random() * 200);
    await sequelize.sync({ force: true });
    db = new BaseState(models.Job);
  });

  beforeEach(async () => {
    await models.Job.destroy({ truncate: true });
  });

  afterAll(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });

  describe('Process isolation', () => {
    test('should prevent different processes from getting same job', async () => {
      const store1 = new SequelizeStore(db, 'test');
      const store2 = new SequelizeStore(db, 'test');

      store1.processId = '1001';
      store2.processId = '1002';

      const jobId = uuid.v4();
      const jobData = { action: 'test' };

      await store1.addJob(jobId, jobData);

      const job1 = await store1.getJob(jobId);
      const job2 = await store2.getJob(jobId);

      expect(job1).not.toBeNull();
      expect(job2).toBeNull();
      expect(job1.processingBy).toBe('1001');
    });

    test('should allow same process to re-get its own job', async () => {
      const store = new SequelizeStore(db, 'test');
      store.processId = '1001';

      const jobId = uuid.v4();
      const jobData = { action: 'test' };

      await store.addJob(jobId, jobData);

      // Get job first time
      const job1 = await store.getJob(jobId);
      expect(job1).not.toBeNull();
      expect(job1.processingBy).toBe('1001');

      // Same process should be able to get it again
      const job2 = await store.getJob(jobId);
      expect(job2).not.toBeNull();
      expect(job2.processingBy).toBe('1001');
    });

    test('should allow expired jobs to be taken by other processes', async () => {
      const store1 = new SequelizeStore(db, 'test');
      const store2 = new SequelizeStore(db, 'test');

      store1.processId = '1001';
      store2.processId = '1002';
      store1.timeoutMs = 100;
      store2.timeoutMs = 100;

      const jobId = uuid.v4();
      const jobData = { action: 'test' };

      await store1.addJob(jobId, jobData);

      const job1 = await store1.getJob(jobId);
      expect(job1.processingBy).toBe('1001');

      await sleep(150);

      const job2 = await store2.getJob(jobId);
      expect(job2).not.toBeNull();
      expect(job2.processingBy).toBe('1002');
    });
  });

  describe('Batch operations', () => {
    test('getJobs should distribute jobs across processes', async () => {
      const store1 = new SequelizeStore(db, 'test');
      const store2 = new SequelizeStore(db, 'test');

      store1.processId = '1001';
      store2.processId = '1002';

      const jobIds = [];
      for (let i = 0; i < 5; i++) {
        const jobId = uuid.v4();
        await store1.addJob(jobId, { action: `test-${i}` });
        jobIds.push(jobId);
      }

      const jobs1 = await store1.getJobs();
      const jobs2 = await store2.getJobs();

      const totalJobs = jobs1.length + jobs2.length;
      expect(totalJobs).toBe(5);

      const job1Ids = jobs1.map((job) => job.id);
      const job2Ids = jobs2.map((job) => job.id);
      const intersection = job1Ids.filter((id) => job2Ids.includes(id));
      expect(intersection).toHaveLength(0);

      jobs1.forEach((job) => expect(job.processingBy).toBe('1001'));
      jobs2.forEach((job) => expect(job.processingBy).toBe('1002'));
    });

    test('getScheduledJobs should work with process isolation', async () => {
      const store1 = new SequelizeStore(db, 'test');
      const store2 = new SequelizeStore(db, 'test');

      store1.processId = '1001';
      store2.processId = '1002';

      const now = Date.now();
      const pastTime = now - 1000;

      for (let i = 0; i < 3; i++) {
        const jobId = uuid.v4();
        await store1.addJob(
          jobId,
          { action: `scheduled-${i}` },
          {
            delay: 1,
            willRunAt: pastTime,
          }
        );
      }

      const jobs1 = await store1.getScheduledJobs();
      const jobs2 = await store2.getScheduledJobs();

      const totalJobs = jobs1.length + jobs2.length;
      expect(totalJobs).toBe(3);

      const job1Ids = jobs1.map((job) => job.id);
      const job2Ids = jobs2.map((job) => job.id);
      const intersection = job1Ids.filter((id) => job2Ids.includes(id));
      expect(intersection).toHaveLength(0);
    });
  });

  describe('updateJob', () => {
    test('should only allow current process to update its jobs', async () => {
      const store1 = new SequelizeStore(db, 'test');
      const store2 = new SequelizeStore(db, 'test');

      store1.processId = '1001';
      store2.processId = '1002';

      const jobId = uuid.v4();
      await store1.addJob(jobId, { action: 'test', step: 'pending' });

      await store1.getJob(jobId);

      const updatedJob = await store1.updateJob(jobId, { job: { step: 'running' } });
      expect(updatedJob.job.step).toBe('running');
      expect(updatedJob.processingBy).toBe('1001');

      await expect(store2.updateJob(jobId, { step: 'failed' })).rejects.toThrow(CustomError);
    });

    test('should allow updating unprocessed jobs', async () => {
      const store = new SequelizeStore(db, 'test');
      store.processId = '1001';

      const jobId = uuid.v4();
      await store.addJob(jobId, { action: 'test', step: 'pending' });

      // Should be able to update unprocessed job
      const updatedJob = await store.updateJob(jobId, { job: { step: 'running' } });
      expect(updatedJob.job.step).toBe('running');
      expect(updatedJob.processingBy).toBe('1001');
    });

    test('should allow updating expired jobs', async () => {
      const store1 = new SequelizeStore(db, 'test');
      const store2 = new SequelizeStore(db, 'test');

      store1.processId = '1001';
      store2.processId = '1002';
      store1.timeoutMs = 100;
      store2.timeoutMs = 100;

      const jobId = uuid.v4();
      await store1.addJob(jobId, { action: 'test', step: 'pending' });

      // Process 1 gets the job
      await store1.getJob(jobId);

      // Wait for timeout
      await sleep(150);

      // Process 2 should be able to update expired job
      const updatedJob = await store2.updateJob(jobId, { job: { step: 'running' } });
      expect(updatedJob.job.step).toBe('running');
      expect(updatedJob.processingBy).toBe('1002');
    });
  });

  describe('Job lifecycle', () => {
    test('should handle complete job lifecycle with process isolation', async () => {
      const store = new SequelizeStore(db, 'test');
      store.processId = '1001';

      const jobId = uuid.v4();
      const jobData = { action: 'test', step: 'pending' };

      // Add job
      await store.addJob(jobId, jobData);

      let job = await store.getJob(jobId);
      expect(job).not.toBeNull();
      expect(job.processingBy).toBe('1001');

      // Update job
      job = await store.updateJob(jobId, { job: { step: 'running' } });
      expect(job.job.step).toBe('running');

      // Check if cancelled (should not be)
      const cancelled = await store.isCancelled(jobId);
      expect(cancelled).toBe(false);

      // Complete job by deleting
      await store.deleteJob(jobId);

      // Job should no longer exist
      job = await store.getJob(jobId);
      expect(job).toBeNull();
    });

    test('should prevent duplicate job IDs', async () => {
      const store = new SequelizeStore(db, 'test');

      const jobId = uuid.v4();
      const jobData = { action: 'test' };

      await store.addJob(jobId, jobData);

      await expect(store.addJob(jobId, jobData)).rejects.toThrow(CustomError);
    });
  });

  describe('Error handling', () => {
    test('should throw error when updating non-existent job', async () => {
      const store = new SequelizeStore(db, 'test');

      await expect(store.updateJob('non-existent-id', { step: 'running' })).rejects.toThrow(CustomError);
    });

    test('should return null for non-existent job', async () => {
      const store = new SequelizeStore(db, 'test');

      const job = await store.getJob('non-existent-id');
      expect(job).toBeNull();
    });

    test('should return empty array when no jobs available', async () => {
      const store = new SequelizeStore(db, 'test');

      const jobs = await store.getJobs();
      expect(jobs).toEqual([]);

      const scheduledJobs = await store.getScheduledJobs();
      expect(scheduledJobs).toEqual([]);
    });
  });

  describe('Real multi-process simulation', () => {
    test('should prevent concurrent job consumption by multiple processes', async () => {
      const process1 = new SequelizeStore(db, 'test');
      const process2 = new SequelizeStore(db, 'test');

      // 模拟两个不通进程
      process1.processId = `pid-${Date.now()}-1`;
      process2.processId = `pid-${Date.now()}-2`;

      // 添加10个jobs
      const jobIds = [];
      for (let i = 0; i < 10; i++) {
        const jobId = uuid.v4();
        await process1.addJob(jobId, { taskId: i, data: `task-${i}` });
        jobIds.push(jobId);
      }

      // 并发获取jobs - 模拟两个进程同时竞争
      const [jobs1, jobs2] = await Promise.all([process1.getJobs(), process2.getJobs()]);

      console.log(`Process 1 got ${jobs1.length} jobs`);
      console.log(`Process 2 got ${jobs2.length} jobs`);

      // 验证没有重复消费
      const allJobIds = [...jobs1.map((j) => j.id), ...jobs2.map((j) => j.id)];
      const uniqueJobIds = [...new Set(allJobIds)];
      expect(allJobIds.length).toBe(uniqueJobIds.length);

      expect(jobs1.length + jobs2.length).toBe(10);

      // 验证每个job只被一个进程标记
      jobs1.forEach((job) => expect(job.processingBy).toBe(process1.processId));
      jobs2.forEach((job) => expect(job.processingBy).toBe(process2.processId));
    });

    test('should handle high concurrency with many processes', async () => {
      const processes = [];
      const numProcesses = 5;
      const numJobs = 20;

      // 创建多个进程store
      for (let i = 0; i < numProcesses; i++) {
        const store = new SequelizeStore(db, 'test');
        store.processId = `worker-${i}`;
        processes.push(store);
      }

      // 添加jobs
      for (let i = 0; i < numJobs; i++) {
        const jobId = uuid.v4();
        await processes[0].addJob(jobId, { taskId: i });
      }

      // 所有进程并发获取jobs
      const results = await Promise.all(processes.map((store) => store.getJobs()));

      // 收集所有获取到的jobs
      const allJobs = results.flat();
      const allJobIds = allJobs.map((job) => job.id);
      const uniqueJobIds = [...new Set(allJobIds)];

      // 验证没有重复消费
      expect(allJobIds.length).toBe(uniqueJobIds.length);
      expect(allJobs.length).toBe(numJobs);

      // 验证每个进程获取的jobs都标记正确
      results.forEach((jobs, processIndex) => {
        jobs.forEach((job) => {
          expect(job.processingBy).toBe(`worker-${processIndex}`);
        });
      });
    });

    test('should handle race condition with single job', async () => {
      const numAttempts = 100;
      const results = [];

      // 重复测试单个job的竞争条件
      for (let attempt = 0; attempt < numAttempts; attempt++) {
        await models.Job.destroy({ truncate: true });

        const process1 = new SequelizeStore(db, 'test');
        const process2 = new SequelizeStore(db, 'test');

        process1.processId = `race-test-1-${attempt}`;
        process2.processId = `race-test-2-${attempt}`;

        const jobId = uuid.v4();
        await process1.addJob(jobId, { raceTest: attempt });

        // 两个进程同时尝试获取同一个job
        const [job1, job2] = await Promise.all([process1.getJob(jobId), process2.getJob(jobId)]);

        // 记录结果
        const result = {
          attempt,
          process1Got: !!job1,
          process2Got: !!job2,
          both: !!job1 && !!job2,
        };
        results.push(result);

        // 验证不会有两个进程都获取到同一个job
        expect(job1 && job2).toBeFalsy();

        // 至少有一个进程应该获取到job
        expect(job1 || job2).toBeTruthy();
      }

      // 统计结果
      const bothGotJob = results.filter((r) => r.both).length;

      // 不应该有两个进程都获取到同一个job
      expect(bothGotJob).toBe(0);
    });

    test('should handle updateJob race conditions', async () => {
      const process1 = new SequelizeStore(db, 'test');
      const process2 = new SequelizeStore(db, 'test');

      process1.processId = 'update-race-1';
      process2.processId = 'update-race-2';

      const jobId = uuid.v4();
      await process1.addJob(jobId, { counter: 0 });

      // Process 1 获取job
      const job1 = await process1.getJob(jobId);
      expect(job1).not.toBeNull();

      // 两个进程尝试同时更新 - 只有process1应该成功
      const updatePromises = await Promise.allSettled([
        process1.updateJob(jobId, { job: { counter: 1, updatedBy: 'process1' } }),
        process2.updateJob(jobId, { job: { counter: 2, updatedBy: 'process2' } }),
      ]);

      const fulfilled = updatePromises.filter((p) => p.status === 'fulfilled');
      const rejected = updatePromises.filter((p) => p.status === 'rejected');

      // 应该只有一个成功，一个失败
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      // 成功的应该是process1
      const updatedJob = fulfilled[0].value;
      expect(updatedJob.job.updatedBy).toBe('process1');
      expect(updatedJob.processingBy).toBe('update-race-1');
    });
  });
});
