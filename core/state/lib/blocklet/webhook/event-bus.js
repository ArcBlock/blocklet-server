const logger = require('@abtnode/logger')('@abtnode/core:webhook:event-bus');
const { toAddress } = require('@arcblock/did');
const { BlockletStatus } = require('@blocklet/constant');

const { API_VERSION } = require('./util');
const endpointQueueInit = require('./queues');

const DEFAULT_PENDING_WEBHOOKS = 99;

const validateBlockletStatus = (blocklet, appDid) => {
  if (!blocklet) {
    logger.warn('blocklet is not found', appDid);
    return false;
  }
  if (blocklet.status !== BlockletStatus.running) {
    logger.warn('blocklet is not running', appDid);
    return false;
  }
  return true;
};

const init = ({ states, teamManager, teamAPI }) => {
  const { webhookEventQueue } = endpointQueueInit.init({ states, teamManager, teamAPI });

  const handleEventBusEvent = async (data) => {
    logger.info('init webhook event bus');

    if (!data || typeof data !== 'object') {
      logger.error('Invalid data parameter');
      return;
    }

    if (!data.event || typeof data.event !== 'object') {
      logger.error('Invalid event data');
      return;
    }

    if (!data.appDid) {
      logger.warn('appDID is not found');
      return;
    }

    const appDid = toAddress(data.appDid);
    const blocklet = await states.blocklet.getBlocklet(appDid);
    const valid = validateBlockletStatus(blocklet, data.appDid);
    if (!valid) {
      logger.warn('blocklet valid failed', data.appDid);
      return;
    }

    const { event, appInfo } = data;
    const { type, source, object_id: objectId, object_type: objectType } = event;

    const request = {
      ...event.data,
      $eventName: type,
      $sender: {
        did: appInfo?.did || blocklet?.appPid,
        pk: appInfo?.pk,
        url: appInfo?.appUrl,
        name: appInfo?.name || blocklet?.meta?.title,
      },
    };
    logger.info('create webhook event', { type, source, request });

    const { webhookEventState } = await teamManager.getWebhookState(appDid);
    try {
      const result = await webhookEventState.create({
        type,
        source,
        apiVersion: API_VERSION,
        objectId,
        objectType,
        data,
        request,
        metadata: {},
        pendingWebhooks: DEFAULT_PENDING_WEBHOOKS,
      });

      logger.info('create webhook event result', result);
      webhookEventQueue.push({ id: event.id, job: { eventId: result.id, appDid }, persist: false });
    } catch (error) {
      logger.error('Failed to create webhook event:', error);
    }
  };

  return { handleEventBusEvent };
};

module.exports = init;
