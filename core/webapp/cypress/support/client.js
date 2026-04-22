const NodeClient = require('@blocklet/server-js');

let client;

function createClient() {
  if (!client) {
    client = new NodeClient('/.well-known/server/admin/api/gql'.replace(/\/+/g, '/').trim());
    client.setAuthToken(() => {
      if (!window.localStorage) return null;
      return window.localStorage.getItem('__sst');
    });

    client.baseUrl = Cypress.config('baseUrl');
  }

  return { ...client };
}

module.exports = createClient;
