import { createContext, useState, useContext } from 'react';
import sortBy from 'lodash/sortBy';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';

import normalizePathPrefix from '@abtnode/util/lib/normalize-path-prefix';

import {
  DOMAIN_FOR_IP_SITE,
  DOMAIN_FOR_IP_SITE_REGEXP,
  DOMAIN_FOR_DEFAULT_SITE,
  ROUTING_RULE_TYPES,
  BLOCKLET_SITE_GROUP_SUFFIX,
  WELLKNOWN_PATH_PREFIX,
} from '@abtnode/constant';

import { getAccessUrl } from '@abtnode/ux/lib/util';
import { ensureDomainAliases } from '@abtnode/ux/lib/blocklet/util';
import getIP from '../libs/get-ip';
import { useNodeContext } from './node';
import { stringSortHandlerAsc } from '../libs/util';

const DASHBOARD = 'Dashboard';

const RoutingContext = createContext({});
const { Provider, Consumer } = RoutingContext;

const specialSites = [DASHBOARD, DOMAIN_FOR_IP_SITE, DOMAIN_FOR_IP_SITE_REGEXP];

const sortDomainHandler = (siteA, siteB) => {
  if (siteA.name === DOMAIN_FOR_DEFAULT_SITE) {
    return -1;
  }

  if (siteB.name === DOMAIN_FOR_DEFAULT_SITE) {
    return 1;
  }

  const isSiteASpecial = specialSites.includes(siteA.name);
  const isSiteBSpecial = specialSites.includes(siteB.name);

  if (isSiteASpecial && isSiteBSpecial) {
    return stringSortHandlerAsc(siteA.name, siteB.name);
  }

  if (isSiteASpecial) {
    return -1;
  }

  if (isSiteBSpecial) {
    return 1;
  }

  return stringSortHandlerAsc(siteA.name, siteB.name);
};

const generateSites = ({ sites: inputSites, nodePort }) => {
  const defaultDomain = window.location.hostname;

  const list = (inputSites || []).map(site => {
    const { id: siteId, rules = [], corsAllowedOrigins = [] } = site;
    let { domain, domainAliases } = site;
    domainAliases = domainAliases || [];

    if ([DOMAIN_FOR_IP_SITE, DOMAIN_FOR_IP_SITE_REGEXP].includes(domain)) {
      domain = DASHBOARD;
      if (!domainAliases.find(item => item.value === defaultDomain)) {
        domainAliases.unshift({ protected: false, value: defaultDomain });
      }
    }

    const _site = {
      id: siteId,
      name: domain,
      type: 'domain',
      items: [],
      domainAliases,
      isProtected: site.isProtected,
      corsAllowedOrigins,
    };

    (rules || []).forEach(rule => {
      const {
        id: ruleId,
        isProtected,
        from: { pathPrefix },
        to,
      } = rule;

      if (to.type === ROUTING_RULE_TYPES.BLOCKLET) {
        let title = '';
        if (Number.parseInt(to.port, 10) === Number.parseInt(nodePort, 10)) {
          title = 'Blocklet Server Dashboard';
          to.type = ROUTING_RULE_TYPES.DAEMON;
        } else {
          title = to.did;
        }

        _site.items.push({
          id: ruleId,
          name: normalizePathPrefix(pathPrefix || '/'),
          title,
          type: 'rule',
          isProtected,
          pathPrefix,
          to,
        });
      } else {
        _site.items.push({
          id: ruleId,
          pathPrefix,
          name: normalizePathPrefix(pathPrefix || '/'),
          title: 'Blocklet Server Dashboard',
          type: 'rule',
          isProtected,
          to,
        });
      }
    });

    _site.items = sortBy(_site.items, i => i.name);

    return _site;
  });

  const sites = list.sort(sortDomainHandler);

  const siteMap = sites.reduce((acc, x) => {
    let { name } = x;
    if (name.endsWith(BLOCKLET_SITE_GROUP_SUFFIX)) {
      [name] = name.split('.');
    }
    acc[name] = { ...x, rules: x.items };
    return acc;
  }, {});

  return { sites, siteMap };
};

const getBlockletUrl = ({ did, domain: inputDomain, mountPoint: inputMountPoint, siteMap, params } = {}) => {
  if (!siteMap) {
    return null;
  }

  const site = siteMap[did];

  if (!site) {
    return null;
  }

  const domain = inputDomain || (site.domainAliases || [])[0];

  if (!domain) {
    return null;
  }

  let mountPoint = inputMountPoint;
  if (!mountPoint) {
    const rule = site.rules.filter(x => !x.name.startsWith(WELLKNOWN_PATH_PREFIX))[0];
    mountPoint = rule ? rule.name : '/';
  }

  return getAccessUrl(domain.value, mountPoint, params);
};

const getBlockletUrls = ({ did, mountPoint: inputMountPoint, siteMap, params } = {}) => {
  if (!siteMap) {
    return [];
  }

  const site = siteMap[did];

  if (!site) {
    return [];
  }

  const domains = site.domainAliases || [];

  if (!domains.length) {
    return [];
  }

  let mountPoint = inputMountPoint;
  if (!mountPoint) {
    const rule = site.rules.filter(x => !x.name.startsWith(WELLKNOWN_PATH_PREFIX))[0];
    mountPoint = rule ? rule.name : '/';
  }

  return domains.map(domain => getAccessUrl(domain.value, mountPoint, params));
};

