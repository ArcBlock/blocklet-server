const { ManagementClient: Auth0ManagementClient } = require('auth0');

class ManagementClient {
  constructor(options) {
    this.config = {
      domain: options.domain,
      token: options.token,
    };
    this.instance = new Auth0ManagementClient({
      domain: options.domain,
      token: options.token,
    });
  }

  getClient(...args) {
    return this.instance.getClient(...args);
  }

  getClients(...args) {
    return this.instance.getClients(...args);
  }

  createClient(...args) {
    return this.instance.createClient(...args);
  }

  updateClient(...args) {
    return this.instance.updateClient(...args);
  }

  deleteClient(...args) {
    return this.instance.deleteClient(...args);
  }
}

module.exports = ManagementClient;
