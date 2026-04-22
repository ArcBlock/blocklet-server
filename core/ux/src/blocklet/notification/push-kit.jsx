import { useState } from 'react';
import { Box, FormControl, FormControlLabel, Stack, Switch, TextField } from '@mui/material';
import styled from '@emotion/styled';
import pick from 'lodash/pick';
import { useMemoizedFn, useReactive } from 'ahooks';
import { Controller, useForm } from 'react-hook-form';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import Button from '@arcblock/ux/lib/Button';
import isURL from 'validator/lib/isURL';
import { joinURL, withQuery } from 'ufo';
import { useConfirm } from '@arcblock/ux/lib/Dialog';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import { useNodeContext } from '../../contexts/node';
import { useBlockletContext } from '../../contexts/blocklet';
import Section from '../../component/section';

const defaultFormValues = {
  enabled: false,
  endpoint: '',
  did: undefined,
  pushPath: undefined,
};

function NotificationPushKit() {
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const { t } = useLocaleContext();
  const { confirmApi, confirmHolder } = useConfirm();
  const [loading, setLoading] = useState(false);
  const did = blocklet?.meta?.did;
  const config = Object.assign({ ...defaultFormValues }, blocklet?.settings?.notification?.pushKit || {});

  const { handleSubmit, control, formState, watch, reset } = useForm({
    defaultValues: pick(config, Object.keys(defaultFormValues)),
  });

  const pageState = useReactive({
    testReceiver: '',
    testReceiverError: '',
  });

  const enabled = watch('enabled');
  const onSubmit = useMemoizedFn(async (data, event, showNotification = true) => {
    try {
      setLoading(true);
      const { blocklet: blockletChanged } = await api.configNotification({
        input: {
          did,
          notification: JSON.stringify({ pushKit: data }),
        },
      });

      const defaultValues = Object.assign(
        { ...defaultFormValues },
        blockletChanged?.settings?.notification?.pushKit || {}
      );
      // 将当前表单的默认值重置为新的数据，这样能够修正页面的 isDirty 数据
      reset(defaultValues);
      if (showNotification) {
        Toast.success(t('common.saveSuccess'));
      }
    } catch (err) {
      if (showNotification) {
        Toast.error(err.message || t('common.saveFailed'));
      } else {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  });
  const onTest = useMemoizedFn(async (data, event) => {
    try {
      setLoading(true);
      // HACK: 如果当前数据有修改，则需要先保存配置，才能测试
      if (formState.isDirty) {
        await onSubmit(data, event, false);
      }
      const appUrl = (blocklet?.configs || []).find((x) => x.key === 'BLOCKLET_APP_URL')?.value;
      const logo = withQuery(joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet/logo'), {
        v: blocklet?.meta?.version,
        t: new Date(blocklet?.updatedAt || 0).getTime(),
      });
      const notification = {
        type: 'passthrough',
        passthroughType: 'messageStatus',
        data: {
          message: {
            title: 'Test push-kit notification',
            body: 'This is message from push-kit config test',
            sender: {
              did: blocklet?.appDid,
              fullName: blocklet?.meta?.title,
              avatar: logo,
            },
          },
        },
      };
      await api.sendPush({
        input: {
          did,
          receiver: pageState.testReceiver,
          notification: JSON.stringify(notification),
        },
      });
      Toast.success(t('notification.pushKit.testSuccess'));
    } catch (err) {
      Toast.error(err.message || t('notification.pushKit.testfailed'));
    } finally {
      setLoading(false);
    }
  });

  const showTestEmailModal = useMemoizedFn((data, event) => {
    // 保持展示上一次的数据，不做重置
    // pageState.testReceiver = '';
    pageState.testReceiverError = '';
    confirmApi.open({
      title: t('notification.pushKit.testSend'),
      // eslint-disable-next-line react/no-unstable-nested-components
      content: () => {
        return (
          <Box sx={{ width: '450px', maxWidth: '100%' }}>
            <TextField
              sx={{ mt: 1 }}
              fullWidth
              name="testReceiver"
              label={t('notification.pushKit.inputTestReceiver')}
              value={pageState.testReceiver}
              onChange={(e) => {
                pageState.testReceiver = e.target.value;
              }}
              error={!!pageState.testReceiverError}
              helperText={pageState.testReceiverError || '　'}
            />
          </Box>
        );
      },
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      async onConfirm(close) {
        const receiver = pageState.testReceiver?.trim();
        if (!receiver) {
          pageState.testReceiverError = t('notification.pushKit.receiverRequired');
          return;
        }
        pageState.testReceiverError = '';
        await onTest(data, event);
        close();
      },
      onCancel: () => {
        setLoading(false);
      },
    });
  });

  const validateEndpoint = useMemoizedFn((value) => {
    const val = value?.trim();
    if (!val) {
      return t('notification.pushKit.endpointRequired');
    }
    if (!isURL(val)) {
      return t('notification.pushKit.endpointInvalid');
    }
    return true;
  });
  const noop = useMemoizedFn(() => true);

  return (
    <Box>
      <Form component="form" onSubmit={handleSubmit(onSubmit)} disabled sx={{ '.section-left': { width: '160px' } }}>
        <Section title={t('notification.pushKit.enable')} my={2.5}>
          <Controller
            name="enabled"
            control={control}
            render={({ field }) => <FormControlLabel control={<Switch checked={field.value} {...field} />} />}
          />
        </Section>

        <Section title={t('notification.pushKit.endpoint')}>
          <Controller
            name="endpoint"
            control={control}
            rules={{ validate: enabled ? validateEndpoint : noop }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  required
                  label={t('notification.pushKit.endpoint')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                  disabled={!enabled}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('notification.pushKit.customOptions')}>
          <Controller
            name="did"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  label={t('notification.pushKit.did')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                  disabled={!enabled}
                />
              </FormControl>
            )}
          />

          <Controller
            name="pushPath"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  label={t('notification.pushKit.pushPath')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                  disabled={!enabled}
                />
              </FormControl>
            )}
          />
        </Section>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            loading={loading}
            color="warning"
            onClick={handleSubmit(showTestEmailModal)}
            disabled={!enabled || loading}>
            {t('common.runTest')}
          </Button>

          <Button type="submit" variant="contained" loading={loading} disabled={!formState.isDirty || loading}>
            {t('common.save')}
          </Button>
        </Box>
      </Form>
      {confirmHolder}
    </Box>
  );
}

export default NotificationPushKit;
const Form = styled(Stack)``;
