const { fromPublicKey } = require('@ocap/wallet');
const { fromBase58 } = require('@ocap/util');
const { isSystemRole } = require('@abtnode/constant');

const checkAccessKeySource = async ({ node, keyId, info, blockletDid }) => {
  let teamDid = info.did;
  let accessKey = await node.getAccessKey({ teamDid, accessKeyId: keyId }).catch(() => null);
  let isFromBlocklet;

  if (blockletDid && !accessKey) {
    isFromBlocklet = true;
    teamDid = blockletDid;
    accessKey = await node.getAccessKey({ teamDid, accessKeyId: keyId }).catch(() => null);
  }

  return { teamDid, isFromBlocklet, accessKey };
};

const isLoginToken = (token) => {
  return !!token && typeof token === 'string' && token.split('.').length === 3;
};

const isAccessKey = (token) => {
  return !!token && typeof token === 'string' && token.split('.').length === 1 && token.startsWith('blocklet-');
};

const authBySimpleAccessKey = async (token, node, blockletDid = '') => {
  const info = await node.getNodeInfo({ useCache: true });

  const secret = token.replace('blocklet-', '');

  let publicKey = '';
  try {
    publicKey = fromBase58(secret);
  } catch (error) {
    publicKey = '';
  }

  if (!publicKey) {
    throw new Error('Invalid access key secret');
  }

  const wallet = fromPublicKey(publicKey);
  if (!wallet) {
    throw new Error('Invalid access key secret');
  }

  const accessKeyId = wallet.address;

  const { teamDid, isFromBlocklet, accessKey } = await checkAccessKeySource({
    node,
    keyId: accessKeyId,
    info,
    blockletDid,
  });
  if (!accessKey) {
    throw new Error(`Access Key ${accessKeyId} is not found`);
  }

  const { passport, remark, expireAt, authType } = accessKey;

  if (authType !== 'simple') {
    throw new Error(`Access Key ${accessKeyId} is not a simple type`);
  }

  if (expireAt && new Date(expireAt).getTime() < new Date().getTime()) {
    throw new Error(`Access Key ${accessKeyId} has expired`);
  }

  if (!accessKey.createdBy) {
    throw new Error(`Access Key ${accessKeyId} is not created by a user`);
  }

  await node.refreshLastUsed({ teamDid, accessKeyId });

  const role = passport;
  const blockletRole = isSystemRole(role) ? `blocklet-${role}` : role;

  return {
    did: accessKey.createdBy,
    role: isFromBlocklet ? blockletRole : role,
    elevated: true,
    blockletDid: teamDid,
    fullName: remark || accessKeyId,
    provider: 'accessKey',
  };
};

module.exports = {
  checkAccessKeySource,
  authBySimpleAccessKey,
  isLoginToken,
  isAccessKey,
};
