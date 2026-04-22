const { joinURL } = require('ufo');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const pick = require('lodash/pick');
const defaults = require('lodash/defaults');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const {
  shouldSyncFederated,
  isMaster,
  getUserAvatarUrl,
  getFederatedMaster,
  callFederated,
  migrateFederatedAccount,
} = require('@abtnode/auth/lib/util/federated');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');

const { api } = require('../libs/api');
const logger = require('../libs/logger')('blocklet-services:federated');
const { getDidConnectVersion } = require('./index');

async function loginOAuth({ blocklet, sourceAppPid, request, token, locale, provider, componentId }) {
  const federatedSites = blocklet.settings?.federated?.sites || [];
  const loginSite = federatedSites.find((x) => x.appPid === sourceAppPid);
  const postData = { token, locale, provider };
  if (componentId) {
    postData.componentId = componentId;
  }
  const url = joinURL(loginSite.appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/api/oauth/login');
  const { data } = await api.post(url, postData, {
    headers: {
      'x-did-connect-version': getDidConnectVersion(request),
    },
  });
  return data;
}

async function getOAuthUserInfo({ blocklet, sourceAppPid, request, provider, token, idToken, code }) {
  const federatedSites = blocklet.settings?.federated?.sites || [];
  const loginSite = federatedSites.find((x) => x.appPid === sourceAppPid);
  const postData = { provider, token, idToken, code, appPid: loginSite.appPid };
  const url = joinURL(loginSite.appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/api/oauth/getUser');
  const { data } = await api.post(url, postData, {
    headers: {
      'x-did-connect-version': getDidConnectVersion(request),
    },
  });
  return data;
}

async function getUserWithinFederated({ userDid, userPk, teamDid, sourceAppPid }, { node, blocklet }) {
  let currentUser = await node.getUser({
    teamDid,
    user: {
      did: userDid,
    },
    options: {
      enableConnectedAccount: true,
    },
  });
  if (!currentUser && shouldSyncFederated(blocklet, sourceAppPid)) {
    const masterSite = getFederatedMaster(blocklet);
    const nodeInfo = await node.getNodeInfo();
    const { permanentWallet } = getBlockletInfo(blocklet, nodeInfo.sk);
    const [pullUser] = await callFederated({
      site: masterSite,
      action: 'pullAccount',
      data: { users: [{ did: userDid, pk: userPk }] },
      permanentWallet,
    });
    if (pullUser) {
      pullUser.sourceAppPid = masterSite.appPid;
      pullUser.connectedAccount = pullUser.connectedAccounts;
      delete pullUser.connectedAccounts;
      currentUser = await node.loginUser({
        teamDid,
        user: pullUser,
      });
    }
  }

  return currentUser;
}

function syncFederatedUser(blocklet, node, user, sourceAppPid) {
  const masterSite = getFederatedMaster(blocklet);
  if (shouldSyncFederated(blocklet, sourceAppPid)) {
    const data = pick(user, [
      'did',
      'pk',
      'fullName',
      'avatar',
      'email',
      'phone',
      'url',
      'inviter',
      'generation',
      'emailVerified',
      'phoneVerified',
    ]);
    if (data.avatar) {
      data.avatar = getUserAvatarUrl(data.avatar, blocklet);
    }
    node.syncFederated({
      did: blocklet.appPid,
      data: {
        users: [
          {
            ...data,
            action: 'switchProfile',
            sourceAppPid: sourceAppPid || masterSite.appPid,
          },
        ],
      },
    });
  }
}

async function getTrustedDomains({ node, req, blocklet, minimal = false, info }) {
  if (!blocklet) {
    return req.hostname ? [req.hostname] : [];
  }

  const teamDid = blocklet.appPid;
  const federated = defaults(cloneDeep(blocklet.settings.federated || {}), {
    config: {
      appId: blocklet.appDid,
      appPid: teamDid,
    },
    sites: [],
  });
  const domainList = [];
  if (!minimal) {
    const nodeInfo = info || (await req.getNodeInfo());
    const domainAliases = await node.getBlockletDomainAliases({ blocklet, nodeInfo });
    domainList.push(...domainAliases.map((item) => item.value));
  }
  federated.sites
    // 只展示状态是 approved 的站点为可信域名
    .filter((x) => x.status === 'approved' || isMaster(x))
    .forEach((cur) => {
      try {
        const appDomain = new URL(cur.appUrl).hostname;
        if (appDomain) {
          domainList.push(appDomain);
        }
      } catch {
        logger.error('Failed to get domain from appUrl', { appUrl: cur.appUrl });
      }
      if (!minimal) {
        domainList.push(...(cur?.aliasDomain || []));
      }
    });
  const result = [...new Set(domainList)];
  return result;
}

async function sendEmailVerifyCode({ blocklet, blockletInfo, params }) {
  const url = joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/api/user/email/forwardSendCode');
  const masterSite = getFederatedMaster(blocklet);
  const { permanentWallet } = blockletInfo;
  const result = await callFederated({
    customUrl: url,
    site: masterSite,
    permanentWallet,
    data: params,
  });
  logger.info('sendEmailVerifyCode', { result, params });

  return result;
}

module.exports = {
  isMaster,
  shouldSyncFederated,
  getFederatedMaster,
  getUserAvatarUrl,
  loginOAuth,
  migrateFederatedAccount,
  getOAuthUserInfo,
  getUserWithinFederated,
  syncFederatedUser,
  getTrustedDomains,
  sendEmailVerifyCode,
};
