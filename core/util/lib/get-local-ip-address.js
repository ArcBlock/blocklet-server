const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.keys(interfaces)) {
    for (const alias of interfaces[iface] || []) {
      // Filter out non-IPv4 or internal addresses
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  throw new Error('No local IP address found');
}

module.exports = getLocalIPAddress;
