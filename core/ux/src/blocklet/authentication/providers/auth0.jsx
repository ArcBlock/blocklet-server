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
  domain: '',
  clientId: '',
  clientSecret: '',
};
function OAuthAuth0({ ref = null, onSuccess = noop, sortMaps = {} }) {
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const { t, locale } = useLocaleContext();
  const did = blocklet?.meta?.did;
  const auth0 = Object.assign({ ...defaultValue }, blocklet?.settings?.authentication?.auth0 || {});
  const appUrl =
    (blocklet.environments || []).find((item) => item.key === 'BLOCKLET_APP_URL')?.value || window.location.origin;
  const { handleSubmit, control, formState, reset } = useForm({
    defaultValues: pick(auth0, Object.keys(defaultValue)),
  });
  const onSubmit = useMemoizedFn(async (data) => {
    try {
      const { blocklet: blockletChanged } = await api.configAuthentication({
        input: {
          did,
          authentication: JSON.stringify({
            ...sortMaps,
            auth0: {
              ...data,
              order: sortMaps.auth0?.order ?? Object.keys(sortMaps).length,
              enabled: true,
              type: 'oauth',
            },
          }),
        },
      });

      const defaultValues = Object.assign({ ...defaultValue }, blockletChanged?.settings?.authentication?.auth0 || {});
      // 将当前表单的默认值重置为新的数据，这样能够修正页面的 isDirty 数据
      reset(defaultValues);
      Toast.success(t('common.saveSuccess'));
      onSuccess();
    } catch (err) {
      Toast.error(err.message || t('common.saveFailed'));
    }
  });
  const validateDomain = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('authentication.auth0.domainDescription');
    }
    return true;
  });
  const validateClientId = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('authentication.auth0.clientIdDescription');
    }
    return true;
  });
  const validateClientSecret = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('authentication.auth0.clientSecretDescription');
    }
    return true;
  });

  const documentUrl = useCreation(() => {
    if (locale === 'zh') {
      return 'https://www.arcblock.io/blog/docs/did-connect/zh/oauth-config-auth0';
    }
    return 'https://www.arcblock.io/blog/docs/did-connect/en/oauth-config-auth0';
  }, [locale]);

  const callbackUrl = joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, 'oauth/callback/auth0');

  useImperativeHandle(
    ref,
    () => ({
      submit: handleSubmit(onSubmit),
    }),
    [handleSubmit, onSubmit]
  );

  return (
    <Box>
      <form onSubmit={handleSubmit(onSubmit)} disabled>
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
        <Section title={t('authentication.auth0.domain')}>
          <Controller
            name="domain"
            control={control}
            rules={{ validate: validateDomain }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  label={t('authentication.auth0.domain')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('authentication.auth0.clientId')}>
          <Controller
            name="clientId"
            control={control}
            rules={{ validate: validateClientId }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  label={t('authentication.auth0.clientId')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('authentication.auth0.clientSecret')}>
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
                  label={t('authentication.auth0.clientSecret')}
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
OAuthAuth0.propTypes = {
  ref: PropTypes.any,
  onSuccess: PropTypes.func,
  sortMaps: PropTypes.object,
};

export default OAuthAuth0;
