import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

import { EVENTS } from '@abtnode/constant';
import { useDomainsAccessibility } from '@abtnode/ux/lib/hooks/url-evaluation';

import { useSubscription } from '../libs/ws';
import { shouldCheckDomainStatus } from '../libs/util';
import { useNodeContext } from './node';

const DomainStatusContext = createContext({});
const { Provider, Consumer } = DomainStatusContext;

function DomainStatusProvider({ children, domains: domainList }) {
  const { api } = useNodeContext();
  const domainListStr = JSON.stringify(domainList);
  const [status, setStatus] = useState({});
  const domains = useMemo(
    () => domainList.map(domain => domain.filter(x => x && shouldCheckDomainStatus(x))).filter(arr => arr.length > 0),
    [domainListStr] // eslint-disable-line
  );
  useSubscription(EVENTS.DOMAIN_STATUS, data => {
    if (data) {
      setStatus(pre => ({ ...pre, [data.domain]: { ...pre[data.domain], ...data } }));
    }
  });

  const flatDomains = useMemo(() => domains.flat(), [domains]);
  const { domainsAccessibility, recommendedDomain } = useDomainsAccessibility(flatDomains);
  // 合并 domain 自身的状态 + 可访问性状态
  const domainsStatus = useMemo(() => {
    const merged = { ...status };
    Object.keys(domainsAccessibility).forEach(key => {
      const value = merged[key] || {};
      merged[key] = { ...value, ...domainsAccessibility[key] };
    });
    return merged;
  }, [status, domainsAccessibility]);

  const getDomainStatus = async () => {
    await Promise.all(domains.map(subDomains => api.checkDomains({ input: { domains: subDomains } })));
  };

  const updateStatus = domain => {
    if (domain) {
      api.checkDomains({ input: { domains: [domain] } });
    }
  };

  useEffect(() => {
    getDomainStatus();
  }, [domainListStr]); // eslint-disable-line

  const value = {
    refresh: getDomainStatus,
    updateStatus,
    api,
    status: domainsStatus,
    recommendedDomain,
    recommendedDomainStatus: domainsStatus[recommendedDomain],
  };

  return <Provider value={value}>{children}</Provider>;
}

DomainStatusProvider.propTypes = {
  children: PropTypes.any.isRequired,
  domains: PropTypes.array.isRequired,
};

function useDomainStatusContext() {
  const { status, recommendedDomainStatus, recommendedDomain, updateStatus } = useContext(DomainStatusContext);
  return { status, recommendedDomainStatus, recommendedDomain, updateStatus };
}

export { DomainStatusContext, DomainStatusProvider, Consumer as DomainStatusConsumer, useDomainStatusContext };
