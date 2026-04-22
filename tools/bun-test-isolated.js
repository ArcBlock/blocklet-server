#!/usr/bin/env bun

/* eslint-disable no-await-in-loop */
/* eslint-disable no-bitwise */
/* eslint-disable no-continue */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */

// 由于 bun 的测试所有文件都在一个进程里执行，无法做到 isolation，
// 这个脚本的目的是让每个测试文件在一个独立的进程中运行。
// 等待 https://github.com/oven-sh/bun/issues/6024 修复后即可移除此文件。
// 使用 Bun Worker 来替代 spawn，提供更好的进程隔离和资源管理。

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Glob } from 'bun';

/**
 * 合并两个 lcov 文件的覆盖率数据
 * 当同一行在两个文件中都有覆盖数据时，取最大值
 */
function mergeLcovFiles(existingPath, newPath) {
  if (!fs.existsSync(newPath)) return;
  if (!fs.existsSync(existingPath)) {
    // 没有现有文件，直接复制新文件
    fs.copyFileSync(newPath, existingPath);
    return;
  }

  const existingContent = fs.readFileSync(existingPath, 'utf-8');
  const newContent = fs.readFileSync(newPath, 'utf-8');

  // 解析 lcov 记录到 Map
  function parseLcov(content) {
    const fileMap = new Map();
    const records = content.split('end_of_record').filter((r) => r.trim());

    for (const record of records) {
      const lines = record.split('\n');
      let currentFile = '';
      const fileData = {
        fnf: 0,
        fnh: 0,
        fns: new Map(), // FN 行
        fndas: new Map(), // FNDA 行
        das: new Map(), // DA 行
        lf: 0,
        lh: 0,
        brf: 0,
        brh: 0,
      };

      for (const line of lines) {
        if (line.startsWith('SF:')) {
          currentFile = line.slice(3);
        } else if (line.startsWith('FN:')) {
          const [lineNum, name] = line.slice(3).split(',');
          fileData.fns.set(name, parseInt(lineNum, 10));
        } else if (line.startsWith('FNDA:')) {
          const [hits, name] = line.slice(5).split(',');
          const existing = fileData.fndas.get(name) || 0;
          fileData.fndas.set(name, Math.max(existing, parseInt(hits, 10)));
        } else if (line.startsWith('FNF:')) {
          fileData.fnf = Math.max(fileData.fnf, parseInt(line.slice(4), 10));
        } else if (line.startsWith('FNH:')) {
          fileData.fnh = Math.max(fileData.fnh, parseInt(line.slice(4), 10));
        } else if (line.startsWith('DA:')) {
          const [lineNum, hits] = line.slice(3).split(',').map(Number);
          const existing = fileData.das.get(lineNum) || 0;
          fileData.das.set(lineNum, Math.max(existing, hits));
        } else if (line.startsWith('LF:')) {
          fileData.lf = Math.max(fileData.lf, parseInt(line.slice(3), 10));
        } else if (line.startsWith('LH:')) {
          fileData.lh = Math.max(fileData.lh, parseInt(line.slice(3), 10));
        } else if (line.startsWith('BRF:')) {
          fileData.brf = Math.max(fileData.brf, parseInt(line.slice(4), 10));
        } else if (line.startsWith('BRH:')) {
          fileData.brh = Math.max(fileData.brh, parseInt(line.slice(4), 10));
        }
      }

      if (currentFile) {
        if (fileMap.has(currentFile)) {
          // 合并已有记录
          const existing = fileMap.get(currentFile);
          for (const [name, lineNum] of fileData.fns) {
            existing.fns.set(name, lineNum);
          }
          for (const [name, hits] of fileData.fndas) {
            const existingHits = existing.fndas.get(name) || 0;
            existing.fndas.set(name, Math.max(existingHits, hits));
          }
          for (const [lineNum, hits] of fileData.das) {
            const existingHits = existing.das.get(lineNum) || 0;
            existing.das.set(lineNum, Math.max(existingHits, hits));
          }
          existing.fnf = Math.max(existing.fnf, fileData.fnf);
          existing.fnh = Math.max(existing.fnh, fileData.fnh);
          existing.lf = Math.max(existing.lf, fileData.lf);
          existing.lh = Math.max(existing.lh, fileData.lh);
          existing.brf = Math.max(existing.brf, fileData.brf);
          existing.brh = Math.max(existing.brh, fileData.brh);
        } else {
          fileMap.set(currentFile, fileData);
        }
      }
    }

    return fileMap;
  }

  // 生成合并后的 lcov 内容
  function generateLcov(fileMap) {
    const output = [];
    for (const [filePath, data] of fileMap) {
      output.push('TN:');
      output.push(`SF:${filePath}`);

      // FN 行
      for (const [name, lineNum] of data.fns) {
        output.push(`FN:${lineNum},${name}`);
      }
      output.push(`FNF:${data.fnf}`);

      // 重新计算 FNH
      const fnh = Array.from(data.fndas.values()).filter((h) => h > 0).length;
      output.push(`FNH:${Math.max(data.fnh, fnh)}`);

      // FNDA 行
      for (const [name, hits] of data.fndas) {
        output.push(`FNDA:${hits},${name}`);
      }

      // DA 行（按行号排序）
      const sortedDas = Array.from(data.das.entries()).sort((a, b) => a[0] - b[0]);
      for (const [lineNum, hits] of sortedDas) {
        output.push(`DA:${lineNum},${hits}`);
      }

      // 重新计算 LF 和 LH
      const lf = data.das.size;
      const lh = Array.from(data.das.values()).filter((h) => h > 0).length;
      output.push(`LF:${Math.max(data.lf, lf)}`);
      output.push(`LH:${Math.max(data.lh, lh)}`);

      // 分支信息
      if (data.brf > 0) {
        output.push(`BRF:${data.brf}`);
        output.push(`BRH:${data.brh}`);
      }

      output.push('end_of_record');
    }
    return output.join('\n');
  }

  const existingMap = parseLcov(existingContent);
  const newMap = parseLcov(newContent);

  // 合并新数据到现有数据
  for (const [filePath, newData] of newMap) {
    if (existingMap.has(filePath)) {
      const existing = existingMap.get(filePath);
      for (const [name, lineNum] of newData.fns) {
        existing.fns.set(name, lineNum);
      }
      for (const [name, hits] of newData.fndas) {
        const existingHits = existing.fndas.get(name) || 0;
        existing.fndas.set(name, Math.max(existingHits, hits));
      }
      for (const [lineNum, hits] of newData.das) {
        const existingHits = existing.das.get(lineNum) || 0;
        existing.das.set(lineNum, Math.max(existingHits, hits));
      }
      existing.fnf = Math.max(existing.fnf, newData.fnf);
      existing.fnh = Math.max(existing.fnh, newData.fnh);
      existing.lf = Math.max(existing.lf, newData.lf);
      existing.lh = Math.max(existing.lh, newData.lh);
      existing.brf = Math.max(existing.brf, newData.brf);
      existing.brh = Math.max(existing.brh, newData.brh);
    } else {
      existingMap.set(filePath, newData);
    }
  }

  // 写入合并后的内容
  const merged = generateLcov(existingMap);
  fs.writeFileSync(existingPath, merged);
}

