/* eslint-disable react/no-unstable-nested-components */
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import isEmpty from 'lodash/isEmpty';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useLocalStorage from 'react-use/lib/useLocalStorage';

import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import ErrorOutline from '@mui/icons-material/ErrorOutline';

import Datatable, { getDurableData } from '@arcblock/ux/lib/Datatable';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import Spinner from '@mui/material/CircularProgress';
import Center from '@arcblock/ux/lib/Center';
import Empty from '@arcblock/ux/lib/Empty';
import Alert from '@mui/material/Alert';
import Button from '@arcblock/ux/lib/Button';
import { useMemoizedFn } from 'ahooks';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import Toast from '@arcblock/ux/lib/Toast';
import BlockletStatus from '@abtnode/ux/lib/blocklet/status';
import { useDeletingBlockletContext, DeletingBlockletProvider } from '@abtnode/ux/lib/contexts/deleting-blocklets';
import Tag from '@abtnode/ux/lib/tag';
import BlockletMode from '@abtnode/ux/lib/blocklet/mode';
import BlockletAppAvatar from '@abtnode/ux/lib/blocklet/app-avatar';
import { getAppMissingConfigs, getDisplayName, isBlockletRunning } from '@blocklet/meta/lib/util';
import { Tooltip, useTheme } from '@mui/material';

import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import { useNodeContext } from '../../contexts/node';
import { useBlockletsContext } from '../../contexts/blocklets';
import { formatError } from '../../libs/util';
import BlockletActions from '../../components/blocklet/actions';
import BlockletInterface from '../../components/blocklet/interface';
import BlockletAdd from '../../components/blocklet/add';
import Permission from '../../components/permission';
import BlockletUrl from '../../components/blocklet/blocklet-url';

const INTERNAL = 'internal';
const EXTERNAL = 'external';

export default function BlockletListWrap() {
  return (
    <DeletingBlockletProvider>
      <BlockletList />
    </DeletingBlockletProvider>
  );
}

