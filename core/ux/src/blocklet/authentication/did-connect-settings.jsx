import styled from '@emotion/styled';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import SwitchControl from '@arcblock/ux/lib/Switch';
import { Box, Button, Divider, Stack } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import Toast from '@arcblock/ux/lib/Toast';
import { useCreation, useMemoizedFn } from 'ahooks';
import merge from 'lodash/merge';
import isEmpty from 'lodash/isEmpty';

import Section from '../../component/section';
import { useBlockletContext } from '../../contexts/blocklet';
import { useNodeContext } from '../../contexts/node';
import AuthTextVisualMode from './auth-text/visual-mode';

import { defaultConfig } from './auth-text/constants';

const defaultForm = {
  showDidColor: true,
  showAppInfo: true,
};

function Switch(props) {
  return <SwitchControl {...props} sx={{ transform: 'scale(0.75)' }} />;
}

export default function DIDConnectSettings() {
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const did = blocklet?.meta?.did;

  const { control, reset } = useForm({
    defaultValues: merge({}, defaultForm, blocklet?.settings?.didConnect || {}),
  });

  // action config is a json object
  const actionConfig = useCreation(() => {
    const config = blocklet?.settings?.actionConfig;
    return config && !isEmpty(config) ? config : defaultConfig;
  }, [blocklet?.settings?.actionConfig]);

  const { t } = useLocaleContext();

  const [openDialog, setOpenDialog] = useState(false);

  const handleSave = useMemoizedFn(async (fieldName, value) => {
    try {
      const currentData = {
        showDidColor: control._defaultValues?.showDidColor ?? defaultForm.showDidColor,
        showAppInfo: control._defaultValues?.showAppInfo ?? defaultForm.showAppInfo,
      };
      currentData[fieldName] = value;

      const { blocklet: blockletChanged } = await api.configDidConnect({
        input: {
          did,
          didConnect: JSON.stringify(currentData),
        },
      });

      const defaultValues = Object.assign({}, defaultForm, blockletChanged?.settings?.didConnect || {});
      reset(defaultValues);
      Toast.success(t('common.configSuccess'));
    } catch (err) {
      Toast.error(err.message);
      reset(control._defaultValues);
    }
  });

  const handleCloseDialog = useMemoizedFn(() => {
    setOpenDialog(false);
  });
  const handleOpenDialog = useMemoizedFn(() => {
    setOpenDialog(true);
  });

  const handleSaveCustomConfig = useMemoizedFn(async (config) => {
    try {
      await api.configDidConnectActions({
        input: {
          did,
          actionConfig: config,
        },
      });
      Toast.success(t('common.configSuccess'));
    } catch (err) {
      console.error(err);
      Toast.error(err.message);
    }
  });

  return (
    <Div>
      <Stack
        direction="column"
        sx={{
          gap: 4,
        }}>
        <Box>
          <Box>{t('authentication.didConnect.basicSettings')}</Box>
          <Divider sx={{ my: 2 }} />
          <Stack
            sx={{
              gap: 2,
            }}>
            <Section title={t('authentication.didConnect.showDidColor')} sectionLeftSx={{ width: '600px' }}>
              <Box sx={{ alignSelf: 'flex-start' }}>
                <Controller
                  name="showDidColor"
                  control={control}
                  render={({ field }) => {
                    return (
                      <Switch
                        {...field}
                        checked={field.value}
                        onChange={(e) => {
                          handleSave('showDidColor', e.target.checked);
                          field.onChange(e);
                        }}
                      />
                    );
                  }}
                />
              </Box>
            </Section>

            <Section title={t('authentication.didConnect.showAppInfo')} sectionLeftSx={{ width: '600px' }}>
              <Box sx={{ alignSelf: 'flex-start' }}>
                <Controller
                  name="showAppInfo"
                  control={control}
                  render={({ field }) => {
                    return (
                      <Switch
                        {...field}
                        checked={field.value}
                        onChange={(e) => {
                          handleSave('showAppInfo', e.target.checked);
                          field.onChange(e);
                        }}
                      />
                    );
                  }}
                />
              </Box>
            </Section>
          </Stack>
        </Box>

        <Box>
          <Box>{t('authentication.didConnect.customSettings')}</Box>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" sx={{ gap: 2 }}>
            <Button variant="outlined" onClick={handleOpenDialog}>
              {t('authentication.didConnect.configDialogTitle')}
            </Button>
          </Stack>
        </Box>
      </Stack>

      <AuthTextVisualMode
        open={openDialog}
        onClose={handleCloseDialog}
        onSave={handleSaveCustomConfig}
        initialConfig={actionConfig}
      />
    </Div>
  );
}

const Div = styled.div`
  max-width: 1536px;

  .advanced-config {
    border: 0;
    padding: 0;
  }

  .config-form {
    flex-grow: 1;
    overflow-y: auto;
    will-change: transform;

    &:first-child {
      margin: 0;
    }

    ${(props) => props.theme.breakpoints.down('md')} {
      width: 100%;
      flex-shrink: 0;
      padding: 0 24px;
      transform: translate(0, 0);
    }
  }

  .config-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .config-desc {
    font-weight: normal;
    font-size: 12px;
    color: #666;
  }

  .form-item {
    margin-top: 0;
  }
`;
