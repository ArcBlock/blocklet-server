import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import prettyMs from 'pretty-ms-i18n';

import Box from '@mui/material/Box';
import { Icon } from '@iconify/react';

import Datatable from '@arcblock/ux/lib/Datatable';
import Typography from '@mui/material/Typography';
import { getDisplayName, forEachBlockletSync, isBlockletRunning } from '@blocklet/meta/lib/util';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import Tooltip from '@mui/material/Tooltip';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import isNumber from 'lodash/isNumber';
import { useBlockletContext } from '../contexts/blocklet';
import { formatLocale, filesize } from '../util';
import BlockletRuntimeInfo from '../blocklet/runtime-info';
import BundleAvatar from '../blocklet/bundle-avatar';
import BlockletStatus from '../blocklet/status';

export default function RuntimeInsight() {
  const { t, locale } = useLocaleContext();

  const [hours, setHours] = useState(6);

  const {
    blocklet,
    actions: { refreshBlocklet },
  } = useBlockletContext();

  const monitList = useMemo(() => {
    const arr = [];

    forEachBlockletSync(blocklet, (component, { ancestors, id, level }) => {
      if (component?.meta?.did && component.meta.did !== blocklet.meta.did) {
        arr.push({
          type: 'blocklet',
          groupId: blocklet.meta.did,
          groupName: getDisplayName(blocklet),
          id,
          name: getDisplayName(component, true),
          blocklet,
          component,
          level: level - 1 >= 0 ? level - 1 : 0,
          runtimeInfo: component.runtimeInfo,
          ancestors,
        });
      }
    });

    return arr;
  }, [blocklet]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refreshBlocklet({ hours });
    const interval = setInterval(() => {
      refreshBlocklet({ hours });
    }, 1000 * 10);

    return () => {
      clearInterval(interval);
    };
  }, [hours]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatUptime = (uptime) => {
    return prettyMs(Number(uptime || 0), {
      locale: formatLocale(locale),
    });
  };

  const monitorColumns = [
    {
      label: t('common.name'),
      name: 'name',
      options: {
        // eslint-disable-next-line react/no-unstable-nested-components
        customBodyRenderLite(rawIndex) {
          const { name, component, level, ancestors } = monitList[rawIndex];

          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                pl: level * 2,
              }}>
              <BundleAvatar size={20} blocklet={component} ancestors={ancestors} />
              <Box
                sx={{
                  ml: 1,
                }}>
                {name}
              </Box>
              <BlockletStatus
                variant="pin"
                style={{ marginLeft: 8 }}
                status={isBlockletRunning(component) ? 'running' : component.status}
                source={component.source}
                progress={component.progress}
              />
            </Box>
          );
        },
      },
    },
    {
      label: t('common.uptime'),
      name: 'runtimeInfo.uptime',
      options: {
        // eslint-disable-next-line react/no-unstable-nested-components
        customBodyRenderLite(rawIndex) {
          const { runtimeInfo, component } = monitList[rawIndex];
          if (!isBlockletRunning(component)) {
            return <Tooltip title={t('common.noData')}>--</Tooltip>;
          }
          return formatUptime(runtimeInfo?.uptime);
        },
      },
    },
    {
      label: t('blocklet.runtimeInfo.memoryUsage'),
      name: 'runtimeInfo.memoryUsage',
      options: {
        // eslint-disable-next-line react/no-unstable-nested-components
        customBodyRenderLite(rawIndex) {
          const { runtimeInfo, component } = monitList[rawIndex];
          if (!isBlockletRunning(component)) {
            return <Tooltip title={t('common.noData')}>--</Tooltip>;
          }
          return filesize(runtimeInfo?.memoryUsage || 0);
        },
      },
    },
    {
      label: t('blocklet.runtimeInfo.cpuUsage'),
      name: 'runtimeInfo.cpuUsage',
      options: {
        // eslint-disable-next-line react/no-unstable-nested-components
        customBodyRenderLite(rawIndex) {
          const { runtimeInfo, component } = monitList[rawIndex];
          if (!isBlockletRunning(component)) {
            return <Tooltip title={t('common.noData')}>--</Tooltip>;
          }
          return `${(runtimeInfo?.cpuUsage || 0).toFixed(1)}%`;
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
      options: {
        // eslint-disable-next-line react/no-unstable-nested-components
        customBodyRenderLite(rawIndex) {
          const { runtimeInfo, component } = monitList[rawIndex];
          if (!isBlockletRunning(component)) {
            return <Tooltip title={t('common.noData')}>--</Tooltip>;
          }
          return runtimeInfo?.pid;
        },
      },
    },
    {
      label: t('blocklet.runtimeInfo.port'),
      name: 'runtimeInfo.port',
      options: {
        // eslint-disable-next-line react/no-unstable-nested-components
        customBodyRenderLite(rawIndex) {
          const { runtimeInfo, component } = monitList[rawIndex];
          if (!isBlockletRunning(component)) {
            return <Tooltip title={t('common.noData')}>--</Tooltip>;
          }
          return runtimeInfo?.port;
        },
      },
    },
  ];

  return (
    <Div component="div">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: 'row',
          mb: 2,
        }}>
        <Typography
          component="h3"
          variant="h5"
          color="textPrimary"
          style={{ fontSize: 18, fontWeight: 'bold' }}
          sx={{
            mb: 2,
          }}>
          {t('analytics.trend')}
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={hours}
          onChange={(_e, v) => {
            if (isNumber(v)) {
              setHours(v);
            }
          }}>
          {[1, 3, 6, 12, 24].map((x) => (
            <ToggleButton value={x} key={x}>
              {x}H
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Box>
        <BlockletRuntimeInfo blocklet={blocklet} />
      </Box>
      <Box
        sx={{
          mt: 3,
        }}>
        <Datatable
          title={t('analytics.detail')}
          className="monitor-table"
          locale={locale}
          data={monitList}
          columns={monitorColumns}
          options={{
            search: false,
            download: false,
            filter: false,
            print: false,
            viewColumns: false,
            pagination: false,
            rowsPerPage: 100,
          }}
        />
      </Box>
    </Div>
  );
}

const Div = styled(Typography)``;
