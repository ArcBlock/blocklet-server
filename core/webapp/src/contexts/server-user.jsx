import { createContext, useState, useContext, useEffect } from 'react';

import { TeamEvents } from '@blocklet/constant';

import { useNodeContext } from './node';
import { useSubscription } from '../libs/ws';

const ServerUserContext = createContext({});
const { Provider, Consumer } = ServerUserContext;

// eslint-disable-next-line react/prop-types
function ServerUserProvider({ children }) {
  const { api, info: nodeInfo } = useNodeContext();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState([]);

  const MAX_RETRY = 4;

  const getUsers = async ({ silent = true, retries = MAX_RETRY } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      setError(null);

      // The number of server user will not exceed 100
      // So it means to get all users
      const { users: data } = await api.getUsers({ input: { teamDid: nodeInfo.did, paging: { pageSize: 100 } } });

      setLoading(false);
      setUsers(data);
    } catch (err) {
      if (retries > 0) {
        setTimeout(() => getUsers({ silent, retries: retries - 1 }), 1000);
      } else {
        setLoading(false);
        setError(err);
      }
    }
  };

  useEffect(() => {
    getUsers({ silent: false });
  }, []); // eslint-disable-line

  useSubscription(TeamEvents.userAdded, ({ teamDid }) => {
    if (teamDid === nodeInfo.did) {
      getUsers();
    }
  });
  useSubscription(TeamEvents.userRemoved, ({ teamDid, user: { did } }) => {
    if (teamDid === nodeInfo.did) {
      setUsers(list => list.filter(d => d.did !== did));
    }
  });
  useSubscription(TeamEvents.userUpdated, ({ teamDid }) => {
    if (teamDid === nodeInfo.did) {
      getUsers();
    }
  });

  const value = {
    loading,
    error,
    users,
    refresh: getUsers,
  };

  return <Provider value={{ users: value }}>{children}</Provider>;
}

function useServerUserContext() {
  const { users } = useContext(ServerUserContext);
  return users;
}

export { ServerUserContext, ServerUserProvider, Consumer as ServerUserConsumer, useServerUserContext };
