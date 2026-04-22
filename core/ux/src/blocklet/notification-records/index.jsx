/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable jsx-a11y/aria-role */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import styled from '@emotion/styled';
import isEqual from 'lodash/isEqual';
import Datatable, { getDurableData } from '@arcblock/ux/lib/Datatable';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { ThemeProvider, useTheme } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { deepmerge } from '@arcblock/ux/lib/Theme';
import dayjs from '@abtnode/util/lib/dayjs';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useCreation } from 'ahooks';
import PropTypes from 'prop-types';
import Avatar from '@arcblock/did-connect-react/lib/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import { NotificationRecordsProvider, useNotificationRecordsContext } from '../../contexts/notification-records';
import ShortenLabel from '../component/shorten-label';
import Notification from './notification';
import DatePicker from './date-picker';
import RelativeTime from '../../relative-time';
import BlockletBundleAvatar from '../bundle-avatar';
import BlockletAppAvatar from '../app-avatar';
import { filterUpdate, filterLogic, severities, getMuiThemeOpts } from './utils';
import Blocklet from './blocklet';
import NotificationSeverity from './severity';
import SeverityFilterRender from './table/severity-filter-render';
import CustomFilterList from './table/filter-list';
import FilterChip from './table/filter-chip';
import SeverityFilter from './table/severity-filter';
import { parseAvatar } from '../../team/members/util';
import NotificationStatistics from './statistics';

