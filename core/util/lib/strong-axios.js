const { default: axios } = require('axios');
const http = require('http');
const https = require('https');
const dns = require('dns');
const net = require('net');
const debug = require('debug')('@abtnode/util:strong-axios');

const getAgent = (type) => {
  const agent = { http, https }[type].Agent();

  const checkConnection = (ip, port) =>
    new Promise((resolve) => {
      const socket = net.createConnection(port, ip);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => resolve(false));

      setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, 10 * 1000);
    });

  agent.originCreateConnection = agent.createConnection;

  agent.createConnection = (options, callback) => {
    if (!options.lookup) {
      options.lookup = (hostname, opts, cb) => {
        debug(`Lookup ip from ${hostname}`);
        dns.lookup(hostname, Object.assign(opts, { all: true }), async (err, hosts) => {
          if (err) return cb(err);

          let host = null;

          for (let i = 0; i < hosts.length; i++) {
            host = hosts[i];
            // eslint-disable-next-line no-await-in-loop
            const valid = await checkConnection(host.address, options.port);
            if (valid) {
              debug(`Ip ${host.address} is valid`);
              break;
            }
            debug(`Ip ${host.address} is not valid`);
          }

          debug(`Use ip ${host.address}`);
          return cb(null, host.address, host.family);
        });
      };
    }
    return agent.originCreateConnection(options, callback);
  };

  return agent;
};

module.exports = axios.create({
  proxy: false,
  httpAgent: getAgent('http'),
  httpsAgent: getAgent('https'),
});
