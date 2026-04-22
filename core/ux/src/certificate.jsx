import { useState } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import Popover from '@mui/material/Popover';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { formatToDate } from './util';
import { useNodeContext } from './contexts/node';

export default function Certificate({ certificate = {} }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const node = useNodeContext();
  const { t, locale } = useLocaleContext();

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <VerifiedUserIcon
        aria-owns={open ? 'mouse-over-popover' : undefined}
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
        style={{ color: '#44cdc6', fontSize: '1em', cursor: 'pointer' }}
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
