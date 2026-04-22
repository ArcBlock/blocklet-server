const { WELLKNOWN_BLACKLIST_PREFIX } = require('@abtnode/constant');

module.exports = {
  init(app, node) {
    app.get(WELLKNOWN_BLACKLIST_PREFIX, async (req, res) => {
      const blacklist = await node.getGatewayBlacklist(req.query.type || 'both');
      res.send(blacklist.join('\n'));
    });
  },
};
