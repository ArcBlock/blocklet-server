/* eslint-disable react/no-unstable-nested-components */
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import Dialog from '@arcblock/ux/lib/Dialog';
import Box from '@mui/material/Box';
import { useRef, useMemo, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Tooltip from '@mui/material/Tooltip';
import Tabs from '@arcblock/ux/lib/Tabs';
import { useReactive, useRequest } from 'ahooks';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import InfoIcon from '@mui/icons-material/Info';
import Stack from '@mui/material/Stack';
import Datatable from '@arcblock/ux/lib/Datatable';
import Toast from '@arcblock/ux/lib/Toast';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import dayjs from '@abtnode/util/lib/dayjs';
import { PASSPORT_LOG_ACTION, PASSPORT_ISSUE_ACTION } from '@abtnode/constant';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import DidAddress from '../../../did-address';
import { useTeamContext } from '../../../contexts/team';
import { useNodeContext } from '../../../contexts/node';
import { formatToDatetime } from '../../../util';
import { renderRole, renderStatus, renderTime, renderSource, renderUser, renderUserAgent } from './passport-item';
import { parseAvatar } from '../../members/util';
import useMobile from '../../../hooks/use-mobile';

const defaultTab = 'info';

export default function PassportDetail({ createPassportSvg, passport, onCancel, onSwitchPassport = () => {} }) {
  const { t } = useLocaleContext();

  const pageState = useReactive({
    tab: defaultTab,
  });

  const tabConfigs = {
    info: {
      label: t('common.basicInfo'),
      value: defaultTab,
      component: () => <BaseInfo passport={passport} createPassportSvg={createPassportSvg} />,
    },
    logs: {
      label: t('common.logs'),
      value: 'logs',
      component: () => <Logs passport={passport} />,
    },
    related: {
      label: t('team.passport.related'),
      value: 'related',
      component: () => <Related passport={passport} onSwitchPassport={onSwitchPassport} />,
    },
  };

  const tabs = Object.values(tabConfigs)
    .map(({ label, value }) => ({ label, value }))
    .filter((x) => {
      if (x.value === 'related') {
        return passport.parentDid;
      }

      return true;
    });

  const tabConfig = tabConfigs[pageState.tab] || tabConfigs.info;
  const onTabChange = (newTab) => {
    pageState.tab = newTab;
  };

  return (
    <Dialog
      title={t('common.passport')}
      onClose={onCancel}
      open
      PaperProps={{ style: { maxWidth: 800, minHeight: '80vh' } }}
      fullWidth>
      <Div>
        <Box className="tabs">
          <Tabs tabs={tabs} current={pageState.tab} onChange={onTabChange} scrollButtons="auto" />
        </Box>

        <Box className="body">
          <tabConfig.component />
        </Box>
      </Div>
    </Dialog>
  );
}

PassportDetail.propTypes = {
  createPassportSvg: PropTypes.func.isRequired,
  passport: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSwitchPassport: PropTypes.func,
};

const Div = styled(Box)`
  margin-top: -16px;

  .tabs {
    margin-left: 0;
    margin-right: 0;
  }

  .body {
    margin-top: 24px;
  }
`;

function BaseInfo({ createPassportSvg, passport }) {
  const { t, locale } = useLocaleContext();
  const { teamDid } = useTeamContext();
  const { inService } = useNodeContext();
  const isMobile = useMobile();

  const baseInfo = [
    {
      items: [
        {
          label: t('common.role'),
          content: renderRole(passport.title),
        },
        {
          label: t('common.did'),
          content: <DidAddress did={passport.id} />,
        },
        {
          label: t('team.passport.status'),
          content: renderStatus(passport.status),
        },
        {
          label: t('common.type'),
          content: (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(passport.type || []).map((type) => (
                <Chip key={type} label={type} variant="outlined" size="small" sx={{ borderRadius: 1 }} />
              ))}
            </Box>
          ),
        },
      ],
    },
  ];

  const infoGroups = [
    {
      title: t('team.passport.owner'),
      items: [
        {
          label: t('team.passport.owner'),
          content: <Box>{renderUser(passport.user, inService)}</Box>,
        },
      ],
    },
    {
      title: t('common.timeInfo'),
      items: [
        {
          label: t('team.passport.issuanceTime'),
          content: passport.issuanceDate ? (
            <RelativeTime value={passport.issuanceDate} type="all" locale={locale} />
          ) : (
            '-'
          ),
        },
        {
          label: t('team.member.lastLogin'),
          content: passport.lastLoginAt ? (
            <RelativeTime value={passport.lastLoginAt} type="all" locale={locale} />
          ) : (
            '-'
          ),
        },
        {
          label: t('common.expires'),
          content: passport.expirationDate ? (
            <RelativeTime value={passport.expirationDate} type="all" locale={locale} />
          ) : (
            '-'
          ),
        },
      ],
    },
    {
      title: t('blocklet.overview.source'),
      items: [
        {
          label: t('blocklet.overview.source'),
          content: renderSource(passport.source),
        },
      ],
    },
  ];

  return (
    <StyledDiv gap={3}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: isMobile ? 'center' : 'flex-start',
          width: '100%',
          overflow: 'hidden',
          gap: isMobile ? 2 : 4,
        }}>
        <Box
          sx={{ display: 'flex', width: '180px' }}
          className="passport-image"
          dangerouslySetInnerHTML={{
            __html: createPassportSvg({
              scope: passport.scope,
              role: passport.role,
              title: passport.scope === 'kyc' ? passport.name : passport.title,
              issuer: passport.issuer && passport.issuer.name,
              issuerDid: passport.issuer && passport.issuer.id,
              ownerName: passport.user?.fullName,
              ownerDid: passport.user?.did,
              ownerAvatarUrl: passport.user?.avatar ? parseAvatar(passport.user?.avatar, teamDid, inService) : '',
              revoked: passport.revoked,
              extra: passport?.expirationDate
                ? {
                    key: 'Exp',
                    value: dayjs(passport.expirationDate).format('YYYY-MM-DD HH:mm:ss'),
                  }
                : null,
            }),
          }}
        />

        <Box className="info-area">
          {baseInfo.map((group) => (
            <Box key={group.title}>
              {group.title && (
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {group.title}
                </Typography>
              )}
              <Box className="info-grid" sx={{ gap: '12px !important' }}>
                {group.items.map((item) => (
                  <Box key={item.label} className="info-item">
                    <Box className="info-label" sx={{ maxWidth: 40 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        {item.label}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minWidth: 0 }}>{item.content}</Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Divider />

      <Box className="info-area">
        {infoGroups.map((group) => (
          <Box key={group.title}>
            <Typography variant="h5" sx={{ mb: 1.5 }}>
              {group.title}
            </Typography>
            <Box className="info-grid">
              {group.items.map((item) => (
                <Box key={item.label} className="info-item">
                  <Box className="info-label">
                    <Typography variant="subtitle2" color="textSecondary">
                      {item.label}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 500 }}>{item.content}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </StyledDiv>
  );
}

BaseInfo.propTypes = {
  passport: PropTypes.object.isRequired,
  createPassportSvg: PropTypes.func.isRequired,
};

const StyledDiv = styled(Stack)`
  .info-card {
    margin-bottom: 24px;
    overflow: hidden;
  }

  .card-content {
    display: flex;
    gap: 32px;
    padding: 24px;
  }

  .passport-image {
    flex-shrink: 0;
    transition: transform 0.2s ease-in-out;
    cursor: pointer;

    &:hover {
      transform: scale(1.05);
    }
  }

  .info-area {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: auto;
  }

  .info-header {
    padding-bottom: 16px;
    border-bottom: 1px solid;
    border-color: ${({ theme }) => theme.palette.divider};
  }

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .info-item {
    display: flex;
    gap: 8px;
  }

  .info-label {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100px;
  }

  .logs-card {
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 24px;
      border-bottom: 1px solid;
      border-color: ${({ theme }) => theme.palette.divider};
    }

    .MuiTimeline-root {
      padding: 24px;
    }

    .MuiTimelineContent-root {
      padding: 0px 16px;
    }

    .MuiTimelineDot-root {
      margin: 0;
    }
  }
`;

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

function Logs({ passport }) {
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();
  const { t, locale } = useLocaleContext();

  const [search, setSearch] = useState({
    pageSize: DEFAULT_PAGE_SIZE,
    page: DEFAULT_PAGE,
  });

  const { data: logsData, loading } = useRequest(
    async () => {
      const input = {
        teamDid,
        query: { passportId: passport.id },
        paging: { page: search.page, pageSize: search.pageSize },
      };

      const response = await api.getPassportLogs({ input });
      return {
        logs: response.passportLogs || [],
        total: response.paging.total,
      };
    },
    {
      refreshDeps: [search.page, search.pageSize],
      onError: (err) => Toast.error(err.message),
    }
  );

  const logs = useMemo(() => logsData?.logs || [], [logsData?.logs]);

  const getTooltipContent = (log) => {
    if (log.action === PASSPORT_LOG_ACTION.APPROVE || log.action === PASSPORT_LOG_ACTION.REVOKE) {
      return log?.metadata?.operator?.fullName ? `${t('common.operator')}: ${log?.metadata?.operator?.fullName}` : null;
    }
    if (log.action === PASSPORT_LOG_ACTION.ISSUE && log.metadata?.action === PASSPORT_ISSUE_ACTION.ISSUE_ON_INVITE) {
      return log?.metadata?.inviter?.fullName ? `${t('common.inviter')}: ${log?.metadata?.inviter?.fullName}` : null;
    }
    return `passportId: ${log.passportId}`;
  };

  const columns = useMemo(
    () => [
      {
        label: t('common.action'),
        name: 'action',
        options: {
          customBodyRender: (action, { rowIndex }) => {
            const log = logs[rowIndex];

            return (
              <Tooltip title={getTooltipContent(log)}>
                {`${action} ${log.metadata?.action ? `(${log.metadata.action})` : ''}`}
              </Tooltip>
            );
          },
        },
      },
      {
        label: 'IP',
        name: 'operatorIp',
        options: {
          customBodyRender: (ip) => {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{ip || '-'}</span>
              </Box>
            );
          },
        },
      },
      {
        label: 'UA',
        width: 250,
        name: 'operatorUa',
        options: {
          customBodyRender: (ip, { rowIndex }) => {
            const log = logs[rowIndex];
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {log.operatorUa && <Box>{renderUserAgent(log.operatorUa)}</Box>}
                {log.operatorUa && (
                  <Tooltip title={log.operatorUa}>
                    <InfoIcon fontSize="small" color="action" sx={{ fontSize: 16, cursor: 'pointer' }} />
                  </Tooltip>
                )}
              </Box>
            );
          },
        },
      },
      {
        label: t('common.createdAt'),
        name: 'createdAt',
        options: {
          customBodyRender: (timestamp) => formatToDatetime(timestamp, locale),
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale, logs]
  );

  const onTableChange = ({ page, rowsPerPage }) => {
    if (search.pageSize !== rowsPerPage) {
      setSearch((x) => ({ ...x, pageSize: rowsPerPage, page: 1 }));
    } else if (search.page !== page + 1) {
      setSearch((x) => ({ ...x, page: page + 1 }));
    }
  };

  const tableOptions = {
    sort: false,
    download: false,
    filter: false,
    print: false,
    viewColumns: false,
    search: false,
    page: search.page - 1,
    rowsPerPage: search.pageSize,
    count: logsData?.total || 0,
  };

  if (loading) {
    return (
      <Box
        sx={{
          py: 2,
        }}>
        <Stack direction="row" spacing={1} sx={{ position: 'relative', pb: 2 }}>
          <CircularProgress />
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Datatable
        className="logs-table"
        verticalKeyWidth={100}
        locale={locale}
        data={logs}
        columns={columns}
        options={tableOptions}
        loading={loading}
        onChange={onTableChange}
      />
    </Box>
  );
}

Logs.propTypes = {
  passport: PropTypes.object.isRequired,
};

function Related({ passport, onSwitchPassport }) {
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();
  const { t, locale } = useLocaleContext();

  const [search, setSearch] = useState({
    pageSize: DEFAULT_PAGE_SIZE,
    page: DEFAULT_PAGE,
  });

  const { data: passportData, loading } = useRequest(
    async () => {
      const input = {
        teamDid,
        passportId: passport.parentDid,
        paging: { page: search.page, pageSize: search.pageSize },
      };

      const response = await api.getRelatedPassports({ input });
      return {
        passports: response.passports || [],
        total: response.paging.total,
      };
    },
    {
      refreshDeps: [search.page, search.pageSize],
      onError: (err) => Toast.error(err.message),
    }
  );

  const passports = useMemo(() => passportData?.passports || [], [passportData?.passports]);

  const columns = useMemo(
    () => [
      {
        label: t('team.passport.role'),
        name: 'role',
        options: {
          customBodyRender: renderRole,
        },
      },
      {
        label: t('team.passport.owner'),
        name: 'user',
        options: {
          customBodyRender: renderUser,
        },
      },
      {
        label: t('team.passport.status'),
        name: 'status',
        options: {
          customBodyRender: renderStatus,
        },
      },
      {
        label: t('team.member.lastLogin'),
        name: 'lastLoginAt',
        options: {
          customBodyRender: (timestamp) => renderTime(timestamp, locale),
        },
      },
      {
        label: t('blocklet.overview.source'),
        name: 'source',
        options: {
          customBodyRender: renderSource,
        },
      },
    ],
    [t, locale]
  );

  const onTableChange = ({ page, rowsPerPage }) => {
    if (search.pageSize !== rowsPerPage) {
      setSearch((x) => ({ ...x, pageSize: rowsPerPage, page: 1 }));
    } else if (search.page !== page + 1) {
      setSearch((x) => ({ ...x, page: page + 1 }));
    }
  };
  const datatableRef = useRef(null);

  const tableOptions = {
    sort: false,
    download: false,
    filter: false,
    print: false,
    viewColumns: false,
    search: false,
    page: search.page - 1,
    rowsPerPage: search.pageSize,
    count: passportData?.total || 0,
    onRowClick(row, { dataIndex }, e) {
      if (datatableRef.current?.contains(e.target)) {
        const x = passports[dataIndex];
        onSwitchPassport(x);
      }
    },
  };

  if (loading) {
    return (
      <Box
        sx={{
          py: 2,
        }}>
        <Stack direction="row" spacing={1} sx={{ position: 'relative', pb: 2 }}>
          <CircularProgress />
        </Stack>
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      <Alert severity="warning">{t('team.passport.relatedDescription')}</Alert>
      <Box ref={datatableRef} sx={{ '.MuiTableRow-root': { cursor: 'pointer' } }}>
        <Datatable
          className="related-table"
          verticalKeyWidth={100}
          locale={locale}
          data={passports.filter((x) => x.id !== passport.id)}
          columns={columns}
          options={tableOptions}
          loading={loading}
          onChange={onTableChange}
        />
      </Box>
    </Stack>
  );
}

Related.propTypes = {
  passport: PropTypes.object.isRequired,
  onSwitchPassport: PropTypes.func.isRequired,
};
