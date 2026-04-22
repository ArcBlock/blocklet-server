const { test, expect, describe } = require('bun:test');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const generateClusterNodeScript = require('../../lib/util/docker/generate-cluster-node-script');

const tmpDir = os.tmpdir();
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

function runCluster(scriptPath, instances, timeout = 15000) {
  return new Promise((resolve) => {
    const clusterScript = generateClusterNodeScript(scriptPath, instances);
    const clusterFile = path.join(tmpDir, `cluster-${path.basename(scriptPath)}.js`);
    fs.writeFileSync(clusterFile, clusterScript);

    const proc = spawn('node', [clusterFile], { stdio: ['ignore', 'pipe', 'pipe'] });

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    proc.stderr.on('data', (data) => {
      output += data.toString();
    });

    const timer = setTimeout(() => {
      proc.kill();
      resolve({ code: null, output });
    }, timeout);

    proc.on('exit', (code) => {
      clearTimeout(timer);
      resolve({ code, output });
    });
  });
}

describe('generateClusterNodeScript integration tests', () => {
  test('should start a service with multiple workers (example.js)', async () => {
    const { code, output } = await runCluster(
      path.join(__dirname, 'cluster-script', 'example-cluster-script.js'),
      2,
      3000
    );

    expect(code).toBeNull();

    // 应该有多个 worker 启动
    const matches = output.match(/\[Master\] Worker \d+ \(INSTANCE=\d+\) is online/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);

    expect(output).toMatch(/listening on port/);
  }, 15_000);

  test('should crash and stop after too many restarts (crashExample.js)', async () => {
    const { code, output } = await runCluster(
      path.join(__dirname, 'cluster-script', 'example-crash-script.js'),
      2,
      9000
    );

    expect(code).toBe(1);

    // 输出应该有 crash 日志
    // expect(output).toMatch(/exiting/);

    expect(output).toMatch(/Too many worker restarts/);
  }, 15_000);

  test('should preserve NODE_APP_INSTANCE after instance 1 restarts', async () => {
    const { code, output } = await runCluster(
      path.join(__dirname, 'cluster-script', 'example-instance-script.js'),
      2,
      4000
    );

    expect(code).toBeNull();

    const instanceCounts = {};
    const regex = /\[Worker\] instance=(\d+) started/g;
    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(output)) !== null) {
      const instanceId = match[1];
      instanceCounts[instanceId] = (instanceCounts[instanceId] || 0) + 1;
    }

    // instance 0 只启动一次
    expect(instanceCounts['0']).toBe(1);

    // instance 1 至少启动两次（因为崩溃后重启）
    expect(instanceCounts['1']).toBeGreaterThanOrEqual(2);

    const allInstanceIds = Object.keys(instanceCounts);
    expect(allInstanceIds).toEqual(expect.arrayContaining(['0', '1']));
    expect(allInstanceIds.length).toBe(2);
  }, 15_000);
});
