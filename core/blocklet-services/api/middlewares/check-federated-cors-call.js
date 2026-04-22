function checkFederatedCorsCall() {
  return (req, res, next) => {
    const caller = req.headers.origin;
    const { blocklet } = req;
    const federated = blocklet.settings.federated || {};
    const sites = federated?.sites || [];
    const memberEnabled = sites.find((item) => {
      if (item.status === 'approved') {
        const siteHost = new URL(item.appUrl).hostname;
        const callerHost = new URL(caller).hostname;
        return [siteHost, ...(item.aliasDomain || [])].includes(callerHost);
      }
      return false;
    });
    if (memberEnabled) {
      next();
      return;
    }
    res.status(403).send('Unauthorized');
  };
}

module.exports = checkFederatedCorsCall;
