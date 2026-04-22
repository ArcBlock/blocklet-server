/* eslint-disable react/prop-types */
import Spinner from '@mui/material/CircularProgress';
import Empty from '@arcblock/ux/lib/Empty';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { WELLKNOWN_BLOCKLET_ADMIN_PATH, WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import TableSearch from '@arcblock/ux/lib/Datatable/TableSearch';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import TablePagination from '@mui/material/TablePagination';
import styled from '@emotion/styled';
import { get } from 'lodash';
import Tag from '@arcblock/ux/lib/Tag';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useMemo } from 'react';
import { parseAvatar } from '../team/members/util';
import { useAuditLogContext, AuditLogProvider } from '../contexts/audit-log';
import AuditLogCell from './audit-log-cell';
import { useNodeContext } from '../contexts/node';
import { useTeamContext } from '../contexts/team';

const getUserLink = ({ log, info, inService }) => {
  if (inService) {
    // TODO
    return `${WELLKNOWN_BLOCKLET_ADMIN_PATH}/members?did=${log.actor.did}`;
  }

  if (log.scope === info.did) {
    return `/team/members?did=${log.actor.did}`;
  }

  return `/blocklets/${log.scope}/members?did=${log.actor.did}`;
};

function AuditLog({ log, isLast }) {
  const { inService, info } = useNodeContext();
  const { t } = useLocaleContext();
  const { teamDid } = useTeamContext();
  const { showScope, scopeFormatter = (x) => x, blocklets } = useAuditLogContext();
  const component = useMemo(() => {
    const componentDid = log?.componentDid;
    const scope = log?.scope;
    if (!componentDid) return null;

    if (inService) {
      const blockletsInService = window.blocklet?.componentMountPoints ?? [];
      return blockletsInService.find(({ did }) => did === componentDid) || null;
    }

    const parentBlocklet = blocklets.find(({ appPid, appDid }) => [appPid, appDid].includes(scope));
    if (!parentBlocklet) return null;

    const children = parentBlocklet.children ?? [];
    const childMeta = children.find(({ meta }) => meta?.did === componentDid)?.meta || null;

    return childMeta;
  }, [blocklets, inService, log?.componentDid, log?.scope]);

  if (!log.actor.did) {
    return null;
  }

  // HACK: blocklet 类型会在存储前被强制置为 `''`，所以需要增加空字符串判断
  const isUser = !['blocklet', ''].includes(log.actor.role);
  const getTitle = () => {
    if (component) {
      const name = component.title ?? component.name ?? '';
      const scope = showScope ? ` - ${scopeFormatter(log.scope)}` : '';
      return `${name}${scope}`;
    }

    const actorName = log.actor.fullName ?? '';
    const scope = showScope ? scopeFormatter(log.scope) : '';
    if (!actorName) return scope;
    return showScope ? `${actorName} - ${scope}` : actorName;
  };

  const titleLink = showScope ? log.link : getUserLink({ log, inService, info });
  const avatarUrl = () => {
    if (component) {
      const base = inService
        ? `${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo-bundle/${log.componentDid}`
        : `/blocklet/logo-bundle/${log.scope}/${log.componentDid}`;
      return `${base}?v=${component?.version}`;
    }

    const { avatar, source } = log.actor || {};
    if (avatar) {
      return parseAvatar(avatar, teamDid, inService, source === 'server');
    }

    return '';
  };

  const renderTag = () => {
    if (component) {
      return (
        <Tooltip title={log.componentDid}>
          <Tag key="source" type="success">
            SDK
          </Tag>
        </Tooltip>
      );
    }

    return '';
  };

  return (
    <AuditLogCell
      isLast={isLast}
      isUser={isUser}
      avatarDid={log.actor.did}
      avatarUrl={avatarUrl()}
      title={getTitle() || t('common.unrecordedUser')}
      renderTag={renderTag}
      titleLink={titleLink}
      subTitle={log.actor.role ? log.actor.role : 'guest'}
      content={log.content}
      action={log.action}
      inService={inService}
      titleInfo={{
        IP: log.ip,
        OS: `${get(log, 'env.os.name', '')}${get(log, 'env.os.version', '')}`,
        Client: `${get(log, 'env.browser.name', '')}${get(log, 'env.browser.Version', '')}`,
      }}
      createdAt={log.createdAt}
    />
  );
}

