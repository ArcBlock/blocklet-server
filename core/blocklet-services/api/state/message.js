const BaseState = require('@abtnode/core/lib/states/base');
const { Op, Sequelize } = require('sequelize');
const logger = require('@abtnode/logger')('@abtnode/core:states');

const DEFAULT_TTL = 30; // 30 minutes
const MAX_TTL = 7200; // 7200 minutes (5 days)
const MINUTE_IN_MS = 1000 * 60;

class MessageState extends BaseState {
  insert(doc, ...args) {
    const extra = {};
    if (doc.ttl && typeof doc.ttl === 'number' && doc.ttl > 0) {
      const ttl = Math.min(doc.ttl, MAX_TTL);
      extra.expiredAt = new Date(Date.now() + MINUTE_IN_MS * ttl);
    } else if (!doc.ttl && doc.event === 'message' && doc.data?.type) {
      if (['feed', 'connect', 'passthrough'].includes(doc.data.type)) {
        extra.expiredAt = new Date(Date.now() + MINUTE_IN_MS * DEFAULT_TTL); // 30分钟后过期
      }
    }

    return super.insert(
      {
        ...doc,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...extra,
      },
      ...args
    );
  }

  prune(time) {
    const t = time || 5 * 24 * 60 * 60 * 1000; // 5 day
    return this.remove({ createdAt: { $lt: Date.now() - t } });
  }

  /**
   * 如果有设置过期时间，则删除过期的数据，
   * 如果没有设置过期时间，则清除数据的条件如下
   * 1. 创建时间早于五分钟
   * 2. event 类型为 'message'
   * 3. data.type 为 'feed', 'connect' 或 'passthrough'
   */
  async pruneExpiredData() {
    try {
      // 获取指定时间前的时间戳
      const expiryThreshold = new Date();

      // 1. 删除有 expiredAt 的记录
      const deletedExpiredData = await this.remove({
        where: {
          expiredAt: { [Op.lt]: expiryThreshold },
        },
      });

      logger.info(`message data cleanup completed: deleted ${deletedExpiredData} expired records`);

      // 2. 兼容代码，删除之前没有设置 expiredAt 的记录
      const timeAgo = new Date();
      timeAgo.setMinutes(timeAgo.getMinutes() - DEFAULT_TTL); // 设置过期时间

      const isPostgres = this.model.sequelize.getDialect() === 'postgres';

      const where = {
        createdAt: { [Op.lt]: timeAgo },
        expiredAt: { [Op.is]: null },
        event: 'message',
        [Op.and]: [
          Sequelize.literal(
            isPostgres
              ? "data->>'type' IN ('feed', 'connect', 'passthrough')"
              : "json_extract(data, '$.type') IN ('feed', 'connect', 'passthrough')"
          ),
        ],
      };

      const deletedCount = await this.remove({
        where,
      });

      logger.info(`message data cleanup completed: deleted ${deletedCount} records`);
    } catch (error) {
      logger.error('Error during message data cleanup:', error);
    }
  }
}

module.exports = MessageState;
