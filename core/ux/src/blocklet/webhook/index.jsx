/* eslint-disable react/no-unstable-nested-components */
import { getDurableData } from '@arcblock/ux/lib/Datatable';

import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useLocalStorageState, useRequest } from 'ahooks';
import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Delete } from '@mui/icons-material';
import Toast from '@arcblock/ux/lib/Toast';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType, InfoType } from '@arcblock/ux/lib/UserCard/types';

import SwitchWithLabel from '../../switch';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';

import useMobile from '../../hooks/use-mobile';
import WebhookCreateOrEdit from './create-or-edit';
import WebhookDetailModal from './detail';
import Confirm from '../../confirm';
import Table from './components/table';
import Actions from '../../actions';
import WebhookTip from '../table-tips';

import { formatTime } from './util';

export default function WebhookEndpoint() {
  const { teamDid } = useTeamContext();
  const isMobile = useMobile();

  const listKey = `webhook-endpoints-${teamDid}`;
  const persisted = getDurableData(listKey);

  const { t, locale } = useLocaleContext();
  const { api } = useNodeContext();
  const [searchText, setSearchText] = useState('');

  const [modalState, setModalState] = useState({
    webhookDetail: { open: false, id: null },
    createEdit: { open: false, id: null, url: '', description: '', enabledEvents: [] },
    deleteConfirm: null,
  });

  const [search, setSearch] = useLocalStorageState(listKey, {
    defaultValue: {
      pageSize: persisted.rowsPerPage || 20,
      page: persisted.page ? persisted.page + 1 : 1,
    },
  });

  const { loading, error, data, refresh } = useRequest(() =>
    api.getWebhookEndpoints({
      input: { teamDid, paging: { page: search.page, pageSize: search.pageSize } },
    })
  );

  useEffect(() => {
    refresh();
  }, [search, refresh]);

  const handleStatusUpdate = useCallback(
    async (item, isActive) => {
      try {
        await api.updateWebhookEndpoint({
          input: {
            teamDid,
            id: item.id,
            data: { status: isActive ? 'disabled' : 'enabled' },
          },
        });
        refresh();
        Toast.success(
          `${isActive ? t('webhookEndpoint.disable') : t('webhookEndpoint.enable')}${t('webhookEndpoint.success')}`
        );
      } catch (err) {
        Toast.error(err?.message);
      }
    },
    [api, teamDid, refresh, t]
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await api.deleteWebhookEndpoint({ input: { teamDid, id } });
        refresh();
        setModalState((prev) => ({ ...prev, deleteConfirm: null }));
        Toast.success(`${t('common.delete')}${t('webhookEndpoint.success')}`);
      } catch (err) {
        Toast.error(err?.message);
      }
    },
    [api, teamDid, refresh, t]
  );

  const onChange = (e, type) => {
    let page = e.page + 1;
    const newSearchText = e.searchText || '';

    if (newSearchText !== searchText) {
      setSearchText(newSearchText);
      return;
    }

    if (type === 'changePage' || type === 'changeRowsPerPage') {
      if (type !== 'changePage') {
        page = 1;
      }

      const newPaging = {
        page,
        pageSize: e.rowsPerPage,
      };

      setSearchText('');
      setSearch(newPaging);
    }
  };

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  const filter = (data?.list || []).filter((item) => {
    if (!searchText) return true;

    const text = searchText.toLowerCase();
    return item.description.toLowerCase().includes(text) || item.url.toLowerCase().includes(text);
  });

  const columns = [
    {
      label: 'URL',
      name: 'url',
      options: {
        customBodyRenderLite: (_, index) => {
          const item = filter[index];
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 0.5 }}>
              <Typography variant="body2">{item.description}</Typography>
              <Box
                sx={{ display: 'flex' }}
                onClick={(e) => {
                  e.stopPropagation();
                }}>
                <Tooltip title={item.url}>
                  <InfoOutlinedIcon sx={{ fontSize: '15px', marginTop: '1px' }} />
                </Tooltip>
              </Box>
            </Box>
          );
        },
      },
    },
    {
      label: 'Events',
      name: 'events',
      options: {
        customBodyRenderLite: (_, index) => {
          const item = filter[index];
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {item.enabledEvents.map((event) => (
                <Chip
                  key={`${item.source}-${event.type}`}
                  size="small"
                  variant="filled"
                  label={event.type}
                  sx={{
                    borderRadius: '4px',
                    textTransform: 'capitalize',
                  }}
                />
              ))}
            </Box>
          );
        },
      },
    },
    {
      label: t('common.status'),
      name: 'status',
      options: {
        customBodyRenderLite: (_, index) => {
          const item = filter[index];

          const isActive = item?.status === 'enabled';

          return (
            <Box onClick={(e) => e.stopPropagation()}>
              <SwitchWithLabel
                key={`status-${item.status}`}
                checked={isActive}
                onChange={() => handleStatusUpdate(item, isActive)}
              />
            </Box>
          );
        },
      },
    },
    {
      label: t('common.createdAt'),
      name: 'createdAt',
      minWidth: 200,
      options: {
        customBodyRender: (e) => {
          return formatTime(e);
        },
      },
    },
    {
      label: t('common.createdBy'),
      name: 'createUser',
      width: 100,
      options: {
        customBodyRender: (value) => {
          if (!value) {
            return '-';
          }

          return (
            <UserCard
              showDid
              did={value?.did}
              cardType={CardType.Detailed}
              infoType={InfoType.Minimal}
              sx={{ border: 0, padding: 0 }}
            />
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
        customBodyRenderLite: (_, index) => {
          const item = filter[index];

          return (
            <Actions
              actions={[
                {
                  icon: <Edit />,
                  text: t('common.edit'),
                  onClick: (e) => {
                    e.stopPropagation();
                    setModalState((prev) => ({
                      ...prev,
                      createEdit: {
                        open: true,
                        id: item.id,
                        url: item.url,
                        description: item.description,
                        enabledEvents: item.enabledEvents,
                      },
                    }));
                  },
                },
                {
                  icon: <Delete />,
                  text: t('common.delete'),
                  onClick: (e) => {
                    e.stopPropagation();
                    setModalState((prev) => ({
                      ...prev,
                      deleteConfirm: {
                        title: t('webhookEndpoint.deleteWebhook.title'),
                        description: t('webhookEndpoint.deleteWebhook.description'),
                        confirm: t('common.confirm'),
                        cancel: t('common.cancel'),
                        onConfirm: () => handleDelete(item.id),
                        onCancel: () => setModalState((prev1) => ({ ...prev1, deleteConfirm: null })),
                      },
                    }));
                  },
                },
              ]}
            />
          );
        },
      },
    },
  ];

  return (
    <Box
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
        <WebhookTip
          title={t('webhookEndpoint.listTitle')}
          tooltipTitle={t('webhookEndpoint.tooltipTitle')}
          link={`https://www.arcblock.io/docs/blocklet-developer/${locale}/webhook`}
        />
      )}
      <Table
        durable={listKey}
        durableKeys={['page', 'rowsPerPage']}
        data={filter}
        columns={columns}
        options={{
          count: data?.count || 0,
          page: search.page - 1,
          rowsPerPage: search.pageSize,
          viewColumns: false,
          onRowClick: (_, { dataIndex }) => {
            const item = data.list[dataIndex];
            setModalState((prev) => ({ ...prev, webhookDetail: { open: true, id: item.id } }));
          },
        }}
        loading={loading || !data}
        onChange={onChange}
        emptyNodeText={
          <Stack
            sx={{
              gap: 1,
            }}>
            {t('webhookEndpoint.noWebhooksAdded')}
          </Stack>
        }
        title={
          isMobile ? null : (
            <WebhookTip
              title={t('webhookEndpoint.listTitle')}
              tooltipTitle={t('webhookEndpoint.tooltipTitle')}
              link={`https://www.arcblock.io/docs/blocklet-developer/${locale}/webhook`}
            />
          )
        }
        customButtons={[
          <Button
            edge="end"
            variant="contained"
            color="primary"
            key="add"
            onClick={() => setModalState((prev) => ({ ...prev, createEdit: { ...prev.createEdit, open: true } }))}
            className="rule-action">
            {loading ? <CircularProgress size={16} /> : <AddIcon style={{ fontSize: 16 }} />}
            {t('common.create')}
          </Button>,
        ]}
      />
      {modalState.webhookDetail.open && (
        <WebhookDetailModal
          open
          onClose={() => setModalState((prev) => ({ ...prev, webhookDetail: { open: false, id: null } }))}
          id={modalState.webhookDetail.id}
        />
      )}
      {modalState.createEdit.open && (
        <WebhookCreateOrEdit
          onSubmit={refresh}
          {...modalState.createEdit}
          onClose={() =>
            setModalState((prev) => ({
              ...prev,
              createEdit: { id: null, url: '', description: '', enabledEvents: [], open: false },
            }))
          }
        />
      )}
      {modalState.deleteConfirm && (
        <Confirm
          title={modalState.deleteConfirm.title}
          description={modalState.deleteConfirm.description}
          confirm={modalState.deleteConfirm.confirm}
          cancel={modalState.deleteConfirm.cancel}
          params={modalState.deleteConfirm.params}
          onConfirm={modalState.deleteConfirm.onConfirm}
          onCancel={modalState.deleteConfirm.onCancel}
        />
      )}
    </Box>
  );
}
