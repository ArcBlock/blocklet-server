import Remove from '@mui/icons-material/DeleteOutline';
import Start from '@mui/icons-material/PlayArrowOutlined';
import Stop from '@mui/icons-material/StopOutlined';
import Restart from '@mui/icons-material/ReplayOutlined';
import Reload from '@mui/icons-material/AutorenewOutlined';
import Config from '@mui/icons-material/SettingsOutlined';
import Log from '@mui/icons-material/ReceiptOutlined';
import Group from '@mui/icons-material/GroupOutlined';
import Cancel from '@mui/icons-material/NotInterestedOutlined';
import Dashboard from '@arcblock/icons/lib/Dashboard';
import Overview from '@mui/icons-material/ViewInArOutlined';
import { Icon } from '@iconify/react';
import TerminalIcon from '@iconify-icons/tabler/terminal-2';

const logIconContainerStyle = { display: 'inline-flex', width: '26px', height: '26px', paddingRight: '3px' };

// 使用 span 包裹，避免 Icon 组件闪烁
function LogIcon(props) {
  return (
    <span style={logIconContainerStyle}>
      <Icon icon={TerminalIcon} width="100%" height="100%" {...props} />
    </span>
  );
}

export default {
  Start,
  Stop,
  Restart,
  Reload,
  Remove,
  Config,
  Log,
  Group,
  Cancel,
  Dashboard,
  Overview,
  LogIcon,
  TerminalIcon,
};
