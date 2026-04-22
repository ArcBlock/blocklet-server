const logger = require('@abtnode/logger')('@abtnode/core:sender:api');
const { ROLES, PASSPORT_STATUS, NOTIFICATION_SEND_CHANNEL } = require('@abtnode/constant');
const BaseSender = require('../base');

class WalletSender extends BaseSender {
  async send(params, data = {}) {
    const {
      id,
      title,
      description,
      nodeInfo,
      node,
      receiver,
      actions,
      attachments,
      message,
      appInfo,
      entityType,
      entityId,
      source,
      teamDid,
    } = data;

    try {
      const _message = message ?? {
        id,
        title,
        body: description,
        actions,
        attachments,
        appInfo,
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
        ...(source ? { source } : {}),
      };

      let to = [];

      if (receiver) {
        to = Array.isArray(receiver) ? receiver : [receiver];
      } else {
        const { users } = await node.getUsers({
          teamDid: nodeInfo.did,
          paging: { pageSize: 100 },
          query: { includePassports: true },
        });

        to = users
          .filter(
            (x) =>
              x.approved &&
              (x.passports || []).some(
                (y) => [ROLES.OWNER, ROLES.ADMIN].includes(y.name) && y.status === PASSPORT_STATUS.VALID
              )
          )
          .map((x) => x.did);
      }

      if (!to.length) {
        return;
      }

      // @FIXME: liushuang 感觉这里不需要创建 notification，只需要发送消息到 wallet 即可
      await node.createNotification({
        teamDid: teamDid || nodeInfo.did,
        ..._message,
        receiver: to,
        channels: [NOTIFICATION_SEND_CHANNEL.WALLET],
      });
    } catch (error) {
      delete error.request;
      delete error.response;
      delete error.config;
      logger.error('failed to push notification to wallet', { error });
    }
  }
}

WalletSender.type = 'wallet';

module.exports = WalletSender;
