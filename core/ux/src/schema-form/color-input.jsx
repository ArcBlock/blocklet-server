import { useState, useRef, useEffect } from 'react';

import Box from '@mui/material/Box';

import Popover from '@mui/material/Popover';
import { ChromePicker } from 'react-color';

import commonPropTypes from './common-prop-types';

export default function ColorInput({ editing, value, onChange }) {
  const [open, setOpen] = useState(false);
  const colorElm = useRef();
  const colorValue = useRef(value);

  // auto open color picker when editing, should wait the useRef to be ready
  useEffect(() => {
    let timer = null;
    if (editing) {
      timer = setTimeout(() => {
        setOpen(true);
      }, 50);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [editing]);

  const onColorChange = (color) => {
    colorValue.current = color;
    onChange(color);
  };

  const handleEnterKeyDown = () => {
    setOpen(false);
    onChange(colorValue.current);
  };

  const ReadView = (
    <Box
      className="form-item-input slot"
      sx={{
        px: 1,
      }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}>
        {value}
        {value !== 'auto' && (
          <div style={{ marginLeft: 4, backgroundColor: value, width: '1em', height: '1em', borderRadius: '0.2em' }} />
        )}
      </Box>
    </Box>
  );

  const EditView = (
    <Box
      onKeyDown={handleEnterKeyDown}
      sx={{
        display: 'flex',
        flexGrow: 1,
        alignItems: 'center',
        height: '40px',
      }}>
      <Box
        onClick={() => setOpen(true)}
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}>
        <div
          ref={colorElm}
          style={{
            flexShrink: 0,
            marginLeft: '8px',
            backgroundColor: value,
            width: '32px',
            height: '32px',
            boxSizing: 'border-box',
            borderRadius: '8px',
            border: '1px solid #eee',
            cursor: value === 'auto' ? 'default' : 'pointer',
          }}
        />
      </Box>
      <Popover
        open={open}
        anchorEl={colorElm.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}>
        <ChromePicker color={value} onChange={(c) => onColorChange(c.hex)} />
      </Popover>
    </Box>
  );

  return editing ? EditView : ReadView;
}

ColorInput.propTypes = commonPropTypes;
