const pAll = require('p-all');

module.exports = async ({ node, states, printInfo }) => {
  printInfo('Try to update blocklet settings...');
  const apps = await states.blocklet.find();
  await pAll(
    apps.map((app) => async () => {
      const blockletDid = app.meta.did;
      try {
        await node.migrateBlockletAuthentication({ did: blockletDid });
      } catch (err) {
        console.error(`Failed to update blocklet settings: ${blockletDid}`);
        throw err;
      }
      printInfo(`Blocklet settings updated: ${app.meta?.title}`);
    }),
    { concurrency: 10 }
  );
};
