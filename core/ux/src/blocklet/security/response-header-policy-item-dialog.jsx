import { useContext, useImperativeHandle } from 'react';
import { useMemoizedFn, useReactive } from 'ahooks';
import { Controller, useForm } from 'react-hook-form';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useTheme } from '@arcblock/ux/lib/Theme';
import { Switch, TextField } from '@mui/material';
import noop from 'lodash/noop';
import cloneDeep from 'lodash/cloneDeep';
import PropTypes from 'prop-types';

import { formatCORSParams, convertCORSParams, formatHeaderParams, convertHeaderParams } from './utils';
import BlockletSecurityCollapse from './security-collapse';
import BlockletSecurityCORS from './security-cors';
import BlockletSecurityHeader from './security-header';

export default function BlockletResponseHeaderPolicyItemDialog({ ref = null }) {
  const { t } = useContext(LocaleContext);
  const theme = useTheme();
  const leavingScreen = theme?.transitions?.duration?.leavingScreen || 300;
  const currentState = useReactive({
    mode: 'add', // add | edit | view
    show: false,
    loadingButton: false,
    callback: noop,
    get dialogTitle() {
      // eslint-disable-next-line react/no-this-in-sfc
      if (this.mode === 'edit') {
        return t('responseHeaderPolicy.edit');
      }
      // eslint-disable-next-line react/no-this-in-sfc
      if (this.mode === 'view') {
        return t('responseHeaderPolicy.view');
      }
      return t('responseHeaderPolicy.add');
    },
    cors: null,
    securityHeader: null,
    enableCORS: false,
  });

  const {
    handleSubmit,
    control,
    setValue,
    reset: resetForm,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
    },
  });
  const reset = useMemoizedFn(() => {
    resetForm();
    currentState.mode = 'add';
    currentState.enableCORS = false;
    currentState.cors = null;
    currentState.securityHeader = null;
  }, []);
  const close = useMemoizedFn(() => {
    currentState.show = false;
    setTimeout(() => {
      reset();
    }, leavingScreen);
  }, []);
  const open = useMemoizedFn((fn = noop, rawData = null) => {
    currentState.callback = fn;
    currentState.loadingButton = false;
    currentState.show = true;
    if (rawData) {
      if (rawData.id) {
        currentState.mode = 'edit';
      } else {
        currentState.mode = 'view';
      }
      setValue('name', rawData.name);
      setValue('description', rawData.description);
      currentState.cors = formatCORSParams(rawData.cors);
      currentState.securityHeader = formatHeaderParams(rawData.securityHeader);
      currentState.enableCORS = !!rawData.cors;
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

  const done = useMemoizedFn(() => {
    currentState.loadingButton = false;
  });

  const isReadOnly = currentState.mode === 'view';

  const handleFormSubmit = useMemoizedFn((params) => {
    const corsParams = convertCORSParams(currentState.cors);
    const headerParams = convertHeaderParams(currentState.securityHeader);
    const mergedParams = cloneDeep({
      ...params,
      cors: currentState.enableCORS ? JSON.stringify(corsParams) : null,
      securityHeader: JSON.stringify(headerParams),
    });
    currentState.loadingButton = true;
    currentState.callback(mergedParams, { close, done });
  }, []);

  const validateName = useMemoizedFn((raw) => {
    const value = raw?.trim();
    if (!value) return t('common.requiredErrorText', { name: t('accessPolicy.form.name') });
    return true;
  });

  const handleChangeHeader = (value) => {
    currentState.securityHeader = value;
  };

  const handleChangeCORS = (value) => {
    currentState.cors = value;
  };

  return (
    <Dialog
      open={currentState.show}
      title={currentState.dialogTitle}
      onClose={close}
      PaperProps={{
        style: {
          minHeight: 'unset',
          width: 900,
          maxWidth: '100%',
        },
      }}
      actions={
        <Button
          color="primary"
          autoFocus
          variant="contained"
          onClick={handleSubmit(handleFormSubmit)}
          loading={currentState.loadingButton}
          loadingPosition="start">
          {t('common.confirm')}
        </Button>
      }>
      <form noValidate autoComplete="off">
        <Controller
          name="name"
          control={control}
          rules={{ validate: validateName }}
          render={({ field }) => {
            return (
              <TextField
                fullWidth
                required
                size="small"
                margin="dense"
                disabled={isReadOnly}
                placeholder={t('accessPolicy.form.namePlaceholder')}
                label={t('accessPolicy.form.name')}
                error={!!errors?.name?.message}
                helperText={errors?.name?.message || ' '}
                {...field}
              />
            );
          }}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => {
            return (
              <TextField
                fullWidth
                multiline
                size="small"
                margin="dense"
                disabled={isReadOnly}
                minRows={3}
                maxRows={7}
                placeholder="Description"
                label="Description"
                helperText={errors?.description?.message || ' '}
                {...field}
              />
            );
          }}
        />
        <BlockletSecurityCollapse
          title="Cross-origin resource sharing (CORS)"
          value={currentState.enableCORS}
          onChange={(value) => {
            if (isReadOnly) return;
            currentState.enableCORS = value;
          }}
          showExpand={false}
          actions={<Switch size="small" disabled={isReadOnly} checked={currentState.enableCORS} />}>
          <BlockletSecurityCORS config={currentState.cors} onChange={handleChangeCORS} disabled={isReadOnly} />
        </BlockletSecurityCollapse>

        <br />

        <BlockletSecurityCollapse title="Security Headers">
          <BlockletSecurityHeader
            config={currentState.securityHeader}
            onChange={handleChangeHeader}
            disabled={isReadOnly}
          />
        </BlockletSecurityCollapse>
      </form>
    </Dialog>
  );
}

BlockletResponseHeaderPolicyItemDialog.propTypes = {
  ref: PropTypes.any,
};
