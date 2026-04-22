const { NODE_MODES, isBlockletRole } = require('@abtnode/constant');

module.exports = async (input, context, node, action) => {
  if (context.nodeMode !== NODE_MODES.SERVERLESS) {
    return;
  }

  if ([1, '1', true, 'true'].includes(process.env.ABT_NODE_ENABLE_MUTATE_BLOCKLET)) {
    return;
  }

  const { role } = context.user;
  let { blockletDid } = context.user;
  if (!blockletDid) {
    if (input.rootDid) {
      blockletDid = input.rootDid;
    } else if (input.teamDid) {
      blockletDid = input.teamDid;
    } else if (input.scope) {
      blockletDid = input.scope;
    } else if (input.did) {
      blockletDid = Array.isArray(input.did) ? input.did[0] : input.did;
    }
  }

  if (!blockletDid) {
    throw new Error(`Invalid request: missing or invalid blocklet DID for ${action}`);
  }

  // allow mutate internal blocklets
  const blocklet = await node.getBlocklet({ did: blockletDid, useCache: true });
  if (!blocklet?.controller) {
    return;
  }

  if (!isBlockletRole(role)) {
    throw new Error('Serverless mode does not allow to mutate blocklet');
  }
};
