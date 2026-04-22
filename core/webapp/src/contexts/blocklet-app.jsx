/**
 * TODO: 文件命名
 */
import { createContext, useContext } from 'react';
import axios from '@abtnode/util/lib/axios';
import PropTypes from 'prop-types';
import useAsync from 'react-use/lib/useAsync';
import Center from '@arcblock/ux/lib/Center';
import CircularProgress from '@mui/material/CircularProgress';
import useQuery from '../hooks/query';

const BlockletAppContext = createContext();
const { Provider, Consumer } = BlockletAppContext;

function BlockletAppProvider({ children }) {
  const query = useQuery();
  const blockletMetaUrl = query.get('blocklet_meta_url');

  const state = useAsync(async () => {
    const { data } = await axios.get(blockletMetaUrl);
    return data;
  });

  if (state.loading) {
    return (
      <Center>
        <CircularProgress />
      </Center>
    );
  }

  const value = { meta: state.value, error: state.error };
  return <Provider value={value}>{children}</Provider>;
}

BlockletAppProvider.propTypes = {
  children: PropTypes.any.isRequired,
};

function useBlockletAppContext() {
  return useContext(BlockletAppContext);
}

export { BlockletAppProvider, Consumer as BlockletAppConsumer, BlockletAppContext, useBlockletAppContext };
