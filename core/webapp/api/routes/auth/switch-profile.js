const path = require('path');
const get = require('lodash/get');

const { messages } = require('@abtnode/auth/lib/auth');
const formatContext = require('@abtnode/util/lib/format-context');
const { extractUserAvatar } = require('@abtnode/util/lib/user');
const { NODE_DATA_DIR_NAME } = require('@abtnode/constant');

module.exports = function createRoutes(node) {
  return {
    action: 'switch-profile',
    onConnect: async ({ userDid, extraParams: { locale, connectedDid } }) => {
      if (userDid && connectedDid && userDid !== connectedDid) {
        throw new Error(messages.userMismatch[locale]);
      }

      const info = await node.getNodeInfo();
      const user = await node.getUser({
        teamDid: info.did,
        user: { did: userDid },
        options: { enableConnectedAccount: true },
      });
      if (!user) {
        throw new Error(messages.userNotFound[locale]);
      }
      if (!user.approved) {
        throw new Error(messages.notAllowedAppUser[locale]);
      }

      return {
        profile: {
          fields: ['fullName', 'email', 'avatar'],
          description: messages.requestProfile[locale],
        },
      };
    },

    onAuth: async ({ claims, userDid, extraParams: { locale }, req }) => {
      const info = await node.getNodeInfo();
      const user = await node.getUser({
        teamDid: info.did,
        user: { did: userDid },
        options: { enableConnectedAccount: true },
      });

      if (!user) {
        throw new Error(messages.userNotFound[locale]);
      }
      if (!user.approved) {
        throw new Error(messages.notAllowedAppUser[locale]);
      }

      const profile = claims.find(x => x.type === 'profile');

      const doc = await node.updateUser({
        teamDid: info.did,
        user: {
          ...user,
          ...profile,
          avatar: await extractUserAvatar(get(profile, 'avatar'), {
            dataDir: path.join(node.dataDirs.data, NODE_DATA_DIR_NAME),
          }),
          locale,
        },
      });
      await node.createAuditLog(
        {
          action: 'switchProfile',
          args: { teamDid: info.did, userDid, profile },
          context: formatContext(Object.assign(req, { user })),
          result: doc,
        },
        node
      );
    },
  };
};
