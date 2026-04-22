const { AuthenticationClient: Auth0AuthenticationClient } = require('auth0');

class AuthenticationClient {
  constructor(options) {
    this.instance = new Auth0AuthenticationClient({
      domain: options.domain,
      clientId: options.clientId,
    });
  }

  getProfile(...args) {
    return this.instance.getProfile(...args);
  }
}

module.exports = AuthenticationClient;
