import { useContext, useImperativeHandle } from 'react';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useCreation, useMemoizedFn, useReactive, useRequest } from 'ahooks';
import Button from '@arcblock/ux/lib/Button';
import Dialog from '@arcblock/ux/lib/Dialog';
import Toast from '@arcblock/ux/lib/Toast';
import { Controller, useForm } from 'react-hook-form';
import { InputAdornment, TextField } from '@mui/material';
import { useTheme } from '@arcblock/ux/lib/Theme';
import omit from 'lodash/omit';
import noop from 'lodash/noop';
import sortBy from 'lodash/sortBy';
import { withTrailingSlash } from 'ufo';
import { SECURITY_RULE_DEFAULT_ID } from '@abtnode/constant';
import PropTypes from 'prop-types';

import { useBlockletContext } from '../../contexts/blocklet';
import SimpleSelect from '../../simple-select';
import { useNodeContext } from '../../contexts/node';

export default function BlockletSecurityItemDialog({ ref = null }) {
  const { t } = useContext(LocaleContext);
  const { blocklet } = useBlockletContext();
  const { api } = useNodeContext();
  const did = blocklet?.meta?.did;
  const theme = useTheme();
  const leavingScreen = theme?.transitions?.duration?.leavingScreen || 300;
  const currentState = useReactive({
    mode: 'add', // add | edit | view
    show: false,
    isDefaultRule: false,
    callback: noop,
    loadingButton: false,
    get dialogTitle() {
      // eslint-disable-next-line react/no-this-in-sfc
      if (this.mode === 'edit') {
        return t('securityRule.edit');
      }
      // eslint-disable-next-line react/no-this-in-sfc
      if (this.mode === 'view') {
        return t('securityRule.view');
      }
      return t('securityRule.add');
    },
  });
  const accessPolicyState = useRequest(
    async () => {
      const { accessPolicies } = await api.getBlockletAccessPolicies({ input: { did } });
      return sortBy(accessPolicies, (x) => (x.isProtected ? 1 : 0));
    },
    { manual: true }
  );
  const responseHeaderPolicyState = useRequest(
    async () => {
      const { responseHeaderPolicies } = await api.getBlockletResponseHeaderPolicies({ input: { did } });
      return sortBy(responseHeaderPolicies, (x) => (x.isProtected ? 1 : 0));
    },
    { manual: true }
  );
  const {
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset: resetForm,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      componentDid: '',
      pathPattern: '',
      responseHeaderPolicyId: '',
      accessPolicyId: '',
      remark: '',
    },
  });
  const reset = useMemoizedFn(() => {
    resetForm();
    currentState.mode = 'add';
  }, []);
  const close = useMemoizedFn(() => {
    currentState.show = false;
    setTimeout(() => {
      reset();
    }, leavingScreen);
  }, []);
  const open = useMemoizedFn((fn, rawData = null) => {
    currentState.loadingButton = false;
    currentState.show = true;
    if (rawData) {
      currentState.isDefaultRule = rawData.id === SECURITY_RULE_DEFAULT_ID;
      currentState.mode = 'edit';
      setValue('componentDid', rawData.componentDid);
      setValue('pathPattern', rawData.pathPattern);
      setValue('responseHeaderPolicyId', rawData.responseHeaderPolicyId);
      setValue('accessPolicyId', rawData.accessPolicyId);
      setValue('remark', rawData.remark || '');
    }
    if (fn) {
      currentState.callback = fn;
    } else {
      currentState.mode = 'view';
    }
    accessPolicyState.run();
    responseHeaderPolicyState.run();
  }, []);
  useImperativeHandle(
    ref,
    () => ({
      open,
      close,
    }),
    [open, close]
  );

  const checkFormState = useMemoizedFn(() => {
    const [accessPolicyId, responseHeaderPolicyId] = getValues(['accessPolicyId', 'responseHeaderPolicyId']);
    if (!accessPolicyId && !responseHeaderPolicyId) {
      return t('securityRule.form.accessPolicyOrResponseHeaderPolicyRequired');
    }
    return true;
  });

  const done = useMemoizedFn(() => {
    currentState.loadingButton = false;
  });

  const handleFormSubmit = useMemoizedFn((params) => {
    const checkRes = checkFormState();
    if (checkRes === true) {
      const data = currentState.isDefaultRule ? omit(params, 'componentDid') : params;
      currentState.loadingButton = true;
      currentState.callback(data, { close, done });
    } else {
      Toast.error(checkRes);
    }
  }, []);

  const componentDid = watch('componentDid');

  const validPathPattern = useMemoizedFn((raw) => {
    const value = raw?.trim();
    if (!value) return t('common.requiredErrorText', { name: t('securityRule.form.pathPattern') });
    if (componentDid) {
      if (value.startsWith('/')) {
        return t('securityRule.form.pathPatternErrorText');
      }
    } else if (!value.startsWith('/') && value !== '*') {
      return t('securityRule.form.pathPatternErrorText');
    }
    return true;
  });
  const validAccessPolicy = useMemoizedFn((raw) => {
    const value = raw?.trim();
    if (!value) return t('common.requiredErrorText', { name: t('securityRule.form.accessPolicy') });
    return true;
  });
  const validResponseHeaderPolicy = useMemoizedFn((raw) => {
    const value = raw?.trim();
    if (!value) return t('common.requiredErrorText', { name: t('securityRule.form.responseHeaderPolicy') });
    return true;
  });

  const mountPoint = useCreation(() => {
    const components = blocklet?.children || [];
    const findComponent = components.find((item) => item.meta.did === componentDid);
    return findComponent?.mountPoint ? withTrailingSlash(findComponent.mountPoint) : null;
  }, [blocklet, componentDid]);

  return (
    <Dialog
      open={currentState.show}
      title={currentState.dialogTitle}
      onClose={close}
      PaperProps={{
        style: {
          minHeight: 'unset',
        },
      }}
      actions={
        <Button
          color="primary"
          autoFocus
          variant="contained"
          loading={currentState.loadingButton}
          loadingPosition="start"
          onClick={handleSubmit(handleFormSubmit)}>
          {t('common.confirm')}
        </Button>
      }>
      <form noValidate autoComplete="off">
        {currentState.isDefaultRule ? null : (
          <Controller
            name="componentDid"
            control={control}
            render={({ field }) => {
              return (
                <SimpleSelect
                  fullWidth
                  margin="dense"
                  size="small"
                  label={t('securityRule.form.component')}
                  placeholder={t('securityRule.form.componentPlaceholder')}
                  options={blocklet.children.map((item) => ({
                    title: item.meta.title,
                    value: item.meta.did,
                    description: item.mountPoint,
                  }))}
                  error={!!errors?.componentDid?.message}
                  helperText={errors?.componentDid?.message || 'Choose belong to component'}
                  {...omit(field, 'ref')}
                  readOnly={currentState.mode === 'view'}
                />
              );
            }}
          />
        )}

        <Controller
          name="pathPattern"
          control={control}
          rules={{ validate: validPathPattern }}
          render={({ field }) => {
            return (
              <TextField
                fullWidth
                required
                margin="dense"
                size="small"
                placeholder={t('securityRule.form.pathPatternPlaceholder')}
                label={t('securityRule.form.pathPattern')}
                error={!!errors?.pathPattern?.message}
                helperText={errors?.pathPattern?.message || '/abc/bcd or /abc or /abc/*'}
                {...field}
                disabled={currentState.isDefaultRule || currentState.mode === 'view'}
                slotProps={{
                  input: {
                    startAdornment: mountPoint ? <InputAdornment position="start">{mountPoint}</InputAdornment> : null,
                  },
                }}
              />
            );
          }}
        />
        <Controller
          name="accessPolicyId"
          control={control}
          rules={{ validate: currentState.isDefaultRule ? validAccessPolicy : noop }}
          render={({ field }) => {
            return (
              <SimpleSelect
                fullWidth
                required={currentState.isDefaultRule}
                margin="dense"
                size="small"
                label={t('securityRule.form.accessPolicy')}
                placeholder={t('securityRule.form.accessPolicyPlaceholder')}
                options={(accessPolicyState.data || []).map((item) => ({
                  value: item.id,
                  title: item.name,
                  description: item.description,
                }))}
                error={!!errors?.accessPolicyId?.message}
                helperText={errors?.accessPolicyId?.message || t('securityRule.form.accessPolicyHelperText')}
                {...omit(field, 'ref')}
                disabled={currentState.mode === 'view'}
              />
            );
          }}
        />
        <Controller
          name="responseHeaderPolicyId"
          control={control}
          rules={{ validate: currentState.isDefaultRule ? validResponseHeaderPolicy : noop }}
          render={({ field }) => {
            return (
              <SimpleSelect
                fullWidth
                required={currentState.isDefaultRule}
                margin="dense"
                size="small"
                label={t('securityRule.form.responseHeaderPolicy')}
                placeholder={t('securityRule.form.responseHeaderPolicyPlaceholder')}
                options={(responseHeaderPolicyState.data || []).map((item) => ({
                  title: item.name,
                  value: item.id,
                  description: item.description,
                }))}
                error={!!errors?.responseHeaderPolicyId?.message}
                helperText={
                  errors?.responseHeaderPolicyId?.message || t('securityRule.form.responseHeaderPolicyHelperText')
                }
                {...omit(field, 'ref')}
                disabled={currentState.mode === 'view'}
              />
            );
          }}
        />
        <Controller
          name="remark"
          control={control}
          render={({ field }) => {
            return (
              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={7}
                size="small"
                margin="dense"
                placeholder={t('securityRule.form.remarkPlaceholder')}
                label={t('securityRule.form.remark')}
                helperText={errors?.message}
                {...field}
                disabled={currentState.mode === 'view'}
              />
            );
          }}
        />
      </form>
    </Dialog>
  );
}

BlockletSecurityItemDialog.propTypes = {
  ref: PropTypes.any,
};
