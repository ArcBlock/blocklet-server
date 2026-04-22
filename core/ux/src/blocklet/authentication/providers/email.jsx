import { useImperativeHandle } from 'react';
import { Box, Button } from '@mui/material';
import noop from 'lodash/noop';
import { useMemoizedFn, useCreation } from 'ahooks';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import { Link } from 'react-router-dom';
import { joinURL, withQuery } from 'ufo';
import { WELLKNOWN_BLOCKLET_ADMIN_PATH } from '@abtnode/constant';
import PropTypes from 'prop-types';

import { useNodeContext } from '../../../contexts/node';
import { useBlockletContext } from '../../../contexts/blocklet';

function LoginProviderEmail({ ref = null, onSuccess = noop, sortMaps = {} }) {
  const { api, inService } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const { t } = useLocaleContext();
  const did = blocklet?.meta?.did;

  const onSubmit = useMemoizedFn(async () => {
    try {
      await api.configAuthentication({
        input: {
          did,
          authentication: JSON.stringify({
            ...sortMaps,
            email: {
              order: sortMaps.email?.order ?? Object.keys(sortMaps).length,
              enabled: true,
              type: 'builtin',
            },
          }),
        },
      });

      Toast.success(t('common.saveSuccess'));
      onSuccess();
    } catch (err) {
      Toast.error(err.message || t('common.saveFailed'));
    }
  });

  const emailSettingUrl = useCreation(() => {
    if (inService) {
      return withQuery(joinURL(WELLKNOWN_BLOCKLET_ADMIN_PATH, '/notification/settings'), {
        type: 'email',
      });
    }
    return withQuery(joinURL('/blocklets', blocklet.appPid, '/configuration'), {
      tab: 'notification',
      type: 'email',
    });
  }, [inService, blocklet.appPid]);

  useImperativeHandle(
    ref,
    () => ({
      submit: onSubmit,
    }),
    [onSubmit]
  );

  return (
    <Box>
      {t('authentication.emailLoginDescription')}
      <br />
      {t('authentication.emailNotificationRequired')}
      <br />
      <Box component={Link} to={emailSettingUrl} sx={{ mt: 1, display: 'inline-block' }}>
        <Button size="small" variant="outlined">
          {t('authentication.gotoEmailNotification')}
        </Button>
      </Box>
    </Box>
  );
}

LoginProviderEmail.propTypes = {
  ref: PropTypes.any,
  onSuccess: PropTypes.func,
  sortMaps: PropTypes.object,
};

export default LoginProviderEmail;
