import { useContext, useState, useCallback } from 'react';
import { useRequest } from 'ahooks';
// eslint-disable-next-line import/no-unresolved
import { getUserInfo } from '@blocklet/aigne-hub/api/user';
import { Grid, Typography, Box } from '@mui/material';
import PropTypes from 'prop-types';
import noop from 'lodash/noop';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

import UserCard from './user';
import CreditCard from './credit';

export default function UserCreditCard({ url, apiKey, switchUser = noop, connecting = false }) {
  const { t } = useContext(LocaleContext);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, loading, error, refresh } = useRequest(
    () =>
      getUserInfo({
        baseUrl: url,
        accessKey: apiKey,
      }),
    {
      ready: !!(url && apiKey),
      refreshDeps: [url, apiKey],
      onSuccess: () => {
        setIsRefreshing(false);
      },
      onError: () => {
        setIsRefreshing(false);
      },
    }
  );

  const onRefresh = useCallback(() => {
    // 如果正在加载或刷新中，则不允许再次触发请求
    if (loading || isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    refresh();
  }, [refresh, loading, isRefreshing]);

  if (error) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontSize: 18, mb: 2 }}>
        {t('setting.aigne.account')}
      </Typography>
      <Grid container className="config-container" spacing={2} sx={{ width: '100%' }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <UserCard
            loading={loading && !isRefreshing}
            user={data?.user}
            switchUser={switchUser}
            connecting={connecting}
            url={url}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CreditCard
            refreshing={isRefreshing}
            loading={loading && !isRefreshing}
            credit={data}
            connecting={connecting}
            onRefresh={onRefresh}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

UserCreditCard.propTypes = {
  url: PropTypes.string.isRequired,
  apiKey: PropTypes.string.isRequired,
  connecting: PropTypes.bool,
  switchUser: PropTypes.func,
};
