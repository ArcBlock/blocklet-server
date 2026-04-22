const shell = require('shelljs');

function print(...args) {
  shell.echo.apply(null, args);
}

module.exports = {
  print,
};
