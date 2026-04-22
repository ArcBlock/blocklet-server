const createTranslator = require('@abtnode/util/lib/translate');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { getSourceAppPid } = require('@blocklet/sdk/lib/util/login');
const { extractUserAvatar } = require('@abtnode/util/lib/user');
const { fromAppDid } = require('@arcblock/did-ext');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const merge = require('lodash/merge');
const formatContext = require('@abtnode/util/lib/format-context');

const { shouldSyncFederated, getUserAvatarUrl, getFederatedMaster, migrateFederatedAccount } = require('./federated');
const { messages, getApplicationInfo } = require('../auth');
const { upsertToPassports } = require('../passport');
const { transferPassport } = require('./transfer-passport');
const { declareAccount, migrateAccount } = require('./client');
const logger = require('../logger');

module.exports = {
  authPrincipal: ({ email, locale, previousUserDid }) => {
    const user = email || previousUserDid;

    const message = locale === 'zh' ? `将你的 DID Wallet 与账号 ${user} 绑定` : `Connect your DID Wallet with ${user}`;

    return {
      description: message,
      supervised: true,
    };
  },
  onConnect: async ({
    node,
    request,
    userDid,
    locale,
    previousUserDid, // FIXME: 这个数据目前只能从前端传递，可能会存在篡改的风险
    isService = true,
  }) => {
    // 检查逻辑
    // 1. 如果查询的账户，没有对应的 user 信息，则提示 notFound
    // 2. 如果查询的账户已存在，并且已绑定 wallet 账户，则提示 alreadyBindWallet
    // 3. 如果 wallet 账户已存在(主账户)，则提示 alreadyMainAccount
    // 4. 如果 wallet 账户已被其他账户绑定，则提示 alreadyBindOAuth
    const translations = {
      en: {
        notFound: "Couldn't find account information.",
        alreadyBindOAuth: 'Your wallet account ({did}) is already bond to another email.',
        alreadyBindWallet: 'Your email is already bond to another wallet account {did}.',
        alreadyMainAccount:
          'Your wallet account is already bond to this app. You cannot bind it again. Please use another wallet account or create a new one to try again.',
      },
      zh: {
        notFound: '无法获取账户信息。',
        alreadyBindOAuth: '你的钱包账户 {did} 已经与其他账户绑定。',
        alreadyBindWallet: '当前账户已经绑定过钱包账户 {did}。',
        alreadyMainAccount: '你的钱包账户 {did} 已绑定过该应用，无法重复绑定，请切换或新建一个钱包账户再次尝试。',
      },
    };
    const t = createTranslator({ translations });
    const { did: teamDid } = isService ? await request.getBlockletInfo() : await node.getNodeInfo();

    const oauthUser = await node.getUser({
      teamDid,
      user: {
        did: previousUserDid,
      },
      options: {
        enableConnectedAccount: true,
      },
    });
    if (!oauthUser) {
      logger.error('bind-wallet failed: oauthUser not found', {
        bindToUser: userDid,
        currentUser: previousUserDid,
        isService,
        locale,
        teamDid,
        blockletDid: teamDid,
        node: teamDid,
      });
      throw new Error(t('notFound', locale));
    }

    const oauthConnectedAccounts = oauthUser.connectedAccounts || [];
    const exist = oauthConnectedAccounts.find((item) => item.provider === LOGIN_PROVIDER.WALLET);
    if (exist) {
      throw new Error(t('alreadyBindWallet', locale, { email: oauthUser.email, did: exist.did }));
    }

    const bindUser = await node.getUser({
      teamDid,
      user: {
        did: userDid,
      },
      options: {
        enableConnectedAccount: true,
      },
    });
    if (bindUser) {
      if (bindUser.sourceProvider === LOGIN_PROVIDER.WALLET) {
        throw new Error(t('alreadyMainAccount', locale, { did: userDid }));
      }

      throw new Error(t('alreadyBindOAuth', locale, { did: userDid }));
    }

    const claims = {
      profile: {
        type: 'profile',
        description: messages.description[locale],
        items: ['fullName', 'avatar'],
      },
    };

    // 至少需要一个 claim
    if (oauthUser.avatar) {
      delete claims.profile;
    }
    if (Object.keys(claims).length > 0) {
      return claims;
    }

    return [];
  },
  onApprove: async ({
    node,
    request,
    locale,
    userDid,
    userPk,
    claims,
    previousUserDid,
    baseUrl,
    skipMigrateAccount = false,
    isService = true,
  }) => {
    // 在这里要对 server 还是 service 进行区分
    const nodeInfo = await node.getNodeInfo();

    let teamDid = nodeInfo.did;
    let wallet = null;
    let blockletInfo = null;
    let sourceAppPid = null;
    let blocklet = null;
    if (isService) {
      blocklet = await request.getBlocklet();
      blockletInfo = await request.getBlockletInfo();
      sourceAppPid = getSourceAppPid(request);
      const { did: blockletDid, wallet: blockletWallet } = blockletInfo;
      teamDid = blockletDid;
      wallet = blockletWallet;
    }

    const oauthUser = await node.getUser({ teamDid, user: { did: previousUserDid } });

    // Check user approved
    let bindUser = await node.getUser({
      teamDid,
      user: {
        did: userDid,
      },
      options: {
        enableConnectedAccount: true,
      },
    });
    if (bindUser && !bindUser.approved) {
      throw new Error(messages.notAllowedAppUser[locale]);
    }

    const { dataDir } = await getApplicationInfo({ node, nodeInfo, teamDid });

    const profileOld = claims.find((x) => x.type === 'profile') || { avatar: null };
    const avatar = await extractUserAvatar(oauthUser.avatar || profileOld.avatar, { dataDir });
    const profile = {
      fullName: oauthUser.fullName,
      avatar,
      email: oauthUser.email,
    };

    if (isService) {
      if (sourceAppPid) {
        try {
          await migrateFederatedAccount({
            // 目前只允许未注册过的钱包绑定 auth0，所以直接传入钱包生成的 userDid 和 userPk
            toUserDid: userDid,
            toUserPk: userPk,
            fromUserDid: previousUserDid,
            blockletInfo,
            blocklet,
          });
        } catch (error) {
          logger.error('Failed to migrate federated account', {
            error,
            toUserDid: userDid,
            fromUserDid: previousUserDid,
          });

          if (error?.response?.data) {
            throw new Error(error.response.data);
          }
          throw error;
        }
      } else {
        const connectedAccounts = oauthUser?.connectedAccounts || [];
        const sourceProvider = oauthUser?.sourceProvider;
        const oauthAccount = connectedAccounts.find((item) => item.provider === sourceProvider);
        const userWallet = fromAppDid(oauthAccount.id, wallet.secretKey);
        await declareAccount({ wallet: userWallet, blocklet });
        if (!skipMigrateAccount) {
          await migrateAccount({ wallet: userWallet, blocklet, user: { did: userDid, pk: userPk } });
        }
      }
    }

    // TODO: 获取当前登录使用的 passport（无法获取到 passport.id）
    // 使用最近一次使用的 passport 来代替
    const mergePassport = (oauthUser.passports || []).reduce((sum, cur) => {
      return upsertToPassports(sum, cur);
    }, bindUser?.passports || []);
    const mergeProfile = merge(profile, {
      email: bindUser?.email,
      fullName: bindUser?.fullName,
      avatar: bindUser?.avatar,
      inviter: bindUser?.inviter,
      generation: bindUser?.generation,
      emailVerified: bindUser?.emailVerified,
      phoneVerified: bindUser?.phoneVerified,
    });
    const currentTime = new Date().toISOString();

    const connectedAccount = {
      provider: LOGIN_PROVIDER.WALLET,
      did: userDid,
      pk: userPk,
      lastLoginAt: currentTime,
      firstLoginAt: currentTime,
      userInfo: {
        wallet: request.context.didwallet,
      },
    };

    await node.updateUser({
      teamDid,
      user: {
        did: oauthUser.did,
        pk: oauthUser.pk,
        ...mergeProfile,
        lastLoginIp: getRequestIP(request),
        connectedAccounts: [connectedAccount],
        passports: mergePassport,
      },
    });

    if (isService) {
      const masterSite = getFederatedMaster(blocklet);
      // NOTICE: 采用异步来更新，不阻塞接口的正常响应
      if (shouldSyncFederated(blocklet, sourceAppPid)) {
        const syncUserData = {
          did: oauthUser.did,
          pk: oauthUser.pk,
          ...mergeProfile,
          connectedAccount: [connectedAccount],
        };
        if (syncUserData.avatar) {
          syncUserData.avatar = getUserAvatarUrl(syncUserData.avatar, blocklet);
        }
        node.syncFederated({
          did: teamDid,
          data: {
            users: [
              {
                ...syncUserData,
                action: 'connectAccount',
                sourceAppPid: sourceAppPid || masterSite.appPid,
              },
            ],
          },
        });
      }
    }

    if (!bindUser) {
      bindUser = {
        ...oauthUser,
        // 发送 passport 的对象要设置为 wallet-did
        did: userDid,
        pk: userPk,
      };
    }

    // FIXME: 统一登录的 passport 相关问题后续统一处理
    await transferPassport(oauthUser, bindUser, {
      req: request,
      node,
      nodeInfo,
      teamDid,
      baseUrl,
      revokePassport: true,
    });

    await node.createAuditLog(
      {
        action: 'connectAccount',
        args: { teamDid, connectedAccount, provider: LOGIN_PROVIDER.WALLET, userDid: oauthUser.did },
        context: formatContext(Object.assign(request, { user: oauthUser })),
        result: bindUser,
      },
      node
    );

    return {
      nextWorkflowData: {
        userDid,
      },
    };
  },
};
