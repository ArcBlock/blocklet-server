const { joinURL } = require('ufo');

const getBlockletUrl = (registryUrl, did) => joinURL(registryUrl, `/api/blocklets/${did}/blocklet.json`);

const getBaseUrl = req => {
  if (req.headers['x-path-prefix']) {
    return `/${req.headers['x-path-prefix']}/`.replace(/\/+/g, '/');
  }

  return '/';
};

module.exports = { getBlockletUrl, getBaseUrl };
