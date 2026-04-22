const logger = require('@abtnode/logger')('@abtnode/core:webhook:index');
const { evaluateURLs } = require('@abtnode/util/lib/url-evaluation');
const checkURLAccessible = require('@abtnode/util/lib/url-evaluation/check-accessible-node');
const { EVENTS } = require('@abtnode/constant');
const isEmpty = require('lodash/isEmpty');
const { isAllowedReferer, isAllowedURL } = require('@abtnode/util/lib/ssrf-protector');

const { joinURL } = require('ufo');
const isUrl = require('is-url');
const WebHookSender = require('./sender');
const WalletSender = require('./sender/wallet');
const createQueue = require('../util/queue');
const IP = require('../util/ip');
const states = require('../states');
const { getBaseUrls } = require('../util');
const reduceQueue = require('./reduce-queue');

const getSlackUrlInfo = async ({ blockletUrl, path: actionPath = '/notifications', serverUrls: urls }) => {
  const info = [];

  if (blockletUrl) {
    info.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Use the following links to visit your Blocklet dashboard:',
      },
    });
  } else if (actionPath && actionPath.startsWith('/blocklet/')) {
    info.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Use the following links to visit the blocklet detail on your Blocklet Server dashboard:',
      },
    });
  } else {
    info.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Use the following links to visit your Blocklet Server dashboard:',
      },
    });
  }

  let url = blockletUrl;
  if (!url) {
    const priorities = await evaluateURLs(
      urls.map((item) => item.url),
      { checkAccessible: checkURLAccessible }
    );
    const priorityUrl = priorities[0].url;

    const { protocol } = new URL(priorityUrl);
    const normalized = `${priorityUrl}${actionPath}`.replace(`${protocol}//`, '').replace(/\/+/g, '/');
    url = `${protocol}//${normalized}`;
  }

  info.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Click Me',
        },
        style: 'primary',
        value: 'Click Me',
        url,
      },
    ],
  });

  return info;
};

