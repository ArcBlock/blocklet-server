import PropTypes from 'prop-types';
import React from 'react';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import Autocomplete from '@mui/material/Autocomplete';
import ListItemButton from '@mui/material/ListItemButton';
import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { useBlockletInstallUrlRecord } from '../hooks/use-blocklet-install-url-record';

/**
 * install from url: URL 输入控件
 * 1. 记录最近的输入
 */
function InstallBlockletFromUrlInput({ value = '', onValueChange = () => {}, children = null, helperText = '' }) {
  const { urls, removeUrlRecord } = useBlockletInstallUrlRecord();

  const onRemove = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    removeUrlRecord(url);
  };

  return (
    <Box>
      <Autocomplete
        freeSolo // 允许用户输入任何值
        options={urls} // 下拉选项
        inputValue={value} // 控制输入值
        onInputChange={(event, newValue) => {
          onValueChange(newValue);
        }}
        disableClearable
        popupIcon={null}
        renderInput={(params) => React.cloneElement(children, { ...params })}
        renderOption={(renderProps, option) => (
          <ListItem
            {...renderProps}
            key={option}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={(e) => onRemove(e, option)}>
                <DeleteIcon />
              </IconButton>
            }>
            <ListItemButton
              role={undefined}
              dense
              sx={{
                paddingLeft: 0,
                paddingRight: 30,
                '&:hover': {
                  backgroundColor: 'transparent', // 禁用 hover 的背景色
                },
              }}>
              <ListItemText
                primary={option}
                sx={{
                  '& span': {
                    display: 'block',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        )}
        slotProps={{
          listbox: {
            sx: {
              maxHeight: 300, // 设置最大高度，单位为 px
              overflow: 'auto', // 超出部分加滚动条
            },
          },
        }}
      />
      <FormHelperText style={{ margin: 0 }}>{helperText}</FormHelperText>
    </Box>
  );
}

InstallBlockletFromUrlInput.propTypes = {
  onValueChange: PropTypes.func,
  children: PropTypes.node,
  value: PropTypes.string,
  helperText: PropTypes.string, // 由于 AutoComplete 组件包裹 TextField 组件进行渲染后，TextField 的 helperText 不能被选中。所以要把 heplerText 分开
};

export default InstallBlockletFromUrlInput;
// .css-1qfx5z1-MuiButtonBase-root-MuiListItemButton-root:hover
