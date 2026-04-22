import { useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

import { RBAC_CONFIG } from '@abtnode/constant';
import { TeamEvents, BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import { getDisplayName } from '@blocklet/meta/lib/util';

import Toast from '@arcblock/ux/lib/Toast';
import { getAccessUrl, isProtectedRole } from '@abtnode/ux/lib/util';
import { TeamContext } from '@abtnode/ux/lib/contexts/team';
import { getServerUrl } from '@abtnode/ux/lib/blocklet/util';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { orderBy } from 'lodash';
import { useNodeContext } from './node';
import { useBlockletContext } from './blocklet';

import { useSubscription } from '../libs/ws';

const { Provider, Consumer } = TeamContext;

const getTeamName = (teamDid, nodeInfo, blocklet) => {
  if (teamDid === nodeInfo.did) {
    return nodeInfo.name;
  }

  if (blocklet) {
    return getDisplayName(blocklet);
  }

  return '';
};

const getTeamPassportColor = (teamDid, nodeInfo, blocklet) => {
  if (blocklet) {
    const config = blocklet.environments.find(x => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_PASSPORT_COLOR);
    return config ? config.value : 'auto';
  }

  return 'default';
};

const getTrustedPassports = (teamDid, nodeInfo, blocklet) => {
  if (teamDid === nodeInfo.did) {
    return nodeInfo.trustedPassports || [];
  }

  if (blocklet) {
    return blocklet.trustedPassports || [];
  }

  return [];
};

const getTrustedFactories = (teamDid, nodeInfo, blocklet) => {
  if (teamDid === nodeInfo.did) {
    return nodeInfo.trustedFactories || [];
  }

  if (blocklet) {
    return blocklet.trustedFactories || [];
  }

  return [];
};

const getTeamIssuerDid = (teamDid, nodeInfo, blocklet) => {
  if (teamDid === nodeInfo.did) {
    return teamDid;
  }

  if (blocklet) {
    const item = (blocklet.environments || []).find(x => x.key === 'BLOCKLET_APP_ID') || {};
    return item.value || '';
  }

  return '';
};

const getEnablePassportIssuance = (teamDid, nodeInfo, blocklet) => {
  if (teamDid === nodeInfo.did) {
    return nodeInfo.enablePassportIssuance !== false;
  }

  if (blocklet) {
    return blocklet.enablePassportIssuance !== false;
  }

  return true;
};

function TeamProvider({ teamDid, children }) {
  const { t, locale } = useLocaleContext();
  const { api, info: nodeInfo } = useNodeContext();
  const { recommendedDomain, blocklet } = useBlockletContext() || {};

  const [invitations, setInvitations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  const teamName = getTeamName(teamDid, nodeInfo, blocklet);
  const passportColor = getTeamPassportColor(teamDid, nodeInfo, blocklet);
  const trustedPassports = getTrustedPassports(teamDid, nodeInfo, blocklet);
  const trustedFactories = getTrustedFactories(teamDid, nodeInfo, blocklet);
  const teamIssuerDid = getTeamIssuerDid(teamDid, nodeInfo, blocklet);
  const enablePassportIssuance = getEnablePassportIssuance(teamDid, nodeInfo, blocklet);

  const getData = async did => {
    try {
      const res = await api.doBatchQuery({
        getRoles: { input: { teamDid: did } },
        getPermissions: { input: { teamDid: did } },
        getInvitations: { input: { teamDid: did } },
      });

      const mapRoles = (res.getRoles.roles || [])
        // exclude some roles: not passport or only for ci
        .filter(x => !RBAC_CONFIG.roles.some(y => y.name === x.name && (!y.passport || y.noHuman)) && !x.orgId)
        // backwards compatibility
        .map(x => {
          x.hasDescription = !!x.description;
          if (!x.hasDescription) {
            x.description = t('team.passport.description', { teamName, title: x.title });
          }
          return x;
        });

      setRoles(orderBy(mapRoles, [item => isProtectedRole(item.name)], ['desc']));
      setPermissions(res.getPermissions.permissions || []);
      setInvitations(res.getInvitations.invitations || []);
    } catch (err) {
      Toast.error(err.message);
    }
  };

  const getUser = ({ did } = {}) => {
    const input = { teamDid, user: { did } };
    return api.getUser({ input });
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

    return api.getUsers({ input });
  };

  const getUsersCountPerRole = () => api.getUsersCountPerRole({ input: { teamDid } });

  const refresh = () => getData(teamDid);

  useEffect(() => {
    getData(teamDid);
  }, [teamDid]); // eslint-disable-line

  useEffect(() => {
    setRoles(oldRoles => {
      return oldRoles.map(x => {
        if (!x.hasDescription) {
          x.description = t('team.passport.description', { teamName, title: x.title });
        }
        return { ...x };
      });
    });
  }, [t, locale]); // eslint-disable-line

  const onUserEvent = data => {
    if (data.teamDid === teamDid) {
      getData(teamDid);
    }
  };

  useSubscription(TeamEvents.userAdded, onUserEvent, [teamDid]);
  useSubscription(TeamEvents.userRemoved, onUserEvent, [teamDid]);
  useSubscription(TeamEvents.userUpdated, onUserEvent, [teamDid]);

  const data = {
    teamDid,
    teamIssuerDid,
    teamName,
    invitations,
    roles,
    permissions,
    trustedPassports,
    trustedFactories,
    isNodeTeam: teamDid === nodeInfo.did,
    enablePassportIssuance,
    refresh,
    passportColor,
    endpoint: teamDid === nodeInfo.did ? getServerUrl(nodeInfo) : getAccessUrl(recommendedDomain),
    blocklet,
    api: {
      getUser,
      getUsers,
      getUsersCountPerRole,
    },
  };

  return <Provider value={data}>{children}</Provider>;
}

TeamProvider.propTypes = {
  teamDid: PropTypes.string.isRequired,
  children: PropTypes.object.isRequired,
};

function useTeamContext() {
  return useContext(TeamContext);
}

export { TeamContext, TeamProvider, Consumer as TeamConsumer, useTeamContext };
