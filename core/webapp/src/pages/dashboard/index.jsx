/* eslint-disable react/jsx-one-expression-per-line */
import { useContext } from 'react';
import styled from '@emotion/styled';
import { useTheme, Link, Typography, Grid, LinearProgress, Box, CircularProgress as Spinner } from '@mui/material';
import { format } from 'timeago.js';
import prettyMs from 'pretty-ms-i18n';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import get from 'lodash/get';
import lowerCase from 'lodash/lowerCase';
import PropTypes from 'prop-types';

import Tag from '@arcblock/ux/lib/Tag';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import Metric from '@abtnode/ux/lib/component/metric';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import DidAddress from '@abtnode/ux/lib/did-address';
import ClickToCopy from '@abtnode/ux/lib/click-to-copy';
import { mergeSx } from '@arcblock/ux/lib/Util/style';
import { isBlockletRunning } from '@blocklet/meta/lib/util';

import { useNodeContext } from '../../contexts/node';
import { useBlockletsContext } from '../../contexts/blocklets';
import { ServerUserProvider, useServerUserContext } from '../../contexts/server-user';
import { formatLocale, filesize } from '../../libs/util';
import { useUpTime } from '../../components/uptime';

const getExtraInfo = async api => {
  const res = await api.getNodeEnv();
  return Object.assign({}, res.info || {});
};

