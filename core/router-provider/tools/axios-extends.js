const { default: axios } = require('axios');
const http = require('http');
const https = require('https');

const getAgent = (agent, options) => {
  const originCreateConnection = agent.createConnection.bind(agent);

  agent.createConnection = (opt, callback) => {
    opt.lookup = options.lookup || opt.lookup;
    return originCreateConnection(opt, callback);
  };

  return agent;
};

// eslint-disable-next-line no-unused-vars
const lookup = (hostname, opts, cb) => cb(null, '127.0.0.1', 4);

module.exports = (options) =>
  axios.create({
    httpAgent: getAgent(new http.Agent({ keepAlive: true }), { lookup }),
    httpsAgent: getAgent(new https.Agent({ keepAlive: true, rejectUnauthorized: false }), { lookup }),
    ...(options || {}),
  });
