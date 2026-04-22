const axios = require('@abtnode/util/lib/axios');
const { version } = require('../../package.json');

module.exports =
  process.env.NODE_ENV === 'test'
    ? axios
    : axios.create({
        timeout: 10 * 1000,
        headers: { 'User-Agent': `ABTNode/${version}`, 'x-blocklet-server-version': version },
      });
