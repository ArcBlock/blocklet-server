import { useState, useEffect, useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
import { useMemoizedFn } from 'ahooks';
import MuiSwitch from '@mui/material/Switch';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

// 工具函数：测量文本宽度
const measureTextWidth = (text, fontSize = 10, fontWeight = 500) => {
  if (typeof document === 'undefined') return 0;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `${fontWeight} ${fontSize}px sans-serif`;
  const metrics = context.measureText(text);
  return metrics.width;
};

export default function SwitchWithLabel({ checked: _checked, onChange, width = 0 }) {
  const { t } = useContext(LocaleContext);
  const [checked, setChecked] = useState(false);

  const handleChange = useMemoizedFn((event) => {
    setChecked(event.target.checked);
    onChange(event.target.checked);
  });

  useEffect(() => {
    setChecked(_checked);
  }, [_checked]);

  const label = useMemo(() => {
    return t(`webhookEndpoint.${checked ? 'enabled' : 'disabled'}`);
  }, [checked, t]);

  // 计算自适应宽度，基于两种状态的最大文本宽度
  const calculatedWidth = useMemo(() => {
    const enabledText = t('webhookEndpoint.enabled');
    const disabledText = t('webhookEndpoint.disabled');

    const enabledWidth = measureTextWidth(enabledText, 10, 500);
    const disabledWidth = measureTextWidth(disabledText, 10, 500);

    const maxTextWidth = Math.max(enabledWidth, disabledWidth);
    const horizontalPadding = 6;
    const thumbSize = 18;
    const gap = 3; // (24 - 18) / 2
    const minWidth = thumbSize + gap + maxTextWidth + horizontalPadding;

    // 确保最小宽度，并向上取整到偶数保证视觉对称
    return Math.max(Math.ceil(minWidth / 2) * 2, 50);
  }, [t]);

  // 如果传入 width，使用固定宽度，否则使用计算的宽度
  const switchWidth = width || calculatedWidth;

  return (
    <MuiSwitch
      checked={checked}
      onChange={handleChange}
      sx={(theme) => {
        const switchHeight = 24;
        const thumbSize = 18;
        const gap = (switchHeight - thumbSize) / 2;
        const translateX = switchWidth - thumbSize - gap * 2;
        const isDark = theme.palette.mode === 'dark';
        const enabledColor = theme.palette.common[isDark ? 'black' : 'white'];
        const disabledColor = theme.palette.common[isDark ? 'white' : 'black'];

        return {
          width: switchWidth,
          height: switchHeight,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: `${gap}px`,
            transitionDuration: '300ms',
            '&.Mui-checked': {
              transform: `translateX(${translateX}px)`,
              color: theme.palette.common.white,
              '& + .MuiSwitch-track': {
                backgroundColor: theme.palette.primary.main,
                opacity: 1,
                border: 0,
                '&:before': {
                  content: `"${label}"`,
                  position: 'absolute',
                  left: theme.spacing(0.75),
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: enabledColor,
                  fontSize: 10,
                  fontWeight: 500,
                },
              },
            },
          },
          '& .MuiSwitch-thumb': {
            width: thumbSize,
            height: thumbSize,
          },
          '& .MuiSwitch-track': {
            borderRadius: switchHeight / 2,
            backgroundColor: theme.palette.grey[200],
            opacity: 1,
            position: 'relative',
            '&:before': {
              content: `"${label}"`,
              position: 'absolute',
              right: theme.spacing(0.75),
              top: '50%',
              transform: 'translateY(-50%)',
              color: disabledColor,
              fontSize: 10,
              fontWeight: 500,
            },
          },
        };
      }}
    />
  );
}

SwitchWithLabel.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  width: PropTypes.number,
};
