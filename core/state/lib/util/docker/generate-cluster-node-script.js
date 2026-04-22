const generateClusterNodeScript = (scriptPath, instances) => `
// Auto-generated cluster script
const cluster = require('cluster');
const os = require('os');
const path = require('path');

const numCPUs = os.cpus().length;
const workerCount = Math.min(${instances}, numCPUs);

// Restart protection: maximum restarts & time window, if 5 restarts in 60s, exit the entire program
const MAX_RESTARTS = 5;     
const RESTART_WINDOW_MS = 60_000;
const restartTimestamps = [];

// Map: worker.id -> instanceId
const workerInstanceMap = new Map();

function forkWorker(instanceId) {
  const worker = cluster.fork({
    NODE_APP_INSTANCE: String(instanceId),
    BLOCKLET_INSTANCE_ID: String(instanceId),
  });
  workerInstanceMap.set(worker.id, instanceId);
  return worker;
}

if (cluster.isMaster) {
  console.log(\`[Master] PID=\${process.pid}, starting \${workerCount} workers...\`);

  for (let i = 0; i < workerCount; i++) {
    forkWorker(i);
  }

  cluster.on('exit', (worker, code, signal) => {
    const instanceId = workerInstanceMap.get(worker.id);
    workerInstanceMap.delete(worker.id);

    console.error(\`[Master] Worker \${worker.process.pid} (INSTANCE=\${instanceId}) died (code=\${code}, signal=\${signal})\`);

    const now = Date.now();
    restartTimestamps.push(now);

    // Clean up old records that exceed the window period
    while (restartTimestamps.length > 0 && restartTimestamps[0] < now - RESTART_WINDOW_MS) {
      restartTimestamps.shift();
    }

    if (restartTimestamps.length > MAX_RESTARTS) {
      console.error('[Master] Too many worker restarts in short time, shutting down the cluster...');
      process.exit(1);
      return;
    }

    console.log(\`[Master] Restarting worker for INSTANCE=\${instanceId}...\`);
    setTimeout(() => forkWorker(instanceId), 1000);
  });

  cluster.on('online', (worker) => {
    const instanceId = workerInstanceMap.get(worker.id);
    console.log(\`[Master] Worker \${worker.process.pid} (INSTANCE=\${instanceId}) is online\`);
  });
} else {
  console.log(\`[Worker] PID=\${process.pid}, INSTANCE=\${process.env.BLOCKLET_INSTANCE_ID}, running: ${scriptPath}\`);
  require(path.resolve('./', '${scriptPath}'));
}
`;

module.exports = generateClusterNodeScript;
