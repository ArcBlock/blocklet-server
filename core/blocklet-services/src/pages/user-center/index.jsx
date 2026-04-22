import { useRef } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { joinURL } from 'ufo';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import Notifications from '@abtnode/ux/lib/notifications/pages';
import UserCenterLayout from '@blocklet/ui-react/lib/UserCenter/components/user-center';
import { useCreation } from 'ahooks';
import Orgs from '@abtnode/ux/lib/team/orgs';

import { useNotificationContext } from '../../contexts/notification';
import { useNodeContext } from '../../contexts/node';
import Nfts from './nfts';
import Settings from './settings';
import DidSpaces from './did-spaces';
import UserFollowers from './user-followers';

import { TeamProvider } from '../../contexts/team';

// const UserCenterLayout = lazy(() => import('@blocklet/ui-react/lib/UserCenter/components/user-center'));

export default function UserCenter({ tab = '' }) {
  const { api } = useNodeContext();

  const ref = useRef(null);

  const params = useParams();
  const currentTab = tab || params.tab;

  const query = new URLSearchParams(window.location.search);
  const embed = query.get('embed') || window.sessionStorage?.getItem('embed');

  const context = useNotificationContext();

  const blocklet = useCreation(() => {
    return {
      ...window.blocklet,
      meta: {
        did: window.blocklet.did,
        name: window.blocklet.did,
      },
      // 用于获取 blocklet 的 logo
      children: window?.blocklet?.componentMountPoints.map((x) => ({
        ...x,
        meta: {
          ...x,
          did: x.did,
          name: x.name || x.title || '',
          logo: 'logo.png',
        },
      })),
    };
  });

  const handleDestroySelf = async (data) => {
    const { input, sessionId } = data;
    try {
      await api.destroySelf({ input: { ...input, sessionId } });
    } catch (error) {
      console.error('destroy myself error', error);
    }
  };

  return (
    <TeamProvider mode="user-center">
      <UserCenterLayout
        ref={ref}
        embed={embed === '1'}
        currentTab={currentTab ? joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, 'user', currentTab) : ''}
        disableAutoRedirect={currentTab === 'settings'}>
        {currentTab === 'notifications' ? <Notifications blocklets={[blocklet]} context={context} /> : null}
        {currentTab === 'nfts' ? <Nfts /> : null}
        {currentTab === 'settings' ? <Settings onDestroySelf={handleDestroySelf} /> : null}
        {currentTab === 'did-spaces' ? <DidSpaces /> : null}
        {currentTab === 'user-followers' ? <UserFollowers /> : null}
        {currentTab === 'orgs' ? <Orgs id={params.id || ''} /> : null}
      </UserCenterLayout>
    </TeamProvider>
  );
}

UserCenter.propTypes = {
  tab: PropTypes.string,
};
