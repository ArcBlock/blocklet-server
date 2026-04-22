/**
 * Org 列表，table 布局
 */
/* eslint-disable jsx-a11y/no-access-key */
/* eslint-disable react/no-unstable-nested-components */
import { useContext, useRef, useState, useEffect } from 'react';
import { useRequest, useReactive } from 'ahooks';
import Datatable, { getDurableData } from '@arcblock/ux/lib/Datatable';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box, Button } from '@mui/material';
import Toast from '@arcblock/ux/lib/Toast';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType, InfoType } from '@arcblock/ux/lib/UserCard/types';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import Dialog from '@arcblock/ux/lib/Dialog';

import { useTeamContext } from '../../../contexts/team';
import { formatError } from '../../../util';
import useMobile from '../../../hooks/use-mobile';
import Actions from '../../../actions';
import MembersAvatarGroup from '../avatar-group';
import OrgDetail from '../detail/index';
import { useOrgsContext } from '../context';

export default function OrgsTable() {
  const { t, locale } = useContext(LocaleContext);
  const { teamDid } = useTeamContext();
  const datatableRef = useRef(null);
  const [detailOrg, setDetailOrg] = useState(null);
  const [rowCount, setRowCount] = useState(0);
  const isMobile = useMobile();

  const durableKey = `orgs-${teamDid}`;
  const tableDurableData = getDurableData(durableKey);

  const listSearch = useReactive({
    searchText: tableDurableData.searchText || '',
    pageSize: tableDurableData.rowsPerPage || 10,
    page: 1,
  });

  const { editable, loading, requests, onTriggerEditOrg, onTriggerCreateOrg, refreshTrigger } = useOrgsContext();

  const { data, refresh } = useRequest(
    async () => {
      const org = {};
      if (listSearch.searchText) {
        org.name = listSearch.searchText;
        org.description = listSearch.searchText;
      }
      const { orgs, paging } = await requests.getAllOrgs({
        org,
        paging: { page: listSearch.page, pageSize: listSearch.pageSize },
      });
      setRowCount(paging.total);
      return orgs;
    },
    {
      refreshDeps: [teamDid, listSearch.page, listSearch.pageSize, listSearch.searchText],
      onError: (error) => {
        Toast.error(formatError(error));
      },
    }
  );

  const onTableChange = ({ page, rowsPerPage, searchText }) => {
    if (listSearch.pageSize !== rowsPerPage) {
      listSearch.pageSize = rowsPerPage;
      listSearch.page = 1;
    } else if (listSearch.page !== page + 1) {
      listSearch.page = page + 1;
    } else if (listSearch.searchText !== searchText) {
      listSearch.searchText = searchText;
      listSearch.page = 1;
    }
  };

  useEffect(() => {
    if (refreshTrigger > 0 && refresh) {
      refresh();
    }
  }, [refreshTrigger, refresh]);

  const columns = [
    {
      label: t('common.orgs'),
      name: 'name',
    },
    {
      label: t('common.members'),
      name: 'members',
      options: {
        customBodyRender: (_, { rowIndex }) => {
          const item = data[rowIndex];
          return <MembersAvatarGroup members={item.members} total={item.membersCount} />;
        },
      },
    },
    {
      label: t('team.orgs.description'),
      name: 'description',
    },
    {
      label: t('common.createdBy'),
      name: 'owner',
      options: {
        customBodyRender: (_, { rowIndex }) => {
          const item = data[rowIndex];
          return (
            <Box>
              <UserCard
                showHoverCard={false}
                avatarSize={32}
                did={item.ownerDid}
                cardType={CardType.Detailed}
                infoType={InfoType.Minimal}
                sx={{ border: 0, padding: 0, ...(isMobile && { minWidth: 'unset' }) }}
              />
            </Box>
          );
        },
      },
    },
    {
      label: t('common.createdAt'),
      name: 'createdAt',
      options: {
        customBodyRender: (value) => {
          return <Box>{value ? <RelativeTime value={value} locale={locale} /> : '-'}</Box>;
        },
      },
    },
    editable && {
      label: t('common.actions'),
      name: 'actions',
      width: 100,
      align: 'center',
      verticalKeyAlign: 'center',
      options: {
        customBodyRender: (_, { rowIndex }) => {
          const item = data[rowIndex];

          return (
            <Box>
              <Actions
                data-cy="orgs-table-actions"
                actions={[
                  {
                    icon: <EditIcon />,
                    text: t('common.edit'),
                    onClick: (e) => {
                      e.stopPropagation();
                      onTriggerEditOrg(item);
                    },
                  },
                  {
                    icon: <DeleteIcon />,
                    text: t('common.delete'),
                    onClick: (e) => {
                      e.stopPropagation();
                      requests.deleteOrg(item);
                    },
                  },
                ]}
              />
            </Box>
          );
        },
      },
    },
  ];

  const tableOptions = {
    sort: false,
    download: false,
    filter: false,
    print: false,
    expandableRowsOnClick: true,
    onRowClick(row, meta, e) {
      if (datatableRef.current?.contains(e.target)) {
        const item = data[meta.dataIndex];
        setDetailOrg(item);
      }
    },
    page: listSearch.page - 1,
    rowsPerPage: listSearch.pageSize,
    count: rowCount,
    searchDebounceTime: 600,
  };

  const customButtons = editable
    ? [
        <Button
          variant="contained"
          size="small"
          key="add"
          onClick={() => {
            onTriggerCreateOrg();
          }}>
          {t('common.create')}
        </Button>,
      ]
    : [];

  return (
    <Box>
      <div ref={datatableRef} className="orgs-table">
        <Datatable
          className="orgs-table"
          verticalKeyWidth={100}
          loading={loading}
          columns={columns}
          data={data || []}
          locale={locale}
          durable={durableKey}
          durableKeys={['page', 'rowsPerPage']}
          customButtons={customButtons}
          options={tableOptions}
          onChange={onTableChange}
        />
      </div>

      {detailOrg && (
        <Dialog
          fullWidth
          maxWidth="lg"
          title={detailOrg.name}
          open={!!detailOrg}
          onClose={() => setDetailOrg(null)}
          sx={{ '.MuiDialogContent-root': { pt: 0 } }}>
          <OrgDetail id={detailOrg.id} inDialog />
        </Dialog>
      )}
    </Box>
  );
}
