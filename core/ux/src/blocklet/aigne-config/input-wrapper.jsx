import * as React from 'react';
import PropTypes from 'prop-types';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material';

/**
 * InputWrapper - 输入组件包装器
 * 用于将 input 组件和按钮组合成一个复合组件
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - input 组件
 * @param {React.ReactNode} props.button - 按钮组件
 * @param {React.ReactNode} props.leftContent - 左侧内容（可选）
 * @param {boolean} props.showDivider - 是否显示分隔线
 * @param {Object} props.paperProps - Paper 组件的 props
 * @param {Object} props.dividerProps - Divider 组件的 props
 * @param {Object} props.buttonWrapperProps - 按钮容器的 props
 * @param {React.ReactNode|string} props.helperText - 辅助文本或组件
 * @param {string} props.helperTextType - 辅助文本类型：'success', 'error', 'info'
 */
function InputWrapper({
  children,
  button = null,
  leftContent = null,
  showDivider = true,
  paperProps = {},
  dividerProps = {},
  buttonWrapperProps = {},
  helperText = null,
  helperTextType = 'info',
  ...otherProps
}) {
  // 根据 helperTextType 确定边框颜色
  const getBorderColor = (theme) => {
    switch (helperTextType) {
      case 'error':
        return theme.palette.error.main;
      case 'success':
        return theme.palette.success.main;
      default:
        return theme.palette.mode === 'dark'
          ? alpha(theme.palette.common.white, 0.23)
          : alpha(theme.palette.common.black, 0.23);
    }
  };

  const defaultPaperProps = {
    component: 'form',
    sx: (theme) => {
      const defaultBorderColor =
        theme.palette.mode === 'dark'
          ? alpha(theme.palette.common.white, 0.23)
          : alpha(theme.palette.common.black, 0.23);

      return {
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid',
        borderColor: helperText ? getBorderColor(theme) : defaultBorderColor,
        boxShadow: 'none',
        ...paperProps.sx,
      };
    },
    ...paperProps,
  };

  const defaultDividerProps = {
    sx: { height: 28, m: 0.5 },
    orientation: 'vertical',
    ...dividerProps,
  };

  const defaultButtonWrapperProps = {
    sx: { display: 'flex', alignItems: 'center' },
    ...buttonWrapperProps,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Paper {...defaultPaperProps} {...otherProps} variant="outlined">
        {leftContent && <div style={{ display: 'flex', alignItems: 'center' }}>{leftContent}</div>}

        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>{children}</div>

        {button && (
          <>
            {showDivider && <Divider {...defaultDividerProps} />}
            <div {...defaultButtonWrapperProps}>{button}</div>
          </>
        )}
      </Paper>

      {helperText && (
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            ml: 1,
            color: (() => {
              switch (helperTextType) {
                case 'error':
                  return 'error.main';
                case 'success':
                  return 'success.main';
                default:
                  return 'text.secondary';
              }
            })(),
          }}>
          {helperText}
        </Typography>
      )}
    </div>
  );
}

InputWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  button: PropTypes.node,
  leftContent: PropTypes.node,
  showDivider: PropTypes.bool,
  paperProps: PropTypes.object,
  dividerProps: PropTypes.object,
  buttonWrapperProps: PropTypes.object,
  helperText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  helperTextType: PropTypes.oneOf(['success', 'error', 'info']),
};

export default InputWrapper;