function LinearProgressWithLabel(props) {
  const { value } = props;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}>
      <Box
        style={{ overflow: 'hidden' }}
        sx={{
          width: '100%',
          mr: 1,
        }}>
        <LinearProgress
          variant="determinate"
          {...props}
          sx={mergeSx(
            theme => ({
              '.MuiLinearProgress-root': {
                height: 20,
              },
              '.MuiLinearProgress-colorPrimary': {
                backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 200 : 700],
              },
              '.MuiLinearProgress-bar': {
                backgroundColor: '#1a90ff',
              },
            }),
            // eslint-disable-next-line react/prop-types
            props.sx
          )}
        />
      </Box>
      <Box
        sx={{
          minWidth: 35,
        }}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(value)}%`}</Typography>
      </Box>
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
};

function MetricItem({ className, title, metric }) {
  return (
    <Item className={className}>
      <div className="item-content">
        <div>{title}</div>
        <div>{metric}</div>
      </div>
    </Item>
  );
}

MetricItem.propTypes = {
  className: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  metric: PropTypes.string.isRequired,
};

function Dashboard() {
  const { info: nodeInfo, api, loading } = useNodeContext();
  const { data: blocklets, externalData: externalBlocklets, paging, externalPaging } = useBlockletsContext();
  const { users } = useServerUserContext();
  const extra = useAsyncRetry(() => getExtraInfo(api));
  const { t, locale } = useContext(LocaleContext);
  const theme = useTheme();
  const uptime = useUpTime(+new Date() - nodeInfo.startAt, x => {
    const options = { compact: true, verbose: true, locale: formatLocale(locale) };
    return prettyMs(x, options);
  });

  let content = null;
  if (loading) {
    content = <Spinner />;
  } else {
    const didRows = [{ name: t('dashboard.nodeDid'), value: <DidAddress did={nodeInfo.did} showQrcode /> }];

    if (nodeInfo.nodeOwner) {
      didRows.push({
        name: t('dashboard.ownerDid'),
        value: <DidAddress did={nodeInfo.nodeOwner.did} showQrcode />,
      });
    }

    let launcherRows = [];
    if (nodeInfo.launcher) {
      launcherRows = [
        { name: t('common.did'), value: <DidAddress did={nodeInfo.launcher.did} showQrcode /> },
        { name: t('common.type'), value: nodeInfo.launcher.type },
        { name: t('launcher.provider'), value: nodeInfo.launcher.provider },
        {
          name: t('launcher.adminUrl'),
          value: (
            <Link target="_blank" href={nodeInfo.launcher.url} underline="hover">
              {nodeInfo.launcher.url}
            </Link>
          ),
        },
      ];
    }

    const renderIp = (v4, v6) => {
      if (!v4 && !v6) {
        return '-';
      }

      if (v4 === '-') {
        return v4;
      }

      if (!v6 || v6 === '-') {
        return (
          <Typography className="ip-item">
            <Tag>IPV4</Tag>
            <ClickToCopy>{v4}</ClickToCopy>
          </Typography>
        );
      }

      return (
        <Typography component="ul">
          <li className="ip-item">
            <Tag>IPV4</Tag>
            <ClickToCopy>{v4}</ClickToCopy>
          </li>
          <li className="ip-item">
            <Tag>IPV6</Tag>
            <ClickToCopy>{v6}</ClickToCopy>
          </li>
        </Typography>
      );
    };

    const isDockerRow = () => {
      const ipRows = [
        {
          name: `${t('common.internalIp')}`,
          value: renderIp(extra.value.ip.internalV4, extra.value.ip.internalV6),
        },
        {
          name: `${t('common.externalIp')}`,
          value: renderIp(extra.value.ip.externalV4, extra.value.ip.externalV6),
        },
      ];
      return extra.value.docker ? [] : ipRows;
    };

    // prettier-ignore
    const envRows = extra.value
      ? [
        { name: `${t('common.version')}`, value: nodeInfo.version },
        ...isDockerRow(),
        { name: `${t('common.os')}`, value: extra.value.os },
        extra.value.docker ? { name: `${t('common.docker')}`, value: <Tag type="success">Yes</Tag> } : null,
        extra.value.gitpod ? { name: `${t('common.gitpod')}`, value: <Tag type="success">Yes</Tag> } : null,
      ].filter(Boolean)
      : [];

    if (Array.isArray(get(extra, 'value.blockletEngines', null))) {
      extra.value.blockletEngines
        .filter(e => e.visible && e.available)
        .forEach(e => {
          envRows.push({
            name: e.displayName,
            value: <Tag type="success">{`${e.version}` || 'N/A'}</Tag>,
          });
        });
    }

    const totalMemberCount = users.length;
    const approvedMemberCount = users.filter(x => x.approved).length;
    let memberStats = totalMemberCount;
    if (approvedMemberCount) {
      memberStats += `<small><strong>${lowerCase(t('common.approved'))} ${approvedMemberCount}</strong></small>`;
    }

    let totalBlocklets = 0;
    let runningBlocklets = 0;
    if (blocklets) {
      // Use paging.total for accurate count, fallback to array length
      totalBlocklets = paging?.total || blocklets.length;
      runningBlocklets = blocklets.filter(x => isBlockletRunning(x)).length;
    }
    if (Array.isArray(externalBlocklets)) {
      totalBlocklets += externalPaging?.total || externalBlocklets.length;
      runningBlocklets += externalBlocklets.filter(x => isBlockletRunning(x)).length;
    }
    let blockletStats = totalBlocklets;
    if (runningBlocklets) {
      blockletStats += `<small>${t('common.running')} ${runningBlocklets}</small>`;
    }

    const metrics = [
      {
        name: t('common.blocklets'),
        value: blockletStats,
      },
      {
        name: t('common.members'),
        value: memberStats,
      },
      {
        name: t('common.uptime'),
        value: uptime,
      },
      {
        name: t('common.created'),
        value: format(new Date(nodeInfo.createdAt).getTime(), formatLocale(locale)),
      },
    ];

    let storageMetrics = [];
    if (extra.value && extra.value.disk && Object.values(extra.value.disk).some(x => x > 0)) {
      storageMetrics = [
        {
          name: t('common.blockletsStorage'),
          value: filesize(extra.value.disk.blocklets || 0).toUpperCase(),
        },
        {
          name: t('common.dataStorage'),
          value: filesize(extra.value.disk.data || 0).toUpperCase(),
        },
        {
          name: t('common.logStorage'),
          value: filesize(extra.value.disk.log || 0).toUpperCase(),
        },
        {
          name: t('common.cacheStorage'),
          value: filesize(extra.value.disk.cache || 0).toUpperCase(),
        },
        {
          name: t('common.coreStorage'),
          value: filesize(extra.value.disk.app || 0).toUpperCase(),
        },
      ];
    }

    content = (
      <>
        <div className="section">
          <Typography className="section__header" component="h2" variant="h4" color="textPrimary">
            {t('common.overview')}
          </Typography>
          <Grid
            className="page-metrics"
            container
            spacing={{
              xs: 1,
              md: 2,
            }}>
            {metrics.map(x => (
              <Grid
                key={x.name}
                size={{
                  xl: 1.5,
                  lg: 3,
                  md: 4,
                  sm: 12,
                  xs: 12,
                }}>
                <Metric {...x} />
              </Grid>
            ))}
          </Grid>
        </div>
        {storageMetrics.length > 0 && (
          <div className="section">
            <Typography className="section__header" component="h2" variant="h4" color="textPrimary">
              {t('common.storage')}
            </Typography>
            <Grid
              className="page-metrics"
              container
              spacing={{
                xs: 1,
                md: 2,
              }}>
              {storageMetrics.map(x => (
                <Grid
                  key={x.name}
                  size={{
                    xl: 1.5,
                    lg: 3,
                    md: 4,
                    sm: 12,
                    xs: 12,
                  }}>
                  <Metric {...x} />
                </Grid>
              ))}
            </Grid>
          </div>
        )}
        <div className="section">
          <Typography className="section__header" component="h2" variant="h4" color="textPrimary">
            {t('common.meta')}
          </Typography>
          <Grid className="page-metrics" container spacing={{ xs: 2, sm: 3, md: 4, lg: 5 }}>
            <Grid
              key="address"
              size={{
                lg: 6,
                md: 12,
                sm: 12,
                xs: 12,
              }}>
              <Typography className="section__header" component="h3" variant="h5" color="textPrimary">
                {t('common.dAddress')}
              </Typography>
              {didRows.map(row => (
                <InfoRow key={row.name} nameWidth={150} name={row.name}>
                  {row.value}
                </InfoRow>
              ))}
              {launcherRows.length > 0 && (
                <div style={{ marginTop: theme.spacing(8) }}>
                  <Typography className="section__header" component="h3" variant="h5" color="textPrimary">
                    {t('common.launcher')}
                  </Typography>
                  {launcherRows.map(row => (
                    <InfoRow key={row.name} nameWidth={150} name={row.name}>
                      {row.value}
                    </InfoRow>
                  ))}
                </div>
              )}
            </Grid>
            <Grid
              key="environment"
              size={{
                lg: 6,
                md: 12,
                sm: 12,
                xs: 12,
              }}>
              <Typography className="section__header" component="h3" variant="h5" color="textPrimary">
                {t('common.env')}
              </Typography>
              {envRows.map(row => (
                <InfoRow valueComponent="div" key={row.name} nameWidth={150} name={row.name}>
                  {row.value}
                </InfoRow>
              ))}
            </Grid>
          </Grid>
        </div>
      </>
    );
  }

  return <Main>{content}</Main>;
}

const Main = styled.main`
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .page-content {
    margin-top: 16px;
  }

  .section {
    display: flex;
    flex-direction: column;
    margin-bottom: ${props => (props.theme.breakpoints.down('sm') ? '24px' : '64px')};

    .section__header {
      font-weight: bold;
      margin-bottom: ${props => (props.theme.breakpoints.down('sm') ? '12px' : '24px')};
    }

    .info-row__name {
      text-transform: uppercase;
      font-size: 0.9em;
    }

    .info-row__value .ip-item {
      display: flex;
      align-items: center;
    }

    .info-row__value .ip-item:not(:first-of-type) {
      margin-top: 5px;
    }

    /* 屏宽小于 600px 时, container padding 为 16px, .MuiGrid-spacing-xs-5 会在水平方向延伸 40px, 超出容器宽度, 会导致水平滚动条 */
    .MuiGrid-spacing-xs-5 {
      width: calc(100% + 32px);
      margin: -16px;
    }
  }

  .section-flex {
    flex-direction: row;
  }

  .section-item {
    flex: 1;
  }

  .section-item-desc {
    display: flex;
    margin-top: 15px;
  }

  .used::before {
    content: ' ';
    border: 0;
    background-color: #1a90ff;
  }

  .free::before {
    content: ' ';
    border: 0;
    background-color: #eeeeee;
  }

  @media (max-width: ${props => props.theme.breakpoints.values.md}px) {
    .section-flex {
      flex-direction: column;
    }
  }
`;

const Item = styled.div`
  flex: 1;
  display: flex;

  &::before {
    content: '';
    display: block;
    width: 12px;
    height: 12px;
    border: 1px solid #999;
    border-radius: 2px;
    margin-top: 3px;
    margin-right: 10px;
  }
`;

export default function Wrapper() {
  return (
    <ServerUserProvider>
      <Dashboard />
    </ServerUserProvider>
  );
}
