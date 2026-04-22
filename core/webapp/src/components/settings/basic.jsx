import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Toast from '@arcblock/ux/lib/Toast';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';

import { useNodeContext } from '../../contexts/node';
import BasicSetting from '../node/basic-setting';

export default function BasicSettings() {
  const { refresh, info } = useNodeContext();
  const { t } = useLocaleContext();
  const [expand, setExpand] = useState(false);

  // Trigger a background refresh on mount
  useEffect(() => {
    refresh({ silent: true });
  }, []); // eslint-disable-line

  const onSaved = () => {
    refresh({ silent: true });
    Toast.success(t('setting.saveSuccess'));
  };

  return (
    <Div>
      <Box
        sx={{
          mb: 4,
        }}>
        <BasicSetting onSaved={onSaved} submit={t('common.saveChanges')} title="" />
        <Box
          style={{ marginLeft: -8 }}
          sx={{
            mt: 6,
          }}>
          <Button onClick={() => setExpand(x => !x)}>
            {t('common.readMore')}
            {expand ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
          </Button>
        </Box>
        {expand && (
          <Box
            sx={{
              fontSize: 12,
              color: 'text.secondary',
            }}>
            <Box>
              {t('dashboard.runtimeConfig.blockletMaxMemoryLimit')}: {info.runtimeConfig.blockletMaxMemoryLimit} MB
            </Box>
            <Box>
              {t('dashboard.runtimeConfig.daemonMaxMemoryLimit')}: {info.runtimeConfig.daemonMaxMemoryLimit} MB
            </Box>
          </Box>
        )}
      </Box>
    </Div>
  );
}

const Div = styled.div`
  .eula-btn {
    text-decoration-line: underline;
    margin-top: 32px;
    margin-bottom: 32px;
  }

  .danger-zone {
    margin-top: 1vw;
    width: 100%;
    max-width: 720px;
  }
`;
