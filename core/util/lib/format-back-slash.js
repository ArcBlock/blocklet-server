const replace = require('lodash/replace');
const escapeRegExp = require('lodash/escapeRegExp');

/**
 * Replace the back slack('\') with forward slash('/')
 * @param {*} str
 * @param {*} flag RegExp flag, default is 'g'
 * @returns
 */
module.exports = (str) => replace(str, new RegExp(escapeRegExp('\\'), 'g'), '/');
