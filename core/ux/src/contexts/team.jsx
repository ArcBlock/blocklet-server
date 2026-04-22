import { createContext, useContext } from 'react';

const TeamContext = createContext({});
const { Provider, Consumer } = TeamContext;

function useTeamContext() {
  return useContext(TeamContext);
}

export { TeamContext, Provider as TeamProvider, Consumer as TeamConsumer, useTeamContext };
