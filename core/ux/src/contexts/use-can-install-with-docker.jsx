import { useMemo } from 'react';
import { useNodeContext } from './node';

export default function useCanInstallWithDocker(meta) {
  const { info: nodeInfo } = useNodeContext();

  return useMemo(() => {
    if (!meta) {
      return true;
    }
    if (!meta.docker?.image) {
      return true;
    }
    if (meta.docker?.image && meta.docker?.runBaseScript) {
      return true;
    }
    if (window.blocklet) {
      return window.blocklet.enableDocker && window.blocklet.enableDockerNetwork;
    }
    return nodeInfo.enableDocker && nodeInfo.enableDockerNetwork;
  }, [meta, nodeInfo]);
}