let start = Date.now();

const args = process.argv.slice(2);
const isSlow = args.includes('--slow');
const isFast = args.includes('--fast');
const skipFirst = args.includes('--skip-first'); // 跳过 first unit tests，加快验证
const isCoverage = args.includes('--coverage');
const isCI = !!process.env.GITHUB_ACTIONS || !!process.env.CI;
const repeatArg = args.find((a) => a.startsWith('--repeat='));
const repeatCount = repeatArg
  ? (() => {
      const parsed = parseInt(repeatArg.split('=')[1], 10);
      return Number.isNaN(parsed) ? 1 : parsed;
    })()
  : 1;
const reTryArg = args.find((a) => a.startsWith('--retry='));
const reTryCount = reTryArg ? parseInt(reTryArg.split('=')[1], 10) || 0 : 0;
const isVerbose = args.includes('--verbose') || args.includes('-v');

const filterArg = args.find((a) => a.startsWith('--filter='));
let filterPath = filterArg ? filterArg.split('=')[1] : undefined;
const testPath = args.filter((a) => !a.startsWith('-'));

if (testPath.length > 0) {
  // eslint-disable-next-line prefer-destructuring
  filterPath = testPath[0];
}

process.env.FORCE_COLOR = isCI ? '0' : '1';
if (isCI) process.env.NO_COLOR = '1';

