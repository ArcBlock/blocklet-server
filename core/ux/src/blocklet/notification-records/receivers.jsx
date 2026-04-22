/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unstable-nested-components */
import { useState, useCallback, useEffect, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import Toast from '@arcblock/ux/lib/Toast';
import isEqual from 'lodash/isEqual';
import isObject from 'lodash/isObject';
import { ThemeProvider, useTheme, Box, Typography } from '@mui/material';
import Button from '@arcblock/ux/lib/Button';
import { deepmerge } from '@arcblock/ux/lib/Theme';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import styled from '@emotion/styled';
import colors from '@arcblock/ux/lib/Colors/themes/default';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Datatable from '@arcblock/ux/lib/Datatable';
import BlockIcon from '@mui/icons-material/Block';
import Avatar from '@arcblock/did-connect-react/lib/Avatar';
import dayjs from '@abtnode/util/lib/dayjs';
import Popover from '@mui/material/Popover';
import ReplayIcon from '@mui/icons-material/Replay';
import { useCreation, useReactive } from 'ahooks';
import RefreshIcon from '@mui/icons-material/Refresh';
import DidAddress from '../../did-address';
import ShortenLabel from '../component/shorten-label';
import {
  getMuiThemeOpts,
  filterUpdate,
  filterLogic,
  canResendWallet,
  canResendEmail,
  canResendPushKit,
  canResendWebhook,
  getResendCount,
  getCheckList,
  channels,
  delay,
} from './utils';
import { parseAvatar } from '../../team/members/util';
import RelativeTime from '../../relative-time';
import { useNotificationRecordsContext } from '../../contexts/notification-records';
import FilterRender from './table/send-status-filter-render';
import StatusFilter from './table/status-filter';
import SendStatus from './send-status';
import DatePicker from './date-picker';
import CustomFilterList from './table/filter-list';
import FilterChip from './table/filter-chip';
import ResendConfig from './resend-config';

Receivers.propTypes = {
  notificationId: PropTypes.string.isRequired,
  handleResend: PropTypes.func,
  resending: PropTypes.bool,
};

function Receivers({ notificationId, handleResend, resending = false }) {
  const { t, locale } = useLocaleContext();
  const parentTheme = useTheme();
  const mergedTheme = useMemo(() => deepmerge(parentTheme, getMuiThemeOpts()), [parentTheme]);
  const { getReceivers, inService, teamDid, getUser, blocklet } = useNotificationRecordsContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const resendAnchor = useReactive({
    anchorEl: null,
    position: null,
  });
  const resendConfigAnchor = useReactive({
    anchorEl: null,
    position: null,
  });
  const [resendCheckResult, setResendCheckResult] = useState(null);
  const [paging, setPaging] = useState({ total: 0, pageSize: 10, pageCount: 0, page: 1 });
  const [params, setParams] = useState({
    searchText: '',
    page: 1,
    pageSize: 10,
    walletSendStatus: [],
    pushKitSendStatus: [],
    emailSendStatus: [],
    dateRange: [dayjs().subtract(1, 'month').startOf('day').toDate(), dayjs().endOf('day').toDate()],
  });
  const [selectedRows, setSelectedRows] = useState([]);

  const statusFilterValues = [
    { label: t('notification.sendStatus.pending'), value: 0, status: 'pending' },
    { label: t('notification.sendStatus.success'), value: 1, status: 'success' },
    { label: t('notification.sendStatus.failed'), value: 2, status: 'failed' },
  ];

  const loadReceivers = async () => {
    if (loading) {
      return;
    }
    if (notificationId) {
      try {
        setLoading(true);
        const res = await getReceivers({
          notificationId,
          ...params,
        });
        const result = res.list.map((x) => {
          return {
            ...x,
            receiverUser: {
              ...x.receiverUser,
              avatar: parseAvatar(x.receiverUser.avatar, teamDid, inService),
            },
          };
        });
        setData(result);
        setPaging(res.paging);
        setLoading(false);
      } catch (error) {
        Toast.error(error.message);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadReceivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const openResendConfig = (event) => {
    event.stopPropagation();
    const target = event.currentTarget;
    resendConfigAnchor.anchorEl = target;
    const rect = target.getBoundingClientRect();
    resendConfigAnchor.position = {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
    };
  };

  const customToolbarSelect = (_selectedRows) => {
    if (!_selectedRows.data.length) {
      return null;
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px' }}>
        <Button
          className="resend-btn"
          size="small"
          color="primary"
          variant="contained"
          startIcon={<ReplayIcon />}
          sx={{ '.MuiButton-startIcon': { mr: '2px' } }}
          onClick={openResendConfig}>
          {t('notification.resend')}
        </Button>
      </div>
    );
  };

  const tableOptions = {
    sort: false,
    download: false,
    print: false,
    selectableRows: 'multiple',
    searchPlaceholder: t('common.search'),
    searchAlwaysOpen: false,
    filterType: 'checkbox',
    searchDebounceTime: 300,
    page: paging.page - 1,
    rowsPerPage: paging.pageSize,
    count: paging.total,
    searchText: params.searchText,
    tableBodyMaxHeight: 'calc(80vh - 260px)',
    rowsSelected: selectedRows,
    onRowSelectionChange: (rows, allSelectedRows) => {
      setSelectedRows(allSelectedRows.map((row) => row.dataIndex));
    },
    customToolbarSelect,
  };

  const onTableChange = ({ page, rowsPerPage, searchText, filterList }) => {
    const [, walletSendStatus = [], pushKitSendStatus = [], emailSendStatus = []] = filterList;
    if (params.pageSize !== rowsPerPage) {
      setParams((x) => ({ ...x, pageSize: rowsPerPage, page: 1 }));
    } else if (params.page !== page + 1) {
      setParams((x) => ({ ...x, page: page + 1 }));
    } else if (params.searchText !== searchText) {
      setParams((x) => ({ ...x, searchText, page: 1 }));
    } else if (!isEqual(walletSendStatus, params.walletSendStatus)) {
      setParams((x) => ({ ...x, walletSendStatus, page: 1 }));
    } else if (!isEqual(pushKitSendStatus, params.pushKitSendStatus)) {
      setParams((x) => ({ ...x, pushKitSendStatus, page: 1 }));
    } else if (!isEqual(emailSendStatus, params.emailSendStatus)) {
      setParams((x) => ({ ...x, emailSendStatus, page: 1 }));
    }
  };

  /**
   * 重发前要检测条件是否满足, 单个重发时触发
   * @param {string} channel： wallet、pushKit、email、webhook
   * 1. wallet: 检测用户是否开启了钱包通知
   * 2. pushKit: 1. 检测 blocklet 是否配置了 pushKit 推送； 2. 检测用户是否开启了推送通知；
   * 3. email: 1. 检测 blocklet 是否配置了 email 推送； 2. 检测用户是否开启了邮箱通知
   * 4. webhook: 不需要检测，因为 webhook 只需要有 URL 即可
   */
  const canResend = useCallback(
    async (channel, receiver) => {
      if (!receiver) return false;
      const user = await getUser(receiver);
      if (!user) return false;
      if (channel === 'wallet') {
        return canResendWallet(user);
      }
      if (channel === 'email') {
        return canResendEmail(blocklet, user);
      }
      if (channel === 'pushKit') {
        return canResendPushKit(blocklet, user);
      }
      if (channel === 'webhook') {
        return canResendWebhook(user);
      }
      return true;
    },
    [getUser, blocklet]
  );

  /**
   * 重发时检测列表
   */
  const checkList = useCallback(
    (channel) => {
      return getCheckList(t, channel);
    },
    [t]
  );

  const handlePopoverClose = () => {
    resendAnchor.anchorEl = null;
    resendAnchor.position = null;
    setResendCheckResult(null);
  };

  const handleResendConfigClose = () => {
    resendConfigAnchor.anchorEl = null;
    resendConfigAnchor.position = null;
  };

  const onConfirmResend = async (resendChannels, receivers, isResendFailedOnly = true, url = '') => {
    if (!receivers.length || !resendChannels.length) return;
    try {
      handleResend(resendChannels, receivers, isResendFailedOnly, url);
      if (!resendConfigAnchor.anchorEl) {
        await delay(0.5);
        handlePopoverClose();
      }
    } catch (error) {
      console.error('handleResend error', { error });
    }
  };

  const handleResendConfigConfirm = async ({ channels: resendChannels, isResendFailedOnly }) => {
    const receivers = selectedRows.map((row) => data[row].receiver);
    await onConfirmResend(resendChannels, receivers, isResendFailedOnly);
    await delay(0.5);
    handleResendConfigClose();
    setSelectedRows([]);
  };

  const resendWebhook = async (item, urls = [], isResendFailedOnly = true) => {
    try {
      await onConfirmResend(['webhook'], [item.receiver], isResendFailedOnly, urls);
    } catch (error) {
      Toast.error(error.response ? error.response.statusText : error.message);
    }
  };

  const onResend = async (event, item, channel, urls = [], isResendFailedOnly = true) => {
    event.stopPropagation();
    // 检测是否超过了重发上限
    const count = getResendCount(item, channel);
    if (count >= 4) {
      Toast.warning(t('notification.resendLimit'));
      return;
    }
    // 如果是 webhook 则不需要弹出检测
    if (!channels.includes(channel)) {
      await resendWebhook(item, urls, isResendFailedOnly);
      return;
    }
    if (event) {
      const target = event.currentTarget;
      const rect = target.getBoundingClientRect();
      resendAnchor.anchorEl = target;
      resendAnchor.position = { top: rect.top + window.scrollY, left: rect.left + window.scrollX };
    }
    setResendCheckResult({
      channel,
    });
    try {
      const result = await canResend(channel, item.receiver);
      await delay(1);
      setResendCheckResult({
        channel,
        result,
      });
      if (
        (typeof result === 'boolean' && result) ||
        (isObject(result) && Object.values(result).every((value) => !!value))
      ) {
        await handleResend([channel], [item.receiver], isResendFailedOnly);
        if (!resendConfigAnchor.anchorEl) {
          await delay(0.5);
          handlePopoverClose();
        }
      }
    } catch (error) {
      Toast.error(error.message);
    }
  };

  const onDateRangeChange = (value) => {
    setParams((x) => ({ ...x, dateRange: value, page: 1 }));
  };

  const onDeleteFilterItem = (event, item, filterList, field) => {
    event.stopPropagation();
    const newFilterList = filterList.filter((x) => x !== item);
    setParams((x) => ({ ...x, [field]: newFilterList, page: 1 }));
  };

  const columns = useCreation(() => {
    return [
      {
        label: t('notification.receiver'),
        name: 'receiver',
        width: 200,
        options: {
          filter: false,
          customBodyRenderLite: (rawIndex) => {
            const { receiverUser, receiver } = data[rawIndex];
            if (!receiverUser) {
              return <DidAddress size={14} responsive={false} compact copyable={false} did={receiver} />;
            }
            return (
              <Box
                data-cy={`member-name-${receiverUser.fullName}`}
                key={receiver}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  justifyContent: 'flex-start',
                }}>
                <Avatar
                  src={`${receiverUser.avatar}?imageFilter=resize&w=48&h=48`}
                  size={32}
                  did={receiver}
                  shape="circle"
                  style={{ borderRadius: '100%', overflow: 'hidden' }}
                />
                <ShortenLabel>{receiverUser.fullName}</ShortenLabel>
              </Box>
            );
          },
        },
      },
      {
        label: 'Wallet',
        name: 'walletSendStatus',
        width: 200,
        options: {
          setCellProps: () => ({ className: 'sent-status-cell' }),
          filter: true,
          filterType: 'custom',
          filterList: params.walletSendStatus ?? [],
          customFilterListOptions: {
            render: (v) => (
              <FilterRender
                list={v}
                label="Wallet"
                onDelete={(event, item) => {
                  event.stopPropagation();
                  onDeleteFilterItem(event, item, columns[1].options.filterList, 'walletSendStatus');
                }}
              />
            ),
            update: filterUpdate,
          },
          filterOptions: {
            names: statusFilterValues,
            fullWidth: true,
            logic: filterLogic,
            display: (filterList, onChange, index, column) => {
              return (
                <StatusFilter
                  label="Wallet"
                  filterList={filterList}
                  onChange={onChange}
                  index={index}
                  column={column}
                  filterValues={statusFilterValues}
                />
              );
            },
          },
          customBodyRenderLite: (rawIndex) => {
            const { walletSendStatus, walletSendAt, walletSendFailedReason } = data[rawIndex];
            return (
              <SendStatus
                status={walletSendStatus}
                updatedAt={walletSendAt}
                reason={walletSendFailedReason}
                channel="wallet"
                onResend={(event) => onResend(event, data[rawIndex], 'wallet', [], false)}
              />
            );
          },
        },
      },
      {
        label: 'Push Kit',
        name: 'pushKitSendStatus',
        width: 200,
        options: {
          setCellProps: () => ({ className: 'sent-status-cell' }),
          customBodyRenderLite: (rawIndex) => {
            const { pushKitSendStatus, pushKitSendAt, pushKitSendFailedReason } = data[rawIndex];
            return (
              <SendStatus
                status={pushKitSendStatus}
                updatedAt={pushKitSendAt}
                reason={pushKitSendFailedReason}
                channel="pushkit"
                onResend={(event) => onResend(event, data[rawIndex], 'pushKit', [], false)}
              />
            );
          },
          filter: true,
          filterType: 'custom',
          filterList: params.pushKitSendStatus ?? [],
          customFilterListOptions: {
            render: (v) => (
              <FilterRender
                list={v}
                label="Push Kit"
                onDelete={(event, item) => {
                  event.stopPropagation();
                  onDeleteFilterItem(event, item, columns[2].options.filterList, 'pushKitSendStatus');
                }}
              />
            ),
            update: filterUpdate,
          },
          filterOptions: {
            names: statusFilterValues,
            fullWidth: true,
            logic: filterLogic,
            display: (filterList, onChange, index, column) => {
              return (
                <StatusFilter
                  label="Push Kit"
                  filterList={filterList}
                  onChange={onChange}
                  index={index}
                  column={column}
                  filterValues={statusFilterValues}
                />
              );
            },
          },
        },
      },
      {
        label: 'Email',
        name: 'emailSendStatus',
        width: 200,
        options: {
          setCellProps: () => ({ className: 'sent-status-cell' }),
          customBodyRenderLite: (rawIndex) => {
            const { emailSendStatus, emailSendAt, emailSendFailedReason } = data[rawIndex];
            return (
              <SendStatus
                status={emailSendStatus}
                updatedAt={emailSendAt}
                reason={emailSendFailedReason}
                channel="email"
                onResend={(event) => onResend(event, data[rawIndex], 'email', [], false)}
              />
            );
          },
          filter: true,
          filterType: 'custom',
          filterList: params.emailSendStatus ?? [],
          customFilterListOptions: {
            render: (v) => (
              <FilterRender
                list={v}
                label="Email"
                onDelete={(event, item) => {
                  event.stopPropagation();
                  onDeleteFilterItem(event, item, columns[3].options.filterList, 'emailSendStatus');
                }}
              />
            ),
            update: filterUpdate,
          },
          filterOptions: {
            names: statusFilterValues,
            fullWidth: true,
            logic: filterLogic,
            display: (filterList, onChange, index, column) => {
              return (
                <StatusFilter
                  label="Email"
                  filterList={filterList}
                  onChange={onChange}
                  index={index}
                  column={column}
                  filterValues={statusFilterValues}
                />
              );
            },
          },
        },
      },
      {
        label: 'Webhook',
        name: 'webhook',
        width: 200,
        options: {
          filter: false,
          setCellProps: () => ({ className: 'sent-status-cell' }),
          customBodyRenderLite: (rawIndex) => {
            const { webhook } = data[rawIndex];
            if (!webhook) return null;
            const latest = Object.entries(webhook)[0];
            if (!latest) return null;
            const [key, value] = latest;
            const v = value[0];
            return (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}>
                <Box
                  key={key}
                  className="webhook-item"
                  sx={{
                    fontSize: 12,
                  }}>
                  <ShortenLabel key={key} maxLength={30}>
                    {key}
                  </ShortenLabel>
                  <SendStatus
                    status={v.status}
                    updatedAt={v.sendAt}
                    reason={v.failedReason}
                    channel="webhook"
                    onResend={(event) => onResend(event, data[rawIndex], 'webhook', [key], false)}
                  />
                </Box>
              </Box>
            );
          },
        },
      },
      {
        label: t('common.createdAt'),
        name: 'createdAt',
        width: 100,
        options: {
          filter: false,
          customBodyRenderLite: (rawIndex) => {
            const { createdAt } = data[rawIndex];
            return <RelativeTime value={createdAt} locale={locale} shouldUpdate />;
          },
        },
      },
    ];
  }, [data, locale, params, t]);

  const customButtons = [
    <DatePicker key="date-picker" value={params.dateRange} onChange={onDateRangeChange} />,
    <Button
      key="refresh"
      variant="contained"
      size="small"
      color="primary"
      loading={loading}
      startIcon={<RefreshIcon />}
      onClick={() => loadReceivers()}
      sx={{ '.MuiButton-startIcon': { mr: '2px' } }}
      style={{ marginLeft: 8 }}>
      {t('common.refresh')}
    </Button>,
  ];

  return (
    <Box
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
      <Div>
        <ThemeProvider theme={mergedTheme}>
          <Datatable
            className="receivers-table"
            locale={locale}
            loading={loading}
            columns={columns}
            data={data}
            onChange={onTableChange}
            options={tableOptions}
            customButtons={customButtons}
            components={{
              TableFilterList: (props) => (
                <CustomFilterList
                  {...props}
                  itemComponent={(itemProps) => <FilterChip {...itemProps} canDelete={() => false} />}
                />
              ),
            }}
          />
          {resendAnchor.anchorEl && (
            <Popover
              open={Boolean(resendAnchor.anchorEl)}
              anchorReference="anchorPosition" // 使用固定位置
              anchorPosition={resendAnchor.position} // 锁定打开时的位置
              onClose={handlePopoverClose}
              anchorOrigin={{
                vertical: 'center',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'center',
                horizontal: 'left',
              }}>
              <CheckList>
                <Typography variant="body1" component="div" className="check-title">
                  {resendCheckResult?.channel} Checking
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}>
                  {checkList(resendCheckResult?.channel).map((item) => {
                    const { type, pass, fail } = item;
                    if (!resendCheckResult?.result || resendCheckResult?.result?.[type]) {
                      return (
                        <Typography
                          key={type}
                          variant="body1"
                          component="div"
                          className="check-item"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: resendCheckResult?.result?.[type] ? colors.success.main : 'inherit',
                          }}>
                          {!resendCheckResult?.result ? (
                            <CircularProgress size={12} sx={{ color: colors.primary.main }} />
                          ) : (
                            <CheckCircleOutlineIcon />
                          )}
                          <span>{pass}</span>
                        </Typography>
                      );
                    }
                    return (
                      <Typography
                        key={type}
                        variant="body1"
                        component="div"
                        className="check-item"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: colors.error.main,
                        }}>
                        <BlockIcon />
                        <span>{fail}</span>
                      </Typography>
                    );
                  })}
                </Box>
              </CheckList>
            </Popover>
          )}

          {resendConfigAnchor.anchorEl && (
            <Popover
              open={Boolean(resendConfigAnchor.anchorEl)}
              anchorReference="anchorPosition" // 使用固定位置
              anchorPosition={resendConfigAnchor.position} // 锁定打开时的位置
              onClose={handleResendConfigClose}
              anchorOrigin={{
                vertical: 'center',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'center',
                horizontal: 'left',
              }}>
              <ResendConfig
                loading={resending}
                onCancel={handleResendConfigClose}
                onConfirm={handleResendConfigConfirm}
              />
            </Popover>
          )}
        </ThemeProvider>
      </Div>
    </Box>
  );
}

export default memo(Receivers);

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
`;
const CheckList = styled.div`
  padding: 8px 16px;
  .check-title {
    font-weight: 500;
    margin-bottom: 8px;
    &::first-letter {
      text-transform: uppercase;
    }
  }
  .check-item {
    svg {
      font-size: 16px;
    }
    font-size: 12px;
  }
`;
