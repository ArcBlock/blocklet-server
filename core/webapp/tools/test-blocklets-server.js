const path = require('path');
const staticServer = require('../../state/tools/static-server');

staticServer({ root: path.join(__dirname, './test-blocklets') });
