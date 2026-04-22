const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:update');
const md5 = require('@abtnode/util/lib/md5');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { BlockletStatus } = require('@blocklet/constant');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { getDisplayName } = require('@blocklet/meta/lib/util');

const states = require('../../../states');
const launcher = require('../../../util/launcher');
const { shouldJobBackoff } = require('../../../util/env');
const UpgradeComponents = require('../helper/upgrade-components');

/**
 * Check for component updates
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.did - Blocklet DID
 * @returns {Promise<void>}
 */
async function _onCheckForComponentUpdate(manager, { did }) {
  if (shouldJobBackoff()) {
    logger.warn('Check for component update is not available when blocklet server is starting.');
    return;
  }

  const blocklet = await manager.getBlocklet(did);
  if (blocklet.status === BlockletStatus.stopped) {
    logger.warn('Check for component update is not available when blocklet is stopped.');
    return;
  }

  const list = await UpgradeComponents.check({ did, states });
  if (!list || !list.updateList?.length) {
    return;
  }
  const componentDids = list.updateList.map((item) => item.meta.did);
  const updateList = list.updateList.map((item) => {
    return { title: item.meta.title, description: item.meta.description, version: item.meta.version };
  });

  const checkUpdateMd5 = md5(JSON.stringify(updateList));
  const oldMd5 = await states.blockletExtras.getSettings(did, 'checkUpdateMd5', '');
  // notification has been sent, no more
  if (checkUpdateMd5 === oldMd5) {
    return;
  }

  const firstComponent = updateList[0];
  const blockletTitle = getDisplayName(blocklet);

  const description = {
    en: `${blockletTitle} has components with a new version: ${firstComponent.title} ${firstComponent.version} ${
      updateList.length > 1 ? 'and more...' : '.'
    }`,
    zh: `${blockletTitle} 的组件有新版本: ${firstComponent.title} ${updateList.length > 1 ? '等等...' : '.'}`,
  };
  const title = {
    en: `${blockletTitle} has components with a new version`,
    zh: `${blockletTitle} 的组件有新版本`,
  };
  const body = {
    en: `${blockletTitle} has new versions of the following components:`,
    zh: `${blockletTitle} 以下组件有新版:`,
  };
  const button = {
    en: 'Upgrade to new version',
    zh: '升级到新版本',
  };

  const action = `/blocklets/${did}/components?checkUpdate=1`;
  const blockletDashboardAction = `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/components?checkUpdate=1`;
  const users = await manager.teamManager.getOwnerAndAdminUsers(did, true);
  const nodeInfo = await states.node.read();
  const { wallet } = getBlockletInfo(blocklet, nodeInfo.sk);

  const attachments = [
    {
      type: 'section',
      fields: updateList
        .slice(0, 3)
        .map((item) => {
          return [
            {
              type: 'text',
              data: { type: 'plain', color: '#9397A1', text: item.title },
            },
            {
              type: 'text',
              data: { type: 'plain', text: item.version },
            },
          ];
        })
        .flat(),
    },
  ];

  try {
    await manager._sendAllMessageToUser({
      did,
      blocklet,
      title,
      body,
      button,
      attachments,
      description,
      action,
      blockletDashboardAction,
      sender: {
        appDid: wallet.address,
        appSk: wallet.secretKey,
      },
      users,
      componentDids,
    });
    await states.blockletExtras.setSettings(did, { checkUpdateMd5 });
  } catch (err) {
    logger.error('send checked update email failed', { error: err });
  }
}

/**
 * Report component usage
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.did - Blocklet DID
 * @param {Array<string>} params.componentDids - Component DIDs
 * @param {string} params.eventType - Event type
 * @param {string} params.time - Time
 * @returns {Promise<void>}
 */
async function _reportComponentUsage(manager, { did, componentDids, eventType, time }) {
  try {
    logger.info('start report component usage', { did, componentDids, eventType });

    const blocklet = await manager.getBlocklet(did);
    await launcher.reportComponentsEvent({
      blocklet,
      dids: componentDids,
      type: eventType,
      time: time || new Date().toISOString(),
    });

    logger.info('report component usage success', { did, componentDids, eventType });
  } catch (error) {
    logger.error('report component usage failed', { did, componentDids, eventType, error });
    throw error; // 一定要 throw 出去，否则会导致队列任务不会重试
  }
}

module.exports = {
  _onCheckForComponentUpdate,
  _reportComponentUsage,
};
