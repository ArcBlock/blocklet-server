const { default: axios } = require('axios');
const logger = require('../logger')('blocklet-services:oauth');
const { verifyIdToken } = require('../../services/oauth/client');

/**
 * @typedef {Object} Provider
 * @property {string} id - provider id
 * @property {string} name - provider 名称
 * @property {string} authorizeUrl - 授权的 url
 * @property {string} [scope] - 获取的授权范围，以空格分隔
 * @property {string} clientId - client id
 * @property {string} clientSecret - client secret
 */

/**
 * @typedef {Object} AuthorizationToken
 * @property {string} access_token
 * @property {string} [id_token] - 包含了用户信息，通过 jwt 解码可获取
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} provider - The provider of the user profile.
 * @property {string} sub - The subject of the user profile.
 * @property {string} name - The name of the user.
 * @property {string} picture - The picture URL of the user.
 * @property {string} email - The email of the user.
 * @property {boolean} [emailVerified] - Indicates if the user's email is verified.
 */

/**
 * 根据 url 和 params 参数生成最终的 url
 * @param {string | {url: string, params: object}} urlLike - The URL string or an object containing the URL and parameters.
 * @param {object} params - The parameters to append to the URL.
 * @return {string} The complete URL string with parameters appended.
 */
function getUrl(urlLike, params) {
  const uri = typeof urlLike === 'string' ? urlLike : urlLike.url;
  const appendParams =
    typeof urlLike === 'string'
      ? { ...params }
      : {
          ...urlLike.params,
          ...params,
        };
  const url = new URL(uri);
  for (const k of Object.keys(appendParams)) {
    const v = appendParams[k];
    if (v !== undefined) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

class OauthClient {
  /**
   * Constructor for initializing providers.
   * @param {Object} options
   * @param {Provider} options.provider
   */
  constructor({ provider }) {
    this.provider = provider;
  }

  /**
   * 获取 oauth 授权 code 用的地址
   *
   * @return {string}
   */
  getAuthorizationUrl(state) {
    if (this.provider.authorization?.request) {
      return this.provider.authorization.request(state);
    }

    return getUrl(this.provider.authorization, {
      response_type: 'code',
      client_id: this.provider?.getClientId?.() || this.provider.options.clientId,
      redirect_uri: this.provider.options.callbackUrl,
      state,
    });
  }

  /**
   * 通过授权码换取 token
   *
   * @param {Object} code - oauth 步骤的授权码
   * @return {Promise<AuthorizationToken>}
   */
  async getToken({ code }) {
    try {
      if (this.provider.token?.request) {
        return this.provider.token.request();
      }

      const clientId = this.provider?.getClientId?.() || this.provider.options.clientId;
      const clientSecret = this.provider?.getClientSecret?.() || this.provider.options.clientSecret;

      const params = {
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        redirect_uri: this.provider.options.callbackUrl,
      };

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      };
      if (this.provider.authentication === 'basic') {
        const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        headers.Authorization = `Basic ${authorization}`;
      } else {
        params.client_secret = clientSecret;
      }

      if (this.provider.checks?.includes('pkce')) {
        params.code_verifier = 'arcblock';
      }

      // 标准的 oauth code-flow 协议要求是使用 application/x-www-form-urlencoded 来携带数据，所以此处使用 URLSearchParams 来传递数据
      const { data } = await axios.post(this.provider.token, new URLSearchParams(params), { headers });
      return data;
    } catch (err) {
      logger.error('Failed get token', { error: err, response: err.response?.data });
      throw new Error(`Failed get token: ${err.message}`);
    }
  }

  /**
   * 通过授权 token 获取用户信息
   * @param {AuthorizationToken} tokens
   * @returns {Object} user info, 具体信息根据不同平台有不同的结构
   */
  async getUserInfo(tokens) {
    try {
      if (tokens.id_token) {
        const claims = await verifyIdToken({
          clientId:
            this.provider?.getClientList?.() || this.provider?.getClientId?.() || this.provider.options.clientId,
          idToken: tokens.id_token,
          iss: this.provider.issuer,
          jwksUri: this.provider.jwks_uri,
          nonce: tokens.nonce,
        });
        return claims;
      }
      if (this.provider.userinfo?.request) {
        return this.provider.userinfo.request({ tokens });
      }
      const url = new URL(this.provider.userinfo?.url || this.provider.userinfo);

      const { data } = await axios.get(url.toString(), {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'User-Agent': '@blocklet/auth',
          Accept: 'application/json',
        },
      });
      return data;
    } catch (err) {
      logger.error('Failed get user info', { error: err, response: err.response?.data });
      throw new Error(`Failed get user info: ${err.message}`);
    }
  }

  /**
   * 通过授权 token 获取标准格式化后的用户信息
   * @param {AuthorizationToken} tokens
   * @returns {UserProfile} 返回标准格式化后的用户信息
   */
  async getProfile(tokens) {
    try {
      const userInfo = await this.getUserInfo(tokens);
      if (this.provider.profile) {
        return this.provider.profile(userInfo);
      }
      return userInfo;
    } catch (err) {
      logger.error('Failed get user profile', { error: err, response: err.response?.data });
      throw new Error(`Failed get user profile: ${err.message}`);
    }
  }
}

module.exports = {
  OauthClient,
};
