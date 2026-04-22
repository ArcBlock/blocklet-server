const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { createLogWatcher } = require('./watcher');

// Function to parse the log entry and extract relevant information
function parseLogEntry(line, check = true) {
  const regex =
    /^(\S+) - (\S+) \[([^\]]+)\] (\S+) "([^"]+)" "([^"]+)" (\d{3}) (\d+) "(.*?)" "(.*?)" "(.*?)" rt="(\S+)" uid="(.+?)" uos="(.+?)" uct="(\S+)" uht="(\S+)" urt="(\S+)"/;
  const match = line.match(regex);
  if (match) {
    const logEntry = {
      ip: match[1],
      remoteUser: match[2],
      timeIso8601: match[3],
      requestId: match[4],
      host: match[5],
      request: match[6],
      status: parseInt(match[7], 10),
      bodyBytesSent: parseInt(match[8], 10),
      referer: match[9],
      userAgent: match[10],
      forwardedFor: match[11],
      requestTime: parseFloat(match[12]),
      connectedDid: match[13],
      connectedWalletOs: match[14],
      upstreamConnectTime: parseFloat(match[15]),
      upstreamHeaderTime: parseFloat(match[16]),
      upstreamResponseTime: parseFloat(match[17]),
    };

    if (!check) {
      return logEntry;
    }

    if (
      logEntry.status >= 500 &&
      logEntry.status !== 503 &&
      logEntry.status <= 599 &&
      logEntry.userAgent?.includes('Prometheus') === false &&
      logEntry.request?.includes('/.well-known/did.json') === false &&
      logEntry.request?.includes('/websocket') === false &&
      logEntry.request?.includes(`${WELLKNOWN_SERVICE_PATH_PREFIX}/health`) === false
    ) {
      console.warn(`5xx request detected: ${logEntry.host}`, line);
      return logEntry;
    }
  }

  return null;
}

const logWatcher = createLogWatcher(parseLogEntry);

module.exports = {
  parseLogEntry,
  startLogWatcher: logWatcher.start,
  stopLogWatcher: logWatcher.stop,
};
