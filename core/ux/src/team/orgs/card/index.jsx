import React, { useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { useMemoizedFn, useRequest, useReactive } from 'ahooks';
import PropTypes from 'prop-types';
import noop from 'lodash/noop';
import Empty from '@arcblock/ux/lib/Empty';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import OrgCardItem from './item';
import { useOrgsContext } from '../context';
import Pagination from './pagination';

function OrgListContainer({ type, onInviteUser = noop, onClickOrg = noop, editable = true, extra = null }) {
  const { t } = useLocaleContext();
  const paging = useReactive({
    page: 1,
    pageSize: 6,
  });
  const { requests, loading, refreshTrigger } = useOrgsContext();

  const title = useMemo(() => {
    return type === 'owned' ? t('team.orgs.myCreated') : t('team.orgs.myJoined');
  }, [type, t]);

  const emptyText = useMemo(() => {
    return type === 'owned' ? t('team.orgs.myCreatedEmpty') : t('team.orgs.myJoinedEmpty');
  }, [type, t]);

  const { data, refresh } = useRequest(
    () => {
      const requestMethod = type === 'owned' ? requests.getMyCreatedOrgs : requests.getMyJoinedOrgs;
      return requestMethod({ paging });
    },
    {
      refreshDeps: [paging.page, paging.pageSize, type],
    }
  );

  const { orgs = [], paging: orgsPaging } = data || {};

  const orgList = useMemo(() => {
    if (loading) {
      return [{ id: 1 }, { id: 2 }, { id: 3 }];
    }
    return orgs;
  }, [loading, orgs]);

  const isEmpty = useMemo(() => {
    return !loading && orgs.length === 0;
  }, [loading, orgs]);

  const handlePageChange = useMemoizedFn((newPaging) => {
    paging.page = newPaging.page;
  });

  useEffect(() => {
    if (refreshTrigger > 0 && refresh) {
      refresh();
    }
  }, [refreshTrigger, refresh]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        {extra}
      </Box>
      {isEmpty ? (
        <Box className="orgs-empty" sx={{ py: 4 }}>
          <Empty>{emptyText}</Empty>
        </Box>
      ) : (
        <Box>
          <Box
            sx={{
              display: 'grid',
              px: 1,
              gridTemplateColumns: {
                md: '1fr',
                lg: 'repeat(2, 1fr)',
                xl: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}>
            {orgList.map((org) => (
              <OrgCardItem
                key={org.id}
                org={org}
                onInviteUser={onInviteUser}
                onDelete={requests.deleteOrg}
                onClick={onClickOrg}
                loading={loading}
                editable={editable}
              />
            ))}
          </Box>
          {orgsPaging?.pageCount > 1 && (
            <Pagination paging={orgsPaging} loading={loading} onChange={handlePageChange} />
          )}
        </Box>
      )}
    </Box>
  );
}

OrgListContainer.propTypes = {
  type: PropTypes.oneOf(['owned', 'joined']).isRequired,
  onInviteUser: PropTypes.func,
  onClickOrg: PropTypes.func,
  editable: PropTypes.bool,
  extra: PropTypes.node,
};

export default function OrgsCard() {
  const { t } = useLocaleContext();
  const { onTriggerCreateOrg, inviteParams } = useOrgsContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleInviteUser = useMemoizedFn((org) => {
    inviteParams.org = org;
    inviteParams.onTriggerInviteDialog({ open: true, org, mode: 'list' });
  });

  const handleClickOrg = useMemoizedFn((org) => {
    // 构建跳转路径，保持当前的 search 参数
    const targetPath = `${WELLKNOWN_SERVICE_PATH_PREFIX}/user/orgs/${org.id}`;
    navigate({
      pathname: targetPath,
      search: location.search, // 保持当前的 search 参数
    });
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <OrgListContainer
        type="owned"
        onInviteUser={handleInviteUser}
        onClickOrg={handleClickOrg}
        extra={<Button onClick={onTriggerCreateOrg}>{t('common.create')}</Button>}
      />
      <OrgListContainer type="joined" onInviteUser={handleInviteUser} onClickOrg={handleClickOrg} editable={false} />
    </Box>
  );
}
