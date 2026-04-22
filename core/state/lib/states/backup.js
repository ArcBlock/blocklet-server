const { Joi } = require('@arcblock/validator');
const { BACKUPS } = require('@abtnode/constant');
const { CustomError } = require('@blocklet/error');

const { Op } = require('sequelize');
const dayjs = require('@abtnode/util/lib/dayjs');

const BaseState = require('./base');
const {
  validateBackupSuccess,
  validateBackupFail,
  validateBackupStart,
  validateBackupProgress,
} = require('../validators/backup.js');

const validateBackup = Joi.object({
  appPid: Joi.DID(),
  userDid: Joi.DID(),
  // 备份策略: 0 表示自动，1 表示手动，建议使用常量
  strategy: Joi.number().valid(0, 1).default(0).optional(),

  // 形如, /User/allen/blocklet-server/data/discuss-kit
  sourceUrl: Joi.string().required(),

  // 备份文件存储在哪？本地还是 spaces 的那个位置？
  // 如果存储在 Spaces, 形如: https://bbqaw5mgxc6fnihrwqcejcxvukkdgkk4anwxwk5msvm.did.abtnet.io/app/space/zNKhe8jwgNZX2z7ZUfwNddNECxSe3wyg7VtS
  // 如果存储在 Local，形如: /User/allen/discuss-kit
  target: Joi.string().valid('Spaces', 'Local').optional().default('Spaces'),
  targetName: Joi.string().required(),
  targetUrl: Joi.string().optional().allow('').default(''),

  createdAt: Joi.string()
    .optional()
    .default(() => new Date().toISOString()),
  updatedAt: Joi.string().optional().default('').allow(''),

  // 0 表示成功了，建议使用常量表示，默认是 1 表示错误的, null 表示备份中
  status: Joi.number().optional().allow(BACKUPS.STATUS.PROGRESS),
  // 发生错误的时候可以用来存储错误下信息
  message: Joi.string().optional().default('').allow(''),

  progress: Joi.number().optional(),
});

/**
 * @extends BaseState<import('@abtnode/models').BackupState>
 */
class BackupState extends BaseState {
  /**
   * @param {Pick<import('@abtnode/models').BackupState, 'appPid' | 'userDid' | 'strategy' | 'sourceUrl' | 'target'>} backup
   */
  start(backup) {
    const { error, value } = validateBackupStart.validate(backup, {
      stripUnknown: true,
      allowUnknown: true,
    });

    if (error) {
      throw new CustomError(400, error.message);
    }

    return this.insert(value);
  }

  /**
   *
   * @param {string} id - The ID of the backup.
   * @param {Pick<import('@abtnode/models').BackupState, 'progress' | 'message'>} backupProgress
   * @return {object} - The result of the validation.
   */
  progress(id, backupProgress) {
    const { error, value } = validateBackupProgress.validate(backupProgress, {
      stripUnknown: true,
      allowUnknown: true,
    });

    if (error) {
      throw new CustomError(400, error.message);
    }

    return this.update(
      { id },
      {
        $set: {
          ...value,
        },
      }
    );
  }

  /**
   * @param {string} id
   * @param {Pick<import('@abtnode/models').BackupState, 'targetUrl'>} successBackupInfo
   */
  success(id, successBackupInfo) {
    const { error, value } = validateBackupSuccess.validate(successBackupInfo, {
      stripUnknown: true,
      allowUnknown: true,
    });

    if (error) {
      throw new CustomError(400, error.message);
    }

    return this.update(
      { id },
      {
        $set: {
          ...value,
          status: BACKUPS.STATUS.SUCCEEDED,
          updatedAt: new Date().toISOString(),
          progress: 100,
        },
      }
    );
  }

  /**
   * @param {string} id
   * @param {Pick<import('@abtnode/models').BackupState, 'message'>} errorBackupInfo
   */
  fail(id, errorBackupInfo) {
    const { error, value } = validateBackupFail.validate(errorBackupInfo, {
      stripUnknown: true,
      allowUnknown: true,
    });

    if (error) {
      throw new CustomError(400, error.message);
    }

    return this.update(
      { id },
      {
        $set: {
          ...value,
          status: BACKUPS.STATUS.FAILED,
          updatedAt: new Date().toISOString(),
        },
      }
    );
  }

  /**
   * @param {import('@abtnode/models').BackupState} backup
   * @return {Promise<import('@abtnode/models').BackupState>}
   */
  // eslint-disable-next-line require-await
  async create(backup) {
    const { error, value } = validateBackup.validate(backup, {
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      throw new CustomError(400, error.message);
    }

    return this.insert(value);
  }

  /**
   * @param {{ did: string, startTime: string, endTime: string }} { did, startTime, endTime }
   * @return {Promise<Array<import('@abtnode/models').BackupState>>}
   */
  async getBlockletBackups({ did, startTime, endTime }) {
    /**
     * @type {import('sequelize').WhereOptions<import('@abtnode/models').BackupState>}
     */
    const options = {
      where: {
        appPid: did,
        createdAt: { [Op.between]: [startTime, endTime] },
      },
      order: [['createdAt', 'DESC']],
    };

    const results = await this.model.findAll(options);

    return results.map((x) => x.toJSON());
  }

  /**
   * @param {{ did: string, startTime: string, endTime: string }} options
   * @return {Promise<Array<{date: string, successCount: number, errorCount: number}>>}
   */
  getBlockletBackupSummary({ did, startTime, endTime, timezone }) {
    const { sequelize } = this.model;
    const dialect = sequelize.getDialect(); // 'postgres' 或者 'sqlite'
    let dateExpr;
    let groupExpr;

    if (dialect === 'postgres') {
      const tzTs = sequelize.fn('timezone', timezone, sequelize.col('createdAt'));
      const dayTs = sequelize.fn('date_trunc', 'day', tzTs);
      dateExpr = sequelize.fn('to_char', dayTs, 'YYYY-MM-DD');
      groupExpr = dayTs;
    } else {
      // SQLite：datetime + strftime
      // SQLite 的 datetime(col, '+X minutes') already returns text in UTC+offset
      // 计算时差: 返回与 UTC 的偏移，单位：分钟
      const offset = dayjs.tz(dayjs.utc(), timezone).utcOffset();
      groupExpr = sequelize.fn(
        'strftime',
        '%Y-%m-%d', // 提取年月日
        this.model.sequelize.fn('datetime', this.model.sequelize.col('createdAt'), `${offset} minutes`)
      );
      dateExpr = sequelize.fn('strftime', '%Y-%m-%d', groupExpr);
    }

    const options = {
      where: {
        appPid: did,
        createdAt: { [Op.between]: [startTime, endTime] },
        status: { [Op.in]: [BACKUPS.STATUS.SUCCEEDED, BACKUPS.STATUS.FAILED] },
      },
      attributes: [
        [dateExpr, 'date'],
        [sequelize.fn('sum', sequelize.literal('CASE WHEN status = 0 THEN 1 ELSE 0 END')), 'successCount'],
        [sequelize.fn('sum', sequelize.literal('CASE WHEN status != 0 THEN 1 ELSE 0 END')), 'errorCount'],
      ],
      group: [groupExpr],
      order: [[groupExpr, 'DESC']],
      raw: true,
    };

    return this.model.findAll(options);
  }
}

module.exports = BackupState;
