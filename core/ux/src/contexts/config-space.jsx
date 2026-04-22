import { createContext, useContext, useEffect, useState } from 'react';
import { node } from 'prop-types';
import merge from 'lodash/merge';
import isEmpty from 'lodash/isEmpty';
import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import { useAsyncEffect } from 'ahooks';
import Toast from '@arcblock/ux/lib/Toast';
import { useNodeContext } from './node';
import { getSpaceGateway, getSpaceNameByEndpoint } from '../util/spaces';
import { useBlockletContext } from './blocklet';
import useStorageEndpoint from '../hooks/use-storage-endpoint';

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
 * }} ConfigSpaceContextType
 */

/** @type {import('react').Context<ConfigSpaceContextType>} */
const ConfigSpaceContext = createContext({});
const { Provider, Consumer } = ConfigSpaceContext;

/**
 * @description 专门连接存储 NFT 的 DID Space,目前主要是 NFT Blender 使用
 * @param {{
 *  children: React.ReactNode,
 * }} { children }
 * @return {any}
 */
function ConfigSpaceProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [spaceGateway, setSpaceGateway] = useState(null);
  /**
   *  @type {{
   *    blocklet: import('@blocklet/server-js').BlockletState,
   *    actions: { refreshBlocklet: Function }
   *  }}
   */
  const {
    blocklet,
    actions: { refreshBlocklet },
  } = useBlockletContext();
  const { storageEndpoint } = useStorageEndpoint();
  const { api: nodeApi } = useNodeContext();

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
    refreshBlocklet();
  };

  /**
   * @description
   * @param {SpaceGateway} x
   */
  const updateSpaceGateway = async (x) => {
    setSpaceGateway(x);
    // eslint-disable-next-line no-use-before-define
    await settingStorageEndpoint(x.endpoint);
    refreshBlocklet();
  };

  /**
   * @description
   * @param {string} endpoint
   */
  const settingStorageEndpoint = async (endpoint) => {
    await nodeApi.configBlocklet({
      input: {
        did: [blocklet.meta.did],
        configs: [
          {
            key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPACE_ENDPOINT,
            value: endpoint,
          },
        ],
      },
    });
    refreshBlocklet();
  };

  useEffect(() => {
    async function syncSpaceGateway() {
      if (!spaceGateway) {
        return;
      }

      const name = await getSpaceNameByEndpoint(spaceGateway.endpoint, spaceGateway.name);
      const latestSpaceGateway = merge(spaceGateway, { name });

      setSpaceGateway(latestSpaceGateway);
    }

    syncSpaceGateway();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

ConfigSpaceProvider.propTypes = {
  children: node.isRequired,
};

function useConfigSpaceContext() {
  const res = useContext(ConfigSpaceContext);
  return res;
}

export { ConfigSpaceContext, ConfigSpaceProvider, Consumer as ConfigSpaceConsumer, useConfigSpaceContext };
