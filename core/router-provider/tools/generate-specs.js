const path = require('path');
const { generateTestSuites } = require('./fixture');
const data = require('./mock-gateway');

generateTestSuites(path.join(__dirname, '../tests/gateway.spec.js'), data);
