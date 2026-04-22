/* eslint-disable jsx-a11y/no-access-key */
/* eslint-disable react/no-unstable-nested-components */
import { useState, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useAsyncRetry } from 'react-use';
import { Box, Alert, Typography, Button } from '@mui/material';
import DidAddress from '@arcblock/did-connect-react/lib/Address';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Datatable, { getDurableData } from '@arcblock/ux/lib/Datatable';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import Empty from '@arcblock/ux/lib/Empty';
import { formatError } from '@blocklet/error';
import { mergeSx } from '@arcblock/ux/lib/Util/style';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType, InfoType } from '@arcblock/ux/lib/UserCard/types';

import { renderRole } from '../../team/passports/new/passport-item';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import CreateAccessKey from './create';
import ConfirmAccessKey from './confirm';
import DeleteAccessKey from './delete';
import UpdateAccessKey from './update';
import Permission from '../../permission';
import AccessKeyDetail from './detail';
import { ExpiredAt, useRoles } from './component';
import Actions from '../../actions';
import useMobile from '../../hooks/use-mobile';
import AccessKeyTip from '../table-tips';

export default function AccessKey({ isSelf = false, columnSx = {} }) {
  const { t, locale } = useLocaleContext();
  const { api, inService } = useNodeContext();
  const { teamDid } = useTeamContext();
  const [confirmInfo, setConfirmInfo] = useState({});
  const [accessKey, setAccessKeyDialog] = useState(null);
  const [deleteAccessKey, setDeleteAccessKey] = useState(null);
  const [editAccessKey, setEditAccessKey] = useState(null);
  const isMobile = useMobile();

  const roles = useRoles();
  const datatableRef = useRef(null);
  const durableKey = `access-keys-${teamDid}`;
  const tableDurableData = getDurableData(durableKey);

  const [search, setSearch] = useState({
    searchText: tableDurableData.searchText || '',
    pageSize: tableDurableData.rowsPerPage || 10,
    page: 1,
  });

  const state = useAsyncRetry(async () => {
    const param = {
      teamDid,
      paging: {
        page: search.page,
        pageSize: search.pageSize,
      },
    };

    if (search.searchText) {
      param.remark = search.searchText;
    }

    const response = await api.getAccessKeys({
      input: param,
    });
    return response;
  }, [search.page, search.pageSize, search.searchText]);
  const { loading, error } = state;
  const list = useMemo(() => state.value?.list || [], [state.value?.list]);

  const ignoreColumns = useMemo(() => {
    return isSelf ? ['accessKeyId', 'createdVia', 'createdBy', 'createdBy'] : [];
  }, [isSelf]);

  const columns = useMemo(
    () =>
      [
        {
          label: t('common.name'),
          name: 'remark',
          options: {
            customBodyRender: (_, { rowIndex }) => {
              const item = list[rowIndex];
              return (
                <Box
                  className="remark"
                  sx={mergeSx(
                    {
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    },
                    columnSx
                  )}>
                  <Typography>{item.remark || 'N/A'}</Typography>
                </Box>
              );
            },
          },
        },
        {
          label: 'Access Key ID',
          name: 'accessKeyId',
          options: {
            customBodyRender: (value) => {
              return (
                <Box sx={columnSx}>
                  <DidAddress showDidLogo={false}>{value}</DidAddress>
                </Box>
              );
            },
          },
        },
        {
          label: t('common.role'),
          name: 'passport',
          options: {
            customBodyRender: (value) => {
              const p = roles.find((x) => x.name === value);
              const passport = p ? p.title : value;
              return <Box sx={columnSx}>{renderRole(passport, value)}</Box>;
            },
          },
        },
        {
          label: t('common.createdVia'),
          name: 'createdVia',
          options: {
            customBodyRender: (value) => {
              return <Typography sx={columnSx}>{value}</Typography>;
            },
          },
        },
        {
          label: t('setting.accessKey.authType'),
          name: 'authType',
          options: {
            customBodyRender: (value) => {
              return <Typography sx={columnSx}>{t(`setting.accessKey.${value}`)}</Typography>;
            },
          },
        },
        {
          label: t('common.createdAt'),
          name: 'createdAt',
          options: {
            customBodyRender: (value) => {
              return <Box sx={columnSx}>{value ? <RelativeTime value={value} locale={locale} /> : '-'}</Box>;
            },
          },
        },
        {
          label: t('common.lastUsedAt'),
          name: 'lastUsedAt',
          options: {
            customBodyRender: (value) => {
              return <Box sx={columnSx}>{value ? <RelativeTime value={value} locale={locale} /> : '-'}</Box>;
            },
          },
        },
        {
          label: t('common.expiredAt'),
          name: 'expireAt',
          options: {
            customBodyRender: (value) => {
              return (
                <Box className="expired-at" sx={columnSx}>
                  {value ? <ExpiredAt value={value} /> : t('common.neverExpired')}
                </Box>
              );
            },
          },
        },
        {
          label: t('common.createdBy'),
          name: 'createdBy',
          width: 100,
          options: {
            customBodyRender: (value) => {
              return (
                <Box sx={columnSx}>
                  {value ? (
                    <UserCard
                      showDid
                      did={value}
                      cardType={CardType.Detailed}
                      infoType={InfoType.Minimal}
                      sx={{ border: 0, padding: 0, ...(isMobile && { minWidth: 'unset' }) }}
                    />
                  ) : (
                    '-'
                  )}
                </Box>
              );
            },
          },
        },
        {
          label: t('common.actions'),
          name: 'actions',
          width: 100,
          align: 'center',
          verticalKeyAlign: 'center',
          options: {
            customBodyRender: (_, { rowIndex }) => {
              const item = list[rowIndex];

              return (
                <Box sx={columnSx}>
                  <Actions
                    data-cy="access-key-actions"
                    actions={[
                      {
                        icon: <EditIcon />,
                        text: t('common.edit'),
                        onClick: (e) => {
                          e.stopPropagation();
                          setEditAccessKey(item);
                        },
                      },
                      {
                        icon: <DeleteIcon />,
                        text: t('common.delete'),
                        onClick: (e) => {
                          e.stopPropagation();
                          setDeleteAccessKey(item);
                        },
                      },
                    ]}
                  />
                </Box>
              );
            },
          },
        },
      ].filter((x) => !ignoreColumns.includes(x.name)),
    [list, locale, t, roles, setDeleteAccessKey, setEditAccessKey, columnSx, isMobile, ignoreColumns]
  );

  const onTableChange = ({ page, rowsPerPage, searchText }) => {
    if (search.pageSize !== rowsPerPage) {
      setSearch((x) => ({ ...x, pageSize: rowsPerPage, page: 1 }));
    } else if (search.page !== page + 1) {
      setSearch((x) => ({ ...x, searchText, page: page + 1 }));
    } else if (search.searchText !== searchText) {
      setSearch((x) => ({ ...x, searchText, page: 1 }));
    }
  };

  if (error) {
    return <Alert severity="error">{formatError(error)}</Alert>;
  }

  return (
    <Box
      ref={datatableRef}
      sx={{
        '.custom-toobar-btns': { gap: '8px' },
        '.custom-toobar-title .custom-toobar-title-inner>span': {
          display: 'flex',
          alignItems: 'center',
          'white-space': 'inherit',
          height: '100%',
        },
      }}>
      {!isMobile ? null : (
        <AccessKeyTip
          title={t('setting.accessKey.listTitle')}
          tooltipTitle={t('setting.accessKey.tooltipTitle')}
          link={`https://www.arcblock.io/docs/blocklet-developer/${locale}/access-key`}
        />
      )}
      <Datatable
        durable={durableKey}
        durableKeys={['page', 'rowsPerPage', 'searchText']}
        data={list}
        locale={locale}
        columns={columns}
        className="pc-access-key-table"
        options={{
          sort: false,
          download: false,
          filter: false,
          print: false,
          viewColumns: false,
          page: search.page - 1,
          rowsPerPage: search.pageSize,
          count: state.value?.paging?.total || 0,
          searchText: search.searchText,
          searchDebounceTime: 600,
          onRowClick(row, { dataIndex }, e) {
            if (datatableRef.current?.contains(e.target)) {
              const x = list[dataIndex];
              setAccessKeyDialog(x);
            }
          },
        }}
        loading={loading}
        onChange={onTableChange}
        title={
          isMobile ? null : (
            <AccessKeyTip
              title={t('setting.accessKey.listTitle')}
              tooltipTitle={t('setting.accessKey.tooltipTitle')}
              link={`https://www.arcblock.io/docs/blocklet-developer/${locale}/access-key`}
            />
          )
        }
        customButtons={[
          <Permission permission={inService ? '' : 'mutate_accessKey'}>
            <CreateAccessKey
              onCreate={(data) => {
                const { accessKeyId, accessKeySecret, authType } = data;
                setConfirmInfo({
                  show: true,
                  accessKeyId,
                  accessKeySecret,
                  authType,
                });
              }}
            />
          </Permission>,
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={() => {
              state.retry();
            }}>
            {t('common.refresh')}
          </Button>,
        ]}
        emptyNode={<Empty>{t('oauth.client.empty')}</Empty>}
      />

      {confirmInfo.show && (
        <ConfirmAccessKey
          hideSecret={confirmInfo.authType === 'signature'}
          onConfirm={() => {
            state.retry();
            setConfirmInfo({ show: false });
          }}
          {...confirmInfo}
        />
      )}

      {accessKey && <AccessKeyDetail onCancel={() => setAccessKeyDialog(null)} accessKey={accessKey} />}

      {deleteAccessKey && (
        <DeleteAccessKey
          accessKeyId={deleteAccessKey.accessKeyId}
          time={deleteAccessKey.lastUsedAt}
          remark={deleteAccessKey.remark || 'N/A'}
          onDelete={state.retry}
          onClose={() => setDeleteAccessKey(null)}
        />
      )}

      {editAccessKey && (
        <UpdateAccessKey {...editAccessKey} onUpdate={state.retry} onClose={() => setEditAccessKey(null)} />
      )}
    </Box>
  );
}

AccessKey.propTypes = {
  isSelf: PropTypes.bool,
  columnSx: PropTypes.object,
};
