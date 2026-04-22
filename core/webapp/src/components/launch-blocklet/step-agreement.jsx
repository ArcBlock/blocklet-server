import { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { getDisplayName } from '@blocklet/meta/lib/util';
import ResultMessage from '@blocklet/launcher-layout/lib/launch-result-message';
import PageHeader from '@blocklet/launcher-layout/lib/page-header';
import Spinner from '@mui/material/CircularProgress';
import isEmpty from 'lodash/isEmpty';
import Center from '@arcblock/ux/lib/Center';
import Toast from '@arcblock/ux/lib/Toast';
import { getBlockletUrls } from '@abtnode/ux/lib/util';
import Agreement from '@abtnode/ux/lib/blocklet/agreement';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { hasMountPoint, hasStartEngine, isGatewayBlocklet, isPackBlocklet } from '@blocklet/meta/lib/engine';

import { useNodeContext } from '../../contexts/node';
import { useLaunchBlockletContext } from '../../contexts/launch-blocklet';
import { getAccessibleUrl } from '../../libs/util';
import Button from './button';

export default function StepAgreement({ onClickNext = null, showPageHeader = true }) {
  const navigate = useNavigate();
  const [accessUrl, setAccessUrl] = useState(null);
  const [accessUrlLoading, setAccessUrlLoading] = useState(false);
  const { t } = useLocaleContext();
  const { info, api } = useNodeContext();
  const { loading, meta, isRunning, isInstalled, isInstalling, appDid, isExternal } = useLaunchBlockletContext();
  const [installRelated, setInstallRelated] = useState(true);

  const managerUrl = useMemo(() => {
    if (!isExternal) {
      return `/blocklets/${appDid}/overview`;
    }

    if (!accessUrl) {
      return '';
    }

    const u = new URL(accessUrl);
    return `${u.origin}${WELLKNOWN_SERVICE_PATH_PREFIX}/admin`;
  }, [accessUrl, isExternal, appDid]);

  const navigateToInstallingPage = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (!installRelated) {
      urlParams.set('onlyRequired', '1');
    }

    navigate(`/launch-blocklet/install?${urlParams.toString()}`);
  };

  const clickNext = onClickNext || navigateToInstallingPage;

  const getAccessUrl = async () => {
    try {
      setAccessUrlLoading(true);
      const { blocklet: b } = await api.getBlocklet({ input: { did: meta.did, attachRuntimeInfo: true } });

      const urls = getBlockletUrls({ blocklet: b });
      const accessUrlTmp = await getAccessibleUrl(urls);
      if (!accessUrlTmp && isEmpty(accessUrlTmp)) {
        setAccessUrl(null);
        return;
      }
      setAccessUrl(new URL(accessUrlTmp).href);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setAccessUrlLoading(false);
    }
  };

  useEffect(() => {
    if (loading) {
      return;
    }

    if (isInstalling) {
      navigateToInstallingPage();
      return;
    }

    if (isRunning || (isInstalled && isExternal)) {
      getAccessUrl();
    }
  }, [isRunning, isExternal, isInstalled, isInstalling]); // eslint-disable-line

  if (isInstalled) {
    const already = isRunning ? 'alreadyRunning' : 'alreadyInstalled';

    return (
      <ResultMessage
        variant="info"
        title={t('common.reminder')}
        subTitle={t(`launchBlocklet.${already}`, { name: getDisplayName({ meta }, true) })}
        footer={
          <ButtonWrap>
            <Button
              loading={!managerUrl}
              data-cy="view-blocklet"
              component={isExternal ? undefined : Link}
              to={managerUrl}
              href={managerUrl}
              variant={isRunning ? 'outlined' : 'contained'}
              color="primary">
              {t('launchBlocklet.viewApplication')}
            </Button>
            {isRunning && (
              <Button
                loading={accessUrlLoading}
                className="last-button"
                disabled={!accessUrl}
                href={accessUrl}
                data-cy="open-blocklet">
                {t('common.open')}
              </Button>
            )}
          </ButtonWrap>
        }
      />
    );
  }

  if (!info) {
    return (
      <Center relative="parent">
        <Spinner />
      </Center>
    );
  }

  if (!(hasStartEngine(meta) || isGatewayBlocklet(meta) || isPackBlocklet(meta) || hasMountPoint(meta))) {
    return (
      <Container className="center">
        <ResultMessage variant="error" subTitle={t('launchBlocklet.error.resourceBlocklet')} />
      </Container>
    );
  }

  return (
    <Container>
      {showPageHeader && <PageHeader title={t('launchBlocklet.introduction')} subTitle={t('launchBlocklet.welcome')} />}
      <Agreement
        installRelated={installRelated}
        onChangeInstallRelated={setInstallRelated}
        meta={meta}
        onClickNext={clickNext}
        handleDescEle={<p>{t('blocklet.component.addComponentTip.belowInformation')}</p>}
      />
    </Container>
  );
}

StepAgreement.propTypes = {
  onClickNext: PropTypes.func,
  showPageHeader: PropTypes.bool,
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  &.center {
    justify-content: center;
  }
`;

const ButtonWrap = styled.div`
  .MuiButton-root {
    ${props => props.theme.breakpoints.up('md')} {
      min-width: 200px;
    }
  }
  .last-button {
    margin-left: ${props => props.theme.spacing(2)};
  }
`;
