const promiseSpawn = require('./promise-spawn');

async function ensureDockerEndpointHealthy({ host, port, timeout = 10 * 1000 }) {
  const checkWget = await promiseSpawn(`docker exec ${host} sh -c "command -v wget || echo 'no-wget'"`, timeout);

  if (checkWget.trim() === 'no-wget') {
    // detect the container OS type and install wget
    await promiseSpawn(
      `docker exec ${host} sh -c "if [ -f /etc/os-release ]; then . /etc/os-release && (echo $ID | grep -q 'alpine' && apk add --no-cache wget || (echo $ID | grep -q 'debian' && apt-get update && apt-get install -y wget) || (echo $ID | grep -q 'centos' && yum install -y wget)); else echo 'Unsupported OS'; fi"`,
      timeout
    );
  }

  // use wget to check port health status
  const res = await promiseSpawn(`docker exec ${host} wget --spider http://${host}:${port}`, timeout);
  if (!res.includes('connected') && !res.includes('200 OK')) {
    throw new Error(`Docker endpoint ${host}:${port} is not healthy`);
  }
}

module.exports = ensureDockerEndpointHealthy;
