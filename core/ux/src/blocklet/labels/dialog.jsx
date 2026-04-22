import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Popover from '@mui/material/Popover';
import { SketchPicker } from 'react-color';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import PropTypes from 'prop-types';
import { mergeSx } from '@arcblock/ux/lib/Util/style';
import { urlPathFriendly } from '@blocklet/meta/lib/url-path-friendly';

import { FormControlLabel as MuiFormControlLabel } from '@mui/material';
import LabelChip from './chip';
import LabelsInput from './picker/label-input';

function FormControlLabel({ labelPlacement = 'top', sx = {}, ...props }) {
  const baseSx = { alignItems: 'stretch', m: 0, '.MuiFormControlLabel-label': { fontSize: 14, fontWeight: 'medium' } };
  const mergedSx = mergeSx(baseSx, sx);

  if (labelPlacement === 'start') {
    mergedSx.push({ justifyContent: 'space-between', alignItems: 'center' });
  }

  return <MuiFormControlLabel labelPlacement={labelPlacement} {...props} sx={mergedSx} />;
}

FormControlLabel.propTypes = {
  labelPlacement: PropTypes.oneOf(['top', 'start']),
  sx: PropTypes.any,
};

const DEFAULT_COLORS = ['#4B5563', '#1D4ED8', '#6D28D9', '#BE123C', '#B45309', '#047857'];

const isValidColor = (color) => {
  const el = new Option();
  el.style.color = color;
  return !!el.style.color;
};

function LabelFormDialog({ open = false, initialValue = {}, onSubmit = () => {}, onClose = () => {}, ...rest }) {
  const { t } = useLocaleContext();
  const isNew = !initialValue?.id;

  const [colorPickerAnchor, setColorPickerAnchor] = useState(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isValid },
  } = useForm({
    defaultValues: {
      id: initialValue?.id || '',
      slug: initialValue?.slug || '',
      title: initialValue?.title || '',
      description: initialValue?.description || '',
      color: initialValue?.color || DEFAULT_COLORS[0],
      parentId: initialValue?.parentId || '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  useEffect(() => {
    reset({
      id: initialValue?.id || '',
      slug: initialValue?.slug || '',
      title: initialValue?.title || '',
      description: initialValue?.description || '',
      color: initialValue?.color || DEFAULT_COLORS[0],
      parentId: initialValue?.parentId || '',
    });
  }, [initialValue, reset]);

  useEffect(() => {
    if (watchedValues.title && isNew) {
      setValue('slug', urlPathFriendly(watchedValues.title), { shouldValidate: true });
    }
  }, [watchedValues.title, isNew, setValue]);

  const onSubmitForm = (data) => {
    onSubmit({ ...initialValue, ...data });
  };

  const handleColorChange = (color) => {
    setValue('color', color.hex, { shouldValidate: true });
  };

  const labelPreview = { id: watchedValues.id, title: watchedValues.title, color: watchedValues.color };
  const colorPickerOpen = Boolean(colorPickerAnchor);

  return (
    <Dialog
      open={open}
      showCloseButton
      maxWidth="lg"
      title={isNew ? t('label.create') : t('label.edit')}
      actions={
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, width: '100%' }}>
          <Box>{isValidColor(labelPreview.color) && labelPreview.title && <LabelChip label={labelPreview} />}</Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button color="inherit" variant="outlined" size="small" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              size="small"
              onClick={handleSubmit(onSubmitForm)}
              disabled={!isValid}>
              {isNew ? t('common.create') : t('common.saveChanges')}
            </Button>
          </Box>
        </Box>
      }
      onClose={onClose}
      {...rest}>
      <Box sx={{ width: { xs: 1, md: 600 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <FormControlLabel
          label={t('label.name')}
          sx={{ width: '100%' }}
          control={
            <Controller
              name="title"
              control={control}
              rules={{
                required: t('label.nameRequired'),
                minLength: { value: 1, message: t('label.nameMinLength') },
                maxLength: { value: 64, message: t('label.nameMaxLength') },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  size="small"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          }
        />

        <FormControlLabel
          label={t('label.slug')}
          sx={{ width: '100%' }}
          control={
            <Controller
              name="slug"
              control={control}
              rules={{
                required: t('label.slugRequired'),
                minLength: { value: 1, message: t('label.slugMinLength') },
                maxLength: { value: 128, message: t('label.slugMaxLength') },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  size="small"
                  fullWidth
                  disabled={!isNew}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          }
        />

        <FormControlLabel
          label={t('label.description')}
          sx={{ width: '100%' }}
          control={
            <Controller
              name="description"
              control={control}
              rules={{ maxLength: { value: 255, message: t('label.descriptionMaxLength') } }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  size="small"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          }
        />

        <FormControlLabel
          label={t('label.parentLabel')}
          sx={{ width: '100%' }}
          control={
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <LabelsInput
                  value={field.value ? [field.value] : []}
                  onChange={(v) => field.onChange(v[0])}
                  sx={{ width: 1 }}
                  multiple={false}
                  LabelPickerProps={{ excludes: initialValue?.id ? [initialValue.id] : [] }}
                />
              )}
            />
          }
        />

        <FormControlLabel
          label={t('label.color')}
          sx={{ width: '100%' }}
          control={
            <Controller
              name="color"
              control={control}
              rules={{
                required: t('label.colorRequired'),
                validate: (value) => isValidColor(value) || t('label.colorInvalid'),
              }}
              render={({ field, fieldState }) => (
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: field.value,
                        borderRadius: 1,
                        border: 1,
                        borderColor: fieldState.error ? 'error.main' : 'grey.400',
                        cursor: 'pointer',
                      }}
                      onClick={(e) => setColorPickerAnchor(e.currentTarget)}
                    />
                    {fieldState.error && (
                      <Box sx={{ color: 'error.main', fontSize: '0.75rem' }}>{fieldState.error.message}</Box>
                    )}
                  </Box>

                  <Popover
                    id={colorPickerOpen ? 'label-color-picker' : undefined}
                    anchorEl={colorPickerAnchor}
                    open={colorPickerOpen}
                    onClose={() => setColorPickerAnchor(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <SketchPicker presetColors={DEFAULT_COLORS} color={field.value} onChange={handleColorChange} />
                  </Popover>
                </Box>
              )}
            />
          }
        />
      </Box>
    </Dialog>
  );
}

LabelFormDialog.propTypes = {
  open: PropTypes.bool,
  initialValue: PropTypes.object,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
};

export default LabelFormDialog;
