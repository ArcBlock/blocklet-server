/* eslint-disable no-await-in-loop */

module.exports = async ({ node, states, printInfo }) => {
  printInfo('Try to update component status...');
  const apps = await states.blocklet.find();

  for (const app of apps || []) {
    const blockletDid = app.meta.did;
    try {
      await node.initializeSecurityDefaultData({ did: blockletDid });
    } catch (err) {
      console.error(`Failed to update blocklet security rule: ${blockletDid}`);
      throw err;
    }
    printInfo(`Blocklet in blocklet.db updated: ${app.meta?.title}`);
  }
};
