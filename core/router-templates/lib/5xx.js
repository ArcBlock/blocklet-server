const common = require('./common');

module.exports = (nodeInfo) => common({ status: 500, title: 'Error', content: 'Something went wrong', nodeInfo });
