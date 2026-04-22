const cloneDeep = require('@abtnode/util/lib/deep-clone');
const isEmpty = require('lodash/isEmpty');
const last = require('lodash/last');
const { schemas } = require('@arcblock/validator');
const { isValid, isFromPublicKey } = require('@arcblock/did');
const { getBlockletAppIdList } = require('@blocklet/meta/lib/util');
const { verifyVault } = require('@blocklet/meta/lib/security');
const { getWalletDid } = require('@blocklet/meta/lib/did-utils');
const { formatError } = require('@blocklet/error');

const logger = require('@abtnode/logger')('@abtnode/core');

const validateVault = async (node, vaultDid, teamDid) => {
  if (!isValid(vaultDid)) {
    throw new Error('Invalid vault did');
  }

  const { error } = schemas.tokenHolder.validate(vaultDid);
  if (error) {
    throw new Error(`Invalid vault did type: ${formatError(error)}`);
  }

  const blocklet = await node.getBlocklet({ did: teamDid });
  if (!blocklet) {
    throw new Error('Blocklet not found');
  }

  // Do we need to do online check?
  const appDids = getBlockletAppIdList(blocklet);
  if (appDids.includes(vaultDid)) {
    throw new Error('Can not use current blocklet did as vault');
  }

  // Ensure vault history is valid
  const { vaults } = blocklet;
  if (vaults.length > 0) {
    if (vaults.some((vault) => vault.did === vaultDid)) {
      throw new Error('Can not add same vault twice');
    }

    const result = await verifyVault(vaults, blocklet.appPid, true);
    if (!result) {
      throw new Error('Vault history verification failed');
    }
  }

  return blocklet;
};

const validateSession = async (node, sessionId) => {
  const session = await node.getSession({ id: sessionId });
  if (!session) {
    throw new Error('Vault config session not found');
  }

  if (session.type !== 'configVault') {
    logger.error('Vault config session type mismatch', session);
    throw new Error('Vault config session type mismatch');
  }

  const { vaultDid, teamDid } = session;
  if (!isValid(vaultDid)) {
    throw new Error('Invalid vault did');
  }

  if (!isValid(teamDid)) {
    throw new Error('Invalid team did');
  }

  return session;
};

const configVault = async (node, { teamDid, vaultDid }, context) => {
  const blocklet = await validateVault(node, vaultDid, teamDid);
  const isMigrateFromManaged = isEmpty(blocklet.migratedFrom) && blocklet.externalSkSource?.startsWith('managed');
  if (isMigrateFromManaged) {
    throw new Error('Please migrate your blocklet wallet to DID Wallet before config vault');
  }

  // create a new session
  const session = await node.startSession({
    data: {
      type: 'configVault',
      vaultDid,
      teamDid,
      context,
    },
  });
  logger.info('vault config attempt', session);

  return session.id;
};

const commitVault = async (node, { sessionId, userDid, userPk, signature }) => {
  if (!isFromPublicKey(userDid, userPk)) {
    throw new Error('Vault pk and did mismatch');
  }

  const session = await validateSession(node, sessionId);
  logger.info('vault config commit', { session, userDid, userPk, signature });

  const { vaultDid, teamDid, approverSig, approverDid = '', approverPk = '', context } = session;
  if (userDid !== vaultDid) {
    throw new Error('Vault did not match');
  }
  if (!approverSig) {
    throw new Error('Vault must be approved by app owner or last vault owner before commit');
  }

  const blocklet = await validateVault(node, vaultDid, teamDid);
  if (isEmpty(blocklet.vaults)) {
    const owner = await node.getUser({
      teamDid: session.teamDid,
      user: { did: approverDid },
      options: { enableConnectedAccount: true },
    });
    if (getWalletDid(owner) !== approverDid) {
      throw new Error('You must be the app owner to approve vault change');
    }
  } else {
    const lastVault = last(blocklet.vaults);
    if (approverDid !== lastVault.did) {
      throw new Error('You must be the last vault owner to approve vault change');
    }
  }

  const vaults = cloneDeep(blocklet.vaults);
  vaults.push({
    did: userDid,
    pk: userPk,
    at: Date.now(),
    sig: signature,
    approverSig,
    approverDid,
    approverPk,
  });

  const result = await verifyVault(vaults, blocklet.appPid, true);
  if (!result) {
    throw new Error('Vault commit signature verification failed');
  }

  await node.updateBlockletVault({ did: teamDid, vaults }, context);
  await node.endSession({ id: sessionId });
  logger.info('vault config committed', { teamDid, vaultDid, context, sessionId: session.id });

  await node.createAuditLog(
    {
      action: 'configVault',
      args: { teamDid, vaultDid },
      context,
    },
    node
  );
};

const approveVault = async (node, { sessionId, userDid, userPk, signature }) => {
  if (!isFromPublicKey(userDid, userPk)) {
    throw new Error('approver pk and did mismatch');
  }

  const session = await validateSession(node, sessionId);
  logger.info('approve vault', { session, userDid, userPk, signature });

  const { vaultDid, teamDid, context } = session;
  const blocklet = await validateVault(node, vaultDid, teamDid);

  if (isEmpty(blocklet.vaults)) {
    const ownerDid = blocklet.settings.owner?.did;
    if (!ownerDid) {
      throw new Error('Blocklet owner must present before approve vault');
    }

    const owner = await node.getUser({
      teamDid: session.teamDid,
      user: { did: ownerDid },
      options: { enableConnectedAccount: true },
    });
    if (!owner) {
      throw new Error(`Blocklet owner not found: ${ownerDid}`);
    }

    if (getWalletDid(owner) !== userDid) {
      throw new Error('You must be the app owner to approve vault change');
    }
  } else {
    const lastVault = last(blocklet.vaults);
    if (userDid !== lastVault.did) {
      throw new Error('You must be the last vault owner to approve vault change');
    }
  }

  await node.updateSession({
    id: sessionId,
    data: { approverSig: signature, approverDid: userDid, approverPk: userPk },
  });
  logger.info('vault approved', { teamDid, vaultDid, context, sessionId: session.id });
};

module.exports = {
  validateVault,
  validateSession,
  configVault,
  approveVault,
  commitVault,
};
