import { useRequest } from 'ahooks';
import { useNodeContext } from '../contexts/node';
import { useBlockletContext } from '../contexts/blocklet';

export default function useBlockletWithDiskInfo() {
  /**
   * @type {{ api: import('@abtnode/client') }}
   */
  const { api } = useNodeContext();
  const { blocklet: originalBlocklet } = useBlockletContext();

  const { data, loading } = useRequest(
    () =>
      api.getBlocklet({ input: { did: originalBlocklet?.meta?.did, attachDiskInfo: true, attachRuntimeInfo: true } }),
    {
      ready: !!originalBlocklet?.meta?.did,
      refreshDeps: [originalBlocklet?.meta?.did],
    }
  );

  return { blocklet: data?.blocklet ?? null, loading };
}
