import { useRequest } from 'ahooks';
import toast from '@arcblock/ux/lib/Toast';
import { useNodeContext } from '../contexts/node';
import { updateSpaceGatewaysFromDIDSpaces } from '../util/space-gateway';
import { formatError } from '../util';
import { useBlockletContext } from '../contexts/blocklet';

/**
 * @typedef {import('../contexts/blocklet-storage').SpaceGateway} SpaceGateway
 * @param {{
 *  refresh: boolean,
 * }}
 * @return {{
 *  data: Array<SpaceGateway>,
 *  error: Error,
 *  mutate: (data?: Array<SpaceGateway> | ((oldData?: Array<SpaceGateway>) => Array<SpaceGateway> | undefined)) => void,
 *  loading: boolean,
 * }}
 */
export default function useSpaceGateways({ refresh } = {}) {
  /** @type {{ blocklet: import('@blocklet/server-js').BlockletState }} */
  const { blocklet } = useBlockletContext();
  const blockletDid = blocklet?.meta?.did;
  const { api } = useNodeContext();

  return useRequest(
    async () => {
      if (!blockletDid) {
        return [];
      }

      const { spaceGateways } = await api.getBlockletSpaceGateways({
        input: {
          did: blockletDid,
        },
      });

      const latestSpaceGateways = await updateSpaceGatewaysFromDIDSpaces({
        blockletDid,
        nodeApi: api,
        spaceGateways,
      });

      return latestSpaceGateways ?? [];
    },
    {
      refreshDeps: [blockletDid, refresh],
      onError(error) {
        // @note: 当用户是未登录的时候，不要直接报错，引导用户登陆即可
        if (error?.message?.includes('not logged')) {
          console.warn(error);
        } else {
          console.error(error);
          toast.error(formatError(error));
        }
      },
    }
  );
}
