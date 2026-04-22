#!/usr/bin/env bun
/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */

// Worker 文件：在独立的 Worker 进程中运行测试

import { $ } from 'bun';

// 忽略 SIGTERM，防止被意外杀死
process.on('SIGTERM', () => {
  console.log('[Worker] Received SIGTERM, ignoring...');
});

// 从文件路径提取子包目录和相对路径
// 例如: core/models/tests/util.spec.ts -> { packageDir: 'core/models', relativePath: 'tests/util.spec.ts' }
function extractPackageInfo(filePath, rootDir) {
  const fs = require('node:fs');
  const path = require('node:path');
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

// 接收主进程发送的消息
// Bun Worker 使用全局的 onmessage
onmessage = async (event) => {
  const { file, rootDir, isBrowserTest, isCoverage, isCI, isVerbose, timeout, basePreloadPath, browserPreloadPath } =
    event.data;

  try {
    const startTime = Date.now();
    let runner;

    // 提取子包目录和相对路径
    const { packageDir, relativePath } = extractPackageInfo(file, rootDir);
    // 计算完整的工作目录
    const path = require('node:path');
    const cwd = path.resolve(rootDir, packageDir);

    if (isBrowserTest) {
      // HACK: --preload 不能以变量的形式出现在命令中，必须这样才能正常工作
      runner = isCoverage
        ? $`bun test ${relativePath} --bail --timeout ${timeout} --preload ${basePreloadPath} --preload ${browserPreloadPath} --coverage --coverage-reporter=lcov --coverage-reporter=text ${isCI ? '--no-color' : '--color'}`.cwd(cwd)
        : $`bun test ${relativePath} --bail --timeout ${timeout} --preload ${basePreloadPath} --preload ${browserPreloadPath} ${isCI ? '--no-color' : '--color'}`.cwd(cwd);
    } else {
      runner = isCoverage
        ? $`bun test ${relativePath} --bail --timeout ${timeout} --preload ${basePreloadPath} --coverage --coverage-reporter=lcov --coverage-reporter=text ${isCI ? '--no-color' : '--color'}`.cwd(cwd)
        : $`bun test ${relativePath} --bail --timeout ${timeout} --preload ${basePreloadPath} ${isCI ? '--no-color' : '--color'}`.cwd(cwd);
    }

    let stdout = '';
    let stderr = '';

    if (isVerbose) {
      // 在 verbose 模式下，输出直接传递
      const result = await runner;
      stdout = result.stdout?.toString() || '';
      stderr = result.stderr?.toString() || '';
    } else {
      // 在 quiet 模式下，捕获输出但不显示
      const result = await runner.quiet();
      stdout = result.stdout?.toString() || '';
      stderr = result.stderr?.toString() || '';
    }

    const duration = Date.now() - startTime;

    // 保存覆盖率到独特文件
    if (isCoverage) {
      const fs = require('node:fs');
      const coverageDir = path.join(cwd, 'coverage');
      const lcovPath = path.join(coverageDir, 'lcov.info');
      const testHash = Buffer.from(relativePath).toString('base64').replace(/[/+=]/g, '_');
      const lcovPartPath = path.join(coverageDir, `lcov.part.${testHash}.info`);
      if (isVerbose) console.log(`[Worker Coverage] lcovPath: ${lcovPath}, exists: ${fs.existsSync(lcovPath)}`);
      if (fs.existsSync(lcovPath)) {
        try {
          fs.copyFileSync(lcovPath, lcovPartPath);
          if (isVerbose) console.log(`[Worker Coverage] Created: ${lcovPartPath}`);
        } catch (err) {
          console.warn(`[Worker Coverage] Failed to save: ${err.message}`);
        }
      }
    }

    // 发送成功结果
    postMessage({
      success: true,
      file,
      duration,
      stdout,
      stderr,
    });
  } catch (error) {
    const duration = Date.now() - (event.data.startTime || Date.now());
    const errOut = error.stderr?.toString?.() || error.message || '(no error message)';
    const stdOut = error.stdout?.toString?.() || '';

    // 发送失败结果
    postMessage({
      success: false,
      file,
      duration,
      error: errOut,
      stdout: stdOut,
      stderr: errOut,
    });
  }
};
