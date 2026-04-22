/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import prettyMs from 'pretty-ms-i18n';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Icon } from '@iconify/react';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import Datatable from '@arcblock/ux/lib/Datatable';
import Spinner from '@mui/material/CircularProgress';
import Center from '@arcblock/ux/lib/Center';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import ServerIcon from '@arcblock/icons/lib/Server';
import xbytes from 'xbytes';

import { EVENTS } from '@abtnode/constant';
import { BlockletEvents } from '@blocklet/constant';
import Toast from '@arcblock/ux/lib/Toast';
import BlockletAppAvatar from '@abtnode/ux/lib/blocklet/app-avatar';
import BundleAvatar from '@abtnode/ux/lib/blocklet/bundle-avatar';
import { formatLocale } from '@abtnode/ux/lib/util';
import { getDisplayName, forEachBlockletSync } from '@blocklet/meta/lib/util';
import CpuMonitor from '@abtnode/ux/lib/analytics/cpu';
import MemoryMonitor from '@abtnode/ux/lib/analytics/memory';
import DiskMonitor from '@abtnode/ux/lib/analytics/disk';
import useLocalStorage from 'react-use/lib/useLocalStorage';

import isNumber from 'lodash/isNumber';
import { useNodeContext } from '../../contexts/node';
import { useBlockletsContext } from '../../contexts/blocklets';
// eslint-disable-next-line import/no-unresolved
import ServerLogo from '../../assets/logo.svg?react';
import { useSubscription } from '../../libs/ws';
import { filesize } from '../../libs/util';

const DEFAULT_RUNTIME_INFO = {
  uptime: 0,
  pid: -1,
  cpuUsage: 0,
  memoryUsage: 0,
};

const SERVER_GROUP_NAME = 'Blocklet Server';

