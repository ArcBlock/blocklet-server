const Notification = require('@blocklet/sdk/lib/util/send-notification');

async function sendToUser(userDid, notification, { req }) {
  const { wallet } = await req.getBlockletInfo();
  const notificationRes = await Notification.sendToUser(
    userDid,
    notification,
    {
      appDid: wallet.address,
      appSk: wallet.secretKey,
    },
    process.env.ABT_NODE_SERVICE_PORT
  );
  return notificationRes;
}

module.exports = {
  sendToUser,
};
