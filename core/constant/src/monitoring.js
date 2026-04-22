// report stats once every 10s
export const MONITOR_RECORD_INTERVAL_SEC = 20;

// retain current-day data; reports 8640 times per day
export const MONITOR_HISTORY_LENGTH = 86400 / MONITOR_RECORD_INTERVAL_SEC;

export const FEDERATED = {
  SYNC_LIMIT: 30,
};
