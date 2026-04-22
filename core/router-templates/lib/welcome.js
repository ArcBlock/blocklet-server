const common = require('./common');

module.exports = (nodeInfo = {}) => {
  const title = '<p style="color:#20c8ce;margin:0;">Congratulations!</p>';
  return common({
    pageTitle: 'Welcome - Blocklet Server',
    title,
    content: 'Your Blocklet Server is up and running!',
    nodeInfo,
    exclusiveExtra: false,
    extra: `<p style="color:#999;font-size:0.875rem;font-family: Arial;text-align:center;margin-top:48px;">
      Powered by <a href="https://www.arcblock.io" target="_blank">ArcBlock</a>'s <a href="https://www.blocklet.io" target="_blank">Blocklet Technology</a>, the decentralized web engine.
    </p>`,
  });
};
