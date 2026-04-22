// auto-backup interval in seconds; default 8h; override with ABT_NODE_AUTO_BACKUP_INTERVAL
const autoBackupInterval = Number(process.env.ABT_NODE_AUTO_BACKUP_INTERVAL) || 8 * 60 * 60;

export const BACKUPS = {
  STATUS: {
    PROGRESS: null,
    SUCCEEDED: 0,
    FAILED: 1,
  },
  // backup timeout is 6 hours
  TIMEOUT_HOURS: 6,
  // backup strategy
  STRATEGY: {
    // automatic backup
    AUTO: 0,
    // manual backup
    MANUAL: 1,
  },
  JOB: {
    INTERVAL: autoBackupInterval,
  },
};

export const CHECK_UPDATE = {
  STATUS: {
    PROGRESS: null,
    SUCCEEDED: 0,
    FAILED: 1,
  },
  // backup timeout is 6 hours
  TIMEOUT_HOURS: 6,
  // backup strategy
  STRATEGY: {
    // automatic backup
    AUTO: 0,
    // manual backup
    MANUAL: 1,
  },
  JOB: {
    // auto-check interval in seconds; currently 2 hours
    INTERVAL: 2 * 60 * 60,
    // 1 day
    DAY_INTERVAL: 24 * 60 * 60,
  },
};
