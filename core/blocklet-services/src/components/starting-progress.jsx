/* eslint-disable react/require-default-props */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Stack, Typography } from '@mui/material';
import styled from '@emotion/styled';
import { green } from '@mui/material/colors';
import { useCreation, useMount } from 'ahooks';
import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { isBlockletRunning } from '@blocklet/meta/lib/util';

const messageDuration = 1000;

// 默认是 starting 状态，如果正在启动，则显示 spinner
function ProgressItem({ blocklet }) {
  const { meta } = blocklet;
  const { t } = useLocaleContext();

  const [status, setStatus] = useState('starting');
  const [initialStatus, setInitialStatus] = useState(blocklet.status);

  const statusTextMap = useCreation(() => {
    const blockletName = meta.title || meta.name;
    return {
      starting: t('blocklet.startingProgress.starting', { name: blockletName }),
      running: t('blocklet.startingProgress.success', { name: blockletName }),
      stopped: t('blocklet.startingProgress.failed', { name: blockletName }),
      error: t('blocklet.startingProgress.failed', { name: blockletName }),
    };
  }, [t, meta]);

  useEffect(() => {
    if (initialStatus !== blocklet.status) {
      setStatus(blocklet.status);
      setInitialStatus('');
    }
  }, [blocklet.status, initialStatus]);

  useMount(() => {
    setInitialStatus(blocklet.status);
    if (isBlockletRunning(blocklet)) {
      setStatus(blocklet.status);
    }
  });

  const color = useCreation(() => {
    if (status === 'running') {
      return green[600];
    }
    return ['stopped', 'error'].includes(status) ? 'error' : 'primary';
  }, [status]);

  return (
    <Typography display="flex" alignItems="center" fontSize={14} lineHeight={1} gap={1} color={color}>
      {statusTextMap[status]}
    </Typography>
  );
}

ProgressItem.propTypes = {
  blocklet: PropTypes.object.isRequired,
};

export function ProgressContent({ blocklets = [], children, debounce = true, status = '' }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverHeight, setPopoverHeight] = useState(0);
  const popoverRef = useRef(null);
  const mouseLeaveRef = useRef(false);

  useEffect(() => {
    if (anchorEl && popoverRef.current) {
      // 强制显示 Popover 内容以获取实际高度
      const originalDisplay = popoverRef.current.style.display;
      popoverRef.current.style.display = 'flex';
      setPopoverHeight(popoverRef.current.offsetHeight);
      popoverRef.current.style.display = originalDisplay;
    }
  }, [anchorEl, blocklets]);

  const popoverContent = useMemo(
    () =>
      status === 'starting' ? (
        <Stack
          ref={popoverRef}
          display="flex"
          flexDirection="column"
          gap={0.5}
          maxHeight={200}
          sx={{
            overflowY: 'auto',
            p: 2,
            display: anchorEl ? 'flex' : 'none',
            position: 'fixed',
            top: anchorEl ? anchorEl.getBoundingClientRect().top - 10 - popoverHeight : 0,
            left: anchorEl ? anchorEl.getBoundingClientRect().left + anchorEl.offsetWidth / 2 : 0,
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
            borderRadius: '4px',
            zIndex: 1300,
          }}>
          {blocklets.map((blocklet) => (
            <ProgressItem key={blocklet.meta.did} blocklet={blocklet} />
          ))}
        </Stack>
      ) : null,
    [blocklets, anchorEl, popoverHeight, status]
  );
  const handlePopoverOpen = (event) => {
    if (mouseLeaveRef.current || !debounce) {
      setAnchorEl(event.currentTarget);
      mouseLeaveRef.current = false;
    }
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    if (status === 'starting') {
      // 避免鼠标点击启动后一直停留导致的 popver
      mouseLeaveRef.current = true;
    }
  };
  return (
    <>
      <span onMouseEnter={handlePopoverOpen} onMouseLeave={handlePopoverClose} style={{ cursor: 'pointer' }}>
        {children}
      </span>
      {popoverContent}
    </>
  );
}

ProgressContent.propTypes = {
  blocklets: PropTypes.array.isRequired,
  children: PropTypes.node.isRequired,
  // eslint-disable-next-line react/require-default-props
  debounce: PropTypes.bool,
  // eslint-disable-next-line react/require-default-props
  status: PropTypes.string,
};

function StartingProgress({ blocklets = [] }) {
  const { t } = useLocaleContext();
  const [messageId, setMessageId] = useState(0);

  const messages = useCreation(() => {
    if (blocklets.length === 0) {
      return [];
    }

    return blocklets
      .map((child) => {
        const blockletName = child.meta.title || child.meta.name;
        const blockletStatus = child.status;
        if (blockletStatus === 'running') {
          return null;
        }
        return `${t('blocklet.startingProgress.starting', { name: blockletName })}`;
      })
      .filter(Boolean);
  }, [blocklets, t]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    let msgIndex = 0;

    const timer = setInterval(() => {
      msgIndex++;
      if (msgIndex >= messages.length) {
        msgIndex = 0;
      }
      setMessageId(msgIndex);
    }, messageDuration);

    // eslint-disable-next-line consistent-return
    return () => {
      clearInterval(timer);
    };
  }, [messages]);

  if (blocklets.length === 0) {
    return null;
  }

  const getMsgClassName = (index) => {
    let className = 'message-before';
    if (messageId === index) {
      className = 'show-message';
    } else if (messageId < index) {
      className = 'message-after';
    }
    return className;
  };

  return (
    <Container direction="column" alignItems="center" justifyContent="center" gap={1}>
      <div className="waiter-message">
        {messages.map((msg, index) => {
          const className = getMsgClassName(index);
          return (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}>
              <span className={`message-block ${className}`}>{msg}</span>
              <span className={`placeholder-message ${className}`}>{msg}</span>
            </div>
          );
        })}
      </div>
    </Container>
  );
}

StartingProgress.propTypes = {
  blocklets: PropTypes.array.isRequired,
};

const Container = styled(Stack)`
  .waiter-message {
    position: relative;
    width: 100%;
    font-size: 16px;
    text-align: center;
    overflow: hidden;
    color: ${({ theme }) => theme.palette.primary.main};
    cursor: pointer;
    .message-block {
      position: absolute;
      left: 0;
      width: 100%;
      opacity: 0;
      transition: all ease 0.3s;
      user-select: none;
      &.message-before {
        transform: translate(-20px, 0);
      }
      &.message-after {
        transform: translate(20px, 0);
      }
      &.show-message {
        transform: translate(0, 0);
        opacity: 1;
        user-select: text;
        z-index: 2;
      }
    }

    .placeholder-message {
      user-select: none;
      display: none;
      opacity: 0;
      &.show-message {
        display: block;
      }
    }
  }
`;

export default StartingProgress;

export const progressCss = {
  minWidth: 200,
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 0,
    borderRadius: 1,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '0',
    height: '100%',
    background: 'linear-gradient(90deg, rgba(212,249,248,0.01) 0%, rgba(212,249,248,0.05) 100%)',
    zIndex: 1,
    pointerEvents: 'none',
    transition: 'width 0.8s cubic-bezier(0.68, -0.6, 0.32, 1.6) 0s',
    borderRadius: 1,
  },
  '&.Mui-disabled': {
    backgroundColor: 'primary.main',
    color: 'white',
  },
  '& .MuiCircularProgress-root': {
    color: 'primary.contrastText',
    zIndex: 2,
  },
};
