import { useImperativeHandle } from 'react';
import { Box, FormControlLabel } from '@mui/material';
import pick from 'lodash/pick';
import noop from 'lodash/noop';
import { useMemoizedFn } from 'ahooks';
import { Controller, useForm } from 'react-hook-form';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import PropTypes from 'prop-types';

import { useNodeContext } from '../../../contexts/node';
import { useBlockletContext } from '../../../contexts/blocklet';
import Section from '../../../component/section';
import SwitchControl from '../../component/switch-control';

const defaultValue = {
  showQrcode: true,
};
function LoginProviderDIDWallet({ ref = null, onSuccess = noop, sortMaps = {} }) {
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const { t } = useLocaleContext();
  const did = blocklet?.meta?.did;
  const authData = Object.assign({ ...defaultValue }, blocklet?.settings?.authentication?.wallet || {});
  const { handleSubmit, control, reset } = useForm({
    defaultValues: pick(authData, Object.keys(defaultValue)),
  });
  const onSubmit = useMemoizedFn(async (data) => {
    try {
      const { blocklet: blockletChanged } = await api.configAuthentication({
        input: {
          did,
          authentication: JSON.stringify({
            ...sortMaps,
            wallet: {
              ...data,
              order: sortMaps.wallet?.order ?? Object.keys(sortMaps).length,
              enabled: true,
              type: 'builtin',
            },
          }),
        },
      });

      const defaultValues = Object.assign({ ...defaultValue }, blockletChanged?.settings?.authentication?.wallet || {});
      // 将当前表单的默认值重置为新的数据，这样能够修正页面的 isDirty 数据
      reset(defaultValues);
      Toast.success(t('common.saveSuccess'));
      onSuccess();
    } catch (err) {
      Toast.error(err.message || t('common.saveFailed'));
    }
  });

  useImperativeHandle(
    ref,
    () => ({
      submit: handleSubmit(onSubmit),
    }),
    [handleSubmit, onSubmit]
  );

  return (
    <Box>
      <form>
        <Section title={t('authentication.wallet.showQrcode')}>
          <Controller
            name="showQrcode"
            control={control}
            render={({ field }) => (
              <FormControlLabel control={<SwitchControl sx={{ ml: 1 }} checked={field.value} {...field} />} />
            )}
          />
        </Section>
      </form>
    </Box>
  );
}

LoginProviderDIDWallet.propTypes = {
  ref: PropTypes.any,
  onSuccess: PropTypes.func,
  sortMaps: PropTypes.object,
};

export default LoginProviderDIDWallet;
