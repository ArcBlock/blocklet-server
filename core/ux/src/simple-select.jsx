/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from '@mui/material';

import ArrowDownwardIcon from '@arcblock/icons/lib/ArrowDown';
import { mergeSx } from '@arcblock/ux/lib/Util/style';

function SimpleSelect({
  fullWidth = false,
  multiple = false,
  required = false,
  label = '',
  placeholder = '',
  options = [],
  helperText = '',
  error = false,
  margin = '',
  size,
  slotProps = {},
  ...rest
}) {
  const defaultOption = options.find((item) => item.value === rest.value);
  const defaultValue = defaultOption?.title;

  return (
    <FormControl margin={margin} fullWidth={fullWidth} error={error} sx={slotProps?.formControl?.sx}>
      <InputLabel size={size} sx={slotProps?.label?.sx}>{`${label}${required ? '*' : ''}`}</InputLabel>
      <Select
        multiple={multiple}
        input={
          <OutlinedInput
            defaultValue={defaultValue}
            sx={{ flex: 1 }}
            required={required}
            label={label}
            inputProps={{ margin }}
            size={size}
          />
        }
        renderValue={(selected) => {
          if (multiple) {
            return (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const option = options.find((item) => item.value === value);
                  return option && option.title && <Chip key={value} size="small" label={option.title} />;
                })}
              </Box>
            );
          }
          const option = options.find((item) => item.value === selected);
          return (
            option &&
            option.title && (
              <Box>
                <Typography component="span">{option.title}</Typography>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    marginLeft: 1,
                    color: 'text.secondary',
                  }}>
                  {option.description}
                </Typography>
              </Box>
            )
          );
        }}
        // eslint-disable-next-line react/no-unstable-nested-components
        IconComponent={(props) => <ArrowDownwardIcon {...props} width={20} height={20} />}
        {...rest}
        sx={mergeSx(
          {
            '& .MuiInputBase-input': {
              width: 'calc(100% - 46px)',
              '& > .MuiBox-root:first-of-type': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            },
          },
          rest.sx
        )}>
        {placeholder ? (
          <MenuItem disabled>
            <em>{placeholder}</em>
          </MenuItem>
        ) : null}
        {!required && !multiple && <MenuItem value="">None</MenuItem>}
        {options.map(
          (option) =>
            option &&
            option.value && (
              <MenuItem key={option.value} value={option.value} disabled={option.disabled || false}>
                <Box
                  sx={mergeSx(
                    {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    },
                    slotProps?.optionItem?.sx
                  )}>
                  <Typography component="span">{option.title}</Typography>
                  {option.description && (
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        maxWidth: 510,
                        fontSize: 12,
                        whiteSpace: 'normal',
                        color: 'text.secondary',
                      }}>
                      {option.description}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            )
        )}
      </Select>
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  );
}

SimpleSelect.propTypes = {
  error: PropTypes.bool,
  required: PropTypes.bool,
  multiple: PropTypes.bool,
  fullWidth: PropTypes.bool,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  options: PropTypes.array,
  helperText: PropTypes.string,
  margin: PropTypes.string,
  size: PropTypes.string,
  height: PropTypes.number,
  textDirection: PropTypes.oneOf(['row', 'column']),
  slotProps: PropTypes.object,
};

export default SimpleSelect;
