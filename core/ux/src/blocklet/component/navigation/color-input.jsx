/* eslint-disable react/require-default-props */
import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, InputAdornment, Popover, TextField } from '@mui/material';
import { useMemoizedFn } from 'ahooks';
import ClearIcon from '@mui/icons-material/Clear';
import { SketchPicker } from 'react-color';

// const Sketch = lazy(() => import('@uiw/react-color-sketch'));

export default function ColorInput({ value, helperText, label, placeholder, ...rest }) {
  const inputRef = useRef(null);
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);
  const { onChange, ...restProps } = rest;

  const handleClose = useMemoizedFn(() => {
    setSearchAnchorEl(null);
  });

  const handleClick = useMemoizedFn(() => {
    setSearchAnchorEl(inputRef.current);
  });

  const handlePick = useMemoizedFn((val) => {
    onChange?.(val);
  });

  const handleChange = useMemoizedFn((event) => {
    onChange?.(event.target.value);
  });

  return (
    <>
      <TextField
        helperText={helperText}
        value={value}
        {...restProps}
        label={label}
        placeholder={placeholder}
        onChange={handleChange}
        slotProps={{
          input: {
            ref: inputRef,
            // preview color
            startAdornment: (
              <InputAdornment position="start">
                <Box
                  sx={{
                    width: '1.5em',
                    height: '1.5em',
                    border: '1px solid black',
                    borderRadius: 1,
                    cursor: 'pointer',
                    backgroundColor: value,
                    // 创建棋盘格背景
                    ...(!value && {
                      backgroundImage: `
                      repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc 100%),
                      repeating-linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%, #ccc 100%)
                    `,
                      backgroundPosition: '0 0, 6px 6px',
                      backgroundSize: '12px 12px',
                    }),
                  }}
                  onClick={handleClick}
                />
              </InputAdornment>
            ),
            endAdornment: (
              <IconButton sx={{ visibility: value ? 'visible' : 'hidden' }} onClick={() => onChange?.('')}>
                <ClearIcon style={{ fontSize: 18 }} />
              </IconButton>
            ),
          },
        }}
      />
      <Popover
        open={!!searchAnchorEl}
        anchorEl={searchAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={handleClose}>
        <ColorPicker value={value || ''} disableAlpha onPick={handlePick} />
      </Popover>
    </>
  );
}

ColorInput.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.any,
  placeholder: PropTypes.any,
  helperText: PropTypes.string,
};

function ColorPicker({ value = '', sx, onPick, ...rest }) {
  useEffect(() => {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize')); // 触发 Popper 重新计算
    });
  }, []);

  return (
    <SketchPicker
      width={234}
      color={value}
      {...rest}
      onChange={(color) => {
        onPick(color.hex);
      }}
    />
  );
}

ColorPicker.propTypes = {
  value: PropTypes.string,
  sx: PropTypes.object,
  onPick: PropTypes.func.isRequired,
};
