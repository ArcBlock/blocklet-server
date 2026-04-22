/* eslint-disable react/no-unstable-nested-components */
import React, { useMemo, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Datatable from '@arcblock/ux/lib/Datatable';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import PropTypes from 'prop-types';
import AddIcon from '@mui/icons-material/Add';
import Spinner from '@mui/material/CircularProgress';
import Avatar from '@arcblock/ux/lib/Avatar';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Empty from '@arcblock/ux/lib/Empty';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType, InfoType } from '@arcblock/ux/lib/UserCard/types';

import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { fromAppDid } from '@arcblock/did-ext';

import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';

import CreateOauthClient from './create';
import UpdateOauthClient from './update';
import DeleteOauthClient from './delete';
import OauthClientDetail from './detail';
import { ScopeChips, useClientLogo } from './component';
import Actions from '../../actions';
import OAuthTip from '../table-tips';
import useMobile from '../../hooks/use-mobile';

function renderCreatedAt(v) {
  return <RelativeTime value={v * 1000} />;
}
function DetailDialog({ selected = null, onClose }) {
  return selected ? <OauthClientDetail client={selected} onClose={onClose} /> : null;
}
DetailDialog.propTypes = {
  selected: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

function CreateDialog({ open, onCreated, onClose }) {
  return open ? <CreateOauthClient onCreated={onCreated} onClose={onClose} /> : null;
}
CreateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onCreated: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default function OauthClientList() {
  const [search, setSearch] = useState({ searchText: '', pageSize: 10, page: 1 });
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const datatableRef = useRef(null);
  const { t, locale } = useLocaleContext();
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();
  const [editOauthClient, setEditOauthClient] = useState(null);
  const [deleteOauthClient, setDeleteOauthClient] = useState(null);
  const isMobile = useMobile();

  const { getClientLogoUrl } = useClientLogo();
  const state = useAsyncRetry(async () => {
    const response = await api.getOAuthClients({
      input: {
        teamDid,
        paging: {
          page: search.page,
          pageSize: search.pageSize,
        },
      },
    });
    return response;
  }, [search.page, search.pageSize]);
  const { loading } = state;
  const list = useMemo(() => state.value?.list || [], [state.value?.list]);

  const filtered = useMemo(() => {
    if (!search.searchText) return list;
    return list.filter(
      (x) =>
        x.clientName.toLowerCase().includes(search.searchText.toLowerCase()) ||
        x.clientId.toLowerCase().includes(search.searchText.toLowerCase()) ||
        x.scope.toLowerCase().includes(search.searchText.toLowerCase())
    );
  }, [search.searchText, list]);

  const columns = useMemo(
    () => [
      {
        label: t('oauth.client.name'),
        name: 'clientName',
        options: {
          customBodyRender: (v, { rowIndex }) => {
            const item = filtered[rowIndex];
            const logoUrl = getClientLogoUrl(item.logoUri);
            const wallet = fromAppDid(item.clientId, teamDid);

            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                  }}>
                  <Avatar variant="rounded" shape="square" did={wallet.address} src={logoUrl} size={48} />

                  <Stack
                    sx={{
                      gap: 0.5,
                    }}>
                    <Box sx={{ color: 'text.primary' }}>{item.clientName}</Box>
                    <Box sx={{ color: 'text.secondary' }}>{item.clientUri}</Box>
                  </Stack>
                </Box>
              </Box>
            );
          },
        },
      },
      {
        label: t('oauth.client.clientId'),
        name: 'clientId',
      },
      {
        label: t('oauth.client.scope'),
        name: 'scope',
        options: {
          customBodyRender: (v) => {
            return <ScopeChips scope={v} />;
          },
        },
      },
      {
        label: t('common.createdAt'),
        name: 'clientIdIssuedAt',
        options: { customBodyRender: renderCreatedAt },
      },
      {
        label: t('common.createdBy'),
        name: 'createdBy',
        width: 100,
        options: {
          customBodyRender: (value) => {
            if (!value) {
              return t('oauth.client.openRegistration');
            }

            return (
              <UserCard
                showDid
                did={value}
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
          customBodyRender: (_, { rowIndex }) => {
            const item = filtered[rowIndex];

            return (
              <Actions
                actions={[
                  {
                    icon: <EditIcon />,
                    text: t('common.edit'),
                    onClick: (e) => {
                      e.stopPropagation();
                      setEditOauthClient(item);
                    },
                  },
                  {
                    icon: <DeleteIcon />,
                    text: t('common.delete'),
                    onClick: (e) => {
                      e.stopPropagation();
                      setDeleteOauthClient(item);
                    },
                  },
                ]}
              />
            );
          },
        },
      },
    ],
    [filtered, t, getClientLogoUrl, teamDid, setEditOauthClient, setDeleteOauthClient]
  );

  const onTableChange = ({ page, rowsPerPage, searchText }) => {
    if (search.pageSize !== rowsPerPage) {
      setSearch((x) => ({ ...x, searchText: '', pageSize: rowsPerPage, page: 1 }));
    } else if (search.page !== page + 1) {
      setSearch((x) => ({ ...x, searchText: '', page: page + 1 }));
    } else if (search.searchText !== searchText) {
      setSearch((x) => ({ ...x, searchText, page: 1 }));
    }
  };

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
        <OAuthTip
          title={t('oauth.client.listTitle')}
          tooltipTitle={t('oauth.client.tooltipTitle')}
          link={`https://www.arcblock.io/docs/blocklet-developer/${locale}/oauth-service`}
        />
      )}
      <Datatable
        data={filtered}
        columns={columns}
        options={{
          sort: false,
          download: false,
          filter: false,
          print: false,
          viewColumns: false,
          page: search.page - 1,
          rowsPerPage: search.pageSize,
          count: filtered.length,
          searchDebounceTime: 400,
          onRowClick(row, { dataIndex }, e) {
            if (datatableRef.current?.contains(e.target)) {
              const x = filtered[dataIndex];
              setSelected(x);
            }
          },
        }}
        onChange={onTableChange}
        title={
          isMobile ? null : (
            <OAuthTip
              title={t('oauth.client.listTitle')}
              tooltipTitle={t('oauth.client.tooltipTitle')}
              link={`https://www.arcblock.io/docs/blocklet-developer/${locale}/oauth-service`}
            />
          )
        }
        customButtons={[
          <Button variant="contained" size="small" onClick={() => setShowCreate(true)} key="add">
            {loading ? <Spinner size={16} /> : <AddIcon style={{ fontSize: 16 }} />}
            {t('common.create')}
          </Button>,
        ]}
        loading={false}
        emptyNode={<Empty>{t('oauth.client.empty')}</Empty>}
      />

      <DetailDialog selected={selected} onClose={() => setSelected(null)} />

      <CreateDialog
        open={showCreate}
        onCreated={() => {
          setShowCreate(false);
          state.retry();
        }}
        onClose={() => setShowCreate(false)}
      />

      {editOauthClient && (
        <UpdateOauthClient client={editOauthClient} onUpdate={state.retry} onClose={() => setEditOauthClient(null)} />
      )}

      {deleteOauthClient && (
        <DeleteOauthClient {...deleteOauthClient} onDelete={state.retry} onClose={() => setDeleteOauthClient(null)} />
      )}
    </Box>
  );
}
