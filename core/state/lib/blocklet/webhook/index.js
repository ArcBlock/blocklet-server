const pick = require('lodash/pick');
const pickBy = require('lodash/pickBy');
const get = require('lodash/get');
const { EventEmitter } = require('events');
const { EVENTS } = require('@abtnode/constant');
const { isAllowedReferer, isAllowedURL } = require('@abtnode/util/lib/ssrf-protector');
const { API_VERSION, STATUS } = require('./util');
const { generateWebhookSecret } = require('./signature');
const endpointQueueInit = require('./queues');

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const ALLOWED_UPDATE_FIELDS = ['url', 'description', 'metadata', 'status', 'enabledEvents'];

const validatePaging = (paging = {}) => {
  const page = Math.max(1, parseInt(paging.page, 10) || DEFAULT_PAGE);
  const pageSize = Math.max(1, Math.min(100, parseInt(paging.pageSize, 10) || DEFAULT_PAGE_SIZE));
  return { page, pageSize };
};

const getUserDid = (context) => get(context, 'user.did', '');

const maskSecret = (secret) => {
  if (!secret) return '';
  return `${secret.slice(0, 8)}****`;
};

class WebhooksAPI extends EventEmitter {
  constructor({ states, teamManager, teamAPI }) {
    super();

    this.states = states;
    this.teamManager = teamManager;
    this.cache = new Map();
    this.TTL = 5 * 60 * 1000;

    const { webhookEndpointQueue } = endpointQueueInit.init({ states, teamManager, teamAPI });
    this.webhookEndpointQueue = webhookEndpointQueue;
  }

  async getUserInfo(userDid, teamDid, serverDid) {
    const cacheKey = userDid;
    const now = Date.now();

    const cached = this.cache.get(cacheKey);
    if (cached && now - cached.timestamp < this.TTL) {
      return cached.data;
    }

    try {
      let state = await this.teamManager.getUserState(teamDid);
      let fullUser = await state.getUser(userDid);

      if (!fullUser && teamDid !== serverDid) {
        state = await this.teamManager.getUserState(serverDid);
        fullUser = await state.getUser(userDid);
      }

      const userInfo = {
        did: userDid,
        fullName: fullUser?.fullName || '',
        avatar: fullUser?.avatar || '',
      };

      if (fullUser) {
        this.cache.set(cacheKey, { timestamp: now, data: userInfo });
      }

      return userInfo;
    } catch (err) {
      console.error(err);
      return { did: userDid, fullName: '', avatar: '' };
    }
  }

  async createWebhookEndpoint({ teamDid, input }, context) {
    if (!teamDid || !input) {
      throw new Error('Missing required parameters');
    }

    if (context?.referer) {
      const { host = '' } = context || {};
      if (!isAllowedReferer(context.referer, host)) {
        throw new Error('Invalid request');
      }
    }

    if (!(await isAllowedURL(input.url))) {
      throw new Error('Invalid parameter: internal');
    }

    const { webhookEndpointState } = await this.teamManager.getWebhookState(teamDid);
    const raw = pick(input, ALLOWED_UPDATE_FIELDS);

    const exist = await webhookEndpointState.findOne({ where: { url: raw.url } });
    if (exist) {
      throw new Error('webhook endpoint with same url already exist');
    }

    raw.apiVersion = API_VERSION;
    raw.status = raw.status || 'enabled';

    raw.createdBy = getUserDid(context);
    raw.updatedBy = getUserDid(context);

    const result = await webhookEndpointState.create(raw);
    return result;
  }

  async getWebhookEndpoint({ teamDid, id }) {
    if (!id || !teamDid) {
      throw new Error('Missing required parameters');
    }

    const info = await this.states.node.read();

    const { webhookEndpointState } = await this.teamManager.getWebhookState(teamDid);

    const data = await webhookEndpointState.findOne({ where: { id } });

    data.createUser = await this.getUserInfo(data.createdBy, teamDid, info.did);
    data.updateUser = await this.getUserInfo(data.updatedBy, teamDid, info.did);
    data.secret = maskSecret(data.secret);

    return { data };
  }

