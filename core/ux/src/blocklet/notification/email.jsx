import { useState } from 'react';
import { Box, FormControl, FormControlLabel, Stack, Switch, TextField, Tooltip } from '@mui/material';
import styled from '@emotion/styled';
import pick from 'lodash/pick';
import { useMemoizedFn, useReactive } from 'ahooks';
import { Controller, useForm } from 'react-hook-form';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import Button from '@arcblock/ux/lib/Button';
import isEmail from 'validator/lib/isEmail';
import isURL from 'validator/lib/isURL';
import isPort from 'validator/lib/isPort';
import { useConfirm } from '@arcblock/ux/lib/Dialog';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import HelpIcon from '@mui/icons-material/Help';

import { useNodeContext } from '../../contexts/node';
import { useBlockletContext } from '../../contexts/blocklet';
import Section from '../../component/section';
import { Accordion, AccordionSummary, AccordionDetails } from '../../schema-form/collapse';

const defaultFormValues = {
  enabled: false,
  secure: false,
  from: '',
  host: '',
  port: '',
  user: '',
  password: '',
  companyName: '',
  companyLink: '',
  companyAddress: '',
  supportEmail: '',
};

function NotificationEmail() {
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const { t } = useLocaleContext();
  const { confirmApi, confirmHolder } = useConfirm();
  const [loading, setLoading] = useState(false);

  const did = blocklet?.meta?.did;
  const config = Object.assign({ ...defaultFormValues }, blocklet?.settings?.notification?.email || {});

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
          notification: JSON.stringify({ email: data }),
        },
      });

      const defaultValues = Object.assign(
        { ...defaultFormValues },
        blockletChanged?.settings?.notification?.email || {}
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
  const onTestEmail = useMemoizedFn(async (data, event, receiver) => {
    try {
      setLoading(true);
      // HACK: 如果当前数据有修改，则需要先保存配置，才能测试
      if (formState.isDirty) {
        await onSubmit(data, event, false);
      }
      await api.sendEmail({
        input: {
          did,
          receiver,
          email: JSON.stringify({
            body: 'Your SMTP configuration is correct!',
            title: 'Test email',
            type: 'notification',
            attachments: [
              {
                type: 'link',
                data: {
                  url: 'https://community.arcblock.io',
                  title: 'Community',
                  image: 'https://community.arcblock.io/.well-known/service/blocklet/logo-rect-dark',
                  utm: {
                    campaign: 'test-campaign',
                  },
                },
              },
            ],
            utm: {
              content: 'test-email-button',
            },
          }),
        },
      });
      Toast.success(t('notification.email.testSuccess'));
    } catch (err) {
      Toast.error(err.message || t('notification.email.testfailed'));
    } finally {
      setLoading(false);
    }
  });

  const showTestEmailModal = useMemoizedFn((data, event) => {
    // @note: Support customizing default email address during testing
    pageState.testReceiver = localStorage.getItem('test-receiver') || '';
    pageState.testReceiverError = '';
    confirmApi.open({
      title: t('notification.email.testSendEmail'),
      // eslint-disable-next-line react/no-unstable-nested-components
      content: () => {
        return (
          <Box sx={{ width: '300px' }}>
            <TextField
              sx={{ mt: 1 }}
              fullWidth
              name="testReceiver"
              label={t('notification.email.inputTestReceiver')}
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
        const receiverEmail = pageState.testReceiver?.trim();
        if (!receiverEmail) {
          pageState.testReceiverError = t('notification.email.receiverRequired');
          return;
        }
        if (!isEmail(receiverEmail)) {
          pageState.testReceiverError = t('notification.email.receiverInvalid');
          return;
        }
        pageState.testReceiverError = '';
        await onTestEmail(data, event, receiverEmail);
        close();
      },
      onCancel: () => {
        setLoading(false);
      },
    });
  });

  const validateFrom = useMemoizedFn((value) => {
    const val = value?.trim();
    if (!val) {
      return t('notification.email.fromRequired');
    }
    if (!isEmail(val)) {
      return t('notification.email.fromInvalid');
    }
    return true;
  });
  const validateHost = useMemoizedFn((value) => {
    const val = value?.trim();
    if (!val) {
      return t('notification.email.hostRequired');
    }
    if (
      !isURL(val, {
        require_host: false,
        protocols: [],
      })
    ) {
      return t('notification.email.hostInvalid');
    }
    return true;
  });
  const validatePort = useMemoizedFn((val) => {
    if (!val) {
      return t('notification.email.portRequired');
    }
    if (!isPort(val)) {
      return t('notification.email.portInvalid');
    }
    return true;
  });
  const validateUser = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('notification.email.userRequired');
    }
    return true;
  });
  const validatePassword = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('notification.email.passwordRequired');
    }
    return true;
  });
  const validateLink = useMemoizedFn((val) => {
    if (
      val?.trim() &&
      !isURL(val, {
        protocols: ['http', 'https'],
        require_protocol: true,
      })
    ) {
      return t('notification.email.linkInvalid');
    }
    return true;
  });
  const validateEmail = useMemoizedFn((val) => {
    if (val?.trim() && !isEmail(val)) {
      return t('notification.email.emailInvalid');
    }
    return true;
  });
  const noop = useMemoizedFn(() => true);

  return (
    <Box>
      <Form component="form" onSubmit={handleSubmit(onSubmit)} disabled sx={{ '.section-left': { width: '160px' } }}>
        <Section title={t('notification.email.enable')} my={2.5}>
          <Controller
            name="enabled"
            control={control}
            render={({ field }) => <FormControlLabel control={<Switch checked={field.value} {...field} />} />}
          />
        </Section>

        <Section title={t('notification.email.from')}>
          <Controller
            name="from"
            control={control}
            rules={{ validate: enabled ? validateFrom : noop }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  required
                  label={t('notification.email.from')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                  disabled={!enabled}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('notification.email.host')}>
          <Controller
            name="host"
            control={control}
            rules={{ validate: enabled ? validateHost : noop }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  required
                  error={!!formState.errors[field.name]}
                  label={t('notification.email.host')}
                  helperText={formState.errors[field.name]?.message || '　'}
                  disabled={!enabled}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('notification.email.port')}>
          <Controller
            name="port"
            control={control}
            rules={{ validate: enabled ? validatePort : noop }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  required
                  type="number"
                  error={!!formState.errors[field.name]}
                  label={t('notification.email.port')}
                  helperText={formState.errors[field.name]?.message || '　'}
                  disabled={!enabled}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('notification.email.user')}>
          <Controller
            name="user"
            control={control}
            rules={{ validate: enabled ? validateUser : noop }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  required
                  error={!!formState.errors[field.name]}
                  label={t('notification.email.user')}
                  helperText={formState.errors[field.name]?.message || '　'}
                  disabled={!enabled}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('notification.email.password')}>
          <Controller
            name="password"
            control={control}
            rules={{ validate: enabled ? validatePassword : noop }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  required
                  type="password"
                  error={!!formState.errors[field.name]}
                  label={t('notification.email.password')}
                  helperText={formState.errors[field.name]?.message || '　'}
                  disabled={!enabled}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('notification.email.secure')}>
          <Controller
            name="secure"
            control={control}
            rules={{ validate: noop }}
            render={({ field }) => (
              <FormControl fullWidth>
                <FormControlLabel control={<Switch checked={field.value} {...field} disabled={!enabled} />} />
              </FormControl>
            )}
          />
        </Section>

        {/* 设置邮件的 footer 部分 */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ArrowForwardIosSharpIcon fontSize="small" />}
            aria-controls="panel1-content"
            id="panel1-header">
            {t('notification.email.signature')}
            <Tooltip title={t('notification.email.signatureTooltip')}>
              <HelpIcon fontSize="small" sx={{ ml: 1, cursor: 'help' }} />
            </Tooltip>
          </AccordionSummary>
          <AccordionDetails>
            <Section title={t('notification.email.companyName')}>
              <Controller
                name="companyName"
                control={control}
                rules={{ validate: noop }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <TextField
                      {...field}
                      size="small"
                      error={!!formState.errors[field.name]}
                      label={t('notification.email.companyName')}
                      helperText={formState.errors[field.name]?.message || '　'}
                      disabled={!enabled}
                    />
                  </FormControl>
                )}
              />
            </Section>
            <Section title={t('notification.email.companyLink')}>
              <Controller
                name="companyLink"
                control={control}
                rules={{ validate: enabled ? validateLink : noop }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <TextField
                      {...field}
                      size="small"
                      error={!!formState.errors[field.name]}
                      label={t('notification.email.companyLink')}
                      helperText={formState.errors[field.name]?.message || '　'}
                      disabled={!enabled}
                    />
                  </FormControl>
                )}
              />
            </Section>
            <Section title={t('notification.email.companyAddress')}>
              <Controller
                name="companyAddress"
                control={control}
                rules={{ validate: noop }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <TextField
                      {...field}
                      size="small"
                      error={!!formState.errors[field.name]}
                      label={t('notification.email.companyAddress')}
                      helperText={formState.errors[field.name]?.message || '　'}
                      disabled={!enabled}
                    />
                  </FormControl>
                )}
              />
            </Section>
            <Section title={t('notification.email.supportEmail')}>
              <Controller
                name="supportEmail"
                control={control}
                rules={{ validate: enabled ? validateEmail : noop }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <TextField
                      {...field}
                      size="small"
                      type="email"
                      error={!!formState.errors[field.name]}
                      label={t('notification.email.supportEmail')}
                      helperText={formState.errors[field.name]?.message || '　'}
                      disabled={!enabled}
                    />
                  </FormControl>
                )}
              />
            </Section>
          </AccordionDetails>
        </Accordion>
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

export default NotificationEmail;

const Form = styled(Stack)``;
