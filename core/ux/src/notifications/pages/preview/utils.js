import chunk from 'lodash/chunk';
import { joinURL, withQuery } from 'ufo';
import { types } from '@ocap/mcrypto';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { toTypeInfo } from '@arcblock/did';
import { getActivityLink, isValidUrl } from '../activity/utils';

export const getSeverityColor = (severity) => {
  let color = 'rgba(0, 0, 0, 0.12)';
  if (severity === 'warning') {
    color = '#DE9E37';
  } else if (severity === 'error') {
    color = '#F16E6E';
  } else {
    color = 'rgba(0, 0, 0, 0.12)';
  }
  return color;
};

export const isAllText = (attachments) => {
  return attachments.every((x) => x.type === 'text');
};

export const isAllImage = (attachments) => {
  return attachments.every((x) => x.type === 'image');
};

export const combinedItem = (items) => {
  return chunk(items, 2)
    .map((x) => ({ type: 'combined', items: x }))
    .filter((x) => {
      return (x.items || []).every((y) => y?.data?.text?.trim?.()); // 过滤掉没有 text 的 combined 项
    });
};

export const isSameTypes = (attachments) => {
  if (!attachments.length || attachments.length <= 1) {
    return false;
  }
  const firstType = attachments[0].type;
  return attachments.every((item) => item.type === firstType);
};

export const getUserProfileUrl = (did, locale) => {
  try {
    const didInfo = toTypeInfo(did);
    const isUserDid = didInfo.role !== undefined && didInfo.role !== types.RoleType.ACCOUNT;
    if (!isUserDid) {
      return undefined;
    }
    const url = joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, 'user');
    return withQuery(url, {
      did,
      locale,
    });
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

/**
 * 获取组件的挂载点
 */
export const getComponentMountPoint = (componentDid, blocklet) => {
  // 从 blocklet 中获取挂载点
  const mountPoint = blocklet?.componentMountPoints?.find((x) => x.did === componentDid);
  return mountPoint?.mountPoint;
};

/**
 * 获取通知的链接
 * @param {Object} notification - 通知对象
 * @returns {string} - 通知的链接
 */
export const getNotificationLink = (notification, mountPoint) => {
  if (!notification) {
    return null;
  }

  // 1. Check actions - return if there's exactly one action
  if (notification.actions?.length === 1) {
    return notification.actions[0].link || null;
  }

  // 2. Check activity.meta.id
  // 需要根据挂载点进行拼接 URL
  const activityLink = getActivityLink(notification.activity);
  const link = activityLink?.metaLink || activityLink?.targetLink;
  if (link) {
    return isValidUrl(link) ? link : joinURL(mountPoint, link);
  }

  // 3. Check attachments - return URL if there's exactly one attachment of type 'link'
  if (notification.attachments?.length === 1) {
    const attachment = notification.attachments[0];
    if (attachment.type === 'link') {
      return attachment.data?.url || null;
    }
  }

  return null;
};

export const checkIfNotificationIsRead = (notification) => {
  const { receivers = [] } = notification;
  if (!receivers.length) {
    return true;
  }
  // 这里只会有一个 receiver
  // receivers[0].read
  return receivers.every((x) => x.read);
};

// 判断元素是否在可视区域内，且至少有1/2在可视区域内
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  // 计算元素的高度和宽度
  const elementHeight = rect.height;
  const elementWidth = rect.width;

  // 计算元素在视口中可见部分的高度
  let visibleHeight = 0;
  if (rect.top >= 0 && rect.bottom <= viewportHeight) {
    // 元素完全在视口内
    visibleHeight = elementHeight;
  } else if (rect.top < 0 && rect.bottom > 0 && rect.bottom <= viewportHeight) {
    // 元素顶部超出视口，底部在视口内
    visibleHeight = rect.bottom;
  } else if (rect.top >= 0 && rect.top < viewportHeight && rect.bottom > viewportHeight) {
    // 元素顶部在视口内，底部超出视口
    visibleHeight = viewportHeight - rect.top;
  } else if (rect.top < 0 && rect.bottom > viewportHeight) {
    // 元素上下都超出视口，但中间部分可见
    visibleHeight = viewportHeight;
  }

  // 计算元素在视口中可见部分的宽度
  let visibleWidth = 0;
  if (rect.left >= 0 && rect.right <= viewportWidth) {
    // 元素完全在视口内
    visibleWidth = elementWidth;
  } else if (rect.left < 0 && rect.right > 0 && rect.right <= viewportWidth) {
    // 元素左侧超出视口，右侧在视口内
    visibleWidth = rect.right;
  } else if (rect.left >= 0 && rect.left < viewportWidth && rect.right > viewportWidth) {
    // 元素左侧在视口内，右侧超出视口
    visibleWidth = viewportWidth - rect.left;
  } else if (rect.left < 0 && rect.right > viewportWidth) {
    // 元素左右都超出视口，但中间部分可见
    visibleWidth = viewportWidth;
  }

  // 计算可见区域占元素总面积的比例
  const visibleRatio = (visibleHeight * visibleWidth) / (elementHeight * elementWidth);

  // 至少有1/2在可视区域内
  return visibleRatio >= 0.5;
}

