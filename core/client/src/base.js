/* eslint-disable no-underscore-dangle */
const BaseClient = require('@arcblock/sdk-util');
const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(timezone);

const schema = require('./schema/graphql.json');

/**
 * Provides a readonly client to forge
 * Its recommended to use this version in browser to get smaller bundle size
 *
 * @class ABTNodeClient
 * @extends {BaseClient}
 */
class ABTNodeClient extends BaseClient {
  constructor(httpEndpoint = 'http://localhost:4000/api', userAgent = '') {
    const config = {
      dataSource: 'forge',
      httpEndpoint,
      socketEndpoint: () => this._getSocketEndpoint(httpEndpoint),
      enableQuery: true,
      enableSubscription: true,
      enableMutation: true,
      maxQueryDepth: 6,
    };

    super(config);

    this._endpoint = httpEndpoint;
    this._authToken = null;
    this._userAgent = userAgent;
  }

  setAuthToken(token) {
    this._authToken = token;
  }

  _getSocketEndpoint(endpoint) {
    let socketEndpoint = endpoint.replace(/https?:\/\//, 'ws://');
    if (endpoint.indexOf('https://') === 0) {
      socketEndpoint = socketEndpoint.replace('ws://', 'wss://');
    }

    return `${socketEndpoint}/socket`;
  }

  _getSchema() {
    return schema;
  }

  // eslint-disable-next-line
  _getIgnoreFields({ name }) {
    return [];
  }

  // eslint-disable-next-line require-await
  async _getAuthHeaders() {
    const headers = {};
    const token = this._authToken;
    if (token) {
      const val = typeof token === 'function' ? token() : token;
      headers.Authorization = `Bearer ${encodeURIComponent(val)}`;
    }

    // eslint-disable-next-line no-undef
    if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
      const { hostname, port, protocol } = window.location; // eslint-disable-line no-undef
      headers['x-real-hostname'] = hostname;
      headers['x-real-port'] = port;
      headers['x-real-protocol'] = protocol.endsWith(':') ? protocol.substring(0, protocol.length - 1) : protocol;
    }

    if (this._userAgent) {
      headers['User-Agent'] = this._userAgent;
    }

    // detect and attach timezone
    headers['x-timezone'] = dayjs.tz.guess();

    return headers;
  }
}

module.exports = ABTNodeClient;
