import { useState } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import dayjs from '@abtnode/util/lib/dayjs';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useTheme, DialogContentText, Divider, Typography } from '@mui/material';
import Button from '@arcblock/ux/lib/Button';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import DetailsIcon from '@mui/icons-material/Details';
import Dialog from '@arcblock/ux/lib/Dialog';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';

import { formatToDate } from '../../../../libs/util';

export default function DetailCert(props) {
  const { certificate = {}, ...restProps } = props;
  const { t, locale } = useLocaleContext();
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const handleClose = () => {
    setOpen(false);
  };

  const certBasicRows = [
    {
      id: 'matchedSites',
      name: t('router.cert.matchedSites'),
      value: (certificate.matchedSites || []).map(s => (
        <Typography component="div" key={s.id} style={{ fontWeight: 'inherit', fontSize: '1.1rem' }}>
          {s.domain}
        </Typography>
      )),
    },
    {
      id: 'updatedAt',
      name: t('common.updatedAt'),
      value: certificate.updatedAt ? <RelativeTime value={certificate.updatedAt} type="all" locale={locale} /> : '-',
    },
    {
      id: 'createdAt',
      name: t('common.createdAt'),
      value: certificate.createdAt ? <RelativeTime value={certificate.createdAt} type="all" locale={locale} /> : '-',
    },
  ];

  const certInfoRows = [
    {
      id: 'boundDomains',
      name: t('router.cert.boundDomains'),
      value: (
        <Typography component="span" style={{ fontSize: '1.1rem' }}>
          {(get(certificate, 'sans') || []).join(', ')}
        </Typography>
      ),
    },
    {
      id: 'issuer',
      name: t('common.issuer'),
      value: get(certificate, 'meta.issuer.commonName', ''),
    },
    {
      id: 'fingerprint',
      name: t('common.fingerprint'),
      value: get(certificate, 'meta.fingerprint'),
    },
    {
      id: 'fingerprintAlg',
      name: t('router.cert.fingerprintAlg'),
      value: get(certificate, 'meta.fingerprintAlg'),
    },
    {
      id: 'validityPeriod',
      name: t('router.cert.validityPeriod'),
      value: dayjs.duration(get(certificate, 'meta.validityPeriod'), 'ms').humanize(),
    },
    {
      id: 'issuedOn',
      name: t('router.cert.issuedOn'),
      value: formatToDate(get(certificate, 'meta.validFrom'), locale),
    },
    { id: 'expiryOn', name: t('router.cert.expiryOn'), value: formatToDate(get(certificate, 'meta.validTo'), locale) },
  ];

  return (
    <>
      <Button
        edge="end"
        onClick={() => setOpen(true)}
        size="small"
        className="rule-action"
        variant="text"
        color="secondary"
        data-cy="action-view-cert"
        {...restProps}>
        <DetailsIcon style={{ fontSize: 16 }} />
        {t('common.detail')}
      </Button>
      <Dialog
        title={t('router.cert.detail.title')}
        aria-labelledby="certificate details"
        fullWidth
        open={open}
        showCloseButton={false}
        actions={
          <Button autoFocus variant="contained" onClick={handleClose} color="secondary">
            {t('common.close')}
          </Button>
        }>
        <DialogContentText key="cert-basic" component="div" style={{ margin: theme.spacing(2) }}>
          {certBasicRows.map(row => (
            <InfoRow key={row.id} nameWidth={200} valueComponent="div" name={row.name}>
              {row.value}
            </InfoRow>
          ))}
        </DialogContentText>
        <Divider />
        <DialogContentText key="cer-info" component="div" style={{ margin: theme.spacing(2) }}>
          {certInfoRows.map(row => (
            <InfoRow key={row.id} nameWidth={200} valueComponent="div" name={row.name}>
              {row.value}
            </InfoRow>
          ))}
        </DialogContentText>
        <Divider />
      </Dialog>
    </>
  );
}

DetailCert.propTypes = {
  certificate: PropTypes.object.isRequired,
};
