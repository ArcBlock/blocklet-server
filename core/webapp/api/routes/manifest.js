module.exports = {
  init(app, node) {
    app.get('/manifest.json', async (req, res) => {
      const nodeInfo = await node.getNodeInfo({ useCache: true });
      const name = nodeInfo.name || 'Blocklet Server';
      const description = nodeInfo.description || 'Blocklet Server';
      res.json({
        name,
        short_name: name,
        description,
        start_url: './dashboard',
        display: 'standalone',
        theme_color: '#000000',
        background_color: '#ffffff',
        icons: [
          {
            src: './images/node-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: './images/node-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      });
    });
  },
};
