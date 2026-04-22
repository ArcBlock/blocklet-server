const dockerfile = `
# Base image
FROM debian:12


# Fix permissions for temporary files
RUN chmod 1777 /tmp

RUN mkdir /var/lib/blocklet
RUN chmod 1777 /var/lib/blocklet

# Set environment variables
ENV DOCKER_DATA=/var/lib/blocklet

# Set working directory
WORKDIR /var/lib/blocklet
    `.trim();

module.exports = {
  dockerfile,
  image: 'debian_chmod_v1',
  shell: 'sh',
  network: '--network host',
  baseDir: '/var/lib/blocklet',
  installNodeModules: true,
  runBaseScript: true,
  pnpmStore: '/var/lib/blocklet/.pnpm-store',
  command: '',
  skipChown: false,
};
