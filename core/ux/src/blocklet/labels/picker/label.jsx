import {
  Box,
  Popper,
  ClickAwayListener,
  Autocomplete,
  autocompleteClasses,
  InputBase,
  ButtonBase,
  alpha,
} from '@mui/material';
import { Fragment, useMemo, useState } from 'react';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import PropTypes from 'prop-types';
import LabelIcon from '@mui/icons-material/LocalOfferOutlined';
import { useSessionContext } from '../../../contexts/session';
import LabelChip from '../chip';
import { useLabels } from '../context/context';

function PopperComponent({ ...other }) {
  return (
    <Box
      {...other}
      sx={(theme) => ({
        [`& .${autocompleteClasses.paper}`]: {
          width: 360,
          boxShadow: 'none',
          margin: 0,
          color: 'inherit',
          fontSize: 13,
        },
        [`& .${autocompleteClasses.listbox}`]: {
          bgcolor: theme.palette.background.paper,
          padding: 1,
          [`& .${autocompleteClasses.option}`]: { minHeight: 'auto' },
        },
        [`&.${autocompleteClasses.popperDisablePortal}`]: { position: 'relative' },
      })}
    />
  );
}

PopperComponent.propTypes = {};

function LabelPicker({
  value = [],
  onChange = undefined,
  noLabelsText = undefined,
  buttonSx = undefined,
  actions = undefined,
  trigger = undefined,
  multiple = true,
  updateImmediately = true,
  excludes = [],
  disabled = false,
  enableAccessControl = true,
  disablePortal = false,
  disableCreate = false,
}) {
  const { t, locale } = useLocaleContext();
  const { session } = useSessionContext();
  const isAdmin = ['owner', 'admin'].includes(session?.user?.role);

  const { flattenedLabels: labels, getLabelsByIds, loading, createLabel, recentLabels, addRecentLabel } = useLabels();

  const [anchorEl, setAnchorEl] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const selectedLabelIds = value;
  const selectedLabels = useMemo(() => getLabelsByIds(selectedLabelIds), [getLabelsByIds, selectedLabelIds]);

  const exists = useMemo(
    () => labels.some((x) => x.data.getName(locale)?.toLowerCase() === inputValue.toLowerCase()),
    [inputValue, labels, locale]
  );

  const filteredLabels = useMemo(() => {
    const excludesSet = new Set(excludes);
    return labels.filter((x) => !excludesSet.has(x.data.id));
  }, [labels, excludes]);

  const initialRecentLabels = useMemo(() => {
    const excludesSet = new Set(excludes);
    return recentLabels.filter((x) => !excludesSet.has(x));
  }, [recentLabels, excludes]);

  const open = Boolean(anchorEl);
  const id = open ? 'label-picker' : undefined;

  const getSelectedSx = (selected) =>
    selected
      ? {
          bgcolor: (theme) => `${theme.palette.primary.main} !important`,
          color: (theme) => `${theme.palette.primary.contrastText} !important`,
          WebkitTextFillColor: (theme) => `${theme.palette.primary.contrastText} !important`,
        }
      : undefined;

  const isLabelPermitted = () => !enableAccessControl || isAdmin;

  const handleClick = (event) => {
    if (disabled) return;
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    if (!updateImmediately) onChange?.(selectedLabelIds);

    setInputValue('');
    anchorEl?.focus();
    setAnchorEl(null);
  };

  const handleCreate = async () => {
    const { id: newLabelId } = await createLabel(inputValue);
    if (!multiple) onChange?.([newLabelId]);
    else if (updateImmediately) onChange([...selectedLabelIds, newLabelId]);
  };

  const handleLabelSelectionChange = (newValue) => {
    if (!multiple) {
      onChange?.(newValue.length ? [newValue[newValue.length - 1]] : []);
      setAnchorEl(null);
    } else if (updateImmediately) onChange(newValue);
  };

  if (loading) return null;

  const renderRecentLabels = () => {
    const recentLabelNodes = getLabelsByIds(initialRecentLabels).filter(isLabelPermitted);
    if (!recentLabelNodes?.length) return null;

    return (
      <Box component="li">
        <Box sx={{ mb: 0.5, fontSize: 12, fontWeight: 'medium' }}>{t('label.recently')}</Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
          {recentLabelNodes.map((x) => {
            const labelId = x.data.id;
            const selected = value?.includes(labelId);
            return (
              <LabelChip
                key={labelId}
                label={x.data}
                onClick={() =>
                  handleLabelSelectionChange(
                    selected ? selectedLabelIds.filter((y) => y !== labelId) : [...selectedLabelIds, labelId]
                  )
                }
                sx={{ height: 24, lineHeight: '24px', '.MuiChip-label': { maxHeight: 24 }, ...getSelectedSx(selected) }}
              />
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderGroup = (params) => (
    <Box component="li">
      <Box sx={{ mb: 0.5, fontSize: 12, fontWeight: 'medium' }}>{t('label.title')}</Box>
      <Box component="ul" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, p: 0 }}>
        {params.children}
      </Box>
    </Box>
  );

  const renderAutocomplete = () => (
    <Autocomplete
      open
      multiple
      inputValue={inputValue}
      onInputChange={(e, newValue, reason) => {
        if (reason === 'reset' || reason === 'blur') return;
        setInputValue(newValue);
      }}
      onClose={(e, reason) => reason === 'escape' && handleClose()}
      value={selectedLabels}
      onChange={(event, newValue, reason) => {
        event.preventDefault();

        if (event.type === 'keydown' && event.key === 'Backspace' && reason === 'removeOption') return;
        if (reason === 'selectOption') addRecentLabel(newValue[newValue.length - 1].data.id);

        handleLabelSelectionChange(newValue.map((x) => x.data.id));
      }}
      disableCloseOnSelect
      renderTags={() => null}
      noOptionsText={noLabelsText || t('label.noLabels')}
      groupBy={() => 'x'}
      renderOption={(props, option, { selected }) => {
        if (!isLabelPermitted(option)) return null;
        const label = option.data;

        return (
          <Box component="li" {...props} key={label.id} sx={{ '&.MuiAutocomplete-option': { p: '0 !important' } }}>
            <LabelChip
              label={label}
              sx={{ height: 24, lineHeight: '24px', '.MuiChip-label': { maxHeight: 24 }, ...getSelectedSx(selected) }}
            />
          </Box>
        );
      }}
      renderGroup={(params) => (
        <Fragment key={params.key}>
          {renderRecentLabels()}
          {renderGroup(params)}
        </Fragment>
      )}
      options={filteredLabels}
      getOptionLabel={(option) => option.data.getName(locale)}
      renderInput={(params) => (
        <Box
          component={InputBase}
          ref={params.InputProps.ref}
          inputProps={params.inputProps}
          autoFocus
          placeholder={t('label.filter')}
          sx={(theme) => ({
            padding: 1,
            width: '100%',
            bgcolor: 'background.paper',
            '& input': {
              borderRadius: 1,
              backgroundColor: 'background.paper',
              padding: 1,
              transition: theme.transitions.create(['border-color', 'box-shadow']),
              border: `1px solid ${theme.palette.divider}`,
              fontSize: 14,
              '&:focus': {
                boxShadow: `0px 0px 0px 3px ${alpha(theme.palette.primary.light, 0.4)}`,
                borderColor: theme.palette.primary.light,
              },
            },
          })}
        />
      )}
      slots={{ popper: PopperComponent }}
    />
  );

  const renderActions = () => (
    <Box onClick={(e) => e.stopPropagation()}>
      {isAdmin && inputValue && !exists && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            width: '100%',
            height: 36,
            px: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            fontSize: 14,
            color: 'grey.600',
            cursor: 'pointer',
          }}
          onClick={handleCreate}>
          {t('label.createNewLabel', { name: inputValue })}
        </Box>
      )}
      {actions}
    </Box>
  );

  return (
    <>
      <Box onClick={handleClick} sx={{ display: 'flex', alignItems: 'center' }}>
        {trigger || (
          <ButtonBase
            disableRipple
            aria-describedby={id}
            className="label-picker-trigger"
            sx={[
              (theme) => ({
                width: '100%',
                fontSize: 13,
                color: theme.palette.mode === 'light' ? '#586069' : '#8b949e',
                fontWeight: 600,
                '&:hover': { color: theme.palette.mode === 'light' ? 'primary.main' : '#58a6ff' },
                '& svg': { width: 22, height: 22 },
              }),
              ...(Array.isArray(buttonSx) ? buttonSx : [buttonSx]),
            ]}>
            <LabelIcon style={{ fontSize: 14 }} />
          </ButtonBase>
        )}
      </Box>

      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        disablePortal={disablePortal}
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: `0 8px 24px ${theme.palette.mode === 'light' ? 'rgba(149, 157, 165, 0.2)' : 'rgb(1, 4, 9)'}`,
          borderRadius: 1,
          width: 360,
          overflow: 'hidden',
          zIndex: theme.zIndex.modal,
          fontSize: 13,
          color: 'text.secondary',
          backgroundColor: 'background.paper',
        })}>
        <ClickAwayListener onClickAway={handleClose}>
          <Box onClick={(e) => e.preventDefault()}>
            {renderAutocomplete()}
            {!disableCreate && renderActions()}
          </Box>
        </ClickAwayListener>
      </Popper>
    </>
  );
}

LabelPicker.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func,
  noLabelsText: PropTypes.string,
  buttonSx: PropTypes.array,
  actions: PropTypes.array,
  trigger: PropTypes.element,
  multiple: PropTypes.bool,
  updateImmediately: PropTypes.bool,
  excludes: PropTypes.array,
  disabled: PropTypes.bool,
  enableAccessControl: PropTypes.bool,
  disablePortal: PropTypes.bool,
  labels: PropTypes.array,
  disableCreate: PropTypes.bool,
};

export default LabelPicker;
