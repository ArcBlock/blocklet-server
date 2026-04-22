import { TComponentInternalInfo } from '@blocklet/meta/lib/blocklet';

type MountPoint = TComponentInternalInfo & {
  webEndpoint?: string;
  isGreen?: boolean;
};

function parseDockerHost(input: string) {
  return input
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/^"|"$/g, '')
    .replace('docker-network-', 'blocklet-')
    .replace(/\\/g, '_')
    .toLocaleLowerCase();
}

export function parseDockerComponentHost(component: MountPoint) {
  if (process.env.BLOCKLET_DOCKER_NETWORK && process.env.BLOCKLET_DOCKER_NETWORK !== 'host') {
    return parseDockerHost(
      `${process.env.BLOCKLET_DOCKER_NETWORK}-${component.name || component.did}${component.isGreen ? '-green' : ''}`
    );
  }
  return '127.0.0.1';
}

export function parseDockerComponentEndpoint(endpoint: string, component: MountPoint) {
  if (endpoint && process.env.BLOCKLET_DOCKER_NETWORK && process.env.BLOCKLET_DOCKER_NETWORK !== 'host') {
    try {
      const url = new URL(endpoint);
      url.host = parseDockerHost(
        `${process.env.BLOCKLET_DOCKER_NETWORK}-${component.name || component.did}${component.isGreen ? '-green' : ''}`
      );
      if (component.containerPort) {
        url.port = component.containerPort;
      }
      return url.toString();
    } catch (error) {
      return endpoint;
    }
  }
  return endpoint;
}

export function getServerHost() {
  return process.env.BLOCKLET_HOST || '127.0.0.1';
}
