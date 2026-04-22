const path = require('path');
const omit = require('lodash/omit');
const { joinURL } = require('ufo');
const { WELLKNOWN_SERVICE_PATH_PREFIX, NODE_DATA_DIR_NAME } = require('@abtnode/constant');
const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');
const { getDisplayName } = require('@blocklet/meta/lib/util');
const { getUserAvatarUrl, extractUserAvatar } = require('@abtnode/util/lib/user');
const { getStatusFromError } = require('@blocklet/error');

const logger = require('@abtnode/logger')(require('../package.json').name);

/**
 * @typedef {Object} InvitationInfo
 * @property {string} inviteId
 * @property {string} teamDid
 * @property {number} expireDate
 * @property {Object} info
 * @property {Object} inviter
 * @property {Object} receiver
 * @property {Object} role
 * @property {string} remark
 * @property {Object} display
 */
/**
 * @typedef {Object} InvitationData
 * @property {string} inviteId
 * @property {string} teamDid
 * @property {Date} expireDate
 * @property {Object} inviter
 * @property {Object} role
 * @property {string} remark
 * @property {Object} display
 */

/**
 * @typedef {Object} IssuePassportData
 * @property {string} id
 * @property {'passport-issuance'} type
 * @property {string} key - 实际上是颁发者的 userDid
 * @property {string} name
 * @property {string} title
 * @property {string} ownerDid
 * @property {string} teamDid
 * @property {number} expireDate
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {Object} display
 */

/**
 * @typedef {Object} Role
 * @property {string} name
 * @property {string} title
 * @property {string} description
 * @property {Arrary} permissions
 * @property {Arrary} grants
 */

async function getInvitation({ node, teamDid, inviteId, roles }) {
  /**
   * @type {InvitationData}
   */
  const invitationData = await node.getInvitation({ teamDid, inviteId });
  if (invitationData) {
    /**
     * @type {Role}
     */
    const invitation = {
      ...invitationData,
      expireDate: new Date(invitationData.expireDate).getTime(),
      receiver: null,
    };

    let orgRoles = [];
    if (invitation.orgId) {
      try {
        orgRoles = await node.getRoles({ teamDid, orgId: invitationData.orgId });
      } catch (err) {
        logger.error('failed to get org roles', { teamDid, orgId: invitationData.orgId, error: err });
      }
    }

    const allRoles = [...roles, ...orgRoles];

    const role = allRoles.find((v) => v.name === invitationData.role);

    return {
      invitation,
      role,
    };
  }
  return {
    invitation: null,
    role: null,
  };
}

/**
 * 通过指定用户颁发通行证获得 invitation 数据结构
 * @returns {Promise<{invitation: InvitationInfo, role: Role}>}
 */
async function getInvitationByIssuePassport({ node, teamDid, inviteId, roles }) {
  /**
   * @type {IssuePassportData}
   */
  const passportIssuance = await node.getPassportIssuance({ teamDid, sessionId: inviteId });
  if (passportIssuance) {
    const role = roles.find((v) => v.name === passportIssuance.name);

    const invitation = {
      inviteId: passportIssuance.id,
      teamDid,
      expireDate: new Date(passportIssuance.expireDate).getTime(),
      inviter: {
        did: passportIssuance.key,
      },
      remark: '',
      role: {
        name: passportIssuance.name,
        title: passportIssuance.title,
      },
      receiver: {
        did: passportIssuance.ownerDid,
      },
      display: passportIssuance.display,
      passportExpireTime: passportIssuance.passportExpireTime,
    };
    return {
      invitation,
      role,
    };
  }
  return {
    invitation: null,
    role: null,
  };
}

module.exports = {
  init(server, node, { prefix, type } = {}) {
    server.get(`${prefix}/invitation`, async (req, res) => {
      const { inviteId, mode = 'invite' } = req.query;
      const groupPathPrefix = req.headers['x-group-path-prefix'] || '/';

      const nodeInfo = await node.getNodeInfo();
      try {
        let info;
        if (type === 'blocklet') {
          const blockletInfo = await req.getBlocklet();
          info = {
            did: blockletInfo.meta.did,
            appDid: blockletInfo.appDid,
            url: blockletInfo.environmentObj[BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL],
            name: getDisplayName(blockletInfo),
            version: blockletInfo.meta.version,
            logo: joinURL(groupPathPrefix, WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet/logo'),
            chainHost: blockletInfo.configObj.CHAIN_HOST,
            passportColor: blockletInfo.configObj[BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_PASSPORT_COLOR],
            description: blockletInfo.meta.description,
            dataDir: blockletInfo.env.dataDir,
          };
        } else {
          info = {
            did: nodeInfo.did,
            appDid: nodeInfo.did,
            url: '/',
            name: nodeInfo.name,
            version: nodeInfo.version,
            description: nodeInfo.description,
            dataDir: path.join(node.dataDirs.data, NODE_DATA_DIR_NAME),
          };
        }

        const teamDid = info.did;
        const roles = await node.getRoles({ teamDid });
        let invitation;
        let role;
        if (mode === 'invite') {
          ({ invitation, role } = await getInvitation({
            node,
            inviteId,
            teamDid,
            roles,
          }));
        } else if (mode === 'issue-passport') {
          ({ invitation, role } = await getInvitationByIssuePassport({ node, inviteId, teamDid, roles }));
        } else {
          res.status(400).send('Invitation mode is invalid');
          return;
        }

        if (!invitation || Date.now() > new Date(invitation.expireDate).getTime()) {
          res.status(404).send('Invitation not found or invitation has been used');
          return;
        }

        // 如果是邀请内部用户加入 Org，则需要检查是否邀请了该用户
        if (invitation.orgId && req.user && invitation.inviteUserDids?.length > 0) {
          if (!invitation.inviteUserDids.includes(req.user.did)) {
            res.status(404).send('You have already received the invitation or not invited you');
            return;
          }
        }

        try {
          role.permissions = await node.getPermissionsByRole({ teamDid, role: { name: role.name } });
        } catch (err) {
          logger.error('failed to get role permission', { teamDid, role: role.name, error: err });
          role.permissions = [];
        }

        // NOTICE: 邀请人的 did 为永久 did，无需查询 connectedAccount
        let user = await node.getUser({ teamDid: info.did, user: { did: invitation.inviter.did } });
        let baseUrl = info.url;
        let isServer = type !== 'blocklet';
        if (!user && type === 'blocklet') {
          // 邀请人可能是 Server 的 Admin
          user = await node.getUser({ teamDid: nodeInfo.did, user: { did: invitation.inviter.did } });
          baseUrl = '/';
          isServer = true;
        }

        // 修复可能有问题的 inviter avatar
        if (user.avatar && user.avatar.startsWith('data:image/')) {
          try {
            user.avatar = await extractUserAvatar(user.avatar, { dataDir: info.dataDir });
            await node.updateUser({ teamDid: info.did, user: { did: user.did, pk: user.pk, avatar: user.avatar } });
          } catch {
            logger.error('Failed to convert base64 avatar', { teamDid, userDid: user.did });
          }
        }

        const inviter = {
          did: user.did,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatar: getUserAvatarUrl(baseUrl, user.avatar, nodeInfo, isServer),
        };

        res.json({
          ...invitation,
          info: omit(info, 'dataDir'),
          inviter,
          role: role || {},
        });
      } catch (err) {
        logger.error('failed to get invitation info', { inviteId, error: err });
        res.status(getStatusFromError(err)).end();
      }
    });
  },
};