// eslint-disable-next-line react/prop-types
function NotificationRecords({ customTableButtons }) {
  const { t, locale } = useLocaleContext();
  const parentTheme = useTheme();
  const isBreakpointsDownSm = useMediaQuery(parentTheme.breakpoints.down('sm'));
  const mergedTheme = useMemo(() => deepmerge(parentTheme, getMuiThemeOpts()), [parentTheme]);
  const [loading, setLoading] = useState(false);
  const { data, paging, blocklet, fetch, getComponent, componentDids, inService, teamDid } =
    useNotificationRecordsContext();
  const datatableRef = useRef(null);
  const [notificationDialog, setNotificationDialog] = useState(null);
  const [openTab, setOpenTab] = useState('info');

  const durableKey = `notification-records-${blocklet.meta?.did}`;
  const tableDurableData = getDurableData(durableKey);

  const [search, setSearch] = useState({
    pageSize: tableDurableData.rowsPerPage || 10,
    page: tableDurableData.page ? tableDurableData.page + 1 : 1,
    dids: tableDurableData.dids || [],
    dateRange: tableDurableData.dateRange || [
      dayjs().subtract(1, 'month').startOf('day').toDate(),
      dayjs().endOf('day').toDate(),
    ],
  });

  const components = useCreation(() => {
    if (!blocklet.children || !blocklet.children.length) {
      return [];
    }
    const result = [];
    blocklet.children.forEach((x) => {
      const did = x.did || x.meta?.did;
      if (componentDids.includes(did)) {
        x.ancestors = [blocklet];
        result.push(x);
      }
    });
    return result;
  }, [componentDids, blocklet]);

  const handleFetch = async (params) => {
    try {
      setLoading(true);
      await fetch(params);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const updatedNotification = data.find((x) => x.id === notificationDialog?.id);
    if (notificationDialog && updatedNotification) {
      setNotificationDialog({ ...updatedNotification });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const onDeleteFilterItem = (event, item, filterList, field) => {
    event.stopPropagation();
    const newFilterList = filterList.filter((x) => x !== item);
    setSearch((x) => ({ ...x, [field]: newFilterList, page: 1 }));
  };

  const onTableChange = ({ page, rowsPerPage, filterList }) => {
    const [dids = [], , , , severity = []] = filterList;
    if (search.pageSize !== rowsPerPage) {
      setSearch((x) => ({ ...x, pageSize: rowsPerPage, page: 1 }));
    } else if (search.page !== page + 1) {
      setSearch((x) => ({ ...x, page: page + 1 }));
    } else if (!isEqual(search.dids, dids)) {
      setSearch((x) => ({ ...x, dids, page: 1 }));
    } else if (!isEqual(search.severities, severity)) {
      setSearch((x) => ({ ...x, severities: severity, page: 1 }));
    }
  };

  const onCloseDialog = useCallback(() => {
    setNotificationDialog(null);
    setOpenTab('info');
  }, []);

  const onRefresh = useCallback(() => {
    fetch(search);
  }, [fetch, search]);

  const columns = [
    {
      label: t('notification.from'),
      name: 'sender',
      width: 400,
      options: {
        filter: true,
        filterType: 'custom',
        customFilterListOptions: {
          render: (selected) => {
            return selected.map((v, index) => {
              if (v === 'system') {
                // eslint-disable-next-line react/no-array-index-key
                return <span key={`system-${index}`}>{t('notification.system')}</span>;
              }
              const component = components.find((x) => {
                const did = x.did || x.meta?.did;
                return did === v;
              });
              return <Blocklet key={v} blocklet={component} label={component?.title || component?.meta?.title} />;
            });
          },
          update: (filterList, filterPos, index) => {
            filterList[index].splice(filterPos, 1);
            return filterList;
          },
        },
        filterOptions: {
          names: components,
          logic: (location, filters) => {
            if (filters.length) return !filters.includes(location);
            return false;
          },
          display: (filterList, onChange, index, column) => {
            return (
              <FormControl style={{ width: '380px' }}>
                <InputLabel id="demo-simple-select-label" style={{ background: '#ffffff' }}>
                  Sender
                </InputLabel>
                <Select
                  multiple
                  value={filterList[index]}
                  renderValue={(selected) => {
                    return (
                      <Box
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        sx={{
                          display: 'flex',
                          gap: 1,
                          alignItems: 'center',
                        }}>
                        {selected.map((v) => {
                          if (v === 'system') {
                            return <span key={v}>{t('notification.system')}</span>;
                          }
                          const component = components.find((x) => {
                            const did = x.did || x.meta?.did;
                            return did === v;
                          });
                          return (
                            <Blocklet key={v} blocklet={component} label={component?.title || component?.meta?.title} />
                          );
                        })}
                      </Box>
                    );
                  }}
                  onChange={(event) => {
                    filterList[index] = event.target.value;
                    onChange(filterList[index], index, column);
                  }}>
                  <MenuItem value="system">{t('notification.system')}</MenuItem>
                  {components.map((x) => {
                    const did = x.did || x.meta?.did;
                    return (
                      <MenuItem key={did} value={did}>
                        <Blocklet blocklet={x} label={x.title || x.meta?.title} />
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            );
          },
        },
        customBodyRenderLite: (rawIndex) => {
          const notification = data[rawIndex];
          const component = getComponent(notification.componentDid);
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
              {!component ? (
                <BlockletAppAvatar blocklet={blocklet} size={32} />
              ) : (
                <BlockletBundleAvatar size={32} blocklet={component} ancestors={component.ancestors ?? []} />
              )}
              <ShortenLabel maxLength={50}>{component?.meta?.title || blocklet?.meta?.title}</ShortenLabel>
            </Box>
          );
        },
      },
    },
    {
      label: t('notification.receiver'),
      name: 'receivers',
      width: 300,
      options: {
        filter: false,
        customBodyRenderLite: (rawIndex) => {
          const notification = data[rawIndex];
          const { receivers } = notification;
          return (
            <AvatarGroup
              total={receivers.length}
              renderSurplus={(surplus) => {
                if (surplus < 100) {
                  return <span>+{surplus}</span>;
                }
                return <span>99+</span>;
              }}
              max={3}
              sx={{
                justifyContent: 'flex-end',
                height: '32px',
                '.MuiAvatar-root': {
                  width: '32px',
                  height: '32px',
                  fontSize: '12px',
                  border: 0,
                  zIndex: 2,
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                setNotificationDialog(notification);
                setOpenTab('receivers');
              }}>
              {receivers.map((receiver) => {
                const { receiverUser } = receiver;
                // 用户可能被删除了，所以没找到
                if (!receiverUser) {
                  return null;
                }
                const avatar = parseAvatar(receiverUser.avatar, teamDid, inService);
                return (
                  <Avatar
                    alt={receiverUser.fullName}
                    src={`${avatar}?imageFilter=resize&w=48&h=48`}
                    size={32}
                    key={receiver.receiver}
                    did={receiver.receiver}
                    shape="circle"
                    style={{ borderRadius: '100%', overflow: 'hidden' }}
                  />
                );
              })}
            </AvatarGroup>
          );
        },
      },
    },
    {
      label: t('notification.statistics'),
      name: 'statistics',
      width: 400,
      options: {
        filter: false,
        customBodyRenderLite: (rawIndex) => {
          const notification = data[rawIndex];
          return (
            <Box
              onClick={(e) => {
                e.stopPropagation();
                setNotificationDialog(notification);
                setOpenTab('statistics');
              }}>
              <NotificationStatistics statistics={notification.statistics} />
            </Box>
          );
        },
      },
    },
    {
      label: t('notification.notificationPreview'),
      name: 'data',
      options: {
        filter: false,
        customBodyRenderLite: (rawIndex) => {
          const notification = data[rawIndex];
          return <ShortenLabel maxLength={50}>{notification.title}</ShortenLabel>;
        },
      },
    },
    {
      label: t('notification.severity'),
      name: 'severity',
      width: 200,
      options: {
        setCellProps: () => ({ className: 'severity-cell' }),
        customBodyRenderLite: (rawIndex) => {
          const notification = data[rawIndex];
          return <NotificationSeverity severity={notification.severity} />;
        },
        filter: true,
        filterType: 'custom',
        filterList: search.severities ?? [],
        customFilterListOptions: {
          render: (v) => (
            <SeverityFilterRender
              list={v}
              label={t('notification.severity')}
              onDelete={(event, item) => {
                event.stopPropagation();
                onDeleteFilterItem(event, item, columns[4].options.filterList, 'severities');
              }}
            />
          ),
          update: filterUpdate,
        },
        filterOptions: {
          names: severities,
          fullWidth: true,
          logic: filterLogic,
          display: (filterList, onChange, index, column) => {
            return (
              <SeverityFilter
                label={t('notification.severity')}
                filterList={filterList}
                onChange={onChange}
                index={index}
                column={column}
                filterValues={severities}
              />
            );
          },
        },
      },
    },
    {
      label: t('common.createdAt'),
      name: 'createdAt',
      width: 300,
      options: {
        filter: false,
        customBodyRenderLite: (rawIndex) => {
          const { createdAt } = data[rawIndex];
          return <RelativeTime value={createdAt} locale={locale} shouldUpdate />;
        },
      },
    },
  ];

  const onDateRangeChange = (value) => {
    setSearch((x) => ({ ...x, dateRange: value, page: 1 }));
  };

  const customButtons = [...(customTableButtons || [])];

  return (
    <Box
      ref={datatableRef}
      sx={{
        overflow: 'auto',
        '.MuiTableCell-head': {
          whiteSpace: 'nowrap',
          fontWeight: 'bold',
        },
        '.MuiTableCell-root': {
          paddingRight: '8px',
          whiteSpace: 'nowrap',
        },
      }}>
      <Div isBreakpointsDownSm={isBreakpointsDownSm}>
        <ThemeProvider theme={mergedTheme}>
          <Datatable
            className="main-table"
            verticalKeyWidth={100}
            loading={loading}
            locale={locale}
            columns={columns}
            data={data}
            durable={durableKey}
            onChange={onTableChange}
            options={{
              sort: false,
              download: false,
              print: false,
              search: false,
              expandableRowsOnClick: true,
              page: paging.page - 1,
              rowsPerPage: paging.pageSize,
              count: paging.total,
              ...tableDurableData,
              onRowClick: (e, { dataIndex }) => {
                setNotificationDialog(data[dataIndex]);
              },
            }}
            title={<DatePicker value={search.dateRange} onChange={onDateRangeChange} />}
            customButtons={customButtons}
            components={{
              TableFilterList: (props) => (
                <CustomFilterList
                  {...props}
                  itemComponent={(itemProps) => (
                    <FilterChip
                      {...itemProps}
                      canDelete={(item) => {
                        const column = item?.columnNames?.[item?.index || 0];
                        return column?.name === 'sender';
                      }}
                    />
                  )}
                />
              ),
            }}
          />
        </ThemeProvider>
      </Div>

      {notificationDialog && (
        <Notification
          refresh={onRefresh}
          onCancel={onCloseDialog}
          notification={notificationDialog}
          blocklet={blocklet}
          tab={openTab}
        />
      )}
    </Box>
  );
}

const Div = styled.div`
  td.MuiTableCell-footer {
    border: none !important;
  }
  .sent-status-cell {
    .resend-btn {
      display: none;
    }
    &:hover {
      .resend-btn {
        display: flex;
      }
    }
  }

  .custom-toobar-btns {
    gap: 4px;
  }
  .custom-toobar-title-inner {
    display: flex;
    justify-content: ${({ isBreakpointsDownSm }) => (isBreakpointsDownSm ? 'space-between' : 'flex-end')};
    padding-right: ${({ isBreakpointsDownSm }) => (isBreakpointsDownSm ? '0' : '8px')};
    flex-wrap: wrap;
    gap: 8px;
  }
`;

WrapperNotificationRecords.propTypes = {
  blocklet: PropTypes.object.isRequired,
  customTableButtons: PropTypes.array,
};

export default function WrapperNotificationRecords({ blocklet = {}, customTableButtons = [] }) {
  return (
    <NotificationRecordsProvider blocklet={blocklet}>
      <NotificationRecords customTableButtons={customTableButtons} />
    </NotificationRecordsProvider>
  );
}
