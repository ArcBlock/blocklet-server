module.exports = {
  options: {},
  name: 'echo',
  module: {
    name: 'echo',
    version: '0.1.0',
    init: ({ serviceHttpRouter }) => {
      serviceHttpRouter.get('/context', (req, res) => {
        const data = req.getServiceContext();
        res.json(data);
      });

      serviceHttpRouter.get('/config', async (req, res) => {
        const serviceConfig = await req.getServiceConfig();
        res.json(serviceConfig);
      });

      serviceHttpRouter.get('/blocklet', async (req, res) => {
        const data = await req.getBlocklet();
        res.json(data);
      });
    },
  },
};
