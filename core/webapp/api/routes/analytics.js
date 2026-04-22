const fs = require('fs-extra');
const { getHtmlResultPath } = require('@abtnode/analytics');

// For reading and updating blocklet preferences
module.exports = {
  init(app, node) {
    // FIXME: how do we protect this
    app.get('/api/analytics/traffic', async (req, res) => {
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
