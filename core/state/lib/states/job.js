const { NOTIFICATION_SEND_CHANNEL } = require('@abtnode/constant');
const dayjs = require('@abtnode/util/lib/dayjs');
const { Op, Sequelize } = require('sequelize');
const { CustomError } = require('@blocklet/error');

const BaseState = require('./base');

// 根据 channel 映射对于的查询类别
const CHANNEL_MAP = {
  [NOTIFICATION_SEND_CHANNEL.WALLET]: 'send-notification-wallet',
  [NOTIFICATION_SEND_CHANNEL.PUSH]: 'send-notification-push',
  [NOTIFICATION_SEND_CHANNEL.EMAIL]: 'send-notification-email',
  [NOTIFICATION_SEND_CHANNEL.WEBHOOK]: 'send-notification-webhook',
};

/**
 * @extends BaseState<import('@abtnode/models').JobState>
 */
class Job extends BaseState {
  async getPendingNotifications({ teamDids = [], channels = [], createdAt = '', isServer = false }) {
    if (!teamDids.length || !channels.length) {
      throw new CustomError(400, 'teamDids and channels are required');
    }
    let startTime = createdAt;
    if (!startTime) {
      startTime = dayjs().subtract(1, 'hours').toDate();
    }

    // 过滤有效 channel，获取对应的 queue 名称
    const validChannels = channels.filter((channel) => CHANNEL_MAP[channel]);
    const queueNames = validChannels.map((channel) => CHANNEL_MAP[channel]);

    // 构建 entityId 查询条件
    // isServer 为 true 时，使用 COALESCE 查询 entityId 在 teamDids 中或为空（null/''）的记录
    // isServer 为 false 时，直接查询 entityId 在 teamDids 中的记录，索引利用率最高
    const entityIdCondition = isServer
      ? Sequelize.where(Sequelize.fn('COALESCE', Sequelize.col('entityId'), ''), { [Op.in]: [...teamDids, ''] })
      : { entityId: { [Op.in]: teamDids } };

    // 单次查询，使用 GROUP BY 获取所有 channel 的统计
    const results = await this.model.findAll({
      attributes: ['queue', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      where: {
        queue: { [Op.in]: queueNames },
        ...(isServer ? { [Op.and]: entityIdCondition } : entityIdCondition),
        createdAt: { [Op.gte]: startTime },
      },
      group: ['queue'],
      raw: true,
    });

    // 将结果映射回 channel 名称，确保所有请求的 channel 都有返回值
    return validChannels.reduce((acc, channel) => {
      const queueName = CHANNEL_MAP[channel];
      const row = results.find((r) => r.queue === queueName);
      acc[channel] = row ? Number(row.count) : 0;
      return acc;
    }, {});
  }
}

module.exports = Job;
