import { createContext, useContext, useEffect } from 'react';
import propTypes from 'prop-types';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import merge from 'lodash/merge';
import cloneDeep from 'lodash/cloneDeep';
import { joinURL } from 'ufo';
import api from '../libs/api';

/**
 * @typedef {import('../pages/blocklets/restore/connect-space/selector').SpaceGateway} SpaceGateway
 */

/**
 * @typedef {{
 *  spaceGateways: Array<SpaceGateway>,
 *  selectedSpaceGateway: SpaceGateway,
 *  addSpaceGateway: (spaceGateway: SpaceGateway) => void | Promise<void>,
 *  deleteSpaceGateway: (spaceGateway: SpaceGateway) => void | Promise<void>,
 *  updateGateway: (updateGateway: SpaceGateway) => void | Promise<void>,
 *  handleSelectSpaceGateway: (spaceGatewayUrl: string) => void | Promise<void>,
 * }} SpaceSelectorContextType
 */

/** @type {import('react').Context<SpaceSelectorContextType>} */
const SpaceSelectorContext = createContext({});
const { Provider, Consumer } = SpaceSelectorContext;

function SpaceSelectorProvider({ children }) {
  const { t } = useLocaleContext();
  const [spaceGateways, setSpaceGateways] = useLocalStorage('spaceGatewaysForRestore', [
    {
      name: 'DID Spaces',
      url: 'https://www.didspaces.com/app',
      protected: true,
    },
  ]);
  const [selectedSpaceGateway, setSelectedSpaceGateway] = useLocalStorage(
    'selectedSpaceGatewayForRestore',
    spaceGateways.find(s => s.url === 'https://www.didspaces.com/app')
  );

  /**
   * @description
   * @param {SpaceGateway} spaceGateway
   */
  const addSpaceGateway = spaceGateway => {
    const duplicateSpaceGateway = spaceGateways.find(s => spaceGateway.url === s.url);
    if (duplicateSpaceGateway) {
      throw new Error(t('storage.spaces.gateway.add.duplicate', { name: duplicateSpaceGateway.name }));
    }
    setSpaceGateways(() => {
      return [...spaceGateways, cloneDeep(spaceGateway)];
    });
    setSelectedSpaceGateway(spaceGateway);
  };

  /**
   * @description
   * @param {SpaceGateway} spaceGateway
   */
  const deleteSpaceGateway = spaceGateway => {
    if (spaceGateway.url === selectedSpaceGateway.url) {
      throw new Error(t('storage.spaces.gateway.delete.failedForSelected'));
    }

    setSpaceGateways(() => spaceGateways.filter(gateway => gateway.url !== spaceGateway.url));
  };

  /**
   * @description
   * @param {string} spaceGateway
   */
  const handleSelectSpaceGateway = spaceGateway => {
    setSelectedSpaceGateway(spaceGateway);
  };

  useEffect(() => {
    async function syncSpaceGateways() {
      const latestSpaceGateways = await Promise.all(
        spaceGateways.map(async x => {
          const { data } = await api
            .get(joinURL(x.url, '/__blocklet__.js?type=json'), {
              timeout: 1000 * 5,
            })
            .catch(err => {
              console.error(err);
              return {
                data: {},
              };
            });
          const name = data.appName ?? x.name;

          return merge(x, { name });
        })
      );
      setSpaceGateways(latestSpaceGateways);
    }
    syncSpaceGateways();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Provider
      value={{
        spaceGateways,
        selectedSpaceGateway,
        addSpaceGateway,
        deleteSpaceGateway,
        handleSelectSpaceGateway,
      }}>
      {children}
    </Provider>
  );
}

SpaceSelectorProvider.propTypes = {
  children: propTypes.any.isRequired,
};

function useSpaceSelectorContext() {
  const res = useContext(SpaceSelectorContext);
  return res;
}

export { SpaceSelectorContext, SpaceSelectorProvider, Consumer as SpaceSelectorConsumer, useSpaceSelectorContext };
