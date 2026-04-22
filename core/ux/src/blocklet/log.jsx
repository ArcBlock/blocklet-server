import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import styled from '@emotion/styled';
import { useSearchParams } from 'react-router-dom';
import { LogTerminalGroup } from '../logs/log-terminal';
import DownloadLog from '../logs/download';
import BundleAvatar from './bundle-avatar';

const Div = styled.div`
  display: flex;
  justify-items: flex-start;
  align-items: center;
  gap: 8px;
  .name {
    display: block;
    max-width: 260px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
/**
 * - heights:
 *   - header: 64
 *   - footer:
 *     - xs: 57 + 64
 *     - sm: 109 + 64
 *   - main content top:
 *     - xs: 211 + 32 + 16
 *     - md: 160 + 32 + 16
 * - content height:
 *   - xs (Mobile) = 100vh - 444
 *   - sm (Mobile) = 100vh - 508
 *   - md (PC) = 100vh - 445
 */
export default function BlockletLog({ blocklet, ...rest }) {
  const initialData = [
    'Tip: this tab will only show runtime logs. Please go to "Blocklet Server" to view other lifecycle logs of the blocklet (install/start/stop...)',
    '\r\n\r\n',
  ];

  const logs = (blocklet?.children || []).map((x) => ({
    did: x.meta.did,
    name: x.meta.title,
    types: ['error', 'info', 'access', 'stdout', 'stderr'],
    component: x,
  }));

  logs.sort((a, b) => a.name.localeCompare(b.name));

  const [searchText, setSearchText] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const searchComponentId = searchParams.get('component');
  // format: `{componentId},{defaultTypeIndex}`
  const [config, setConfig] = useLocalStorage(`blocklet-log-${blocklet.meta.did}`, '');

  // eslint-disable-next-line prefer-const
  let [componentId, defaultTypeIndex] = config.split(',');

  if (!logs.find((x) => x.did === componentId)) {
    componentId = logs[0]?.did;
  }

  if (searchComponentId) {
    componentId = searchComponentId;
  }

  const onSelectChange = (e) => {
    setSearchParams({ component: e.target.value });
    setConfig([e.target.value, defaultTypeIndex].join(','));
  };

  const filteredLogs = logs.filter((option) => option.name.toLowerCase().includes(searchText.toLowerCase()));

  const componentSelect = (
    <FormControl sx={{ minWidth: 240, maxWidth: 300 }}>
      <Select
        MenuProps={{ autoFocus: false }}
        value={componentId}
        onChange={onSelectChange}
        onClose={() => setSearchText('')}
        size="small"
        variant="outlined">
        <ListSubheader>
          <TextField
            autoFocus
            value={searchText}
            placeholder="Search"
            variant="outlined"
            size="small"
            fullWidth
            onChange={(event) => setSearchText(event.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Escape') {
                e.stopPropagation();
              }
            }}
          />
        </ListSubheader>
        {filteredLogs.map((x) => (
          <MenuItem key={x.did} value={x.did}>
            <Div>
              <BundleAvatar size={24} blocklet={x.component} ancestors={[blocklet]} />
              <span className="name">{x.name}</span>
            </Div>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const log = logs.find((item) => item.did === componentId) || logs[0] || blocklet.meta;

  const onTypeChange = (type) => {
    const index = log.types.indexOf(type);
    setConfig([componentId, index || 0].join(','));
  };

  return (
    <Box
      {...rest}
      sx={[
        {
          height: { xs: 'calc(100vh - 444px)', sm: 'calc(100vh - 508px)', md: 'calc(100vh - 445px)' },
        },
        ...(Array.isArray(rest.sx) ? rest.sx : [rest.sx]),
      ]}>
      <LogTerminalGroup
        key={log.did}
        logId={log === blocklet.meta ? `blocklet-${blocklet.meta.did}` : `blocklet-${blocklet.meta.did}/${log.did}`}
        initialData={initialData}
        prepend={componentSelect}
        postpend={<DownloadLog id={blocklet.meta.did} name={blocklet.meta.name} />}
        name={log.name}
        types={log.types}
        defaultTypeIndex={defaultTypeIndex}
        onTypeChange={onTypeChange}
      />
    </Box>
  );
}
BlockletLog.propTypes = {
  blocklet: PropTypes.object.isRequired,
};