const SYMBOL = isCI
  ? {
      pass: '',
      fail: '',
      stop: '[STOP]',
      all: '[ALL]',
      avg: '[AVG]',
      clock: '[TIME]',
      section: '[CHUNK]',
    }
  : {
      pass: '✅',
      fail: '❌',
      stop: '❗',
      all: '✅',
      avg: '⚖️',
      clock: '⏱️',
      section: '📦',
    };

const glob = new Glob('**/*.{first-spec,slow-spec,browser-spec,spec}.{ts,js}');
const root = path.join(import.meta.dir, '..');

let files = [];
for await (const file of glob.scan(root)) {
  if (!file.includes('node_modules') && (!filterPath || file.includes(filterPath))) files.push(file);
}

if (files.length === 0) {
  console.log('No test files found.');
  process.exit(0);
}

if (isFast) files = files.filter((f) => !f.includes('slow-spec'));
if (isSlow) files = files.filter((f) => f.includes('slow-spec'));

const slowChunks = [];
const firstChunks = [];
const normalChunks = [];
const browserTestFiles = new Set();

// Collect files that share resources and must run serially (e.g., static server on port 9090)
const sharedResourceFiles = [];

for (const file of files) {
  if (file.includes('slow-spec')) slowChunks.push(file);
  else if (file.includes('first-spec') || file.includes('spawn-spec') || file.includes('serial'))
    firstChunks.push(file);
  else if (file.includes('blocklet/manager/disk-') && !file.includes('disk-blue-green')) {
    // disk-*.spec.js files (except disk-blue-green) share a static server and must run serially
    sharedResourceFiles.push(file);
  } else {
    if (file.includes('browser-spec')) browserTestFiles.add(file);
    normalChunks.push(file);
  }
}

console.log(`Found ${files.length} test files.`);

let failed = 0;
let passed = 0;
let hasFailed = false;
const concurrency = process.env.TEST_CONCURRENCY
  ? parseInt(process.env.TEST_CONCURRENCY, 10)
  : Math.min(Math.max(os.cpus().length - 2, 1), 10);

const LONG_TIME = 200_000;
const reTryErrorFiles = new Set();
const workerPath = path.resolve(import.meta.dir, './bun-test-worker.js');
const basePreloadPath = path.resolve(import.meta.dir, './bun-test-preload.js');
const browserPreloadPath = path.resolve(import.meta.dir, './bun-browser.plugin.js');

// 从文件路径提取子包目录和相对路径
// 例如: core/models/tests/util.spec.ts -> { packageDir: 'core/models', relativePath: 'tests/util.spec.ts' }
function extractPackageInfo(filePath, rootDir) {
  const fs = require('node:fs');
  const absolutePath = path.resolve(rootDir, filePath);
  let dir = path.dirname(absolutePath);

  // 从文件所在目录往上找 package.json
  while (dir.length >= rootDir.length) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const packageDir = path.relative(rootDir, dir);
      const relativePath = path.relative(dir, absolutePath);
      // bun test 需要 ./ 前缀才能把参数当作路径而不是过滤器
      return { packageDir: packageDir || '.', relativePath: `./${relativePath}` };
    }
    const parentDir = path.dirname(dir);
    if (parentDir === dir) break; // 到达根目录
    dir = parentDir;
  }

  // 如果没找到 package.json，返回原路径
  return { packageDir: '.', relativePath: `./${filePath}` };
}

// Handle signals - ignore SIGTERM to prevent early termination
let sigtermCount = 0;
process.on('SIGTERM', () => {
  sigtermCount++;
  const memUsage = process.memoryUsage();
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  // 尝试获取系统总内存使用
  let sysMemInfo = '';
  try {
    const freeMem = Math.round(os.freemem() / 1024 / 1024);
    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const usedMem = totalMem - freeMem;
    const usedPercent = Math.round((usedMem / totalMem) * 100);
    sysMemInfo = `, system: ${usedMem}/${totalMem}MB (${usedPercent}%)`;
  } catch {
    // ignore
  }
  console.log(`\n${SYMBOL.stop} Received SIGTERM (#${sigtermCount}), ignoring... (rss=${rssMB}MB${sysMemInfo})`);
  // 不退出，继续运行
});

