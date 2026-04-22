import OcapClient from '@ocap/client/dist/lite';

const clients = {};

export default function getChainClient(endpoint) {
  if (!endpoint) {
    return null;
  }

  if (clients[endpoint]) {
    return clients[endpoint];
  }

  const client = new OcapClient(endpoint);
  clients[endpoint] = client;
  return client;
}
