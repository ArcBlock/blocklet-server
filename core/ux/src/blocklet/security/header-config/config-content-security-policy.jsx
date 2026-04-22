/* eslint-disable react/require-default-props */
import { Box, FormControl, TextField } from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

export default function ConfigContentSecurityPolicy({ value, onChange = () => {}, disabled = false }) {
  const defaultValue = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'font-src': ["'self'", 'https:', 'data:'],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'img-src': ["'self'", 'data:'],
    'object-src': ["'none'"],
    'script-src': ["'self'"],
    'script-src-attr': ["'none'"],
    'style-src': ["'self'", 'https:', "'unsafe-inline'"],
    'upgrade-insecure-requests': [],
  };

  function convertValue2String(rawValue) {
    return Object.keys(rawValue)
      .map((key) => [key, rawValue[key].filter(Boolean).join(' ')].filter(Boolean).join(' '))
      .filter(Boolean)
      .join('\n');
  }
  // const directives = [
  //   'base-uri',
  //   'child-src',
  //   'connect-src',
  //   'default-src',
  //   'font-src',
  //   'form-action',
  //   'frame-ancestors',
  //   'frame-src',
  //   'img-src',
  //   'manifest-src',
  //   'media-src',
  //   'object-src',
  //   'sanbox',
  //   'script-src',
  //   'script-src-attr',
  //   'script-src-elem',
  //   'style-src',
  //   'style-src-attr',
  //   'style-src-elem',
  //   'upgrade-insecure-requests',
  //   'worker-src',
  // ];

  const initValue = convertValue2String(value?.directives || defaultValue);
  const [showValue, setShowValue] = useState(initValue);

  const handleChange = (e) => {
    setShowValue(e.target.value);
    const currentValue = e.target.value.split('\n').reduce((acc, line) => {
      const [key, ...values] = line.split(' ');
      acc[key] = values.filter((x) => x !== '');
      return acc;
    }, {});
    onChange({
      useDefaults: false,
      directives: currentValue,
    });
  };

  useEffect(() => {
    if (value === true) {
      onChange({
        useDefaults: false,
        directives: defaultValue,
      });
      setShowValue(convertValue2String(defaultValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Box sx={{ mt: 1 }}>
      <FormControl fullWidth>
        <TextField
          fullWidth
          multiline
          disabled={disabled}
          rows={12}
          size="small"
          value={showValue}
          onChange={handleChange}
        />
      </FormControl>
    </Box>
  );
}

ConfigContentSecurityPolicy.propTypes = {
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};
