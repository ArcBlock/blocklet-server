const { EventEmitter } = require('events');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { Op } = require('sequelize');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet-passport');

const Cron = require('@abtnode/cron');
const { PASSPORT_STATUS, PASSPORT_LOG_ACTION } = require('@abtnode/constant');

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const validatePaging = (paging = {}) => {
  const page = Math.max(1, parseInt(paging.page, 10) || DEFAULT_PAGE);
  const pageSize = Math.max(1, Math.min(100, parseInt(paging.pageSize, 10) || DEFAULT_PAGE_SIZE));
  return { page, pageSize };
};

class PassportAPI extends EventEmitter {
  constructor({ states, teamManager, nodeAPI, teamDid }) {
    super();

    this.states = states;
    this.teamManager = teamManager;
    this.node = nodeAPI;
    this.teamDid = teamDid;
    this.scheduler = Cron.init({
      context: {},
      jobs: [],
      onError: (error, name1) => {
        logger.error('Failed to add job to scheduler', { error, name1 });
      },
    });
  }

  async createPassportLog(teamDid, data, req) {
    try {
      const passportLogState = await this.teamManager.getPassportLogState(teamDid);

      const operatorIp = req ? getRequestIP(req) : data?.operatorIp;
      const operatorUa = req ? req.get('user-agent') : data?.operatorUa;
      const operatorDid = data?.operatorDid || '';

      const passportLog = await passportLogState.create({
        ...data,
        operatorIp: operatorIp || '',
        operatorUa: operatorUa || '',
        operatorDid: operatorDid || '',
      });

      return passportLog;
    } catch (error) {
      logger.error('Failed to create passport log', { error });
      return null;
    }
  }

  async getPassportRoleCounts({ teamDid }) {
    const roles = await this.teamManager.getRoles(teamDid);
    const passportState = await this.teamManager.getPassportState(teamDid);
    const names = ['$all', ...roles.map((x) => x.name)];

    return Promise.all(
      names.map(async (name) => {
        const count = await passportState.filterCount(name === '$all' ? {} : { role: name });
        return { key: name, value: count };
      })
    );
  }

  async getPassportsByRole({ teamDid, query, paging }) {
    const passportState = await this.teamManager.getPassportState(teamDid);

    const { page, pageSize } = validatePaging(paging);

    const where = query;
    if (query.role === '$all' || !query.role) {
      // 只展示非 Org passport
      const roles = await this.teamManager.getRoles(teamDid);
      const queryRoles = roles.filter((x) => !x.orgId).map((x) => x.name);
      where.role = {
        [Op.in]: queryRoles,
      };
    }

    const result = await passportState.passports(where, { issuanceDate: -1 }, { pageSize, page });
    return { passports: result.list, paging: result.paging };
  }

  async getPassportLogs({ teamDid, query, paging }) {
    const passportLogState = await this.teamManager.getPassportLogState(teamDid);
    const { page, pageSize } = validatePaging(paging);
    const result = await passportLogState.relatedLogs(query, { createdAt: -1 }, { pageSize, page });
    return { passportLogs: result.list, paging: result.paging };
  }

  async getRelatedPassports({ teamDid, passportId, paging }) {
    const passportState = await this.teamManager.getPassportState(teamDid);
    const { page, pageSize } = validatePaging(paging);
    const result = await passportState.relatedPassports(passportId, { issuanceDate: -1 }, { pageSize, page });
    return { passports: result.list, paging: result.paging };
  }

  async updatePassport(teamDid) {
    const passportState = await this.teamManager.getPassportState(teamDid);

    const expiredList = await passportState.findExpiredList({});
    if (expiredList.length) {
      await Promise.all(
        expiredList.map(async (passport) => {
          await passportState.updatePassportStatus(passport.id, PASSPORT_STATUS.EXPIRED);
          logger.info('update passport status to expired', { passportId: passport.id });

          await this.createPassportLog(teamDid, {
            passportId: passport.id,
            action: PASSPORT_LOG_ACTION.EXPIRED,
            operatorIp: '',
            operatorUa: '',
            operatorDid: this.teamDid,
            metadata: {
              action: 'System',
              from: 'scheduler',
            },
          });
        })
      );
    }
  }

  async updatePassportExpire(nodeDid) {
    await this.updatePassport(nodeDid);

    // Process blocklets in paginated batches to avoid loading all records at once
    // Memory-efficient: only loads one batch at a time (100 records) instead of all 10K
    await this.states.blocklet.forEachBatch({
      projection: { appPid: 1 },
      batchSize: 100,
      onBatch: async (blocklets) => {
        await Promise.all(blocklets.filter(({ appPid }) => appPid).map(({ appPid }) => this.updatePassport(appPid)));
      },
    });
  }

  getCron(nodeDid) {
    const updatePassportExpire = this.updatePassportExpire.bind(this);

    return {
      name: 'check-passport-expire',
      time: '0 0 * * * *',
      fn: async () => {
        logger.info('check passport expire', { nodeDid });
        await updatePassportExpire(nodeDid).catch((error) => {
          logger.error('Failed to update passport expire', { error });
        });
      },
      options: { runOnInit: false },
    };
  }
}

module.exports = PassportAPI;