  async updateWebhookEndpoint({ teamDid, id, data }, context) {
    if (!id || !teamDid) {
      throw new Error('Missing required parameters');
    }

    const { webhookEndpointState } = await this.teamManager.getWebhookState(teamDid);

    const updates = pick(data, ALLOWED_UPDATE_FIELDS);
    updates.updatedBy = getUserDid(context);

    if (updates.url) {
      if (context?.referer) {
        const { host = '' } = context || {};
        if (!isAllowedReferer(context.referer, host)) {
          throw new Error('Invalid request');
        }
      }

      if (!(await isAllowedURL(data.url))) {
        throw new Error('Invalid parameter: internal');
      }
    }

    const result = await webhookEndpointState.updateWebhook(id, updates);
    return result;
  }

  async deleteWebhookEndpoint({ teamDid, id }) {
    const { webhookEndpointState } = await this.teamManager.getWebhookState(teamDid);

    const result = await webhookEndpointState.deleteWebhook(id);
    return result;
  }

  async getWebhookEndpoints({ teamDid, paging }) {
    if (!teamDid) {
      throw new Error('Missing required parameter: did');
    }

    const info = await this.states.node.read();

    const { page, pageSize } = validatePaging(paging);
    const { webhookEndpointState } = await this.teamManager.getWebhookState(teamDid);

    const list = await webhookEndpointState.list(page, pageSize, {});

    const result = list.list.map((item) => {
      return {
        ...item,
        secret: maskSecret(item.secret),
        createUser: this.getUserInfo(item.createdBy, teamDid, info.did),
        updateUser: this.getUserInfo(item.updatedBy, teamDid, info.did),
      };
    });

    list.list = await Promise.all(result);

    return list;
  }

  async getWebhookAttempts({ teamDid, input, paging }) {
    if (!teamDid) {
      throw new Error('Missing required parameter: teamDid');
    }

    const { page, pageSize } = validatePaging(paging);
    const { webhookAttemptState } = await this.teamManager.getWebhookState(teamDid);

    const where = pickBy(input, (value) => value);

    const list = await webhookAttemptState.list(page, pageSize, where);
    return list;
  }

  async retryWebhookAttempt({ eventId, webhookId, attemptId, teamDid }, context) {
    const { webhookAttemptState } = await this.teamManager.getWebhookState(teamDid);

    const result = await webhookAttemptState.insert({
      eventId,
      webhookId,
      status: STATUS.PENDING,
      retryCount: 1,
      responseStatus: 200,
      responseBody: {},
      triggeredBy: getUserDid(context),
      triggeredFrom: attemptId,
    });

    const emitResult = async () => {
      return {
        teamDid,
        ...(await webhookAttemptState.findOne({ eventId, webhookId, id: result.id })),
      };
    };

    const pushEmitter = this.webhookEndpointQueue.push({
      eventId,
      webhookId,
      appDid: teamDid,
      attemptId: result.id,
      triggeredBy: getUserDid(context),
      triggeredFrom: attemptId,
    });

    pushEmitter.once('finished', async () => {
      this.emit(EVENTS.WEBHOOK_ATTEMPT, { ...(await emitResult()) });
    });
    pushEmitter.once('failed', async () => {
      this.emit(EVENTS.WEBHOOK_ATTEMPT, { ...(await emitResult()) });
    });

    return result;
  }

  async regenerateWebhookEndpointSecret({ teamDid, id }, context) {
    const { webhookEndpointState } = await this.teamManager.getWebhookState(teamDid);
    const doc = await webhookEndpointState.findOne({ where: { id } });
    if (!doc) {
      throw new Error('webhook endpoint not found');
    }

    const newSecret = generateWebhookSecret();
    await webhookEndpointState.updateWebhook(id, { secret: newSecret, updatedBy: getUserDid(context) });
    return newSecret;
  }
}

module.exports = WebhooksAPI;
