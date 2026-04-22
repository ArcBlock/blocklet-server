const requestIp = require('request-ip');

const emptyIp = '';

const getRequestIP = (request) => {
  if (!request) {
    return emptyIp;
  }
  let clientIp = request?.clientIp;
  if (!clientIp) {
    clientIp = requestIp.getClientIp(request);
  }
  if (!clientIp) {
    clientIp = request.get?.('x-real-ip');
  }

  return clientIp || emptyIp;
};

module.exports = getRequestIP;
