const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { attachHandlers } = require('@did-connect/relay-adapter-express');
const initConnectRelay = require('../../libs/connect/v2');

module.exports = {
  init(router, node, opts, wsRouter) {
    const { handlers } = initConnectRelay(node, opts);
    const prefix = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/connect/relay`;

    // attach http handlers
    attachHandlers(router, handlers, prefix);

    // attach ws handlers
    wsRouter.use(`${prefix}/websocket`, handlers.wsServer.onConnect.bind(handlers.wsServer));
  },
};