const formatDomains = sites => {
  const domains = sites
    .map(x => x.domain)
    .filter(x => ![DOMAIN_FOR_IP_SITE_REGEXP, DOMAIN_FOR_DEFAULT_SITE].includes(x));

  let domainsAliases = [];
  sites.forEach(x => domainsAliases.push(...(x.domainAliases || [])));

  // backward compatible
  domainsAliases = domainsAliases.map(item => {
    if (typeof item === 'string') {
      return { value: item, isProtected: false };
    }

    return item;
  });

  return { domains, domainsAliases };
};

// eslint-disable-next-line react/prop-types
function RoutingProvider({ children }) {
  const { api, info } = useNodeContext();
  const [newSites, setNewSites] = useState([]);
  const [domains, setDomains] = useState([]);
  const [allDomains, setAllDomains] = useState([]);

  const state = useAsyncRetry(async () => {
    const { sites: dbSites } = await api.getRoutingSites({ input: { snapshotHash: '' } });

    const sites = dbSites || [];

    await Promise.all(
      sites.map(async site => {
        site.domainAliases = await ensureDomainAliases(site.domainAliases, { getIP });
        return site;
      })
    );

    const formattedDomains = formatDomains(sites);
    setNewSites(sites);
    setDomains(formattedDomains.domains);

    const result = generateSites({ sites, nodePort: info.port });
    setAllDomains((result?.sites || []).map(x => x.domainAliases.map(item => item.value)).filter(x => x.length));
  }, [info]);

  const updateSiteRules = (siteId, site) => {
    setNewSites(s =>
      s.map(x => {
        if (x.id === siteId) {
          if (site.domain) {
            return site;
          }

          return {
            ...site,
            domain: x.domain,
          };
        }

        return x;
      })
    );
  };

  // Site ops
  const addSite = async site => {
    const result = await api.addRoutingSite({ input: site });
    setNewSites(newSites.concat(result.site));
  };
  const updateSite = async (siteId, settings) => {
    const result = await api.updateRoutingSite({ input: { id: siteId, ...settings } });
    if (result.site && result.site.id) {
      const index = newSites.findIndex(x => x.id === result.site.id);
      if (index !== -1) {
        newSites.splice(index, 1, result.site);
        setNewSites([].concat(newSites));
      }
    }
  };
  const deleteSite = async id => {
    await api.deleteRoutingSite({ input: { id } });
    setNewSites(newSites.filter(x => x.id !== id));
  };

  // Site alias ops
  const addDomainAlias = async (siteId, domainAlias, force) => {
    const result = await api.addDomainAlias({ input: { id: siteId, domainAlias, force } });
    updateSiteRules(siteId, result.site);
  };
  const deleteDomainAlias = async (siteId, domainAlias) => {
    const result = await api.deleteDomainAlias({ input: { id: siteId, domainAlias } });
    updateSiteRules(siteId, result.site);
  };

  // Rule ops
  const addRule = async (id, rule) => {
    const { site } = await api.addRoutingRule({ input: { id, rule } });
    updateSiteRules(id, site);
  };
  const updateRule = async (siteId, rule) => {
    const { site } = await api.updateRoutingRule({
      input: {
        id: siteId,
        rule,
      },
    });

    updateSiteRules(siteId, site);
  };
  const deleteRule = async (siteId, ruleId) => {
    const { site } = await api.deleteRoutingRule({ input: { id: siteId, ruleId } });
    updateSiteRules(siteId, site);
  };

  const value = {
    loading: state.loading,
    error: state.error,
    refresh: state.retry,
    api,
    actions: {
      addSite,
      updateSite,
      deleteSite,

      addDomainAlias,
      deleteDomainAlias,

      addRule,
      updateRule,
      deleteRule,
    },
  };

  const { sites, siteMap } = generateSites({
    sites: newSites,
    nodePort: info.port,
  });

  value.sites = sites;
  value.siteMap = siteMap;
  value.domains = domains; // not includes domain aliases
  value.allDomains = allDomains;
  value.getBlockletUrl = ({ did, domain, mountPoint, params }) =>
    getBlockletUrl({ did, domain, mountPoint, siteMap: value.siteMap, params });
  value.getBlockletUrls = ({ did, mountPoint, params }) =>
    getBlockletUrls({ did, mountPoint, siteMap: value.siteMap, params });

  return <Provider value={{ routing: value }}>{children}</Provider>;
}

function useRoutingContext() {
  const { routing } = useContext(RoutingContext);
  return routing;
}

function isSpecialDomain(name) {
  const specialDomains = [DOMAIN_FOR_IP_SITE_REGEXP, DOMAIN_FOR_DEFAULT_SITE, DOMAIN_FOR_IP_SITE];
  if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    specialDomains.push(window.location.hostname);
  }

  return specialDomains.includes(name);
}

export {
  RoutingContext,
  RoutingProvider,
  Consumer as RoutingConsumer,
  useRoutingContext,
  DOMAIN_FOR_IP_SITE_REGEXP,
  DOMAIN_FOR_IP_SITE,
  DOMAIN_FOR_DEFAULT_SITE,
  DASHBOARD,
  isSpecialDomain,
  generateSites,
  getBlockletUrl,
  getBlockletUrls,
};
