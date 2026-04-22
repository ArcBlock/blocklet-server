const isEqual = require('lodash/isEqual');
const { CustomError } = require('@blocklet/error');
const { ALLOW_VERIFY_PROVIDERS } = require('@blocklet/constant');
const logger = require('@abtnode/logger')('@abtnode/gql');

module.exports = async ({ sessionId, ...input }, context, node, action) => {
  const { states } = node;

  if (process.env.VITE_NO_MFA_PROTECTED_METHODS) {
    return;
  }

  // ensure user is verified with did-connect, skip in test
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const nodeInfo = await node.getNodeInfo();
  const teamDid = context.user?.blockletDid;
  const isService = teamDid && teamDid !== nodeInfo.did;
  if (teamDid) {
    const userDid = context.user?.did;
    const user = await node.getUser({
      teamDid,
      user: { did: userDid },
      options: { enableConnectedAccount: true },
    });
    const connectedAccounts = user?.connectedAccounts || [];
    if (!connectedAccounts.some(x => ALLOW_VERIFY_PROVIDERS.includes(x.provider))) {
      return;
    }
  }

  if (context.user?.provider === 'accessKey') {
    return;
  }

  if (!sessionId) {
    throw new CustomError(400, 'Operation session is required');
  }

  const session = await states.session.read(sessionId);
  // logger.debug('verifyDestroySession', { action, did, keepData, sessionId, context, session });
  if (!session || !session.operator) {
    throw new CustomError(404, 'Operation session not found');
  }

  // 操作者可能是绑定的用户，要根据绑定的账户查询主账户
  let operator;
  if (!isService) {
    operator = await node.getUser({
      teamDid: nodeInfo.did,
      user: { did: session.operator },
      options: { enableConnectedAccount: true },
    });
  } else if (isService && teamDid) {
    operator = await node.getUser({
      teamDid,
      user: { did: session.operator },
      options: { enableConnectedAccount: true },
    });
  }

  if (!operator || !context.user?.did || operator.did !== context.user.did) {
    throw new CustomError(403, 'Operation session user mismatch');
  }
  if (session.type !== 'destroy') {
    throw new CustomError(403, 'Operation session not valid');
  }
  if (session.action !== action) {
    throw new CustomError(403, 'Operation session not valid');
  }

  Object.keys(input).forEach(key => {
    if (!isEqual(session.input[key], input[key])) {
      throw new CustomError(403, `Operation session input mismatch: ${key}`);
    }
  });

  await states.session.end(sessionId);
  logger.info('DestroySession.end', { sessionId, action, input });
};
