// https://github.com/jonschlinkert/isobject/blob/master/index.js
module.exports = (val) => val != null && typeof val === 'object' && Array.isArray(val) === false;
