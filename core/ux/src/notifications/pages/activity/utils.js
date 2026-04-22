import isEmpty from 'lodash/isEmpty';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { joinURL, withQuery } from 'ufo';
import isURL from 'validator/lib/isURL';

/**
 * 合并相邻的通知数据
 * 合并条件:
 * 1. 数据必须是相邻的
 * 2. activity.type 必须相同且不为 null 或 undefined
 * 3. 如果存在target对象，activity.target.type和activity.target.id都必须相同
 * 4. 如果相邻数据的 activity.type 相同但没有 activity.target 对象，则需要合并
 *
 * @param {Array} notifications - 需要处理的通知数据
 * @returns {Array} - 合并后的通知数组
 */
export const mergeAdjacentNotifications = (notifications) => {
  if (!notifications || !notifications.length) {
    return [];
  }

  const result = [];
  let currentGroup = null;
  let groupItems = [];

  notifications.forEach((notification) => {
    // 如果没有activity或activity.type为null/undefined或者这是第一条记录
    if (!notification.activity || !notification.activity.type || !currentGroup) {
      // 处理前一个分组（如果存在）
      if (currentGroup) {
        // 如果只有一个通知，直接添加原通知
        if (groupItems.length === 1) {
          result.push(groupItems[0]);
        } else {
          // 将items添加到第一个通知对象，并将其添加到结果中
          currentGroup.items = groupItems;
          result.push(currentGroup);
        }
      }

      // 处理当前通知
      if (notification.activity && notification.activity.type) {
        // 将第一个通知对象作为组的基础，不创建新对象
        currentGroup = notification;
        groupItems = [notification];
      } else {
        // 无activity或activity.type的记录直接添加到结果中
        result.push(notification);
        // 重置当前组
        currentGroup = null;
        groupItems = [];
      }
      return;
    }

    // 获取当前组和当前通知的activity信息
    const currentActivity = groupItems[0].activity;
    const currentType = currentActivity.type;
    const currentTargetType = currentActivity.target?.type;
    const currentTargetId = currentActivity.target?.id;

    const newType = notification.activity.type;
    const newTargetType = notification.activity.target?.type;
    const newTargetId = notification.activity.target?.id;

    // 判断是否需要合并
    const shouldMerge =
      // activity.type 必须相同且不为null或undefined
      currentType &&
      newType &&
      currentType === newType &&
      // 如果都没有target，可以合并
      ((!currentActivity.target && !notification.activity.target) ||
        // 如果都有target，则target.type和target.id都必须相同
        (currentActivity.target &&
          notification.activity.target &&
          currentTargetType === newTargetType &&
          currentTargetId === newTargetId));

    if (shouldMerge) {
      // 合并到当前组
      groupItems.push(notification);
    } else {
      // 不满足合并条件，处理当前组
      // 如果只有一个通知，直接添加原通知
      if (groupItems.length === 1) {
        result.push(groupItems[0]);
      } else {
        // 将items添加到第一个通知对象，并将其添加到结果中
        // 使用Object.assign创建浅拷贝，避免修改原对象
        const groupToAdd = Object.assign({}, currentGroup, { items: groupItems });
        result.push(groupToAdd);
      }

      // 开始新的分组
      currentGroup = notification;
      groupItems = [notification];
    }
  });

  // 处理最后一个分组（如果有）
  if (currentGroup) {
    // 如果只有一个通知，直接添加原通知
    if (groupItems.length === 1) {
      result.push(groupItems[0]);
    } else {
      // 将items添加到第一个通知对象，并将其添加到结果中
      // 使用Object.assign创建浅拷贝，避免修改原对象
      const groupToAdd = Object.assign({}, currentGroup, { items: groupItems });
      result.push(groupToAdd);
    }
  }

  return result;
};

/**
 * 判断通知是否包含activity
 * @param {Object} notification - 通知对象
 * @returns {boolean} - 是否包含activity
 */
export const isIncludeActivity = (notification) => {
  return !isEmpty(notification.activity) && !!notification.activity.type && !!notification.activity.actor;
};

/**
 * 判断 actor 是否是用户的 DID
 *  actor 的类型有两种 1) 用户 2) 组件
 * @param {*} notification
 * @returns
 */
export const isUserActor = (notification) => {
  // 1. 如果是 isIncludeActivity 并且 notification 中有 actorInfo 则认为是用户
  // 2. 如果是 isIncludeActivity 并且 actorInfo 没有查询到用户，则认为是 component
  return isIncludeActivity(notification) && !!notification.actorInfo && !!notification.actorInfo.did;
};

/**
 * 是否可以自动已读
 */
export const canAutoRead = (notification) => {
  const { severity } = notification || {};
  return severity && ['normal', 'success', 'info'].includes(severity);
};

/**
 * 获取 activity 的链接
 * 链接的来源有两种
 * 1. activity.meta.id
 * 2. activity.target.id
 * @param {Object} activity - 活动对象
 * @returns {Object} - 活动的链接
 */
export const getActivityLink = (activity) => {
  if (!activity) {
    return null;
  }
  const { meta, target, actor } = activity || {};
  let targetLink = target?.id;
  if (target?.type === 'user') {
    targetLink = withQuery(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, 'user'), { did: actor });
  }
  return {
    metaLink: meta?.id,
    targetLink,
  };
};

/**
 * 验证是否是一个可访问的 URL
 */
export const isValidUrl = (url) => {
  return isURL(url);
};
