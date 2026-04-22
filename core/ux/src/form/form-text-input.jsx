import React, { useCallback, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import IconButton from '@mui/material/IconButton';
import FormHelperText from '@mui/material/FormHelperText';
import { keyframes } from '@emotion/react';

import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Required from './required';
import FormWrapper from './form-wrapper';
import InputTriggers from './input-triggers';

/**
 * @param {*} value value 空时, null 表示未修改, '' 表示已修改
 * @returns
 */
const getDisplayValue = (value, secure, initialValue) => {
  if (value === null && secure && initialValue) {
    return '******';
  }

  if (!value) {
    return '';
  }

  if (secure) {
    return '******';
  }

  return value;
};

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

export default function FormTextInput({
  label = '',
  disabled = false,
  required = false,
  initialValue = '',
  onChange = () => {},
  placeholder = '',
  style = {},
  onSubmit = () => {},
  secure = false,
  type = '',
  triggers = [],
  formatterBeforeSubmit = null,
  directEditing = false,
  autoFocus = true,
  errorTips = '',
  ...rest
}) {
  const [editing, setEditing] = useState(directEditing);
  const [loading, setLoading] = useState(false);
  const { t } = useContext(LocaleContext);
  const [error, setError] = useState('');

  // value 空时, null 表示未修改, '' 表示已修改
  const [defaultValue, setDefaultValue] = useState(secure && initialValue === '__encrypted__' ? null : initialValue);
  const [value, setValue] = useState(defaultValue);
  const [isEdited, setIsEdited] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const handleSubmit = async () => {
    if (rest.validate && typeof rest.validate === 'function') {
      const errorMsg = rest.validate(value);
      if (errorMsg) {
        setError(errorMsg);
        return;
      }
    }
    setError('');
    setLoading(true);
    try {
      const shouldUpdate = await onSubmit(value);
      if (shouldUpdate === false) {
        setValue(defaultValue);
      } else {
        let tmpValue = value;
        if (typeof formatterBeforeSubmit === 'function') {
          tmpValue = formatterBeforeSubmit(value);
        }

        setValue(tmpValue);
        setDefaultValue(tmpValue);
        setIsEdited(false);
      }
    } catch (err) {
      setValue(defaultValue);
    } finally {
      setLoading(false);
      setEditing(false);
    }
  };

  // 监听 initialValue 变化，同步更新内部状态
  useEffect(() => {
    const newDefaultValue = secure && initialValue === '__encrypted__' ? null : initialValue;
    if (newDefaultValue !== defaultValue) {
      setDefaultValue(newDefaultValue);
      setValue(newDefaultValue);
      setIsEdited(false);
    }
  }, [initialValue, secure, defaultValue]);

  const onInputChange = (changeValue) => {
    setIsEdited(changeValue !== value);
    setValue(changeValue);
    onChange(changeValue);
  };

  // enter keydown
  const handleKeydown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleShake = useCallback(() => {
    // 触发按钮的抖动动画，持续 500 毫秒
    setIsShaking(true);

    // 在 500 毫秒后移除抖动动画
    setTimeout(() => {
      setIsShaking(false);
    }, 500);
  }, []);

  const onFocusOut = () => {
    if (directEditing && !disabled && !loading) {
      handleSubmit();
      return;
    }
    if (isEdited) {
      handleShake();
    }
    if (!isEdited && !disabled && !loading) {
      setEditing(false);
      setIsEdited(false);
    }
  };

  const input =
    editing || directEditing ? (
      <TextField
        style={{ flex: 1 }}
        fullWidth
        value={value}
        onChange={(e) => {
          onInputChange(e.target.value);
        }}
        autoFocus={autoFocus}
        size="small"
        variant="outlined"
        placeholder={placeholder}
        onKeyDown={handleKeydown}
        onBlur={onFocusOut}
        disabled={disabled}
        error={!!errorTips}
        multiline={type === 'textarea'}
        type={secure ? 'password' : type || 'text'}
        {...rest}
      />
    ) : (
      <Box
        data-cy="schema-form-item-edit"
        className="form-item-input slot"
        style={{ whiteSpace: 'pre-wrap', cursor: 'text' }}
        onClick={() => {
          if (!disabled) {
            setEditing(true);
          }
        }}
        sx={{
          px: 1,
        }}>
        {!getDisplayValue(value, secure, initialValue) ? (
          <span className="placeholder">
            {t('common.requiredInputPlaceholder', { name: !placeholder ? label : placeholder })}
          </span>
        ) : (
          getDisplayValue(value, secure, initialValue)
        )}
      </Box>
    );

  return (
    <FormWrapper className="form" style={style}>
      <Box>
        <Box className="form-item-label">
          {label}
          {required && <Required />}
        </Box>

        <Box className="form-item-body" style={{ alignItems: 'flex-start' }}>
          <Box className="form-item-input">{input}</Box>

          <Box className="form-item-action" style={{ marginLeft: !triggers.length || directEditing ? 0 : 12 }}>
            {editing && !directEditing ? (
              <>
                {isEdited ? (
                  <IconButton
                    data-cy="schema-form-item-confirm"
                    onClick={handleSubmit}
                    disabled={disabled || loading || !isEdited}
                    sx={{
                      animation: isShaking ? `${shakeKeyframes} 0.5s linear` : 'none',
                    }}
                    style={{ paddingRight: 4 }}
                    size="large">
                    {loading ? <CircularProgress size={24} /> : <DoneIcon />}
                  </IconButton>
                ) : null}
                <IconButton
                  data-cy="schema-form-item-cancel"
                  onClick={() => {
                    setValue(defaultValue);
                    setEditing(false);
                    setIsEdited(false);
                  }}
                  style={{ paddingLeft: isEdited ? 4 : 8 }}
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
        {(errorTips || error) && <FormHelperText error>{errorTips || error}</FormHelperText>}
      </Box>
    </FormWrapper>
  );
}

FormTextInput.propTypes = {
  style: PropTypes.object,
  onSubmit: PropTypes.func,
  onChange: PropTypes.func,
  label: PropTypes.string,
  initialValue: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  secure: PropTypes.bool,
  triggers: PropTypes.array,
  formatterBeforeSubmit: PropTypes.func,
  directEditing: PropTypes.bool,
  type: PropTypes.string,
  autoFocus: PropTypes.bool,
  errorTips: PropTypes.string,
};
