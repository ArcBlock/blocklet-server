/* eslint-disable react/require-default-props */
import { Box, FormControl, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

export default function ConfigXFrameOptions({ value, onChange = () => {}, disabled = false }) {
  const defaultValue = 'sameorigin';
  const options = [
    {
      label: 'DENY',
      value: 'deny',
    },
    {
      label: 'SAMEORIGIN (default)',
      value: 'sameorigin',
    },
  ];

  const handleChange = (e) => {
    onChange({ action: e.target.value });
  };
  useEffect(() => {
    if (value === true) {
      onChange({ action: defaultValue });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Box>
      <FormControl>
        <RadioGroup row>
          {options.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={
                <Radio
                  size="small"
                  disabled={disabled}
                  checked={option.value === value?.action}
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

ConfigXFrameOptions.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]).isRequired,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};
