module.exports = {
  init(app, node) {
    app.get('/api/health/notification', async (req, res) => {
      const info = await node.getNodeInfo();
      const { since } = req.query;
      const result = await node.getNotificationStats({ teamDid: info.did, since });
      res.json(result);
    });
  },
};
