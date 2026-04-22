const axios = require('@abtnode/util/lib/axios');
const get = require('lodash/get');

const getFactoryState = async (endpoint, address) => {
  const resp = await axios.post(
    endpoint,
    JSON.stringify({
      query: `{
      getFactoryState(address: "${address}")  {
        state {
          address
        }
      }
    }`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );

  return get(resp, 'data.data.getFactoryState.state', null);
};

module.exports = {
  getFactoryState,
};
