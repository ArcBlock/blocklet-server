import { createContext, use, useMemo, useState, useEffect } from 'react';
import { SessionContext } from '@arcblock/did-connect-react/lib/Session';
import PropTypes from 'prop-types';

const ConfigUserSpaceContext = createContext({});
const { Provider, Consumer } = ConfigUserSpaceContext;

function ConfigUserSpaceProvider({ children }) {
  const [loading] = useState(false);
  const { session } = use(SessionContext);
  const { user } = session;

  const [spaceGateway, setSpaceGateway] = useState();
  const storageEndpoint = useMemo(() => {
    return user?.didSpace?.endpoint;
  }, [user?.didSpace]);

  useEffect(() => {
    setSpaceGateway(user?.didSpace);
  }, [user?.didSpace]);

  // eslint-disable-next-line require-await
  const deleteSpaceGateway = async () => {
    setSpaceGateway(undefined);
  };

  // eslint-disable-next-line no-unused-vars
  const settingStorageEndpoint = (endpoint) => {};

  const updateSpaceGateway = async (x) => {
    setSpaceGateway(x);
    // eslint-disable-next-line no-use-before-define
    await settingStorageEndpoint(x.endpoint);
  };

  const hasStorageEndpoint = Boolean(storageEndpoint && spaceGateway);

  return (
    <Provider
      value={{
        loading,
        spaceGateway,
        session,
        deleteSpaceGateway,
        updateSpaceGateway,
        storageEndpoint,
        settingStorageEndpoint,
        hasStorageEndpoint,
      }}>
      {children}
    </Provider>
  );
}

function useConfigUserSpaceContext() {
  const res = use(ConfigUserSpaceContext);
  return res;
}

ConfigUserSpaceProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export {
  ConfigUserSpaceContext,
  ConfigUserSpaceProvider,
  Consumer as ConfigUserSpaceConsumer,
  useConfigUserSpaceContext,
};