process.on('SIGINT', () => {
  // Ctrl+C 仍然允许用户手动中断
  console.log(`\n\n${SYMBOL.stop} Received SIGINT (Ctrl+C), stopping...`);
  console.log(`${SYMBOL.pass} Passed: ${passed}`);
  console.log(`${SYMBOL.fail} Failed: ${failed}`);
  process.exit(130);
});
process.on('uncaughtException', (err) => {
  console.error(`\n${SYMBOL.stop} Uncaught exception: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error(`\n${SYMBOL.stop} Unhandled rejection: ${reason}`);
  process.exit(1);
});

/**
 * 使用 spawn 运行测试
 * @param {string} relFile - 相对路径的测试文件
 * @param {number} timeout - 超时时间
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise<{success: boolean, duration: number, stdout?: string, stderr?: string, error?: string}>}
 */
async function runTestWithSpawn(relFile, timeout, maxRetries = 1) {
  const isBrowserTest = browserTestFiles.has(relFile);

  // 提取子包目录和相对路径
  const { packageDir, relativePath } = extractPackageInfo(relFile, root);
  const cwd = path.resolve(root, packageDir);

  let lastError;
  // maxRetries=0 表示不重试，只执行一次（attempt=0）
  // maxRetries=1 表示重试1次，总共执行2次（attempt=0,1）
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const startTime = Date.now();
        const spawnArgs = ['test', relativePath, '--bail', '--timeout', timeout.toString()];

        // 总是加载基础 preload（设置环境变量、localStorage 等）
        spawnArgs.push('--preload', basePreloadPath);

        if (isBrowserTest) {
          spawnArgs.push('--preload', browserPreloadPath);
        }

        // 覆盖率处理：每个测试保存到独特文件，最后合并
        const coverageDir = path.join(cwd, 'coverage');
        const lcovPath = path.join(coverageDir, 'lcov.info');
        const testHash = Buffer.from(relativePath).toString('base64').replace(/[/+=]/g, '_');
        const lcovPartPath = path.join(coverageDir, `lcov.part.${testHash}.info`);

        if (isCoverage) {
          spawnArgs.push('--coverage', '--coverage-reporter=lcov', '--coverage-reporter=text');
        }

        if (isCI) {
          spawnArgs.push('--no-color');
        } else {
          spawnArgs.push('--color');
        }

        const child = spawn('bun', spawnArgs, {
          cwd,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, FORCE_COLOR: isCI ? '0' : '1' },
        });

        let stdout = '';
        let stderr = '';
        let exitCode = null;
        let stdoutEnded = false;
        let stderrEnded = false;
        let isResolved = false;

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.stdout.on('end', () => {
          stdoutEnded = true;
          checkComplete();
        });

        child.stderr.on('end', () => {
          stderrEnded = true;
          checkComplete();
        });

        const timeoutId = setTimeout(() => {
          child.kill('SIGTERM');
          reject(new Error(`Test timeout after ${timeout}ms`));
        }, timeout + 5000);

        function checkComplete() {
          if (isResolved) return;
          if (exitCode !== null && stdoutEnded && stderrEnded) {
            isResolved = true;
            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;

            if (exitCode === 0) {
              // 成功后保存这次测试的覆盖率到独特文件
              if (isCoverage) {
                if (isVerbose) console.log(`  [Coverage] lcovPath: ${lcovPath}, exists: ${fs.existsSync(lcovPath)}`);
                if (fs.existsSync(lcovPath)) {
                  try {
                    fs.copyFileSync(lcovPath, lcovPartPath);
                    if (isVerbose) console.log(`  [Coverage] Created: ${lcovPartPath}`);
                  } catch (copyErr) {
                    console.warn(`  Warning: Failed to save coverage: ${copyErr.message}`);
                  }
                }
              }
              resolve({
                success: true,
                duration,
                stdout,
                stderr,
              });
            } else {
              const error = new Error(`Test failed with exit code ${exitCode}`);
              error.stdout = stdout;
              error.stderr = stderr;
              error.exitCode = exitCode;
              error.isSignalKill = exitCode === 143 || exitCode === 137; // SIGTERM=143, SIGKILL=137
              reject(error);
            }
          }
        }

        child.on('close', (code, signal) => {
          exitCode = code;
          // 记录进程退出详情
          if (signal) {
            stderr += `\n[Process killed by signal: ${signal}]`;
          } else if (code !== 0) {
            stderr += `\n[Process exited with code: ${code}, stdout length: ${stdout.length}, stderr length: ${stderr.length}]`;
          }
          if (code === null && signal) {
            exitCode = 128 + (signal === 'SIGTERM' ? 15 : signal === 'SIGKILL' ? 9 : 1);
          }
          checkComplete();
        });

        child.on('error', (error) => {
          if (isResolved) return;
          isResolved = true;
          clearTimeout(timeoutId);
          error.message = `[Spawn error] ${error.message}`;
          reject(error);
        });
      });
    } catch (err) {
      lastError = err;
      // 如果是被信号杀死（SIGTERM/SIGKILL），自动重试
      if (err.isSignalKill) {
        console.log(`  ↻ Retrying ${relFile} (killed by signal, attempt ${attempt + 1})...`);
        // eslint-disable-next-line no-undef
        await Bun.sleep(100);
        continue; // 继续重试，不计入 maxRetries
      }
      if (attempt < maxRetries) {
        reTryErrorFiles.add({
          file: relFile,
          error: err.message || err.toString(),
          count: attempt + 1,
        });
        // eslint-disable-next-line no-undef
        await Bun.sleep(500);
      }
    }
  }
  throw lastError;
}

/**
 * 使用 Worker 运行测试
 * @param {string} relFile - 相对路径的测试文件
 * @param {number} timeout - 超时时间
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise<{success: boolean, duration: number, stdout?: string, stderr?: string, error?: string}>}
 */
async function runTestWithWorker(relFile, timeout, maxRetries = 1) {
  const isBrowserTest = browserTestFiles.has(relFile);
  const rootDir = path.resolve(import.meta.dir, '../');

  let lastError;
  // maxRetries=0 表示不重试，只执行一次（attempt=0）
  // maxRetries=1 表示重试1次，总共执行2次（attempt=0,1）
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const worker = new Worker(workerPath, { smol: true });

        const timeoutId = setTimeout(() => {
          worker.terminate();
          reject(new Error(`Test timeout after ${timeout}ms`));
        }, timeout + 5000); // 给 Worker 一些额外时间

        worker.onmessage = (event) => {
          clearTimeout(timeoutId);
          const result = event.data;
          if (result.success) {
            resolve(result);
          } else {
            const error = new Error(result.error || 'Test failed');
            error.stdout = result.stdout;
            error.stderr = result.stderr;
            reject(error);
          }
          worker.terminate();
        };

        worker.onerror = (error) => {
          clearTimeout(timeoutId);
          worker.terminate();
          reject(error);
        };

        worker.onmessageerror = (error) => {
          clearTimeout(timeoutId);
          worker.terminate();
          reject(error);
        };

        // 发送测试任务到 Worker
        worker.postMessage({
          file: relFile,
          rootDir,
          isBrowserTest,
          isCoverage,
          isCI,
          isVerbose,
          timeout,
          basePreloadPath,
          browserPreloadPath,
        });
      });
    } catch (err) {
      lastError = err;
      // 如果是被信号杀死（SIGTERM/SIGKILL），自动重试
      if (err.isSignalKill) {
        console.log(`  ↻ Retrying ${relFile} (killed by signal, attempt ${attempt + 1})...`);
        // eslint-disable-next-line no-undef
        await Bun.sleep(100);
        continue;
      }
      if (attempt < maxRetries) {
        reTryErrorFiles.add({
          file: relFile,
          error: err.message || err.toString(),
          count: attempt + 1,
        });
        // eslint-disable-next-line no-undef
        await Bun.sleep(500);
      }
    }
  }
  throw lastError;
}

const runChunks = async (chunks, label, maxConcurrency = concurrency, maxTimeout = 60_000) => {
  if (chunks.length === 0) return;
  console.log(`\n${SYMBOL.section} Starting chunk: ${label} (${chunks.length} files)`);
  console.log('='.repeat(80));
  const chunkStart = Date.now();

  let index = 0;
  const nextIndex = () => (index < chunks.length ? index++ : -1);

  async function runNext() {
    if (hasFailed) return;
    const currentIndex = nextIndex();
    if (currentIndex === -1) return;
    if (maxConcurrency === 1) {
      // eslint-disable-next-line no-undef
      await Bun.sleep(100);
    }

    const relFile = chunks[currentIndex];
    const startTime = Date.now();
    const isLongTime = maxTimeout > LONG_TIME;
    // 如果 retry=0，确保只执行一次，不被 isLongTime 覆盖
    const realRetryCount = isLongTime && reTryCount > 0 ? 1 : reTryCount;

    if (isLongTime) {
      console.log(`Running ${relFile}...`);
    }

    try {
      // 根据 CPU 核心数选择执行方式
      const result =
        os.cpus().length <= 4
          ? await runTestWithSpawn(relFile, maxTimeout, realRetryCount)
          : await runTestWithWorker(relFile, maxTimeout, realRetryCount);

      // 检查是否已经有测试失败，如果有则不再继续
      if (hasFailed) return;

      const duration = (result.duration / 1000).toFixed(1);
      passed++;

      const pad = (v, w = 5) => v.toString().padStart(w, ' ');
      const durationText = pad(duration);
      const totalText = pad(((Date.now() - start) / 1000).toFixed(1));
      console.log(`${SYMBOL.pass} PASSED [Time ${durationText}s ${totalText}s] [${passed}/${files.length}] ${relFile}`);

      await runNext();
    } catch (error) {
      if (hasFailed) return;
      hasFailed = true;
      failed++;

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      let errOut = error.stderr?.toString?.() || error.message || error.toString() || '(no error message)';
      let stdOut = error.stdout?.toString?.() || '';

      // Filter out noisy log lines and truncate overly long outputs
      const MAX_OUTPUT_LINES = 200;
      const NOISY_PATTERNS = [
        /@arcblock\/jwt sign\.body/,
        /^\s*iss:/,
        /^\s*iat:/,
        /^\s*nbf:/,
        /^\s*exp:/,
        /^\s*version:/,
      ];
      const filterAndTruncate = (output, outputLabel) => {
        const lines = output.split('\n').filter((line) => !NOISY_PATTERNS.some((p) => p.test(line)));
        if (lines.length > MAX_OUTPUT_LINES) {
          const truncated = lines.slice(0, MAX_OUTPUT_LINES).join('\n');
          return `${truncated}\n\n... [${outputLabel} truncated: ${lines.length - MAX_OUTPUT_LINES} more lines]`;
        }
        return lines.join('\n');
      };
      errOut = filterAndTruncate(errOut, 'stderr');
      stdOut = filterAndTruncate(stdOut, 'stdout');

      const retryInfo = realRetryCount > 1 ? `[retry ${realRetryCount}/${realRetryCount}]` : '';
      console.log(
        `${SYMBOL.fail} FAILED ${retryInfo} ${relFile} (${duration}s, total ${((Date.now() - start) / 1000).toFixed(1)}s)`
      );
      console.log('─'.repeat(80));
      if (stdOut.trim()) console.log(stdOut.trim());
      if (errOut.trim()) console.error(`\n[stderr]\n${errOut.trim()}`);
      console.log('─'.repeat(80));

      // 如果没有 retry，快速退出
      if (realRetryCount <= 1) {
        console.error(`\n${SYMBOL.stop} Test failed (no retry configured)`);
        console.error('='.repeat(80));
        console.error(`${SYMBOL.fail} Failed: ${relFile}`);
        console.error(`${SYMBOL.clock} Total Used: ${((Date.now() - start) / 1000).toFixed(1)}s`);
        console.error('='.repeat(80));
        process.exit(1);
      }

      console.error(`\n${SYMBOL.stop} Stopping remaining tests due to failure...`);
      console.error('='.repeat(80));
      console.error(`${SYMBOL.fail} Failed: ${relFile}`);
      console.error(`${SYMBOL.clock} Total Used: ${((Date.now() - start) / 1000).toFixed(1)}s`);
      console.error('='.repeat(80));

      // eslint-disable-next-line no-undef
      await Bun.sleep(100);
      process.exit(1);
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(maxConcurrency, chunks.length); i++) {
    workers.push(runNext());
  }

  await Promise.allSettled(workers);

  // ---- chunk summary ----
  const chunkTime = ((Date.now() - chunkStart) / 1000).toFixed(1);
  if (!hasFailed) {
    console.log(`${SYMBOL.section} Chunk "${label}" completed in ${chunkTime}s`);
    console.log('='.repeat(80));
  }
};

for (let i = 1; i <= repeatCount; i++) {
  start = Date.now();
  failed = 0;
  passed = 0;
  hasFailed = false;

  if (!skipFirst) {
    await runChunks(firstChunks, 'first unit tests', 1);
  }
  await runChunks(normalChunks, 'normal unit tests');
  // Run files that share resources (like static server) serially to avoid race conditions
  await runChunks(sharedResourceFiles, 'shared resource tests', 1);
  await runChunks(slowChunks, 'slow unit tests', 2, 600_000);

  if (reTryErrorFiles.size > 0) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Retry error files: ${reTryErrorFiles.size}`);
    console.log('='.repeat(80));
    for (const { file, error, count } of reTryErrorFiles) {
      console.log(`${file} (${error}) [retry ${count}]`);
    }
  }
  if (!hasFailed) {
    if (i > 1) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`repeat ${i} of ${repeatCount}`);
      console.log('='.repeat(80));
    }
    const totalTime = ((Date.now() - start) / 1000).toFixed(1);
    const avg = passed ? (totalTime / passed).toFixed(2) : 0;
    console.log(`\n${'='.repeat(80)}`);
    console.log(`${SYMBOL.all} All tests passed!`);
    console.log(`${SYMBOL.pass} Passed: ${passed}`);
    console.log(`${SYMBOL.clock} Total Used: ${totalTime}s`);
    console.log(`${SYMBOL.avg} Avg per file: ${avg}s`);
    console.log('='.repeat(80));
  }

  // 合并所有覆盖率部分文件
  if (isCoverage) {
    console.log('\nMerging coverage files...');
    await mergeCoverageParts(root);
    console.log('Coverage merge completed.');
  }

  process.exitCode = failed ? 1 : 0;
}

