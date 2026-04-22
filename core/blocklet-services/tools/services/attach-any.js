module.exports = {
  options: {},
  name: 'attach-any',
  module: {
    name: 'attach-any',
    version: '0.1.0',
    init: ({ serviceHttpRouter }) => {
      serviceHttpRouter.get('/', (req, res) => {
        const key = req.headers['x-attach-key'];
        const value = req.headers['x-attach-value'];
        if (key && value) {
          req.attached[key] = value;
        }

        res.json(req.attached);
      });
    },
  },
};