/**
 * 获取在视图中的未读通知
 * @param {*} dom 要检测的dom
 * @returns {Array} 可视区域内的通知ID数组
 */
export const getNotificationsInVisibleArea = (dom) => {
  if (!dom) {
    return [];
  }
  const notificationIds = [];
  const batchSize = 5; // 每批处理5个元素

  // 获取所有元素
  const allElements = Array.from(dom.querySelectorAll('.notification-row'));
  const totalElements = allElements.length;

  // 分批处理元素
  for (let i = 0; i < totalElements; i += batchSize) {
    // 获取当前批次的元素
    const batch = allElements.slice(i, i + batchSize);
    let allInViewport = true;

    // 检查当前批次的每个元素
    for (const el of batch) {
      const notificationId = el.id;

      if (isInViewport(el)) {
        notificationIds.push(notificationId);
      } else {
        // 发现不在可视区域的元素，标记并跳出当前批次
        allInViewport = false;
        break;
      }
    }

    // 如果当前批次中有元素不在可视区域，终止后续批次处理
    if (!allInViewport) {
      break;
    }
  }

  return notificationIds;
};

// FIXME:  去重
export const getAllNotifications = (notification) => {
  const notifications = [];
  if (notification) {
    if (notification.items?.length) {
      notification.items.forEach((item) => {
        if (!checkIfNotificationIsRead(item)) {
          notifications.push(item);
        }
      });
    } else if (!checkIfNotificationIsRead(notification)) {
      notifications.push(notification);
    }
  }
  return notifications;
};

/**
 * 根据ids获取通知
 * @param {*} notificationMap 通知map，map中是 merge 的对象
 * @param {*} ids 通知ids
 * @returns 通知列表
 */
export const getUnReadNotificationByIds = (notificationMap, ids) => {
  let notifications = [];

  if (!ids.length) {
    return notifications;
  }

  ids.forEach((id) => {
    const notification = notificationMap.get(id);
    if (notification) {
      notifications = notifications.concat(getAllNotifications(notification));
    }
  });

  return notifications;
};

export const mergeDarkStyle = (style, isDark) => {
  return {
    ...style,
    ...(isDark ? { filter: 'invert(1)' } : {}),
  };
};

/**
 * 验证图片地址的有效性并返回代理URL
 * 1. 图片地址必须是 https
 * 2. 不能是一个相对地址
 * @param {string} url - 原始图片URL
 * @returns {string|null} - 如果URL有效则返回代理URL，否则返回null
 */
export const getProxyImageUrl = (url) => {
  if (!url) return null;

  try {
    // 检查是否是一个有效的URL
    const urlObj = new URL(url);

    // 检查协议是否是https
    if (urlObj.protocol !== 'https:') {
      console.warn('Image URL must use HTTPS protocol:', url);
      return null;
    }

    // 返回代理URL
    return `${WELLKNOWN_SERVICE_PATH_PREFIX}/proxy?url=${encodeURIComponent(url)}`;
  } catch (error) {
    // URL construction failed, indicating invalid URL format
    console.warn('Invalid image URL format:', url, error);
    return null;
  }
};
