const { WEBHOOK_CONSECUTIVE_FAILURES_THRESHOLD, WELLKNOWN_BLOCKLET_ADMIN_PATH } = require('@abtnode/constant');
const logger = require('@abtnode/logger')('@abtnode/core:webhook:queues');
const axios = require('@abtnode/util/lib/axios');
const { Op } = require('sequelize');

const createQueue = require('../../util/queue');
const { getWebhookJobId, STATUS } = require('./util');
const { createWebhookSignature } = require('./signature');

const MAX_RETRY_COUNT = 4; // 初始 1 次 + 3 次重试
const RETRY_DELAYS = [10, 60, 300]; // 秒：10s → 60s → 300s
const AXIOS_TIMEOUT = 1000 * 60 * 3;

const createWebhookEndpointQueue = ({ states, teamManager, teamAPI }) => {
  const updateWebhookEndpointState = async ({ webhook, teamDid, consecutiveFailures, webhookEndpointState }) => {
    try {
      if (!webhook.url) {
        logger.warn('Webhook not found', { webhook });
        return;
      }

      const updates = {
        metadata: {
          ...(webhook.metadata || {}),
          consecutiveFailures,
        },
      };
      if (consecutiveFailures >= WEBHOOK_CONSECUTIVE_FAILURES_THRESHOLD) {
        updates.status = 'disabled';
        teamAPI
          .createWebhookDisabledNotification({
            teamDid,
            webhook: {
              url: webhook.url,
              enabled: false,
              consecutiveFailures,
            },
            action: `${WELLKNOWN_BLOCKLET_ADMIN_PATH}/integrations/webhooks`,
          })
          .catch((err) => {
            logger.error('create webhook disabled notification error', err);
          });
      }

      await webhookEndpointState.updateWebhook(webhook.id, updates);
    } catch (err) {
      logger.error('update webhook endpoint state error', err, { consecutiveFailures, webhook });
    }
  };
  // https://stripe.com/docs/webhooks
  /**
   *
   * @param {*} job eventId: event.id, webhookId: webhook.id, appDid: job.appDid, attemptId?:string
   *
   * @returns
   */
  const handleWebhookEndpoint = async (job) => {
    logger.info('handle webhook endpoint', job);

    if (!job.appDid) {
      logger.warn('appDid is not found', job);
      return;
    }

    const webhookState = await teamManager.getWebhookState(job.appDid);
    const { webhookEndpointState, webhookAttemptState, webhookEventState } = webhookState;

    const event = await webhookEventState.findOne({ where: { id: job.eventId } });
    if (!event) {
      logger.warn('Event not found', job);
      return;
    }

    const webhook = await webhookEndpointState.findOne({ where: { id: job.webhookId } });
    if (!webhook) {
      logger.warn('webhook not found on attempt', job);
      return;
    }

    if (webhook.status !== 'enabled') {
      logger.warn('webhook disabled on attempt', job);
      return;
    }

    const lastRetryCount = await webhookAttemptState.max('retryCount', {
      where: { eventId: event.id, webhookId: webhook.id },
    });

    const retryCount = lastRetryCount ? +lastRetryCount + 1 : 1;

    try {
      // verify similar to component call, but supports external urls
      let response;
      try {
        const headers = {};
        if (webhook.secret) {
          const timestamp = Math.floor(Date.now() / 1000);
          headers['X-Webhook-Signature'] = createWebhookSignature(webhook.secret, event.request, timestamp);
        }
        response = await axios.post(webhook.url, event.request, { timeout: AXIOS_TIMEOUT, headers });
        updateWebhookEndpointState({ webhook, teamDid: job.appDid, consecutiveFailures: 0, webhookEndpointState });
      } catch (err) {
        // 需要更新 webhook 的 consecutiveFailures
        const consecutiveFailures = (webhook.metadata?.consecutiveFailures || 0) + 1;
        updateWebhookEndpointState({ webhook, teamDid: job.appDid, consecutiveFailures, webhookEndpointState });
        throw err;
      }

      if (job.attemptId) {
        await webhookAttemptState.update(
          { id: job.attemptId },
          {
            status: STATUS.SUCCEEDED,
            responseStatus: response.status,
            responseBody: response.data || {},
            retryCount,
            triggeredBy: job.triggeredBy,
            triggeredFrom: job.triggeredFrom,
          }
        );
      } else {
        await webhookAttemptState.insert({
          eventId: event.id,
          webhookId: webhook.id,
          status: STATUS.SUCCEEDED,
          responseStatus: response.status,
          responseBody: response.data || {},
          retryCount,
          triggeredBy: job.triggeredBy,
          triggeredFrom: job.triggeredFrom,
        });
      }

      logger.info('WebhookAttempt created successfully', { eventId: event.id, webhookId: webhook.id });

      const newPendingCount = Math.max(0, event.pendingWebhooks - 1);
      await webhookEventState.update({ id: event.id }, { pendingWebhooks: newPendingCount });
      logger.info('pendingWebhooks decremented', { eventId: event.id, newCount: event.pendingWebhooks });

      logger.info('webhook attempt success', { ...job, retryCount });
    } catch (err) {
      logger.warn('webhook attempt error', { ...job, retryCount, message: err.message });

      if (job.attemptId) {
        await webhookAttemptState.update(
          { id: job.attemptId },
          {
            status: STATUS.FAILED,
            responseStatus: err.response?.status || 500,
            responseBody: err.response?.data || {},
            retryCount,
            triggeredBy: job.triggeredBy,
            triggeredFrom: job.triggeredFrom,
          }
        );
      } else {
        await webhookAttemptState.insert({
          eventId: event.id,
          webhookId: webhook.id,
          status: STATUS.FAILED,
          responseStatus: err.response?.status || 500,
          responseBody: err.response?.data || {},
          retryCount,
          triggeredBy: job.triggeredBy,
          triggeredFrom: job.triggeredFrom,
        });
      }

      logger.info('Failed WebhookAttempt created', { eventId: event.id, webhookId: webhook.id });

      // reschedule next attempt with exponential backoff
      if (retryCount < MAX_RETRY_COUNT) {
        const delayIndex = Math.min(retryCount - 1, RETRY_DELAYS.length - 1);
        const delaySeconds = RETRY_DELAYS[delayIndex];

        // eslint-disable-next-line no-use-before-define
        webhookEndpointQueue.push({
          id: getWebhookJobId(event.id, webhook.id),
          job: { eventId: event.id, webhookId: webhook.id, appDid: job.appDid },
          persist: true,
          delay: delaySeconds,
        });

        logger.info('scheduled webhook retry', { ...job, retryCount, delaySeconds });
      } else {
        const newPendingCount = Math.max(0, event.pendingWebhooks - 1);
        await webhookEventState.update({ id: event.id }, { pendingWebhooks: newPendingCount });

        logger.info('Max retries reached, pendingWebhooks decremented', {
          eventId: event.id,
          newCount: event.pendingWebhooks,
        });
      }
    }
  };

  const webhookEndpointQueue = createQueue({
    daemon: true,
    model: states.job,
    name: 'eventbus-endpoint-queue',
    onJob: handleWebhookEndpoint,
    options: {
      concurrency: 5,
      enableScheduledJob: true,
    },
  });

  webhookEndpointQueue.on('failed', ({ id, job, error }) => {
    logger.error('webhook job failed', { id, job, error });
  });

  return webhookEndpointQueue;
};

