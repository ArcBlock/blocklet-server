module.exports = {
  options: {},
  name: 'attach-user',
  module: {
    name: 'attach-user',
    version: '0.1.0',
    init: ({ serviceHttpRouter }) => {
      serviceHttpRouter.use((req, res, next) => {
        req.attached = {};

        const header = req.headers['x-user'];
        if (header) {
          req.attached.user = header;
        }

        next();
      });
    },
  },
};
