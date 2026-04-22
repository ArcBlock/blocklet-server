const { EVENTS } = require('@abtnode/constant');

/**
 * Get notification
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getNotification(api, { teamDid, ...rest }, context) {
  const notificationState = await api.getNotificationState(teamDid);
  return notificationState.findPaginated({ teamDid, ...rest }, context);
}

/**
 * Get notification by ID
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.id - Notification ID
 * @returns {Promise<Object>}
 */
async function getNotificationById(api, { teamDid, id }) {
  const notificationState = await api.getNotificationState(teamDid);
  const notification = await notificationState.findNotification({ id });
  return notification;
}

/**
 * Get notifications unread count
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.receiver - Receiver DID
 * @param {Object} context
 * @returns {Promise<number>}
 */
async function getNotificationsUnreadCount(api, { teamDid, receiver }, context) {
  const notificationState = await api.getNotificationState(teamDid);
  return notificationState.getUnreadCount({ receiver }, context);
}

/**
 * Create notification receiver
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.receiverInstance - Receiver instance
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function createNotificationReceiver(api, { teamDid, receiverInstance, ...rest }, context) {
  const notificationState = await api.getNotificationState(teamDid);
  return notificationState.createNotificationReceiver({ receiverInstance, ...rest }, context);
}

/**
 * Mark all notifications as read
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function markAllNotificationsAsRead(api, { teamDid, ...rest }, context) {
  const notificationState = await api.getNotificationState(teamDid);
  const result = await notificationState.makeAllAsRead(rest, context);
  const { numAffected, notificationIds, effectRows } = result;
  api.teamManager.emitReadNotification(teamDid, {
    readCount: numAffected,
    notificationIds,
    receiver: rest.receiver,
    effectRows,
  });
  return result;
}

/**
 * Update notification status
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Array} params.receivers - Receivers
 * @param {string} params.notificationId - Notification ID
 * @param {Object} params.updates - Updates
 * @returns {Promise<number>}
 */
async function updateNotificationStatus(api, { teamDid, receivers, notificationId, updates }) {
  const notificationState = await api.getNotificationState(teamDid);
  const result = await notificationState.updateStatus({ receivers, notificationId, updates, teamDid });
  // 发送状态更新的通知给前端，使用通用节流函数
  if (result > 0 && teamDid && !api.teamManager.isNodeTeam(teamDid)) {
    const throttledEmit = api.getThrottledEmit(teamDid);
    if (throttledEmit) {
      throttledEmit(EVENTS.NOTIFICATION_BLOCKLET_UPDATE, {
        teamDid,
        notificationId,
      });
    }
  }
  return result;
}

/**
 * Read notifications
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} context
 * @returns {Promise<number>}
 */
async function readNotifications(api, { teamDid, ...rest }, context) {
  const notificationState = await api.getNotificationState(teamDid);
  const { numAffected, effectRows } = await notificationState.read({ teamDid, ...rest }, context);
  api.teamManager.emitReadNotification(teamDid, {
    readCount: numAffected,
    receiver: rest.receiver,
    notificationIds: rest.notificationIds ?? [],
    effectRows,
  });
  return numAffected;
}

/**
 * Unread notifications
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function unreadNotifications(api, { teamDid, ...rest }, context) {
  const notificationState = await api.getNotificationState(teamDid);
  return notificationState.unread({ teamDid, ...rest }, context);
}

/**
 * Get notification send log
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getNotificationSendLog(api, { teamDid, ...rest }, context) {
  const notificationState = await api.getNotificationState(teamDid);
  return notificationState.getNotificationSendLog({ ...rest }, context);
}

/**
 * Get notification components
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getNotificationComponents(api, { teamDid, ...rest }, context) {
  const notificationState = await api.getNotificationState(teamDid);
  return notificationState.getNotificationComponents({ ...rest }, context);
}

/**
 * Get receivers
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getReceivers(api, { teamDid, ...rest }, context) {
  const notificationState = await api.getNotificationState(teamDid);
  return notificationState.getNotificationReceivers({ ...rest }, context);
}

module.exports = {
  getNotification,
  getNotificationById,
  getNotificationsUnreadCount,
  createNotificationReceiver,
  markAllNotificationsAsRead,
  updateNotificationStatus,
  readNotifications,
  unreadNotifications,
  getNotificationSendLog,
  getNotificationComponents,
  getReceivers,
};
