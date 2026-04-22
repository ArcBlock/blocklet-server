const debianWrapDockerfile = require('./debian-wrap-dockerfile');

// Define Dockerfile with dynamic UID/GID mapping
const dockerfile = debianWrapDockerfile('arcblock/blocklet-base:0.0.2');

module.exports = {
  dockerfile,
  image: 'debian_node_v4',
  shell: 'sh',
  network: '--network host',
  baseDir: '/var/lib/blocklet',
  installNodeModules: true,
  runBaseScript: true,
  pnpmStore: '/var/lib/blocklet/.pnpm-store',
  command: '',
  skipChown: true,
};
