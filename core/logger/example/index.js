process.env.NODE_ENV = 'development';

const getLogger = require('../lib/logger');

process.env.NODE_ENV = 'production';

const logger = getLogger('example', { logDir: './logs' });

const id = 'test-id';
logger.error('this is an error', id);
logger.info('hello', { id });
