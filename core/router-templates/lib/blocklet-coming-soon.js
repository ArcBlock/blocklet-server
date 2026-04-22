const getCommonTemplate = require('./common');
const getIcon = require('./util/get-icon');

module.exports = (blocklet, nodeInfo, adminURL) => {
  let content = '<p style="color: #121212">We\'re getting everything ready for you. This won\'t take long!</p>';
  if (adminURL) {
    content = `${content} <p style="color: #121212">Site owner? <a href="${
      adminURL || '#'
    }" alt="sign in">Sign in to get started</a> and launch your application.</p>`;
  }

  return getCommonTemplate({
    title: 'Your Application is Coming Soon!',
    icon: getIcon(blocklet),
    appName: blocklet?.meta?.title,
    pageTitle: `${blocklet?.meta?.title}`,
    content,
    extra: `<p style="color:#999;font-size:0.875rem;font-family: Arial;text-align:center">
      Powered by <a href="https://www.arcblock.io" target="_blank">ArcBlock</a>'s <a href="https://www.blocklet.io" target="_blank">Blocklet Technology</a>, the decentralized web engine.
    </p>`,
    nodeInfo,
  });
};
