const getDidConnectVersion = (req) => {
  return (req?.headers || {})['x-did-connect-version'];
};

module.exports = {
  getDidConnectVersion,
};
