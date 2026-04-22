#!/usr/bin/env node
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-console */
const { DBCache } = require('../dist/index.cjs');

// 从 stdin 读取 JSON 数据
let inputData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', async () => {
  try {
    const workerData = JSON.parse(inputData);
    const { id, taskId, prefix, sqlitePath, redisUrl, ttl, forceType } = workerData;

    const cache = new DBCache(() => ({
      prefix,
      sqlitePath,
      forceType,
      ...(redisUrl ? { redisUrl } : {}),
      ttl: ttl || 2000,
    }));

    try {
      // 使用任务 ID 作为锁名，确保同一个任务只有一个线程能执行
      // 直接使用 lock-db-cache 的 createLock API，这是原子操作
      const taskLockName = `task:${taskId}`;
      const lockAcquired = await cache.createLock(taskLockName);

      if (!lockAcquired) {
        // 锁获取失败，说明任务已经被其他线程执行或正在执行
        process.stdout.write(
          `${JSON.stringify({
            executed: false,
            threadId: id,
          })}\n`
        );
        process.exit(0);
      }

      // 成功获取锁，现在执行任务
      // 模拟任务执行（耗时操作）
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 释放锁
      await cache.releaseLock(taskLockName);

      process.stdout.write(
        `${JSON.stringify({
          executed: true,
          threadId: id,
        })}\n`
      );
      process.exit(0);
    } catch (err) {
      process.stdout.write(
        `${JSON.stringify({
          error: err.message || String(err),
          threadId: id,
        })}\n`
      );
      process.exit(1);
    }
  } catch (err) {
    process.stderr.write(`Error parsing input: ${err.message}\n`);
    process.exit(1);
  }
});

process.stdin.on('error', (err) => {
  process.stderr.write(`Stdin error: ${err.message}\n`);
  process.exit(1);
});
