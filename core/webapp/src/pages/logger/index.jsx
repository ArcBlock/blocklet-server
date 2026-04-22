import { useParams, useNavigate } from 'react-router-dom';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { LogTerminalGroup } from '@abtnode/ux/lib/logs/log-terminal';
import DownloadLog from '@abtnode/ux/lib/logs/download';
import useLocalStorage from 'react-use/lib/useLocalStorage';

import { useNodeContext } from '../../contexts/node';

export default function Logger() {
  const navigate = useNavigate();
  const [logFilter, setLogFilter] = useLocalStorage('server-logs-filter', {
    name: 'abtnode',
    type: { abtnode: 'error' },
  });
  const { name = logFilter.name } = useParams();
  const { info } = useNodeContext();
  const routerProvider = info.routing.provider;

  const logs = [
    {
      id: 'abtnode',
      name: 'Blocklet Server',
      types: ['error', 'info', 'access', 'stdout', 'stderr', 'pm2'],
    },
    {
      id: 'blocklet-services',
      name: 'Blocklet Services',
      types: ['error', 'info', 'access', 'stdout', 'stderr'],
    },
  ];

  if (routerProvider) {
    const routerName = `Service Gateway(${routerProvider})`;
    logs.push({
      id: `service-gateway-${routerProvider}`,
      name: routerName,
      types: ['error', 'access', 'security'],
    });
  }

  const onSelectChange = e => {
    setLogFilter({ ...logFilter, name: e.target.value });
    navigate(`/logs/${e.target.value}`);
  };

  const serviceSelect = (
    <FormControl sx={{ minWidth: 240 }}>
      <Select value={name} onChange={onSelectChange} size="small">
        {logs.map(x => (
          <MenuItem key={x.id} value={x.id}>
            {x.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const log = logs.find(item => item.id === name) || logs[0];
  const logLevel = log.types.indexOf(logFilter.type[name] || 'error');

  const onTypeChange = type => {
    setLogFilter({
      name,
      type: {
        ...logFilter.type,
        [name]: type,
      },
    });
  };

  return (
    <LogTerminalGroup
      key={log.id}
      name={log.name}
      logId={log.id}
      types={log.types}
      prepend={serviceSelect}
      postpend={<DownloadLog id={info.did} name="blocklet-server" />}
      defaultTypeIndex={logLevel}
      onTypeChange={onTypeChange}
    />
  );
}
