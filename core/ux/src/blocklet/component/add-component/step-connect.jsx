import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useEffect, useImperativeHandle } from 'react';
import Layout from '@blocklet/launcher-layout';
import { useStepContext } from '@blocklet/launcher-layout/lib/context/step';
import { Box, useTheme } from '@mui/material';
import styled from '@emotion/styled';

import { getBlockletLogoUrl } from '../../../util';

export default function StepContent({ ref = null, meta = null, isMobile, onStepChange }) {
  const theme = useTheme();
  const { steps, activeStep, setActiveStepByKey, setActiveStepByIndex } = useStepContext();
  const { t, locale } = useLocaleContext();

  const step = steps[activeStep];

  useEffect(() => {
    onStepChange(activeStep);
  }, [onStepChange, activeStep]);

  // expose the func and activeStep
  useImperativeHandle(ref, () => ({
    setActiveStepByKey,
    setActiveStepByIndex,
  }));

  return (
    <ContentWrapper
      component="div"
      className={isMobile ? 'mobileStyle' : ''}
      sx={{
        height: 'calc(100% - 56px)',
        '&>div>div>div:first-of-type': {
          flex: {
            md: 1,
          },
        },
      }}>
      <Layout
        locale={locale}
        blockletMeta={{ title: ' ', ...meta }}
        pcWidth="100%"
        pcHeight="100%"
        logoUrl={
          meta && meta.logo && meta.registryUrl
            ? getBlockletLogoUrl({
                did: meta.did,
                version: meta.version,
                baseUrl: meta.registryUrl,
                logoPath: meta.logo,
              })
            : null
        }
        theme={theme}
        stepTip={t('blocklet.component.add')}>
        <RightContent>{typeof step?.body === 'function' ? step.body() : step?.body}</RightContent>
      </Layout>
    </ContentWrapper>
  );
}

StepContent.propTypes = {
  ref: PropTypes.any,
  meta: PropTypes.any,
  onStepChange: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
};

const isMobileContent = (props) => {
  if (props.isMobile) {
    return `
          height: calc(100vh - 56px - 64px - 48px);
        `;
  }
  return '';
};

const RightContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;

  .bottom-button {
    min-width: 200px;
  }

  // blocklet-select-side
  aside {
    width: 140px;
  }
`;

const ContentWrapper = styled(Box)`
  ${({ className }) => {
    // mobile extra style
    if (className === 'mobileStyle') {
      return `
      & > div{
        height: 100%;
      }
      .root-header {
        .app-name-content {
          display: none;
        }
      }

      // content-panel
      .root-header + div{
        padding-top: 0;
        position: relative;
        & > div {
          padding-top: 0;
        }
      }

      header + div {
        padding-top: 0;
      }

      header {
        .header-title {
          margin-left: 0;
        }

        .header-title-name  {
          max-width: 100% !important;
        }
      }
      .app-content {
        padding: 0!important;
      }
      `;
    }

    return `
      position: relative;
      .ll-container { // 通过 Launcher Layout 组件约定的 .ll-container class 自定义 Layout 样式
        width: 100%;
        height: 100%;
        border-radius: 0;
      }

      .root-header {
        z-index: auto !important;
        position: fixed !important;
      }
      & > div {
        height: 100%;
        width: 100%;
        max-width: 100%;
        & > div {
          max-height: unset !important;
          max-width: 100%;
          & > div {
            // left-panel
            &:first-of-type {
              padding: 0;
              width: 20%;
              min-width: 180px;

              & > div:first-of-type {
                display: none;
              }
              // step
              & > div:last-child {
                // margin-top: 32px;
                margin-top: 0;
              }
            }
            // right-panel
            &:last-child {
              padding-top: 0;
              padding-right: 0px;
              overflow-y: hidden;
              .app-content {
                padding: 0 0 24px 0;
              }
              .button-container {
                padding-right: 0;
              }
            }
          }
        }
      }

    `;
  }}

  & .ll-container {
    background: ${({ theme }) => theme.palette.background.paper};
  }

  & .app-overview {
    margin-left: 0 !important;
  }

  & .flex-justify-center {
    display: flex;
    justify-content: center;
  }

  & .flex-align-center {
    display: flex;
    height: 100%;
    align-items: center;
    ${(props) => isMobileContent(props)}
  }

  & .agreement-wrapper {
    ${(props) => isMobileContent(props)}
    max-height: 60vh;
    .eula-trigger {
      padding-right: 0;
    }
    .next-button {
      display: none;
    }
  }

  & .connect {
    background: white;
  }
`;
