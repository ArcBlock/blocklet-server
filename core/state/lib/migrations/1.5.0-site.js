const { SLOT_FOR_IP_DNS_SITE } = require('@abtnode/constant');

module.exports = async ({ states, printInfo }) => {
  printInfo('Migrate ip dns site for blocklet...');

  const sites = await states.site.getSites();
  let changed = false;

  // remove system blocklet site of ip-dns-domain if ip is not 888-888-888-888. e.g. static-demo-abc-192-168-3-28.ip.abtnet.io
  // keep system blocklet site of ip-dns-domain only if ip is 888-888-888-888. e.g. static-demo-abc-888-888-888-888.ip.abtnet.io
  for (const site of sites) {
    if (site.isProtected) {
      const ipRegex = /\w{3}-(\d+-\d+-\d+-\d+)\.ip\.abtnet\.io$/;
      const match = ipRegex.exec(site.domain);
      if (match) {
        if (match[1] !== SLOT_FOR_IP_DNS_SITE) {
          // eslint-disable-next-line no-await-in-loop
          await states.site.remove({ _id: site.id });
          printInfo(`Delete site: ${site.domain}`);
          changed = true;
        }
      }
    }
  }

  if (changed) {
    // Note: Routing snapshots have been removed
    printInfo('Migration completed (routing snapshots removed)');
  }
};
