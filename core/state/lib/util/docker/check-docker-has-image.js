const promiseSpawn = require('@abtnode/util/lib/promise-spawn');

const cache = {};

async function checkDockerHasImage(input) {
  const name = input.replace(':latest', '');
  if (cache[name] === true) {
    return true;
  }
  try {
    const result = await promiseSpawn('docker image ls --format "{{.Repository}}:{{.Tag}}"');

    const images = result.split('\n').map((image) => image.trim().replace(/"/g, ''));
    const imageExists = images.some((image) => image.replace(':latest', '') === name);
    if (imageExists) {
      cache[name] = true;
    }
    return imageExists;
  } catch (error) {
    return false;
  }
}

module.exports = {
  checkDockerHasImage,
};
