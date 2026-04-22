import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Tabs from '@arcblock/ux/lib/Tabs';
import { Box, Stack } from '@mui/material';
import { useCreation } from 'ahooks';
import { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import LoginProviders from './providers';
import SessionSettings from './session-settings';
import FederatedLogin from './federated';
import useMobile from '../../hooks/use-mobile';
import DIDConnectSettings from './did-connect-settings';

function LabelWrapper({ label }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        width: '100%',
      }}>
      {label}
    </Box>
  );
}

LabelWrapper.propTypes = {
  label: PropTypes.any.isRequired,
};

function Authentication({ orientation = 'horizontal' }) {
  const { t } = useContext(LocaleContext);
  const isMobile = useMobile({ key: 'lg' });
  const tabs = [
    {
      label: <LabelWrapper label={t('authentication.didConnectSettings')} />,
      value: 'didConnect',
    },
    {
      label: <LabelWrapper label={t('authentication.loginProviders')} />,
      value: 'loginProviders',
    },
    {
      label: <LabelWrapper label={t('authentication.federated')} />,
      value: 'federated',
    },
    {
      label: <LabelWrapper label={t('authentication.sessionSettings')} />,
      value: 'session',
    },
  ];

  const [currentTab, setCurrentTab] = useState(tabs[0].value);

  const contents = useCreation(
    () => ({
      didConnect: <DIDConnectSettings />,
      loginProviders: <LoginProviders />,
      federated: <FederatedLogin />,
      session: <SessionSettings />,
    }),
    [t]
  );

  if (orientation === 'vertical') {
    return (
      <Box
        sx={{
          '.MuiTab-root': {
            textAlign: 'left',
            alignItems: 'flex-start',
            fontWeight: 'normal',

            div: {
              textAlign: 'left',
            },
          },

          '.Mui-selected': {
            fontWeight: 'bold',
          },
        }}>
        <Stack
          direction={{ md: 'column', lg: 'row' }}
          sx={{
            gap: 2,
          }}>
          <Box sx={{ minWidth: '240px', flexShrink: 0 }}>
            <Tabs
              tabs={tabs}
              current={currentTab}
              orientation={isMobile ? 'horizontal' : 'vertical'}
              onChange={setCurrentTab}
              sx={{ borderRight: isMobile ? 0 : 1, height: '100%', borderColor: 'divider' }}
            />
          </Box>
          <Box
            sx={{
              flexGrow: 1,
              minWidth: 0,
            }}>
            <Box
              sx={{
                maxWidth: '1200px',
              }}>
              {contents[currentTab]}
            </Box>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Tabs tabs={tabs} current={currentTab} onChange={setCurrentTab} />
      <Box
        sx={{
          marginTop: '10px',
        }}>
        {contents[currentTab]}
      </Box>
    </Box>
  );
}

Authentication.propTypes = {
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
};

export default Authentication;
