/* eslint-disable react/require-default-props */
import { Box, FormControl, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect } from 'react';

/**
 * @description 暂不支持配置多个值
 * @returns
 */
export default function ConfigReferrerPolicy({ value, onChange = () => {}, disabled = false }) {
  const defaultValue = 'strict-origin-when-cross-origin';
  const options = [
    {
      label: 'no-referrer',
      value: 'no-referrer',
    },
    {
      label: 'no-referrer-when-downgrade',
      value: 'no-referrer-when-downgrade',
    },
    {
      label: 'origin',
      value: 'origin',
    },
    {
      label: 'origin-when-cross-origin',
      value: 'origin-when-cross-origin',
    },
    {
      label: 'same-origin',
      value: 'same-origin',
    },
    {
      label: 'strict-origin',
      value: 'strict-origin',
    },
    {
      label: 'strict-origin-when-cross-origin (default)',
      value: 'strict-origin-when-cross-origin',
    },
    {
      label: 'unsafe-url',
      value: 'unsafe-url',
    },
  ];

  const handleChange = (e) => {
    onChange({ policy: e.target.value });
  };
  useEffect(() => {
    if (value === true) {
      onChange({ policy: defaultValue });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <Box>
      <FormControl>
        <RadioGroup>
          {options.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={
                <Radio
                  size="small"
                  disabled={disabled}
                  checked={option.value === value?.policy}
                  onChange={handleChange}
                  sx={{
                    p: 0.75,
                  }}
                />
              }
              label={option.label}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </Box>
  );
}

ConfigReferrerPolicy.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]).isRequired,
  onChange: PropTypes.func,
  disabled: PropTypes.func,
};
