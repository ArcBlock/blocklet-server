import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import React, { useCallback, useState } from 'react';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Empty from '@arcblock/ux/lib/Empty';
import xbytes from 'xbytes';
import CpuMonitor from '../analytics/cpu';
import MemoryMonitor from '../analytics/memory';
import { useNodeContext } from '../contexts/node';
import { useBlockletContext } from '../contexts/blocklet';

export default function BlockletRuntimeInfo({ blocklet, cpuHistory = [], memoryHistory = [], ...rest }) {
  const { t } = useLocaleContext();
  const { info } = useNodeContext();
  const { runtimeHistory } = useBlockletContext();
  const [hoverIndex, setHoverIndex] = useState(
    /** @type {{ seriesIndex: number, dataIndex: number, ref: React.RefObject<HTMLDivElement> } | null} */
    (null)
  );

  const getEmptyPlaceholder = useCallback(
    (data) => {
      if (blocklet.status !== 'running') {
        return <Typography>{t('blocklet.runtimeInfo.noRunning')}</Typography>;
      }
      if (!data.length) {
        return <Empty>{t('common.empty')}</Empty>;
      }
      return null;
    },
    [blocklet.status, t]
  );

  const handleHover = useCallback((params) => {
    setHoverIndex(params);
  }, []);

  if (runtimeHistory.length === 0) {
    return <Typography>{t('blocklet.runtimeInfo.noRunning')}</Typography>;
  }

  return (
    <Div component="div" {...rest} memoryHistory={memoryHistory} cpuHistory={cpuHistory}>
      <Grid className="page-metrics" container spacing={5}>
        <Grid sx={{ pt: '16px !important' }} size={12}>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 'bold',
            }}>
            CPU
          </Typography>
        </Grid>
        {runtimeHistory?.map((x) => {
          return (
            <Grid
              key={`${x.key}-cpu`}
              sx={{ pt: '16px !important' }}
              size={{
                lg: 4,
                md: 6,
                sm: 6,
                xs: 12,
              }}>
              <CpuMonitor
                title={`${x.name} CPU`}
                empty={getEmptyPlaceholder(x.cpu)}
                currentLoad={x.appRuntimeInfo?.cpuUsage || 0}
                cpus={x.appRuntimeInfo?.cpus || []}
                history={x.cpu}
                onHover={handleHover}
                hoverIndex={hoverIndex}
                style={{ height: 150 }}
              />
            </Grid>
          );
        })}
      </Grid>
      <Grid className="page-metrics" container spacing={5} sx={{ mt: 1 }}>
        <Grid sx={{ pt: '16px !important' }} size={12}>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 'bold',
            }}>
            Memory
          </Typography>
        </Grid>
        {runtimeHistory?.map((x) => {
          return (
            <Grid
              key={`${x.key}-memory`}
              sx={{ pt: '16px !important' }}
              size={{
                lg: 4,
                md: 6,
                sm: 6,
                xs: 12,
              }}>
              <MemoryMonitor
                title={`${x.name} Memory`}
                empty={getEmptyPlaceholder(x.memory)}
                total={
                  info.runtimeConfig?.blockletMaxMemoryLimit
                    ? xbytes.parseSize(
                        `${info.runtimeConfig.blockletMaxMemoryLimit * (x.key === blocklet?.meta?.did ? runtimeHistory.length - 1 : 1)}MiB`
                      )
                    : 0
                }
                used={x.appRuntimeInfo?.memoryUsage || 0}
                history={x.memory}
                onHover={handleHover}
                hoverIndex={hoverIndex}
                style={{ height: 150 }}
              />
            </Grid>
          );
        })}
      </Grid>
    </Div>
  );
}

BlockletRuntimeInfo.propTypes = {
  blocklet: PropTypes.object.isRequired,
  cpuHistory: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.number,
      value: PropTypes.number,
    })
  ),
  memoryHistory: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.number,
      value: PropTypes.number,
    })
  ),
};

const Div = styled(Typography)``;
