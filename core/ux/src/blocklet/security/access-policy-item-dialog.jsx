import PropTypes from 'prop-types';
import { useContext, useImperativeHandle } from 'react';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useMemoizedFn, useReactive } from 'ahooks';
import Button from '@arcblock/ux/lib/Button';
import Dialog from '@arcblock/ux/lib/Dialog';
import { Controller, useForm } from 'react-hook-form';
import { Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, TextField } from '@mui/material';
import { useTheme } from '@arcblock/ux/lib/Theme';
import noop from 'lodash/noop';

import { useTeamContext } from '../../contexts/team';
import FormAccessRoleInput from './form-access-role-input';
import { convertAccessPolicyParams, formartAccessPolicyParams } from './utils';

export default function BlockletAccessPolicyItemDialog({ ref = null }) {
  const { t } = useContext(LocaleContext);
  const { roles: roleList } = useTeamContext();
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
        return t('accessPolicy.edit');
      }
      // eslint-disable-next-line react/no-this-in-sfc
      if (this.mode === 'view') {
        return t('accessPolicy.view');
      }
      return t('accessPolicy.add');
    },
  });

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    reset: resetForm,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      roles: null,
      whoCanAccess: 'all',
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
      const formatData = formartAccessPolicyParams(rawData);
      setValue('name', formatData.name);
      setValue('description', formatData.description);
      setValue('roles', formatData.roles);
      setValue('whoCanAccess', formatData.whoCanAccess);
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

  const handleFormSubmit = useMemoizedFn((params) => {
    currentState.loadingButton = true;
    currentState.callback(convertAccessPolicyParams(params), { close, done });
  }, []);

  const validateName = useMemoizedFn((raw) => {
    const value = raw?.trim();
    if (!value) return t('common.requiredErrorText', { name: t('accessPolicy.form.name') });
    return true;
  });

  const whoCanAccess = watch('whoCanAccess');
  const isReadOnly = currentState.mode === 'view';

  const validateRoles = useMemoizedFn((raw) => {
    if (['roles', 'roles_reverse'].includes(whoCanAccess)) {
      if (!raw || raw?.length === 0) {
        return t('common.requiredErrorText', { name: t('accessPolicy.form.roles') });
      }
    }
    return true;
  });

  const validateWhoCanAccess = useMemoizedFn((raw) => {
    const value = raw?.trim();
    if (!value) return t('common.requiredErrorText', { name: t('accessPolicy.form.accessType') });
    return true;
  });

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
                margin="dense"
                size="small"
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
          name="whoCanAccess"
          control={control}
          rules={{ validate: validateWhoCanAccess }}
          render={({ field }) => {
            return (
              <FormAccessRoleInput
                required
                size="small"
                margin="dense"
                disabled={isReadOnly}
                error={!!errors?.whoCanAccess?.message}
                helperText={errors?.whoCanAccess?.message || ' '}
                {...field}
              />
            );
          }}
        />
        {['roles', 'roles_reverse'].includes(whoCanAccess) ? (
          <Controller
            name="roles"
            rules={{ validate: validateRoles }}
            control={control}
            render={({ field }) => {
              return (
                <FormControl variant="standard" error={!!errors?.roles?.message}>
                  <FormGroup
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      mt: -3,
                    }}>
                    {roleList.map((item) => {
                      return (
                        <FormControlLabel
                          key={item.name}
                          control={
                            <Checkbox
                              disabled={isReadOnly}
                              size="small"
                              checked={field.value?.includes(item.name)}
                              sx={{
                                p: 0.75,
                              }}
                              onChange={(e, val) => {
                                const rawValue = field.value || [];
                                if (val) {
                                  field.onChange([...rawValue, item.name]);
                                } else {
                                  field.onChange(rawValue.filter((x) => x !== item.name));
                                }
                              }}
                            />
                          }
                          label={item.title}
                        />
                      );
                    })}
                  </FormGroup>
                  <FormHelperText
                    sx={{
                      transform: 'translateY(-8px)',
                    }}>
                    {errors?.roles?.message || ' '}
                  </FormHelperText>
                </FormControl>
              );
            }}
          />
        ) : null}

        <Controller
          name="description"
          control={control}
          render={({ field }) => {
            return (
              <TextField
                fullWidth
                multiline
                disabled={isReadOnly}
                minRows={3}
                maxRows={7}
                margin="dense"
                size="small"
                placeholder={t('accessPolicy.form.descriptionPlaceholder')}
                label={t('accessPolicy.form.description')}
                helperText={errors?.message}
                {...field}
              />
            );
          }}
        />
      </form>
    </Dialog>
  );
}

BlockletAccessPolicyItemDialog.propTypes = {
  ref: PropTypes.any,
};
