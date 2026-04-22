/* eslint-disable import/prefer-default-export */
import {
  ROUTING_RULE_TYPES,
  DEFAULT_IP_DOMAIN_SUFFIX,
  DOMAIN_FOR_IP_SITE_REGEXP,
  DOMAIN_FOR_DEFAULT_SITE,
  DOMAIN_FOR_IP_SITE,
} from '@abtnode/constant';
import isPathPrefixEqual from '@abtnode/util/lib/is-path-prefix-equal';
import { BLOCKLET_DYNAMIC_PATH_PREFIX } from '@blocklet/constant';
import { hasStartEngine } from '@blocklet/meta/lib/engine';
import tlds2 from 'tlds2';

const validateRuleByServiceType = (params, localeContext) => {
  if (params.type === ROUTING_RULE_TYPES.REDIRECT) {
    if (!params.url) {
      return new Error(`${localeContext('router.validation.redirectUrlRequired')}`);
    }

    if (!params.redirectCode) {
      return new Error(`redirect ${localeContext('router.validation.redirectCodeRequired')}`);
    }
  } else if (params.type === ROUTING_RULE_TYPES.BLOCKLET) {
    if (!params.did) {
      return new Error(localeContext('router.validation.didRequired'));
    }
  }

  return null;
};

export const validateDomain = (domain, localeContext) => {
  if (!domain) {
    return localeContext('router.domain.validate.emptyTip');
  }

  if (domain.endsWith(DEFAULT_IP_DOMAIN_SUFFIX)) {
    return localeContext('router.domain.validate.suffixTip', { suffix: DEFAULT_IP_DOMAIN_SUFFIX });
  }

  return null;
};

/**
 * form validator of add site(add domain)
 * @param {Object} params form params
 * @param {Function} localeContext error message
 */
export const validateSite = (params, localeContext) => {
  const validateResult = validateRuleByServiceType(params, localeContext);
  if (validateResult) {
    return validateResult;
  }

  const errMsg = validateDomain(params.domain, localeContext);
  if (errMsg) {
    return new Error(errMsg);
  }

  return null;
};

/**
 * form validator of add_rule and update_rule
 * @param {Object} params form params
 * @param {Function} localeContext error message
 */
export const validateRule = (params, localeContext) => {
  const validateResult = validateRuleByServiceType(params, localeContext);
  if (validateResult) {
    return validateResult;
  }

  if (!params.pathPrefix.length) {
    return new Error(localeContext('router.validation.pathPrefixCannotBeEmpty'));
  }

  if (params.pathPrefix.length > 150) {
    return new Error(localeContext('router.validation.pathPrefixTooLong', { length: 150 }));
  }

  return null;
};

export const existPathPrefix = ({ params, blocklet: curBlocklet }) => {
  if (curBlocklet) {
    const existBlocklet = (curBlocklet.children || []).find(
      (x) => hasStartEngine(x.meta) && isPathPrefixEqual(x.mountPoint, params.pathPrefix)
    );
    let existMountPoint = '';
    if (existBlocklet) {
      existMountPoint = existBlocklet.mountPoint;
    }
    if (curBlocklet.meta.group !== 'gateway' && params.pathPrefix === '/') {
      existMountPoint = '/';
    }
    return existMountPoint;
  }

  return '';
};

export const validatePathPrefix = ({ params, blocklets, blocklet: curBlocklet, locale = 'en', isUpload = false }) => {
  // validate children
  if (curBlocklet) {
    const existMountPoint = existPathPrefix({ params, blocklet: curBlocklet });
    if (existMountPoint && !isUpload) {
      return {
        zh: `挂载点 ${params.pathPrefix} 已存在，请使用其他挂载点`,
        en: `The mount point ${params.pathPrefix} already exist, please use another mount point`,
      }[locale];
    }
    if (existMountPoint && isUpload) {
      return 'overwrite';
    }
  }

  const blocklet = blocklets.find((item) => item.meta.did === params.did);
  if (!blocklet) {
    return '';
  }

  const selected = blocklet.meta.interfaces.find((x) => x.type === 'web');
  if (!selected) {
    return '';
  }

  if (selected.prefix !== BLOCKLET_DYNAMIC_PATH_PREFIX && params.pathPrefix !== selected.prefix) {
    return {
      zh: `该 blocklet 只能挂载在 ${selected.prefix}`,
      en: `This blocklet can only be mounted on ${selected.prefix}`,
    }[locale];
  }

  return '';
};

/**
 * get initial blocklet did when add rule / update rule / add domain
 * @param {array} blocklets
 */
export const getInitialBlockletDid = (blocklets) => {
  if (blocklets.length === 0) {
    return '';
  }
  const { searchParams } = new URL(window.location.href);
  const fromDid = searchParams.get('fromDid');
  if (fromDid) {
    const blocklet = blocklets.find((x) => x.meta.did === fromDid);
    if (blocklet) {
      return blocklet.meta.did;
    }
  }
  return blocklets[0].meta.did;
};

export const isSpecialDomain = (name) => {
  const specialDomains = [DOMAIN_FOR_IP_SITE_REGEXP, DOMAIN_FOR_DEFAULT_SITE, DOMAIN_FOR_IP_SITE];
  if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    specialDomains.push(window.location.hostname);
  }

  return specialDomains.includes(name);
};

export const parseDomainFromURL = (tmpDomain) => {
  if (!tmpDomain || typeof tmpDomain !== 'string') {
    return tmpDomain;
  }

  let domain = tmpDomain.trim();

  try {
    domain = domain.toLowerCase();
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      return new URL(domain).hostname;
    }

    return domain;
  } catch (error) {
    console.error('format domain failed', error);
    return domain;
  }
};

export const isSecondDomain = (domain) => {
  try {
    const { error, validTLD, org, subDomain } = tlds2.check(domain);
    if (error) {
      throw error;
    }

    if (!org || !validTLD) {
      return new Error('Invalid TLD domain');
    }

    const isSubdomainEmpty = !!subDomain;
    return isSubdomainEmpty === false;
  } catch (error) {
    return true;
  }
};

export const getDomainName = (domain) => {
  const { org, tld } = tlds2.check(domain);
  return domain.replace(`.${org}.${tld}`, '');
};
