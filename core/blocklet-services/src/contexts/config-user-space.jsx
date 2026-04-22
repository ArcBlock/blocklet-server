import { createContext, useContext, useMemo, useState } from 'react';
import { node } from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import { getSpaceGateway } from '@abtnode/ux/lib/util/spaces';
import { useAsyncEffect } from 'ahooks';
import Toast from '@arcblock/ux/lib/Toast';
import { useSessionContext } from './session';

/**
 * @typedef {{
 *  did: string,
 *  url: string,
 *  name: string,
 *  endpoint: string,
 * }} SpaceGateway
 */

/**
 * @typedef {{
 *  loading: boolean,
 *  spaceGateway: SpaceGateway,
 *  deleteSpaceGateway: (spaceGateway: SpaceGateway) => void | Promise<void>,
 *  updateSpaceGateway: (updateSpaceGateway: SpaceGateway) => void | Promise<void>,
 *  storageEndpoint: string,
 *  settingStorageEndpoint: (endpoint: string) => void | Promise<void>,
 *  hasStorageEndpoint: boolean,
 * }} ConfigUserSpaceContextType
 */

/** @type {import('react').Context<ConfigUserSpaceContextType>} */
const ConfigUserSpaceContext = createContext({});
const { Provider, Consumer } = ConfigUserSpaceContext;

function ConfigUserSpaceProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [spaceGateway, setSpaceGateway] = useState(null);
  const { session } = useSessionContext();
  const storageEndpoint = useMemo(() => {
    return session.user?.didSpace?.endpoint;
  }, [session.user?.didSpace]);

  // @FIXME: 待实现
  const refresh = () => undefined;

  useAsyncEffect(async () => {
    try {
      setLoading(true);

      if (isEmpty(storageEndpoint)) {
        setSpaceGateway(null);
        return;
      }

      const $spaceGateway = await getSpaceGateway(storageEndpoint);

      setSpaceGateway($spaceGateway);
    } catch (error) {
      console.error(error);
      Toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [storageEndpoint]);

  /**
   * @description
   * @param {SpaceGateway} spaceGateway
   */
  const deleteSpaceGateway = () => {
    setSpaceGateway(null);
    refresh();
  };

  /**
   * @description
   * @param {SpaceGateway} x
   */
  const updateSpaceGateway = async (x) => {
    setSpaceGateway(x);
    // eslint-disable-next-line no-use-before-define
    await settingStorageEndpoint(x.endpoint);
    refresh();
  };

  /**
   * @description
   * @param {string} endpoint
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line require-await
  const settingStorageEndpoint = async (endpoint) => {
    // @FIXME: 待实现
    refresh(endpoint);
  };

  const hasStorageEndpoint = Boolean(storageEndpoint && spaceGateway);

  return (
    <Provider
      value={{
        loading,
        spaceGateway,
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

ConfigUserSpaceProvider.propTypes = {
  children: node.isRequired,
};

function useConfigUserSpaceContext() {
  const res = useContext(ConfigUserSpaceContext);
  return res;
}

export {
  ConfigUserSpaceContext,
  ConfigUserSpaceProvider,
  Consumer as ConfigUserSpaceConsumer,
  useConfigUserSpaceContext,
};
