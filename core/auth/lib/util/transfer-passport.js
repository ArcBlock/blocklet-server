const isEmpty = require('lodash/isEmpty');
const { getActivePassports } = require('@abtnode/util/lib/passport');
const { VC_TYPE_NODE_PASSPORT, VC_TYPE_GENERAL_PASSPORT, NOTIFICATION_SEND_CHANNEL } = require('@abtnode/constant');
const { getUserAvatarUrl } = require('@abtnode/util/lib/user');
const { getBlockletAppIdList } = require('@blocklet/meta/lib/util');
const getNodeWallet = require('@abtnode/util/lib/get-app-wallet');
const pick = require('lodash/pick');
const uniq = require('lodash/uniq');
const { LOGIN_PROVIDER } = require('@blocklet/constant');

const { PASSPORT_LOG_ACTION, PASSPORT_ISSUE_ACTION } = require('@abtnode/constant');
const { sendToUser } = require('@blocklet/sdk/lib/util/send-notification');
const { getPassportStatusEndpoint, getApplicationInfo } = require('../auth');
const { createPassportVC, upsertToPassports, createUserPassport } = require('../passport');

const PASSPORT_VC_TYPES = [VC_TYPE_GENERAL_PASSPORT, VC_TYPE_NODE_PASSPORT];

const getPassportName = (passport) => {
  return passport?.credentialSubject?.passport?.title || passport?.credentialSubject?.passport?.name || '';
};

async function transferPassport(fromUser, toUser, { req, teamDid, node, nodeInfo, revokePassport = false, baseUrl }) {
  if (!fromUser || !toUser || !teamDid) {
    return;
  }
  const info = await getApplicationInfo({ node, nodeInfo, teamDid });
  const { name: issuerName, wallet: issuerWallet, passportColor } = info;

  const isService = teamDid !== nodeInfo.did;

  let issuerDidList = uniq([info.wallet.address, ...getBlockletAppIdList(info)]);

  let appUrl = null;
  if (isService) {
    const blockletInfo = await req.getBlockletInfo();
    const { wallet: blockletWallet } = blockletInfo;
    issuerDidList = uniq([blockletWallet.address, ...getBlockletAppIdList(blockletInfo)]);
    appUrl = blockletInfo.appUrl;
  }

  const waitPassportList = getActivePassports(fromUser, issuerDidList);

  if (waitPassportList.length === 0) {
    // 没有待转移的 passport，无需进行下面的步骤
    return;
  }

  const attachments = await Promise.all(
    waitPassportList.map(async (x) => {
      const _baseUrl = isService ? x.endpoint || appUrl : baseUrl || x.endpoint;
      const vcParams = {
        issuerName,
        issuerWallet: isService ? issuerWallet : getNodeWallet(nodeInfo.sk),
        ownerDid: toUser.did,
        passport: { ...pick(x, ['name', 'title', 'specVersion']), endpoint: _baseUrl },
        endpoint: getPassportStatusEndpoint({
          baseUrl: _baseUrl,
          userDid: toUser.did,
          teamDid,
        }),
        ownerProfile: {
          email: toUser.email,
          fullName: toUser.fullName,
          avatar: getUserAvatarUrl(_baseUrl, toUser.avatar),
        },
        preferredColor: passportColor,
        types: !isService ? [VC_TYPE_NODE_PASSPORT] : x.types,
        purpose: !isService || isEmpty(x.types) ? 'login' : 'verification',
        display: x.display,
        tag: info.did,
      };

      const vc = await createPassportVC(vcParams);
      return {
        type: 'vc',
        data: {
          credential: vc,
          tag: x.name,
        },
      };
    })
  );

  const insertPassportList = attachments.map((item, index) => {
    const passport = createUserPassport(item.data.credential, { role: item.data.tag, display: item.data.display });
    return {
      ...passport,
      ...pick(waitPassportList[index], ['firstLoginAt', 'lastLoginAt', 'lastLoginIp']),
      userDid: toUser.did,
    };
  });

  const passportNameList = attachments.map((x) => x.data.credential.name || getPassportName(x));

  let sender = {};
  if (!isService) {
    sender = {
      appDid: info.wallet.address,
      appSk: info.wallet.secretKey,
    };
  } else {
    const { wallet } = await req.getBlockletInfo();
    sender = {
      appDid: wallet.address,
      appSk: wallet.secretKey,
    };
  }

  await sendToUser(
    toUser.did,
    {
      title: 'Transfer passports',
      body: `You received passport ${passportNameList.join(', ')} because you just bind your DID Wallet to ${
        fromUser.email
      }`,
      attachments,
    },
    sender,
    {
      channels: [NOTIFICATION_SEND_CHANNEL.WALLET, NOTIFICATION_SEND_CHANNEL.PUSH], // 不需要推送到其他 channels
    }
  );

  const passports = insertPassportList.reduce((acc, item) => {
    return upsertToPassports(acc, item);
  }, fromUser.passports || []);
  const toUserExist = await node.getUser({
    teamDid,
    user: { did: toUser.did },
    options: {
      enableConnectedAccount: false,
    },
  });
  // HACK: 默认情况下，应该将新 passport 添加到 toUser，但某些情况下，toUser 是绑定到 fromUser 的 connectAccount，所以需要将新通行证添加到 fromUser
  if (toUserExist) {
    await node.updateUser({
      teamDid,
      user: {
        did: toUser.did,
        pk: toUser.pk,
        passports,
      },
    });
  } else {
    await node.updateUser({
      teamDid,
      user: {
        did: fromUser.did,
        pk: fromUser.pk,
        passports,
      },
    });
  }

  await Promise.all(
    insertPassportList.map((item) => {
      return node.createPassportLog(
        teamDid,
        {
          passportId: item.id,
          action: PASSPORT_LOG_ACTION.ISSUE,
          operatorDid: fromUser.did,
          metadata: {
            action: PASSPORT_ISSUE_ACTION.ISSUE_ON_TRANSFER,
          },
        },
        req
      );
    })
  );

  if (revokePassport) {
    const revokePendingList = waitPassportList
      .filter((item) => item.id)
      .map((item) => {
        if (fromUser.sourceProvider === LOGIN_PROVIDER.AUTH0) {
          return node.removeUserPassport({ teamDid, userDid: fromUser.did, passportId: item.id });
        }
        return node.revokeUserPassport({ teamDid, userDid: fromUser.did, passportId: item.id });
      });
    await Promise.all(revokePendingList);
  }
}

module.exports = {
  transferPassport,
  PASSPORT_VC_TYPES,
};
