import { useContext, useRef } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import commonPropTypes from './common-prop-types';

export default function TextInput({ editing, description, value, onChange, componentProps = {}, ...rest }) {
  const { placeholder } = componentProps;
  const inputValue = useRef(value);
  const { t } = useContext(LocaleContext);

  // enter keydown
  const handleKeydown = (e) => {
    if (e.key === 'Enter') {
      onChange(inputValue.current, 'confirm');
    }
  };

  const onInputChange = (changeValue) => {
    inputValue.current = changeValue;
    onChange(changeValue);
  };

  if (editing) {
    return (
      <TextField
        style={{ flex: 1 }}
        fullWidth
        value={value}
        onChange={(e) => {
          e.persist();
          onInputChange(e.target.value);
        }}
        autoFocus
        size="small"
        variant="outlined"
        placeholder={description || placeholder}
        onKeyDown={handleKeydown}
        {...rest}
      />
    );
  }
  return (
    <Box
      className="form-item-input slot"
      sx={{
        px: 1,
      }}>
      {!value ? (
        <span className="placeholder">
          {t('common.requiredInputPlaceholder', { name: description || placeholder })}
        </span>
      ) : (
        value
      )}
    </Box>
  );
}

TextInput.propTypes = commonPropTypes;
