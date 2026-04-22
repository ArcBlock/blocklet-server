const serverJobBackoffSeconds = process.env.ABT_NODE_JOB_BACKOFF_SECONDS
  ? +process.env.ABT_NODE_JOB_BACKOFF_SECONDS
  : 600;
const isE2E = process.env.NODE_ENV === 'e2e' || ['1', 'true'].includes(process.env.IS_E2E);

const shouldJobBackoff = () => {
  if (process.env.ABT_NODE_JOB_BACKOFF_SECONDS === '0') {
    return false;
  }
  const uptime = process.uptime();
  return uptime <= serverJobBackoffSeconds;
};

module.exports = {
  serverJobBackoffSeconds,
  shouldJobBackoff,
  isE2E,
};
