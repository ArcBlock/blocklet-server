import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';

import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';

import Alert from '@mui/material/Alert';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { EVENTS } from '@abtnode/constant';

import Confirm from '../../../confirm';
import { useNodeContext } from '../../../../contexts/node';
import { useSubscription } from '../../../../libs/ws';
import { useDomainStatusContext } from '../../../../contexts/domain-status';
import { shouldCheckDomainStatus } from '../../../../libs/util';

const isCertInProgress = status => ['waiting', 'creating', 'renewaling'].includes(status);

// TODO domain of different blocklet should be isolated
function Add({ domain, onAdd = () => {}, children = null, siteId }) {
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);
  const { api } = useNodeContext();
  const [issuing, setIssuing] = useState(false);
  const { updateStatus } = useDomainStatusContext();

  const certState = useAsyncRetry(async () => {
    const { cert } = await api.findCertificateByDomain({ input: { domain } });
    return cert;
  });

  const handleIssueComplete = cert => {
    if (cert.domain === domain) {
      setIssuing(false);
    }
  };

  useEffect(() => {
    if (!certState.loading && isCertInProgress(certState.value?.status)) {
      setIssuing(true);
    }
  }, [certState]);

  useSubscription(EVENTS.CERT_ERROR, handleIssueComplete);
  useSubscription(EVENTS.CERT_ISSUED, cert => {
    certState.retry();
    updateStatus(cert.domain);

    handleIssueComplete(cert);
  });

  if (certState.loading) {
    return ''; // 如果正在加载证书的状态，则不渲染任何元素
  }

  if (certState.value?.status === 'normal') {
    return ''; // 如果证书已经生成，则不渲染任何元素
  }

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async () => {
    setLoading(true);

    try {
      await api.issueLetsEncryptCert({ input: { domain, siteId } });
      onAdd();
      setIssuing(true);
    } catch (error) {
      console.error(error);
      setIssuing(false);
    } finally {
      setLoading(false);
      setConfirmSetting(null);
    }
  };

  const setting = {
    title: t('router.cert.genLetsEncryptCert.title'),
    description: (
      <div>
        <Alert severity="success">{t('router.cert.genLetsEncryptCert.dnsTip')}</Alert>
        {t('router.cert.genLetsEncryptCert.description')}
      </div>
    ),
    confirm: t('common.confirm'),
    onConfirm,
    onCancel,
  };

  const onClick = e => {
    e.stopPropagation();
    setConfirmSetting(setting);
  };

  return (
    <>
      {issuing ? (
        <Tooltip title={t('router.cert.issuing')}>
          <CircularProgress size={12} />
        </Tooltip>
      ) : (
        children({ loading, open: onClick })
      )}
      {confirmSetting && (
        <Confirm
          color="primary"
          title={confirmSetting.title}
          description={confirmSetting.description}
          confirm={confirmSetting.confirm}
          params={confirmSetting.params}
          onConfirm={confirmSetting.onConfirm}
          onCancel={confirmSetting.onCancel}
        />
      )}
    </>
  );
}

Add.propTypes = {
  domain: PropTypes.string.isRequired,
  onAdd: PropTypes.func,
  children: PropTypes.any,
  siteId: PropTypes.string.isRequired,
};

export default function AddCert({ domain, siteId, onAdd = () => {}, children = null }) {
  const { status: domainsStatus } = useDomainStatusContext();

  if (!shouldCheckDomainStatus(domain) || domainsStatus[domain]?.isHttps) {
    return '';
  }

  return (
    <Add domain={domain} onAdd={onAdd} siteId={siteId}>
      {children}
    </Add>
  );
}

AddCert.propTypes = {
  siteId: PropTypes.string.isRequired,
  domain: PropTypes.string.isRequired,
  onAdd: PropTypes.func,
  children: PropTypes.any,
};
