const { DEVICE_HEADERS } = require('@blocklet/constant');

const getDeviceData = ({ req }) => {
  if (!req) {
    return null;
  }

  const clientName = req.get(DEVICE_HEADERS.CLIENT_NAME);
  const deviceMessageToken = req.get(DEVICE_HEADERS.MESSAGE_TOKEN);
  const deviceId = req.get(DEVICE_HEADERS.DEVICE_ID);
  const walletDeviceMessageToken = req.get(DEVICE_HEADERS.WALLET_MESSAGE_TOKEN);
  const walletDeviceId = req.get(DEVICE_HEADERS.WALLET_DEVICE_ID);

  return {
    clientName,
    id: deviceId || walletDeviceId,
    messageToken: deviceMessageToken || walletDeviceMessageToken,
  };
};

module.exports = {
  getDeviceData,
};
