/* eslint-disable consistent-return */
const fs = require('fs-extra');
const { getHtmlResultPath } = require('@abtnode/analytics');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');

module.exports = {
  init({ app, node }) {
    app.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/analytics/traffic`, async (req, res) => {
      const { date, theme } = req.query;
      const color = theme === 'dark' ? '#ffffff' : '#000000';
      if (!req.user) {
        return res.status(403).send('You are not allowed to view this page');
      }

      const blocklet = await req.getBlocklet();
      if (!blocklet) {
        return res.status(400).send(`<p style="color: ${color};">Blocklet not found</p>`);
      }

      if (blocklet.mode !== 'production') {
        return res
          .status(400)
          .send(`<p style="color: ${color};">Traffic analytics are only available for production blocklets</p>`);
      }

      if (!date) {
        return res.status(400).send(`<p style="color: ${color};">Date is required to load traffic analytics</p>`);
      }

      const filePath = getHtmlResultPath(node.dataDirs.data, date, blocklet.appPid);
      if (fs.existsSync(filePath) === false) {
        return res.status(400).send(`<p style="color: ${color};">Traffic insight for selected date not found</p>`);
      }

      return res.sendFile(filePath);
    });
  },
};
