import React, { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import FormHelperText from '@mui/material/FormHelperText';
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import styled from '@emotion/styled';
import Popper from '@mui/material/Popper';

import Required from './required';
import FormWrapper from './form-wrapper';

export default function FormAutocompleteInput({
  label = '',
  disabled = false,
  required = false,
  initialValue = '',
  onChange = () => {},
  style = {},
  onSubmit = () => {},
  // eslint-disable-next-line no-unused-vars
  triggers = [],
  options = [],
  formatterBeforeSubmit = (x) => x.join(','),
  helperText = '',
  placeholder = '',
  renderImage = () => null,
  renderLabel = () => '',
  filterKeys = ['name'],
  noEmpty = false,
  ...rest
}) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const autoCompleteRef = useRef(null);

  const [defaultValue, setDefaultValue] = useState(initialValue);
  const [value, setValue] = useState(defaultValue);
  const optionsMap = useMemo(() => {
    if (!options) {
      return {};
    }
    const cache = {};
    options.forEach((v) => {
      cache[v.code] = v;
    });
    return cache;
  }, [options]);

  const filterOptions = () => {
    if (!options) {
      return [];
    }
    if (!inputValue) {
      return options.map((v) => v.code);
    }
    const reg = new RegExp(inputValue.toLowerCase());

    // name 或者其他字段被检索到, 都可以被搜出
    return options
      .filter((v) => {
        for (let i = 0; i < filterKeys.length; i++) {
          const key = filterKeys[i];
          if (reg.test(v[key]?.toLowerCase())) {
            return true;
          }
        }
        return false;
      })
      .map((v) => v.code);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const shouldUpdate = await onSubmit(
        typeof formatterBeforeSubmit === 'function' ? formatterBeforeSubmit(value) : value
      );
      if (shouldUpdate === false) {
        setValue(defaultValue);
      } else if (noEmpty && !value.length) {
        setValue(initialValue);
        setDefaultValue(initialValue);
      } else {
        setValue(value);
        setDefaultValue(value);
      }
    } catch (err) {
      setValue(defaultValue);
    } finally {
      setLoading(false);
      setEditing(false);
    }
  };

  const onSelectChange = (_, newValue) => {
    // 确保 newValue 是数组, 并且每个元素都在 options 中
    if (!Array.isArray(newValue)) {
      setValue([]);
      onChange([]);
      return;
    }
    const nextValue = newValue.filter((x) => optionsMap[x]);
    if (!nextValue.length) {
      setValue([]);
      onChange([]);
      return;
    }

    setValue(nextValue);
    onChange(nextValue);
  };

  const onEdit = (event) => {
    event.stopPropagation();
    setEditing(true);
    setTimeout(() => {
      if (autoCompleteRef.current) {
        const input = autoCompleteRef.current.querySelector('input'); // 获取 TextField 内部的 input 元素
        if (input) {
          input.focus(); // 让输入框获取焦点
        }
      }
    }, 500);
  };

  const input = editing ? (
    <Autocomplete
      ref={autoCompleteRef}
      options={options}
      value={value}
      onChange={onSelectChange}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      fullWidth
      multiple
      variant="outlined"
      margin="dense"
      // size="small"
      filterOptions={filterOptions}
      getOptionLabel={(option) => optionsMap[option]?.name}
      renderInput={(params) => <TextField {...params} label="" placeholder={placeholder} />}
      renderOption={(props, code) => {
        const selected = value.indexOf(code) !== -1;
        return (
          <Row component="li" {...props} key={code}>
            {renderImage(optionsMap[code] || {})}
            <Box
              sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
              style={{ flex: 1, fontWeight: selected ? '700' : 'normal' }}>
              {renderLabel(code, optionsMap[code]) || optionsMap[code]?.name}
            </Box>
            <Box
              component={CloseIcon}
              sx={{ opacity: 0.5, width: 18, height: 18 }}
              style={{
                visibility: selected ? 'visible' : 'hidden',
              }}
            />
          </Row>
        );
      }}
      {...rest}
      slots={{
        // eslint-disable-next-line no-use-before-define
        popper: StyledPopper,
      }}
    />
  ) : (
    <Box
      className="form-item-input slot"
      onClick={onEdit}
      style={{ whiteSpace: 'pre-wrap', cursor: 'text' }}
      sx={{
        px: 1,
      }}>
      {value
        .filter((x) => options.some((o) => o.code === x))
        .map((x) => (
          <Chip key={x} label={options.find((o) => o.code === x).name} style={{ marginRight: 8 }} size="small" />
        ))}
    </Box>
  );

  return (
    <FormWrapper className="form" style={style}>
      <Box className="form-item">
        <Box className="form-item-label">
          {label}
          {required && <Required />}
        </Box>
        <Box className="form-item-body">
          <Box className="form-item-input">{input}</Box>

          {editing ? (
            <Box className="form-item-action">
              <>
                <IconButton
                  data-cy="schema-form-item-confirm"
                  onClick={handleSubmit}
                  disabled={disabled || loading}
                  size="large">
                  {loading ? <CircularProgress size={24} /> : <DoneIcon />}
                </IconButton>
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
            </Box>
          ) : null}
        </Box>

        {editing && helperText && <FormHelperText>{helperText}</FormHelperText>}
      </Box>
    </FormWrapper>
  );
}

FormAutocompleteInput.propTypes = {
  style: PropTypes.object,
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
  placeholder: PropTypes.string,
  renderImage: PropTypes.func,
  filterKeys: PropTypes.arrayOf(PropTypes.string),
  noEmpty: PropTypes.bool,
  renderLabel: PropTypes.func,
};

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 1.1em;
`;

const StyledPopper = styled(Popper)(() => ({
  [`& .${autocompleteClasses.paper}`]: {
    boxShadow: '0px 8px 12px rgba(92, 92, 92, 0.04), 0px -10px 12px rgba(92, 92, 92, 0.04)',
    borderRadius: '6px',
    width: '100%',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    color: 'inherit',
    fontSize: 13,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  [`& .${autocompleteClasses.listbox}`]: {
    padding: 0,
  },
}));
