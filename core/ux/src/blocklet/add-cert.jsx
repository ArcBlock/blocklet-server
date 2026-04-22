/* eslint-disable react/no-unused-prop-types */
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import { BlockletEvents } from '@blocklet/constant';
import Alert from '@mui/material/Alert';
import Spinner from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import isEmpty from 'lodash/isEmpty';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';

import Confirm from '../confirm';
import { useBlockletContext } from '../contexts/blocklet';
import { useNodeContext } from '../contexts/node';
import { shouldCheckDomainStatus, isDidDomainOrIpEchoDomain } from '../util';

const isCertInProgress = (status) => ['waiting', 'creating', 'renewaling'].includes(status);

function Add({ siteId, domain, onAdd = () => {}, children = null, did, issuing = false, setIssuing = () => {} }) {
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const { inService } = useNodeContext();
  const [confirmSetting, setConfirmSetting] = useState(null);
  const {
    api,
    ws: { useSubscription },
  } = useNodeContext();
  const {
    mode,
    actions: { refreshDomainStatus },
  } = useBlockletContext();

  const certState = useAsyncRetry(async () => {
    const { cert } = await api.findCertificateByDomain({ input: { domain, did } });
    return cert;
  });

  const handleIssueComplete = (cert, type) => {
    if (cert.domain === domain) {
      setIssuing(false);
      setLoading(false);

      // Setup 模式下有全局通知，所以这里不需要通知
      if (inService && mode !== 'setup') {
        if (type === 'success') {
          Toast.success(t('setup.domain.genCertSuccess', { domain: cert.domain }));
        } else if (type === 'error') {
          Toast.error(t('setup.domain.genCertFailed', { domain: cert.domain, message: cert.message }));
        }
      }
    }
  };

  useEffect(() => {
    if (certState.loading) {
      return;
    }

    setIssuing(isCertInProgress(certState.value?.status));
  }, [certState.loading, certState.value?.status, setIssuing]);

  useSubscription(BlockletEvents.certError, (cert) => handleIssueComplete(cert, 'error'));
  useSubscription(BlockletEvents.certIssued, (cert) => {
    certState.retry();
    refreshDomainStatus(cert.domain);

    handleIssueComplete(cert, 'success');
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
      await api.issueLetsEncryptCert({ input: { siteId, domain, did, inBlockletSetup: mode === 'setup' } });
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

  const onClick = (e) => {
    e.stopPropagation();
    setConfirmSetting(setting);
  };

  return (
    <>
      {issuing ? (
        <Tooltip title={t('router.cert.issuing')}>
          <Spinner size={13} style={{ fontSize: '13px' }} />
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
  did: PropTypes.string.isRequired,
  siteId: PropTypes.string.isRequired,
  onAdd: PropTypes.func,
  children: PropTypes.any,
  issuing: PropTypes.bool,
  setIssuing: PropTypes.func,
};

export default function AddCert({
  domain,
  domainStatus,
  did,
  onAdd = () => {},
  children = null,
  issuing = false,
  setIssuing = () => {},
  ...rest
}) {
  if (
    isDidDomainOrIpEchoDomain(domain) ||
    !shouldCheckDomainStatus(domain) ||
    isEmpty(domainStatus) ||
    domainStatus?.isHttps
  ) {
    return '';
  }

  return (
    <Add {...rest} domain={domain} did={did} onAdd={onAdd} issuing={issuing} setIssuing={setIssuing}>
      {children}
    </Add>
  );
}

AddCert.propTypes = {
  domain: PropTypes.string.isRequired,
  domainStatus: PropTypes.shape({
    isHttps: PropTypes.bool,
  }).isRequired,
  did: PropTypes.string.isRequired,
  onAdd: PropTypes.func,
  children: PropTypes.any,
  issuing: PropTypes.bool,
  setIssuing: PropTypes.func,
};
