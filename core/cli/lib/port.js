const {
  PROCESS_NAME_PROXY,
  PROCESS_NAME_UPDATER,
  PROCESS_NAME_SERVICE,
  PROCESS_NAME_EVENT_HUB,
  PROCESS_NAME_PM2_EVENT_HUB,
} = require('@abtnode/constant');

const ports = {
  [PROCESS_NAME_PROXY]: 40404,
  [PROCESS_NAME_UPDATER]: 40405,
  [PROCESS_NAME_SERVICE]: 40406,
  [PROCESS_NAME_EVENT_HUB]: 40407,
  [PROCESS_NAME_PM2_EVENT_HUB]: 40411,
};

const getInternalPort = (processName) => {
  return ports[processName];
};

module.exports = { getInternalPort };
