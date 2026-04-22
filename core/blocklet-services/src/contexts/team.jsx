import { useState, useContext, useEffect } from 'react';

import Toast from '@arcblock/ux/lib/Toast';
import { getDisplayName } from '@blocklet/meta/lib/util';
import { BLOCKLET_CONFIGURABLE_KEY, TeamEvents } from '@blocklet/constant';
import { RBAC_CONFIG } from '@abtnode/constant';
import { TeamContext } from '@abtnode/ux/lib/contexts/team';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { isProtectedRole } from '@abtnode/ux/lib/util';
import { orderBy } from 'lodash';
import { useBlockletContext } from './blocklet';
import client from '../libs/client';
import { useSubscription } from '../libs/ws';

const { Provider, Consumer } = TeamContext;

const { did: teamDid, appId } = window.env;

// eslint-disable-next-line react/prop-types
function TeamProvider({ children, mode = 'dashboard' }) {
  const { t, locale } = useLocaleContext();
  const { blocklet } = useBlockletContext();

  const [invitations, setInvitations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  const teamName = getDisplayName(blocklet);

  const passportColor =
    (blocklet?.environments || []).find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_PASSPORT_COLOR)?.value ||
    'auto';

  const trustedPassports = blocklet?.trustedPassports || [];
  const trustedFactories = blocklet?.trustedFactories || [];
  const enablePassportIssuance = blocklet?.enablePassportIssuance !== false;

  const getTeamData = async () => {
    try {
      const res = await client.doBatchQuery({
        getRoles: { input: { teamDid } },
        getPermissions: { input: { teamDid } },
        getInvitations: { input: { teamDid } },
      });

      const mapRoles = (res.getRoles.roles || [])
        // exclude some roles: not passport or only for ci
        .filter((x) => !RBAC_CONFIG.roles.some((y) => y.name === x.name && (!y.passport || y.ci)) && !x.orgId)
        // backwards compatibility
        .map((x) => {
          x.hasDescription = !!x.description;
          if (!x.hasDescription) {
            x.description = t('team.passport.description', { teamName, title: x.title });
          }
          return x;
        });

      setRoles(orderBy(mapRoles, [(item) => isProtectedRole(item.name)], ['desc']));
      setPermissions(res.getPermissions.permissions || []);
      setInvitations(res.getInvitations.invitations || []);
    } catch (err) {
      Toast.error(err.message);
    }
  };

  const getUser = ({ did } = {}) => {
    const input = { teamDid, user: { did } };
    return client.getUser({ input });
  };
  const getUsers = ({ query, paging } = {}) => {
    const input = { teamDid };
    if (paging) {
      input.paging = paging;
    }

    if (query) {
      input.query = query;
    }

    input.sort = { lastLoginAt: -1 };

    return client.getUsers({ input });
  };

  const getUsersCountPerRole = () => client.getUsersCountPerRole({ input: { teamDid } });

  const refreshTeam = () => getTeamData();

  useEffect(() => {
    if (!blocklet?.meta?.did) {
      return;
    }
    getTeamData();
  }, [blocklet?.meta?.did]); // eslint-disable-line

  useEffect(() => {
    setRoles((oldRoles) => {
      return oldRoles.map((x) => {
        if (!x.hasDescription) {
          x.description = t('team.passport.description', { teamName, title: x.title });
        }
        return { ...x };
      });
    });
  }, [t, locale]); // eslint-disable-line

  const onUserEvent = (data) => {
    if (data.teamDid === teamDid) {
      getTeamData(teamDid);
    }
  };

  // 避免在前台页面链接 dashboard socket 报错
  useSubscription(mode === 'dashboard' ? TeamEvents.userAdded : '', onUserEvent, [teamDid]);
  useSubscription(mode === 'dashboard' ? TeamEvents.userRemoved : '', onUserEvent, [teamDid]);
  useSubscription(mode === 'dashboard' ? TeamEvents.userUpdated : '', onUserEvent, [teamDid]);

  const value = {
    teamDid,
    teamIssuerDid: appId,
    teamName,
    invitations,
    roles,
    permissions,
    trustedPassports,
    trustedFactories,
    isNodeTeam: false,
    enablePassportIssuance,
    refresh: refreshTeam,
    passportColor,
    endpoint: window.location.origin,
    blocklet,
    api: {
      getUser,
      getUsers,
      getUsersCountPerRole,
    },
  };

  return <Provider value={value}>{children}</Provider>;
}

function useTeamContext() {
  return useContext(TeamContext);
}

export { TeamContext, TeamProvider, Consumer as TeamConsumer, useTeamContext };
