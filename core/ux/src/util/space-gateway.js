/* eslint-disable import/prefer-default-export */
import isEmpty from 'lodash/isEmpty';
import { getSpaceNameByEndpoint } from './spaces';

/**
 * @description
 * @export
 * @param {{
 *  nodeApi: import('@blocklet/server-js'),
 *  blockletDid: string,
 *  spaceGateways: import('../blocklet/storage/connected').SpaceGateway[],
 * }} { nodeApi, blockletDid, spaceGateways }
 * @return {Promise<import('../blocklet/storage/connected').SpaceGateway[]>}
 */
export async function updateSpaceGatewaysFromDIDSpaces({ blockletDid, nodeApi, spaceGateways }) {
  let shouldUpdate = false;

  const latestSpaceGateways = await Promise.all(
    spaceGateways.map(async (x) => {
      let { name } = x;
      const newName = await getSpaceNameByEndpoint(x.endpoint);

      if (!isEmpty(newName) && newName !== name) {
        name = newName;
        shouldUpdate = true;
      }

      return {
        ...x,
        name,
      };
    })
  );

  if (shouldUpdate) {
    await Promise.all(
      latestSpaceGateways
        .filter((x) => x.did)
        .map((x) => {
          return nodeApi.updateBlockletSpaceGateway({
            input: {
              did: blockletDid,
              where: { did: x.did },
              spaceGateway: {
                ...x,
              },
            },
          });
        })
    );
  }

  return latestSpaceGateways;
}
