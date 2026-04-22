import { isDidDomain } from '@abtnode/util/lib/url-evaluation';
import DomainListWithPermission from '@abtnode/ux/lib/blocklet/component/domain-list';
import DomainActionCard from '@abtnode/ux/lib/blocklet/component/domain-action-card';
import { DomainProvider } from '@abtnode/ux/lib/contexts/domain';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import PageHeader from '@blocklet/launcher-layout/lib/page-header';
import { replaceSlotToIp } from '@blocklet/meta/lib/util';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import PropTypes from 'prop-types';
import { useContext, useEffect, useState } from 'react';
import useSetState from 'react-use/lib/useSetState';
import { useSearchParams } from 'react-router-dom';

import { useBlockletContext } from '../../contexts/blocklet';
import api from '../../libs/api';
import Button from './button';
import Layout from './layout';
import StepActions from './step-actions';

function DomainComponent({ onNext = () => {}, onPrevious = () => {} }) {
  const { t } = useContext(LocaleContext);
  const [error, setError] = useState(false);
  const { blocklet } = useBlockletContext();
  const [ip, setIp] = useState('');

  const site = blocklet?.site || {};
  const domains = site.domainAliases || [];
  const systemDomains = domains.map((x) => replaceSlotToIp(x.value, ip));
  const [state, setState] = useSetState({ domain: '', invalidDNSDomain: null, type: '', addDomainState: { text: '' } });

  const appPk = blocklet.environments?.find((x) => x.key === 'BLOCKLET_APP_PK')?.value;
  const cnameDomain = systemDomains.find((item) => isDidDomain(item));
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    api
      .get(`/dns-resolve?hostname=${window.location.hostname}`)
      .then(({ data }) => {
        setIp(data.address || '');
      })
      .catch((err) => {
        console.error(err.message);
      });
  }, []);

  return (
    <Container>
      <Box className="header">
        <PageHeader title={t('setup.domain.title')} subTitle={t('setup.domain.subTitle')} onClickBack={onPrevious} />
      </Box>
      <Box className="form form-container" sx={{ display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
        <Box>
          <Box
            sx={{
              color: 'text.primary',
              fontWeight: 'fontWeightBold',
              fontSize: '1.125rem',
            }}>
            <Box
              sx={{
                display: 'inline',
              }}>{`${t('setup.domain.buyOrConnect')} (${t('common.optional')})`}</Box>
          </Box>

          <Box
            sx={{
              mt: 1,
            }}>
            <DomainActionCard
              blocklet={blocklet}
              bugDidDomainProps={{
                appPk,
                appId: blocklet.appPid,
                siteId: blocklet.site.id,
                teamDid: blocklet.meta.did,
                inBlockletSetup: true,
              }}
              connectDomainProps={{
                autoFocus: false,
                appPk,
                appId: blocklet.appPid,
                siteId: blocklet.site.id,
                teamDid: blocklet.meta.did,
                cnameDomain,
                currentIp: ip,
                inBlockletSetup: true,
                shouldCheckDomain: true,
                onInputDomain: (data) => {
                  setState({ domain: data.domain, type: data.type });
                  setError(data.error);
                },
                onStateChange: (data) => setState({ addDomainState: data }),
                onSuccess: (data) => {
                  const stateData = {
                    domain: data.domain,
                    type: data.type,
                    nftDid: data.nftDid,
                    chainHost: data.chainHost,
                  };
                  searchParams.set('redirect', data.domain);
                  setSearchParams(searchParams, { replace: true });
                  setState(stateData);
                  onNext();
                },
                onError: setError,
              }}
            />
          </Box>
        </Box>

        <Box>
          <DomainListWithPermission
            inSetup
            showAllDomains
            systemTips={
              <Box
                sx={{
                  color: 'text.primary',
                  fontWeight: 'fontWeightBold',
                  fontSize: '1.125rem',
                  mb: 1,
                }}>
                <Box
                  sx={{
                    display: 'inline',
                  }}>
                  {t('setup.domain.skipDescription')}
                </Box>
              </Box>
            }
          />
        </Box>
      </Box>
      <StepActions
        mt={8}
        disabled={!!state.addDomainState.text}
        blocklet={blocklet}
        onStartNow={() => onNext('complete')}>
        {!state.domain ? (
          <Button variant="contained" disabled={!!state.addDomainState.text} onClick={() => onNext()}>
            {t('setup.continue')}
          </Button>
        ) : (
          <Button
            variant="contained"
            loading={!!state.addDomainState.text}
            disabled={error || !!state.addDomainState.text || !state.domain}
            onClick={() => onNext()}>
            {state.addDomainState.text || t('setup.continue')}
          </Button>
        )}
      </StepActions>
    </Container>
  );
}

export default function Domain(props) {
  return (
    <DomainProvider>
      <DomainComponent {...props} />
    </DomainProvider>
  );
}

DomainComponent.propTypes = {
  onNext: PropTypes.func,
  onPrevious: PropTypes.func,
};

const Container = styled(Layout)`
  height: 100%;
  overflow-y: hidden;

  .form {
    width: 100%;
    height: 100%;
  }
`;
