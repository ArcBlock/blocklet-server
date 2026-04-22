/* eslint-disable no-console */
const { execSync } = require('child_process');
const { ORPHAN_MIN_UPTIME } = require('@abtnode/constant');
const pm2 = require('./async-pm2');

/**
 * Check and kill orphan processes that should have been terminated during PM2 reload
 *
 * Safety measures:
 * 1. Only runs in PM2 environment (unless force=true)
 * 2. Only kills processes older than ORPHAN_MIN_UPTIME seconds (default 60s)
 * 3. Only kills processes not managed by PM2
 * 4. Only kills processes matching the target script name
 *
 * @param {Object} options
 * @param {string} options.scriptName - The script name to check (e.g., 'daemon.js', 'service.js')
 * @param {Object} options.logger - Logger instance
 * @param {boolean} options.force - Force run even outside PM2 environment (for manual cleanup)
 */
async function checkAndKillOrphanProcesses(options = {}) {
  const { scriptName, logger = console, force = false } = options;

  // Safety check: Only run in PM2 environment (unless force=true)
  if (!force && (!process.env.PM2_HOME || !process.env.pm_id)) {
    return;
  }

  if (!scriptName) {
    logger.error('[orphan-check] scriptName is required');
    return;
  }

  try {
    // Step 1: Get ALL PM2 managed PIDs for this app (including all cluster workers)
    let pm2ManagedPids = [];

    // In force mode (manual cleanup), include current process as protected
    if (force) {
      pm2ManagedPids = [process.pid];
    } else {
      // In PM2 environment, protect current process
      pm2ManagedPids = [process.pid];
    }

    try {
      // Try to get all PIDs managed by PM2
      await pm2.connectAsync();
      const pm2Processes = await pm2.listAsync();
      await pm2.disconnect();

      // Filter by app name only if we're in PM2 environment
      if (force) {
        // In force mode, protect all PM2-managed daemon/service processes
        const targetProcesses = pm2Processes.filter(
          (p) => p.pm2_env.status === 'online' && (p.name === 'abt-node-daemon' || p.name === 'abt-node-service')
        );
        pm2ManagedPids = targetProcesses.map((p) => p.pid).filter(Boolean);
      } else {
        // In PM2 environment, protect same app name processes
        const pm2Name = process.env.name || '';
        const sameAppProcesses = pm2Processes.filter((p) => p.name === pm2Name && p.pm2_env.status === 'online');
        pm2ManagedPids = sameAppProcesses.map((p) => p.pid).filter(Boolean);
      }

      logger.info(`[orphan-check] found ${pm2ManagedPids.length} PM2 managed instances: ${pm2ManagedPids.join(', ')}`);
    } catch (e) {
      // Fallback: protect all processes running this script that are < 5 minutes old
      // This is safer than only protecting current PID in case of PM2 cluster mode
      logger.warn(
        `[orphan-check] Failed to get PM2 process list (${e.message}), will use conservative protection strategy`
      );
      // Ensure disconnect even on error
      try {
        await pm2.disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
    }

    logger.info(`[orphan-check] checking for orphan processes: ${scriptName}`);
    logger.info(`[orphan-check] protected PIDs (PM2 managed): ${pm2ManagedPids.join(', ')}`);

    // Step 2: Find all processes running the same script
    let psOutput;
    try {
      // Use ps to find all processes with matching script name
      // Format: PID ELAPSED CMD
      psOutput = execSync(`ps -eo pid,etime,command | grep "${scriptName}" | grep -v grep | grep -v "check-orphan"`, {
        encoding: 'utf8',
        timeout: 5000,
      }).trim();
    } catch (e) {
      // If grep finds nothing, it returns exit code 1
      if (e.status === 1) {
        logger.info(`[orphan-check] no processes found for ${scriptName}`);
        return;
      }
      throw e;
    }

    if (!psOutput) {
      logger.info(`[orphan-check] no processes found for ${scriptName}`);
      return;
    }

    const lines = psOutput.split('\n').filter(Boolean);
    logger.info(`[orphan-check] found ${lines.length} process(es) for ${scriptName}`);

    const orphans = [];
    const conservativeMode = pm2ManagedPids.length === 1; // Only current PID, PM2 list failed

    for (const line of lines) {
      const match = line.trim().match(/^(\d+)\s+(\S+)\s+(.+)$/);
      if (match) {
        const pid = parseInt(match[1], 10);
        const etime = match[2]; // Format: [[dd-]hh:]mm:ss
        const cmd = match[3];

        // Skip PM2 managed processes (including all cluster workers)
        if (pm2ManagedPids.includes(pid)) {
          logger.info(`[orphan-check] pid ${pid} is PM2 managed, skipping`);
        } else {
          // Parse elapsed time to seconds
          const uptimeSeconds = parseElapsedTime(etime);

          logger.info(
            `[orphan-check] found process: pid=${pid}, uptime=${uptimeSeconds}s, cmd=${cmd.substring(0, 80)}...`
          );

          // Conservative mode: protect processes < 5 minutes (in case of PM2 cluster)
          if (conservativeMode && uptimeSeconds < 300) {
            logger.info(`[orphan-check] CONSERVATIVE MODE: pid ${pid} uptime < 5min, skipping (PM2 list unavailable)`);
          } else if (uptimeSeconds < ORPHAN_MIN_UPTIME) {
            // Safety check: Only consider processes that have been running for > ORPHAN_MIN_UPTIME seconds
            // This prevents killing processes that are in the middle of graceful shutdown
            logger.info(
              `[orphan-check] pid ${pid} uptime < ${ORPHAN_MIN_UPTIME}s, skipping (may be in graceful shutdown)`
            );
          } else {
            // Verify it's the correct script by checking command line more strictly
            // Use regex to match the exact script name with word boundaries
            const scriptPattern = new RegExp(`[/\\s]${scriptName.replace(/\./g, '\\.')}(\\s|$)`);
            if (!scriptPattern.test(cmd)) {
              logger.info(`[orphan-check] pid ${pid} command does not match ${scriptName}, skipping`);
            } else {
              // This is an orphan process
              orphans.push({ pid, uptime: uptimeSeconds, cmd });
            }
          }
        }
      }
    }

    // Step 3: Kill orphan processes
    if (orphans.length === 0) {
      logger.info(`[orphan-check] no orphan processes found for ${scriptName}`);
      return;
    }

    logger.warn(`[orphan-check] found ${orphans.length} orphan process(es) for ${scriptName}`);

    for (const orphan of orphans) {
      try {
        logger.warn(`[orphan-check] killing orphan process: pid=${orphan.pid}, uptime=${orphan.uptime}s`);

        // Try graceful kill first (SIGTERM)
        process.kill(orphan.pid, 'SIGTERM');

        // Wait 2 seconds, then force kill if still alive
        setTimeout(() => {
          try {
            // Check if process still exists
            process.kill(orphan.pid, 0); // Signal 0 just checks existence

            // Still alive, force kill
            logger.warn(`[orphan-check] Process ${orphan.pid} did not respond to SIGTERM, forcing SIGKILL`);
            process.kill(orphan.pid, 'SIGKILL');

            logger.info(`[orphan-check] Successfully killed orphan process ${orphan.pid}`);
          } catch (e) {
            // Process already dead, good
            logger.info(`[orphan-check] Process ${orphan.pid} already terminated`);
          }
        }, 2000); // No unref, ensure kill completes before process exits
      } catch (e) {
        if (e.code === 'ESRCH') {
          logger.info(`[orphan-check] Process ${orphan.pid} already terminated`);
        } else {
          logger.error(`[orphan-check] Failed to kill process ${orphan.pid}:`, e.message);
        }
      }
    }
  } catch (error) {
    logger.error('[orphan-check] Error checking orphan processes:', error.message);
  }
}

/**
 * Parse elapsed time from ps output to seconds
 * Format: [[dd-]hh:]mm:ss
 * Examples:
 *   "05:23" -> 323 seconds (5 minutes 23 seconds)
 *   "01:05:23" -> 3923 seconds (1 hour 5 minutes 23 seconds)
 *   "2-03:15:42" -> 185742 seconds (2 days 3 hours 15 minutes 42 seconds)
 */
function parseElapsedTime(etime) {
  const parts = etime.split(/[-:]/);
  let seconds = 0;

  if (parts.length === 2) {
    // mm:ss
    seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  } else if (parts.length === 3) {
    // hh:mm:ss
    seconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
  } else if (parts.length === 4) {
    // dd-hh:mm:ss
    seconds =
      parseInt(parts[0], 10) * 86400 +
      parseInt(parts[1], 10) * 3600 +
      parseInt(parts[2], 10) * 60 +
      parseInt(parts[3], 10);
  }

  return seconds;
}

module.exports = {
  checkAndKillOrphanProcesses,
};
