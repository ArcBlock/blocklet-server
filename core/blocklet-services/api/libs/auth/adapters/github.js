const { default: axios } = require('axios');
const logger = require('../../logger')('blocklet-services:oauth');

function GitHub(options) {
  const baseUrl = 'https://github.com';
  const apiBaseUrl = 'https://api.github.com';

  return {
    id: 'github',
    name: 'GitHub',
    type: 'oauth',
    authorization: {
      url: `${baseUrl}/login/oauth/authorize`,
      params: {
        scope: 'read:user user:email',
        // HACK: prompt: login 对 github 没效果，如果当前只登录了一个 github 账号，则会跳过登录页面直接成功，只能设置为 consent，让页面不直接登录
        // prompt: 'none',
      },
    },
    token: `${baseUrl}/login/oauth/access_token`,
    userinfo: {
      async request({ tokens }) {
        const url = `${apiBaseUrl}/user`;
        const { data } = await axios.get(url, {
          headers: {
            Authorization: `token ${tokens.access_token}`,
            'User-Agent': '@blocklet/auth',
            Accept: 'application/json',
          },
        });

        if (!data.email) {
          // If the user does not have a public email, get another via the GitHub API
          // See https://docs.github.com/en/rest/users/emails#list-public-email-addresses-for-the-authenticated-user
          try {
            const { data: emails } = await axios.get(`${apiBaseUrl}/user/emails`, {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                'User-Agent': '@blocklet/auth',
                Accept: 'application/json',
              },
            });
            data.email = (emails.find((e) => e.primary) ?? emails[0]).email;
          } catch (err) {
            logger.error('Failed to get github user email');
          }
        }

        return data;
      },
    },
    profile(profile) {
      return {
        sub: `github|${profile.id}`,
        name: profile.name ?? profile.login,
        email: profile.email,
        picture: profile.avatar_url,
        emailVerified: true,
        extraData: {
          login: profile.login,
          nodeId: profile.node_id,
          company: profile.company,
          blog: profile.blog,
          location: profile.location,
          hireable: profile.hireable,
          bio: profile.bio,
          twitterUsername: profile.twitter_username,
          twoFactorAuthentication: profile.two_factor_authentication,
        },
      };
    },
    options,
  };
}

module.exports = GitHub;
