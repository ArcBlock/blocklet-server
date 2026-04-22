import sortBy from 'lodash/sortBy';
import { joinURL } from 'ufo';
import isEmpty from 'lodash/isEmpty';

import normalizePathPrefix from '@abtnode/util/lib/normalize-path-prefix';
import { forEachBlockletSync, replaceSlotToIp } from '@blocklet/meta/lib/util';
import { BLOCKLET_APP_SPACE_REQUIREMENT } from '@blocklet/constant';
import { SLOT_FOR_IP_DNS_SITE } from '@abtnode/constant';

export const getServerUrl = (info, encodeURI = false) => {
  const adminPath = process.env.NODE_ENV === 'production' ? info.routing.adminPath : '';
  return encodeURI
    ? encodeURIComponent(joinURL(window.location.origin, adminPath))
    : joinURL(window.location.origin, adminPath);
};

export const getLaunchAgreementUrl = (meta, info, storeUrl) => {
  const serverUrl = getServerUrl(info);
  const metaUrl = joinURL(storeUrl, `/api/blocklets/${meta.did}/blocklet.json`);

  const url = new URL(joinURL(serverUrl, '/launch-blocklet/agreement'));
  url.searchParams.set('blocklet_meta_url', metaUrl);
  url.searchParams.set('from', window.location.href);
  return url.href;
};

export const ensureDomainAliases = async (domainAliases, { getIP } = {}) => {
  if (!domainAliases || !domainAliases.length) {
    return [];
  }

  if (!getIP) {
    return domainAliases;
  }

  if (!domainAliases.some((x) => x.value.includes(SLOT_FOR_IP_DNS_SITE))) {
    return domainAliases;
  }

  const ip = await getIP();

  if (!ip) {
    return domainAliases;
  }

  return domainAliases
    .map((x) => {
      try {
        x.value = replaceSlotToIp(x.value, ip);
        return x;
      } catch {
        return x;
      }
    })
    .filter(Boolean);
};

/** @type {import('@blocklet/server-js').BlockletState} */
export const getAppCapabilities = (blocklet) => {
  const capabilities = {
    didSpace: null,
  };

  forEachBlockletSync(blocklet, (b) => {
    if (
      capabilities.didSpace === BLOCKLET_APP_SPACE_REQUIREMENT.REQUIRED ||
      capabilities.didSpace === BLOCKLET_APP_SPACE_REQUIREMENT.REQUIRED_ON_SETUP
    ) {
      return;
    }

    if (b?.meta?.capabilities?.didSpace) {
      capabilities.didSpace = b.meta.capabilities.didSpace;
    }
  });

  return capabilities;
};

/**
 * @param {object} blocklet
 * @param {{
 *   fixRuntime:boolean|string // true, 'merge-old'
 *   oldBlocklet: object
 *   getIP: function
 * }}
 */
export const fixBlocklet = async (blocklet, { fixRuntime = true, oldBlocklet, getIP } = {}) => {
  if (!blocklet.site) {
    blocklet.site = {
      domainAliases: [],
      rules: [],
    };
  }

  blocklet.site.rules.forEach((rule) => {
    rule.from.pathPrefix = normalizePathPrefix(rule.from.pathPrefix || '/');
  });

  blocklet.site.rules = sortBy(blocklet.site.rules, (i) => i.from.pathPrefix);

  if (fixRuntime === true) {
    blocklet.site.domainAliases = await ensureDomainAliases(blocklet.site.domainAliases, { getIP });

    if (blocklet.appRuntimeInfo) {
      blocklet.appRuntimeInfo.startAt = new Date() - blocklet.appRuntimeInfo.uptime;
    }

    forEachBlockletSync(blocklet, (b) => {
      if (b.runtimeInfo) {
        b.runtimeInfo.startAt = new Date() - b.runtimeInfo.uptime;
      }
    });
  } else if (fixRuntime === 'merge-old' && oldBlocklet) {
    blocklet.site.domainAliases = oldBlocklet.site.domainAliases;
    blocklet.appRuntimeInfo = oldBlocklet.appRuntimeInfo;

    const oldComponents = {};
    forEachBlockletSync(oldBlocklet, (component, { id }) => {
      oldComponents[id] = component;
    });

    forEachBlockletSync(blocklet, (component, { id }) => {
      const oldComponent = oldComponents[id];
      if (oldComponent) {
        component.runtimeInfo = oldComponent.runtimeInfo;
        component.diskInfo = oldComponent.diskInfo;
        component.engine = oldComponent.engine;
      }
    });
  } else {
    blocklet.site.domainAliases = [];
  }

  blocklet.capabilities = getAppCapabilities(blocklet);
};

const DEFAULT_WALLET_TYPE = 'arcblock';
export const getWalletType = (raw, fromState = false) => {
  let item;

  // from state: migrating
  if (fromState) {
    item = (raw.configs || []).find((x) => x.key === 'BLOCKLET_APP_CHAIN_TYPE');
    if (item && item.value) {
      return item.value;
    }

    item = (raw.environments || []).find((x) => ['CHAIN_TYPE', 'BLOCKLET_APP_CHAIN_TYPE'].includes(x.key));
    if (item && item.value) {
      return item.value;
    }

    return DEFAULT_WALLET_TYPE;
  }

  // from meta: installing
  item = (raw.environments || []).find((x) => ['CHAIN_TYPE', 'BLOCKLET_APP_CHAIN_TYPE'].includes(x.name));
  if (item && item.default) {
    return item.default;
  }

  return DEFAULT_WALLET_TYPE;
};

/**
 *
 * @param {import('@blocklet/server-js').BlockletState} blocklet
 * @returns {boolean}
 */
export const isServerless = (blocklet) => !isEmpty(blocklet?.controller);
