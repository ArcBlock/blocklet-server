import { createContext, useContext } from 'react';

const BlockletContext = createContext({});
const { Provider, Consumer } = BlockletContext;

function useBlockletContext() {
  return useContext(BlockletContext);
}

export { BlockletContext, Provider as BlockletProvider, Consumer as BlockletConsumer, useBlockletContext };