function RuntimeInsights({ initialBlocklets }) {
  const { t, locale } = useLocaleContext();
  const { api, info } = useNodeContext();
  const [hours, setHours] = useLocalStorage('runtime-view-interval', 6);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [monitList, setMonitList] = useState([]);
  const handleHover = useCallback(params => {
    setHoverIndex(params);
  }, []);

  useEffect(() => {
    const arr = [];
    arr.push({
      type: 'server',
      groupId: 'server',
      groupName: SERVER_GROUP_NAME,
      id: 'server:daemon',
      name: 'Server (Daemon)',
      runtimeInfo: DEFAULT_RUNTIME_INFO,
    });
    arr.push({
      type: 'server',
      groupId: 'server',
      groupName: SERVER_GROUP_NAME,
      id: 'server:service',
      name: 'Server (Service)',
      runtimeInfo: DEFAULT_RUNTIME_INFO,
    });

    initialBlocklets.forEach(blocklet => {
      forEachBlockletSync(blocklet, (component, { id, ancestors }) => {
        if (component.runtimeInfo) {
          arr.push({
            type: 'blocklet',
            groupId: blocklet.meta.did,
            groupName: getDisplayName(blocklet),
            id,
            name: getDisplayName(component, true),
            blocklet,
            component,
            runtimeInfo: component.runtimeInfo,
            ancestors,
          });
        }
      });
    });

    setMonitList(arr);
  }, [!!initialBlocklets?.[0]?.appRuntimeInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  const [sysInfo, setSysInfo] = useState({
    os: { platform: '' },
    mem: { used: 0, free: 0, total: 1 },
    cpu: { cpus: [], currentLoad: 1 },
    disks: [],
    daemon: {},
    service: {},
  });
  const [sysInfoHistory, setSysInfoHistory] = useState({
    cpu: [],
    mem: [],
    daemonMem: [],
    serviceMem: [],
  });

  useSubscription(EVENTS.NODE_RUNTIME_INFO, res => {
    res.mem.total = res.mem.total || 0;
    res.mem.used = res.mem.total - (res.mem.available || 0);
    setSysInfo(res);
    setMonitList(list =>
      list.map(x => {
        if (x.id === 'server:daemon') {
          return {
            ...x,
            runtimeInfo: { ...x.runtimeInfo, ...res.daemon },
          };
        }

        if (x.id === 'server:service') {
          return {
            ...x,
            runtimeInfo: { ...x.runtimeInfo, ...res.service },
          };
        }

        return x;
      })
    );
  });

  useSubscription(EVENTS.BLOCKLETS_RUNTIME_INFO, res => {
    if (!res || !res.length) {
      console.error('incorrect blocklets runtime info format', res);
      return;
    }

    setMonitList(list => {
      return list.map(proc => {
        const item = res.find(y => y.componentId === proc.id);
        if (item) {
          return {
            ...proc,
            runtimeInfo: { ...proc.runtimeInfo, ...item.runtimeInfo },
          };
        }

        return proc;
      });
    });
  });

  const removeBlocklet = blocklet => {
    setMonitList(list => list.filter(item => item.groupId !== blocklet.meta.did));
  };

  const refreshBlocklet = async b => {
    try {
      const { blocklet } = await api.getBlocklet({ input: { did: b.meta.did, attachRuntimeInfo: true } });

      if (blocklet.status !== 'running') {
        removeBlocklet(blocklet);
      }

      setMonitList(list => {
        const arr = list.filter(item => item.groupId !== blocklet.meta.did);

        forEachBlockletSync(blocklet, (component, { id, ancestors }) => {
          if (component.runtimeInfo) {
            arr.push({
              type: 'blocklet',
              groupId: blocklet.meta.did,
              groupName: getDisplayName(blocklet),
              id,
              name: getDisplayName(component, true),
              blocklet,
              component,
              runtimeInfo: component.runtimeInfo,
              ancestors,
            });
          }
        });

        return arr;
      });
    } catch (err) {
      Toast.error(err.message);
    }
  };

  useSubscription(BlockletEvents.removed, removeBlocklet);
  useSubscription(BlockletEvents.startFailed, removeBlocklet);

  useSubscription(BlockletEvents.statusChange, blocklet => {
    if (blocklet.status !== 'running') {
      removeBlocklet(blocklet);
      return;
    }

    refreshBlocklet(blocklet);
  });

  useSubscription(BlockletEvents.updated, refreshBlocklet);
  useSubscription(BlockletEvents.started, refreshBlocklet);

  const getRuntimeHistory = () => {
    api
      .getNodeRuntimeHistory({ input: { hours } })
      .then(data => {
        const history = data.history || [];
        setSysInfoHistory({
          cpu: history.map(x => ({ date: x.date, value: x.cpu })),
          mem: history.map(x => ({ date: x.date, value: x.mem })),
          daemonMem: history.map(x => ({ date: x.date, value: x.daemonMem })),
          serviceMem: history.map(x => ({ date: x.date, value: x.serviceMem })),
        });
      })
      .catch(err => {
        Toast.error(err.message);
      });
  };

  useEffect(() => {
    getRuntimeHistory();
  }, [hours]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatUptime = uptime => {
    return prettyMs(Number(uptime || 0), {
      locale: formatLocale(locale),
    });
  };

  const monitorColumns = [
    {
      label: t('common.group'),
      name: 'groupName',
      options: {
        customBodyRenderLite(rawIndex) {
          const { type, blocklet, groupName } = monitList[rawIndex];

          if (type === 'server') {
            return (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                }}>
                <ServerLogo width="14" height="14" />
                <Box
                  sx={{
                    ml: 1,
                  }}>
                  {groupName}
                </Box>
              </Box>
            );
          }

          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}>
              <BlockletAppAvatar size={14} blocklet={blocklet} />
              <Box
                sx={{
                  ml: 1,
                }}>
                {groupName}
              </Box>
            </Box>
          );
        },
      },
    },
    {
      label: t('common.name'),
      name: 'name',
      options: {
        customBodyRenderLite(rawIndex) {
          const { type, name, component, ancestors } = monitList[rawIndex];

          if (type === 'server') {
            return (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                }}>
                <ServerIcon width="14" height="14" />
                <Box
                  sx={{
                    ml: 1,
                  }}>
                  {name}
                </Box>
              </Box>
            );
          }

          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}>
              <BundleAvatar size={14} blocklet={component} ancestors={ancestors} />
              <Box
                sx={{
                  ml: 1,
                }}>
                {name}
              </Box>
            </Box>
          );
        },
      },
    },
    {
      label: t('common.uptime'),
      name: 'runtimeInfo.uptime',
      options: {
        customBodyRenderLite(rawIndex) {
          const { runtimeInfo } = monitList[rawIndex];

          return formatUptime(runtimeInfo.uptime);
        },
      },
    },
    {
      label: t('blocklet.runtimeInfo.memoryUsage'),
      name: 'runtimeInfo.memoryUsage',
      options: {
        customBodyRenderLite(rawIndex) {
          const { runtimeInfo } = monitList[rawIndex];

          return filesize(runtimeInfo?.memoryUsage || 0);
        },
        sortDirection: 'asc',
      },
    },
    {
      label: t('blocklet.runtimeInfo.cpuUsage'),
      name: 'runtimeInfo.cpuUsage',
      options: {
        customBodyRenderLite(rawIndex) {
          const { runtimeInfo } = monitList[rawIndex];

          return `${(runtimeInfo.cpuUsage || 0).toFixed(1)}%`;
        },
      },
    },
    {
      label: t('analytics.runtime'),
      name: 'runtimeInfo.runtime',
      options: {
        // eslint-disable-next-line react/no-unstable-nested-components
        customBodyRenderLite(rawIndex) {
          const { runtimeInfo } = monitList[rawIndex];
          if (!runtimeInfo?.uptime) {
            return null;
          }
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}>
              <Icon icon={runtimeInfo?.runningDocker ? 'catppuccin:docker-ignore' : 'logos:nodejs-icon'} />
              <Box
                sx={{
                  ml: 1,
                }}>
                {runtimeInfo?.runningDocker ? 'Docker' : 'Nodejs'}
              </Box>
            </Box>
          );
        },
      },
    },
    {
      label: t('blocklet.runtimeInfo.processId'),
      name: 'runtimeInfo.pid',
    },
    {
      label: t('blocklet.runtimeInfo.port'),
      name: 'runtimeInfo.port',
    },
  ];

  return (
    <div>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: 'row',
          mb: 2,
        }}>
        <Typography component="h3" variant="h5" color="textPrimary" style={{ fontSize: 18, fontWeight: 'bold' }}>
          {t('analytics.trend')}
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={hours}
          onChange={(e, v) => {
            if (isNumber(v)) {
              setHours(v);
            }
          }}>
          {[1, 3, 6, 12, 24].map(x => (
            <ToggleButton value={x} key={x}>
              {x}H
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Grid
        container
        spacing={4}
        sx={{
          mb: 4,
        }}>
        <Grid
          key="cpu"
          size={{
            lg: 3,
            md: 6,
            sm: 6,
            xs: 12,
          }}>
          <CpuMonitor {...sysInfo.cpu} history={sysInfoHistory.cpu} onHover={handleHover} hoverIndex={hoverIndex} />
        </Grid>
        <Grid
          key="memory"
          size={{
            lg: 3,
            md: 6,
            sm: 6,
            xs: 12,
          }}>
          <MemoryMonitor {...sysInfo.mem} history={sysInfoHistory.mem} onHover={handleHover} hoverIndex={hoverIndex} />
        </Grid>
        <Grid
          key="memory-daemon"
          size={{
            lg: 3,
            md: 6,
            sm: 6,
            xs: 12,
          }}>
          <MemoryMonitor
            title={`Daemon ${t('common.memory')}`}
            total={xbytes.parseSize(`${info.runtimeConfig.daemonMaxMemoryLimit}MiB`)}
            used={sysInfo.daemon.memoryUsage || 0}
            history={sysInfoHistory.daemonMem}
            onHover={handleHover}
            hoverIndex={hoverIndex}
          />
        </Grid>
        <Grid
          key="memory-service"
          size={{
            lg: 3,
            md: 6,
            sm: 6,
            xs: 12,
          }}>
          <MemoryMonitor
            title={`Service ${t('common.memory')}`}
            total={xbytes.parseSize(`${info.runtimeConfig.blockletMaxMemoryLimit}MiB`)}
            instanceCount={sysInfo.service.instanceCount || 0}
            used={sysInfo.service.memoryUsage || 0}
            history={sysInfoHistory.serviceMem}
            onHover={handleHover}
            hoverIndex={hoverIndex}
          />
        </Grid>
        {sysInfo.disks.map(disk => (
          <Grid
            key={disk.device || 'disk'}
            size={{
              lg: 3,
              md: 6,
              sm: 6,
              xs: 12,
            }}>
            <DiskMonitor disk={disk} />
          </Grid>
        ))}
      </Grid>
      <Datatable
        className="runtime-insight-list"
        title={t('analytics.detail')}
        locale={locale}
        data={monitList}
        columns={monitorColumns}
        options={{
          download: false,
          filter: false,
          print: false,
          pagination: false,
          rowsPerPage: 100,
        }}
      />
    </div>
  );
}

RuntimeInsights.propTypes = {
  initialBlocklets: PropTypes.array.isRequired,
};

export default function WrapRuntimeInsights() {
  const { data: internalData, externalData, initialized } = useBlockletsContext();

  if (!initialized) {
    return (
      <Center relative="parent">
        <Spinner />
      </Center>
    );
  }

  const initialBlocklets = [...internalData, ...externalData] || [];

  return <RuntimeInsights initialBlocklets={initialBlocklets} />;
}
