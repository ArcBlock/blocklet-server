const { getPassportStatus } = require('@abtnode/auth/lib/auth');
const { CustomError } = require('@blocklet/error');

module.exports = {
  init(router, node) {
    router.get('/api/passport/status', async (req, res) => {
      const { vcId, userDid, locale } = req.query;
      const nodeInfo = await node.getNodeInfo();
      const teamDid = nodeInfo.did;

      if (teamDid !== req.query.teamDid) {
        throw new CustomError(400, 'teamDid is invalid');
      }

      const status = await getPassportStatus({ node, teamDid, userDid, vcId, locale });

      res.json(status);
    });
  },
};
