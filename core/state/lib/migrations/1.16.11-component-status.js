/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */

module.exports = async ({ states, printInfo }) => {
  printInfo('Try to update component status...');

  const apps = await states.blocklet.find({});

  for (const app of apps || []) {
    const appStatus = app.status;
    let shouldUpdate = false;
    for (const component of app.children || []) {
      shouldUpdate = true;
      component.status = appStatus;
    }

    if (shouldUpdate) {
      await states.blocklet.update({ id: app.id }, { $set: { children: app.children } });
      printInfo(`Blocklet in blocklet.db updated: ${app.meta?.title}. status: ${appStatus}`);
    }
  }
};
