const slugify = require('slugify');

const formatName = (name) => slugify((name || '').replace(/^[@./-]/, '').replace(/[@./_]/g, '-'));

module.exports = formatName;