/**
 * 合并所有 lcov.part.*.info 文件到 lcov.info
 * @param {string} rootDir - 项目根目录
 */
async function mergeCoverageParts(rootDir) {
  const searchDirs = ['blocklet', 'core'];

  for (const dir of searchDirs) {
    const fullPath = path.join(rootDir, dir);
    if (!fs.existsSync(fullPath)) continue;

    const packages = fs.readdirSync(fullPath, { withFileTypes: true });
    for (const pkg of packages) {
      if (!pkg.isDirectory()) continue;

      const coverageDir = path.join(fullPath, pkg.name, 'coverage');
      if (!fs.existsSync(coverageDir)) continue;

      // 查找所有 lcov.part.*.info 文件
      const files = fs.readdirSync(coverageDir);
      const partFiles = files.filter((f) => f.startsWith('lcov.part.') && f.endsWith('.info'));

      if (partFiles.length === 0) continue;

      // 合并所有部分文件
      const lcovPath = path.join(coverageDir, 'lcov.info');
      let mergedContent = '';

      for (const partFile of partFiles) {
        const partPath = path.join(coverageDir, partFile);
        try {
          const content = fs.readFileSync(partPath, 'utf-8');
          mergedContent += content + '\n';
          // 删除部分文件
          fs.unlinkSync(partPath);
        } catch {
          // ignore
        }
      }

      // 如果有合并内容，使用 mergeLcovFiles 进行智能合并
      if (mergedContent.trim()) {
        // 写入临时文件用于合并
        const tempPath = path.join(coverageDir, 'lcov.temp.info');
        fs.writeFileSync(tempPath, mergedContent);

        // 如果已有 lcov.info，需要合并；否则直接使用
        if (fs.existsSync(lcovPath)) {
          mergeLcovFiles(lcovPath, tempPath);
        } else {
          // 解析并重新生成以去重
          mergeLcovFiles(tempPath, tempPath);
          fs.renameSync(tempPath, lcovPath);
        }

        // 清理临时文件
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    }
  }
}
