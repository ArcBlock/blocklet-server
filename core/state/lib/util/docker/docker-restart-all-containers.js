const promiseSpawn = require('@abtnode/util/lib/promise-spawn');

async function dockerRestartAllContainers() {
  const containerList = await promiseSpawn('docker ps -a --format {{.Names}}');
  const containerNames = containerList.split('\n').filter((v) => {
    const name = v.trim().replace(/^"|"$/g, '');
    return name.startsWith('blocklet-') || name.startsWith('docker-exec-chown-') || name.startsWith('docker-exec-');
  });

  if (containerNames.length === 0) {
    throw new Error('No containers to restart');
  }

  await promiseSpawn(`docker rm -f ${containerNames.join(' ')}`);
}

module.exports = dockerRestartAllContainers;
