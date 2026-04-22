module.exports = (blocklet) => {
  // NOTICE: 减少一个 lib 引入，这里直接使用 /.well-known/service
  return `<img src="/.well-known/service/blocklet/logo?version=${blocklet?.meta?.version || ''}" />`;
};
