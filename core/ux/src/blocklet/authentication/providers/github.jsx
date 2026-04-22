import { Box, FormControl, TextField } from '@mui/material';
import pick from 'lodash/pick';
import noop from 'lodash/noop';
import { useCreation, useMemoizedFn } from 'ahooks';
import { Controller, useForm } from 'react-hook-form';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import { CopyButton } from '@arcblock/ux/lib/ClickToCopy';
import { Icon } from '@iconify/react';
import externalLinkIcon from '@iconify-icons/tabler/external-link';
import { joinURL } from 'ufo';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { useImperativeHandle } from 'react';
import PropTypes from 'prop-types';

import { useNodeContext } from '../../../contexts/node';
import { useBlockletContext } from '../../../contexts/blocklet';
import Section from '../../../component/section';

const defaultValue = {
  clientId: '',
  clientSecret: '',
};

function OAuthGithub({ ref = null, onSuccess = noop, sortMaps = {} }) {
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const { t, locale } = useLocaleContext();
  // TODO: 将来需要换成 permanent did
  const did = blocklet?.meta?.did;
  const github = Object.assign({ ...defaultValue }, blocklet?.settings?.authentication?.github || {});
  const appUrl =
    (blocklet.environments || []).find((item) => item.key === 'BLOCKLET_APP_URL')?.value || window.location.origin;
  const { handleSubmit, control, formState, reset } = useForm({
    defaultValues: pick(github, Object.keys(defaultValue)),
  });
  const onSubmit = useMemoizedFn(async (data) => {
    try {
      const { blocklet: blockletChanged } = await api.configAuthentication({
        input: {
          did,
          authentication: JSON.stringify({
            ...sortMaps,
            github: {
              ...data,
              order: sortMaps.github?.order ?? Object.keys(sortMaps).length,
              enabled: true,
              type: 'oauth',
            },
          }),
        },
      });

      const defaultValues = Object.assign({ ...defaultValue }, blockletChanged?.settings?.authentication?.github || {});
      // 将当前表单的默认值重置为新的数据，这样能够修正页面的 isDirty 数据
      reset(defaultValues);
      Toast.success(t('common.saveSuccess'));
      onSuccess();
    } catch (err) {
      Toast.error(err.message || t('common.saveFailed'));
    }
  });
  const validateClientId = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('authentication.github.clientIdDescription');
    }
    return true;
  });
  const validateClientSecret = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('authentication.github.clientSecretDescription');
    }
    return true;
  });

  const documentUrl = useCreation(() => {
    if (locale === 'zh') {
      return 'https://www.arcblock.io/blog/docs/did-connect/zh/oauth-config-github';
    }
    return 'https://www.arcblock.io/blog/docs/did-connect/en/oauth-config-github';
  }, [locale]);

  const callbackUrl = joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, 'oauth/callback/github');

  useImperativeHandle(
    ref,
    () => ({
      submit: handleSubmit(onSubmit),
    }),
    [handleSubmit, onSubmit]
  );

  return (
    <Box>
      <form disabled>
        <Section title={t('authentication.viewDocument')}>
          <Box
            component="a"
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              verticalAlign: 'middle',
              color: 'inherit',
              fontSize: '14px',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}>
            {documentUrl}
            <Box
              component={Icon}
              icon={externalLinkIcon}
              sx={{
                marginLeft: '6px',
                verticalAlign: 'middle',
                lineHeight: 1,
                scale: 1.1,
              }}
            />
          </Box>
        </Section>
        <Section title={t('authentication.oauthCallbackUrl')}>
          <Box sx={{ mb: 1, verticalAlign: 'middle', fontSize: '14px', wordBreak: 'break-all' }}>
            {callbackUrl}
            <CopyButton
              locale={locale}
              content={callbackUrl}
              style={{
                marginLeft: '6px',
                verticalAlign: 'middle',
                scale: 0.8,
                lineHeight: 1,
              }}
            />
          </Box>
        </Section>
        <Section title={t('authentication.github.clientId')}>
          <Controller
            name="clientId"
            control={control}
            rules={{ validate: validateClientId }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  label={t('authentication.github.clientId')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('authentication.github.clientSecret')}>
          <Controller
            name="clientSecret"
            control={control}
            rules={{ validate: validateClientSecret }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  type="password"
                  label={t('authentication.github.clientSecret')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                />
              </FormControl>
            )}
          />
        </Section>
      </form>
    </Box>
  );
}

OAuthGithub.propTypes = {
  ref: PropTypes.any,
  onSuccess: PropTypes.func,
  sortMaps: PropTypes.object,
};

export default OAuthGithub;
