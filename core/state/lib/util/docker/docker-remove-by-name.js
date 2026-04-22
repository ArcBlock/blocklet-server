const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
const { checkDockerInstalled } = require('./check-docker-installed');
const parseDockerName = require('./parse-docker-name');

async function dockerRemoveByName(name) {
  const isDockerInstalled = await checkDockerInstalled();
  if (!isDockerInstalled) {
    return;
  }
  const containerName = parseDockerName(name, 'blocklet');
  // const checkContainer = await promiseSpawn(`docker ps -q -f name=${containerName}`);
  // if (checkContainer) {   // }
  try {
    await promiseSpawn(`docker rm -fv ${containerName} > /dev/null 2>&1 || true`);
  } catch (_) {
    //
  }
}

module.exports = dockerRemoveByName;
