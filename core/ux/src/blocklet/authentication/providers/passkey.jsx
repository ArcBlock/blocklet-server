import { useImperativeHandle } from 'react';
import noop from 'lodash/noop';
import { useMemoizedFn } from 'ahooks';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import PropTypes from 'prop-types';

import { useNodeContext } from '../../../contexts/node';
import { useBlockletContext } from '../../../contexts/blocklet';

function LoginProviderPasskey({ ref = null, onSuccess = noop, sortMaps = {} }) {
  const { api } = useNodeContext();
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
            passkey: {
              order: sortMaps.passkey?.order ?? Object.keys(sortMaps).length,
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

  useImperativeHandle(
    ref,
    () => ({
      submit: onSubmit,
    }),
    [onSubmit]
  );

  return null;
}

LoginProviderPasskey.propTypes = {
  ref: PropTypes.any,
  onSuccess: PropTypes.func,
  sortMaps: PropTypes.object,
};

export default LoginProviderPasskey;
