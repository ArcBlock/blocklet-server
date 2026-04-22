import { Box } from '@mui/material';
import { useMemoizedFn, useReactive } from 'ahooks';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Button from '@arcblock/ux/lib/Button';
import ProviderIcon from '@arcblock/ux/lib/DIDConnect/provider-icon';
import { LOGIN_PROVIDER, LOGIN_PROVIDER_NAME } from '@arcblock/ux/lib/Util/constant';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import isNil from 'lodash/isNil';
import noop from 'lodash/noop';
import { useRef } from 'react';
import { useConfirm } from '@arcblock/ux/lib/Dialog';

import OAuthAuth0 from './auth0';
import OAuthGithub from './github';
import LoginProviderDIDWallet from './did-wallet';
import LoginProviderEmail from './email';
import LoginProviderPasskey from './passkey';
import OAuthGoogle from './google';
import OAuthApple from './apple';
import OAuthTwitter from './twitter';
import DragItem from './drag-item';
import LoginProviderDialog from './login-provider-dialog';
import { useNodeContext } from '../../../contexts/node';
import { useBlockletContext } from '../../../contexts/blocklet';

export default function LoginProviders() {
  const { confirmApi, confirmHolder } = useConfirm();
  const loginProviderDialogRef = useRef();
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const did = blocklet?.meta?.did;
  const authenticationConfig = blocklet?.settings?.authentication || {};
  const availableAuthentication = [
    {
      name: LOGIN_PROVIDER.WALLET,
      title: LOGIN_PROVIDER_NAME[LOGIN_PROVIDER.WALLET],
      icon: <ProviderIcon provider="wallet" sx={{ width: 20, height: 20, scale: 0.9 }} />,
      component: LoginProviderDIDWallet,
    },
    {
      name: LOGIN_PROVIDER.EMAIL,
      title: LOGIN_PROVIDER_NAME[LOGIN_PROVIDER.EMAIL],
      icon: <ProviderIcon provider="email" sx={{ width: 20, height: 20, scale: 0.9 }} />,
      component: LoginProviderEmail,
    },
    {
      name: LOGIN_PROVIDER.PASSKEY,
      title: LOGIN_PROVIDER_NAME[LOGIN_PROVIDER.PASSKEY],
      icon: <ProviderIcon provider="passkey" sx={{ width: 20, height: 20, scale: 0.9 }} />,
      component: LoginProviderPasskey,
    },

    {
      name: LOGIN_PROVIDER.GOOGLE,
      title: LOGIN_PROVIDER_NAME[LOGIN_PROVIDER.GOOGLE],
      icon: <ProviderIcon provider="google" sx={{ width: 20, height: 20 }} />,
      component: OAuthGoogle,
    },
    {
      name: LOGIN_PROVIDER.APPLE,
      title: LOGIN_PROVIDER_NAME[LOGIN_PROVIDER.APPLE],
      icon: <ProviderIcon provider="apple" sx={{ width: 20, height: 20 }} />,
      component: OAuthApple,
    },
    {
      name: LOGIN_PROVIDER.GITHUB,
      title: LOGIN_PROVIDER_NAME[LOGIN_PROVIDER.GITHUB],
      icon: <ProviderIcon provider="github" sx={{ width: 20, height: 20 }} />,
      component: OAuthGithub,
    },
    {
      name: LOGIN_PROVIDER.TWITTER,
      title: LOGIN_PROVIDER_NAME[LOGIN_PROVIDER.TWITTER],
      icon: <ProviderIcon provider="twitter" sx={{ width: 20, height: 20 }} />,
      component: OAuthTwitter,
    },
    {
      name: LOGIN_PROVIDER.AUTH0,
      title: LOGIN_PROVIDER_NAME[LOGIN_PROVIDER.AUTH0],
      icon: <ProviderIcon provider="auth0" sx={{ width: 20, height: 20 }} />,
      component: OAuthAuth0,
      hidden: true,
    },
  ].map((x) => ({
    ...x,
    enabled: authenticationConfig[x.name]?.enabled ?? false,
    order: authenticationConfig[x.name]?.order ?? null,
  }));

  const enabledAuthentication = availableAuthentication.filter((x) => x.enabled);

  const sortedAuthentication = enabledAuthentication.sort((a, b) => {
    if (!isNil(a?.order) && !isNil(b?.order)) {
      return a.order - b.order;
    }
    if (!isNil(a?.order)) {
      return -1;
    }
    return 1;
  });

  const sortMapsData = sortedAuthentication.reduce(
    (total, item, index) =>
      Object.assign(total, {
        [item.name]: {
          order: index,
        },
      }),
    {}
  );
  const sortMaps = useReactive(
    sortedAuthentication.reduce(
      (total, item, index) =>
        Object.assign(total, {
          [item.name]: index,
        }),
      {}
    )
  );

  const providerList = [...enabledAuthentication].sort((a, b) => {
    return sortMaps[a.name] - sortMaps[b.name];
  });

  const dndProps = {};
  if (typeof window !== 'undefined') {
    dndProps.context = window;
  }

  const handleMoveItem = useMemoizedFn((dragIndex, hoverIndex) => {
    const dragItem = providerList[dragIndex];
    const hoverItem = providerList[hoverIndex];
    sortMaps[dragItem.name] = hoverIndex;
    sortMaps[hoverItem.name] = dragIndex;
  });

  const handleSaveOrder = useMemoizedFn(async () => {
    const orderData = Object.keys(sortMaps).reduce((acc, key) => {
      acc[key] = {
        order: sortMaps[key],
      };
      return acc;
    }, {});
    await api.configAuthentication({
      input: {
        did,
        authentication: JSON.stringify(orderData),
      },
    });
  });

  const addLoginProvider = () => {
    loginProviderDialogRef.current.open(() => {
      loginProviderDialogRef.current.close();
    });
  };

  const handleEditItem = useMemoizedFn((name) => {
    loginProviderDialogRef.current.open(noop, { provider: name });
  });

  const handleDeleteItem = useMemoizedFn((name) => {
    confirmApi.open({
      title: t('authentication.deleteLoginProvider', { provider: LOGIN_PROVIDER_NAME[name] }),
      content: t('authentication.deleteLoginProviderDescription', { provider: LOGIN_PROVIDER_NAME[name] }),
      confirmButtonText: t('common.confirm'),
      confirmButtonProps: {
        color: 'error',
      },
      cancelButtonText: t('common.cancel'),
      async onConfirm(close) {
        try {
          await api.configAuthentication({
            input: {
              did,
              authentication: JSON.stringify({
                [name]: { enabled: false, order: null },
              }),
            },
          });
          delete sortMaps[name];
          Toast.success(t('common.removeSuccess'));
          close();
        } catch (err) {
          Toast.error(err.message || t('common.deleteFailed'));
        }
      },
    });
  });

  return (
    <Box>
      <Button variant="contained" onClick={addLoginProvider} sx={{ mb: 1 }}>
        {t('authentication.addLoginProvider')}
      </Button>
      <DndProvider backend={HTML5Backend} {...dndProps}>
        {providerList.map((x, index) => {
          return (
            <DragItem
              key={x.name}
              index={index}
              id={x.name}
              title={x.title}
              icon={x.icon}
              onMove={handleMoveItem}
              onEnd={handleSaveOrder}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              disableDelete={sortedAuthentication.length <= 1}>
              {x.component}
            </DragItem>
          );
        })}
      </DndProvider>
      <LoginProviderDialog ref={loginProviderDialogRef} providers={availableAuthentication} sortMaps={sortMapsData} />
      {confirmHolder}
    </Box>
  );
}
