/**
 * 获取用户公开信息
 */

const { Joi } = require('@arcblock/validator');
const { CustomError } = require('@blocklet/error');
const { USER_AVATAR_PATH_PREFIX, USER_AVATAR_URL_PREFIX } = require('@abtnode/constant');
const { joinURL } = require('ufo');
const { omit, pick } = require('lodash');
const { getUserAvatarUrl } = require('./federated');

const getUserPublicInfo = async ({ req, teamDid, node }) => {
  const inputSchema = Joi.object({
    did: Joi.DID().optional(),
    name: Joi.string().optional(),
  });
  const { error, value } = inputSchema.validate(req.query);
  if (error || (!value.did && !value.name)) {
    throw new CustomError(400, 'Invalid user did or name');
  }

  let _teamDid = teamDid;
  let nodeInfo;
  if (!teamDid) {
    nodeInfo = await node.getNodeInfo({ useCache: true });
    _teamDid = nodeInfo.did;
  }

  if (!_teamDid) {
    throw new CustomError(400, 'teamDid is required');
  }

  if (!teamDid && !nodeInfo) {
    throw new CustomError(400, 'Failed to get node info');
  }

  const isService = !nodeInfo || nodeInfo.did !== _teamDid;

  let options;
  if (value.name) {
    options = { name: value.name };
  }

  const user = await node.getUser({
    teamDid: _teamDid,
    user: { did: value.did },
    options,
  });
  if (!user || !user?.approved) {
    return null;
  }

  if (user.avatar && user.avatar.startsWith(USER_AVATAR_URL_PREFIX)) {
    if (!isService) {
      const prefix = process.env.NODE_ENV !== 'development' ? nodeInfo.routing.adminPath : '';
      user.avatar = `${joinURL(prefix, USER_AVATAR_PATH_PREFIX, _teamDid, user.avatar.replace(USER_AVATAR_URL_PREFIX, ''))}?imageFilter=resize&w=48&h=48`;
    } else {
      const { blocklet } = req;
      user.avatar = `${getUserAvatarUrl(user.avatar, blocklet)}?imageFilter=resize&w=48&h=48`;
    }
  }

  let returnFields = ['avatar', 'did', 'name', 'fullName', 'sourceAppPid', 'createdAt', 'metadata'];

  // 默认隐藏 phone，请求者是本人时显示完整信息
  const isOwner = req.user?.did === user.did;
  returnFields = isOwner ? [...returnFields, 'email', 'phone', 'address'] : returnFields;
  user.metadata = isOwner ? user.metadata : omit(user.metadata, ['phone']);
  return pick(user, returnFields);
};

module.exports = {
  getUserPublicInfo,
};
