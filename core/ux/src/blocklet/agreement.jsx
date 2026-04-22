import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import ServerEula from '@blocklet/launcher-layout/lib/wizard/server-eula';
import WizardDesc from '@blocklet/launcher-layout/lib/wizard/wizard-desc';
import { Icon } from '@iconify/react';
import { Box, Checkbox, FormControlLabel, IconButton, Typography } from '@mui/material';
import { useState } from 'react';

import AgreementApp from './agreement-app';
import RelatedComponentsDialog from './component/related-components-dialog';
import useComponentsByBlockletMetaUrl from '../hooks/use-components-by-blocklet-meta-url';
import useCanInstallWithDocker from '../contexts/use-can-install-with-docker';

// TODO: 加载 Blocklet 定义的 Agreement
export default function Agreement({
  installRelated = true,
  onChangeInstallRelated = null,
  meta,
  onClickNext = null,
  handleDescEle = '',
}) {
  const navigate = useNavigate();
  const { t, locale } = useLocaleContext();
  const [showDependencies, setShowDependencies] = useState(false);
  const { components, loading } = useComponentsByBlockletMetaUrl(meta);
  const dockerBlockletCanInstall = useCanInstallWithDocker(meta);

  const clickNext =
    onClickNext ||
    (() => {
      navigate(`/launch-blocklet/install${window.location.search}`);
    });

  const handleShowDependencies = () => {
    setShowDependencies(true);
  };

  const handleHiddenDependencies = () => {
    setShowDependencies(false);
  };

  return (
    <Container>
      <div className="app-content">
        <div className="agreement">
          <div className="agreement-content">
            {dockerBlockletCanInstall ? (
              <WizardDesc blockletMeta={{ data: meta }} locale={locale} handleDescEle={handleDescEle} />
            ) : (
              <Box sx={{ p: 3 }}>
                <Typography>{t('launchBlocklet.dockerBlockletCantInstall')}</Typography>
              </Box>
            )}
          </div>
        </div>
      </div>
      <Box
        className="agreement-bottom"
        sx={{
          '> .agreement-loading': {
            color: 'primary.main',
          },
        }}>
        {loading ? (
          <Icon
            className="agreement-loading"
            icon="line-md:loading-loop"
            style={{ fontSize: 42, transform: 'scale(0.6)' }}
          />
        ) : null}
        {dockerBlockletCanInstall && onChangeInstallRelated && components?.length ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}>
            <FormControlLabel
              sx={{ mr: 0.5 }}
              checked={installRelated}
              onChange={(e) => onChangeInstallRelated(e.currentTarget.checked)}
              control={<Checkbox />}
              label={<span>{t('launchBlocklet.installRelatedComponents')}</span>}
            />
            <Box
              sx={{
                '> button svg': {
                  color: 'primary.main',
                },
              }}>
              <IconButton size="small" onClick={handleShowDependencies}>
                <Icon icon="octicon:package-dependencies-16" />
              </IconButton>
            </Box>
          </Box>
        ) : null}
        <div className="button-container" data-cy="agree-all">
          {dockerBlockletCanInstall ? (
            <ServerEula
              onContinue={clickNext}
              description={<AgreementApp />}
              texts={{
                listenName: t('launchBlocklet.license'),
                buttonNext: t('launchBlocklet.next'),
              }}
            />
          ) : null}
        </div>
      </Box>
      <RelatedComponentsDialog
        installRelated={installRelated}
        meta={meta}
        show={showDependencies}
        onClose={handleHiddenDependencies}
        components={components}
        loading={loading}
      />
    </Container>
  );
}

Agreement.propTypes = {
  meta: PropTypes.object.isRequired,
  onClickNext: PropTypes.func,
  handleDescEle: PropTypes.node,
  installRelated: PropTypes.bool,
  onChangeInstallRelated: PropTypes.func,
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  flex: 1;
  .app-content {
    padding: 2px 24px 24px;
    ${(props) => props.theme.breakpoints.down('md')} {
      padding-top: 10px;
    }
    width: 100%;
    flex: 1;
    letter-spacing: normal;
  }
  .agreement {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    border: 1px solid ${(props) => props.theme.palette.grey['100']};
    border-radius: 12px;
    ${(props) => props.theme.breakpoints.up('md')} {
      margin-top: 24px;
    }
    ${(props) => props.theme.breakpoints.down('md')} {
      margin-top: 16px;
    }
    .agreement-content {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      font-size: 14px;
      overflow-y: auto;
      ${(props) => props.theme.breakpoints.up('md')} {
        padding: 0 24px;
      }
      ${(props) => props.theme.breakpoints.down('md')} {
        padding: 0 16px;
      }
      &:after {
        display: block;
        content: '';
        height: 24px;
      }
    }
  }
  .agreement-bottom {
    display: flex;
    width: 100%;
    padding: 24px;
    ${(props) => props.theme.breakpoints.up('md')} {
      flex-direction: row;
      align-items: center;
      margin-left: auto;
    }
    ${(props) => props.theme.breakpoints.down('md')} {
      flex-direction: column;
      align-items: center;
      padding-top: 0;
      padding-bottom: 16px;
    }
  }
  .button-container {
    ${(props) => props.theme.breakpoints.up('md')} {
      margin-left: auto;
    }
    ${(props) => props.theme.breakpoints.down('md')} {
      padding-top: 0;
      padding-bottom: 16px;
    }
  }
`;
