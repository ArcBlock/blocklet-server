/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Skeleton,
  IconButton,
  useTheme,
  Chip,
  Button,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import DeleteIcon from '@mui/icons-material/Delete';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType, InfoType } from '@arcblock/ux/lib/UserCard/types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import Datatable from '@arcblock/ux/lib/Datatable';
import { Icon } from '@iconify/react';

import { useOrgsContext } from '../context';

function MemberSkeleton({ index = 0 }) {
  const widthVariants = [
    { name: '75%', info: '45%', detail: '60%' },
    { name: '65%', info: '55%', detail: '40%' },
    { name: '90%', info: '30%', detail: '65%' },
  ];

  const variant = widthVariants[index % widthVariants.length];

  return (
    <ListItem sx={{ px: 0, py: 1 }}>
      <ListItemAvatar>
        <Skeleton variant="circular" width={32} height={32} />
      </ListItemAvatar>
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width={variant.name} height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={variant.info} height={16} sx={{ mb: 0.25 }} />
      </Box>
    </ListItem>
  );
}

MemberSkeleton.propTypes = {
  index: PropTypes.number,
};

export default function OrgMembers() {
  const { t, locale } = useLocaleContext();
  const { orgDetail, requests } = useOrgsContext();
  const { org, members, loading, editable, membersPaging: paging } = orgDetail || {};
  const theme = useTheme();

  const onTableChange = (tableState, action) => {
    if (action === 'changePage') {
      paging.page = tableState.page + 1;
      requests.getOrgMembers(org.id, paging);
    }
    if (action === 'changeRowsPerPage') {
      paging.page = 1;
      paging.pageSize = tableState.rowsPerPage;
      requests.getOrgMembers(org.id, paging);
    }
  };

  const columns = [
    {
      name: 'user',
      label: ' ',
      options: {
        filter: false,
        sort: false,
        setCellHeaderProps: () => ({ style: { display: 'none' } }),
        setCellProps: () => ({ style: { width: '33.33%' } }),
        customBodyRender: (value, tableMeta) => {
          const member = members[tableMeta.rowIndex];
          if (!member || !member.user) return null;
          const { user } = member;
          const isOwner = member.userDid === org.ownerDid;

          return (
            <Box sx={{ py: { xs: 0.5, sm: 1 } }}>
              <UserCard
                avatarSize={32}
                user={user}
                showDid
                cardType={CardType.Detailed}
                infoType={InfoType.Minimal}
                sx={{ border: 0, padding: 0 }}
                showHoverCard={false}
                renderTopRightContent={
                  editable && !isOwner
                    ? () => (
                        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="delete"
                            title={t('team.orgs.invite.remove')}
                            onClick={(e) => {
                              e.stopPropagation();
                              requests.removeOrgMember(org.id, member);
                            }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )
                    : undefined
                }
              />
            </Box>
          );
        },
      },
    },
    {
      name: 'status',
      label: ' ',
      options: {
        filter: false,
        sort: false,
        setCellHeaderProps: () => ({ style: { display: 'none' } }),
        setCellProps: () => ({ style: { width: '33.33%' } }),
        customBodyRender: (value, tableMeta) => {
          const member = members[tableMeta.rowIndex];
          if (!member || !member.user) return null;
          const { user } = member;
          const { passports = [] } = user;
          return (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 0.5,
                alignItems: 'flex-start',
                py: { xs: 0.5, sm: 1 },
              }}>
              {/* 移动端：时间信息和状态放在一行 */}
              <Box
                sx={{
                  display: { xs: 'flex', sm: 'none' },
                  flexDirection: 'row',
                  gap: 0.5,
                  alignItems: 'center',
                  flexWrap: 'nowrap',
                  overflow: 'auto',
                  maxWidth: '100%',
                }}>
                {passports.map((passport) => (
                  <Chip key={passport.id} label={passport.title} size="small" sx={{ flexShrink: 0 }} />
                ))}
                {member.status === 'inviting' ? (
                  <Chip
                    label={t('common.inviting')}
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.warning.main, 0.15),
                      color: theme.palette.warning.dark,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Chip
                    label={t('team.orgs.active')}
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.success.main, 0.15),
                      color: theme.palette.success.dark,
                      flexShrink: 0,
                    }}
                  />
                )}
                {member.updatedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {member.status === 'inviting' ? t('team.orgs.invitedAt') : t('team.orgs.joinedAt')}{' '}
                    <RelativeTime value={member.updatedAt} />
                  </Typography>
                )}
              </Box>

              {/* 桌面端：只显示状态 */}
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'row', gap: 0.5, alignItems: 'center' }}>
                {passports.map((passport) => (
                  <Chip key={passport.id} label={passport.title} size="small" />
                ))}
                {member.status === 'inviting' ? (
                  <Chip
                    label={t('common.inviting')}
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.warning.main, 0.15),
                      color: theme.palette.warning.dark,
                    }}
                  />
                ) : (
                  <Chip
                    label={t('team.orgs.active')}
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.success.main, 0.15),
                      color: theme.palette.success.dark,
                    }}
                  />
                )}
              </Box>
            </Box>
          );
        },
      },
    },
    {
      name: 'updatedAt',
      label: ' ',
      options: {
        filter: false,
        sort: false,
        setCellHeaderProps: () => ({ style: { display: 'none' } }),
        setCellProps: () => ({ style: { width: '33.33%' } }),
        customBodyRender: (value, tableMeta) => {
          const member = members[tableMeta.rowIndex];
          if (!member || !member.updatedAt) return null;
          return (
            <Box
              sx={{
                py: { xs: 0.5, sm: 1 },
                display: { xs: 'none', sm: 'flex' },
                flexDirection: 'column',
                gap: 0.5,
                minWidth: 0,
              }}>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {member.status === 'inviting' ? t('team.orgs.invitedAt') : t('team.orgs.joinedAt')}
                <RelativeTime value={member.updatedAt} />
              </Typography>
            </Box>
          );
        },
      },
    },
    {
      name: 'actions',
      label: ' ',
      options: {
        filter: false,
        sort: false,
        setCellHeaderProps: () => ({ style: { display: 'none' } }),
        setCellProps: () => ({ style: { width: '80px', minWidth: '80px', maxWidth: '80px' } }),
        customBodyRender: (value, tableMeta) => {
          const member = members[tableMeta.rowIndex];
          if (!member || !member.user) return null;
          const isOwner = member.userDid === org.ownerDid;
          if (!editable || isOwner) return null;
          return (
            <Box sx={{ py: { xs: 0.5, sm: 1 }, display: { xs: 'none', sm: 'block' } }}>
              <IconButton
                color="error"
                aria-label="delete"
                title={t('team.orgs.invite.remove')}
                onClick={() => requests.removeOrgMember(org.id, member)}>
                <DeleteIcon />
              </IconButton>
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
    search: false,
    viewColumns: false,
    selectableRows: 'none',
    expandableRowsOnClick: false,
    page: paging.page - 1,
    rowsPerPage: paging.pageSize,
    count: paging.total || 0,
    pagination: paging.pageCount > 1,
  };

  if (loading) {
    return (
      <Box className="members-list">
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {Array.from({ length: 3 }, (_, index) => (
            <MemberSkeleton key={`skeleton-${index}`} index={index} />
          ))}
        </List>
      </Box>
    );
  }

  return (
    <Box
      className="members-list"
      sx={{
        width: '100%',
        '& .org-members-table > div': {
          overflow: 'hidden',
        },
        '& .MuiPaper-root': {
          overflow: { xs: 'hidden', sm: 'auto' },
        },
        '& table': {
          width: { xs: '100%', sm: 'auto' },
          tableLayout: { xs: 'fixed', sm: 'auto' },
        },
        '& .MuiTableRow-root .MuiTableCell-root': {
          py: { xs: 0.5, sm: 1 },
        },
        '& tbody tr': {
          display: { xs: 'grid', sm: 'table-row' },
          gridTemplateColumns: { xs: '1fr', sm: 'auto' },
          gridTemplateRows: { xs: 'auto auto', sm: 'auto' },
          '& td': {
            display: { xs: 'block !important', sm: 'table-cell !important' },
            '&:nth-of-type(1)': {
              gridColumn: { xs: '1', sm: 'auto' },
              gridRow: { xs: '1', sm: 'auto' },
            },
            '&:nth-of-type(2)': {
              gridColumn: { xs: '1', sm: 'auto' },
              gridRow: { xs: '2', sm: 'auto' },
              minWidth: { xs: 0, sm: 'auto' },
            },
            '&:nth-of-type(3), &:nth-of-type(4)': {
              display: { xs: 'none !important', sm: 'table-cell !important' },
            },
          },
        },
      }}>
      <Datatable
        className="org-members-table"
        data={members}
        columns={columns}
        loading={loading}
        onChange={onTableChange}
        locale={locale}
        options={tableOptions}
      />
    </Box>
  );
}

export function MemberExtra() {
  const { t } = useLocaleContext();
  const { orgDetail, inviteParams } = useOrgsContext();
  const { invitations, editable, org } = orgDetail || {};

  if (!editable) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="outlined"
        style={{ flexShrink: 0 }}
        color="primary"
        size="small"
        onClick={() => {
          inviteParams.onTriggerInvitingDialog({ org, open: true });
        }}>
        <Icon style={{ height: '1em', marginRight: 4 }} icon="tabler:user" />
        {t('common.inviting')}
        {invitations.length ? ` (${invitations.length})` : ''}
      </Button>
      <Button
        variant="contained"
        size="small"
        onClick={() => {
          inviteParams.onTriggerInviteDialog({ org, open: true, mode: 'detail' });
        }}
        startIcon={<Icon style={{ fontSize: 14 }} icon="tabler:user-plus" />}>
        {t('common.invite')}
      </Button>
    </Box>
  );
}
