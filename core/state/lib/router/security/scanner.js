const { createLogWatcher } = require('../watcher');

// Function to parse the log entry and extract relevant information
function parseLogEntry(line) {
  // Quick check before regex
  if (!line.includes('ModSecurity:') && !line.includes('limiting requests, excess:')) {
    return null;
  }

  let logEntry = null;

  // ModSecurity log pattern
  const wafPattern =
    /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}).*\[error\].*\[client (\d+\.\d+\.\d+\.\d+)\].*ModSecurity:.*\[id "(\d+)"\].*\[unique_id "([^"]+)"\]/;
  let match = line.match(wafPattern);
  if (match) {
    logEntry = {
      type: 'modsecurity',
      timestamp: match[1],
      ip: match[2],
      ruleId: match[3],
      requestId: match[4],
    };
  }

  // Nginx rate limiting log pattern
  const rateLimitPattern =
    /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}).*\[error\].*limiting requests, excess: ([\d.]+) by zone "([^"]+)", client: (\d+\.\d+\.\d+\.\d+),/;
  match = line.match(rateLimitPattern);
  if (match) {
    logEntry = {
      type: 'rate_limit',
      timestamp: match[1],
      excess: parseFloat(match[2]),
      zone: match[3],
      ip: match[4],
    };
  }

  if (process.env.NODE_ENV === 'test') {
    return logEntry;
  }

  // Ignore old log entries
  if (logEntry) {
    const now = Date.now();
    const timestamp = new Date(logEntry.timestamp).getTime();
    if (now - timestamp > 1000) {
      return null;
    }
  }

  return logEntry;
}

const logWatcher = createLogWatcher(parseLogEntry);

module.exports = {
  parseLogEntry,
  startLogWatcher: logWatcher.start,
  stopLogWatcher: logWatcher.stop,
};
