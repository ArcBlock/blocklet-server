/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */

module.exports = async ({ states, printInfo }) => {
  printInfo('Try to update blocklet server to 1.7.1...');

  const blockletExtras = await states.blockletExtras.find({});
  for (const extra of blockletExtras) {
    if (!extra) {
      continue;
    }

    await states.blockletExtras.setSettings(extra.did, { initialized: true });

    printInfo(`Set initialized: ${extra.did}`);
  }
};
