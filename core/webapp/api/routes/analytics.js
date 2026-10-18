const fs = require('fs-extra');
const { getHtmlResultPath } = require('@abtnode/analytics');

const mutateBlockletPermission = require('../middlewares/mutate-blocklet-permission');
const verifyBlockletScope = require('../middlewares/verify-blocklet-scope');

// For reading and updating blocklet preferences
module.exports = {
  init(app, node) {
    // 流量分析含访问者 IP / UA / referer，必须鉴权且限制为自己的应用
    const ensurePermission = mutateBlockletPermission(node);
    const ensureScope = verifyBlockletScope(req => req.query.did);

    app.get('/api/analytics/traffic', ensurePermission, ensureScope, async (req, res) => {
      const { did, date, theme } = req.query;
      const info = await node.states.node.read();
      const color = theme === 'dark' ? '#ffffff' : '#000000';
      if (did !== info.did) {
        const blocklet = await node.states.blocklet.getBlocklet(did);
        if (!blocklet) {
          return res.status(400).send(`<p style="color: ${color};">Blocklet not found</p>`);
        }

        if (blocklet.mode !== 'production') {
          return res
            .status(400)
            .send(`<p style="color: ${color};">Traffic analytics are only available for production blocklets</p>`);
        }
      }

      if (!date) {
        return res.status(400).send(`<p style="color: ${color};">Date is required to load traffic analytics</p>`);
      }

      const filePath = getHtmlResultPath(node.dataDirs.data, date, did);
      if (fs.existsSync(filePath) === false) {
        return res.status(400).send(`<p style="color: ${color};">Traffic insight for selected date not found</p>`);
      }

      return res.sendFile(filePath);
    });
  },
};
