export const NODE_SERVICES = /* #__PURE__ */ Object.freeze({
  AUTH: 'auth',
});

export const NODE_MODES = /* #__PURE__ */ Object.freeze({
  PRODUCTION: 'production',
  DEBUG: 'debug',
  MAINTENANCE: 'maintenance',
  SERVERLESS: 'serverless',
});

export const DEFAULT_DESCRIPTION = 'Web Interface to manage your Blocklet Server';

export const NODE_MAINTAIN_PROGRESS = /* #__PURE__ */ Object.freeze({
  SETUP: 'setup', // backup
  INSTALLING: 'installing',
  VERIFYING: 'verifying',
  RESTARTING: 'restarting',
  CLEANUP: 'cleanup',
  COMPLETE: 'complete',
  ROLLBACK: 'rollback',
});

export const NODE_PACKAGE_NAME = '@abtnode/cli'; // deprecated in 1.6.0
export const NODE_COMMAND_NAME = 'abtnode'; // deprecated in 1.6.0
export const NODE_DATA_DIR_NAME = '_abtnode';

export const PROCESS_NAME_DAEMON = 'abt-node-daemon';
export const PROCESS_NAME_PROXY = 'abt-node-db-hub';
export const PROCESS_NAME_UPDATER = 'abt-node-updater';
export const PROCESS_NAME_SERVICE = 'abt-node-service';
export const PROCESS_NAME_ROUTER = 'abt-node-router';
export const PROCESS_NAME_LOG_ROTATE = 'abt-node-log-rotate';
export const PROCESS_NAME_EVENT_HUB = 'abt-node-event-hub';
export const PROCESS_NAME_PM2_EVENT_HUB = 'abt-node-pm2-event-hub';
export const PROCESS_NAME_ORPHAN_CLEANUP = 'abt-node-orphan-cleanup';

// Process script paths for orphan detection
export const DAEMON_SCRIPT_PATH = 'cli/lib/process/daemon.js';
export const SERVICE_SCRIPT_PATH = 'cli/lib/process/service.js';

// Orphan process cleanup settings
export const ORPHAN_CHECK_DELAY = 60 * 1000; // 60 seconds - delay before checking for orphan processes
export const ORPHAN_MIN_UPTIME = 60; // 60 seconds - minimum process uptime to be considered orphan

export const DISK_ALERT_THRESHOLD_PERCENT = 80;

export const SERVER_STATUS = {
  RUNNING: 1,
  STOPPED: 2,
  START_FROM_CRASH: 3,
};

export const LOG_RETAIN_IN_DAYS = 60;
export const ABT_NODE_ANALYTICS_RETAIN_IN_DAYS = 90;

export const DAEMON_MAX_MEM_LIMIT_IN_MB = 800;
export const BLOCKLET_MAX_MEM_LIMIT_IN_MB = 800;
