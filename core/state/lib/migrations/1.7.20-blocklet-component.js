/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */

module.exports = async ({ states, printInfo }) => {
  printInfo('Try to delete realDid, realInterface and add componentId in db...');

  const sites = await states.site.find({});

  for (const site of sites) {
    let changed = false;
    for (const rule of site.rules || []) {
      if (!rule.to) {
        continue;
      }

      if (rule.to.type !== 'blocklet') {
        continue;
      }

      if (rule.to.componentId) {
        continue;
      }

      if (!rule.to.realDid || rule.to.did === rule.to.realDid) {
        rule.to.componentId = rule.to.did;
      } else {
        rule.to.componentId = `${rule.to.did}/${rule.to.realDid}`;
      }

      delete rule.to.realDid;
      delete rule.to.realInterfaceName;

      changed = true;
    }

    if (changed) {
      await states.site.update({ _id: site._id }, site);
      printInfo(`site ${site.domain} has been updated`);
    }
  }
};
