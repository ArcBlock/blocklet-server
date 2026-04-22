import { useState, useEffect, cloneElement } from 'react';
import { Tooltip, ClickAwayListener } from '@mui/material';
import { useMemoizedFn } from 'ahooks';
import useMobile from '../hooks/use-mobile';

function TooltipEnhance({ children, ...props }) {
  const isMobile = useMobile();
  const [visible, setVisible] = useState(false);

  const triggerVisible = useMemoizedFn(() => {
    setVisible(!visible);
  });

  useEffect(() => {
    setVisible(false);
  }, [isMobile]);

  if (isMobile) {
    return (
      <ClickAwayListener onClickAway={() => setVisible(false)}>
        <Tooltip
          {...props}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          slotProps={{
            popper: {
              disablePortal: true,
            },
          }}
          open={visible}
          onClose={triggerVisible}>
          {cloneElement(children, { onClick: triggerVisible })}
        </Tooltip>
      </ClickAwayListener>
    );
  }
  return <Tooltip {...props}>{children}</Tooltip>;
}

// 直接复制 MUI Tooltip 的 propTypes 和 defaultProps
TooltipEnhance.propTypes = Tooltip.propTypes;
TooltipEnhance.defaultProps = Tooltip.defaultProps;

export default TooltipEnhance;
