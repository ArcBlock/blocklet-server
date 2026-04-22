const { withQuery, getQuery } = require('ufo');
const isUrl = require('is-url');
const cloneDeep = require('lodash/cloneDeep');

/**
 *
 * 为外部 URL 添加 UTM 追踪参数
 * @param {string} url - 原始 URL 地址
 * @param {{
 *  source?: string;
 *  medium?: string;
 *  campaign?: string;
 *  content?: string;
 * }} utm - 导航区域，默认是 notification 的  utm
 * @param {string} componentDid - 组件 DID
 * @returns {string} 添加 UTM 参数后的 URL
 * @see https://team.arcblock.io/comment/discussions/7504c5ce-7453-4223-a539-27620efcf38e#ffed52a7-916e-4586-aa78-a29a377804e6
 *
 */
function getUTMUrl(url, utm, componentDid) {
  try {
    if (!isUrl(url)) {
      return url;
    }

    const existsQueryParams = getQuery(url);

    // 根据 componentDid 设置默认的 emailUTMSource
    const getDefaultUTMSource = (_componentDid) => {
      const transactionalEmailComponents = [
        'z2qaCNvKMv5GjouKdcDWexv6WqtHbpNPQDnAk', // Payment Kit
        'z8iZkFBbrVQxZHvcWWB3Sa2TrfGmSeFz9MSU7', // Launcher
        'z2qaGosS3rZ7m5ttP3Nd4V4qczR9TryTcRV4p', // DID Names
        'z8iZnaYxnkMD5AKRjTKiCb8pQr1ut8UantAcf', // DID Spaces
      ];

      return transactionalEmailComponents.includes(_componentDid) ? 'transactional_email' : 'activity_notification';
    };

    const emailUTMSource = process.env.EMAIL_UTM_SOURCE || getDefaultUTMSource(componentDid);
    const emailUTMMedium = process.env.EMAIL_UTM_MEDIUM || 'email';
    const emailUTMCampaign = process.env.EMAIL_UTM_CAMPAIGN || 'default';
    const emailUTMContent = process.env.EMAIL_UTM_CONTENT || 'email_body';
    const queryParams = {
      // 自身站点的 hostname
      utm_source: utm?.source || emailUTMSource,
      // 默认为 email
      utm_medium: utm?.medium || emailUTMMedium,
      // 全局导航统一标签
      utm_campaign: utm?.campaign || emailUTMCampaign,
      // 目标站点标识
      utm_content: utm?.content || emailUTMContent,
      ...existsQueryParams,
    };

    return withQuery(url, queryParams);
  } catch (error) {
    console.error('Failed to generate UTM URL:', error);
    return url;
  }
}

/**
 * 将 notification 中的 url 添加 UTM 参数
 * @param {import('@blocklet/sdk/lib/types/notification').TNotification} notification
 * @returns {import('@blocklet/sdk/lib/types/notification').TNotification} 处理后的 notification 对象
 */
function attachNotificationUTM(notification) {
  if (!notification || typeof notification !== 'object') {
    return notification;
  }

  const componentDid = notification.sender?.componentDid;

  // 创建一个深拷贝避免修改原对象
  const notificationClone = cloneDeep(notification);

  // 处理顶层的 url 字段
  if (notificationClone.url) {
    notificationClone.url = getUTMUrl(notificationClone.url, notificationClone.utm, componentDid);
  }

  // 处理顶层的 checkUrl 字段
  if (notificationClone.checkUrl) {
    notificationClone.checkUrl = getUTMUrl(notificationClone.checkUrl, notificationClone.utm, componentDid);
  }

  // 处理 actions 中的 link 字段
  if (notificationClone.actions && Array.isArray(notificationClone.actions)) {
    notificationClone.actions.forEach((action) => {
      if (action && action.link) {
        action.link = getUTMUrl(
          action.link,
          {
            ...notificationClone.utm,
            ...action.utm,
          },
          componentDid
        );
      }
    });
  }

  // 处理 attachments 和 blocks 中的 URL
  const processAttachments = (attachments) => {
    if (!Array.isArray(attachments)) return;

    attachments.forEach((attachment) => {
      if (!attachment) return;

      const { type, data } = attachment;

      switch (type) {
        case 'image':
          if (data && data.url) {
            data.url = getUTMUrl(
              data.url,
              {
                ...notificationClone.utm,
                ...data.utm,
              },
              componentDid
            );
          }
          break;

        case 'dapp':
          if (data) {
            if (data.url) {
              data.url = getUTMUrl(
                data.url,
                {
                  ...notificationClone.utm,
                  ...data.utm,
                },
                componentDid
              );
            }
            if (data.logo) {
              data.logo = getUTMUrl(
                data.logo,
                {
                  ...notificationClone.utm,
                  ...data.utm,
                },
                componentDid
              );
            }
          }
          break;

        case 'link':
          if (data) {
            if (data.url) {
              data.url = getUTMUrl(
                data.url,
                {
                  ...notificationClone.utm,
                  ...data.utm,
                },
                componentDid
              );
            }
            if (data.image) {
              data.image = getUTMUrl(
                data.image,
                {
                  ...notificationClone.utm,
                  ...data.utm,
                },
                componentDid
              );
            }
          }
          break;

        case 'section':
          // 处理 section 中的 fields，可能包含嵌套的 attachments
          if (attachment.fields && Array.isArray(attachment.fields)) {
            processAttachments(attachment.fields);
          }
          break;

        default:
          // 对于其他类型，检查是否有通用的 url 字段
          if (data && data.url) {
            data.url = getUTMUrl(
              data.url,
              {
                ...notificationClone.utm,
                ...data.utm,
              },
              componentDid
            );
          }
          break;
      }
    });
  };

  // 处理 attachments
  if (notificationClone.attachments) {
    processAttachments(notificationClone.attachments);
  }

  // 处理 blocks
  if (notificationClone.blocks) {
    processAttachments(notificationClone.blocks);
  }

  // 处理 activity 中的 target.id（可能是 URL）
  if (notificationClone.activity && notificationClone.activity.target && notificationClone.activity.target.id) {
    notificationClone.activity.target.id = getUTMUrl(
      notificationClone.activity.target.id,
      {
        ...notificationClone.utm,
        ...notificationClone.activity.target.utm,
      },
      componentDid
    );
  }

  // 处理 activity 中的 meta.id（可能是 URL）
  if (notificationClone.activity && notificationClone.activity.meta && notificationClone.activity.meta.id) {
    notificationClone.activity.meta.id = getUTMUrl(
      notificationClone.activity.meta.id,
      {
        ...notificationClone.utm,
        ...notificationClone.activity.meta.utm,
      },
      componentDid
    );
  }

  return notificationClone;
}

module.exports = {
  getUTMUrl,
  attachNotificationUTM,
};
