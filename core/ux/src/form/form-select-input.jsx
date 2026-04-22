import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  useTheme,
  Box,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  Chip,
  FormHelperText,
  TextField,
} from '@mui/material';

import { keyframes } from '@emotion/react';
import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';

import Required from './required';
import FormWrapper from './form-wrapper';
import InputTriggers from './input-triggers';
/**
 * 抖动动画
 */
const shakeKeyframes = keyframes`
  0%, 100% {
    transform: scale(1) translateX(0);
  }
  50% {
    transform: scale(1.05) translateX(-3px);
  }
  25%, 75% {
    transform: scale(1.1) translateX(3px);
  }
`;

function LogoImage({ src, alt, size = 20 }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size,
        height: size,
        display: 'block',
        objectFit: 'contain',
        borderRadius: '2px',
        flexShrink: 0,
      }}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  );
}

LogoImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  size: PropTypes.number,
};

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const getStyles = (current, selected, theme) => {
  return {
    fontWeight:
      selected.indexOf(current) === -1 ? theme.typography.fontWeightRegular : theme.typography.fontWeightMedium,
  };
};

export default function FormSelectInput({
  label = '',
  disabled = false,
  required = false,
  initialValue = '',
  onChange = () => {},
  sx = {},
  onSubmit = () => {},
  triggers = [],
  options = [],
  formatterBeforeSubmit = (x) => x.join(','),
  helperText = '',
  config = {},
  directEditing = false,
  searchable = true,
  ...rest
}) {
  const theme = useTheme();
  const [editing, setEditing] = useState(directEditing);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const { multiple = false, labelField = 'name', valueField = 'code' } = config;

  const [defaultValue, setDefaultValue] = useState(initialValue);
  const [value, setValue] = useState(defaultValue);

  const [isEdited, setIsEdited] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleShake = useCallback(() => {
    // 触发按钮的抖动动画，持续 500 毫秒
    setIsShaking(true);

    // 在 500 毫秒后移除抖动动画
    setTimeout(() => {
      setIsShaking(false);
    }, 500);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const shouldUpdate = await onSubmit(
        typeof formatterBeforeSubmit === 'function' && multiple ? formatterBeforeSubmit(value) : value
      );
      if (shouldUpdate === false) {
        setValue(defaultValue);
      } else {
        setValue(value);
        setDefaultValue(value);
        setIsEdited(false);
      }
    } catch (err) {
      setValue(defaultValue);
    } finally {
      setLoading(false);
      setEditing(false);
    }
  };

  const onFocusOut = useCallback(() => {
    if (directEditing && !disabled && !loading) {
      handleSubmit();
    }
    if (isEdited) {
      handleShake();
    }
    if (!isEdited && !disabled && !loading) {
      setEditing(false);
      setIsEdited(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directEditing, disabled, loading, isEdited, handleShake]);

  useEffect(() => {
    const newDefaultValue = initialValue;
    if (newDefaultValue !== defaultValue) {
      setDefaultValue(newDefaultValue);
      setValue(newDefaultValue);
      setIsEdited(false);
    }
  }, [initialValue, defaultValue]);

  // 筛选选项
  const filteredOptions = options.filter((option) => {
    if (!filterText) return true;
    const searchText = filterText.toLowerCase();
    return (
      option[labelField]?.toLowerCase().includes(searchText) || option[valueField]?.toLowerCase().includes(searchText)
    );
  });

  const onInputChange = (e) => {
    let { value: selected } = e.target;
    if (multiple) {
      selected = typeof selected === 'string' ? selected.split(',') : selected;
    }
    setIsEdited(selected !== value);
    setValue(selected);
    onChange(selected);
  };

  const input =
    editing || directEditing ? (
      <Select
        value={value}
        onChange={onInputChange}
        fullWidth
        multiple={multiple}
        variant="outlined"
        margin="dense"
        onBlur={onFocusOut}
        disabled={disabled}
        renderValue={(selected) => {
          if (multiple) {
            return (
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {selected
                  .filter((x) => options.some((o) => o[valueField] === x))
                  .map((x) => (
                    <Chip
                      key={x}
                      label={options.find((o) => o[valueField] === x)[labelField]}
                      style={{ marginRight: 8 }}
                      size="small"
                    />
                  ))}
              </Box>
            );
          }

          if (!selected) {
            return null;
          }

          const option = options.find((o) => o[valueField] === selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {option?.logo && <LogoImage src={option.logo} alt={option[labelField]} size={20} />}
              <span>{option ? option[labelField] : ''}</span>
            </Box>
          );
        }}
        MenuProps={{
          ...MenuProps,
          PaperProps: {
            ...MenuProps.PaperProps,
          },
        }}
        error={!!helperText}
        {...rest}>
        {searchable ? (
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              size="small"
              placeholder="Search..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              fullWidth
              variant="outlined"
            />
          </Box>
        ) : null}
        {filteredOptions.map((x) => (
          <MenuItem key={x[valueField]} value={x[valueField]} style={getStyles(x[valueField], value, theme)}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {x.logo && <LogoImage src={x.logo} alt={x[labelField]} size={20} />}
              <span>{x[labelField]}</span>
            </Box>
          </MenuItem>
        ))}
      </Select>
    ) : (
      <Box
        data-cy="schema-form-item-edit"
        className="form-item-input slot"
        style={{ whiteSpace: 'pre-wrap' }}
        sx={{
          px: 1,
        }}
        onClick={() => {
          if (!disabled) {
            setEditing(true);
          }
        }}>
        {multiple
          ? value
              .filter((x) => options.some((o) => o[valueField] === x))
              .map((x) => (
                <Chip
                  key={x}
                  label={options.find((o) => o[valueField] === x)[labelField]}
                  style={{ marginRight: 8 }}
                  size="small"
                />
              ))
          : value &&
            options.some((o) => o[valueField] === value) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {(() => {
                  const option = options.find((o) => o[valueField] === value);
                  return option?.logo ? <LogoImage src={option.logo} alt={option[labelField]} size={20} /> : null;
                })()}
                <span>{options.find((o) => o[valueField] === value)[labelField]}</span>
              </Box>
            )}
      </Box>
    );

  return (
    <FormWrapper className="form" sx={sx}>
      <Box className="form-item">
        <Box className="form-item-label">
          {label}
          {required && <Required />}
        </Box>

        <Box className="form-item-body">
          <Box className="form-item-input">{input}</Box>

          <Box className="form-item-action" style={!editing || directEditing ? { marginLeft: 0 } : {}}>
            {editing && !directEditing ? (
              <>
                {isEdited ? (
                  <IconButton
                    data-cy="schema-form-item-confirm"
                    onClick={handleSubmit}
                    disabled={disabled || loading}
                    sx={{
                      animation: isShaking ? `${shakeKeyframes} 0.5s linear` : 'none',
                    }}
                    size="large">
                    {loading ? <CircularProgress size={24} /> : <DoneIcon />}
                  </IconButton>
                ) : null}
                <IconButton
                  data-cy="schema-form-item-cancel"
                  onClick={() => {
                    setValue(defaultValue);
                    setEditing(false);
                  }}
                  disabled={disabled || loading}
                  size="large">
                  <CloseIcon />
                </IconButton>
              </>
            ) : (
              <Box>{triggers.length ? <InputTriggers triggers={triggers} disabled={disabled} /> : null}</Box>
            )}
          </Box>
        </Box>

        {editing && helperText && <FormHelperText error>{helperText}</FormHelperText>}
      </Box>
    </FormWrapper>
  );
}

FormSelectInput.propTypes = {
  sx: PropTypes.object,
  onSubmit: PropTypes.func,
  onChange: PropTypes.func,
  label: PropTypes.string,
  initialValue: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  triggers: PropTypes.array,
  options: PropTypes.array,
  helperText: PropTypes.string,
  formatterBeforeSubmit: PropTypes.func,
  config: PropTypes.object,
  directEditing: PropTypes.bool,
  searchable: PropTypes.bool,
};