function AuditLogs() {
  const { t } = useLocaleContext();
  const { palette } = useTheme();
  const {
    data,
    loading,
    paging,
    setPaging,
    filter,
    categories,
    setCategory,
    fetch,
    actionOrContent,
    setActionOrContent,
  } = useAuditLogContext();

  const theme = useTheme();
  const isBreakpointsDownSm = useMediaQuery(theme.breakpoints.down('sm'));

  const responsiveStyles = useMemo(
    () => ({
      flexDirection: isBreakpointsDownSm ? 'column' : 'row',
      alignItems: isBreakpointsDownSm ? 'flex-start' : 'center',
      justifyContent: isBreakpointsDownSm ? 'flex-start' : 'space-between',
      '& > div': isBreakpointsDownSm
        ? {
            width: '100%',
            flex: 1,
            '.toolbar-search-area': { width: '100% !important', flex: '1 !important' },
          }
        : {},
    }),
    [isBreakpointsDownSm]
  );

  const handleRowsPerPageChange = (e) => {
    const pageSize = Number(e.target.value);
    setPaging({ ...paging, pageSize });
    fetch({ page: 1, pageSize, silent: false });
  };

  const handlePageChange = (page) => {
    setPaging({ ...paging, page: page + 1 });
    fetch({ page: page + 1, pageSize: paging.pageSize, silent: false });
  };

  if (loading && data.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <Div data-cy="audit-logs">
      <Box
        className="audit-logs-toolbar"
        sx={{
          display: 'flex',
          flexDirection: isBreakpointsDownSm ? 'column' : 'row',
          gap: 2,
          alignItems: isBreakpointsDownSm ? 'flex-start' : 'center',
          justifyContent: isBreakpointsDownSm ? 'flex-start' : 'space-between',

          ...responsiveStyles,
        }}>
        <FormControl
          sx={isBreakpointsDownSm ? { width: '100%', flex: 1 } : { width: 240, flexShrink: 0 }}
          variant="outlined">
          <InputLabel>{t('common.filter')}</InputLabel>
          <Select
            size="small"
            data-cy="filter-by-category-trigger"
            value={filter.category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
            sx={{ borderRadius: 1 }}
            label={t('common.category')}
            disabled={loading}>
            {categories.map((x) => (
              <MenuItem key={x.label} value={x.value} data-cy={`filter-by-category-${x.value}`}>
                <Box>
                  <span>{x.label}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TableSearch
          options={{
            searchPlaceholder: t('common.auditLogsSearch'),
            searchDebounceTime: 600,
          }}
          search={actionOrContent}
          searchText={actionOrContent}
          searchTextUpdate={setActionOrContent}
          searchClose={() => setActionOrContent('')}
          onSearchOpen={() => {}}
        />
      </Box>
      {data.length === 0 && <Empty>{t('common.empty')}</Empty>}
      <Box sx={{ mt: 2, border: data?.length > 0 ? `1px solid ${palette.divider}` : 'none', borderRadius: 1 }}>
        {data.length > 0 && data.map((x, index) => <AuditLog key={x.id} log={x} isLast={index === data.length - 1} />)}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <TablePagination
          disabled={loading}
          page={paging.page - 1}
          count={paging.total}
          rowsPerPage={paging.pageSize}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage={t('pagination.rowsPerPage')}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} / ${count !== -1 ? count : `${t()}more than ${to}`}`
          }
          onPageChange={(_, page) => handlePageChange(page)}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Box>
    </Div>
  );
}

export default function WrappedAuditLogs({ scope, categories, showScope, scopeFormatter, blocklets }) {
  return (
    <AuditLogProvider
      scope={scope}
      categories={categories}
      showScope={showScope}
      scopeFormatter={scopeFormatter}
      blocklets={blocklets}>
      <AuditLogs />
    </AuditLogProvider>
  );
}

const Div = styled.div`
  .log-content {
    p {
      margin-bottom: 4px;
    }
    ul,
    ol {
      padding-left: 2rem;
    }
    li {
      list-style-type: disc;
    }
    code.code-highlight {
      max-height: 300px;
      overflow: auto;
    }
  }
`;
