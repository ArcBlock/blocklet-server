import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Tabs from '@arcblock/ux/lib/Tabs';
import { Box, Stack } from '@mui/material';
import { useCreation } from 'ahooks';
import { useContext, useState } from 'react';
import styled from '@emotion/styled';

import BlockletSecurity from '../security';
import BlockletAccessPolicy from '../security/access-policy';
import BlockletResponseHeaderPolicy from '../security/response-header-policy';
import useMobile from '../../hooks/use-mobile';

function Security() {
  const { t } = useContext(LocaleContext);
  const isMobile = useMobile({ key: 'lg' });
  const tabs = [
    {
      label: (
        <Box
          sx={{
            textAlign: 'center',
            width: '100%',
          }}>
          {t('securityRule.title')}
        </Box>
      ),
      value: 'security',
    },
    {
      label: (
        <Box
          sx={{
            textAlign: 'center',
            width: '100%',
          }}>
          {t('accessPolicy.title')}
        </Box>
      ),
      value: 'accessPolicy',
    },
    {
      label: (
        <Box
          sx={{
            textAlign: 'center',
            width: '100%',
          }}>
          {t('responseHeaderPolicy.title')}
        </Box>
      ),
      value: 'responseHeaderPolicy',
    },
  ];

  const [currentTab, setCurrentTab] = useState(tabs[0].value);

  const contents = useCreation(
    () => ({
      security: <BlockletSecurity />,
      accessPolicy: <BlockletAccessPolicy />,
      responseHeaderPolicy: <BlockletResponseHeaderPolicy />,
    }),
    [t]
  );

  return (
    <Div>
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
          <Box>{contents[currentTab]}</Box>
        </Box>
      </Stack>
    </Div>
  );
}

export default Security;

const Div = styled.div`
  .MuiTab-root {
    text-align: left;
    align-items: flex-start;
    font-weight: normal;

    div {
      text-align: left;
    }
  }
  .Mui-selected {
    font-weight: bold;
  }
`;