// eslint-disable-next-line no-unused-vars
module.exports = ({ events, dataDirs, instance }) => {
  const nodeState = states.node;
  const webhookState = states.webhook;

  const updateWebHookState = async ({ id, url, enabled, consecutiveFailures }) => {
    try {
      const updateRes = await webhookState.updateWebhook(
        id,
        {
          url,
          enabled,
          consecutiveFailures,
        },
        (updated) => {
          instance.createWebhookDisabledNotification({ webhook: updated });
        }
      );
      return updateRes;
    } catch (err) {
      logger.error('update webhook state error', { err });
      throw new Error(err.message);
    }
  };

  /**
   * 安全地更新 webhook 状态，不影响主流程
   * @param {object} item - webhook item
   * @param {number} consecutiveFailures - 连续失败次数
   */
  const safeUpdateWebhookState = (item, consecutiveFailures) => {
    // 只处理需要跟踪状态的类型
    if (item.type !== 'slack' && item.type !== 'api') {
      return;
    }

    const urlParam = item.params.find((x) => x.name === 'url');
    if (!urlParam || !urlParam.value) {
      return;
    }

    // 异步更新，不等待结果，不影响主流程
    updateWebHookState({
      id: item.id,
      url: urlParam.value,
      consecutiveFailures,
    }).catch((err) => {
      logger.debug('safe update webhook state failed', { err, itemId: item.id, url: urlParam.value });
    });
  };

  const sendMessage = async ({ extra, isService, ...message } = {}) => {
    try {
      const webhookList = !isService ? await webhookState.list() : [];
      const nodeInfo = await nodeState.read();
      const { internal, external } = await IP.get();
      const baseUrls = await getBaseUrls(instance, [external, internal]);
      const senderFns = {};

      // Always send message to wallet
      webhookList.push({
        type: WalletSender.type,
      });

      if (webhookList.length) {
        for (let i = 0; i < webhookList.length; i++) {
          const item = webhookList[i];
          // 对于 slack 和 api 类型，检查是否启用
          if (item.type === 'slack' || item.type === 'api') {
            const urlParam = item.params.find((x) => x.name === 'url');
            if (!urlParam || !urlParam.value) {
              continue;
            }
            // 如果没有开启，则跳过发送
            const isEnabled = urlParam.enabled ?? true;
            if (!isEnabled) {
              logger.debug('webhook is disabled, skip sending', { type: item.type, url: urlParam.value });
              continue;
            }
          }

          if (typeof senderFns[item.type] !== 'function') {
            const senderInstance = WebHookSender.getMessageSender(item.type);
            senderFns[item.type] = senderInstance.send.bind(senderInstance);
          }
          let options = { ...message, nodeInfo, node: instance };
          if (item.type === 'slack') {
            // eslint-disable-next-line
            options.urlInfo = await getSlackUrlInfo({
              blockletUrl: message.blockletUrl,
              path: message.action,
              serverUrls: baseUrls,
            });
          } else if (item.type === WalletSender.type && !isEmpty(extra?.wallet)) {
            // 要将 logo 的 URL 拼接为完整的地址
            const { attachments } = extra.wallet ?? {};
            if (Array.isArray(attachments)) {
              const newAttachments = attachments.map((attachment) => {
                if (attachment.data.url && attachment.data.logo && !isUrl(attachment.data.log)) {
                  attachment.data.logo = joinURL(attachment.data.url, attachment.data.logo);
                  return attachment;
                }
                return attachment;
              });
              options = {
                ...options,
                ...{
                  ...extra.wallet,
                  attachments: newAttachments,
                },
              };
            }
            options = { ...options, ...extra.wallet };
          }

          try {
            // eslint-disable-next-line
            await senderFns[item.type](item.params, options);
            // 发送成功，重置失败次数
            safeUpdateWebhookState(item, 0);
          } catch (err) {
            logger.error('webhook sender error', { error: err, item });
            // 发送失败，增加失败次数
            const currentFailures = item.consecutiveFailures || 0;
            safeUpdateWebhookState(item, currentFailures + 1);
          }
        }
      }
    } catch (error) {
      logger.error('webhook queue onJob callback error', { error });
    }
  };

  const queue = createQueue({
    name: 'webhook-messages',
    model: states.job,
    daemon: true,
    options: {},
    onJob: async (job) => {
      if (job.entityType === 'webhook') {
        return;
      }
      await sendMessage(job);
    },
  });

  [EVENTS.NOTIFICATION_CREATE, EVENTS.NOTIFICATION_BLOCKLET_CREATE].forEach((event) => {
    events.on(event, async (data) => {
      const {
        id,
        title,
        description,
        severity,
        action,
        entityType,
        blockletUrl,
        entityId,
        extra,
        receiver,
        appInfo,
        ignorePush,
        message,
      } = data;
      if (
        !(await reduceQueue.acquire(
          JSON.stringify({ id, title, description, entityType, entityId, severity, action, extra })
        )) &&
        !ignorePush
      ) {
        queue.push({
          title,
          description,
          status: severity,
          action,
          entityType,
          entityId,
          blockletUrl,
          extra,
          receiver,
          id,
          appInfo,
          message,
          teamDid: data.teamDid,
          isService: EVENTS.NOTIFICATION_BLOCKLET_CREATE === event, // Service 的消息不进入 webhook 队列，避免进入队列后重复发送 webhook
        });
      }
    });
  });

  events.on(EVENTS.NODE_STARTED, async (message) => {
    await sendMessage(message);
  });
  events.on(EVENTS.NODE_STOPPED, async (message) => {
    await sendMessage(message);
  });

  const sentTextMessage = async (webhookRecord, message) => {
    const senderInstance = WebHookSender.getMessageSender(webhookRecord.type);
    await senderInstance.sendTestMessage.call(senderInstance, webhookRecord.params, message);
  };

  const createWebhook = async (webhook) => {
    try {
      const urls = webhook.params.map((item) => item.value);

      for (const url of urls) {
        // eslint-disable-next-line no-await-in-loop
        if (!(await isAllowedURL(url))) {
          throw new Error('Invalid parameter: internal');
        }
      }

      const createRes = await webhookState.create(webhook);
      // 发送测试消息，不要影响主流程
      sentTextMessage(createRes, `A ${createRes.type} integration is now *successfully added*`).catch((err) => {
        logger.warn('Failed to send test message', { err });
      });
      return createRes;
    } catch (err) {
      logger.error('Failed to create webhook', err);
      throw new Error(`Failed to create webhook: ${err.message}`);
    }
  };

  const deleteWebhook = async (id) => {
    try {
      const deleteRes = await webhookState.delete.call(webhookState, id);
      await sentTextMessage(deleteRes, `A ${deleteRes.type} integration is now *successfully removed*`);

      return deleteRes;
    } catch (err) {
      logger.error('delete webhook error', { err });
      throw new Error(err.message);
    }
  };

  const sendTestMessage = async (msg, context) => {
    const { webhookId, message } = msg;
    try {
      if (context?.referer) {
        const { host = '' } = context || {};
        if (!isAllowedReferer(context.referer, host)) {
          throw new Error('Invalid request');
        }
      }
      const webhook = webhookId ? await webhookState.findOne(webhookId) : msg.webhook;

      await sentTextMessage(webhook, message);
    } catch (error) {
      logger.error('webhook sender error', { error, msg });
      throw new Error(error.message);
    }
  };

  return {
    listSenders: WebHookSender.listSenders,
    getMessageSender: WebHookSender.getMessageSender,
    create: createWebhook,
    delete: deleteWebhook,
    updateWebHookState,
    sendTestMessage,
  };
};
