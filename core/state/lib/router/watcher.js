/* eslint-disable no-await-in-loop */
const fs = require('fs');

const THROTTLE_DELAY = 1000; // 1 second throttle

async function readLogFile(filePath, startPosition = 0) {
  let fd = null;
  try {
    if (!fs.existsSync(filePath)) {
      return { lines: [], fileSize: 0 };
    }

    const realPath = await fs.promises.realpath(filePath);
    fd = await fs.promises.open(realPath, 'r');
    const stats = await fd.stat();
    const fileSize = stats.size;

    if (startPosition < 0) {
      // eslint-disable-next-line no-param-reassign
      startPosition = Math.max(0, fileSize + startPosition);
    }

    if (startPosition >= fileSize) {
      return { lines: [], fileSize };
    }

    const readSize = fileSize - startPosition;
    if (readSize <= 0) {
      return { lines: [], fileSize };
    }

    const buffer = Buffer.alloc(readSize);
    const { bytesRead } = await fd.read(buffer, 0, readSize, startPosition);
    const content = buffer.slice(0, bytesRead).toString();

    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    return { lines, fileSize };
  } finally {
    if (fd) {
      await fd.close();
    }
  }
}

// A generic log watcher that can be used for different log formats
function createLogWatcher(parseLogEntry, throttleDelay = THROTTLE_DELAY) {
  let watcher;
  process.on('SIGINT', () => {
    watcher?.close();
  });

  process.on('SIGTERM', () => {
    watcher?.close();
  });

  function start(logFilePath, onLogEntry, initialBufferSize = 1024) {
    if (!fs.existsSync(logFilePath)) {
      console.error(`Log file ${logFilePath} does not exist`);
      return;
    }

    console.warn(`Start watching ${logFilePath}...`);

    let isProcessing = false;
    let isFirstRun = true;
    let timeoutId = null;
    let lastProcessedPosition = 0;

    async function processLogChanges() {
      isProcessing = true;
      try {
        const { lines, fileSize } = await readLogFile(
          logFilePath,
          isFirstRun ? -initialBufferSize : lastProcessedPosition
        );
        const entries = [];

        for (const line of lines) {
          const logEntry = parseLogEntry(line);
          if (logEntry) {
            entries.push(logEntry);
          }
        }

        if (entries.length > 0) {
          onLogEntry(entries);
        }

        lastProcessedPosition = fileSize;
        isFirstRun = false;
      } catch (error) {
        console.error(`Error reading log file ${logFilePath}`, error);
      } finally {
        isProcessing = false;
      }
    }

    watcher = fs.watch(logFilePath, { persistent: true }, async (eventType, filename) => {
      if (!filename || eventType !== 'change') return;

      // Clear any pending timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // If already processing, schedule for later
      if (isProcessing) {
        timeoutId = setTimeout(() => {
          processLogChanges();
        }, throttleDelay);
        return;
      }

      await processLogChanges();
    });
  }

  function stop() {
    watcher?.close();
  }

  return {
    start,
    stop,
  };
}

module.exports = {
  createLogWatcher,
  readLogFile,
};
