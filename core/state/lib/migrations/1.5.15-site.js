/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
const normalizePathPrefix = require('@abtnode/util/lib/normalize-path-prefix');
const { BLOCKLET_SITE_GROUP_SUFFIX } = require('@abtnode/constant');

const findBlocklet = (site, blocklets) => {
  //  prefix = /
  const rootRule = site.rules.find((x) => x.from.pathPrefix === '/' && x.to.type === 'blocklet');
  if (rootRule) {
    const blocklet = blocklets.find((x) => x.meta.did === rootRule.to.did);
    if (blocklet) {
      return blocklet;
    }
  }

  for (const rule of site.rules) {
    if (rule.to.type === 'blocklet') {
      const blocklet = blocklets.find((x) => x.meta.did === rule.to.did);
      if (blocklet) {
        return blocklet;
      }
    }
  }

  return null;
};

const mergeSite = (newSite, oldSite) => {
  const { domain, domainAliases = [], isProtected, rules, corsAllowedOrigins } = oldSite;

  // merge domain
  const domains = [
    {
      value: domain,
      isProtected,
    },
    ...(domainAliases || []).map((x) => (typeof x === 'string' ? { value: x, isProtected: false } : x)),
  ];
  domains.forEach((x) => {
    if (!newSite.domainAliases.some((y) => y.value === x.value)) {
      newSite.domainAliases.push(x);
    }
  });

  // merge cors
  (corsAllowedOrigins || []).forEach((x) => {
    if (!newSite.corsAllowedOrigins.includes(x)) {
      newSite.corsAllowedOrigins.push(x);
    }
  });

  // merge rules
  (rules || []).forEach((x) => {
    if (!newSite.rules.some((y) => normalizePathPrefix(y.from.pathPrefix) === normalizePathPrefix(x.from.pathPrefix))) {
      newSite.rules.push(x);
    }
  });
};

module.exports = async ({ states, printInfo }) => {
  printInfo('Migrate site to 2.0 version for router...\n');

  const sites = await states.site.getSites();
  const blocklets = await states.blocklet.getBlocklets();
  printInfo(`Find blocklets: ${blocklets.length}`);

  // blocklet site which ends with 888-888-888-888.ip.abtnet.io
  const blockletSystemSites = [];

  // custom site added by user
  const customSites = [];

  sites.forEach((site) => {
    const { domain } = site;

    // filter 3 default basic site
    if (domain === '' || domain === '127.0.0.1' || domain === '*') {
      return;
    }

    const blocklet = findBlocklet(site, blocklets);

    if (domain.endsWith('888-888-888-888.ip.abtnet.io')) {
      blockletSystemSites.push({
        site,
        blocklet,
      });
    } else {
      customSites.push({
        site,
        blocklet,
      });
    }
  });

  printInfo(
    `Find sites: ${sites.length}; blockletSystemSites: ${blockletSystemSites.length}; customSites: ${customSites.length}\n`
  );
  printInfo(`blockletSystemSites: ${blockletSystemSites.map((x) => x.site.domain).join(', ')}\n`);
  printInfo(`customSites: ${customSites.map((x) => x.site.domain).join(', ')}\n`);

  // generate new blocklet site for every installed blocklet
  const newBlockletSites = {}; // <blockletDid>: <site>
  for (const blocklet of blocklets) {
    const domain = `${blocklet.meta.did}${BLOCKLET_SITE_GROUP_SUFFIX}`;
    newBlockletSites[blocklet.meta.did] = {
      domain,
      domainAliases: [],
      isProtected: true,
      rules: [],
      corsAllowedOrigins: [],
    };
  }
  printInfo(
    `newBlockletSites: ${Object.values(newBlockletSites)
      .map((x) => x.domain)
      .join(', ')}\n`
  );

  printInfo('\n');
  printInfo('Start merge blockletSystemSites to new sites');
  for (const { site: oldSite, blocklet } of blockletSystemSites) {
    // merge blockletSystemSite to new blocklet site
    if (blocklet) {
      const newSite = newBlockletSites[blocklet.meta.did];
      mergeSite(newSite, oldSite);
      printInfo(`Merge site from ${oldSite.domain} to ${newSite.domain}`);
    }
  }

  printInfo('\n');
  printInfo('Start merge customSites to new sites');
  for (const { site: oldSite, blocklet } of customSites) {
    // reserve custom site which not belong to any blocklet
    if (!blocklet) {
      printInfo(`Skip merge custom site: ${oldSite.domain}`);
      oldSite.skip = true;
      continue;
    }
    // merge custom site to new blocklet site
    const newSite = newBlockletSites[blocklet.meta.did];
    mergeSite(newSite, oldSite);
    printInfo(`Merge site from ${oldSite.domain} to ${newSite.domain}`);
  }

  printInfo('\n');
  printInfo('Start delete blockletSystemSites from db');
  for (const { site: oldSite } of blockletSystemSites) {
    if (oldSite.skip) {
      printInfo(`Skip delete site from db: ${oldSite.domain}`);
      continue;
    }
    // delete each blockletSystemSite
    await states.site.remove({ _id: oldSite.id });
    printInfo(`Delete site from db: ${oldSite.domain}`);
  }

  printInfo('\n');
  printInfo('Start delete customSites from db');
  for (const { site: oldSite } of customSites) {
    if (oldSite.skip) {
      printInfo(`Skip delete site from db: ${oldSite.domain}`);
      continue;
    }
    // delete custom site which bind to a blocklet
    await states.site.remove({ _id: oldSite.id });
    printInfo(`Delete site from db: ${oldSite.domain}`);
  }

  // add new blocklet site to db
  printInfo('\n');
  printInfo('Start add new sites to db');
  for (const site of Object.values(newBlockletSites)) {
    await states.site.add(site);
    printInfo(`Add site to db: ${site.domain}`);
  }

  // Note: Routing snapshots have been removed
  printInfo('\n');
  printInfo('Migration completed (routing snapshots removed)');
};
