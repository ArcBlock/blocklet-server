import { createContext, useContext, useMemo } from 'react';

const NodeContext = createContext({});
const { Provider, Consumer } = NodeContext;

function useNodeContext() {
  const { node } = useContext(NodeContext);

  return useMemo(() => {
    if (!node) {
      return {
        inService: true,
        inDaemon: false,
      };
    }

    return {
      ...node,
      inService: node.type === 'service',
      inDaemon: node.type === 'daemon',
    };
  }, [node]);
}

export { NodeContext, Provider as NodeProvider, Consumer as NodeConsumer, useNodeContext };
