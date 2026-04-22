const { EventEmitter } = require('events');
const logger = require('@abtnode/logger')('@abtnode/domain-status');
const { EVENTS } = require('@abtnode/constant');
const { BlockletEvents } = require('@blocklet/constant');
const { isDidDomain } = require('@abtnode/util/lib/url-evaluation');
const { checkDomainDNS } = require('./index');

const dnsStatusStore = Object.create(null);

const doCheckDomainDnsWrapper = async (domain) => {
  try {
    const status = await checkDomainDNS(domain);
    return status;
  } catch (error) {
    logger.error('check domain dns error', { domain, error });
    throw error;
  } finally {
    logger.debug('removed dns flag', { domain });
  }
};

const checkDomainDnsWrapper = (domain) => {
  // 正在执行或已成功，并且离上次的执行时间小于 2 分钟则不请求
  if (dnsStatusStore[domain] && Date.now() - dnsStatusStore[domain].startAt < 2 * 60 * 1000) {
    return dnsStatusStore[domain].promise;
  }

  const promise = doCheckDomainDnsWrapper(domain);
  dnsStatusStore[domain] = {
    promise,
    startAt: Date.now(),
  };

  promise.catch(() => {
    delete dnsStatusStore[domain];
  });

  return promise;
};

class DomainStatus extends EventEmitter {
  constructor({ routerManager, states }) {
    super();

    this.routerManager = routerManager;
    this.states = states;
  }

  async checkDomainsStatus({ domains, did } = {}) {
    if (did) {
      // eslint-disable-next-line no-param-reassign
      domains = await this.states.site.getBlockletDomains(did);
    }

    const cnameDomain = domains.find((x) => isDidDomain(x));

    (domains || []).forEach((domain) => {
      Promise.all([
        this.routerManager.getHttpsCert({ domain }),
        this.routerManager.checkDomainDNS(domain, cnameDomain),
        checkDomainDnsWrapper(domain),
      ])
        .then(([matchedCert, dnsResolve, dns]) => {
          const eventData = {
            domain,
            matchedCert,
            isHttps: !!matchedCert,
            dns: { ...dns, ...dnsResolve },
          };

          if (did) {
            eventData.meta = { did };
            this.emit(BlockletEvents.domainStatus, eventData);
          } else {
            this.emit(EVENTS.DOMAIN_STATUS, eventData);
          }
        })
        .catch((error) => {
          logger.error('check domain status error', { domain, error, did });
        });
    });

    return 'ok';
  }
}

module.exports = DomainStatus;
