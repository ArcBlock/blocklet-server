import noop from 'lodash/noop';
import { use, useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { useAsyncEffect, useCreation } from 'ahooks';
import { getConnectedAccounts, getSourceProvider } from '@arcblock/ux/lib/SessionUser/libs/utils';
import { LOGIN_PROVIDER } from '@arcblock/ux/lib/Util/constant';
import { SessionContext } from '@arcblock/did-connect-react/lib/Session';
import { PasskeyActions } from '@arcblock/did-connect-react/lib/Passkey';
import { useBrowser } from '@arcblock/react-hooks';

import ThirdPartyItem from './third-party-item';

function ThirdPartyLogin({ user }) {
  const { session } = use(SessionContext);
  const [oauthConfigs, setOauthConfigs] = useState({});
  const { getOAuthConfigs } = session.useOAuth();
  const browser = useBrowser();

  useAsyncEffect(async () => {
    const data = await getOAuthConfigs({
      sourceAppPid: user?.sourceAppPid,
    });
    setOauthConfigs(data);
  }, [user?.sourceAppPid]);

  const availableProviders = useCreation(() => {
    const oauthList = Object.keys(oauthConfigs)
      .map((x) => {
        return {
          ...oauthConfigs[x],
          provider: x,
        };
      })
      .filter((x) => x.enabled);
    return [
      { provider: LOGIN_PROVIDER.WALLET, order: -1 },
      ...oauthList,
      {
        provider: LOGIN_PROVIDER.PASSKEY,
        order: Infinity,
      },
    ];
  }, [oauthConfigs]);

  /**
   * 1. 如果 connectedAccount 中存在 auth0，则应该将 auth0 转换为 google, apple, github 中的一种。如果可以转换，则标记需要移除 auth0；如果无法转换，则保留 auth0
   * 2. 如果标记移除了 auth0，则还需要对 sourceProvider 进行转换，转换的值为 google, apple, github 中的一种
   * 3. 如果标记移除了 auth0，还需要将 auth0 的 userInfo 数据添加到转换后的 provider 上
   */
  const oauthAccounts = useCreation(() => {
    const connectedAccounts = getConnectedAccounts(user);
    let removeAuth0 = false;
    let patchProvider = '';
    let sourceProvider = getSourceProvider(user);

    // NOTICE: 这里是用于将 auth0 转换为 google, apple, github 中的一种，如果可以转换，则标记需要移除 auth0；如果无法转换，则保留 auth0
    const auth0ConnectedAccount = connectedAccounts.find((x) => x.provider === LOGIN_PROVIDER.AUTH0);
    if (auth0ConnectedAccount) {
      if (auth0ConnectedAccount.id.startsWith('google-oauth2|')) {
        if (!connectedAccounts.some((x) => x.provider === 'google')) {
          removeAuth0 = true;
          patchProvider = LOGIN_PROVIDER.GOOGLE;
          if (sourceProvider === LOGIN_PROVIDER.AUTH0) {
            sourceProvider = LOGIN_PROVIDER.GOOGLE;
          }
        }
      }
      if (auth0ConnectedAccount.id.startsWith('appleid|')) {
        if (!connectedAccounts.some((x) => x.provider === LOGIN_PROVIDER.APPLE)) {
          removeAuth0 = true;
          patchProvider = LOGIN_PROVIDER.APPLE;
          if (sourceProvider === LOGIN_PROVIDER.AUTH0) {
            sourceProvider = LOGIN_PROVIDER.APPLE;
          }
        }
      }
      if (auth0ConnectedAccount.id.startsWith('github|')) {
        if (!connectedAccounts.some((x) => x.provider === LOGIN_PROVIDER.GITHUB)) {
          removeAuth0 = true;
          patchProvider = LOGIN_PROVIDER.GITHUB;
          if (sourceProvider === LOGIN_PROVIDER.AUTH0) {
            sourceProvider = LOGIN_PROVIDER.GITHUB;
          }
        }
      }
    }

    const transformedProviders = availableProviders
      .flatMap((x) => {
        if (x.provider === LOGIN_PROVIDER.AUTH0 && removeAuth0) {
          return null;
        }
        // passkey 支持多个账户，需要展开所有已绑定的 passkey
        if (x.provider === LOGIN_PROVIDER.PASSKEY) {
          const passkeyAccounts = connectedAccounts.filter((i) => i.provider === LOGIN_PROVIDER.PASSKEY);
          if (passkeyAccounts.length === 0) {
            return null;
          }
          return passkeyAccounts.map((account) => ({
            ...x,
            provider: x.provider,
            did: account.did,
            pk: account.pk,
            userInfo: account.userInfo,
            _bind: true,
            _rawProvider: account.provider,
            _mainProvider: x.provider === sourceProvider,
          }));
        }
        const findConnectedAccount =
          removeAuth0 && x.provider === patchProvider
            ? connectedAccounts.find((i) => i.provider === LOGIN_PROVIDER.AUTH0)
            : connectedAccounts.find((i) => i.provider === x.provider);
        if (findConnectedAccount) {
          return {
            ...x,
            provider: x.provider,
            did: findConnectedAccount.did,
            pk: findConnectedAccount.pk,
            userInfo: findConnectedAccount.userInfo,
            _bind: true,
            _rawProvider: findConnectedAccount.provider,
            _mainProvider: x.provider === sourceProvider,
          };
        }
        return {
          ...x,
          provider: x.provider,
          _rawProvider: x.provider,
          _mainProvider: x.provider === sourceProvider,
        };
      })
      .filter((x) => !!x)
      .sort((a, b) => {
        // 强制主账号排在最前面
        if (a._mainProvider) {
          return -1;
        }
        if (a?.order !== undefined && b?.order !== undefined) {
          return a.order - b.order;
        }
        if (a?.order !== undefined) {
          return -1;
        }
        return 1;
      });
    return transformedProviders;
  }, [user?.connectedAccounts, availableProviders]);

  return (
    <Box
      sx={{
        gap: 1,
        display: 'grid',
        gridTemplateColumns: '1fr min-content',
      }}>
      {oauthAccounts.map((account) => {
        return <ThirdPartyItem key={account?.provider} item={account} />;
      })}
      {browser.wallet || browser.arcSphere ? null : (
        <PasskeyActions
          behavior="only-new"
          action="connect"
          createMode="connect"
          createButtonText="Add New Passkey"
          onSuccess={noop}
          onError={noop}
          dense
          sx={{
            px: 1.5,
            py: 1,
            gap: 0.75,
          }}
        />
      )}
    </Box>
  );
}

ThirdPartyLogin.propTypes = {
  user: PropTypes.object.isRequired,
};

export default ThirdPartyLogin;
