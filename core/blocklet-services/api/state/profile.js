const { extractUserAvatar } = require('@abtnode/util/lib/user');
const get = require('lodash/get');
const isEmpty = require('lodash/isEmpty');
const { joinURL } = require('ufo');
const { Joi } = require('@arcblock/validator');
const { api } = require('../libs/api');

const refreshSchema = Joi.object({
  node: Joi.any().required(),
  teamDid: Joi.string().required(),
  userDid: Joi.string().required(),
  blocklet: Joi.any().required(),
});

/**
 * @typedef {{
 *  node: any,
 *  teamDid: string,
 *  userDid: string,
 *  blocklet: import('@blocklet/server-js').BlockletState
 * }} RefreshOptions
 */

class Profile {
  /**
   * @description
   * @static
   * @param {RefreshOptions} options
   * @return {Promise<void>}
   * @memberof Profile
   */
  static async refresh(options) {
    /**
     * @type {RefreshOptions}
     */
    const { node, teamDid, userDid, blocklet } = await refreshSchema.validateAsync(options);

    const user = await node.getUser({ teamDid, user: { did: userDid }, options: { enableConnectedAccount: true } });
    if (!user || isEmpty(user.url)) {
      return;
    }

    const profile = await this.getProfile(user);
    if (profile) {
      await node.updateUser({
        teamDid,
        user: {
          did: user.did,
          fullName: get(profile, 'fullName'),
          avatar: await extractUserAvatar(get(profile, 'avatar'), {
            dataDir: blocklet.env.dataDir,
          }),
          // NOTE: do not overwrite email and phone if they are already verified
          email: user.emailVerified ? user.email : get(profile, 'email'),
          phone: user.phoneVerified ? user.phone : get(profile, 'phone'),
        },
      });
    }
  }

  static async getProfile(user) {
    if (isEmpty(user?.url)) {
      return null;
    }

    const profileMetadataUrl = joinURL(user.url, 'metadata');

    const data = await api.get(profileMetadataUrl).then((response) => response.data);

    if (!data) {
      return null;
    }

    const profile = {
      fullName: get(data, 'fn'),
      avatar: get(data, 'photo'),
      email: get(data, 'email'),
    };

    return profile;
  }
}

module.exports = {
  Profile,
};
