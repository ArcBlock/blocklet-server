const common = require('./common');

module.exports = (nodeInfo) =>
  common({
    status: 404,
    pageTitle: '404 - Page not found',
    title: '404 - Page not found',
    content: "We can't find the page that you're looking for.",
    nodeInfo,
    refreshButton: false,
  });
