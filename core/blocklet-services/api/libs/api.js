const { default: axios } = require('axios');

const api = axios.create({
  timeout: 10 * 1000,
});

module.exports = { api };
