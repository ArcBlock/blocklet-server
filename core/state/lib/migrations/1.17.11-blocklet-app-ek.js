/* eslint-disable no-await-in-loop */
const { getApplicationWallet: getBlockletWallet } = require('@blocklet/meta/lib/wallet');
const security = require('@abtnode/util/lib/security');

module.exports = async ({ states, printInfo }) => {
  printInfo('Try to populate blocklet appEk (persisted encryption key)...');

  // Get node SK from state (same way the rest of the codebase does)
  const nodeEnv = await states.node.getEnvironments();
  const nodeSk = nodeEnv.ABT_NODE_SK;
  if (!nodeSk) {
    printInfo('No node SK available, skipping appEk migration');
    return;
  }

  const { dek } = states.blocklet.config;
  if (!dek) {
    printInfo('No DEK available, skipping appEk migration');
    return;
  }

  const blocklets = await states.blocklet.find();
  if (!blocklets || blocklets.length === 0) {
    printInfo('No blocklets found, skipping appEk migration');
    return;
  }

  printInfo(`Found ${blocklets.length} blocklets to process for appEk`);

  let updatedCount = 0;
  for (const blocklet of blocklets) {
    try {
      // Fill root blocklet appEk — encrypt before storing
      if (!blocklet.appEk) {
        const wallet = getBlockletWallet(blocklet.meta.did, nodeSk, undefined, 1);
        if (wallet?.secretKey) {
          const encrypted = security.encrypt(wallet.secretKey, blocklet.meta.did, dek);
          await states.blocklet.model.update({ appEk: encrypted }, { where: { id: blocklet.id } });
        }
      }

      // Fill children appEk — encrypt before storing
      const childState = states.blocklet.BlockletChildState;
      const children = await childState.getChildrenByParentId(blocklet.id);
      for (const child of children) {
        if (!child.appEk && child.meta?.did) {
          const childWallet = getBlockletWallet(child.meta.did, nodeSk, undefined, 1);
          if (childWallet?.secretKey) {
            const encrypted = security.encrypt(childWallet.secretKey, child.meta.did, dek);
            await childState.update({ id: child.id }, { $set: { appEk: encrypted } });
          }
        }
      }

      updatedCount++;
    } catch (err) {
      printInfo(`Failed to update appEk for blocklet ${blocklet.meta?.did}: ${err.message}`);
    }
  }

  printInfo(`Blocklet appEk migration completed: ${updatedCount} blocklets processed`);
};
