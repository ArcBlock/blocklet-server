const { joinURL } = require('ufo');
const Client = require('@ocap/client');

// cache ocap clients for smaller memory consumption
/** @type {Map<string, import('@ocap/client')>} */
const clients = new Map();

/**
 * @description
 * @param {string} chainHost
 * @return {import('@ocap/client')}
 */
const getChainClient = (chainHost) => {
  const endpoint = joinURL(chainHost, '/');
  if (!clients.has(endpoint)) {
    const client = new Client(endpoint);
    clients.set(endpoint, client);
  }

  return clients.get(endpoint);
};

module.exports = {
  getChainClient,
};
