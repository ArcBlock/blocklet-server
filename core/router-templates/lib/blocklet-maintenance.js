const getCommonTemplate = require('./common');
const getIcon = require('./util/get-icon');

const getBlockletMaintenanceTemplate = (blocklet, nodeInfo, adminURL) => {
  let content = '<p style="color: #121212">Thanks for your patience. Please check back soon.</p>';
  if (adminURL) {
    content = `${content} <p style="color: #121212"> If you're the <span style="font-weight:bold">site owner</span>, <a href="${
      adminURL || '#'
    }" alt="log in">log in</a> to launch this site.<p>`;
  }

  return getCommonTemplate({
    title: 'Something Awesome is Coming!',
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

module.exports = { getBlockletMaintenanceTemplate };
