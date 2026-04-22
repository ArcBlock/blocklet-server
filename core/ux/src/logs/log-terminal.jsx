import { useRef, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import useMediaQuery from '@mui/material/useMediaQuery';
import Terminal from '@arcblock/terminal/lib/Terminal';
import Clock from './clock';
import { useNodeContext } from '../contexts/node';
import { printColoredLog } from '../util/log';

/**
 * 按 level/destination 分类的一组 terminal
 */
export function LogTerminalGroup({
  name,
  logId,
  types = ['error', 'info', 'access', 'security', 'stdout', 'stderr'],
  defaultTypeIndex = 0,
  initialData = [],
  prepend = null,
  postpend = null,
  onTypeChange = () => {},
  ...rest
}) {
  const {
    ws: { useSubscription },
  } = useNodeContext();

  const logTypeLabels = {
    info: 'Info',
    error: 'Error',
    access: 'Access',
    security: 'Security',
    stdout: 'stdout',
    stderr: 'stderr',
    pm2: 'PM2',
  };
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const [currentType, setCurrentType] = useState(types[defaultTypeIndex || 0]);
  const [logFiles, setLogFiles] = useState();
  const terminalRefs = useRef({});

  // 组件挂载时, 写入初始数据
  useEffect(() => {
    types.forEach((type) => {
      const terminal = terminalRefs.current[type];
      if (terminal) {
        terminal.write(`Collecting ${type} logs for ${name}...`);
        terminal.write('\r\n\r\n');
        initialData.forEach((item) => terminal.write(item));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听 log 数据, 写入 terminal
  useSubscription(
    `log.${logId}`,
    (log) => {
      if (!logFiles) {
        setLogFiles(log.logFiles || {});
      }
      const terminal = terminalRefs.current[log.level];
      if (terminal) {
        const lineLog = log.data.replace(/.\n/g, (p) => (p === '\r\n' ? p : `${p[0]}\r\n`));
        terminal.write(printColoredLog(lineLog, log.level));
        terminal.write('\r\n');
      }
    },
    []
  );

  return (
    <LogTerminalGroupRoot {...rest}>
      <div className="log-terminal-group-head" style={{ alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div className="log-terminal-group-head-start">
          {prepend}
          <ButtonGroup variant="outlined" size={isMobile ? 'small' : 'medium'}>
            {types.map((type) => {
              const props =
                type === currentType
                  ? {
                      variant: 'contained',
                    }
                  : {};
              return (
                <Button
                  key={type}
                  {...props}
                  onClick={() => {
                    setCurrentType(type);
                    onTypeChange(type);
                  }}>
                  {logTypeLabels[type]}
                </Button>
              );
            })}
          </ButtonGroup>
        </div>
        <div className="log-terminal-group-head-end">{postpend}</div>
      </div>
      <div className="log-terminal-group-terminals">
        {types.map((type) => {
          return (
            <LogTerminal
              key={type}
              ref={(ref) => {
                terminalRefs.current[type] = ref;
              }}
              logFile={logFiles?.[type]}
              style={{ visibility: type === currentType ? 'visible' : 'hidden' }}
            />
          );
        })}
      </div>
    </LogTerminalGroupRoot>
  );
}

LogTerminalGroup.propTypes = {
  // log name, 比如: blocklet display name
  name: PropTypes.string.isRequired,
  // 比如: abtnode | blocklet-services | blocklet-<did>
  logId: PropTypes.string.isRequired,
  // 日志类型, info/error 或 stdin/stdout/access
  types: PropTypes.arrayOf(PropTypes.string),
  defaultTypeIndex: PropTypes.number,
  // 写入 terminal 的初始数据
  initialData: PropTypes.arrayOf(PropTypes.string),
  prepend: PropTypes.node,
  postpend: PropTypes.node,
  onTypeChange: PropTypes.func,
};

const LogTerminalGroupRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  .log-terminal-group-head {
    display: flex;
    justify-content: space-between;
    padding-bottom: 16px;
  }

  .log-terminal-group-head-start {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 16px;
    ${(props) => props.theme.breakpoints.down('md')} {
      flex-direction: column;
      align-items: start;
    }
  }

  .log-terminal-group-head-end {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 16px;
    ${(props) => props.theme.breakpoints.down('md')} {
      flex-direction: column;
      align-items: start;
    }
  }
  .log-terminal-group-terminals {
    flex: 1;
    position: relative;
    overflow: hidden;
    > * {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }
  }
`;

export function LogTerminal({ ref = null, logFile = '', ...rest }) {
  const terminalStyle = {
    width: '100%',
    boxSizing: 'border-box',
    height: '100%',
  };
  // https://raw.githubusercontent.com/Gogh-Co/Gogh/master/data/themes.json#Ayu%20Mirage
  const terminalOptions = {
    theme: {
      background: '#2C313C',
      foreground: '#EEEEEE',
      red: '#ff3333',
      black: '#1f2430',
      green: '#bae67e',
      yellow: '#ffa759',
      blue: '#73d0ff',
      purple: '#d4bfff',
      cyan: '#95e6cb',
      white: '#cbccc6',
    },
    screenReaderMode: true,
  };
  return (
    <LogTerminalRoot {...rest}>
      <div className="log-terminal-top">
        <Clock />
        {logFile && <span>{logFile}</span>}
      </div>
      <div className="log-terminal-container" style={{ position: 'relative' }}>
        <Terminal ref={ref} style={terminalStyle} options={terminalOptions} />
      </div>
    </LogTerminalRoot>
  );
}

LogTerminal.propTypes = {
  ref: PropTypes.any,
  logFile: PropTypes.string,
};

const LogTerminalRoot = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  .log-terminal-top {
    flex: 0 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    padding: 8px;
    font-size: 14px;
    color: aquamarine;
    background: darkgray;
    word-break: break-word;
  }
  .log-terminal-container {
    flex: 1;
    height: 100%;
    padding: 8px;
    overflow: hidden;
    background: #2c313c;
    .xterm-accessibility {
      pointer-events: none;
    }
  }

  .xterm-viewport::-webkit-scrollbar {
    width: 10px;
  }
  .xterm-viewport::-webkit-scrollbar-track {
    opacity: 0;
  }
  .xterm-viewport::-webkit-scrollbar-thumb {
    min-height: 20px;
    background-color: #ffffff20;
  }
`;
