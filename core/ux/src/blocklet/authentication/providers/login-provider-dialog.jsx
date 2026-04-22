import { useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useLatest, useMemoizedFn, useReactive } from 'ahooks';
import Button from '@arcblock/ux/lib/Button';
import Dialog from '@arcblock/ux/lib/Dialog';
import { Controller, useForm } from 'react-hook-form';
import { useTheme } from '@arcblock/ux/lib/Theme';
import omit from 'lodash/omit';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import { LOGIN_PROVIDER } from '@arcblock/ux/lib/Util/constant';
import { Box } from '@mui/material';

import SimpleSelect from '../../../simple-select';

export default function AddLoginProviderDialog({ ref = null, providers = [], sortMaps = {} }) {
  const providerComponentRef = useRef(null);
  const { t } = useContext(LocaleContext);
  const theme = useTheme();
  const {
    control,
    watch,
    setValue,
    reset: resetForm,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      provider: '',
    },
  });

  const choosedProvider = watch('provider');
  const choosedProviderData = providers.find((item) => item.name === choosedProvider);
  const latestProvider = useLatest(choosedProviderData);

  const leavingScreen = theme?.transitions?.duration?.leavingScreen || 300;
  const currentState = useReactive({
    initMode: 'add',
    mode: 'add',
    show: false,
    callback: noop,
    get dialogTitle() {
      // eslint-disable-next-line react/no-this-in-sfc
      if (this.mode === 'edit') {
        return t('authentication.updateLoginProvider', { provider: latestProvider.current?.title });
      }
      return t('authentication.addLoginProvider');
    },
  });

  const reset = useMemoizedFn(() => {
    resetForm();
    currentState.mode = 'add';
    currentState.initMode = 'add';
  }, []);
  const close = useMemoizedFn(() => {
    currentState.show = false;
    setTimeout(() => {
      reset();
    }, leavingScreen);
  }, []);
  const open = useMemoizedFn((fn, rawData = null) => {
    currentState.show = true;
    if (rawData) {
      currentState.initMode = 'edit';
      currentState.mode = 'edit';
      setValue('provider', rawData.provider);
    } else {
      const defaultProvider =
        providers.find((x) => x.enabled === false)?.name || providers[0]?.name || LOGIN_PROVIDER.WALLET;
      setValue('provider', defaultProvider);
    }
    if (fn) {
      currentState.callback = fn;
    } else {
      currentState.callback = noop;
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      open,
      close,
    }),
    [open, close]
  );

  const handleFormSubmit = useMemoizedFn(() => {
    providerComponentRef.current.submit();
  }, []);

  const providerList = providers.map((provider) => {
    return {
      value: provider.name,
      title: provider.title,
      description: provider.enabled ? t('common.enabled') : '',
    };
  });

  useEffect(() => {
    if (choosedProviderData?.enabled) {
      currentState.mode = 'edit';
    } else {
      currentState.mode = 'add';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choosedProviderData?.enabled]);

  return (
    <Dialog
      open={currentState.show}
      title={currentState.dialogTitle}
      onClose={close}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        style: {
          minHeight: 'unset',
        },
      }}
      actions={
        <Button color="primary" autoFocus variant="contained" onClick={handleFormSubmit} disabled={!choosedProvider}>
          {currentState.mode === 'add' ? t('common.confirm') : t('common.update')}
        </Button>
      }>
      {currentState.initMode === 'edit' ? null : (
        <Controller
          name="provider"
          control={control}
          render={({ field }) => {
            return (
              <SimpleSelect
                required
                fullWidth
                margin="dense"
                size="small"
                label={t('authentication.chooseProvider')}
                placeholder={t('authentication.chooseProviderPlaceholder')}
                options={providerList}
                {...omit(field, 'ref')}
                slotProps={{
                  optionItem: {
                    sx: {
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    },
                  },
                }}
              />
            );
          }}
        />
      )}

      <Box
        sx={{
          mt: 2,
          '.section': { mb: 1, gap: 4 },
          '.section-left': {
            width: 150,
          },
        }}>
        {choosedProviderData?.component && (
          <choosedProviderData.component ref={providerComponentRef} onSuccess={close} sortMaps={sortMaps} />
        )}
      </Box>
    </Dialog>
  );
}

AddLoginProviderDialog.propTypes = {
  ref: PropTypes.any,
  providers: PropTypes.array,
  sortMaps: PropTypes.object,
};