const createWebhookEventQueue = ({ states, teamManager }, webhookEndpointQueue) => {
  const handleWebhookEvent = async (job) => {
    logger.info('handle webhook event', job);

    if (!job.appDid) {
      logger.warn('appDid is not found', job);
      return;
    }

    const webhookState = await teamManager.getWebhookState(job.appDid);
    const { webhookEndpointState, webhookAttemptState, webhookEventState } = webhookState;

    const event = await webhookEventState.findOne({ where: { id: job.eventId } });
    if (!event) {
      logger.warn('Event not found', job);
      return;
    }

    if (!event.pendingWebhooks) {
      logger.warn('Event already processed', job);
      return;
    }

    const webhooks = await webhookEndpointState.find({ where: { status: 'enabled' } });
    const eventWebhooks = webhooks.filter((webhook) =>
      webhook.enabledEvents.some(
        (enabledEvent) => enabledEvent.type === event.type && enabledEvent.source === event.source
      )
    );

    if (eventWebhooks.length === 0) {
      logger.info('no webhook endpoint for event', job);
      await webhookEventState.update({ id: event.id }, { pendingWebhooks: 0 });
      return;
    }

    await webhookEventState.update({ id: event.id }, { pendingWebhooks: eventWebhooks.length });
    logger.info(`Updated event ${event.id} with ${eventWebhooks.length} pending webhooks`);

    eventWebhooks.forEach(async (webhook) => {
      const attemptCount = await webhookAttemptState.count({
        where: {
          eventId: event.id,
          webhookId: webhook.id,
          responseStatus: { [Op.gte]: 200, [Op.lt]: 300 },
        },
      });

      // we should only push webhook if it's not successfully attempted before
      if (attemptCount === 0) {
        const jobId = getWebhookJobId(event.id, webhook.id);
        const exist = await webhookEndpointQueue.get(jobId);

        if (!exist) {
          logger.info(`Scheduling attempt for event ${event.id} and webhook ${webhook.id}`, job);
          webhookEndpointQueue.push({
            id: jobId,
            job: { eventId: event.id, webhookId: webhook.id, appDid: job.appDid },
            persist: false,
          });
        }
      }
    });

    logger.info(`Finished handling event ${job.eventId}`);
  };

  const eventQueue = createQueue({
    daemon: true,
    model: states.job,
    name: 'eventbus-event-queue',
    onJob: handleWebhookEvent,
    options: {
      concurrency: 5,
    },
  });

  eventQueue.on('failed', ({ id, job, error }) => {
    logger.error('event job failed', { id, job, error });
  });

  return eventQueue;
};

module.exports = {
  init: ({ states, teamManager, teamAPI }) => {
    const webhookEndpointQueue = createWebhookEndpointQueue({ states, teamManager, teamAPI });
    const webhookEventQueue = createWebhookEventQueue({ states, teamManager }, webhookEndpointQueue);

    return { webhookEndpointQueue, webhookEventQueue };
  },
};
