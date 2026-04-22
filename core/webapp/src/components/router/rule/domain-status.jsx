import { useState, createElement, Fragment } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import HttpsIcon from '@mui/icons-material/Https';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import VerifiedDot from '@abtnode/ux/lib/dot';
import { useNodeContext } from '../../../contexts/node';
import { useDomainStatusContext } from '../../../contexts/domain-status';
import { formatToDate, shouldCheckDomainStatus, checkIsWildcardDomain } from '../../../libs/util';

function Certificate({ certificate = {} }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const node = useNodeContext();
  const { t, locale } = useLocaleContext();

  const handlePopoverOpen = event => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <HttpsIcon
        aria-owns={open ? 'mouse-over-popover' : undefined}
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
        style={{ color: '#44cdc6', fontSize: 20, marginLeft: 8, cursor: 'pointer' }}
      />
      <Popover
        id="mouse-over-popover"
        style={{ pointerEvents: 'none' }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus>
        <Card>
          <CardContent style={{ display: 'flex' }}>
            <div>
              <img
                src={`${node.imgPrefix}/https-certificate-icon.png`}
                alt="certificate icon"
                style={{ maxHeight: '100%', maxWidth: '100%' }}
              />
            </div>
            <Typography component="div" style={{ marginLeft: '16px' }}>
              <Typography component="div" style={{ fontWeight: 'bold' }}>
                {certificate.domain}
              </Typography>
              <Typography component="div">
                {`${t('common.issuer')}: ${get(certificate, 'issuer.commonName', '')}`}
              </Typography>
              <Typography component="div">
                {`${t('router.cert.issuedOn')}: ${formatToDate(certificate.validFrom, locale)}`}
              </Typography>
              <Typography component="div">
                {`${t('router.cert.expiryOn')}: ${formatToDate(certificate.validTo, locale)}`}
              </Typography>
            </Typography>
          </CardContent>
        </Card>
      </Popover>
    </>
  );
}

Certificate.propTypes = {
  certificate: PropTypes.object,
};

export default function DomainStatus({ name, type, filters = ['domain', 'http'] }) {
  const { t } = useLocaleContext();
  const { status } = useDomainStatusContext();

  if (type !== 'domain') {
    return null;
  }

  if (!shouldCheckDomainStatus(name)) {
    return null;
  }

  let domainIcon = null;
  let httpsIcon = null;

  const { isHttps, matchedCert } = status[name] || {};

  if (!checkIsWildcardDomain(name)) {
    const { dns: { resolved, ip } = {} } = status[name] || {};
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

  if (isHttps) {
    httpsIcon = <Certificate certificate={matchedCert} />;
  } else {
    httpsIcon = (
      <Tooltip title={t('router.domain.https.bad')}>
        <HttpsIcon style={{ color: '#D0021B', fontSize: 20, marginLeft: 8, cursor: 'pointer' }} />
      </Tooltip>
    );
  }

  const items = filters.map(x => {
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
  type: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  filters: PropTypes.array,
};