export function BlockletList() {
  const navigate = useNavigate();
  const node = useNodeContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: internalData, externalData, error, refresh, loading } = useBlockletsContext();
  const { deletingBlocklets, addDeletingDid, removeDeletingDid, matchDeletingDid } = useDeletingBlockletContext();
  const { t, locale } = useLocaleContext();
  const uiTheme = useTheme();

  // Get durable data for initial values
  const durableKey = 'blocklets-list';
  const tableDurableData = getDurableData(durableKey);

  // Consolidated search state (following members pattern)
  const [search, setSearch] = useState({
    searchText: searchParams.get('searchText') || tableDurableData.searchText || '',
    pageSize: tableDurableData.rowsPerPage || 10,
    page: 1,
    sortField: tableDurableData.sortOrder?.name || 'updatedAt',
    sortDirection: tableDurableData.sortOrder?.direction || 'desc',
  });
  const [rowCount, setRowCount] = useState(0);

  const tabs = [
    {
      id: INTERNAL,
      name: t('blocklet.internal'),
    },
    {
      id: EXTERNAL,
      name: t('blocklet.external'),
    },
  ];
  const [tab, setTab] = useLocalStorage('blocklet-type-filter', INTERNAL); // internal, external

  const blocklets = useMemo(() => {
    return tab === INTERNAL ? internalData : externalData;
  }, [tab, internalData, externalData]);

  // Track if initial fetch has been done
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // Trigger server-side fetch when search params change
  // Dual fetch pattern: first without runtime info (fast), then with runtime info
  useEffect(() => {
    const fetchBlocklets = async () => {
      const pagingParams = {
        paging: { page: search.page, pageSize: search.pageSize },
        search: search.searchText,
        external: tab === EXTERNAL,
        sort: { field: search.sortField, direction: search.sortDirection },
      };

      // First fetch: without runtime info (fast)
      const result = await refresh({
        silent: initialFetchDone,
        includeRuntimeInfo: false,
        ...pagingParams,
      });
      if (result?.paging) {
        setRowCount(result.paging.total || 0);
      }
      if (!initialFetchDone) {
        setInitialFetchDone(true);
      }

      // Second fetch: with runtime info (for display)
      await refresh({
        silent: true,
        includeRuntimeInfo: true,
        ...pagingParams,
      });
    };
    fetchBlocklets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [`${search.page}-${search.pageSize}-${search.searchText}-${search.sortField}-${search.sortDirection}-${tab}`]);

  // Handle table changes (pagination, search, sort)
  const onTableChange = useCallback(
    ({ page, rowsPerPage, searchText, sortOrder }) => {
      if (search.pageSize !== rowsPerPage) {
        setSearch(x => ({ ...x, pageSize: rowsPerPage, page: 1 }));
      } else if (search.page !== page + 1) {
        setSearch(x => ({ ...x, page: page + 1 }));
      } else if (search.searchText !== searchText) {
        setSearch(x => ({ ...x, searchText: searchText || '', page: 1 }));
        setSearchParams({ searchText: searchText || '' });
      } else if (sortOrder?.name && sortOrder?.direction) {
        // Handle sort change - reset to page 1 when sort changes
        if (search.sortField !== sortOrder.name || search.sortDirection !== sortOrder.direction) {
          setSearch(x => ({ ...x, sortField: sortOrder.name, sortDirection: sortOrder.direction, page: 1 }));
        }
      }
    },
    [search.pageSize, search.page, search.searchText, search.sortField, search.sortDirection, setSearchParams]
  );

  // const parseUrlToOverview = url => joinUrlKeepSearch(url, `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/overview`);

  matchDeletingDid(blocklets.map(e => e.meta.did));

  const onActionStart = useCallback(
    ({ action, blocklet }) => {
      if (action === 'remove') {
        addDeletingDid(blocklet.meta.did);
      }
    },
    [addDeletingDid]
  );

  const onActionComplete = useCallback(
    data => {
      if (data.error) {
        Toast.error(data.error.message);

        if (data.action === 'remove') {
          removeDeletingDid(data.blocklet.meta.did);
        }
        return;
      }
      if (data.action === 'remove') {
        node.refresh({ silent: true });
      }
    },
    [node, removeDeletingDid]
  );

  const isBreakpointsUpMd = useMediaQuery(theme => theme.breakpoints.up('md'));

  let content = null;

  const items = useMemo(() => {
    const dateFields = ['installedAt', 'startedAt', 'stoppedAt', 'createdAt'];
    return (blocklets || []).map(x => {
      dateFields.forEach(f => {
        if (x[f]) {
          const date = new Date(x[f]);
          x[f] = date;
        }
      });
      return x;
    });
  }, [blocklets]);

  // Server-side search handles filtering, just use items directly
  const rows = items;

  // 使用 useMemoizedFn 保持 TableBody 组件引用稳定，避免在 deletingBlocklets 变化时导致组件卸载
  const MobileTableBody = useMemoizedFn(e => {
    if (loading) {
      return (
        <Center relative="parent">
          <Spinner />
        </Center>
      );
    }
    const { page: pageIndex, rowsPerPage } = e;

    const list = rows.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage);

    if (!list.length) {
      return <Empty>{t('common.empty')}</Empty>;
    }

    return (
      <div>
        {list.map(d => {
          return (
            <BlockletUrl key={d.meta.did} blocklet={d}>
              {url => (
                <Box
                  className="blocklet-item--mobile"
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <BlockletAppAvatar className="blocklet__avatar" blocklet={d} size={isBreakpointsUpMd ? 40 : 60} />
                  <Link
                    className="blocklet__content"
                    to={url}
                    onClick={event => {
                      event.stopPropagation();
                      if (!url) {
                        event.preventDefault();
                        Toast.warning(t('blocklet.router.noAccessibleUrl'));
                      }
                    }}
                    target="_blank">
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        '& button': {
                          width: 24,
                          height: 24,
                        },
                      }}>
                      <Typography component="strong" variant="body1" className="blocklet__name">
                        {getDisplayName(d, true)}
                      </Typography>
                      <BlockletActions
                        key={d.meta.did}
                        blocklet={d}
                        variant="menu"
                        onStart={onActionStart}
                        onComplete={onActionComplete}
                      />
                    </Box>
                    <Typography
                      component="small"
                      className="blocklet__addons"
                      sx={{ display: 'flex', alignItems: 'flex-end' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                        }}>
                        <BlockletInterface blocklet={d} style={{ fontSize: 14 }} />
                      </Box>
                      <BlockletStatus
                        status-blocklet-did={d.meta.did}
                        key={d.meta.did}
                        status={d.status}
                        source={d.source}
                        progress={d.progress}
                      />
                    </Typography>
                  </Link>
                </Box>
              )}
            </BlockletUrl>
          );
        })}
      </div>
    );
  });

  const [columns, setColumns] = useState([]);

  const setColumnsFun = useCallback(() => {
    const statusFilterValues = Array.from(new Set(rows.map(row => row.status)));
    const _columns = [
      {
        label: t('common.name'),
        name: 'meta.title',
        options: {
          filter: false,
          sort: false,
          customBodyRenderLite(rawIndex) {
            const d = rows[rawIndex];
            if (!d) return null;
            const detailTab = getAppMissingConfigs(d).length > 0 ? 'components' : 'overview';
            return (
              <Link key={d.meta.did} to={`/blocklets/${d.meta.did}/${detailTab}`} className="blocklet-name-wrapper">
                <Typography component="strong" variant="body1" className="blocklet-name">
                  <BlockletAppAvatar blocklet={d} style={{ marginRight: 8 }} />
                  <Box>
                    <Box>{getDisplayName(d)}</Box>
                    <Box>
                      <BlockletMode mode={d.mode || ''} />
                      {!isEmpty(d.controller) && <Tag type="primary">{t('blocklet.external')}</Tag>}
                    </Box>
                  </Box>
                </Typography>
              </Link>
            );
          },
        },
      },
      tab === INTERNAL
        ? {
            label: t('common.visit'),
            name: 'runtimeInfo.pid',
            align: 'left',
            options: {
              sort: false,
              filter: false,
              customBodyRenderLite(rawIndex) {
                const d = rows[rawIndex];
                if (!d) return null;
                return <BlockletInterface key={d.meta.did} blocklet={d} />;
              },
            },
          }
        : null,
      {
        label: t('common.uptime'),
        name: 'startedAt',
        options: {
          filter: false,
          sort: true,
          customBodyRenderLite(rawIndex) {
            const d = rows[rawIndex];
            if (!d) return null;
            // Only show uptime when running and has startedAt
            if (isBlockletRunning(d) && d.startedAt) {
              return <RelativeTime key={d.meta.did} value={d.startedAt.getTime()} locale={locale} />;
            }

            return '';
          },
        },
      },
      {
        label: t('common.installedAt'),
        name: 'installedAt',
        options: {
          filter: false,
          sort: true,
          customBodyRenderLite(rawIndex) {
            const d = rows[rawIndex];
            if (!d) return null;
            if (d.installedAt) {
              return <RelativeTime key={d.meta.did} value={d.installedAt.getTime()} locale={locale} />;
            }

            if (d.createdAt) {
              return <RelativeTime key={d.meta.did} value={d.createdAt.getTime()} locale={locale} />;
            }

            return '';
          },
        },
      },
      {
        label: t('common.updatedAt'),
        name: 'updatedAt',
        options: {
          filter: false,
          sort: true,
          customBodyRenderLite(rawIndex) {
            const d = rows[rawIndex];
            if (!d) return null;
            return <RelativeTime key={d.meta.did} value={d.updatedAt} locale={locale} />;
          },
        },
      },
      {
        label: t('common.status'),
        name: 'status',
        width: 150,
        align: 'center',
        options: {
          filter: true,
          sort: true,
          filterType: 'custom',
          customFilterListOptions: {
            render: v => v.map(l => <BlockletStatus key={l} data-cy="blocklet-status-filter-list" status={l} />),
            update: (filterList, filterPos, index) => {
              filterList[index].splice(filterPos, 1);
              return filterList;
            },
          },
          filterOptions: {
            names: statusFilterValues,
            logic: (location, filters) => {
              if (filters.length) return !filters.includes(location);
              return false;
            },
            display: (filterList, onChange, index, column) => {
              return (
                <FormControl>
                  <InputLabel htmlFor="select-multiple-chip" sx={{ background: uiTheme.palette.background.default }}>
                    {t('common.status')}
                  </InputLabel>
                  <Select
                    multiple
                    value={filterList[index]}
                    renderValue={selected =>
                      selected.map(v => <BlockletStatus key={v} data-cy="blocklet-status-filter-display" status={v} />)
                    }
                    onChange={event => {
                      filterList[index] = event.target.value;
                      onChange(filterList[index], index, column);
                    }}
                    sx={{
                      minWidth: 120,
                    }}>
                    {statusFilterValues.map(v => (
                      <MenuItem key={v} value={v}>
                        <Checkbox color="primary" checked={filterList[index].indexOf(v) > -1} />
                        <BlockletStatus data-cy="blocklet-status-filter" status={v} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            },
            fullWidth: true,
          },
          customBodyRenderLite(rawIndex) {
            const d = rows[rawIndex];
            if (!d) return null;
            const warningStatuses = ['error', 'waiting', 'starting'];
            const warningChildren = d.children.filter(
              c => warningStatuses.includes(c.status) || warningStatuses.includes(c.greenStatus)
            );
            return (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BlockletStatus
                  data-cy="blocklet-status"
                  status-blocklet-did={d.meta.did}
                  key={d.meta.did}
                  status={deletingBlocklets.includes(d.meta.did) ? 'deleting' : d.status}
                  source={d.source}
                  progress={d.progress}
                />
                {warningChildren.length > 0 && (
                  <Tooltip
                    title={t('blocklet.status.hasSomeErrors', {
                      blocklets: warningChildren.map(c => c.meta.title).join(', '),
                    })}>
                    <Box
                      sx={{
                        display: 'flex',
                        color: 'warning.main',
                        ml: 1,
                      }}>
                      <ErrorOutline />
                    </Box>
                  </Tooltip>
                )}
              </Box>
            );
          },
        },
      },
      {
        label: t('common.actions'),
        name: '',
        width: 90,
        options: {
          sort: false,
          filter: false,
          customBodyRenderLite(rawIndex) {
            const d = rows[rawIndex];
            if (!d) return null;
            return (
              <BlockletActions
                key={d.meta.did}
                blocklet={d}
                variant="menu"
                onStart={onActionStart}
                onComplete={onActionComplete}
              />
            );
          },
        },
      },
    ].filter(Boolean);
    setColumns(_columns);
  }, [deletingBlocklets, locale, onActionComplete, onActionStart, rows, t, tab, uiTheme]);

  useEffect(() => {
    setColumnsFun();
  }, [setColumnsFun]);

  useEffect(() => {
    const urlSearchText = searchParams.get('searchText');
    if (urlSearchText && urlSearchText !== search.searchText) {
      setSearch(x => ({ ...x, searchText: urlSearchText, page: 1 }));
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    content = (
      <Alert severity="error">
        <div>
          {/* message */}
          {formatError(error)}
          {/* retry */}
          <Button onClick={() => refresh({ silent: false })}>
            <span style={{ color: '#44cdc6', textDecoration: 'underline' }}>{t('common.retry')}</span>
          </Button>
        </div>
      </Alert>
    );
  } else if (items.length > 0 || loading || search.searchText) {
    const tableComponents = {};

    if (!isBreakpointsUpMd) {
      tableComponents.TableBody = MobileTableBody;
    }

    /* eslint-enable indent */
    content = (
      <MobileList>
        <Datatable
          loading={loading}
          className="blocklet-list"
          title={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}>
              {t('blocklet.index.tableTitle')}
            </Box>
          }
          locale={locale}
          data={rows}
          columns={columns}
          durable={durableKey}
          options={{
            download: false,
            print: false,
            searchPlaceholder: t('common.search'),
            searchAlwaysOpen: false,
            sortOrder: {
              name: search.sortField,
              direction: search.sortDirection,
            },
            filterType: 'checkbox',
            page: search.page - 1,
            rowsPerPage: search.pageSize,
            rowsPerPageOptions: [10, 25, 50, 100],
            count: rowCount,
            searchDebounceTime: 600,
            searchText: search.searchText,
          }}
          onChange={onTableChange}
          components={tableComponents}
        />
      </MobileList>
    );
  } else if (items.length === 0) {
    content = <Alert severity="warning">{t('blocklet.index.noBlocklet')}</Alert>;
  }

  const hasExternal = externalData && externalData.length > 0;

  return (
    <Main>
      <Typography component="h2" variant="h4" className="page-header" color="textPrimary">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}>
          {t('common.blocklets')}
          {(hasExternal || tab === EXTERNAL) && (
            <FormControl sx={{ ml: 1 }}>
              <Select value={tab} onChange={e => setTab(e.target.value)} size="small">
                {tabs.map(x => (
                  <MenuItem key={x.id} value={x.id}>
                    {t(x.name)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
        <Permission permission="mutate_blocklets">
          <BlockletAdd
            onCreate={result => {
              navigate(`/blocklets/${result.appDid}/components`);
            }}
          />
        </Permission>
      </Typography>
      {content}
    </Main>
  );
}

const MobileList = styled.div`
  .blocklet-item--mobile {
    padding: 16px 0;
  }
`;

const Main = styled.main`
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .blocklet-list {
    .blocklet-item--mobile {
      .blocklet__avatar {
        margin-right: -60px;
      }
      .blocklet__content {
        padding-left: 68px;
        flex: 1;
        display: flex;
        flex-direction: column;
        z-index: 1;
      }
      .blocklet__name {
        font-weight: bold;
        text-decoration: none;
        white-space: normal;
        word-break: break-all;
      }
      .blocklet__addons {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
      }
    }
    .blocklet-name-wrapper {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
    }
    .blocklet-name {
      font-weight: bold;
      text-decoration: underline;
      display: flex;
      align-items: center;
      white-space: normal;
      word-break: break-all;
    }

    .blocklet-interface {
      display: flex;
      align-items: center;
      justify-content: flex-start;

      img {
        margin-right: 4px;
      }
    }

    .MuiToolbar-root {
      display: flex;
    }
  }
`;
