module.exports = (port) => Number.isSafeInteger(port) && port >= 0 && port <= 65535;
