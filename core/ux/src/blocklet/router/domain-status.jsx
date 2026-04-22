import { createElement, Fragment } from 'react';
import PropTypes from 'prop-types';

import Tooltip from '@mui/material/Tooltip';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import VerifiedDot from '../../dot';
import { DomainType } from '../types';
import { shouldCheckDomainStatus, checkIsWildcardDomain } from '../../util';
import Certificate from '../../certificate';

export default function DomainStatus({ domain, filters = ['domain', 'http'] }) {
  const { t } = useLocaleContext();

  const { value: name, domainStatus } = domain;

  if (!shouldCheckDomainStatus(name)) {
    return null;
  }

  let domainIcon = null;
  let httpsIcon = null;

  const { isHttps, matchedCert } = domainStatus;

  const { dns: { ip, isDnsResolved, isCnameMatch } = {} } = domainStatus;
  // For nft-domain-forwarding, skip CNAME check since these domains use A records pointing directly to server IP
  const isForwardingDomain = domain.type === 'nft-domain-forwarding';
  const resolved = isDnsResolved && (isForwardingDomain || isCnameMatch);

  if (!checkIsWildcardDomain(name)) {
    if (resolved || ip === '127.0.0.1') {
      domainIcon = (
        <Tooltip title={t('router.domain.verify.ok')}>
          <VerifiedDot color="success" />
        </Tooltip>
      );
    } else {
      domainIcon = (
        <Tooltip title={t('router.domain.verify.notResolved')}>
          <VerifiedDot color="error" />
        </Tooltip>
      );
    }
  }

  if (resolved) {
    if (isHttps) {
      httpsIcon = <Certificate certificate={matchedCert} />;
    } else {
      httpsIcon = (
        <Tooltip title={t('router.domain.https.bad')}>
          <PrivacyTipIcon style={{ color: '#D0021B', fontSize: '1em', cursor: 'pointer' }} />
        </Tooltip>
      );
    }
  } else {
    httpsIcon = (
      <Tooltip title={t('router.domain.verify.notResolved')}>
        <DnsOutlinedIcon style={{ color: '#D0021B', fontSize: '1em', cursor: 'pointer' }} />
      </Tooltip>
    );
  }

  const items = filters.map((x) => {
    if (x === 'domain') {
      return domainIcon;
    }

    if (x === 'http') {
      return httpsIcon;
    }

    return null;
  });

  return createElement(Fragment, null, ...items);
}

DomainStatus.propTypes = {
  domain: DomainType.isRequired,
  filters: PropTypes.array,
};
